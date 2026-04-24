import { IsNumber, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserSalaryCountryDto {
  @ApiProperty({
    type: String,
    description: "The id of the user",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the SalaryCountry",
    example: "87654321-4321-4321-4321-ba0987654321",
  })
  @IsUUID()
  salary_country_id: string;

  @ApiProperty({
    type: String,
    description: "The min of the SalaryCountry",
    example: "100000",
  })
  @IsNumber()
  min_salary: number;

  @ApiProperty({
    type: String,
    description: "The max of the SalaryCountry",
    example: "150000",
  })
  @IsNumber()
  max_salary: number;
}
