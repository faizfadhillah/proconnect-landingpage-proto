import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserRightToWorkDto } from "./dto/create-user-right-to-work.dto";
import { UpdateUserRightToWorkDto } from "./dto/update-user-right-to-work.dto";
import { UserRightToWork } from "./entities/user-right-to-work.entity";

@Injectable()
export class UserRightToWorkService {
  constructor(
    @InjectRepository(UserRightToWork)
    private userRightToWorkRepository: Repository<UserRightToWork>,
  ) {}

  async create(
    createUserRightToWorkDto: CreateUserRightToWorkDto,
  ): Promise<UserRightToWork> {
    const userRightToWork = this.userRightToWorkRepository.create(
      createUserRightToWorkDto,
    );
    return await this.userRightToWorkRepository.save(userRightToWork);
  }

  async findAll(): Promise<UserRightToWork[]> {
    return await this.userRightToWorkRepository.find();
  }

  async findOne(id: string): Promise<UserRightToWork> {
    const userRightToWork = await this.userRightToWorkRepository.findOne({
      where: { id },
    });
    if (!userRightToWork) {
      throw new NotFoundException(`UserRightToWork with ID ${id} not found`);
    }
    return userRightToWork;
  }

  async update(
    id: string,
    updateUserRightToWorkDto: UpdateUserRightToWorkDto,
  ): Promise<UserRightToWork> {
    const userRightToWork = await this.findOne(id);
    Object.assign(userRightToWork, updateUserRightToWorkDto);
    return await this.userRightToWorkRepository.save(userRightToWork);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRightToWorkRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserRightToWork with ID ${id} not found`);
    }
  }
}
