// src\applicant-legal-files\dto\update-applicant-legal-file.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateApplicantLegalFileDto } from "./create-applicant-legal-file.dto";

export class UpdateApplicantLegalFileDto extends PartialType(
  CreateApplicantLegalFileDto,
) {}
