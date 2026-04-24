import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { Questionnaire } from './entities/questionnaire.entity';
import { BasePagination } from 'src/base.pagination';

interface SearchQuestionnairesParams {
  id?: string;
  jobStepId?: string;
  no?: number;
  type?: string;
  question?: string;
  options?: string;
  is_required?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(Questionnaire)
    private questionnaireRepository: Repository<Questionnaire>,
  ) {}

  async create(createQuestionnaireDto: CreateQuestionnaireDto): Promise<Questionnaire> {
    const questionnaire = this.questionnaireRepository.create(createQuestionnaireDto);
    return await this.questionnaireRepository.save(questionnaire);
  }

  async update(id: string, updateQuestionnaireDto: UpdateQuestionnaireDto): Promise<Questionnaire> {
    const questionnaire = await this.questionnaireRepository.findOne({ where: { id } });
    Object.assign(questionnaire, updateQuestionnaireDto);
    return await this.questionnaireRepository.save(questionnaire);
  }

  async remove(id: string): Promise<void> {
    const result = await this.questionnaireRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }
  }


  async search(params: SearchQuestionnairesParams): Promise<BasePagination<Questionnaire>> {
    const {
      id,
      jobStepId,
      no,
      type,
      question,
      options,
      page = 1,
      limit = 10,
    } = params;

    const query = this.questionnaireRepository.createQueryBuilder('questionnaire');

    // Add conditions based on provided parameters
    if (id) {
      query.andWhere('questionnaire.id = :id', { id });
    }

    if (jobStepId) {
      query.andWhere('questionnaire.job_step_id = :jobStepId', { jobStepId });
    }

    if (no !== undefined) {
      query.andWhere('questionnaire.no = :no', { no });
    }

    if (type) {
      query.andWhere('questionnaire.type ILIKE :type', { type: `%${type}%` });
    }

    if (question) {
      query.andWhere('questionnaire.question ILIKE :question', { question: `%${question}%` });
    }

    if (options) {
      query.andWhere('questionnaire.options::text ILIKE :options', { options: `%${options}%` }); // Assuming options is JSONB and searching within JSON string representation
    }

    if (params.is_required !== undefined) {
      query.andWhere('questionnaire.is_required = :is_required', { is_required: params.is_required });
    }

    // Add pagination
    query.skip((page - 1) * limit).take(limit);

    // Add ordering - you might want to order by 'no' or another relevant field
    // For now, no specific order is applied beyond database default.

    // Execute query and return results with total count
    const [items, total] = await query.getManyAndCount();

    // Wrap with BasePagination
    const paginationResult = new BasePagination<Questionnaire>()
    paginationResult.items = items;
    paginationResult.meta = {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit)
    };

    return paginationResult;
  }
}