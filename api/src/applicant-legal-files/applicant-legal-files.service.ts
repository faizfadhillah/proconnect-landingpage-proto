// src\applicant-legal-files\applicant-legal-files.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateApplicantLegalFileDto } from "./dto/create-applicant-legal-file.dto";
import { UpdateApplicantLegalFileDto } from "./dto/update-applicant-legal-file.dto";
import {
  ApplicantLegalFile,
} from "./entities/applicant-legal-file.entity";

@Injectable()
export class ApplicantLegalFilesService {
  constructor(
    @InjectRepository(ApplicantLegalFile)
    private applicantLegalFileRepository: Repository<ApplicantLegalFile>,
  ) {}

  async create(
    createApplicantLegalFileDto: CreateApplicantLegalFileDto,
  ): Promise<ApplicantLegalFile> {
    const applicantLegalFile = this.applicantLegalFileRepository.create(
      createApplicantLegalFileDto,
    );
    return await this.applicantLegalFileRepository.save(applicantLegalFile);
  }

  async findAll(): Promise<ApplicantLegalFile[]> {
    return await this.applicantLegalFileRepository.find();
  }

  async findByApplicantId(applicantId: string): Promise<ApplicantLegalFile[]> {
    const applicantLegalFiles = await this.applicantLegalFileRepository.findBy({
      applicant_id: applicantId,
    });
    if (!applicantLegalFiles?.length) {
      throw new NotFoundException(
        `Legal files for applicant ${applicantId} not found`,
      );
    }
    return applicantLegalFiles;
  }

  async update(
    applicantId: string,
    updateApplicantLegalFileDto: UpdateApplicantLegalFileDto,
  ): Promise<ApplicantLegalFile> {
    const applicantLegalFile = await this.findByApplicantId(applicantId);
    Object.assign(applicantLegalFile[0], updateApplicantLegalFileDto);
    return await this.applicantLegalFileRepository.save(applicantLegalFile[0]);
  }

  async remove(applicantId: string): Promise<void> {
    const result = await this.applicantLegalFileRepository.softDelete({
      applicant_id: applicantId,
    });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Legal files for applicant ${applicantId} not found`,
      );
    }
  }
}
