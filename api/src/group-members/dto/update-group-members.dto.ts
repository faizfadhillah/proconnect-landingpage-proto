import { PartialType } from '@nestjs/mapped-types';
import { CreateGroupMembersDto } from './create-group-members.dto';

export class UpdateGroupMembersDto extends PartialType(CreateGroupMembersDto) {}