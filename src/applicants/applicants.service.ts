import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Not, Repository } from "typeorm";
import { CreateApplicantDto } from "./dto/create-applicant.dto";
import { UpdateApplicantDto } from "./dto/update-applicant.dto";
import { Applicant, ApplicantStatus } from "./entities/applicant.entity";
import { User } from "src/users/entities/user.entity";
import { Job, JobStatus } from "src/jobs/entities/job.entity";
import { JobStep } from "src/job_steps/entities/job_step.entity";
import {
  ApplicantJobStep,
  JobsStepsStatus,
} from "src/applicant_job_steps/entities/applicant_job_step.entity";
import { JobStepType } from "src/job_steps/entities/job_step.entity";
import { NotificationService } from "src/users/notification.service";
import { MailjetService } from "src/users/mailjet.service";
import { ApplicantJobStepsService } from "src/applicant_job_steps/applicant_job_steps.service";
import { JobSkillMatchService } from "src/jobs/services/job-skill-match.service";
import { ApplicantResponseDto } from "./dto/applicant-response.dto";

@Injectable()
export class ApplicantsService {
  constructor(
    @InjectRepository(Applicant)
    private applicantRepository: Repository<Applicant>,
    @InjectRepository(User)
    public usersRepository: Repository<User>,
    private notificationService: NotificationService, // Replace firebaseService
    private mailjetService: MailjetService,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(JobStep)
    private jobStepRepository: Repository<JobStep>,
    @InjectRepository(ApplicantJobStep)
    private applicantJobStepRepository: Repository<ApplicantJobStep>,
    private applicantJobStepsService: ApplicantJobStepsService,
    private jobSkillMatchService: JobSkillMatchService,
  ) { }

  async create(createApplicantDto: CreateApplicantDto): Promise<Applicant> {
    const job = await this.jobRepository.findOne({
      where: {
        id: createApplicantDto.job_id,
      },
    });
    if (job.status != JobStatus.PUBLISH) {
      throw new BadRequestException(
        "This job posting is no longer active or has been closed. Please check other available job opportunities.",
      );
    }
    const existingApplicant = await this.applicantRepository.findOne({
      where: {
        job_id: createApplicantDto.job_id,
        user_id: createApplicantDto.user_id,
        //status: createApplicantDto.status,
      },
    });
    if (existingApplicant) {
      const currentStatus = existingApplicant.status;
      if (
        existingApplicant.status == ApplicantStatus.SAVED &&
        createApplicantDto.status != ApplicantStatus.SAVED
      ) {
        existingApplicant.status = createApplicantDto.status;
        const result = await this.applicantRepository.save(existingApplicant);
        if (currentStatus != result.status) {
          await this.sendNotification(result);
        }
        return result;
      } else {
        throw new BadRequestException(
          `this job already ${existingApplicant.status} by this user`,
        );
      }
    }

    const applicant = this.applicantRepository.create(createApplicantDto);
    const result = await this.applicantRepository.save(applicant);
    await this.sendNotification(result);
    return result;
  }

  async findAll(): Promise<Applicant[]> {
    return await this.applicantRepository.find();
  }

  /**
   * Enrich applicants with skill match (PoV Employer)
   * @param applicants Array of Applicant entities
   * @returns Array of ApplicantResponseDto with skill_match
   */
  async enrichApplicantsWithSkillMatch(
    applicants: Applicant[],
  ): Promise<ApplicantResponseDto[]> {
    if (!applicants || applicants.length === 0) {
      return [];
    }

    return await Promise.all(
      applicants.map(async (applicant) => {
        const skillMatch = await this.jobSkillMatchService.calculateSkillMatch(
          applicant.job_id,
          applicant.user_id,
        );

        // Convert entity to DTO with skill_match
        const dto = new ApplicantResponseDto();
        Object.assign(dto, applicant);
        dto.skill_match = skillMatch;

        return dto;
      }),
    );
  }

  async findOne(jobId: string, userId: string): Promise<Applicant> {
    const applicant = await this.applicantRepository.findOne({
      where: { job_id: jobId, user_id: userId },
    });
    if (!applicant) {
      throw new NotFoundException(
        `Applicant with jobId ${jobId} and userId ${userId} not found`,
      );
    }
    return applicant;
  }

