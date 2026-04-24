import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Request,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { FieldsService } from "./fields.service";
import { User } from "src/users/entities/user.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { Config } from "src/config/entities/config.entity";
import { GroupMembers } from "src/group-members/entities/group-members.entity";
import { Groups } from "src/groups/entities/groups.entity";
import { FollowUserToCompanies } from "src/follow_user_to_companies/entities/follow_user_to_companies.entity";
import { MstTag } from "src/mst_tags/entities/mst_tag.entity";
import { EventPaket } from "src/event_pakets/entities/event_paket.entity";
import { Event } from "src/events/entities/event.entity";
import { UserSubscription } from "src/user_subscription/entities/user_subscription.entity";
import { MstSubscription } from "src/mst_subscription/entities/mst_subscription.entity";
import { InvoicesItem } from "src/invoices_items/entities/invoices_item.entity";
import { Invoice } from "src/invoices/entities/invoice.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { UserProfession } from "src/user_professions/entities/user_profession.entity";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";
import { Rbac } from "src/rbac/entities/rbac.entity";
import { UserSkill } from "src/user_skills/entities/user_skill.entity";
import { MstSkill } from "src/mst_skills/entities/mst_skill.entity";
import { UserCareerHistory } from "src/user_career_history/entities/user_career_history.entity";
import { UserSkillPassport } from "src/user_skill_passports/entities/user_skill_passport.entity";
import { Job } from "src/jobs/entities/job.entity";
import { ApplicantLegalFile } from "src/applicant-legal-files/entities/applicant-legal-file.entity";
import { ApplicantStep } from "src/applicant-steps/entities/applicant-step.entity";
import { Applicant } from "src/applicants/entities/applicant.entity";
import { CompanyFile } from "src/company_files/entities/company_file.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { MstLanguage } from "src/mst_languages/entities/mst_language.entity";
import { UserRightToWork } from "src/user_right_to_work/entities/user-right-to-work.entity";
import { MstRightToWork } from "src/mst_right_to_works/entities/mst_right_to_work.entity";
import { UserFile } from "src/user_files/entities/user_file.entity";
import { EncryptedUserData } from "src/encrypted_user_data/entities/encrypted_user_data.entity";
import { Post } from "src/posts/entities/post.entity";
import { FollowUserToUser } from "src/follow_user_to_user/entities/follow_user_to_user.entity";
import { MstInterest } from "src/mst_interests/entities/mst_interest.entity";
import { MstSalaryCountry } from "src/mst_salary_country/entities/mst_salary_country.entity";
import { UserInterest } from "src/user_interests/entities/user_interest.entity";
import { UserSalaryCountry } from "src/user_salary_country/entities/user_salary_country.entity";
import { MstAspCompetency } from "src/mst_asp_competencies/entities/mst_asp_competency.entity";
import { Feedback } from "src/feedbacks/entities/feedback.entity";
import { MstIndustry } from "src/mst_industries/entities/mst_industry.entity";
import { UserCertificate } from "src/user_certificates/entities/user_certificates.entity";
import { UserLanguage } from "src/user_languages/entities/user_language.entity";
import { MstCountry } from "src/mst_country/entities/mst_country.entity";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";
import { Questionnaire } from "src/questionnaires/entities/questionnaire.entity";
import { QuestionnaireAnswer } from "src/questionnaire_answers/entities/questionnaire_answer.entity";
import { JobStep } from "src/job_steps/entities/job_step.entity";
import { MstDepartment } from "src/mst_departments/entities/mst_department.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";
import { MstSchoolMajor } from "src/mst_school_majors/entities/mst_school_major.entity";
import { MstLicense } from "src/mst_licenses/entities/mst_license.entity";
import { MstEducationLicenseMapping } from "src/mst_education_license_mappings/entities/mst_education_license_mapping.entity";
import { MstEducationProfessionMapping } from "src/mst_education_profession_mappings/entities/mst_education_profession_mapping.entity";
import { MstLicenseSkillMapping } from "src/mst_license_skill_mappings/entities/mst_license_skill_mapping.entity";

