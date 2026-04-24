import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsUUID,
  Validate,
  Length,
} from "class-validator";
import { IsForeignKey } from "src/app/validators/is-foreign-key";
import { IsUnique } from "src/app/validators/is-unique";

export class CreateMstRightToWorkDto {
  @ApiProperty({
    description: "The ID of the SalaryCountry",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  @IsUUID()
  @Validate(IsForeignKey, ["mst_salary_country", "id"])
  salary_country_id: string;

  @ApiProperty({
    example: "RTW-001",
  })
  @IsString()
  @Length(3, 50)
  @Validate(IsUnique, ["mst_right_to_works", "code"])
  code: string;

  @ApiProperty({
    example: "Kartu Izin Tinggal Terbatas (KITAS)",
  })
  @Validate(IsUnique, ["mst_right_to_works", "name"])
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    type: String,
    example: "Description of right to work",
  })
  @IsOptional()
  @IsString()
  description: string;
}
