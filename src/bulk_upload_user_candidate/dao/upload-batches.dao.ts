import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UploadBatch } from "../entity/upload_batch.entity";

@Injectable()
export class UploadBatchesDao {
  constructor(
    @InjectRepository(UploadBatch)
    public readonly uploadBatchRepository: Repository<UploadBatch>,
  ) {}

  async create(uploadBatch: Partial<UploadBatch>): Promise<UploadBatch> {
    const batch = this.uploadBatchRepository.create(uploadBatch);
    return await this.uploadBatchRepository.save(batch);
  }

  async findById(id: string): Promise<UploadBatch | null> {
    return await this.uploadBatchRepository.findOne({
      where: { id },
      relations: ["rows"],
    });
  }

  async updateProgress(id: string, validRows: number, invalidRows: number): Promise<void> {
    await this.uploadBatchRepository.update(id, {
      valid_rows: validRows,
      invalid_rows: invalidRows,
    });
  }

  async findAll(): Promise<UploadBatch[]> {
    return await this.uploadBatchRepository.find({
      order: { created_at: "DESC" },
      relations: ["rows"],
    });
  }

  /**
   * List upload batches with optional filters and pagination
   */
  async listBatches(options: {
    status?: string;
    page: number;
    limit: number;
    userId?: string;
  }): Promise<{ items: UploadBatch[]; total: number }> {
    const { status, page, limit, userId } = options;
    const skip = (page - 1) * limit;

    let query = this.uploadBatchRepository
      .createQueryBuilder("batch")
      .leftJoinAndSelect("batch.rows", "rows")
      .select([
        "batch.id",
        "batch.uploaded_by",
        "batch.total_rows",
        "batch.valid_rows",
        "batch.invalid_rows",
        "batch.created_at",
        "batch.updated_at",
      ]);

    // Filter by user if provided
    if (userId) {
      query = query.where("batch.uploaded_by = :userId", { userId });
    }

    // Filter by status if provided
    if (status) {
      if (status === "completed") {
        query = query.andWhere("batch.valid_rows + batch.invalid_rows = batch.total_rows");
      } else if (status === "processing") {
        query = query.andWhere("batch.valid_rows + batch.invalid_rows < batch.total_rows");
      } else if (status === "failed") {
        query = query.andWhere("batch.invalid_rows > 0");
      }
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination and ordering
    const batches = await query
      .orderBy("batch.created_at", "DESC")
      .skip(skip)
      .take(limit)
      .getMany();

    return { items: batches, total };
  }
}