import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Job } from "src/jobs/entities/job.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { generateJobSlug } from "src/utils/string.util";

@Injectable()
export class JobSlugSeedService {
  private readonly logger = new Logger(JobSlugSeedService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(MstCompany)
    private readonly companyRepository: Repository<MstCompany>,
  ) {}

  async run(): Promise<void> {
    this.logger.log("Starting job slug generation for existing jobs...");

    // Get all jobs without slugs
    const jobs = await this.jobRepository.find({
      where: { slug: null },
      relations: ["company"],
    });

    this.logger.log(`Found ${jobs.length} jobs without slugs`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const job of jobs) {
      try {
        // Load company if not already loaded
        let company: MstCompany;
        if (job.company) {
          company = job.company;
        } else {
          company = await this.companyRepository.findOne({
            where: { id: job.company_id },
          });
          if (!company) {
            this.logger.warn(
              `Company not found for job ${job.id}, skipping...`,
            );
            skipped++;
            continue;
          }
        }

        // Determine publish date: use open_date if available, otherwise use created_at
        const publishDate = job.open_date || job.created_at || new Date();

        // Generate base slug without sequence
        const baseSlug = generateJobSlug(
          job.title,
          company.brand_name,
          publishDate,
        );

        // Check if base slug already exists
        const existingJob = await this.jobRepository.findOne({
          where: { slug: baseSlug },
        });

        let finalSlug: string;

        // If no existing slug, use base slug
        if (!existingJob || existingJob.id === job.id) {
          finalSlug = baseSlug;
        } else {
          // If slug exists, find the highest sequence number
          const slugPattern = `${baseSlug}-`;
          const existingJobs = await this.jobRepository
            .createQueryBuilder("job")
            .where("job.slug LIKE :pattern", { pattern: `${slugPattern}%` })
            .orWhere("job.slug = :baseSlug", { baseSlug })
            .getMany();

          // Extract sequence numbers from existing slugs
          const sequences: number[] = [];
          existingJobs.forEach((existingJob) => {
            if (existingJob.slug === baseSlug) {
              // Base slug exists, so sequence starts from 2
              sequences.push(1);
            } else if (existingJob.slug?.startsWith(slugPattern)) {
              const suffix = existingJob.slug.replace(slugPattern, "");
              const seq = parseInt(suffix, 10);
              if (!isNaN(seq)) {
                sequences.push(seq);
              }
            }
          });

          // Find next available sequence (starting from 2)
          let nextSequence = 2;
          if (sequences.length > 0) {
            const maxSequence = Math.max(...sequences);
            nextSequence = maxSequence + 1;
          }

          // Generate slug with sequence
          finalSlug = generateJobSlug(
            job.title,
            company.brand_name,
            publishDate,
            nextSequence,
          );
        }

        // Update job with slug
        job.slug = finalSlug;
        await this.jobRepository.save(job);

        processed++;
        if (processed % 100 === 0) {
          this.logger.log(`Processed ${processed} jobs...`);
        }
      } catch (error) {
        this.logger.error(
          `Error processing job ${job.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        errors++;
      }
    }

    this.logger.log(
      `Job slug generation completed: ${processed} processed, ${skipped} skipped, ${errors} errors`,
    );
  }
}
