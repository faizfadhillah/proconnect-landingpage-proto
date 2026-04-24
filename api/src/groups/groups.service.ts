import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateGroupsDto } from "./dto/create-groups.dto";
import { UpdateGroupsDto } from "./dto/update-groups.dto";
import { Groups } from "./entities/groups.entity";

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Groups)
    private groupsRepository: Repository<Groups>,
  ) {}

  async create(createGroupsDto: CreateGroupsDto): Promise<Groups> {
    const group = this.groupsRepository.create(createGroupsDto);
    return await this.groupsRepository.save(group);
  }

  async findAll(): Promise<Groups[]> {
    return await this.groupsRepository.find();
  }

  async findOne(id: string): Promise<Groups> {
    const group = await this.groupsRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  async update(id: string, updateGroupsDto: UpdateGroupsDto): Promise<Groups> {
    const group = await this.findOne(id);
    Object.assign(group, updateGroupsDto);
    return await this.groupsRepository.save(group);
  }

  async remove(id: string): Promise<void> {
    const result = await this.groupsRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
  }
}
