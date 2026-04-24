import { UploadBatchRow } from "../entity/upload_batch_row.entity";

/**
 * Utility class for batch processing operations
 */
export class BatchProcessingUtil {

  /**
   * Utility method for delay
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process rows with controlled concurrency
   */
  static async processRowsWithConcurrency<T>(
    rows: UploadBatchRow[],
    maxConcurrent: number,
    processor: (row: UploadBatchRow) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < rows.length; i += maxConcurrent) {
      const batch = rows.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(row => processor(row));
      const batchResults = await Promise.allSettled(batchPromises);

      // Convert Promise.allSettled results to our format
      const formattedResults = batchResults.map(result =>
        result.status === 'fulfilled' ? result.value : null
      ).filter(result => result !== null) as T[];

      results.push(...formattedResults);

      // Small delay between batches to avoid overwhelming the system
      if (i + maxConcurrent < rows.length) {
        await this.delay(100);
      }
    }

    return results;
  }
}