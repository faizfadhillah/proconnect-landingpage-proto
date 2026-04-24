// src/mst-regions/dto/update-mst-region.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateMstRegionDto } from './create-mst_region.dto';

export class UpdateMstRegionDto extends PartialType(CreateMstRegionDto) {}
