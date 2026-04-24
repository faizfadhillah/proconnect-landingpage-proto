import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateJobStepDto } from "./dto/create-job_step.dto";
import { UpdateJobStepDto } from "./dto/update-job_step.dto";
import {
  JobStep,
  JobStepsStatus,
  JobStepType,
} from "./entities/job_step.entity";
import { BasePagination } from "src/base.pagination";
import { JobStepAttributeFactory } from "./factory/attribute-factory";
import {
  DetailFulfillmentItem,
  TestPsychoTest,
} from "./entities/job_step.entity";
import { Job } from "src/jobs/entities/job.entity";
import { ScopeFilterService } from "src/rbac/scope-filter.service";
import { ScopeInfo } from "src/rbac/interfaces/scope-info.interface";
import { PermissionName } from "src/rbac/rbac.constants";
import { MstCompanyHqBranchRelationService } from "src/mst_companies/service/company_hq_branch_relation.service";
import { CompanyDepartmentMapDao } from "src/company_department_map/dao/company_department_map.dao";
import { UserWithRoles } from "src/users/interfaces/user-with-roles.interface";
import { LoggingService } from "src/logs/logs.service";

interface SearchJobStepsParams {
  id?: string;
  jobId?: string;
  type?: string;
  stepName?: string;
  stepOrder?: number;
  status?: JobStepsStatus;
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
export class JobStepsService {
  constructor(
    @InjectRepository(JobStep)
    private jobStepRepository: Repository<JobStep>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    private readonly scopeFilterService: ScopeFilterService,
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
    private readonly companyDepartmentMapDao: CompanyDepartmentMapDao,
    private readonly logger: LoggingService,
  ) {}

  async create(createJobStepDto: CreateJobStepDto, user?: UserWithRoles): Promise<JobStep> {
    // Check permission if user is provided
    if (user) {
      await this.checkJobWorkflowPermission(user, createJobStepDto.job_id);
    }

    const jobStep = this.jobStepRepository.create(createJobStepDto);
    this.setDefaultAttributes(jobStep, createJobStepDto);
    const result = await this.jobStepRepository.save(jobStep);
    return result;
  }

  async update(
    id: string,
    updateJobStepDto: UpdateJobStepDto,
  ): Promise<JobStep> {
    const jobStep = await this.jobStepRepository.findOne({ where: { id } });
    if (!jobStep) {
      throw new NotFoundException(`JobStep with ID ${id} not found`);
    }
    Object.assign(jobStep, updateJobStepDto);
    if (updateJobStepDto.attributes) {
      this.setDefaultAttributes(jobStep, updateJobStepDto);
    }
    const result = await this.jobStepRepository.save(jobStep);
    return result;
  }

