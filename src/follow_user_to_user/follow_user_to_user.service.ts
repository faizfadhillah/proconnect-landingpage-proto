import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateFollowUserToUserDto } from "./dto/create-follow_user_to_user.dto";
import { UpdateFollowUserToUserDto } from "./dto/update-follow_user_to_user.dto";
import {
  FollowUserToUser,
} from "./entities/follow_user_to_user.entity";

@Injectable()
export class FollowUserToUserService {
  constructor(
    @InjectRepository(FollowUserToUser)
    private followUserToUserRepository: Repository<FollowUserToUser>,
  ) {}

  async create(
    createFollowUserToUserDto: CreateFollowUserToUserDto,
  ): Promise<FollowUserToUser> {
    const followUserToUser = this.followUserToUserRepository.create(
      createFollowUserToUserDto,
    );
    return await this.followUserToUserRepository.save(followUserToUser);
  }

  async findAll(): Promise<FollowUserToUser[]> {
    return await this.followUserToUserRepository.find();
  }

  async findOne(id: string): Promise<FollowUserToUser> {
    const followUserToUser = await this.followUserToUserRepository.findOne({
      where: { id },
    });
    if (!followUserToUser) {
      throw new NotFoundException(`FollowUserToUser with ID ${id} not found`);
    }
    return followUserToUser;
  }

  async update(
    id: string,
    updateFollowUserToUserDto: UpdateFollowUserToUserDto,
  ): Promise<FollowUserToUser> {
    const followUserToUser = await this.findOne(id);
    Object.assign(followUserToUser, updateFollowUserToUserDto);
    return await this.followUserToUserRepository.save(followUserToUser);
  }

  async remove(id: string): Promise<void> {
    const result = await this.followUserToUserRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`FollowUserToUser with ID ${id} not found`);
    }
  }
}
