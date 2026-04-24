import { BaseEntity } from "../../base.entity";
import { ApiProperty } from "@nestjs/swagger";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { UserProfession } from "src/user_professions/entities/user_profession.entity";
import { UserSubscription } from "../../user_subscription/entities/user_subscription.entity";
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { UserSkill } from "src/user_skills/entities/user_skill.entity";
import { UserSkillPassport } from "../../user_skill_passports/entities/user_skill_passport.entity";
import { UserSalaryCountry } from "src/user_salary_country/entities/user_salary_country.entity";
import { UserRightToWork } from "../../user_right_to_work/entities/user-right-to-work.entity";
import { UserLanguage } from "src/user_languages/entities/user_language.entity";
import { UserInterest } from "src/user_interests/entities/user_interest.entity";
import { UserFile } from "src/user_files/entities/user_file.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { UserCertificate } from "src/user_certificates/entities/user_certificates.entity";
import { UserCareerHistory } from "src/user_career_history/entities/user_career_history.entity";
import { UpdateUserDto } from "../dto/update-user.dto";
import { EncryptedUserData } from "src/encrypted_user_data/entities/encrypted_user_data.entity";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  CANDIDATE = "candidate",
  COMPANY = "company",
}

export enum CompanyRole {
  OWNER = "owner",
  HRD = "hrd",
  MEMBER = "member",
}

export enum UserGender {
  MALE = "male",
  FEMALE = "female",
  NON_BINARY = "non-binary",
}

@Entity("users")
export class User extends BaseEntity {
  @ApiProperty({
    type: String,
    description: "The photo profile URL",
    example: "http://image.png",
  })
  @Column()
  photo_url: string;

  @ApiProperty({
    type: String,
    description: "The full name of the user",
    example: "John Doe",
  })
  @Column()
  full_name: string;

  @ApiProperty({
    type: String,
    description: "The email address of the user",
    example: "user@example.com",
  })
  @Column()
  email: string;

  @ApiProperty({
    type: String,
    description: "The role of the user",
    example: "user",
    enum: UserRole,
  })
  @Column({ type: "enum", enum: UserRole })
  user_role: UserRole;

  @ApiProperty({
    type: String,
    description: "The ID of the company the user belongs to",
    example: "12345678-1234-1234-1234-1234567890ab",
    nullable: true,
  })
  @Column({ type: "uuid", nullable: true })
  company_id: string | null;

  @ApiProperty({
    type: String,
    description: "The role of the user in the company",
    example: "member",
    enum: CompanyRole,
    nullable: true,
  })
  @Column({ type: "enum", enum: CompanyRole, nullable: true })
  company_role: CompanyRole | null;

  @ApiProperty({
    type: String,
    description: "The gender of the user",
    example: "male",
    enum: UserGender,
  })
  @Column({ type: "enum", enum: UserGender })
  gender: UserGender;

  @ApiProperty({
    type: String,
    description: "The birth year",
    example: 2001,
  })
  @Column("int")
  birth_year: number;

  @ApiProperty({
    type: String,
    description: "The ID of the region the user belongs to",
    example: "13.71",
    nullable: true,
  })
  @Column({ nullable: true })
  region_id: string | null;

  @ManyToOne(() => MstRegion, { nullable: true })
  @JoinColumn({ name: "region_id" })
  region: MstRegion;

  @ApiProperty({
    type: Boolean,
    description: "is outside indo",
    example: false,
  })
  @Column({ default: false })
  is_outside_indo: boolean;

  @ApiProperty({
    type: String,
    description: "The other country out of indonesia",
    example: "US",
    nullable: true,
  })
  @Column({ length: 128, nullable: true })
  other_country: string | null;

  @ApiProperty({
    type: String,
    description: "The other region out of indonesia",
    example: "California",
    nullable: true,
  })
  @Column({ length: 512, nullable: true })
  other_region: string | null;

  @ApiProperty({
    type: String,
    description: "The postal code of indonesia",
    example: "27172",
    nullable: true,
  })
  @Column({ length: 16, nullable: true })
  postal_code: string | null;

  @ApiProperty({
    type: String,
    description: "The last 4 digits of the user's phone number",
    example: "6789",
    nullable: true,
  })
  @Column({ length: 4, nullable: true })
  phone_last_4_digits: string | null;

  @ApiProperty({
    type: String,
    description: "The personal summary of the user",
    example: "I am a software engineer with 5 years of experience.",
    nullable: true,
  })
  @Column({ type: "text", nullable: true })
  personal_summary: string | null;

  /*@ApiProperty({
    type: "array",
    description: "The language of the user",
    example: [
      {
        languageId: 1,
        name: "English",
        proficiencyLevel: "Professional Working",
        variant: "US English",
        isPreferred: true,
      },
      {
        languageId: 2,
        name: "Indonesian",
        proficiencyLevel: "Native/Bilingual",
        variant: "Bahasa Indonesia",
        isPreferred: false,
      },
    ],
    nullable: true,
  })
  @Column({ type: "jsonb", nullable: true })
  language: object | null;*/

