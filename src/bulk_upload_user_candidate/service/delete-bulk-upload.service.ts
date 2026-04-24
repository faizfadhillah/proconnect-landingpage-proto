import { Injectable, BadRequestException } from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import { UploadBatchRowsDao } from "../dao/upload-batch-rows.dao";
import { RowStatus } from "../entity/upload_batch_row.entity";
import { CandidateRegistrationData } from "../constants/constants";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class DeleteBulkUploadService {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadBatchRowsDao: UploadBatchRowsDao,
    private readonly loggingService: LoggingService,
  ) { }

  /**
   * Delete failed registrations
   */
  async deleteFailedRegistrations(batchId: string): Promise<{ message: string; deletedCount: number }> {
    // Get failed rows
    const failedRows = await this.uploadBatchRowsDao.findByBatchId(batchId);
    const failedUserIds: string[] = [];
    const rowIdsToUpdate: string[] = [];

    for (const row of failedRows) {
      if (row.row_status === RowStatus.FAILED) {
        // Find user by email and soft delete
        try {
          const data = row.additional_data as CandidateRegistrationData;
          const user = await this.usersService.findByEmail(data.email);
          if (user) {
            await this.usersService.softDelete(user.id);
            failedUserIds.push(user.id);
            rowIdsToUpdate.push(row.id);
          }
        } catch (error) {
          // User might not exist or already deleted
          const data = row.additional_data as CandidateRegistrationData;
          this.loggingService.warn(`Could not delete user for email ${data.email}:`, error);

          return {
            message: `Could not delete user for email ${data.email} | already delete ${failedUserIds.length}`,
            deletedCount: failedUserIds.length
          };
        }
      }
    }

    // Update row statuses to DELETED
    if (rowIdsToUpdate.length > 0) {
      await this.uploadBatchRowsDao.updateStatusByIds(
        rowIdsToUpdate,
        RowStatus.DELETED
      );
    }

    return {
      message: `Deleted ${failedUserIds.length} failed registrations`,
      deletedCount: failedUserIds.length,
    };
  }

  /**
   * Delete failed registrations by upload batch row id
   */
  async deleteFailedRegistrationsByRowId(rowId: string): Promise<{ message: string; deletedCount: number }> {
    // Get the row by id
    const row = await this.uploadBatchRowsDao.findById(rowId);
    if (!row) {
      throw new BadRequestException("Row not found");
    }

    if (row.row_status !== RowStatus.FAILED) {
      throw new BadRequestException("Row is not in failed status");
    }

    // Find user by email and soft delete
    const data = row.additional_data as CandidateRegistrationData;
    const user = await this.usersService.findByEmail(data.email);
    if (!user) {
      return {
        message: "User not found for the failed row",
        deletedCount: 0,
      };
    }

    try {
      await this.usersService.softDelete(user.id);
      // Update row status to DELETED
      await this.uploadBatchRowsDao.updateStatus(rowId, RowStatus.DELETED);
      return {
        message: "Deleted 1 failed registration",
        deletedCount: 1,
      };
    } catch (error) {
      this.loggingService.error(`Could not delete user for row ${rowId}:`, error);
      throw new BadRequestException("Failed to delete user");
    }
  }
}
