// src\jobs\jobs.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CreateJobDto } from "../dto/create-job.dto";
import { UpdateJobDto } from "../dto/update-job.dto";
import { Job, JobStatus } from "../entities/job.entity";
import { User } from "src/users/entities/user.entity";
import { FirebaseService } from "src/firebase/firebase.service";
import {
  Applicant,
  ApplicantStatus,
} from "src/applicants/entities/applicant.entity";
import {
  JobStep,
  JobStepsStatus,
} from "src/job_steps/entities/job_step.entity";
import { ScopeFilterService } from "src/rbac/scope-filter.service";
import { ScopeInfo } from "src/rbac/interfaces/scope-info.interface";
import { PermissionName } from "src/rbac/rbac.constants";
import { LoggingService } from "src/logs/logs.service";
import { FieldsService } from "src/zfields/fields.service";
import { FiltersUtil } from "src/zfields/filters.util";
import { MstCompanyHqBranchRelationService } from "src/mst_companies/service/company_hq_branch_relation.service";
import { CompanyDepartmentMapDao } from "src/company_department_map/dao/company_department_map.dao";
import { UserWithRoles } from "src/users/interfaces/user-with-roles.interface";
import { JobSkillMatchService } from "./job-skill-match.service";
import { JobResponseDto } from "../dto/job-response.dto";
import { JobsDao } from "../dao/jobs.dao";
import { JobPublicResponseDto } from "../dto/job-public-response.dto";
import {
  dateToDateOnlyGMT7,
  getStartOfTodayGMT7,
  getStartOfYesterdayGMT7,
} from "src/utils/date.util";
import { BasePagination } from "src/base.pagination";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { generateJobSlug } from "src/utils/string.util";

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    public jobRepository: Repository<Job>,
    @InjectRepository(User)
    public usersRepository: Repository<User>,
    @InjectRepository(JobStep)
    public jobStepRepository: Repository<JobStep>,
    @InjectRepository(Applicant)
    private applicantRepository: Repository<Applicant>,
    @InjectRepository(MstCompany)
    private companyRepository: Repository<MstCompany>,
    private firebaseService: FirebaseService,
    private readonly scopeFilterService: ScopeFilterService,
    private readonly logger: LoggingService,
    private readonly fieldsService: FieldsService,
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
    private readonly companyDepartmentMapDao: CompanyDepartmentMapDao,
    private readonly jobSkillMatchService: JobSkillMatchService,
    private readonly jobsDao: JobsDao,
  ) {}

  async create(createJobDto: CreateJobDto, user?: UserWithRoles): Promise<Job> {
    if (!createJobDto.company_id) {
      throw new BadRequestException("Company ID is required");
    }

    // Check permission if user is provided
    if (user) {
      await this.checkJobCreatePermission(
        user,
        createJobDto.company_id,
        createJobDto.status,
      );
    }

    const job = this.jobRepository.create(createJobDto);
    job.company_id = createJobDto.company_id;
    this.validateJobHasSkills(job);

    // Generate slug before saving
    await this.generateAndSetSlug(job);

    const result = await this.jobRepository.save(job);
    if (result.status === JobStatus.PUBLISH) {
      await this.handleJobPublished(result);
    }
    return result;
  }

  async findAll(): Promise<Job[]> {
    return await this.jobRepository.find();
  }

  async findOne(id: string, user?: UserWithRoles): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    const skillMatch = user?.isCandidate
      ? await this.jobSkillMatchService.calculateSkillMatch(id, user.id)
      : undefined;

    return JobResponseDto.fromEntity(job, skillMatch);
  }

  /**
   * Get published job by slug for public (no-auth) view.
   * Returns minimal fields: id, title, location, company name/logo, description, employment_status, domicile_status.
   */
  async findOnePublicBySlug(slug: string): Promise<JobPublicResponseDto> {
    const job = await this.jobsDao.findOneBySlugForPublic(slug);
    if (!job) {
      throw new NotFoundException(`Job with slug ${slug} not found`);
    }

    return this.mapJobToPublicDto(job);
  }

  /**
   * Get public jobs list by company (and optional status), paginated.
   */
  async findPublicListByCompany(
    companyId: string,
    status?: JobStatus,
    page?: number,
    limit?: number,
  ): Promise<BasePagination<JobPublicResponseDto>> {
    if (!companyId) {
      throw new BadRequestException("company_id is required");
    }

    const DEFAULT_LIMIT = 10;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || DEFAULT_LIMIT;
    const safePage = pageNum < 1 ? 1 : pageNum;
    const safeLimit = limitNum < 1 ? DEFAULT_LIMIT : limitNum;

    const skip = (safePage - 1) * safeLimit;
    const [jobs, total] = await this.jobsDao.findPublicListByCompany(
      companyId,
      status,
      skip,
      safeLimit,
    );

    const paginationResult = new BasePagination<JobPublicResponseDto>();
    paginationResult.items = jobs.map((job) => this.mapJobToPublicDto(job));
    paginationResult.meta = {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: safeLimit > 0 ? Math.ceil(total / safeLimit) : 0,
    };

    return paginationResult;
  }

  private mapJobToPublicDto(job: Job): JobPublicResponseDto {
    const location = job.is_outside_indo
      ? [job.other_region, job.other_country].filter(Boolean).join(", ") || ""
      : job.region?.full_name ?? "";

    const dto = new JobPublicResponseDto();
    dto.id = job.id;
    dto.company_id = job.company_id;
    dto.status = job.status;
    dto.title = job.title;
    dto.location = location;
    dto.company_name = job.company?.brand_name ?? "";
    dto.company_logo_url = job.company?.logo_url ?? "";
    dto.description = job.description;
    dto.employment_status = Array.isArray(job.employment_status)
      ? job.employment_status
      : [];
    dto.domicile_status = Array.isArray(job.domicile_status)
      ? job.domicile_status
      : [];
    dto.open_date = dateToDateOnlyGMT7(job.open_date);
    dto.close_date = dateToDateOnlyGMT7(job.close_date);
    dto.created_at = job.created_at;
    dto.updated_at = job.updated_at;

    return dto;
  }

  async update(
    id: string,
    updateJobDto: UpdateJobDto,
    user?: UserWithRoles,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    // Check permission if user is provided
    if (user) {
      if (updateJobDto.status === JobStatus.CLOSE) {
        await this.checkJobClosePermission(user, job.company_id);
      } else {
        await this.checkJobUpdatePermission(user, job.company_id);
      }
    }

    if (updateJobDto.status === JobStatus.PUBLISH) {
      if (
        job.open_date != null &&
        new Date(job.open_date) > getStartOfTodayGMT7()
      ) {
        throw new BadRequestException(
          "Cannot publish manually when open_date is set and still in the future (00:00 GMT+7). Wait for scheduled publish or clear open_date.",
        );
      }
    }

    const previousStatus = job.status;
    Object.assign(job, updateJobDto);
    this.validateJobHasSkills(job);

    // Regenerate slug if title, company_id, or open_date changed
    const shouldRegenerateSlug =
      updateJobDto.title !== undefined ||
      updateJobDto.company_id !== undefined ||
      updateJobDto.open_date !== undefined;

    if (shouldRegenerateSlug) {
      await this.generateAndSetSlug(job);
    }

    const result = await this.jobRepository.save(job);
    if (
      result.status === JobStatus.PUBLISH &&
      previousStatus !== JobStatus.PUBLISH
    ) {
      await this.handleJobPublished(result);
    }
    if (result.status === JobStatus.CLOSE) {
      await this.sendNotification(result);
    }
    return JobResponseDto.fromEntity(result);
  }

  async remove(id: string, user?: UserWithRoles): Promise<void> {
    const job = await this.findOne(id);

    // Check permission if user is provided
    if (user) {
      await this.checkJobClosePermission(user, job.company_id);
    }

    const result = await this.jobRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }

  async getApplicantCount(jobId: string): Promise<number> {
    const query = this.applicantRepository
      .createQueryBuilder("applicant")
      .innerJoin("applicant.user", "user")
      .where("applicant.job_id = :jobId", { jobId })
      .andWhere("user.deleted_at IS NULL");
    const status = [
      ApplicantStatus.ACCEPTED,
      ApplicantStatus.CONNECT,
      ApplicantStatus.NEED_REVIEW,
      ApplicantStatus.PROCESS,
      ApplicantStatus.REJECTED,
      ApplicantStatus.SCHEDULE_INTERVIEW,
      //ApplicantStatus.SAVED,
    ];
    query.andWhere("applicant.status IN (:...status)", { status });

    const count = await query.getCount();
    return count;
  }

  async handleJobPublished(job: Job) {
    // Check if SYS_SHORTLIST and SYS_HIRED steps exist for this job
    const existingSteps = await this.jobStepRepository.find({
      where: {
        job_id: job.id,
        type: In(["SYS_SHORTLIST", "SYS_HIRED"]),
      },
    });

    const existingTypes = existingSteps.map((step) => step.type);

    // Create missing system steps
    const stepsToCreate = [];

    if (!existingTypes.includes("SYS_SHORTLIST")) {
      stepsToCreate.push({
        job_id: job.id,
        type: "SYS_SHORTLIST",
        step_name: "Shortlisted",
        status: JobStepsStatus.SUBMITTED,
        description: "Candidates shortlisted for this position",
        step_order: 0, // High order number to place at end
      });
    }

    if (!existingTypes.includes("SYS_HIRED")) {
      stepsToCreate.push({
        job_id: job.id,
        type: "SYS_HIRED",
        step_name: "Hiring Process",
        status: JobStepsStatus.PENDING,
        description: "Candidates hired for this position",
        step_order: 999, // Highest order number to place at very end
      });
    }

    if (stepsToCreate.length > 0) {
      const stepsToSave = this.jobStepRepository.create(stepsToCreate);
      await this.jobStepRepository.save(stepsToSave);
    }
  }

  /**
   * Search jobs with scope filtering
   * - Sys admin: shows all jobs
   * - Employer (user with companyIds): shows only jobs from their companies
   * - Non-employer (candidate, etc): shows all jobs
   * @param id Optional job ID
   * @param filters Search filters
   * @param page Page number
   * @param limit Items per page
   * @param sortBy Sorting criteria
   * @param expands Related entities to expand
   * @param isExcel Export to Excel flag
   * @param res Response object for Excel export
   * @param user Current user
   * @returns Paginated job results
   */
  async search(
    id?: string,
    filters?: Record<string, any>,
    page?: number,
    limit?: number,
    sortBy?: any,
    expands?: string,
    isExcel?: string,
    user?: User,
  ) {
    // Parse filters
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);

    // Ensure parsedFilters is an object, not a string or other type
    const filtersObj = FiltersUtil.ensureFiltersObject(
      parsedFilters,
      "job-search",
      this.logger,
    );

    // Apply scope filtering if user is provided (simple: filter by company_id if user has companyIds)
    if (user) {
      const scopeInfo = await this.scopeFilterService.getScopeInfo(user.id);

      // Skip filtering for sys admin
      if (!scopeInfo.isSysAdmin) {
        // If user has companyIds (is employer), filter jobs by company_id
        if (scopeInfo.companyHqIds && scopeInfo.companyHqIds.length > 0) {
          // Merge with existing company_id filter if any
          let existingCompanyIds = [];
          if (filtersObj.company_id) {
            existingCompanyIds = Array.isArray(filtersObj.company_id)
              ? filtersObj.company_id
              : [filtersObj.company_id];
          }

          // Combine existing filter with scope companyIds (deduplicate)
          filtersObj.company_id = [
            ...new Set([...existingCompanyIds, ...scopeInfo.companyHqIds]),
          ];

          this.logger.log(
            `Applied scope filter for employer user ${user.id}: company_ids=${JSON.stringify(filtersObj.company_id)}`,
            "job-search",
          );
        }
        // If no companyIds (not employer), skip filtering - show all jobs
      }
    }

    this.logger.log(
      `Search jobs with filters: ${JSON.stringify(filtersObj)} from user id: ${user?.id}`,
      "job-search",
    );

    const jobs = await this.fieldsService.search(Job, {
      id,
      filters: filtersObj,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res: null, // Don't let fieldsService handle the response
      user,
    });

    this.logger.log(`Jobs found: ${jobs.items.length}`, "job-search");

    return jobs;
  }

  /**
   * Check if user has permission to create a job for the given company
   * @param user The user attempting to create the job
   * @param companyId The company ID for the job
   * @param jobStatus Optional job status to determine which permission to check
   */
  private async checkJobCreatePermission(
    user: UserWithRoles,
    companyId: string,
    jobStatus?: JobStatus,
  ): Promise<void> {
    // Skip RBAC checks if IS_RBAC_JOB_ACTIVE is not 'true' (default: inactive/false)
    // If env is empty/undefined, default to inactive (skip checks)
    if (
      !process.env.IS_RBAC_JOB_ACTIVE ||
      process.env.IS_RBAC_JOB_ACTIVE !== "true"
    ) {
      return;
    }

    const scopeInfo: ScopeInfo = await this.scopeFilterService.getScopeInfo(
      user.id,
    );

    // Sys admin has access to everything
    if (scopeInfo.isSysAdmin) {
      return;
    }

    // Get HQ company from branch
    const hqCompany =
      await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(
        companyId,
      );
    const companyHqId = hqCompany.id;

    // Get company department mappings
    const companyDeptMapping =
      await this.companyDepartmentMapDao.findByCompanyId(companyId);

    // Determine permission based on job status/step
    let permissionName: PermissionName;
    if (jobStatus === JobStatus.PUBLISH) {
      permissionName = PermissionName.JOB_CREATE_PUBLISH;
    } else {
      // Default to details permission for DRAFT or undefined status
      permissionName = PermissionName.JOB_CREATE_DETAILS;
    }

    // Check permission
    const hasAccess = this.scopeFilterService.hasAccess(
      scopeInfo,
      permissionName,
      companyDeptMapping,
      companyHqId,
      companyId,
    );

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.id} does not have permission ${permissionName} for company ${companyId}`,
        "job-permission-check",
      );
      throw new ForbiddenException(
        `You do not have permission to create jobs for this company`,
      );
    }
  }

  /**
   * Check if user has permission to update a job
   * @param user The user attempting to update the job
   * @param companyId The company ID of the job
   */
  private async checkJobUpdatePermission(
    user: UserWithRoles,
    companyId: string,
  ): Promise<void> {
    // Skip RBAC checks if IS_RBAC_JOB_ACTIVE is not 'true' (default: inactive/false)
    // If env is empty/undefined, default to inactive (skip checks)
    if (
      !process.env.IS_RBAC_JOB_ACTIVE ||
      process.env.IS_RBAC_JOB_ACTIVE !== "true"
    ) {
      return;
    }

    const scopeInfo: ScopeInfo = await this.scopeFilterService.getScopeInfo(
      user.id,
    );

    // Sys admin has access to everything
    if (scopeInfo.isSysAdmin) {
      return;
    }

    // Get HQ company from branch
    const hqCompany =
      await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(
        companyId,
      );
    const companyHqId = hqCompany.id;

    // Get company department mappings
    const companyDeptMapping =
      await this.companyDepartmentMapDao.findByCompanyId(companyId);

    // Check permission for editing draft
    const hasAccess = this.scopeFilterService.hasAccess(
      scopeInfo,
      PermissionName.JOB_DRAFT_EDIT,
      companyDeptMapping,
      companyHqId,
      companyId,
    );

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.id} does not have permission JOB_DRAFT_EDIT for company ${companyId}`,
        "job-permission-check",
      );
      throw new ForbiddenException(
        `You do not have permission to edit this job`,
      );
    }
  }

  /**
   * Auto-publish job by schedule. Called by scheduler when open_date has passed (00:00 GMT+7). Idempotent.
   */
  async autoPublishBySchedule(jobId: string): Promise<Job | null> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    const threshold = getStartOfTodayGMT7();
    if (
      !job ||
      job.status !== JobStatus.DRAFT ||
      !job.open_date ||
      new Date(job.open_date) > threshold
    ) {
      return null;
    }

    this.validateJobHasSkills(job);

    job.status = JobStatus.PUBLISH;

    await this.jobRepository.save(job);
    await this.handleJobPublished(job);

    return job;
  }

  /**
   * Auto-close job by schedule. Called by scheduler when close_date has passed (00:00 GMT+7) with 1-day buffer.
   * E.g. close_date 7 Feb 00:00 → closed on 8 Feb 00:00 run. Idempotent.
   */
  async autoCloseBySchedule(jobId: string): Promise<Job | null> {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    const threshold = getStartOfYesterdayGMT7();
    if (
      !job ||
      job.status === JobStatus.CLOSE ||
      !job.close_date ||
      new Date(job.close_date) > threshold
    ) {
      return null;
    }

    job.status = JobStatus.CLOSE;

    await this.jobRepository.save(job);
    await this.sendNotification(job);

    return job;
  }

  /**
   * Validate that job has at least one skill when:
   * - status is PUBLISH (create/update to published), or
   * - status is DRAFT and open_date is set (save as draft with scheduled publish).
   * Otherwise skill_ids are optional.
   */
  private validateJobHasSkills(job: Job): void {
    const requireSkills =
      job.status === JobStatus.PUBLISH ||
      (job.status === JobStatus.DRAFT && job.open_date != null);
    if (!requireSkills) {
      return;
    }
    if (
      !job.skill_ids ||
      !Array.isArray(job.skill_ids) ||
      job.skill_ids.length === 0
    ) {
      throw new BadRequestException(
        "Job must have at least one skill when publishing or when saving as draft with an open date.",
      );
    }
  }

  /**
   * Check if user has permission to close a job
   * @param user The user attempting to close the job
   * @param companyId The company ID of the job
   */
  private async checkJobClosePermission(
    user: UserWithRoles,
    companyId: string,
  ): Promise<void> {
    // Skip RBAC checks if IS_RBAC_JOB_ACTIVE is not 'true' (default: inactive/false)
    // If env is empty/undefined, default to inactive (skip checks)
    if (
      !process.env.IS_RBAC_JOB_ACTIVE ||
      process.env.IS_RBAC_JOB_ACTIVE !== "true"
    ) {
      return;
    }

    const scopeInfo: ScopeInfo = await this.scopeFilterService.getScopeInfo(
      user.id,
    );

    // Sys admin has access to everything
    if (scopeInfo.isSysAdmin) {
      return;
    }

    // Get HQ company from branch
    const hqCompany =
      await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(
        companyId,
      );
    const companyHqId = hqCompany.id;

    // Get company department mappings
    const companyDeptMapping =
      await this.companyDepartmentMapDao.findByCompanyId(companyId);

    // Check permission for closing job
    const hasAccess = this.scopeFilterService.hasAccess(
      scopeInfo,
      PermissionName.JOB_CLOSE,
      companyDeptMapping,
      companyHqId,
      companyId,
    );

    if (!hasAccess) {
      this.logger.warn(
        `User ${user.id} does not have permission JOB_CLOSE for company ${companyId}`,
        "job-permission-check",
      );
      throw new ForbiddenException(
        `You do not have permission to close this job`,
      );
    }
  }

  /**
   * Enrich jobs with skill match (PoV Candidate)
   * @param jobs Array of Job entities
   * @param userId User ID to calculate skill match against
   * @returns Array of JobResponseDto with skill_match
   */
  async enrichJobsWithSkillMatch(
    jobs: Job[],
    userId: string,
  ): Promise<JobResponseDto[]> {
    if (!jobs || jobs.length === 0) {
      return [];
    }

    return await Promise.all(
      jobs.map(async (job) => {
        const skillMatch = await this.jobSkillMatchService.calculateSkillMatch(
          job.id,
          userId,
        );
        return JobResponseDto.fromEntity(job, skillMatch);
      }),
    );
  }

  /**
   * Generate and set unique slug for a job
   * Pattern: jobTitle-brandName-publishDate-sequence
   * Sequence starts from 2 if duplicates exist (first one has no sequence)
   *
   * @param job Job entity to generate slug for
   */
  private async generateAndSetSlug(job: Job): Promise<void> {
    // Load company if not already loaded
    let company: MstCompany;
    if (job.company) {
      company = job.company;
    } else {
      company = await this.companyRepository.findOne({
        where: { id: job.company_id },
      });
      if (!company) {
        throw new NotFoundException(
          `Company with ID ${job.company_id} not found`,
        );
      }
    }

    // Determine publish date: use open_date if available, otherwise use created_at
    const publishDate = job.open_date || job.created_at || new Date();

    // Generate base slug without sequence
    const baseSlug = generateJobSlug(
      job.title,
      company.brand_name,
      publishDate,
    );

    // Check if base slug already exists (excluding current job)
    const existingJob = await this.jobRepository.findOne({
      where: { slug: baseSlug },
    });

    // If no existing slug, use base slug
    if (!existingJob || existingJob.id === job.id) {
      job.slug = baseSlug;
      return;
    }

    // If slug exists, find the highest sequence number (excluding current job)
    const slugPattern = `${baseSlug}-`;
    const queryBuilder = this.jobRepository
      .createQueryBuilder("job")
      .where("(job.slug LIKE :pattern OR job.slug = :baseSlug)", {
        pattern: `${slugPattern}%`,
        baseSlug,
      });

    // Exclude current job if it has an ID
    if (job.id) {
      queryBuilder.andWhere("job.id != :currentJobId", {
        currentJobId: job.id,
      });
    }

    const existingJobs = await queryBuilder.getMany();

    // Extract sequence numbers from existing slugs
    const sequences: number[] = [];
    existingJobs.forEach((existingJob) => {
      if (existingJob.slug === baseSlug) {
        // Base slug exists, so sequence starts from 2
        sequences.push(1);
      } else if (existingJob.slug?.startsWith(slugPattern)) {
        const suffix = existingJob.slug.replace(slugPattern, "");
        const seq = parseInt(suffix, 10);
        if (!isNaN(seq)) {
          sequences.push(seq);
        }
      }
    });

    // Find next available sequence (starting from 2)
    let nextSequence = 2;
    if (sequences.length > 0) {
      const maxSequence = Math.max(...sequences);
      nextSequence = maxSequence + 1;
    }

    // Generate slug with sequence
    job.slug = generateJobSlug(
      job.title,
      company.brand_name,
      publishDate,
      nextSequence,
    );
  }

  async sendNotification(result: Job) {
    const applicants = await this.applicantRepository.find({
      where: { job_id: result.id },
      relations: ["user", "job", "job.company"],
    });
    for (const applicant of applicants) {
      const [candidate, job, company] = [
        applicant.user,
        applicant.job,
        applicant.job.company,
      ];

      if (candidate && candidate.firebase_uid) {
        if (![ApplicantStatus.ACCEPTED].includes(applicant.status)) {
          this.firebaseService.sendPushNotification(
            candidate.firebase_uid,
            {
              notification: {
                title: "Job Status Changed",
                body: `The job position for ${job.title} that you applied for/saved has been closed.`,
                image: company.logo_url,
              },
              data: {
                entity: "job",
                id: job.id,
              },
            },
            {
              job: job,
            },
          );
        }
      }
    }
  }
}
