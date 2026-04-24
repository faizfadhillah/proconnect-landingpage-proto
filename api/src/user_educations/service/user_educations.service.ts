// src\user_educations\user_educations.service.ts
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { CreateUserEducationDto } from "../dto/create-user_education.dto";
import { UpdateUserEducationDto } from "../dto/update-user_education.dto";
import { UserEducation } from "../entities/user_education.entity";
import { LoggingService } from "../../logs/logs.service";
import { BasePagination } from "../../base.pagination";
import { ApprovalState } from "../../common/enums/approval-state.enum";
import { UserEducationsDao } from "../dao/user_educations.dao";
import { FindNeedApprovalFiltersDto } from "../dto/find-need-approval-query.dto";
import { EducationVerificationService } from "./education-verification.service";
import { EducationHelperService } from "./education-helper.service";

@Injectable()
export class UserEducationsService {
  constructor(
    private readonly userEducationsDao: UserEducationsDao,
    private readonly educationVerificationService: EducationVerificationService,
    private readonly educationHelperService: EducationHelperService,
    private readonly logger: LoggingService,
  ) { }

  async create(
    createUserEducationDto: CreateUserEducationDto,
  ): Promise<UserEducation> {
    // Set default approval_state to WAITING_APPROVAL
    // Approval/rejection will be done via upload mapping / approval flow
    const userEducation = await this.userEducationsDao.create(createUserEducationDto);
    userEducation.approval_state = ApprovalState.WAITING_APPROVAL;
    userEducation.approval_by = null;
    const savedEducation = await this.userEducationsDao.save(userEducation);

    await this.educationHelperService.updateIsSchoolVerifiedStatus(savedEducation);
    await this.educationHelperService.updateMajorId(savedEducation);

    // Create pending certificates with WAITING_APPROVAL for all matching mappings
    await this.educationVerificationService.createPendingCertificates(savedEducation);

    await this.educationVerificationService.autoApproveAndTriggerVerification(savedEducation);

    return savedEducation;
  }

  async update(
    id: string,
    updateUserEducationDto: UpdateUserEducationDto,
  ): Promise<UserEducation> {
    // Load without relations to avoid TypeORM using loaded relation to override school_id
    const userEducation = await this.userEducationsDao.findById(id, []);
    if (!userEducation) {
      throw new NotFoundException(`UserEducation with ID ${id} not found`);
    }

    // Only prevent edit if approval_state=APPROVED
    // All other states (WAITING_APPROVAL, REJECT, etc.) can be edited
    if (userEducation.approval_state === ApprovalState.APPROVED) {
      throw new BadRequestException(
        `Cannot update UserEducation with ID ${id} because approval_state is ${userEducation.approval_state}. Only APPROVED records cannot be edited.`,
      );
    }

    // Defensive: ignore is_verified, approval_state, and approval_by if somehow provided
    // These fields should only be set via approve endpoint
    const { is_verified, approval_state, approval_by, ...updateData } = updateUserEducationDto as any;

    // Save old values BEFORE update to compare later
    const oldSchoolId = userEducation.school_id;
    const oldMajorId = userEducation.major_id;
    const oldEducationDegree = userEducation.education_degree;
    const oldDiplomaLevel = userEducation.diploma_level;

    // Update entity with new data
    Object.assign(userEducation, updateData);
    const updated = await this.userEducationsDao.save(userEducation);

    await this.educationHelperService.updateIsSchoolVerifiedStatus(updated);
    await this.educationHelperService.updateMajorId(updated);

    // If mapping fields changed, delete old certificates and create new ones
    // Compare with old values (not updated userEducation) to detect actual changes
    if (this.isMappingFieldsChanged(updateData, oldSchoolId, oldMajorId, oldEducationDegree, oldDiplomaLevel)) {
      await this.educationVerificationService.deleteCertificatesByEducationId(updated.id);
      await this.educationVerificationService.createPendingCertificates(updated);
    }

    return await this.userEducationsDao.findById(updated.id, ["school"]);
  }

  async remove(id: string): Promise<void> {
    // Delete related certificates before deleting education
    await this.educationVerificationService.deleteCertificatesByEducationId(id);

    try {
      await this.userEducationsDao.softDelete(id);
    } catch (error) {
      if (error.message === 'UserEducation not found for deletion') {
        throw new NotFoundException(`UserEducation with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find educations by approval state(s) and optional filters
   * Filters out educations from soft-deleted users
   * @param page - Page number (default: 1)
   * @param limit - Limit per page, -1 for no limit (default: 10)
   * @param approval_state - Optional array of approval states to filter
   * @param school_id - Optional school ID to filter
   * @param major_id - Optional major ID to filter
   * @param student_id - Optional student ID to filter (case-insensitive partial match)
   */
  async findNeedApproval(
    page: number = 1,
    limit: number = 10,
    filters?: FindNeedApprovalFiltersDto,
  ): Promise<BasePagination<UserEducation>> {
    // Delegate query logic to DAO
    const [items, total] = await this.userEducationsDao.findNeedApprovalWithPagination(
      page,
      limit,
      filters,
    );

    // Calculate totalPages: if limit is -1 or 0, set to 1 (all items in one page)
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  private isMappingFieldsChanged(
    updateData: UpdateUserEducationDto,
    oldSchoolId: string | null,
    oldMajorId: string | null,
    oldEducationDegree: string | null,
    oldDiplomaLevel: string | null
  ): boolean {
    return (
      (updateData.school_id !== undefined && updateData.school_id !== oldSchoolId) ||
      (updateData.major_id !== undefined && updateData.major_id !== oldMajorId) ||
      (updateData.education_degree !== undefined && updateData.education_degree !== oldEducationDegree) ||
      (updateData.diploma_level !== undefined && updateData.diploma_level !== oldDiplomaLevel)
    );
  }
}