  async remove(id: string): Promise<void> {
    try {
      // Cek dulu apakah ada applicant job steps yang terkait
      const hasRelatedApplicantJobSteps = await this.jobStepRepository
        .createQueryBuilder("job_step")
        .leftJoin("job_step.applicantJobSteps", "applicant_job_steps")
        .where("job_step.id = :id", { id })
        .andWhere("applicant_job_steps.id IS NOT NULL")
        .getCount();

      if (hasRelatedApplicantJobSteps > 0) {
        throw new BadRequestException(
          `Cannot delete job step. There are ${hasRelatedApplicantJobSteps} applicant(s) currently associated with this job step. Please remove or reassign the applicants first.`,
        );
      }

      const result = await this.jobStepRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`JobStep with ID ${id} not found`);
      }
    } catch (error) {
      // Jika masih ada database constraint error yang tidak tertangkap
      if (
        error.code === "23503" ||
        error.message.includes("foreign key constraint")
      ) {
        throw new BadRequestException(
          "Cannot delete job step because it is still referenced by applicant job steps. Please remove related applicant job steps first.",
        );
      }
      // Re-throw error lain (termasuk BadRequestException dan NotFoundException di atas)
      throw error;
    }
  }

  private async setDefaultAttributes(
    jobStep: JobStep,
    dto: CreateJobStepDto | UpdateJobStepDto,
  ): Promise<void> {
    const attributesFactory = JobStepAttributeFactory.createAttributes(
      dto.type as JobStepType,
    );
    // Use factory to create default attributes based on type

    // Handle different attribute types (object, array, or null)
    if (attributesFactory === null) {
      // For SYS_SHORTLIST and SYS_HIRED
      jobStep.attributes = dto.attributes || null;
    } else if (Array.isArray(attributesFactory)) {
      // For DETAIL_FULFILLMENT and TEST_PSYCHO (array of objects)
      if (Array.isArray(dto.attributes)) {
        // Merge arrays by updating existing items or adding new ones
        jobStep.attributes = attributesFactory.map((factoryItem, index) => {
          const dtoItem = dto.attributes[index];
          return dtoItem ? { ...factoryItem, ...dtoItem } : factoryItem;
        });

        // Add any additional items from dto.attributes using the same template
        if (dto.attributes.length > attributesFactory.length) {
          const additionalItems = dto.attributes.slice(
            attributesFactory.length,
          );

          // Untuk TestPsychoTest, gunakan template yang sama untuk item tambahan
          if (
            dto.type === JobStepType.TEST_PSYCHO &&
            attributesFactory.length > 0
          ) {
            const template = attributesFactory[0]; // Gunakan template dari item pertama
            const filledAdditionalItems = additionalItems.map(
              (dtoItem, index) => {
                const newTestId = (
                  attributesFactory.length +
                  index +
                  1
                ).toString();
                return {
                  ...template,
                  test_id: newTestId,
                  ...dtoItem,
                };
              },
            );
            (jobStep.attributes as TestPsychoTest[]).push(
              ...filledAdditionalItems,
            );
          } else {
            // Untuk tipe lain (DETAIL_FULFILLMENT), gunakan logika yang sudah ada
            (
              jobStep.attributes as DetailFulfillmentItem[] | TestPsychoTest[]
            ).push(...additionalItems);
          }
        }
      } else {
        // If dto.attributes is not an array, use factory defaults
        jobStep.attributes = attributesFactory;
      }
    } else {
      // For INTERVIEW and QUESTIONNAIRE (single object)
      jobStep.attributes = Object.assign({}, attributesFactory, dto.attributes);
    }
  }

  async search(params: SearchJobStepsParams): Promise<BasePagination<JobStep>> {
    const {
      id,
      jobId,
      type,
      stepName,
      stepOrder,
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

    const query = this.jobStepRepository
      .createQueryBuilder("job_step")
      .leftJoinAndSelect("job_step.questionnaires", "questionnaires");

    if (id) {
      query.andWhere("job_step.id = :id", { id });
    }
    if (jobId) {
      query.andWhere("job_step.job_id = :jobId", { jobId });
    }
    if (type) {
      query.andWhere("job_step.type = :type", { type });
    }
    if (stepName) {
      query.andWhere("job_step.step_name ILIKE :stepName", {
        stepName: `%${stepName}%`,
      });
    }
    if (stepOrder) {
      query.andWhere("job_step.step_order = :stepOrder", { stepOrder });
    }
    if (status) {
      query.andWhere("job_step.status = :status", { status });
    }
    if (notes) {
      query.andWhere("job_step.notes ILIKE :notes", { notes: `%${notes}%` });
    }
    if (attributes) {
      query.andWhere("job_step.attributes = :attributes", { attributes });
    }
    if (createdAt?.start && createdAt?.end) {
      query.andWhere("job_step.created_at BETWEEN :start AND :end", {
        start: createdAt.start,
        end: createdAt.end,
      });
    } else if (createdAt?.start) {
      query.andWhere("job_step.created_at >= :start", {
        start: createdAt.start,
      });
    } else if (createdAt?.end) {
      query.andWhere("job_step.created_at <= :end", {
        end: createdAt.end,
      });
    }
    if (createdBy) {
      query.andWhere("job_step.created_by = :createdBy", { createdBy });
    }
    if (updatedAt?.start && updatedAt?.end) {
      query.andWhere("job_step.updated_at BETWEEN :start AND :end", {
        start: updatedAt.start,
        end: updatedAt.end,
      });
    } else if (updatedAt?.start) {
      query.andWhere("job_step.updated_at >= :start", {
        start: updatedAt.start,
      });
    } else if (updatedAt?.end) {
      query.andWhere("job_step.updated_at <= :end", {
        end: updatedAt.end,
      });
    }
    if (updatedBy) {
      query.andWhere("job_step.updated_by = :updatedBy", { updatedBy });
    }
    if (deletedAt?.start && deletedAt?.end) {
      query.andWhere("job_step.deleted_at BETWEEN :start AND :end", {
        start: deletedAt.start,
        end: deletedAt.end,
      });
    } else if (deletedAt?.start) {
      query.andWhere("job_step.deleted_at >= :start", {
        start: deletedAt.start,
      });
    } else if (deletedAt?.end) {
      query.andWhere("job_step.deleted_at <= :end", {
        end: deletedAt.end,
      });
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy("job_step.step_order", "ASC");

    const [items, total] = await query.getManyAndCount();

    const paginationResult = new BasePagination<JobStep>();
    paginationResult.items = items;
    paginationResult.meta = {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };

    return paginationResult;
  }

  /**
   * Check if user has permission to create workflow steps for a job
   * @param user The user attempting to create the workflow step
   * @param jobId The job ID for the workflow step
   */
  private async checkJobWorkflowPermission(
    user: UserWithRoles,
    jobId: string,
  ): Promise<void> {
    // Skip RBAC checks if IS_RBAC_JOB_ACTIVE is not 'true' (default: inactive/false)
    // If env is empty/undefined, default to inactive (skip checks)
    if (!process.env.IS_RBAC_JOB_ACTIVE || process.env.IS_RBAC_JOB_ACTIVE !== 'true') {
      return;
    }

    // Get job to retrieve company_id
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const scopeInfo: ScopeInfo = await this.scopeFilterService.getScopeInfo(user.id);
    
    // Sys admin has access to everything
    if (scopeInfo.isSysAdmin) {
      return;
    }

    // Get HQ company from branch
    const hqCompany = await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(job.company_id);
    const companyHqId = hqCompany.id;

    // Get company department mappings
    const companyDeptMapping = await this.companyDepartmentMapDao.findByCompanyId(job.company_id);

    // Check permission for creating workflow
    const hasAccess = this.scopeFilterService.hasAccess(
      scopeInfo,
      PermissionName.JOB_CREATE_WORKFLOW,
      companyDeptMapping,
      companyHqId,
      job.company_id,
    );

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.id} does not have permission JOB_CREATE_WORKFLOW for job ${jobId} (company ${job.company_id})`,
        "job-workflow-permission-check",
      );
      throw new ForbiddenException(
        `You do not have permission to create workflow steps for this job`,
      );
    }
  }
}
