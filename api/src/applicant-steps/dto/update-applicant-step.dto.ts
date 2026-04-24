// src\applicant-steps\dto\update-applicant-step.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateApplicantStepDto } from "./create-applicant-step.dto";

export class UpdateApplicantStepDto extends PartialType(
  CreateApplicantStepDto,
) {}
