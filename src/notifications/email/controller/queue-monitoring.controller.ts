import { Controller, Get, Query, HttpException, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { QueueMonitoringService } from "../service/queue-monitoring.service";
import {
  QueueStatusDto,
  QueueJobsResponseDto,
  EmailLogsWithQueueResponseDto,
} from "../dto/queue-monitoring.dto";

@ApiTags("Email Queue Monitoring")
@Controller("internal/email-queue")
@ApiBearerAuth()
export class QueueMonitoringController {
  constructor(private readonly queueMonitoringService: QueueMonitoringService) {}

  @Get("status")
  @ApiOperation({
    summary: "Get email queue status and statistics",
    description: "Returns comprehensive information about the email queue including job counts, Redis connection status, and performance metrics.",
  })
  @ApiResponse({
    status: 200,
    description: "Queue status retrieved successfully",
    type: QueueStatusDto,
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getQueueStatus(): Promise<QueueStatusDto> {
    try {
      return await this.queueMonitoringService.getQueueStatus();
    } catch (error) {
      throw new HttpException(
        {
          message: "Failed to retrieve queue status",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("jobs")
  @ApiOperation({
    summary: "Get detailed information about all jobs in the email queue",
    description: "Returns detailed information about all jobs currently in the queue, including their status, timestamps, and data.",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of jobs to return (default: 50)",
    example: 50,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Number of jobs to skip (default: 0)",
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: "Queue jobs retrieved successfully",
    type: QueueJobsResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getQueueJobs(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ): Promise<QueueJobsResponseDto> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      if (limitNum < 1 || limitNum > 1000) {
        throw new HttpException(
          "Limit must be between 1 and 1000",
          HttpStatus.BAD_REQUEST,
        );
      }

      if (offsetNum < 0) {
        throw new HttpException(
          "Offset must be non-negative",
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.queueMonitoringService.getQueueJobs(limitNum, offsetNum);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: "Failed to retrieve queue jobs",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("email-logs")
  @ApiOperation({
    summary: "Get email logs with associated queue job information",
    description: "Returns email logs enriched with queue job status, retry information, and estimated processing times.",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Maximum number of email logs to return (default: 50)",
    example: 50,
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "Number of email logs to skip (default: 0)",
    example: 0,
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filter by email status (PENDING, RETRY_NEEDED, FAILED, SUCCESS)",
    example: "PENDING",
  })
  @ApiQuery({
    name: "type",
    required: false,
    type: String,
    description: "Filter by email type",
    example: "user_candidate_bulk_direct_registration",
  })
  @ApiResponse({
    status: 200,
    description: "Email logs with queue status retrieved successfully",
    type: EmailLogsWithQueueResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid query parameters",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getEmailLogsWithQueueStatus(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
  ): Promise<EmailLogsWithQueueResponseDto> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      if (limitNum < 1 || limitNum > 1000) {
        throw new HttpException(
          "Limit must be between 1 and 1000",
          HttpStatus.BAD_REQUEST,
        );
      }

      if (offsetNum < 0) {
        throw new HttpException(
          "Offset must be non-negative",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate status if provided
      if (status && !["PENDING", "RETRY_NEEDED", "FAILED", "SUCCESS"].includes(status)) {
        throw new HttpException(
          "Invalid status. Must be one of: PENDING, RETRY_NEEDED, FAILED, SUCCESS",
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.queueMonitoringService.getEmailLogsWithQueueStatus(
        limitNum,
        offsetNum,
        status,
        type,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: "Failed to retrieve email logs with queue status",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get("metrics")
  @ApiOperation({
    summary: "Get email queue performance metrics",
    description: "Returns performance metrics for the email queue including success rates, processing times, and throughput statistics.",
  })
  @ApiQuery({
    name: "timeRangeHours",
    required: false,
    type: Number,
    description: "Time range in hours for metrics calculation (default: 24)",
    example: 24,
  })
  @ApiResponse({
    status: 200,
    description: "Queue metrics retrieved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid query parameters",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getQueueMetrics(@Query("timeRangeHours") timeRangeHours?: string): Promise<any> {
    try {
      const timeRangeNum = timeRangeHours ? parseInt(timeRangeHours, 10) : 24;

      if (timeRangeNum < 1 || timeRangeNum > 168) {
        throw new HttpException(
          "Time range must be between 1 and 168 hours (1 week)",
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.queueMonitoringService.getQueueMetrics(timeRangeNum);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: "Failed to retrieve queue metrics",
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}