import { ApiProperty } from '@nestjs/swagger';

export class CompanyMetricsResponseDto {
  @ApiProperty({
    description: 'Total unique users in the scope',
    example: 150,
  })
  total_users: number;

  @ApiProperty({
    description: 'Total unique branches in the scope',
    example: 5,
  })
  total_branches: number;

  @ApiProperty({
    description: 'Total unique departments in the scope',
    example: 20,
  })
  total_departments: number;
}