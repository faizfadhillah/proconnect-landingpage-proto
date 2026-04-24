import {
  IsString,
  Length,
  IsOptional,
  IsEnum,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { RbacMethod, RbacType } from "../entities/rbac.entity";

export class CreateRbacDto {
  @ApiProperty({
    type: String,
    description: "The name of the role",
    example: "Admin",
  })
  @IsString()
  @Length(2, 255)
  name: string;

  @ApiProperty({
    type: String,
    description: "The name of the role",
    example: "Admin",
  })
  @IsOptional()
  @Length(0, 255)
  role_permission: string;

  @ApiProperty({
    type: String,
    description: "The type of the role",
    example: "routes",
    enum: RbacType,
  })
  @IsEnum(RbacType)
  type?: RbacType;

  @ApiProperty({
    type: String,
    description: "The method of the role",
    example: "POST",
    enum: RbacMethod,
  })
  @IsOptional()
  @IsEnum(RbacMethod)
  method: RbacMethod;

  @ApiProperty({
    type: String,
    description: "The permissions associated with the role",
    example: '["read", "write", "delete"]',
  })
  @IsOptional()
  meta: any;

  @ApiProperty({
    type: String,
    description: "The description of the role",
    example: "Owner of HQ",
    maxLength: 255,
  })
  @IsString()
  @Length(0, 255)
  description: string;
}
