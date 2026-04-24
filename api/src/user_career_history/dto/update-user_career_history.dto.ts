// src\user_career_history\dto\update-user_career_history.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserCareerHistoryDto } from './create-user_career_history.dto';

export class UpdateUserCareerHistoryDto extends PartialType(CreateUserCareerHistoryDto) {}
