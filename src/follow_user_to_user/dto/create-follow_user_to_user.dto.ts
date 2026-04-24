import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FollowStatusEnum } from '../entities/follow_user_to_user.entity';

export class CreateFollowUserToUserDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the user',
    example: '12345678-1234-1234-1234-1234567890ab',
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: 'The ID of the following user',
    example: '12345678-1234-1234-1234-1234567890cd',
  })
  @IsUUID()
  following_id: string;

  @ApiProperty({
    enum: FollowStatusEnum,
    description: 'The status of the follow request',
    example: FollowStatusEnum.PENDING,
  })
  @IsEnum(FollowStatusEnum)
  status: FollowStatusEnum;
}