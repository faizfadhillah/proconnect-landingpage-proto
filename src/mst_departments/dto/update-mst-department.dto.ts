import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, IsEnum } from "class-validator";
import { DepartmentFlag, DepartmentStatus } from "../entities/mst_department.entity";

export class UpdateMstDepartmentDto {
    @ApiPropertyOptional({
        description: "Department code (abbreviation, max 10 characters)",
        example: "HR",
        maxLength: 10,
    })
    @IsOptional()
    @IsString({ message: "Department code must be a string" })
    @MaxLength(10, { message: "Department code cannot exceed 10 characters" })
    dept_code?: string;

    @ApiPropertyOptional({
        description: "Department name (max 255 characters)",
        example: "Human Resource",
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: "Department name must be a string" })
    @MaxLength(255, { message: "Department name cannot exceed 255 characters" })
    dept_name?: string;

    @ApiPropertyOptional({
        description: "Department flag",
        example: DepartmentFlag.PRIVATE,
        enum: DepartmentFlag,
    })
    @IsOptional()
    @IsEnum(DepartmentFlag)
    flag?: DepartmentFlag;

    @ApiPropertyOptional({
        description: "Department status",
        example: DepartmentStatus.PUBLISHED,
        enum: DepartmentStatus,
    })
    @IsOptional()
    @IsEnum(DepartmentStatus)
    status?: DepartmentStatus;
}