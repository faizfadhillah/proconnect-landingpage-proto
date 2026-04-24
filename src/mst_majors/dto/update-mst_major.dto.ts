import { PartialType } from "@nestjs/swagger";
import { CreateMstMajorDto } from "./create-mst_major.dto";

export class UpdateMstMajorDto extends PartialType(CreateMstMajorDto) {}