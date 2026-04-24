import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateQuestionnaireAnswerDto } from "./dto/create-questionnaire_answer.dto";
import { UpdateQuestionnaireAnswerDto } from "./dto/update-questionnaire_answer.dto";
import { QuestionnaireAnswer } from "./entities/questionnaire_answer.entity";
import { BasePagination } from "src/base.pagination";
import { ApplicantJobStep } from "src/applicant_job_steps/entities/applicant_job_step.entity";
import { BulkCreateQuestionnaireAnswerDto } from "./dto/bulk-create-questionnaire_answer.dto";
import { BulkUpdateQuestionnaireAnswerDto } from "./dto/bulk-update-questionnaire_answer.dto";

interface SearchQuestionnaireAnswersParams {
  id?: string;
  questionnaireId?: string;
  jobStepId?: string;
  applicantStepId?: string;
  no?: number;
  type?: string;
  question?: string;
  options?: string;
  value?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class QuestionnaireAnswersService {
  constructor(
    @InjectRepository(QuestionnaireAnswer)
    private questionnaireAnswerRepository: Repository<QuestionnaireAnswer>,
    @InjectRepository(ApplicantJobStep)
    private applicantJobStepRepository: Repository<ApplicantJobStep>,
  ) {}

  async create(
    createQuestionnaireAnswerDto: CreateQuestionnaireAnswerDto,
  ): Promise<QuestionnaireAnswer> {
    const questionnaireAnswer = this.questionnaireAnswerRepository.create(
      createQuestionnaireAnswerDto,
    );
    await this.validateAndProcessReferences(
      createQuestionnaireAnswerDto,
      questionnaireAnswer,
    );
    return await this.questionnaireAnswerRepository.save(questionnaireAnswer);
  }

  async update(
    id: string,
    updateQuestionnaireAnswerDto: UpdateQuestionnaireAnswerDto,
  ): Promise<QuestionnaireAnswer> {
    const questionnaireAnswer =
      await this.questionnaireAnswerRepository.findOne({ where: { id } });
    Object.assign(questionnaireAnswer, updateQuestionnaireAnswerDto);
    await this.validateAndProcessReferences(
      updateQuestionnaireAnswerDto,
      questionnaireAnswer,
    );
    return await this.questionnaireAnswerRepository.save(questionnaireAnswer);
  }

  async validateAndProcessReferences(
    dto: CreateQuestionnaireAnswerDto | UpdateQuestionnaireAnswerDto,
    questionnaireAnswer: QuestionnaireAnswer,
  ): Promise<void> {
    // Validate and process job_step_id
    if (dto.applicant_job_step_id) {
      const applicantJobStep = await this.applicantJobStepRepository.findOne({
        where: { id: dto.applicant_job_step_id },
      });
      if (!applicantJobStep) {
        throw new NotFoundException(
          `JobStep with ID ${dto.job_step_id} not found`,
        );
      }
      questionnaireAnswer.job_id = applicantJobStep.job_id;
      questionnaireAnswer.applicant_id = applicantJobStep.applicant_id;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.questionnaireAnswerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `QuestionnaireAnswer with ID ${id} not found`,
      );
    }
  }

