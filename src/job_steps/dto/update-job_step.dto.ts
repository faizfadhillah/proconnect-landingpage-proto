import { PartialType } from "@nestjs/mapped-types";
import { CreateJobStepDto } from "./create-job_step.dto";
import { IsEnum, IsString, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { JobStepsStatus } from "../entities/job_step.entity";

export class UpdateJobStepDto extends PartialType(CreateJobStepDto) {
  @ApiProperty({
    type: String,
    description: "DETAIL_FULLFILLMENT, QUESTIONNAIRE, INTERVIEW",
    example: "DETAIL_FULLFILLMENT",
    required: true,
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: String,
    description: "The name of the job step",
    example: "Academic & Professional Experience",
    required: true,
  })
  @IsString()
  step_name: string;

  @ApiProperty({
    type: Number,
    description: "The order of the step in the job",
    example: 1,
    required: true,
  })
  @IsNumber()
  step_order: number;

  @ApiProperty({
    type: String,
    enum: JobStepsStatus,
    description: "The status of the job step",
    example: JobStepsStatus.SUBMITTED,
    required: true,
  })
  @IsEnum(JobStepsStatus)
  status?: JobStepsStatus;

  /*
  @ApiProperty({
    type: String,
    description: 'Notes for the job step',
    example: 'Initial step to extract data from source',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
  */

  @ApiProperty({
    type: Object,
    description: "Attributes for the job step in JSON format",
    example: [
      {
        id: "1",
        name: "PERSONAL_RESUME",
        state: "1",
        Notes: "Upload CV dalam bentuk pdf",
      },
      {
        id: "2",
        name: "CAREER_HISTORY",
        state: "1",
        Notes: "Pengalaman kerja di perhotelan min 2 tahun",
      },
      {
        id: "3",
        name: "EDUCATION_HISTORY",
        state: "1",
        Notes:
          "Diutamakan latar belakang pendidikan dari jurusan perhotelan atau sejenis",
      },
      {
        id: "4",
        name: "LICENSE_CERTIFICATE",
        state: "0",
        Notes: null,
      },
      {
        id: "5",
        name: "SKILL_LANGUAGE",
        state: "0",
        Notes: null,
      },
      {
        id: "6",
        name: "WORK_PREFERENCE",
        state: "1",
        Notes: "Diutamakan ON-SITE",
      },
      {
        id: "7",
        name: "RIGHT_TO_WORK",
        state: "1",
        Notes:
          "Diutamakan memiliki kewarganegaraan Indonesia atau izin bekerja di Indonesia",
      },
      {
        id: "8",
        name: "INTEREST",
        state: "0",
        Notes: null,
      },
      {
        id: "9",
        name: "SALARY_EXPECTATION",
        state: "1",
        Notes: "Salary yang ditawarkan dalam mata uang Rupiah (IDR) per-bulan",
      },
      {
        id: "10",
        name: "ASEAN_SKILL_PASSPORT",
        state: "1",
        Notes: "Diutamakan memiliki ASEAN SKILL PASSPORT",
      },
    ],
    required: true,
  })
  @IsOptional()
  attributes: any;
}
