// src\user_professions\dto\update-user_profession.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfessionDto } from './create-user_profession.dto';

export class UpdateUserProfessionDto extends PartialType(CreateUserProfessionDto) {}
