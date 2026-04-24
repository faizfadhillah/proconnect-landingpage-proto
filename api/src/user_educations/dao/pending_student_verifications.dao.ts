import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, ILike } from "typeorm";
import { PendingStudentVerification } from "../entities/pending_student_verification.entity";
import { UserEducation } from "../entities/user_education.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { CreatePendingStudentVerificationDto } from "../dto/create-pending_student_verification.dto";

@Injectable()
export class PendingStudentVerificationsDao {
  constructor(
    @InjectRepository(PendingStudentVerification)
    private readonly pendingRepo: Repository<PendingStudentVerification>,
    @InjectRepository(UserEducation)
    private readonly educationRepo: Repository<UserEducation>,
    @InjectRepository(MstSchool)
    private readonly schoolRepo: Repository<MstSchool>,
  ) { }

  async findEducationByStudentAndSchool(
    student_id: string,
    school_id: string,
    user_id?: string,
  ): Promise<UserEducation | null> {
    if (!student_id || !school_id) return null;
    
    // Try exact match first (faster)
    const whereCondition: any = { student_id, school_id };
    if (user_id) {
      whereCondition.user_id = user_id;
    }
    
    let education = await this.educationRepo.findOne({
      where: whereCondition,
      withDeleted: false,
    });
    
    // If not found, try with trimmed values (handle whitespace issues)
    if (!education) {
      const queryBuilder = this.educationRepo
        .createQueryBuilder("ue")
        .where("TRIM(ue.student_id) = TRIM(:student_id)", { student_id: String(student_id).trim() })
        .andWhere("ue.school_id = :school_id", { school_id })
        .andWhere("ue.deleted_at IS NULL");
      
      if (user_id) {
        queryBuilder.andWhere("ue.user_id = :user_id", { user_id });
      }
      
      education = await queryBuilder.getOne();
    }
    
    return education;
  }

  async findPendingByStudentSchoolMajorDegreeDiploma(
    student_id: string,
    school_id: string,
    major_id: string | null,
    degree: string,
    diploma_level: string | null,
  ): Promise<PendingStudentVerification | null> {
    if (!student_id || !school_id || !major_id || !degree) return null;
    return this.pendingRepo.findOne({
      where: { student_id, school_id, major_id, degree, diploma_level },
    });
  }

  async findPendingById(id: string): Promise<PendingStudentVerification | null> {
    if (!id) return null;
    return this.pendingRepo.findOne({ where: { id } });
  }

  createPending(
    dto: CreatePendingStudentVerificationDto,
    major_id: string | null,
  ): PendingStudentVerification {
    return this.pendingRepo.create({ ...dto, major_id });
  }

  async savePending(
    entity: PendingStudentVerification,
  ): Promise<PendingStudentVerification> {
    return this.pendingRepo.save(entity);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.pendingRepo.softDelete(id);
  }

  async findSchoolByName(name: string): Promise<MstSchool | null> {
    if (!name) return null;
    return this.schoolRepo.findOne({ 
      where: { name: ILike(name) } 
    });
  }

  async findSchoolById(id: string): Promise<MstSchool | null> {
    if (!id) return null;
    return this.schoolRepo.findOne({
      where: { id, deleted_at: IsNull() },
    });
  }

  async findPendingByEmail(email: string): Promise<PendingStudentVerification[]> {
    if (!email) return [];
    return this.pendingRepo.find({
      where: { email: ILike(email), deleted_at: IsNull() },
      relations: ["school", "majorEntity"],
    });
  }

  async findAllPendingWithEmailNotNull(): Promise<PendingStudentVerification[]> {
    return this.pendingRepo
      .createQueryBuilder("pending")
      .where("pending.email IS NOT NULL")
      .andWhere("pending.email != ''")
      .getMany();
  }

  async findEducationsByUserId(userId: string): Promise<UserEducation[]> {
    if (!userId) return [];
    return this.educationRepo.find({
      where: { user_id: userId },
      withDeleted: false,
    });
  }

  async saveEducation(education: UserEducation): Promise<UserEducation> {
    return this.educationRepo.save(education);
  }
}