  async search(
    params: SearchQuestionnaireAnswersParams,
  ): Promise<BasePagination<QuestionnaireAnswer>> {
    const {
      id,
      questionnaireId,
      jobStepId,
      applicantStepId,
      no,
      type,
      question,
      options,
      value,
      page = 1,
      limit = 10,
    } = params;

    const query = this.questionnaireAnswerRepository.createQueryBuilder(
      "questionnaire_answer",
    );

    // Add conditions based on provided parameters
    if (id) {
      query.andWhere("questionnaire_answer.id = :id", { id });
    }

    if (questionnaireId) {
      query.andWhere(
        "questionnaire_answer.questionnaire_id = :questionnaireId",
        { questionnaireId },
      );
    }

    if (jobStepId) {
      query.andWhere("questionnaire_answer.job_step_id = :jobStepId", {
        jobStepId,
      });
    }

    if (applicantStepId) {
      query.andWhere(
        "questionnaire_answer.applicant_job_step_id = :applicantStepId",
        { applicantStepId },
      );
    }

    if (no !== undefined) {
      query.andWhere("questionnaire_answer.no = :no", { no });
    }

    if (type) {
      query.andWhere("questionnaire_answer.type ILIKE :type", {
        type: `%${type}%`,
      });
    }

    if (question) {
      query.andWhere("questionnaire_answer.question ILIKE :question", {
        question: `%${question}%`,
      });
    }

    if (options) {
      query.andWhere("questionnaire_answer.options::text ILIKE :options", {
        options: `%${options}%`,
      }); // Assuming options is JSONB
    }

    if (value) {
      query.andWhere("questionnaire_answer.value::text ILIKE :value", {
        value: `%${value}%`,
      }); // Assuming value is JSONB
    }

    // Add pagination
    query.skip((page - 1) * limit).take(limit);

    // Add ordering
    query.orderBy("questionnaire_answer.no", "ASC");

    // Execute query and return results with total count
    const [items, total] = await query.getManyAndCount();

    // Wrap with BasePagination
    const paginationResult = new BasePagination<QuestionnaireAnswer>();
    paginationResult.items = items;
    paginationResult.meta = {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };

    return paginationResult;
  }

  async bulkCreate(
    bulkCreateDto: BulkCreateQuestionnaireAnswerDto,
  ): Promise<QuestionnaireAnswer[]> {
    const { data } = bulkCreateDto;
    const questionnaireAnswers: QuestionnaireAnswer[] = [];

    // Process each item in the bulk create
    for (const createDto of data) {
      const questionnaireAnswer =
        this.questionnaireAnswerRepository.create(createDto);
      await this.validateAndProcessReferences(createDto, questionnaireAnswer);
      questionnaireAnswers.push(questionnaireAnswer);
    }

    // Save all items in chunks (following the pattern from console services)
    const BATCH_SIZE = 500;
    const results: QuestionnaireAnswer[] = [];

    for (let i = 0; i < questionnaireAnswers.length; i += BATCH_SIZE) {
      const batch = questionnaireAnswers.slice(i, i + BATCH_SIZE);
      const savedBatch = await this.questionnaireAnswerRepository.save(batch, {
        chunk: BATCH_SIZE,
      });
      results.push(...savedBatch);
    }

    return results;
  }

  async bulkUpdate(
    bulkUpdateDto: BulkUpdateQuestionnaireAnswerDto,
  ): Promise<QuestionnaireAnswer[]> {
    const { data } = bulkUpdateDto;
    const updatedAnswers: QuestionnaireAnswer[] = [];

    // Process each item in the bulk update
    for (const updateDto of data) {
      const { id, ...updateData } = updateDto;

      const questionnaireAnswer =
        await this.questionnaireAnswerRepository.findOne({
          where: { id },
        });

      if (!questionnaireAnswer) {
        throw new NotFoundException(
          `QuestionnaireAnswer with ID ${id} not found`,
        );
      }

      Object.assign(questionnaireAnswer, updateData);
      await this.validateAndProcessReferences(updateData, questionnaireAnswer);
      updatedAnswers.push(questionnaireAnswer);
    }

    // Save all items in chunks
    const BATCH_SIZE = 500;
    const results: QuestionnaireAnswer[] = [];

    for (let i = 0; i < updatedAnswers.length; i += BATCH_SIZE) {
      const batch = updatedAnswers.slice(i, i + BATCH_SIZE);
      const savedBatch = await this.questionnaireAnswerRepository.save(batch, {
        chunk: BATCH_SIZE,
      });
      results.push(...savedBatch);
    }

    return results;
  }
}
