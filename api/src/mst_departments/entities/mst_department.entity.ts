import { BaseEntity } from "../../base.entity";
import { Entity, Column } from "typeorm";
import {
    IsString,
    IsEnum,
    IsOptional,
} from "class-validator";

export enum DepartmentFlag {
    GLOBAL = "GLOBAL",
    PRIVATE = "PRIVATE",
}

export enum DepartmentStatus {
    PUBLISHED = "PUBLISHED",
    UNPUBLISHED = "UNPUBLISHED",
}

@Entity("mst_departments")
export class MstDepartment extends BaseEntity {
    @IsOptional()
    @IsString()
    @Column({ type: "varchar", length: 10, nullable: true })
    dept_code: string;

    @IsString()
    @Column({ type: "varchar", length: 255 })
    dept_name: string;

    @IsOptional()
    @IsEnum(DepartmentFlag)
    @Column({
        type: "enum",
        enum: DepartmentFlag,
        default: DepartmentFlag.PRIVATE,
    })
    flag: DepartmentFlag;

    @IsOptional()
    @IsEnum(DepartmentStatus)
    @Column({
        type: "enum",
        enum: DepartmentStatus,
        default: DepartmentStatus.PUBLISHED,
    })
    status: DepartmentStatus;
}