import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { CreateApplicantJobStepDto } from "./dto/create-applicant_job_step.dto";
import { UpdateApplicantJobStepDto } from "./dto/update-applicant_job_step.dto";
import {
  JobsStepsStatus,
  ApplicantJobStep,
} from "./entities/applicant_job_step.entity";
import { BasePagination } from "src/base.pagination";
import { JobStep, JobStepType } from "src/job_steps/entities/job_step.entity";
import {
  Applicant,
  ApplicantStatus,
} from "src/applicants/entities/applicant.entity";
import { NotificationService } from "src/users/notification.service";
import { MailjetService } from "src/users/mailjet.service";
import { LoggingService } from "src/logs/logs.service";
import * as moment from "moment-timezone";

import { CompanyRole, User } from "src/users/entities/user.entity";

interface SearchApplicantJobStepsParams {
  id?: string;
  applicantId?: string;
  jobStepId?: string;
  status?: JobsStepsStatus;
  notes?: string;
  attributes?: any;
  createdAt?: {
    start?: Date;
    end?: Date;
  };
  createdBy?: string;
  updatedAt?: {
    start?: Date;
    end?: Date;
  };
  updatedBy?: string;
  deletedAt?: {
    start?: Date;
    end?: Date;
  };
  page?: number;
  limit?: number;
}

