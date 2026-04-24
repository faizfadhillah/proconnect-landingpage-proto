import { BaseEntity } from "../../base.entity";
import { Column, ManyToOne, JoinColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsString, IsDateString, IsOptional, IsEnum } from "class-validator";
import { MstProfession } from "../../mst_professions/entities/mst_profession.entity";
import { User } from "../../users/entities/user.entity";
import { MstCompany } from "../../mst_companies/entities/mst_company.entity";
import { MstDepartment } from "../../mst_departments/entities/mst_department.entity";
import { MstSchool } from "../../mst_schools/entities/mst_school.entity";
import { UserRoleAssignmentStatus, UserRoleAssignmentRole, UserRoleAssignmentCompanyRole } from "../enums/user_role_assignment.enums";

export abstract class UserRoleAssignmentBase extends BaseEntity {
  @ApiProperty({
    description: "User ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ApiProperty({
    description: "Company HQ ID (nullable if role is not EMPLOYER)",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @Column({ name: "company_hq_id", type: "uuid", nullable: true })
  companyHqId: string | null;

  @ManyToOne(() => MstCompany, { nullable: true })
  @JoinColumn({ name: "company_hq_id" })
  companyHq: MstCompany | null;

  @ApiProperty({
    description: "Company ID (nullable if role is not EMPLOYER)",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @Column({ name: "company_id", type: "uuid", nullable: true })
  companyId: string | null;

  @ManyToOne(() => MstCompany, { nullable: true })
  @JoinColumn({ name: "company_id" })
  company: MstCompany | null;

  @ApiProperty({
    description: "Department ID (nullable if role is not EMPLOYER)",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @Column({ name: "dept_id", type: "uuid", nullable: true })
  deptId: string | null;

  @ManyToOne(() => MstDepartment, { nullable: true })
  @JoinColumn({ name: "dept_id" })
  department: MstDepartment | null;

  @ApiProperty({
    description: "Company role (nullable if role is not EMPLOYER)",
    example: UserRoleAssignmentCompanyRole.OWNER_HQ,
    enum: UserRoleAssignmentCompanyRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRoleAssignmentCompanyRole)
  @Column({ name: "company_role", type: "varchar", length: 50, nullable: true })
  companyRole: UserRoleAssignmentCompanyRole | null;

  @ApiProperty({
    description: "Role",
    example: UserRoleAssignmentRole.EMPLOYER,
    enum: UserRoleAssignmentRole,
  })
  @IsEnum(UserRoleAssignmentRole)
  @Column({ name: "role", type: "varchar", length: 50 })
  role: UserRoleAssignmentRole;

  @ApiProperty({
    description: "School ID (required when role is PIC_SCHOOL)",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @Column({ name: "school_id", type: "uuid", nullable: true })
  schoolId: string | null;

  @ManyToOne(() => MstSchool, { nullable: true })
  @JoinColumn({ name: "school_id" })
  school: MstSchool | null;

  @ApiProperty({
    description: "Start date",
    example: "2023-01-01",
  })
  @IsDateString()
  @Column({ name: "start_date", type: "date", nullable: true })
  startDate: Date | null;

  @ApiProperty({
    description: "End date (null if active)",
    example: "2023-12-31",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Column({ name: "end_date", type: "date", nullable: true })
  endDate: Date | null;

  @ApiProperty({
    description: "Status",
    example: UserRoleAssignmentStatus.ACTIVE,
    enum: UserRoleAssignmentStatus,
  })
  @IsEnum(UserRoleAssignmentStatus)
  @Column({ name: "status", type: "varchar", length: 20 })
  status: UserRoleAssignmentStatus;

  @ApiProperty({
    description: "Employment type",
    example: "Full-time",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Column({ name: "employment_type", type: "varchar", length: 50, nullable: true })
  employmentType: string | null;

  @ApiProperty({
    description: "Profession ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  @Column({ name: "profession_id", type: "uuid", nullable: true })
  professionId: string | null;

  @ManyToOne(() => MstProfession, { nullable: true })
  @JoinColumn({ name: "profession_id" })
  profession: MstProfession | null;
}