  /**
   * Get applicant by ID and enrich with skill match (PoV Employer)
   */
  async findOneWithSkillMatch(
    id: string,
  ): Promise<ApplicantResponseDto> {
    const applicant = await this.applicantRepository.findOne({
      where: { id },
    });

    if (!applicant) {
      throw new NotFoundException(`Applicant with id ${id} not found`);
    }

    const dto = new ApplicantResponseDto();
    Object.assign(dto, applicant);

    const skillMatch = await this.jobSkillMatchService.calculateSkillMatch(
      applicant.job_id,
      applicant.user_id,
    );
    dto.skill_match = skillMatch;

    return dto;
  }

  async updateByID(
    id: string,
    updateApplicantDto: UpdateApplicantDto,
  ): Promise<Applicant> {
    const applicant = await await this.applicantRepository.findOneBy({
      id: id,
    });
    const currentStatus = applicant.status;
    const currentLastApplicantJobStepId = applicant.last_applicant_job_step_id;
    Object.assign(applicant, updateApplicantDto);
    if (currentLastApplicantJobStepId != applicant.last_applicant_job_step_id) {
      await this.updateLastApplicantJobStepId(
        currentLastApplicantJobStepId,
        applicant.last_applicant_job_step_id,
      );
    }
    const result = await this.applicantRepository.save(applicant);
    if (currentStatus != result.status) {
      this.sendNotification(result);
    }
    return result;
  }

  async update(
    jobId: string,
    userId: string,
    updateApplicantDto: UpdateApplicantDto,
  ): Promise<Applicant> {
    const applicant = await this.findOne(jobId, userId);
    const currentStatus = applicant.status;
    const currentLastApplicantJobStepId = applicant.last_applicant_job_step_id;
    Object.assign(applicant, updateApplicantDto);
    if (currentLastApplicantJobStepId != applicant.last_applicant_job_step_id) {
      await this.updateLastApplicantJobStepId(
        currentLastApplicantJobStepId,
        applicant.last_applicant_job_step_id,
      );
    }
    const result = await this.applicantRepository.save(applicant);
    if (currentStatus != result.status) {
      this.sendNotification(result);
    }
    return result;
  }

  async updateLastApplicantJobStepId(
    currentLastApplicantJobStepId: string,
    lastApplicantJobStepId: string,
  ) {
    // Validation untuk memastikan kedua parameter tidak null/undefined
    if (!currentLastApplicantJobStepId || !lastApplicantJobStepId) {
      throw new BadRequestException(
        "Current and new applicant job step IDs are required",
      );
    }

    // Jika ID yang sama, tidak perlu update
    if (currentLastApplicantJobStepId === lastApplicantJobStepId) {
      return;
    }

    // Find current applicant job step
    const currentApplicantJobStep =
      await this.applicantJobStepRepository.findOne({
        where: { id: currentLastApplicantJobStepId },
        relations: ["jobStep"],
      });

    if (!currentApplicantJobStep) {
      throw new NotFoundException(
        `Current applicant job step with ID ${currentLastApplicantJobStepId} not found`,
      );
    }

    // Find new last applicant job step
    const lastApplicantJobStep = await this.applicantJobStepRepository.findOne({
      where: { id: lastApplicantJobStepId },
      relations: ["jobStep", "applicant"],
    });

    if (!lastApplicantJobStep) {
      throw new NotFoundException(
        `New applicant job step with ID ${lastApplicantJobStepId} not found`,
      );
    }

    // Business rule: Tidak boleh move ke step yang sudah ACCEPTED
    if (
      [JobsStepsStatus.ACCEPTED, JobsStepsStatus.FAILED].includes(
        lastApplicantJobStep.status,
      )
    ) {
      throw new BadRequestException(
        "Cannot move stages to an already accepted stages",
      );
    }

    // Business rule: Validasi bahwa kedua step berada dalam job yang sama
    if (currentApplicantJobStep.job_id !== lastApplicantJobStep.job_id) {
      throw new BadRequestException("Cannot move between different jobs");
    }

    // Determine direction of movement (forward or backward)
    const isMovingBackward =
      currentApplicantJobStep.jobStep.step_order >
      lastApplicantJobStep.jobStep.step_order;

    // Update current step status based on movement direction
    if (isMovingBackward) {
      if (
        ![JobsStepsStatus.ACCEPTED, JobsStepsStatus.FAILED].includes(
          currentApplicantJobStep.status,
        )
      ) {
        currentApplicantJobStep.status = JobsStepsStatus.PENDING;
      }
      // Jika moving backward, set current step ke SKIPPED atau PENDING
      // currentApplicantJobStep.status = JobsStepsStatus.SK;
    } else {
      // Jika moving forward, set current step ke PENDING (default behavior)
      if (
        ![JobsStepsStatus.ACCEPTED, JobsStepsStatus.FAILED].includes(
          currentApplicantJobStep.status,
        )
      ) {
        currentApplicantJobStep.status = JobsStepsStatus.SKIPPED;
      }
    }

    await this.applicantJobStepRepository.save(currentApplicantJobStep);
    await this.applicantJobStepRepository.save(lastApplicantJobStep);

    // Update new last step status
    if (lastApplicantJobStep.jobStep.type === JobStepType.SYS_SHORTLIST) {
      lastApplicantJobStep.status = JobsStepsStatus.SUBMITTED;
    } else {
      lastApplicantJobStep.status = JobsStepsStatus.CURRENT;
      this.applicantJobStepsService.sendMoveNotification(
        lastApplicantJobStep,
        lastApplicantJobStep.applicant,
      );
    }

    await this.applicantJobStepRepository.save(lastApplicantJobStep);

    // Additional logic: Update intermediate steps if moving backward
    if (isMovingBackward) {
      await this.updateIntermediateStepsOnBackward(
        currentApplicantJobStep,
        lastApplicantJobStep,
      );
    } else {
      await this.updateIntermediateStepsOnForward(
        currentApplicantJobStep,
        lastApplicantJobStep,
      );
    }
  }

