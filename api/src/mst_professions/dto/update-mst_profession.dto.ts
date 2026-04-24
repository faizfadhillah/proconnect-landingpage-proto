// src\mst_professions\dto\update-mst_profession.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstProfessionDto } from "./create-mst_profession.dto";

export class UpdateMstProfessionDto extends PartialType(
  CreateMstProfessionDto,
) {}