  @ApiProperty({
    type: String,
    description: "The availability of the user",
    example: "2 weeks",
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  availability: string | null;

  @ApiProperty({
    type: String,
    description: "The domicilie status of the user",
    example: "full-time, contract",
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  employment_status: string | null;

  @ApiProperty({
    type: String,
    description: "The domicile status of the user",
    example: "on-site, remote",
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  domicile_status: string | null;

  @ApiProperty({
    type: String,
    description: "The preferred work types of the user",
    example: "project management, software development",
    nullable: true,
  })
  @Column({ length: 100, nullable: true })
  preferred_work_types: string | null;

  @ApiProperty({
    type: "object",
    description: "The preferred locations of the user",
    example: [{ city: "New York", state: "New York", country: "USA" }],
    nullable: true,
  })
  @Column({ type: "jsonb", nullable: true })
  preferred_locations: object | null;

  @ApiProperty({
    type: String,
    description: "The salary expectation of the user",
    example: "100000",
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  salary_expectation: string | null;

  /*@ApiProperty({
    type: String,
    description: "The classification of interest of the user",
    example: "software engineer",
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  classification_of_interest: string | null;*/

  @ApiProperty({
    type: String,
    description: "The Firebase UID of the user",
    example: "mXM8iPgjXSPno1D0f7oVO5csZao1",
    uniqueItems: true,
  })
  @Column({ unique: true })
  firebase_uid: string;

  @ApiProperty({
    type: Boolean,
    description: "status email verified",
    example: false,
  })
  @Column({ default: false })
  is_email_verified: boolean;

  @ApiProperty({
    type: Boolean,
    description: "status phone number verified",
    example: false,
  })
  @Column({ default: false })
  is_phone_verified: boolean;

  @ApiProperty({
    type: Boolean,
    description: "status school verified",
    example: false,
  })
  @Column({ default: false })
  is_school_verified: boolean;

  @ApiProperty({
    type: Boolean,
    description: "status skill passport verified",
    example: false,
  })
  @Column({ default: false })
  is_skill_passport_verified: boolean;

  @ApiProperty({
    type: String,
    description: "the roles of rbac",
    example: "sys_admin",
  })
  @Column("jsonb")
  roles: any;

  @ApiProperty({
    type: String,
    description: "The last wizard state",
    example: 0,
  })
  @Column("int")
  last_wizard_state: number;

  @ApiProperty({
    type: "object",
    description: "The wizard state",
    example: {},
  })
  @Column("jsonb")
  wizard_state: any;

  /*@ApiProperty({
    type: Boolean,
    description: "is active workspace",
    example: false,
  })
  @Column({ default: false })
  is_active_workspace: boolean;*/

  @ManyToOne(() => MstCompany, (model) => model.id)
  @JoinColumn({ name: "company_id" })
  company: MstCompany;

  @OneToMany(() => UserSubscription, (model) => model.user)
  @ApiProperty({ type: () => UserSubscription, isArray: true })
  userSubscriptions: UserSubscription[];

  @OneToMany(() => UserSkill, (model) => model.user)
  @ApiProperty({ type: () => UserSkill, isArray: true })
  userSkills: UserSkill[];

  @OneToMany(() => UserSkillPassport, (model) => model.user)
  @ApiProperty({ type: () => UserSkillPassport, isArray: true })
  userSkillPassports: UserSkillPassport[];

  @OneToMany(() => UserSalaryCountry, (model) => model.user)
  @ApiProperty({ type: () => UserSalaryCountry, isArray: true })
  userSalaryCountries: UserSalaryCountry[];

  @OneToMany(() => UserRightToWork, (model) => model.user)
  @ApiProperty({ type: () => UserRightToWork, isArray: true })
  userRightToWorks: UserRightToWork[];

  @OneToMany(() => UserProfession, (model) => model.user)
  @ApiProperty({ type: () => UserProfession, isArray: true })
  userProfessions: UserProfession[];

  @OneToMany(() => UserLanguage, (model) => model.user)
  @ApiProperty({ type: () => UserLanguage, isArray: true })
  userLanguages: UserLanguage[];

  @OneToMany(() => UserInterest, (model) => model.user)
  @ApiProperty({ type: () => UserInterest, isArray: true })
  userInterests: UserInterest[];

  @OneToMany(() => UserFile, (model) => model.user)
  @ApiProperty({ type: () => UserFile, isArray: true })
  userFiles: UserFile[];

  @OneToMany(() => UserEducation, (model) => model.user)
  @ApiProperty({ type: () => UserEducation, isArray: true })
  userEducations: UserEducation[];

  @OneToMany(() => UserCertificate, (model) => model.user)
  @ApiProperty({ type: () => UserCertificate, isArray: true })
  userCertificates: UserCertificate[];

  @OneToMany(() => UserCareerHistory, (model) => model.user)
  @ApiProperty({ type: () => UserCareerHistory, isArray: true })
  userCareerHistories: UserCareerHistory[];

  @OneToOne(() => EncryptedUserData, (encrypted) => encrypted.user)
  encryptedUserData: EncryptedUserData;

  static fromUpdateUserDto(user: User, updateUserDto: UpdateUserDto): User {
    Object.assign(user, updateUserDto);
    delete user.roles; // not used

    // if user_role is candidate, set company_id to null
    if (user.user_role === UserRole.CANDIDATE) {
      user.company_id = null;
      user.company_role = null;
    }

    return user;
  }
}
