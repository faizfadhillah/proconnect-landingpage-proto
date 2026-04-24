// src/company_files.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateCompanyFileDto } from "./dto/create-company_file.dto";
import { UpdateCompanyFileDto } from "./dto/update-company_file.dto";
import { CompanyFile } from "./entities/company_file.entity";

@Injectable()
export class CompanyFilesService {
  constructor(
    @InjectRepository(CompanyFile)
    private companyFileRepository: Repository<CompanyFile>,
  ) {}

  async create(
    createCompanyFileDto: CreateCompanyFileDto,
  ): Promise<CompanyFile> {
    const companyFile = this.companyFileRepository.create(createCompanyFileDto);
    return await this.companyFileRepository.save(companyFile);
  }

  async findAll(): Promise<CompanyFile[]> {
    return await this.companyFileRepository.find();
  }

  async findOne(id: string): Promise<CompanyFile> {
    const companyFile = await this.companyFileRepository.findOne({
      where: { id },
    });
    if (!companyFile) {
      throw new NotFoundException(`CompanyFile with ID ${id} not found`);
    }
    return companyFile;
  }

  async update(
    id: string,
    updateCompanyFileDto: UpdateCompanyFileDto,
  ): Promise<CompanyFile> {
    const companyFile = await this.findOne(id);
    Object.assign(companyFile, updateCompanyFileDto);
    return await this.companyFileRepository.save(companyFile);
  }

  async remove(id: string): Promise<void> {
    const result = await this.companyFileRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`CompanyFile with ID ${id} not found`);
    }
  }

  async findByCompanyId(company_id: string): Promise<CompanyFile[]> {
    const companyFiles = await this.companyFileRepository.findBy({
      company_id: company_id,
    });
    if (!companyFiles) {
      throw new NotFoundException(
        `CompanyFile(s) with company_id ${company_id} not found`,
      );
    }
    return companyFiles;
  }
}
