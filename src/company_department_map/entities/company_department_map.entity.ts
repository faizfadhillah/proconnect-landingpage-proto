import { BaseEntity } from "../../base.entity";
import { Entity, Column } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

@Entity("company_department_map")
export class CompanyDepartmentMap extends BaseEntity {
  @ApiProperty({
    description: "Company HQ ID",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @Column("uuid")
  company_hq_id: string;

  @ApiProperty({
    description: "Company ID (specific company/branch)",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @Column("uuid")
  company_id: string;

  @ApiProperty({
    description: "Department ID",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @Column("uuid")
  dept_id: string;
}