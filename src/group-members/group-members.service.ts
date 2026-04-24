import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateGroupMembersDto } from "./dto/create-group-members.dto";
import { UpdateGroupMembersDto } from "./dto/update-group-members.dto";
import { GroupMembers } from "./entities/group-members.entity";

@Injectable()
export class GroupMembersService {
  constructor(
    @InjectRepository(GroupMembers)
    private groupMembersRepository: Repository<GroupMembers>,
  ) {}

  async create(
    createGroupMembersDto: CreateGroupMembersDto,
  ): Promise<GroupMembers> {
    const groupMember = this.groupMembersRepository.create(
      createGroupMembersDto,
    );
    return await this.groupMembersRepository.save(groupMember);
  }

  async findAll(): Promise<GroupMembers[]> {
    return await this.groupMembersRepository.find();
  }

  async findOne(id: string): Promise<GroupMembers> {
    const groupMember = await this.groupMembersRepository.findOne({
      where: { id },
    });
    if (!groupMember) {
      throw new NotFoundException(`Group Member with ID ${id} not found`);
    }
    return groupMember;
  }

  async update(
    id: string,
    updateGroupMembersDto: UpdateGroupMembersDto,
  ): Promise<GroupMembers> {
    const groupMember = await this.findOne(id);
    Object.assign(groupMember, updateGroupMembersDto);
    return await this.groupMembersRepository.save(groupMember);
  }

  async remove(id: string): Promise<void> {
    const result = await this.groupMembersRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Group Member with ID ${id} not found`);
    }
  }
}
