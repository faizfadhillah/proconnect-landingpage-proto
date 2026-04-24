import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, In } from "typeorm";
import { Cron } from "@nestjs/schedule";
import { Job, JobStatus } from "../entities/job.entity";
import { JobsService } from "./jobs.service";
import { LoggingService } from "src/logs/logs.service";
import { getStartOfYesterdayGMT7, startOfDayGMT7 } from "src/utils/date.util";

/**
 * Scheduler service for auto-publish and auto-close jobs based on open_date and close_date.
 * Runs once daily at 00:00 GMT+7. Dates are stored as 00:00 GMT+7 (in UTC). Idempotency is guaranteed by JobsService.
 *
 * Auto-close uses a 1-day buffer: a job with close_date = 7 Feb 00:00 GMT+7 is closed when the
 * scheduler runs on 8 Feb 00:00 GMT+7 (not on 7 Feb). So close_date is the "last full day" the job is open.
 */
@Injectable()
export class JobOpeningScheduleService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly jobsService: JobsService,
    private readonly logger: LoggingService,
  ) {}

  @Cron("0 0 * * *", { timeZone: "Asia/Jakarta" }) // Every day at 00:00 GMT+7
  async runAutoPublish() {
    this.logger.info(
      "Starting scheduled auto-publish of jobs (open_date reached)",
      "job-opening-schedule",
    );
    const threshold = startOfDayGMT7(new Date()); // start of today GMT+7
    try {
      const jobs = await this.jobRepository.find({
        where: {
          status: JobStatus.DRAFT,
          open_date: LessThanOrEqual(threshold),
        },
        select: ["id"],
      });
      for (const job of jobs) {
        try {
          const updated = await this.jobsService.autoPublishBySchedule(job.id);
          if (updated) {
            this.logger.info(
              `Auto-published job ${job.id}`,
              "job-opening-schedule",
              { jobId: job.id },
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Auto-publish failed for job ${job.id}: ${msg}`,
            "job-opening-schedule",
            err instanceof Error ? err.stack : undefined,
            { jobId: job.id, error: msg },
          );
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Scheduled auto-publish failed: ${msg}`,
        "job-opening-schedule",
        error instanceof Error ? error.stack : undefined,
        { error: msg },
      );
    }
  }

  @Cron("0 0 * * *", { timeZone: "Asia/Jakarta" }) // Every day at 00:00 GMT+7
  async runAutoClose() {
    this.logger.info(
      "Starting scheduled auto-close of jobs (close_date reached, with 1-day buffer)",
      "job-opening-schedule",
    );
    // 1-day buffer: close_date 7 Feb 00:00 → close on 8 Feb 00:00 run.
    const threshold = getStartOfYesterdayGMT7();
    try {
      const jobs = await this.jobRepository.find({
        where: {
          status: In([JobStatus.PUBLISH, JobStatus.DRAFT]),
          close_date: LessThanOrEqual(threshold),
        },
        select: ["id"],
      });
      for (const job of jobs) {
        try {
          const updated = await this.jobsService.autoCloseBySchedule(job.id);
          if (updated) {
            this.logger.info(
              `Auto-closed job ${job.id}`,
              "job-opening-schedule",
              { jobId: job.id },
            );
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Auto-close failed for job ${job.id}: ${msg}`,
            "job-opening-schedule",
            err instanceof Error ? err.stack : undefined,
            { jobId: job.id, error: msg },
          );
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Scheduled auto-close failed: ${msg}`,
        "job-opening-schedule",
        error instanceof Error ? error.stack : undefined,
        { error: msg },
      );
    }
  }
}
