import { PartialType } from "@nestjs/swagger";
import { CreateMstLicenseDto } from "./create-mst_license.dto";

export class UpdateMstLicenseDto extends PartialType(CreateMstLicenseDto) {}