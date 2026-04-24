import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateEventPaketDto } from "./dto/create-event_paket.dto";
import { UpdateEventPaketDto } from "./dto/update-event_paket.dto";
import { EventPaket } from "./entities/event_paket.entity";

@Injectable()
export class EventPaketsService {
  constructor(
    @InjectRepository(EventPaket)
    private eventPaketRepository: Repository<EventPaket>,
  ) {}

  async create(createEventPaketDto: CreateEventPaketDto): Promise<EventPaket> {
    const eventPaket = this.eventPaketRepository.create(createEventPaketDto);
    return await this.eventPaketRepository.save(eventPaket);
  }

  async findAll(): Promise<EventPaket[]> {
    return await this.eventPaketRepository.find();
  }

  async findOne(id: string): Promise<EventPaket> {
    const eventPaket = await this.eventPaketRepository.findOne({
      where: { id },
    });
    if (!eventPaket) {
      throw new NotFoundException(`EventPaket with ID ${id} not found`);
    }
    return eventPaket;
  }

  async update(
    id: string,
    updateEventPaketDto: UpdateEventPaketDto,
  ): Promise<EventPaket> {
    const eventPaket = await this.findOne(id);
    Object.assign(eventPaket, updateEventPaketDto);
    return await this.eventPaketRepository.save(eventPaket);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventPaketRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`EventPaket with ID ${id} not found`);
    }
  }
}
