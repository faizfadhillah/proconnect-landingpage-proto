import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job, JobStatus } from "../entities/job.entity";

@Injectable()
export class JobsDao {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  private createPublicJobQuery() {
    return this.jobRepository
      .createQueryBuilder("job")
      .leftJoinAndSelect("job.company", "company")
      .leftJoinAndSelect("job.region", "region");
  }

  /**
   * Find job by slug with company and region relations.
   * Used only for public job view (GET /jobs/public/slug/:slug).
   */
  async findOneBySlugForPublic(slug: string): Promise<Job | null> {
    return this.createPublicJobQuery()
      .where("job.slug = :slug", { slug })
      .getOne();
  }

  /**
   * Find public jobs list by company (and optional status), with pagination.
   * Returns [jobs, totalCount].
   */
  async findPublicListByCompany(
    companyId: string,
    status: JobStatus | undefined,
    skip: number,
    take: number,
  ): Promise<[Job[], number]> {
    let query = this.createPublicJobQuery().where(
      "job.company_id = :companyId",
      { companyId },
    );

    // By default, only return published jobs for public listing
    if (status) {
      query = query.andWhere("job.status = :status", { status });
    } else {
      query = query.andWhere("job.status = :status", {
        status: JobStatus.PUBLISH,
      });
    }

    query = query.skip(skip).take(take);

    return query.getManyAndCount();
  }
}
