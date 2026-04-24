import { PartialType } from "@nestjs/mapped-types";
import { CreateMstAspCompetencyDto } from "./create-mst_asp_competency.dto";

export class UpdateMstAspCompetencyDto extends PartialType(
  CreateMstAspCompetencyDto,
) {}
