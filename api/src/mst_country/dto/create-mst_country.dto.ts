import { IsBoolean, IsOptional, IsString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstCountryDto {
  @ApiProperty({
    type: String,
    description: "The name of the country",
    example: "Indonesia",
  })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    description: "The code of the country",
    example: "ID",
  })
  @IsString()
  @IsOptional()
  code: string;

  @ApiProperty({
    description: "The dial code of the country",
    example: "+62",
  })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  dial_code: string;

  @ApiProperty({
    description: "The emoji of the country",
    example: "🇮🇩",
  })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  flag_emoji: string;

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
    description: "The status of the country",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_salary_active: boolean;
}
