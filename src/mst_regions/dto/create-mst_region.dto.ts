// src/mst-regions/dto/create-mst-region.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  MaxLength,
  Length,
} from "class-validator";

export class CreateMstRegionDto {
  @ApiProperty({
    type: String,
    description: "Region Id",
    example: "13.71",
  })
  @IsString()
  @Length(1, 64)
  id!: string;

  @ApiProperty({
    type: String,
    description: "Region Name",
    example: "Kota Padang",
  })
  @IsString()
  @Length(3, 255)
  name!: string;

  @ApiProperty({
    type: String,
    description: "Region type",
    example: "city",
  })
  @IsString()
  @MaxLength(50)
  type!: string;

  @ApiProperty({
    type: String,
    required: false,
    description: "Parent region ID",
    example: "13",
  })
  @IsOptional()
  @IsString()
  @Length(0, 64)
  parent_id?: string;

  @ApiProperty({
    type: String,
    description: "Region FUll Name",
    example: "Kota Padang, Sumatera Barat",
  })
  @IsString()
  @IsOptional()
  @Length(0, 255)
  full_name!: string;
}
