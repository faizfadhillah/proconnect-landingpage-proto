import { PartialType } from '@nestjs/mapped-types';
import { CreateFollowUserToUserDto } from './create-follow_user_to_user.dto';

export class UpdateFollowUserToUserDto extends PartialType(CreateFollowUserToUserDto) {}