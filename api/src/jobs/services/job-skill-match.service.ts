// src\jobs\services\job-skill-match.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, In } from "typeorm";
import { Job } from "../entities/job.entity";
import { UserSkill } from "src/user_skills/entities/user_skill.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { User } from "src/users/entities/user.entity";
import { MstEducationProfessionMappingDao } from "src/mst_education_profession_mappings/dao/mst_education_profession_mapping.dao";
import { ApprovalState } from "src/common/enums/approval-state.enum";
import { SkillMatchDetailResponseDto, UserInfoDto } from "../dto/skill-match-detail-response.dto";
import { toTitleCase } from "src/utils/string.util";
import { MstSkill } from "src/mst_skills/entities/mst_skill.entity";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";

@Injectable()
export class JobSkillMatchService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(MstSkill)
    private readonly mstSkillRepository: Repository<MstSkill>,
    @InjectRepository(UserSkill)
    private readonly userSkillRepository: Repository<UserSkill>,
    @InjectRepository(UserEducation)
    private readonly userEducationRepository: Repository<UserEducation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MstProfession)
    private readonly mstProfessionRepository: Repository<MstProfession>,
    private readonly educationProfessionMappingDao: MstEducationProfessionMappingDao,
  ) {}

  /**
   * Calculate skill match percentage between job and user
   * Priority: Education-profession mapping (very dominant) → 100%
   * @param jobId Job ID
   * @param userId User ID
   * @returns Skill match percentage (integer 0-100) or -1 if no skills in job and no education match
   */
  async calculateSkillMatch(
    jobId: string,
    userId: string,
  ): Promise<number> {
    // 1. Get job detail
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // 2. Check edu x profession mapping FIRST (very dominant - auto 100%)
    // This takes priority even if job has no skills
    const educationMatchResult = await this.checkEducationProfessionMatch(jobId, userId);
    if (educationMatchResult.isMatch) {
      return 100;
    }

    // 3. Check if job has skills - return -1 if no skills
    if (!this.hasJobSkills(job)) {
      return -1;
    }

    // 4. Calculate skill match
    const userSkills = await this.getUserSkills(userId);
    const { verified, unverified } = this.countSkillMatches(
      job.skill_ids,
      userSkills,
    );

    // 5. Apply formula: ((2×V)+(1×U))/(2×T) × 100
    const total = job.skill_ids.length;
    const percentage = this.calculatePercentage(verified, unverified, total);

    return percentage;
  }

  /**
   * Get all user skills (verified & unverified)
   * @param userId User ID
   * @returns Array of UserSkill
   */
  private async getUserSkills(userId: string): Promise<UserSkill[]> {
    return await this.userSkillRepository.find({
      where: {
        user_id: userId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Check if user has verified education that matches job profession via mapping
   * Also checks if job title matches profession name
   * @param jobId Job ID
   * @param userId User ID
   * @returns Object with isMatch and isEducationMatch flags
   */
  private async checkEducationProfessionMatch(
    jobId: string,
    userId: string,
  ): Promise<{ isMatch: boolean; isEducationMatch: boolean }> {
    // Get job to retrieve profession_ids and title
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });

    if (!job || !job.profession_ids || job.profession_ids.length === 0) {
      return { isMatch: false, isEducationMatch: false };
    }

    // Get verified user educations (approval_state = APPROVED)
    const verifiedEducations = await this.userEducationRepository.find({
      where: {
        user_id: userId,
        approval_state: ApprovalState.APPROVED,
        deleted_at: IsNull(),
      },
    });

    if (verifiedEducations.length === 0) {
      return { isMatch: false, isEducationMatch: false };
    }

    // Get profession names for job title comparison
    const professions = await this.mstProfessionRepository.find({
      where: {
        id: In(job.profession_ids),
        deleted_at: IsNull(),
      },
    });

    const professionNames = professions.map((p) => p.name.toLowerCase().trim());
    const jobTitleLower = job.title.toLowerCase().trim();

    // Check each verified education against job professions (diploma_level optional; DAO matches mapping with diploma_level NULL)
    for (const education of verifiedEducations) {
      if (
        !education.school_id ||
        !education.major_id ||
        !education.education_degree
      ) {
        continue;
      }

      const exists = await this.educationProfessionMappingDao.existsByEducationAndProfessions(
        education.school_id,
        education.major_id,
        education.education_degree,
        education.diploma_level ?? null,
        job.profession_ids,
      );

      if (exists) {
        // Check if job title matches any profession name
        const isEducationMatch = professionNames.some(
          (profName) => profName === jobTitleLower,
        );
        return { isMatch: true, isEducationMatch };
      }
    }

    return { isMatch: false, isEducationMatch: false };
  }

  /**
   * Count verified and unverified skill matches
   * @param jobSkills Array of JobSkill
   * @param userSkills Array of UserSkill
   * @returns Object with verified and unverified counts
   */
  private countSkillMatches(
    jobSkillIds: string[],
    userSkills: UserSkill[],
  ): { verified: number; unverified: number } {
    const userSkillMap = new Map<string, UserSkill>();

    // Create map of user skills by skill_id
    for (const userSkill of userSkills) {
      userSkillMap.set(userSkill.skill_id, userSkill);
    }

    let verified = 0;
    let unverified = 0;

    // Count matches
    for (const jobSkillId of jobSkillIds) {
      const userSkill = userSkillMap.get(jobSkillId);
      if (userSkill) {
        // Check if verified: is_verified = true OR approval_state = APPROVED
        if (
          userSkill.is_verified === true ||
          userSkill.approval_state === ApprovalState.APPROVED
        ) {
          verified++;
        } else {
          unverified++;
        }
      }
    }

    return { verified, unverified };
  }

  /**
   * Calculate skill match percentage using formula: ((2×V)+(1×U))/(2×T) × 100
   * @param verified Number of verified skill matches
   * @param unverified Number of unverified skill matches
   * @param total Total number of skills in job
   * @returns Percentage rounded to nearest integer
   */
  private calculatePercentage(
    verified: number,
    unverified: number,
    total: number,
  ): number {
    if (total === 0) {
      return 0;
    }

    const numerator = 2 * verified + 1 * unverified;
    const denominator = 2 * total;
    const percentage = (numerator / denominator) * 100;

    // Round to nearest integer
    return Math.round(percentage);
  }

  /**
   * Get detailed skill match information between job and user
   * @param jobId Job ID
   * @param userId User ID
   * @returns Detailed skill match information with categorized skills
   */
  async getSkillMatchDetail(
    jobId: string,
    userId: string,
  ): Promise<SkillMatchDetailResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId },
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Check education-profession mapping FIRST (very dominant)
    // This takes priority even if job has no skills
    const educationMatchResult = await this.checkEducationProfessionMatch(jobId, userId);
    
    const user = await this.getUserWithRelations(userId);
    
    // If education match found, return 100% (very dominant - takes priority)
    if (educationMatchResult.isMatch) {
      // Get job skills and user skills for categorization (even if job has no skills)
      const jobSkills = this.hasJobSkills(job) 
        ? await this.getSkills(job.skill_ids)
        : [];
      const userSkills = await this.getUserSkillsWithRelations(userId);
      
      const { verifiedMatchSkills, unverifiedMatchSkills, unmatchedJobSkills } =
        this.categorizeSkills(jobSkills, userSkills);

      return {
        job_name: toTitleCase(job.title),
        percentage: 100,
        is_education_match: educationMatchResult.isEducationMatch,
        user: this.buildUserInfo(user),
        verified_match_skills: verifiedMatchSkills,
        unverified_match_skills: unverifiedMatchSkills,
        unmatched_job_skills: unmatchedJobSkills,
      };
    }

    // Handle case when job has no skills and no education match
    if (!this.hasJobSkills(job)) {
      return this.buildNoSkillsResponse(job, user, educationMatchResult.isEducationMatch);
    }

    // Calculate skill match (education match not found, job has skills)
    const percentage = await this.calculateSkillMatch(jobId, userId);
    const jobSkills = await this.getSkills(job.skill_ids);
    const userSkills = await this.getUserSkillsWithRelations(userId);

    const { verifiedMatchSkills, unverifiedMatchSkills, unmatchedJobSkills } =
      this.categorizeSkills(jobSkills, userSkills);

    return {
      job_name: toTitleCase(job.title),
      percentage,
      is_education_match: educationMatchResult.isEducationMatch,
      user: this.buildUserInfo(user),
      verified_match_skills: verifiedMatchSkills,
      unverified_match_skills: unverifiedMatchSkills,
      unmatched_job_skills: unmatchedJobSkills,
    };
  }

  /**
   * Check if job has skills
   */
  private hasJobSkills(job: Job): boolean {
    return (
      job.skill_ids &&
      Array.isArray(job.skill_ids) &&
      job.skill_ids.length > 0
    );
  }

  /**
   * Get user entity with relations (region, userProfessions)
   */
  private async getUserWithRelations(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["region", "userProfessions", "userProfessions.profession"],
      order: {
        userProfessions: {
          updated_at: "DESC",
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Get user skills with skill relation loaded
   */
  private async getUserSkillsWithRelations(userId: string): Promise<UserSkill[]> {
    return await this.userSkillRepository.find({
      where: {
        user_id: userId,
        deleted_at: IsNull(),
      },
      relations: ["skill"],
    });
  }

  /**
   * Format user location from user entity
   */
  private formatUserLocation(user: User): string | null {
    if (user.is_outside_indo) {
      if (user.other_country && user.other_region) {
        return `${user.other_region}, ${user.other_country}`;
      }
      return user.other_country || user.other_region || null;
    }
    return user.region?.full_name || null;
  }

  /**
   * Get user occupation from professions
   */
  private getUserOccupation(user: User): string | null {
    if (!user.userProfessions || user.userProfessions.length === 0) {
      return null;
    }

    const professionNames = user.userProfessions
      .map((up) => up.profession?.name)
      .filter((name): name is string => !!name);

    if (professionNames.length === 0) {
      return null;
    }

    return professionNames.map((name) => toTitleCase(name)).join(", ");
  }

  /**
   * Build UserInfoDto from user entity
   */
  private buildUserInfo(user: User): UserInfoDto {
    return {
      user_id: user.id,
      name: user.full_name,
      location: this.formatUserLocation(user),
      photo_url: user.photo_url,
      occupation: this.getUserOccupation(user),
      is_school_verified: user.is_school_verified,
      is_skill_passport_verified: user.is_skill_passport_verified,
    };
  }

  /**
   * Build response when job has no skills (returns -1)
   */
  private buildNoSkillsResponse(
    job: Job,
    user: User,
    isEducationMatch: boolean = false,
  ): SkillMatchDetailResponseDto {
    return {
      job_name: toTitleCase(job.title),
      percentage: -1,
      is_education_match: isEducationMatch,
      user: this.buildUserInfo(user),
      verified_match_skills: [],
      unverified_match_skills: [],
      unmatched_job_skills: [],
    };
  }

  /**
   * Categorize skills into verified, unverified, and unmatched
   */
  private categorizeSkills(
    jobSkills: MstSkill[],
    userSkills: UserSkill[],
  ): {
    verifiedMatchSkills: string[];
    unverifiedMatchSkills: string[];
    unmatchedJobSkills: string[];
  } {
    const jobSkillMap = new Map<string, string>();
    const userSkillMap = new Map<string, UserSkill>();

    // Populate maps
    for (const skill of jobSkills) {
      jobSkillMap.set(skill.id, skill.name);
    }
    for (const userSkill of userSkills) {
      userSkillMap.set(userSkill.skill_id, userSkill);
    }

    // Categorize skills
    const verifiedMatchSkills: string[] = [];
    const unverifiedMatchSkills: string[] = [];
    const unmatchedJobSkills: string[] = [];

    for (const [skillId, skillName] of jobSkillMap.entries()) {
      const userSkill = userSkillMap.get(skillId);

      if (userSkill) {
        const isVerified =
          userSkill.is_verified === true ||
          userSkill.approval_state === ApprovalState.APPROVED;

        if (isVerified) {
          verifiedMatchSkills.push(skillName);
        } else {
          unverifiedMatchSkills.push(skillName);
        }
      } else {
        unmatchedJobSkills.push(skillName);
      }
    }

    return { verifiedMatchSkills, unverifiedMatchSkills, unmatchedJobSkills };
  }

  private async getSkills(skillIds: string[]): Promise<MstSkill[]> {
    return await this.mstSkillRepository.find({
      where: {
        id: In(skillIds),
      },
    });
  }
}

