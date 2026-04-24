import { PartialType } from "@nestjs/swagger";
import { CreateMstSchoolMajorDto } from "./create-mst_school_major.dto";

export class UpdateMstSchoolMajorDto extends PartialType(CreateMstSchoolMajorDto) {}

