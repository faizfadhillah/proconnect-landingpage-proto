import { ApiProperty } from "@nestjs/swagger";
import { MstCompany } from "../entities/mst_company.entity";
import { MstDepartmentResponseDto } from "../../mst_departments/dto/mst_department_response.dto";

export class MstCompanyResponseDto extends MstCompany {
    @ApiProperty({
        description: "List of departments assigned to this company",
        type: [MstDepartmentResponseDto],
        example: [
            {
                id: "12345678-1234-1234-1234-1234567890ab",
                dept_code: "HR",
                dept_name: "Human Resource",
                created_at: "2025-01-01T00:00:00.000Z",
                updated_at: "2025-01-01T00:00:00.000Z"
            },
            {
                id: "87654321-4321-4321-4321-0987654321ba",
                dept_code: "IT",
                dept_name: "Information Technology",
                created_at: "2025-01-01T00:00:00.000Z",
                updated_at: "2025-01-01T00:00:00.000Z"
            }
        ]
    })
    departments: MstDepartmentResponseDto[];

    @ApiProperty({
        description: "Count of published jobs for this company when showAvailableJobCount=true",
        example: 5,
        required: false,
    })
    available_job_count?: number;
}
