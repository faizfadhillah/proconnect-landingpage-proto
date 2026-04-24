// src\user_educations\dto\update-user_education.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserEducationDto } from "./create-user_education.dto";

export class UpdateUserEducationDto extends PartialType(CreateUserEducationDto) {}