  // Helper method untuk handle intermediate steps saat moving backward
  private async updateIntermediateStepsOnBackward(
    currentStep: ApplicantJobStep,
    targetStep: ApplicantJobStep,
  ) {
    // Find all steps between target and current step
    const intermediateSteps = await this.applicantJobStepRepository
      .createQueryBuilder("ajs")
      .leftJoinAndSelect("ajs.jobStep", "js")
      .where("ajs.applicant_id = :applicantId", {
        applicantId: currentStep.applicant_id,
      })
      .andWhere("ajs.job_id = :jobId", {
        jobId: currentStep.job_id,
      })
      .andWhere("js.step_order > :targetOrder", {
        targetOrder: targetStep.jobStep.step_order,
      })
      .andWhere("js.step_order < :currentOrder", {
        currentOrder: currentStep.jobStep.step_order,
      })
      .andWhere("ajs.status NOT IN (:...statuses)", {
        statuses: [JobsStepsStatus.ACCEPTED, JobsStepsStatus.FAILED],
      })
      .getMany();

    // Set intermediate steps to PENDING or SKIPPED based on their current status
    for (const step of intermediateSteps) {
      // Reset other steps to PENDING
      step.status = JobsStepsStatus.PENDING;
      await this.applicantJobStepRepository.save(step);
    }
  }

  private async updateIntermediateStepsOnForward(
    currentStep: ApplicantJobStep,
    targetStep: ApplicantJobStep,
  ) {
    // Find all steps between target and current step
    const intermediateSteps = await this.applicantJobStepRepository
      .createQueryBuilder("ajs")
      .leftJoinAndSelect("ajs.jobStep", "js")
      .where("ajs.applicant_id = :applicantId", {
        applicantId: currentStep.applicant_id,
      })
      .andWhere("ajs.job_id = :jobId", {
        jobId: currentStep.job_id,
      })
      .andWhere("js.step_order > :currentOrder", {
        currentOrder: currentStep.jobStep.step_order,
      })
      .andWhere("js.step_order < :targetOrder", {
        targetOrder: targetStep.jobStep.step_order,
      })
      .andWhere("ajs.status NOT IN (:...statuses)", {
        statuses: [JobsStepsStatus.ACCEPTED, JobsStepsStatus.FAILED],
      })
      .getMany();

    // Set intermediate steps to SKIPPED based on their current status
    for (const step of intermediateSteps) {
      step.status = JobsStepsStatus.SKIPPED;
      await this.applicantJobStepRepository.save(step);
    }
  }

