// src\mst_educations\dto\update-mst_education.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstSchoolDto } from "./create-mst_school.dto";

export class UpdateMstSchoolDto extends PartialType(CreateMstSchoolDto) {}
