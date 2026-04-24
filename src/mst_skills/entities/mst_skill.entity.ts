// src\mst_skills\entities\mst_skill.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '../../base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('mst_skills')
export class MstSkill extends BaseEntity {
  @ApiProperty({
    description: 'The unique identifier of the skill',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'The name of the skill',
    example: 'JavaScript',
    maxLength: 255
  })
  @Column({ length: 255 })
  name: string;
}
