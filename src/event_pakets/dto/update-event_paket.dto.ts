import { PartialType } from '@nestjs/mapped-types';
import { CreateEventPaketDto } from './create-event_paket.dto';

export class UpdateEventPaketDto extends PartialType(CreateEventPaketDto) {}