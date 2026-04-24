import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, IsNull } from "typeorm";
import { UserEducation } from "../entities/user_education.entity";
import { GetStudentsFilterDto } from "../dto/get-students-filter.dto";
import { ApprovalState } from "src/common/enums/approval-state.enum";
import { FindNeedApprovalFiltersDto } from "../dto/find-need-approval-query.dto";
import { CreateUserEducationDto } from "../dto/create-user_education.dto";
import { UpdateUserEducationDto } from "../dto/update-user_education.dto";
import { User } from "src/users/entities/user.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";
import { MstSchoolMajor } from "src/mst_school_majors/entities/mst_school_major.entity";

@Injectable()
export class UserEducationsDao {
  constructor(
    @InjectRepository(UserEducation)
    private readonly userEducationRepository: Repository<UserEducation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MstSchool)
    private readonly schoolRepository: Repository<MstSchool>,
    @InjectRepository(MstMajor)
    private readonly majorRepository: Repository<MstMajor>,
    @InjectRepository(MstSchoolMajor)
    private readonly schoolMajorRepository: Repository<MstSchoolMajor>,
  ) {}

  /**
   * Build query builder for educations with optional filters
   */
  buildFilteredEducationQuery(
    filters?: GetStudentsFilterDto,
  ): SelectQueryBuilder<UserEducation> {
    const queryBuilder = this.userEducationRepository
      .createQueryBuilder("ue")
      .leftJoinAndSelect("ue.user", "user")
      .where("ue.deleted_at IS NULL");

    // Apply school_id filter if provided
    if (filters?.school_id) {
      queryBuilder.andWhere("ue.school_id = :schoolId", {
        schoolId: filters.school_id,
      });
    }

    // Apply major_id filter if provided
    if (filters?.major_id) {
      queryBuilder.andWhere("ue.major_id = :majorId", {
        majorId: filters.major_id,
      });
    }

    // Apply name filter if provided (ILIKE on user.full_name)
    if (filters?.name) {
      queryBuilder.andWhere("user.full_name ILIKE :name", {
        name: `%${filters.name}%`,
      });
    }

    // Apply email filter if provided (ILIKE on user.email)
    if (filters?.email) {
      queryBuilder.andWhere("user.email ILIKE :email", {
        email: `%${filters.email}%`,
      });
    }

    return queryBuilder;
  }

  /**
   * Find educations with optional filters
   */
  async findFilteredEducations(
    filters?: GetStudentsFilterDto,
  ): Promise<UserEducation[]> {
    const queryBuilder = this.buildFilteredEducationQuery(filters);
    return await queryBuilder.getMany();
  }

  /**
   * Find educations by approval state(s) and optional filters with pagination
   * Filters out educations from soft-deleted users
   * @param page - Page number (default: 1)
   * @param limit - Limit per page, -1 for no limit (default: 10)
   * @param approval_state - Optional array of approval states to filter
   * @param school_id - Optional school ID to filter
   * @param major_id - Optional major ID to filter
   * @param student_id - Optional student ID to filter (case-insensitive partial match)
   * @returns Array with [items, total] where items is UserEducation[] and total is number
   */
  async findNeedApprovalWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: FindNeedApprovalFiltersDto,
  ): Promise<[UserEducation[], number]> {
    // approval_state already has default value from DTO transform, but ensure it's set
    const finalApprovalStates = filters?.approval_state || [ApprovalState.WAITING_APPROVAL];

    const queryBuilder = this.userEducationRepository
      .createQueryBuilder("ue")
      .leftJoinAndSelect("ue.school", "school")
      .leftJoinAndSelect("ue.user", "user")
      .where("ue.deleted_at IS NULL")
      .andWhere("ue.approval_state IN (:...approvalStates)", {
        approvalStates: finalApprovalStates,
      })
      .andWhere("user.deleted_at IS NULL"); // Filter out soft-deleted users

    // Apply optional filters
    if (filters?.school_id) {
      queryBuilder.andWhere("ue.school_id = :schoolId", {
        schoolId: filters.school_id,
      });
    }

    if (filters?.major_id) {
      queryBuilder.andWhere("ue.major_id = :majorId", {
        majorId: filters.major_id,
      });
    }

    if (filters?.student_id) {
      queryBuilder.andWhere("ue.student_id ILIKE :studentId", {
        studentId: `%${filters.student_id}%`,
      });
    }

    queryBuilder.orderBy("ue.created_at", "DESC");

    // Only apply pagination if limit is positive (limit = -1 means no limit)
    if (limit > 0) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  // ========== CRUD Methods ==========

  /**
   * Create a new UserEducation, without save to the DB.
   */
  async create(createDto: CreateUserEducationDto): Promise<UserEducation> {
    return this.userEducationRepository.create(createDto);
  }

  /**
   * Find UserEducation by ID with optional relations
   */
  async findById(id: string, relations?: string[]): Promise<UserEducation | null> {
    return await this.userEducationRepository.findOne({
      where: { id },
      relations: relations || [],
    });
  }

  /**
   * Update UserEducation by ID
   */
  async update(id: string, updateDto: UpdateUserEducationDto): Promise<UserEducation> {
    await this.userEducationRepository.update(id, updateDto);
    const updated = await this.userEducationRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('UserEducation not found after update');
    }
    return updated;
  }

  /**
   * Soft delete UserEducation by ID
   */
  async softDelete(id: string): Promise<void> {
    const result = await this.userEducationRepository.softDelete(id);
    if (result.affected === 0) {
      throw new Error('UserEducation not found for deletion');
    }
  }

  /**
   * Save UserEducation entity
   */
  async save(userEducation: UserEducation): Promise<UserEducation> {
    return await this.userEducationRepository.save(userEducation);
  }

  /**
   * Find UserEducations by user ID
   */
  async findByUserId(userId: string): Promise<UserEducation[]> {
    return await this.userEducationRepository.find({
      where: { user_id: userId, deleted_at: IsNull() },
    });
  }

  /**
   * Find UserEducations by school ID
   */
  async findBySchoolId(schoolId: string): Promise<UserEducation[]> {
    return await this.userEducationRepository.find({
      where: { school_id: schoolId, deleted_at: IsNull() },
    });
  }

  /**
   * Find UserEducations with verified schools for a user
   */
  async findWithVerifiedSchools(userId: string): Promise<UserEducation[]> {
    return await this.userEducationRepository
      .createQueryBuilder("userEducation")
      .innerJoinAndSelect("userEducation.school", "school")
      .where("userEducation.user_id = :userId", { userId })
      .andWhere("school.is_verified = true")
      .andWhere("userEducation.deleted_at IS NULL")
      .getMany();
  }

  // ========== MstSchool Methods ==========

  /**
   * Find school by name
   */
  async findSchoolByName(name: string): Promise<MstSchool | null> {
    return await this.schoolRepository.findOne({
      where: { name, deleted_at: IsNull() },
    });
  }

  /**
   * Create a new school
   */
  async createSchool(schoolData: Partial<MstSchool>): Promise<MstSchool> {
    const school = this.schoolRepository.create(schoolData);
    return await this.schoolRepository.save(school);
  }

  /**
   * Save school entity
   */
  async saveSchool(school: MstSchool): Promise<MstSchool> {
    return await this.schoolRepository.save(school);
  }

  // ========== MstMajor Methods ==========

  /**
   * Find major by name (case-insensitive)
   */
  async findMajorByName(majorName: string): Promise<MstMajor | null> {
    return await this.majorRepository
      .createQueryBuilder("major")
      .where("LOWER(major.major_name) = LOWER(:name)", { name: majorName })
      .andWhere("major.deleted_at IS NULL")
      .getOne();
  }

  /**
   * Create a new major
   */
  async createMajor(majorData: Partial<MstMajor>): Promise<MstMajor> {
    const major = this.majorRepository.create(majorData);
    return await this.majorRepository.save(major);
  }

  /**
   * Save major entity
   */
  async saveMajor(major: MstMajor): Promise<MstMajor> {
    return await this.majorRepository.save(major);
  }

  // ========== MstSchoolMajor Methods ==========

  /**
   * Find school-major by school and major IDs
   */
  async findSchoolMajorBySchoolAndMajor(
    schoolId: string,
    majorId: string,
  ): Promise<MstSchoolMajor | null> {
    return await this.schoolMajorRepository.findOne({
      where: {
        school_id: schoolId,
        major_id: majorId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Create a new school-major relationship
   */
  async createSchoolMajor(schoolMajorData: Partial<MstSchoolMajor>): Promise<MstSchoolMajor> {
    const schoolMajor = this.schoolMajorRepository.create(schoolMajorData);
    return await this.schoolMajorRepository.save(schoolMajor);
  }

  /**
   * Find all school-majors by school ID
   */
  async findSchoolMajorsBySchool(schoolId: string): Promise<MstSchoolMajor[]> {
    return await this.schoolMajorRepository.find({
      where: {
        school_id: schoolId,
        deleted_at: IsNull(),
      },
      relations: ["major"],
    });
  }

  /**
   * Find education by student_id and school_id
   */
  async findByStudentAndSchool(
    student_id: string,
    school_id: string,
  ): Promise<UserEducation | null> {
    if (!student_id || !school_id) return null;
    return this.userEducationRepository.findOne({
      where: { student_id, school_id, deleted_at: IsNull() },
    });
  }

  // ========== User Methods ==========

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId, deleted_at: IsNull() },
    });
  }

  /**
   * Save user entity
   */
  async saveUser(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
}
