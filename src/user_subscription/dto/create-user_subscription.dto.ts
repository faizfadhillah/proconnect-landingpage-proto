import { IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserSubscriptionDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the user',
    example: '12345678-1234-1234-1234-1234567890ab',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: 'The ID of the subscription',
    example: '87654321-4321-4321-4321-9876543210ab',
  })
  @IsUUID()
  subscription_id: string;

  @ApiProperty({
    type: String,
    description: 'The start date of the subscription',
    example: '2023-10-01T00:00:00.000Z',
  })
  @IsDateString()
  start_date?: Date;

  @ApiProperty({
    type: String,
    description: 'The end date of the subscription',
    example: '2024-10-01T00:00:00.000Z',
  })
  @IsDateString()
  end_date?: Date;
}