@Injectable()
export class ApplicantJobStepsService {
  constructor(
    @InjectRepository(ApplicantJobStep)
    private applicantJobStepRepository: Repository<ApplicantJobStep>,
    @InjectRepository(JobStep)
    private jobStepRepository: Repository<JobStep>,
    @InjectRepository(Applicant)
    private applicantRepository: Repository<Applicant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private mailjetService: MailjetService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Convert interview_date_time to UTC format
   * @param dateTimeString - The date time string to convert
   * @returns UTC formatted date time string
   */
  private convertToUTC(dateTimeString: string): string {
    try {
      // Parse the date and convert to UTC
      const utcDateTime = moment(dateTimeString).utc();

      if (!utcDateTime.isValid()) {
        throw new Error(`Invalid date format: ${dateTimeString}`);
      }

      // Return in ISO format (UTC)
      return utcDateTime.toISOString();
    } catch (error) {
      this.logger.error(
        `Error converting date to UTC: ${dateTimeString}`,
        "applicant-job-steps",
        error instanceof Error ? error.stack : undefined,
      );
      return dateTimeString;
    }
  }

  /**
   * Validates and processes job step and user references
   * @param dto - The DTO containing job_step_id and user_id
   * @param applicantJobStep - The entity to update with validated data
   */
  private async validateAndProcessReferences(
    dto: CreateApplicantJobStepDto | UpdateApplicantJobStepDto,
    applicantJobStep: ApplicantJobStep,
  ): Promise<void> {
    if (dto.attributes && typeof dto.attributes === "string") {
      try {
        dto.attributes = JSON.parse(dto.attributes);
      } catch {
        throw new Error("Invalid JSON string in attributes");
      }
    }
    // Validate and process job_step_id
    if (dto.job_step_id) {
      const jobStep = await this.jobStepRepository.findOne({
        where: { id: dto.job_step_id },
      });
      if (!jobStep) {
        throw new NotFoundException(
          `JobStep with ID ${dto.job_step_id} not found`,
        );
      }
      applicantJobStep.job_id = jobStep.job_id;
    }

    // Validate and process user_id
    if (dto.applicant_id) {
      const applicant = await this.applicantRepository.findOne({
        where: { id: dto.applicant_id },
      });
      if (!applicant) {
        throw new NotFoundException(
          `Applicant with ID ${dto.applicant_id} not found`,
        );
      }
      applicantJobStep.user_id = applicant.user_id;
    }
  }

  private async setLastApplicantJobStep(
    applicantJobStep: ApplicantJobStep,
  ): Promise<void> {
    const updatedApplicant = await this.applicantRepository.findOne({
      where: { id: applicantJobStep.applicant_id },
    });

    if (applicantJobStep.status == JobsStepsStatus.ACCEPTED) {
      // Get the current job step to find its order
      const currentJobStep = await this.jobStepRepository.findOne({
        where: { id: applicantJobStep.job_step_id },
      });

      if (currentJobStep && currentJobStep.type !== JobStepType.SYS_HIRED) {
        // Find the next job step based on step_order, skipping those with status ACCEPTED
        let nextStepOrder = currentJobStep.step_order + 1;
        let nextApplicantJobStep: ApplicantJobStep | null = null;
        let nextJobStep: JobStep | null = null;
        let notfoundCounter = 0;

        while (true) {
          nextJobStep = await this.jobStepRepository.findOne({
            where: {
              job_id: applicantJobStep.job_id,
              step_order: nextStepOrder,
            },
          });

          if (!nextJobStep) {
            notfoundCounter++;
            if (notfoundCounter > 5) {
              nextJobStep = await this.jobStepRepository.findOne({
                where: {
                  job_id: applicantJobStep.job_id,
                  type: JobStepType.SYS_HIRED,
                },
              });
            } else {
              nextStepOrder++;
              continue;
            }
          }

          nextApplicantJobStep =
            await this.applicantJobStepRepository.findOneBy({
              applicant_id: applicantJobStep.applicant_id,
              job_step_id: nextJobStep.id,
              job_id: applicantJobStep.job_id,
            });

          if (
            nextApplicantJobStep &&
            nextApplicantJobStep.status !== JobsStepsStatus.ACCEPTED
          ) {
            // Ditemukan next job step yang status-nya BUKAN ACCEPTED
            nextApplicantJobStep.status = JobsStepsStatus.CURRENT;
            const savedNextStep =
              await this.applicantJobStepRepository.save(nextApplicantJobStep);

            await this.applicantRepository.update(
              { id: applicantJobStep.applicant_id },
              { last_applicant_job_step_id: savedNextStep.id },
            );

            this.sendNotification(savedNextStep, updatedApplicant);
            break;
          }

          // Jika status ACCEPTED, lanjut ke step berikutnya
          nextStepOrder++;
        }
      }
    }

    if (
      [JobsStepsStatus.ACCEPTED, JobsStepsStatus.FAILED].includes(
        applicantJobStep.status,
      )
    ) {
      const jobStep = await this.jobStepRepository.findOne({
        where: { id: applicantJobStep.job_step_id },
      });
      if (jobStep && jobStep.type === JobStepType.SYS_HIRED) {
        await this.applicantRepository.update(
          { id: applicantJobStep.applicant_id },
          {
            status:
              applicantJobStep.status == JobsStepsStatus.ACCEPTED
                ? ApplicantStatus.ACCEPTED
                : ApplicantStatus.REJECTED,
          },
        );
      }
    }

    this.sendNotification(applicantJobStep, updatedApplicant);
  }

  async create(
    createApplicantJobStepDto: CreateApplicantJobStepDto,
  ): Promise<ApplicantJobStep> {
    const applicantJobStep = this.applicantJobStepRepository.create(
      createApplicantJobStepDto,
    );

    // Use the reusable validation function
    await this.validateAndProcessReferences(
      createApplicantJobStepDto,
      applicantJobStep,
    );

    // Convert interview_date_time to UTC if present
    if (applicantJobStep.attributes?.interview_date_time) {
      applicantJobStep.attributes.interview_date_time = this.convertToUTC(
        applicantJobStep.attributes.interview_date_time,
      );
    }

    const newApplicantJobStep =
      await this.applicantJobStepRepository.save(applicantJobStep);

    await this.setLastApplicantJobStep(newApplicantJobStep);

    return newApplicantJobStep;
  }

  async update(
    id: string,
    updateApplicantJobStepDto: UpdateApplicantJobStepDto,
  ): Promise<ApplicantJobStep> {
    const applicantJobStep = await this.applicantJobStepRepository.findOne({
      where: { id },
    });

    if (!applicantJobStep) {
      throw new NotFoundException(`ApplicantJobStep with ID ${id} not found`);
    }

    // Use the reusable validation function
    await this.validateAndProcessReferences(
      updateApplicantJobStepDto,
      applicantJobStep,
    );

    // Apply other updates
    Object.assign(applicantJobStep, updateApplicantJobStepDto);

    // Convert interview_date_time to UTC if present
    if (applicantJobStep.attributes?.interview_date_time) {
      applicantJobStep.attributes.interview_date_time = this.convertToUTC(
        applicantJobStep.attributes.interview_date_time,
      );
    }

    const updatedApplicantJobStep =
      await this.applicantJobStepRepository.save(applicantJobStep);

    await this.setLastApplicantJobStep(updatedApplicantJobStep);

    return updatedApplicantJobStep;
  }

  async remove(id: string): Promise<void> {
    const result = await this.applicantJobStepRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ApplicantJobStep with ID ${id} not found`);
    }
  }

  async search(
    params: SearchApplicantJobStepsParams,
  ): Promise<BasePagination<ApplicantJobStep>> {
    const {
      id,
      applicantId,
      jobStepId,
      status,
      notes,
      attributes,
      createdAt,
      createdBy,
      updatedAt,
      updatedBy,
      deletedAt,
      page = 1,
      limit = 10,
    } = params;

    const query =
      this.applicantJobStepRepository.createQueryBuilder("applicant_job_step");

    // Add conditions based on provided parameters
    if (id) {
      query.andWhere("applicant_job_step.id = :id", { id });
    }

    if (applicantId) {
      query.andWhere("applicant_job_step.applicant_id = :applicantId", {
        applicantId,
      });
    }

    if (jobStepId) {
      query.andWhere("applicant_job_step.job_step_id = :jobStepId", {
        jobStepId,
      });
    }

    if (status) {
      query.andWhere("applicant_job_step.status = :status", { status });
    }

    if (notes) {
      query.andWhere("applicant_job_step.notes ILIKE :notes", {
        notes: `%${notes}%`,
      });
    }

    if (attributes) {
      query.andWhere("applicant_job_step.attributes = :attributes", {
        attributes,
      });
    }

    if (createdAt?.start && createdAt?.end) {
      query.andWhere("applicant_job_step.created_at BETWEEN :start AND :end", {
        start: createdAt.start,
        end: createdAt.end,
      });
    } else if (createdAt?.start) {
      query.andWhere("applicant_job_step.created_at >= :start", {
        start: createdAt.start,
      });
    } else if (createdAt?.end) {
      query.andWhere("applicant_job_step.created_at <= :end", {
        end: createdAt.end,
      });
    }

    if (createdBy) {
      query.andWhere("applicant_job_step.created_by = :createdBy", {
        createdBy,
      });
    }

    if (updatedAt?.start && updatedAt?.end) {
      query.andWhere("applicant_job_step.updated_at BETWEEN :start AND :end", {
        start: updatedAt.start,
        end: updatedAt.end,
      });
    } else if (updatedAt?.start) {
      query.andWhere("applicant_job_step.updated_at >= :start", {
        start: updatedAt.start,
      });
    } else if (updatedAt?.end) {
      query.andWhere("applicant_job_step.updated_at <= :end", {
        end: updatedAt.end,
      });
    }

    if (updatedBy) {
      query.andWhere("applicant_job_step.updated_by = :updatedBy", {
        updatedBy,
      });
    }

    if (deletedAt?.start && deletedAt?.end) {
      query.andWhere("applicant_job_step.deleted_at BETWEEN :start AND :end", {
        start: deletedAt.start,
        end: deletedAt.end,
      });
    } else if (deletedAt?.start) {
      query.andWhere("applicant_job_step.deleted_at >= :start", {
        start: deletedAt.start,
      });
    } else if (deletedAt?.end) {
      query.andWhere("applicant_job_step.deleted_at <= :end", {
        end: deletedAt.end,
      });
    }

    // Add pagination
    query.skip((page - 1) * limit).take(limit);

    // Add ordering
    query.orderBy("applicant_job_step.created_at", "DESC");

    // Execute query and return results with total count
    const [items, total] = await query.getManyAndCount();

    // Wrap with BasePagination
    const paginationResult = new BasePagination<ApplicantJobStep>();
    paginationResult.items = items;
    paginationResult.meta = {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };

    return paginationResult;
  }

  async sendNotification(
    result: ApplicantJobStep,
    updatedApplicant: Applicant,
  ) {
    const applicantJobStep = await this.applicantJobStepRepository.findOne({
      where: { id: result.id },
      relations: ["jobStep"],
    });

    const jobStep = applicantJobStep.jobStep;

    const applicant = await this.applicantRepository.findOne({
      where: { id: updatedApplicant.id },
      relations: ["user", "job", "job.company"],
    });

    const [candidate, job, company] = [
      applicant.user,
      applicant.job,
      applicant.job.company,
    ];

    switch (jobStep.type) {
      case JobStepType.SYS_SHORTLIST:
        switch (result.status) {
          case JobsStepsStatus.ACCEPTED:
            this.notificationService.sendShortlistAcceptedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendShortlistAccepted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
          case JobsStepsStatus.FAILED:
            this.notificationService.sendHiredNotificationRejectedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationRejected(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
        }
        break;
      case JobStepType.QUESTIONNAIRE:
        switch (result.status) {
          case JobsStepsStatus.CURRENT:
            this.notificationService.sendViewQuestionnaireNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendViewQuestionnaire(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}`,
            );
            break;
          case JobsStepsStatus.SUBMITTED:
            this.notificationService.sendQuestionnaireSubmittedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendQuestionnaireSubmitted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
          case JobsStepsStatus.ACCEPTED:
            this.notificationService.sendQuestionnaireAcceptedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendQuestionnaireAccepted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
          case JobsStepsStatus.REVISED:
            this.notificationService.sendQuestionnaireNeedsRevisionNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendQuestionnaireNeedsRevision(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
            );
            break;
          case JobsStepsStatus.FAILED:
            this.notificationService.sendHiredNotificationRejectedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationRejected(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
        }
        break;
      case JobStepType.TEST_PSYCHO:
        switch (result.status) {
          case JobsStepsStatus.CURRENT:
            this.notificationService.sendViewTestPsychoNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendViewTestPsycho(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
            );
            break;
          case JobsStepsStatus.SUBMITTED:
            this.notificationService.sendTestPsychoSubmittedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendTestPsychoSubmitted(
              candidate.email,
              candidate.full_name,
              job.title,
            );
            break;
          case JobsStepsStatus.ACCEPTED:
            this.notificationService.sendTestPsychoAcceptedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendTestPsychoAccepted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
          case JobsStepsStatus.REVISED:
            this.notificationService.sendTestPsychoNeedsRevisionNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendTestPsychoNeedsRevision(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
            );
            break;
          case JobsStepsStatus.FAILED:
            this.notificationService.sendHiredNotificationRejectedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationRejected(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
        }
        break;

      case JobStepType.DETAIL_FULFILLMENT:
        switch (result.status) {
          case JobsStepsStatus.CURRENT:
            this.notificationService.sendViewDataFulfillmentNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendViewDataFulfillment(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
            );
            break;
          case JobsStepsStatus.SUBMITTED:
            this.notificationService.sendDataFulfillmentSubmittedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendDataFulfillmentSubmitted(
              candidate.email,
              candidate.full_name,
              job.title,
            );
            break;
          case JobsStepsStatus.ACCEPTED:
            this.notificationService.sendDataFulfillmentAcceptedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendDataFulfillmentAccepted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
          case JobsStepsStatus.REVISED:
            this.notificationService.sendDataFulfillmentNeedsRevisionNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendDataFulfillmentNeedsRevision(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
            );
            break;
          case JobsStepsStatus.FAILED:
            this.notificationService.sendHiredNotificationRejectedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationRejected(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
        }
        break;
      case JobStepType.INTERVIEW:
        const employers = await this.userRepository.find({
          where: {
            company_id: company.id,
            company_role: In([CompanyRole.OWNER, CompanyRole.HRD]),
            deleted_at: null,
          },
        });
        const dbccEmails = [];
        if (result.attributes?.pic_email) {
          dbccEmails.push(result.attributes.pic_email);
        }
        if (result.attributes?.interviewer_list) {
          result.attributes.interviewer_list.forEach((interviewer) => {
            if (interviewer.email) {
              dbccEmails.push(interviewer.email);
            }
          });
        }

        // Filter out null/undefined emails and remove duplicates
        const bccEmails = [...new Set(dbccEmails.filter((email) => email))];

        switch (result.status) {
          case JobsStepsStatus.CURRENT:
            // Send notification to each employer
            const dbccCurrentEmails = [];

            this.logger.debug(`Sending interview set schedule to employers (count: ${employers?.length ?? 0})`, "applicant-job-steps");
            for (const employer of employers) {
              this.notificationService.sendInterviewSetScheduleEmployerNotification(
                jobStep.step_name,
                employer,
                candidate,
                job,
                company,
              );
              dbccCurrentEmails.push(employer.email);
            }
            const currentBccEmails = [
              ...new Set(dbccCurrentEmails.filter((email) => email)),
            ];

            this.mailjetService.sendInterviewSetScheduleEmployer(
              currentBccEmails,
              candidate.full_name,
              job.title,
              company.company_name,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
            );
            break;
          case JobsStepsStatus.SCHEDULED:
            if (result.attributes.reschedule_request) {
              if (result.attributes.reschedule_request == "ACCEPTED") {
                if (
                  ["offline", "OFFLINE"].includes(
                    result.attributes.interview_type,
                  )
                ) {
                  this.notificationService.sendInterviewRescheduleApprovedOfflineNotification(
                    candidate,
                    job,
                    company,
                    result.attributes.reschedule_request_notes_from_candidate,
                  );
                  this.mailjetService.sendInterviewRescheduleApprovedOffline(
                    candidate.email,
                    candidate.full_name,
                    job.title,
                    company.company_name,
                    result.attributes.interview_date_time,
                    result.attributes.offline_address,
                    result.attributes.offline_country,
                    result.attributes.offline_city,
                    result.attributes.offline_postal_code,
                    result.attributes.link_offline,
                    result.attributes.notes_applicant_interview,
                    `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                    bccEmails,
                  );
                } else {
                  this.notificationService.sendInterviewRescheduleApprovedOnlineNotification(
                    candidate,
                    job,
                    company,
                    result.attributes.reschedule_request_notes_from_candidate,
                  );
                  this.mailjetService.sendInterviewRescheduleApprovedOnline(
                    candidate.email,
                    candidate.full_name,
                    job.title,
                    company.company_name,
                    result.attributes.interview_date_time,
                    result.attributes.link_online,
                    result.attributes.notes_applicant_interview,
                    `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                    bccEmails,
                  );
                }
              }
              if (result.attributes.reschedule_request == "REJECTED") {
                this.notificationService.sendInterviewRescheduleRejectedNotification(
                  candidate,
                  job,
                  company,
                );
                this.mailjetService.sendInterviewRescheduleRejected(
                  candidate.email,
                  candidate.full_name,
                  job.title,
                  company.company_name,
                  `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                );
              }
            } else {
              if (
                ["offline", "OFFLINE"].includes(
                  result.attributes.interview_type,
                )
              ) {
                this.notificationService.sendInterviewScheduleOfflineNotification(
                  candidate,
                  job,
                  company,
                  {
                    scheduledDateTime: result.attributes.interview_date_time,
                    location: result.attributes.offline_address,
                    mapsLink: result.attributes.link_offline,
                  },
                );
                this.mailjetService.sendInterviewScheduleOffline(
                  candidate.email,
                  candidate.full_name,
                  job.title,
                  company.company_name,
                  result.attributes.interview_date_time,
                  result.attributes.offline_address,
                  result.attributes.offline_country,
                  result.attributes.offline_city,
                  result.attributes.offline_postal_code,
                  result.attributes.link_offline,
                  jobStep.description,
                  `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                  bccEmails,
                );
              } else {
                this.notificationService.sendInterviewScheduleOnlineNotification(
                  candidate,
                  job,
                  company,
                  {
                    scheduledDateTime: result.attributes.interview_date_time,
                    onlineMeetingLink: result.attributes.link_online,
                  },
                );
                this.mailjetService.sendInterviewScheduleOnline(
                  candidate.email,
                  candidate.full_name,
                  job.title,
                  company.company_name,
                  result.attributes.interview_date_time,
                  result.attributes.link_online,
                  jobStep.description,
                  `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                  bccEmails,
                );
              }
            }
            break;
          case JobsStepsStatus.REVISED:
            const dbccRevisedEmails = bccEmails;
            for (const employer of employers) {
              dbccRevisedEmails.push(employer.email);
            }
            const revisedBccEmails = [
              ...new Set(dbccRevisedEmails.filter((email) => email)),
            ];
            this.notificationService.sendInterviewRescheduleRequestSentNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendInterviewRescheduleRequestSent(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              result.attributes.reschedule_request_notes_from_candidate,
              `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
              revisedBccEmails,
            );
            break;
          case JobsStepsStatus.RESCHEDULED:
            if (
              ["offline", "OFFLINE"].includes(result.attributes.interview_type)
            ) {
              this.notificationService.sendInterviewRescheduleApprovedOfflineNotification(
                candidate,
                job,
                company,
                {
                  newScheduledDateTime: result.attributes.interview_date_time,
                  location: result.attributes.offline_address,
                },
              );
              this.mailjetService.sendInterviewRescheduleApprovedOffline(
                candidate.email,
                candidate.full_name,
                job.title,
                company.company_name,
                result.attributes.interview_date_time,
                result.attributes.offline_address,
                result.attributes.offline_country,
                result.attributes.offline_city,
                result.attributes.offline_postal_code,
                result.attributes.link_offline,
                jobStep.description,
                `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                bccEmails,
              );
            } else {
              this.notificationService.sendInterviewRescheduleApprovedOnlineNotification(
                candidate,
                job,
                company,
                {
                  newScheduledDateTime: result.attributes.interview_date_time,
                  onlineMeetingLink: result.attributes.link_online,
                },
              );
              this.mailjetService.sendInterviewRescheduleApprovedOnline(
                candidate.email,
                candidate.full_name,
                job.title,
                company.company_name,
                result.attributes.interview_date_time,
                result.attributes.link_online,
                jobStep.description,
                `admin/jobs/applied/${job.id}?applied_by=${candidate.id}`,
                bccEmails,
              );
            }
            break;
          case JobsStepsStatus.ACCEPTED:
            this.notificationService.sendInterviewResultAcceptedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendInterviewResultAccepted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
          case JobsStepsStatus.FAILED:
            this.notificationService.sendHiredNotificationRejectedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationRejected(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
        }
        break;
      case JobStepType.SYS_HIRED:
        switch (result.status) {
          case JobsStepsStatus.ACCEPTED:
            this.notificationService.sendHiredNotificationAcceptedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationAccepted(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
              result.attributes?.start_date,
              result.attributes?.hiring_description,
              result.attributes?.hiring_attachment,
            );
            break;
          case JobsStepsStatus.FAILED:
            this.notificationService.sendHiredNotificationRejectedNotification(
              candidate,
              job,
              company,
            );
            this.mailjetService.sendHiredNotificationRejected(
              candidate.email,
              candidate.full_name,
              job.title,
              company.company_name,
            );
            break;
        }
        break;
    }
  }

  async sendMoveNotification(
    result: ApplicantJobStep,
    updatedApplicant: Applicant,
  ) {
    const applicantJobStep = await this.applicantJobStepRepository.findOne({
      where: { id: result.id },
      relations: ["jobStep"],
    });

    const jobStep = applicantJobStep.jobStep;

    const applicant = await this.applicantRepository.findOne({
      where: { id: updatedApplicant.id },
      relations: ["user", "job", "job.company"],
    });

    const [candidate, job, company] = [
      applicant.user,
      applicant.job,
      applicant.job.company,
    ];

    this.notificationService.sendMoveCandidateStageNotification(
      candidate,
      job,
      company,
      jobStep.step_name,
    );

    this.mailjetService.sendMoveCandidateStage(
      candidate.email,
      candidate.full_name,
      job.title,
      company.company_name,
      jobStep.step_name,
      `admin/jobs/applied/${job.id}`,
    );
  }
}
