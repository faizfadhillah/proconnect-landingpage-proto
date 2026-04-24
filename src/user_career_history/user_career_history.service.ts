// src\user_career_history\user_career_history.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserCareerHistoryDto } from "./dto/create-user_career_history.dto";
import { UpdateUserCareerHistoryDto } from "./dto/update-user_career_history.dto";
import { UserCareerHistory } from "./entities/user_career_history.entity";
import { MstProfession } from "../mst_professions/entities/mst_profession.entity";
import { UserProfession } from "src/user_professions/entities/user_profession.entity";
import { CreateUserProfessionDto } from "src/user_professions/dto/create-user_profession.dto";

@Injectable()
export class UserCareerHistoryService {
  constructor(
    @InjectRepository(UserCareerHistory)
    private userCareerHistoryRepository: Repository<UserCareerHistory>,

    @InjectRepository(MstProfession)
    private mstProfession: Repository<MstProfession>,

    @InjectRepository(UserProfession)
    private userProfessionRepository: Repository<UserProfession>,
  ) {}

  async create(
    createUserCareerHistoryDto: CreateUserCareerHistoryDto,
  ): Promise<UserCareerHistory> {
    const defaultProfession = await this.mstProfession
      .createQueryBuilder("profession")
      .where("LOWER(profession.name) = LOWER(:name)", { name: "others" })
      .getOne();
    createUserCareerHistoryDto.profession_id =
      createUserCareerHistoryDto.profession_id ||
      (defaultProfession ? defaultProfession.id : null);
    const userCareerHistory = this.userCareerHistoryRepository.create(
      createUserCareerHistoryDto,
    );
    const result =
      await this.userCareerHistoryRepository.save(userCareerHistory);
    await this.updateUserProfession(result.user_id);
    return result;
  }

  async findOne(id: string): Promise<UserCareerHistory> {
    const userCareerHistory = await this.userCareerHistoryRepository.findOne({
      where: { id: id },
    });
    if (!userCareerHistory) {
      throw new NotFoundException(`UserCareerHistory with ID ${id} not found`);
    }
    return userCareerHistory;
  }

  async update(
    id: string,
    updateUserCareerHistoryDto: UpdateUserCareerHistoryDto,
  ): Promise<UserCareerHistory> {
    const userCareerHistory = await this.findOne(id);
    Object.assign(userCareerHistory, updateUserCareerHistoryDto);
    const result =
      await this.userCareerHistoryRepository.save(userCareerHistory);
    await this.updateUserProfession(result.user_id);
    return result;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userCareerHistoryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserCareerHistory with ID ${id} not found`);
    }
  }

  async updateUserProfession(user_id: string) {
    const histories = await this.userCareerHistoryRepository.findBy({
      user_id: user_id,
    });

    for (const history of histories) {
      const existingProfession = await this.userProfessionRepository.findOne({
        where: { user_id: user_id, profession_id: history.profession_id },
      });

      if (existingProfession) {
        // Update the existing record if necessary
        existingProfession.profession_id = history.profession_id;
        await this.userProfessionRepository.save(existingProfession);
      } else {
        // Insert a new record
        const dto = new CreateUserProfessionDto();
        dto.user_id = user_id;
        dto.profession_id = history.profession_id;
        const newUserProfession = this.userProfessionRepository.create(dto);
        await this.userProfessionRepository.save(newUserProfession);
      }
    }
  }
}