@ApiTags("fields")
@Controller("fields")
@ApiBearerAuth()
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get("entities")
  async getEntities(@Request() req) {
    const entities = [
      {
        name: "group-members",
        title: "Group Members",
        subtitle: "Manage group members",
        icon: "mdi-account-group",
        backgroundColor: "#FF5733", // Vibrant Orange
        group: "User Management",
      },
      {
        name: "groups",
        title: "Groups",
        subtitle: "Manage groups",
        icon: "mdi-account-multiple",
        backgroundColor: "#33FF57", // Fresh Green
        group: "User Management",
      },
      {
        name: "follow-user-to-companies",
        title: "Follow User to Companies",
        subtitle: "Manage user-company follows",
        icon: "mdi-domain",
        backgroundColor: "#3357FF", // Bright Blue
        group: "User Management",
      },
      {
        name: "follow-user-to-user",
        title: "Follow User to User",
        subtitle: "Manage user follows",
        icon: "mdi-account-multiple-plus",
        backgroundColor: "#FF33A1", // Vivid Pink
        group: "User Management",
      },
      {
        name: "mst-tags",
        title: "Tags",
        subtitle: "Manage tags",
        icon: "mdi-tag",
        backgroundColor: "#33FFF5", // Aqua
        group: "Metadata",
      },
      {
        name: "event-pakets",
        title: "Event Pakets",
        subtitle: "Manage event packages",
        icon: "mdi-package-variant",
        backgroundColor: "#FF8C33", // Soft Orange
        group: "Events",
      },
      {
        name: "user-subscription",
        title: "User Subscription",
        subtitle: "Manage user subscriptions",
        icon: "mdi-bell-ring",
        backgroundColor: "#8C33FF", // Purple
        group: "Subscription",
      },
      {
        name: "mst-subscription",
        title: "Subscription",
        subtitle: "Manage subscriptions",
        icon: "mdi-package-variant-closed-check",
        backgroundColor: "#FF3333", // Red
        group: "Subscription",
      },
      {
        name: "events",
        title: "Events",
        subtitle: "Manage events",
        icon: "mdi-calendar",
        backgroundColor: "#33FF8C", // Mint Green
        group: "Events",
      },
      {
        name: "posts",
        title: "Posts",
        subtitle: "Manage posts",
        icon: "mdi-post-outline",
        backgroundColor: "#FFC133", // Golden Yellow
        group: "Content",
      },
      {
        name: "feedbacks",
        title: "Feedbacks",
        subtitle: "Manage feedbacks",
        icon: "mdi-comment-alert",
        backgroundColor: "#AAC135", // Golden Yellow
        group: "Content",
      },
      {
        name: "invoice-items",
        title: "Invoice Items",
        subtitle: "Manage invoice items",
        icon: "mdi-receipt",
        backgroundColor: "#33D1FF", // Sky Blue
        group: "Finance",
      },
      {
        name: "invoices",
        title: "Invoices",
        subtitle: "Manage invoices",
        icon: "mdi-file-document-outline",
        backgroundColor: "#FF5733", // Vibrant Orange
        group: "Finance",
      },
      {
        name: "user-educations",
        title: "User Educations",
        subtitle: "Manage user educations",
        icon: "mdi-school",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Education",
      },
      {
        name: "mst-schools",
        title: "Schools",
        subtitle: "Manage master schools",
        icon: "mdi-book",
        backgroundColor: "#3357FF", // Bright Blue
        group: "Education",
      },
      {
        name: "user-professions",
        title: "User Professions",
        subtitle: "Manage user professions",
        icon: "mdi-briefcase",
        backgroundColor: "#FF33A1", // Vivid Pink
        group: "Profession",
      },
      {
        name: "mst-professions",
        title: "Professions",
        subtitle: "Manage professions",
        icon: "mdi-briefcase-outline",
        backgroundColor: "#33FFF5", // Aqua
        group: "Profession",
      },
      {
        name: "rbac",
        title: "RBAC",
        subtitle: "Manage RBAC",
        icon: "mdi-shield-key",
        backgroundColor: "#FF8C33", // Soft Orange
        group: "Security",
      },
      {
        name: "job-skills",
        title: "Job Skills",
        subtitle: "Manage job skills",
        icon: "mdi-hammer-wrench",
        backgroundColor: "#8C33FF", // Purple
        group: "Skills",
      },
      {
        name: "user-skills",
        title: "User Skills",
        subtitle: "Manage user skills",
        icon: "mdi-account-cog",
        backgroundColor: "#FF3333", // Red
        group: "Skills",
      },
      {
        name: "mst-asp-competencies",
        title: "ASP Competencies",
        subtitle: "Manage Asean ProConnect Competencies",
        icon: "mdi-account-cog",
        backgroundColor: "#FF7733", // Red
        group: "Skills",
      },
      {
        name: "mst-skills",
        title: "Skills",
        subtitle: "Manage skills",
        icon: "mdi-lightbulb-on-outline",
        backgroundColor: "#33FF8C", // Mint Green
        group: "Skills",
      },
      {
        name: "user-career-history",
        title: "User Career History",
        subtitle: "Manage user career history",
        icon: "mdi-history",
        backgroundColor: "#FFC133", // Golden Yellow
        group: "Career",
      },
      {
        name: "user-skill-passports",
        title: "User Skill Passports",
        subtitle: "Manage user skill-passports",
        icon: "mdi-certificate",
        backgroundColor: "#33D1FF", // Sky Blue
        group: "Skills",
      },
      {
        name: "user-certificates",
        title: "User Licence/Certificates",
        subtitle: "Manage user licence/certificates",
        icon: "mdi-certificate",
        backgroundColor: "#99D100", // Sky Blue
        group: "Skills",
      },
      {
        name: "jobs",
        title: "Jobs",
        subtitle: "Manage jobs",
        icon: "mdi-briefcase-check",
        backgroundColor: "#FF5733", // Vibrant Orange
        group: "Career",
      },
      {
        name: "applicant-legal-files",
        title: "Applicant Legal Files",
        subtitle: "Manage applicant legal files",
        icon: "mdi-file-lock",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Legal",
      },
      {
        name: "applicant-steps",
        title: "Applicant Steps",
        subtitle: "Manage applicant steps",
        icon: "mdi-step-forward",
        backgroundColor: "#3357FF", // Bright Blue
        group: "Application Process",
      },
      {
        name: "applicants",
        title: "Applicants",
        subtitle: "Manage applicants",
        icon: "mdi-account-search",
        backgroundColor: "#FF33A1", // Vivid Pink
        group: "Application Process",
      },
      {
        name: "company-files",
        title: "Company Files",
        subtitle: "Manage company files",
        icon: "mdi-file-cabinet",
        backgroundColor: "#33FFF5", // Aqua
        group: "Company",
      },
      {
        name: "mst-industries",
        title: "Industries",
        subtitle: "Manage Industries",
        icon: "mdi-robot-industrial",
        backgroundColor: "#998C33", // Soft Orange
        group: "Company",
      },
      {
        name: "mst-companies",
        title: "Companies",
        subtitle: "Manage companies",
        icon: "mdi-domain",
        backgroundColor: "#FF8C33", // Soft Orange
        group: "Company",
      },
      {
        name: "mst-departments",
        title: "Departments",
        subtitle: "Manage departments",
        icon: "mdi-account-group",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Company",
      },
      {
        name: "mst-regions",
        title: "Regions",
        subtitle: "Manage regions data",
        icon: "mdi-map-marker",
        backgroundColor: "#8C33FF", // Purple
        group: "Geography",
      },
      {
        name: "mst-languages",
        title: "Languages",
        subtitle: "Manage languages",
        icon: "mdi-translate",
        backgroundColor: "#FF3333", // Red
        group: "Geography",
      },
      {
        name: "user-languages",
        title: "User Languages",
        subtitle: "Manage User languages",
        icon: "mdi-translate",
        backgroundColor: "#AA3399", // Red
        group: "Geography",
      },
      {
        name: "mst-interests",
        title: "Interests",
        subtitle: "Manage interests",
        icon: "mdi-heart",
        backgroundColor: "#FF5733", // Orange-Red
        group: "Interests",
      },
      {
        name: "user-interests",
        title: "User Interests",
        subtitle: "Manage user interests",
        icon: "mdi-account-heart",
        backgroundColor: "#33FF57", // Green
        group: "Interests",
      },
      {
        name: "mst-salary-country",
        title: "Salary by Country",
        subtitle: "Manage salary data by country",
        icon: "mdi-currency-usd",
        backgroundColor: "#3333FF", // Blue
        group: "Salary",
      },
      {
        name: "mst-country",
        title: "Country",
        subtitle: "Manage country data",
        icon: "mdi-flag",
        backgroundColor: "#FF33A1", // Red
        group: "Geography",
      },
      {
        name: "user-salary-country",
        title: "User Salary by Country",
        subtitle: "Manage user salary data by country",
        icon: "mdi-account-cash",
        backgroundColor: "#FF33A1", // Pink
        group: "Salary",
      },
      {
        name: "user-right-to-works",
        title: "User Right to Works",
        subtitle: "Manage user right to works",
        icon: "mdi-check-circle",
        backgroundColor: "#33FF8C", // Mint Green
        group: "Legal",
      },
      {
        name: "job-steps",
        title: "Job Steps",
        subtitle: "Manage job steps",
        icon: "mdi-briefcase-check",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Application Process",
      },
      {
        name: "applicant-job-steps",
        title: "Applicant Job Steps",
        subtitle: "Manage applicant job steps",
        icon: "mdi-briefcase-check",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Application Process",
      },
      {
        name: "questionnaires",
        title: "Questionnaires",
        subtitle: "Manage questionnaires",
        icon: "mdi-form-select",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Application Process",
      },
      {
        name: "questionnaire-answers",
        title: "Questionnaire Answers",
        subtitle: "Manage questionnaire answers",
        icon: "mdi-video",
        backgroundColor: "#33FF57", // Fresh Green
        group: "Application Process",
      },
      {
        name: "mst-right-to-works",
        title: "Right to Works",
        subtitle: "Manage right to works",
        icon: "mdi-check-circle-outline",
        backgroundColor: "#FFC133", // Golden Yellow
        group: "Legal",
      },
      {
        name: "user-files",
        title: "User Files",
        subtitle: "Manage user files",
        icon: "mdi-file",
        backgroundColor: "#33D1FF", // Sky Blue
        group: "Files",
      },
      {
        name: "encrypted-user-data",
        title: "Encrypted User Data",
        subtitle: "Manage encrypted user data",
        icon: "mdi-lock",
        backgroundColor: "#FF5733", // Vibrant Orange
        group: "Security",
      },
      {
        name: "users",
        title: "Users",
        subtitle: "Manage user data",
        icon: "mdi-account",
        backgroundColor: "#33FF57", // Fresh Green
        group: "User Management",
      },
      {
        name: "configs",
        title: "Configs",
        subtitle: "System configurations",
        icon: "mdi-cog",
        backgroundColor: "#3357FF", // Bright Blue
        group: "Settings",
      },
      {
        name: "mst-majors",
        title: "Majors",
        subtitle: "Manage master majors",
        icon: "mdi-book-education",
        backgroundColor: "#FF5733",
        group: "Education",
      },
      {
        name: "mst-school-majors",
        title: "School Majors",
        subtitle: "Manage school majors mapping",
        icon: "mdi-school-outline",
        backgroundColor: "#33FF57",
        group: "Education",
      },
      {
        name: "mst-licenses",
        title: "Licenses",
        subtitle: "Manage professional licenses",
        icon: "mdi-certificate-outline",
        backgroundColor: "#8C33FF",
        group: "Skills",
      },
      {
        name: "mst-education-license-mappings",
        title: "Education License Mappings",
        subtitle: "Manage education to license mappings",
        icon: "mdi-link-variant",
        backgroundColor: "#FF6B33",
        group: "Data Mapping",
      },
      {
        name: "mst-education-profession-mappings",
        title: "Education Profession Mappings",
        subtitle: "Manage education to profession mappings",
        icon: "mdi-link-variant",
        backgroundColor: "#33FF6B",
        group: "Data Mapping",
      },
      {
        name: "mst-license-skill-mappings",
        title: "License Skill Mappings",
        subtitle: "Manage license to skill mappings",
        icon: "mdi-link-variant",
        backgroundColor: "#6B33FF",
        group: "Data Mapping",
      },
    ];
    let results = [];
    const access_roles = {
      admin: [
        "users",
        "companies",
        "configs",
        "encrypted-user-data",
        "user-files",
        "applicants",
        "jobs",
      ],
    };

    if (!req.user.isSysAdmin) {
      for (const key of Object.keys(access_roles)) {
        for (const entity of entities) {
          if (
            entity.name.includes("mst-") ||
            access_roles[key].includes(entity.name)
          ) {
            results.push(entity);
          }
        }
      }
    } else {
      results = entities;
    }

    return results;
  }

  @Get(":entity")
  getFields(@Param("entity") entity: string) {
    const entities = {
      "group-members": GroupMembers,
      groups: Groups,
      "follow-user-to-companies": FollowUserToCompanies,
      "follow-user-to-user": FollowUserToUser,
      "mst-tags": MstTag,
      "event-pakets": EventPaket,
      "user-subscription": UserSubscription,
      "mst-subscription": MstSubscription,
      events: Event,
      posts: Post,
      feedbacks: Feedback,
      "invoice-items": InvoicesItem,
      invoices: Invoice,
      "user-educations": UserEducation,
      "mst-schools": MstSchool,
      "user-professions": UserProfession,
      "mst-professions": MstProfession,
      rbac: Rbac,
      "user-skills": UserSkill,
      "mst-skills": MstSkill,
      "mst-interests": MstInterest,
      "mst-salary-country": MstSalaryCountry,
      "mst-country": MstCountry,
      "user-career-history": UserCareerHistory,
      "user-skill-passports": UserSkillPassport,
      "user-certificates": UserCertificate,
      jobs: Job,
      "applicant-legal-files": ApplicantLegalFile,
      "applicant-steps": ApplicantStep,
      applicants: Applicant,
      "company-files": CompanyFile,
      "mst-industries": MstIndustry,
      "mst-companies": MstCompany,
      "mst-departments": MstDepartment,
      "mst-regions": MstRegion,
      "mst-languages": MstLanguage,
      "mst-asp-competencies": MstAspCompetency,
      "user-right-to-works": UserRightToWork,
      "user-interests": UserInterest,
      "user-salary-country": UserSalaryCountry,
      "user-languages": UserLanguage,
      "mst-right-to-works": MstRightToWork,
      "user-files": UserFile,
      "encrypted-user-data": EncryptedUserData,
      "applicant-job-steps": ApplicantJobStep,
      "job-steps": JobStep,
      questionnaires: Questionnaire,
      "questionnaire-answers": QuestionnaireAnswer,
      users: User,
      configs: Config,
      "mst-majors": MstMajor,
      "mst-school-majors": MstSchoolMajor,
      "mst-licenses": MstLicense,
      "mst-education-license-mappings": MstEducationLicenseMapping,
      "mst-education-profession-mappings": MstEducationProfessionMapping,
      "mst-license-skill-mappings": MstLicenseSkillMapping,
    };
    if (!entities[entity]) {
      throw new NotFoundException(`The entity of ${entity} not found!`);
    }
    return this.fieldsService.generateFields(entities[entity]);
  }
}
