import { PartialType } from '@nestjs/mapped-types';
import { CreateFollowUserToCompaniesDto } from './create-follow_user_to_companies.dto';

export class UpdateFollowUserToCompaniesDto extends PartialType(CreateFollowUserToCompaniesDto) {}