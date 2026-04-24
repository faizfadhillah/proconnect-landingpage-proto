// src\user_files\user_files.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserFileDto } from "./dto/create-user_file.dto";
import { UpdateUserFileDto } from "./dto/update-user_file.dto";
import { UserFile } from "./entities/user_file.entity";

@Injectable()
export class UserFilesService {
  constructor(
    @InjectRepository(UserFile)
    private userFileRepository: Repository<UserFile>,
  ) {}

  async create(createUserFileDto: CreateUserFileDto): Promise<UserFile> {
    const userFile = this.userFileRepository.create(createUserFileDto);
    return await this.userFileRepository.save(userFile);
  }

  async findAll(): Promise<UserFile[]> {
    return await this.userFileRepository.find();
  }

  async findOne(id: string): Promise<UserFile> {
    const userFile = await this.userFileRepository.findOne({ where: { id } });
    if (!userFile) {
      throw new NotFoundException(`UserFile with ID ${id} not found`);
    }
    return userFile;
  }

  async update(
    id: string,
    updateUserFileDto: UpdateUserFileDto,
  ): Promise<UserFile> {
    const userFile = await this.findOne(id);
    Object.assign(userFile, updateUserFileDto);
    return await this.userFileRepository.save(userFile);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userFileRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserFile with ID ${id} not found`);
    }
  }

  async findByUserId(user_id: string): Promise<UserFile[]> {
    const userFiles = await this.userFileRepository.findBy({
      user_id: user_id,
    });
    if (!userFiles) {
      throw new NotFoundException(
        `UserFile(s) with user_id ${user_id} not found`,
      );
    }
    return userFiles;
  }
}
