import { PartialType } from "@nestjs/mapped-types";
import { CreateMstTagDto } from "./create-mst_tag.dto";

export class UpdateMstTagDto extends PartialType(CreateMstTagDto) {}
