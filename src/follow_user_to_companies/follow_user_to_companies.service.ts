import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateFollowUserToCompaniesDto } from "./dto/create-follow_user_to_companies.dto";
import { UpdateFollowUserToCompaniesDto } from "./dto/update-follow_user_to_companies.dto";
import {
  FollowUserToCompanies,
} from "./entities/follow_user_to_companies.entity";

@Injectable()
export class FollowUserToCompaniesService {
  constructor(
    @InjectRepository(FollowUserToCompanies)
    private followUserToCompaniesRepository: Repository<FollowUserToCompanies>,
  ) {}

  async create(
    createFollowUserToCompaniesDto: CreateFollowUserToCompaniesDto,
  ): Promise<FollowUserToCompanies> {
    const followUserToCompanies = this.followUserToCompaniesRepository.create(
      createFollowUserToCompaniesDto,
    );
    return await this.followUserToCompaniesRepository.save(
      followUserToCompanies,
    );
  }

  async findAll(): Promise<FollowUserToCompanies[]> {
    return await this.followUserToCompaniesRepository.find();
  }

  async findOne(id: string): Promise<FollowUserToCompanies> {
    const followUserToCompanies =
      await this.followUserToCompaniesRepository.findOne({ where: { id } });
    if (!followUserToCompanies) {
      throw new NotFoundException(
        `FollowUserToCompanies with ID ${id} not found`,
      );
    }
    return followUserToCompanies;
  }

  async update(
    id: string,
    updateFollowUserToCompaniesDto: UpdateFollowUserToCompaniesDto,
  ): Promise<FollowUserToCompanies> {
    const followUserToCompanies = await this.findOne(id);
    Object.assign(followUserToCompanies, updateFollowUserToCompaniesDto);
    return await this.followUserToCompaniesRepository.save(
      followUserToCompanies,
    );
  }

  async remove(id: string): Promise<void> {
    const result = await this.followUserToCompaniesRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `FollowUserToCompanies with ID ${id} not found`,
      );
    }
  }
}
