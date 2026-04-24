import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserProfessionDto {
  @ApiProperty({
    type: String,
    description: 'The id of the user',
    example: '12345678-1234-1234-1234-1234567890ab',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: 'The id of the profession',
    example: '98765432-9876-9876-9876-987654321098',
  })
  @IsUUID()
  profession_id: string;
}
