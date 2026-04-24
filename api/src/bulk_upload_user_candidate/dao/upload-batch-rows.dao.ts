import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { UploadBatchRow, RowStatus } from "../entity/upload_batch_row.entity";
import { EmailSentStatus } from "../../notifications/email/entity/email_log.entity";

export interface EmailStatusInfo {
  email_sent_status?: EmailSentStatus;
  email_send_at?: Date | null;
  email_failed_reason?: string | null;
}

export interface BatchRowWithEmailStatus {
  id: string;
  batch_id: string;
  type: string;
  additional_data: Record<string, any>;
  row_status: RowStatus;
  error_messages: string[] | null;
  created_at: Date;
  updated_at: Date;
  email_sent_status?: EmailSentStatus;
  email_send_at?: Date | null;
  email_failed_reason?: string | null;
  email_log_id?: string;
}

export interface ListBatchRowsResponse {
  items: BatchRowWithEmailStatus[];
  total: number;
}

@Injectable()
export class UploadBatchRowsDao {
  constructor(
    @InjectRepository(UploadBatchRow)
    private readonly uploadBatchRowRepository: Repository<UploadBatchRow>,
  ) { }

  async createMany(rows: Partial<UploadBatchRow>[]): Promise<UploadBatchRow[]> {
    const batchRows = this.uploadBatchRowRepository.create(rows);
    return await this.uploadBatchRowRepository.save(batchRows);
  }

  async findPendingByBatchId(batchId: string, limit?: number): Promise<UploadBatchRow[]> {
    const query = this.uploadBatchRowRepository
      .createQueryBuilder("row")
      .where("row.batch_id = :batchId", { batchId })
      .andWhere("row.row_status = :status", { status: RowStatus.PENDING })
      .orderBy("row.created_at", "ASC");

    if (limit) {
      query.limit(limit);
    }

    return await query.getMany();
  }

  async updateStatus(id: string, status: RowStatus, errorMessages?: string[]): Promise<void> {
    const updateData: Partial<UploadBatchRow> = { row_status: status };
    if (errorMessages) {
      updateData.error_messages = errorMessages;
    }
    await this.uploadBatchRowRepository.update(id, updateData);
  }

  async updateStatusByIds(ids: string[], rowStatus: RowStatus): Promise<void> {
    await this.uploadBatchRowRepository.update(
      {
        id: In(ids),
      },
      {
        row_status: rowStatus
      }
    );
  }

  async findByBatchId(batchId: string): Promise<UploadBatchRow[]> {
    return await this.uploadBatchRowRepository.find({
      where: { batch_id: batchId },
      order: { created_at: "ASC" },
    });
  }

  async countByBatchIdAndStatus(batchId: string, status: RowStatus): Promise<number> {
    return await this.uploadBatchRowRepository.count({
      where: { batch_id: batchId, row_status: status },
    });
  }

  async findInvalidByBatchId(batchId: string): Promise<UploadBatchRow[]> {
    return await this.uploadBatchRowRepository.find({
      where: { batch_id: batchId, row_status: RowStatus.INVALID },
      order: { created_at: "ASC" },
    });
  }

  async findById(id: string): Promise<UploadBatchRow | null> {
    return await this.uploadBatchRowRepository.findOne({ where: { id } });
  }

  /**
   * List batch rows with filters and pagination including email status
   */
  async listBatchRows(
    batchId: string,
    options: {
      email?: string;
      phone?: string;
      gender?: string;
      status?: RowStatus;
      type?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ListBatchRowsResponse> {
    const { email, phone, gender, status, type, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    let query = this.uploadBatchRowRepository
      .createQueryBuilder("row")
      .where("row.batch_id = :batchId", { batchId })
      .select([
        "row.id",
        "row.batch_id",
        "row.type",
        "row.additional_data",
        "row.row_status",
        "row.error_messages",
        "row.created_at",
        "row.updated_at",
      ]);

    // Apply filters
    if (email) {
      query = query.andWhere("row.additional_data ->> 'email' ILIKE :email", {
        email: `%${email}%`,
      });
    }

    if (phone) {
      query = query.andWhere("row.additional_data ->> 'phone' ILIKE :phone", {
        phone: `%${phone}%`,
      });
    }

    if (gender) {
      query = query.andWhere("row.additional_data ->> 'gender' = :gender", { gender });
    }

    if (status) {
      query = query.andWhere("row.row_status = :status", { status });
    }

    if (type) {
      query = query.andWhere("row.type = :type", { type });
    }

    // Get total count
    const total = await query.getCount();

    // Apply ordering
    query = query.orderBy("row.created_at", "ASC");

    // Apply pagination only if limit is positive (skip when limit = -1 for no limit)
    if (limit > 0) {
      query = query.skip(skip).take(limit);
    }

    const rows = await query.getMany();

    return { items: rows as BatchRowWithEmailStatus[], total };
  }
}