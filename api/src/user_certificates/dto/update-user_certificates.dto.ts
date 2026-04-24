// src\user_Certificates\dto\update-user_Certificate.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserCertificateDto } from "./create-user_certificates.dto";

export class UpdateUserCertificateDto extends PartialType(CreateUserCertificateDto) {}
