import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateApplicantStepDto } from "./dto/create-applicant-step.dto";
import { UpdateApplicantStepDto } from "./dto/update-applicant-step.dto";
import { ApplicantStep } from "./entities/applicant-step.entity";

@Injectable()
export class ApplicantStepsService {
  constructor(
    @InjectRepository(ApplicantStep)
    private applicantStepRepository: Repository<ApplicantStep>,
  ) {}

  async create(
    createApplicantStepDto: CreateApplicantStepDto,
  ): Promise<ApplicantStep> {
    const applicantStep = this.applicantStepRepository.create(
      createApplicantStepDto,
    );
    return await this.applicantStepRepository.save(applicantStep);
  }

  async findAll(): Promise<ApplicantStep[]> {
    return await this.applicantStepRepository.find();
  }

  async findOne(id: string): Promise<ApplicantStep> {
    const applicantStep = await this.applicantStepRepository.findOne({
      where: { applicant_id: id },
    });
    if (!applicantStep) {
      throw new NotFoundException(`ApplicantStep with ID ${id} not found`);
    }
    return applicantStep;
  }

  async update(
    id: string,
    updateApplicantStepDto: UpdateApplicantStepDto,
  ): Promise<ApplicantStep> {
    const applicantStep = await this.findOne(id);
    Object.assign(applicantStep, updateApplicantStepDto);
    return await this.applicantStepRepository.save(applicantStep);
  }

  async remove(id: string): Promise<void> {
    const result = await this.applicantStepRepository.softDelete({
      applicant_id: id,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`ApplicantStep with ID ${id} not found`);
    }
  }
}