  async remove(jobId: string, userId: string): Promise<void> {
    const result = await this.applicantRepository.softDelete({
      job_id: jobId,
      user_id: userId,
      status: ApplicantStatus.SAVED,
    });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Applicant with jobId ${jobId} and userId ${userId} not found`,
      );
    }
  }

  async removeByID(id: string): Promise<void> {
    const result = await this.applicantRepository.softDelete({
      id: id,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Applicant with id ${id}  not found`);
    }
  }

  async refreshApplicantJobStep(filters: any) {
    if (filters.job_id) {
      const jobSteps = await this.jobStepRepository.find({
        where: { job_id: filters.job_id },
        order: { step_order: "DESC" },
      });

      let applicants = [];
      if (filters.user_id) {
        applicants = await this.applicantRepository.find({
          where: {
            job_id: filters.job_id,
            user_id: filters.user_id,
            status: Not(ApplicantStatus.SAVED),
          },
        });
      }

      for (const applicant of applicants) {
        const jobStepIds = [];
        for (const jobStep of jobSteps) {
          const existingStep = await this.applicantJobStepRepository.findOne({
            where: { applicant_id: applicant.id, job_step_id: jobStep.id },
          });
          if (!existingStep) {
            let newApplicantJobStep = this.applicantJobStepRepository.create({
              applicant_id: applicant.id,
              job_step_id: jobStep.id,
              job_id: jobStep.job_id,
              user_id: applicant.user_id,
              status:
                jobStep.type == JobStepType.SYS_SHORTLIST
                  ? JobsStepsStatus.SUBMITTED
                  : JobsStepsStatus.PENDING,
              attributes: [JobStepType.TEST_PSYCHO].includes(
                jobStep.type as JobStepType,
              )
                ? jobStep.attributes
                : null,
            });
            newApplicantJobStep =
              await this.applicantJobStepRepository.save(newApplicantJobStep);

            if (
              jobStep.type == JobStepType.SYS_SHORTLIST &&
              !applicant.last_applicant_job_step_id
            ) {
              applicant.last_applicant_job_step_id = newApplicantJobStep.id;
            }
          } else {
            if (!["ACCEPTED", "PENDING"].includes(existingStep.status)) {
              applicant.last_applicant_job_step_id =
                applicant.last_applicant_job_step_id || existingStep.id;
            }
          }
          await this.applicantRepository.save(applicant);
          jobStepIds.push(jobStep.id);
        }
        // Delete applicant job steps that are not in jobStepIds
        await this.applicantJobStepRepository.delete({
          applicant_id: applicant.id,
          job_step_id: Not(In(jobStepIds)),
        });
      }
    }
  }

  async sendNotification(result: Applicant) {
    const applicant = await this.applicantRepository.findOne({
      where: { id: result.id },
      relations: ["user", "job", "job.company"],
    });
    const [candidate, job, company] = [
      applicant.user,
      applicant.job,
      applicant.job.company,
    ];

    if (result.status == ApplicantStatus.CONNECT) {
      this.refreshApplicantJobStep({
        job_id: job.id,
        id: result.id,
        user_id: result.user_id,
      });

      // Send notification to candidate
      await this.notificationService.sendCandidateConnectedNotification(
        candidate,
        job,
        company,
        result,
      );

      // Send notifications to company users
      const company_users = await this.usersRepository.findBy({
        company_id: job.company_id,
      });

      const bcc = [];
      for (const user of company_users) {
        await this.notificationService.sendNewCandidateAppliedNotification(
          user,
          candidate,
          job,
          result,
        );
        bcc.push(user.email);
      }

      await this.mailjetService.sendJobApplicationReceived(
        candidate.email,
        candidate.full_name,
        job.title,
        company.company_name,
        bcc,
      );
    } else if (result.status != ApplicantStatus.SAVED) {
      await this.notificationService.sendJobApplicationStatusUpdateNotification(
        candidate,
        job,
        company,
        result,
      );
    }
  }
}
