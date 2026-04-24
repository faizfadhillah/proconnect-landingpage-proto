import { PartialType } from "@nestjs/swagger";
import { CreateInformalCertificateMappingDto } from "./create-informal-certificate-mapping.dto";

export class UpdateInformalCertificateMappingDto extends PartialType(
  CreateInformalCertificateMappingDto
) {}

