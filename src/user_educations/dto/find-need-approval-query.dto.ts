import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber, IsEnum, Min, IsArray, ValidateNested, IsString, IsUUID } from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApprovalState } from "src/common/enums/approval-state.enum";

export class FindNeedApprovalFiltersDto {
  @ApiProperty({
    description: "Filter by approval state(s). Must be an array. Defaults to [WAITING_APPROVAL] if not provided.",
    enum: ApprovalState,
    isArray: true,
    example: [ApprovalState.APPROVED, ApprovalState.REJECT],
    required: false,
    default: [ApprovalState.WAITING_APPROVAL],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ApprovalState, { each: true })
  @Type(() => String)
  approval_state?: ApprovalState[];

  @ApiProperty({
    description: "Filter by school ID",
    example: "123e4567-e89b-12d3-a456-426614174002",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  school_id?: string;

  @ApiProperty({
    description: "Filter by major ID",
    example: "123e4567-e89b-12d3-a456-426614174003",
    required: false,
  })
  @IsOptional()
  @IsUUID()
  major_id?: string;

  @ApiProperty({
    description: "Filter by student ID (case-insensitive partial match)",
    example: "1312022008",
    required: false,
  })
  @IsOptional()
  @IsString()
  student_id?: string;
}

export class FindNeedApprovalQueryDto {
  @ApiProperty({
    description: "Page number",
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: "Items per page. Use -1 for no limit",
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: "Filters object. Can be passed as JSON string in query parameter: ?filters={\"approval_state\":[\"APPROVED\",\"REJECT\"]}",
    type: FindNeedApprovalFiltersDto,
    required: false,
    example: { approval_state: [ApprovalState.APPROVED, ApprovalState.REJECT] },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FindNeedApprovalFiltersDto)
  @Transform(({ value }) => {
    let parsedValue: any;
    
    if (typeof value === "string") {
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        return value;
      }
    } else {
      parsedValue = value;
    }
    
    // If filters object doesn't have approval_state or it's empty, set default
    if (parsedValue && typeof parsedValue === "object") {
      if (!parsedValue.approval_state || (Array.isArray(parsedValue.approval_state) && parsedValue.approval_state.length === 0)) {
        parsedValue.approval_state = [ApprovalState.WAITING_APPROVAL];
      }
    }
    
    return parsedValue;
  })
  filters?: FindNeedApprovalFiltersDto;
}
