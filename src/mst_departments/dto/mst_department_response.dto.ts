import { ApiProperty } from "@nestjs/swagger";

export class MstDepartmentResponseDto {
    @ApiProperty({
        description: "Department ID",
        example: "12345678-1234-1234-1234-1234567890ab",
    })
    id: string;

    @ApiProperty({
        description: "Department code (abbreviation)",
        example: "HR",
    })
    dept_code: string;

    @ApiProperty({
        description: "Department name",
        example: "Human Resource",
    })
    dept_name: string;

    @ApiProperty({
        description: "Creation timestamp",
        example: "2025-01-01T00:00:00.000Z",
    })
    created_at: Date;

    @ApiProperty({
        description: "Last update timestamp",
        example: "2025-01-01T00:00:00.000Z",
    })
    updated_at: Date;
}