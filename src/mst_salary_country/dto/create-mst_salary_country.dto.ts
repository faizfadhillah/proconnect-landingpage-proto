import { IsBoolean, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstSalaryCountryDto {
  @ApiProperty({
    type: String,
    description: "The name of the salary country",
    example: "Indonsia",
  })
  @IsString()
  @Length(3, 100)
  country_name: string;

  @ApiProperty({
    description: "The code of the curency",
    example: "IDR",
  })
  @IsString()
  @Length(1, 10)
  currency_code: string;

  @ApiProperty({
    description: "The symbol of the currency",
    example: "Rp",
  })
  @IsString()
  @Length(1, 100)
  currency_symbol: string;

  @ApiProperty({
    description: "The status of the salary country",
    example: true,
  })
  @IsBoolean()
  is_salary_active: boolean;
}
