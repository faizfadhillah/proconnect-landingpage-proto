import * as fs from "fs";
import { LoggingService } from "src/logs/logs.service";

/**
 * Utility class for file cleanup operations
 */
export class FileCleanupUtil {
  /**
   * Clean up file from disk
   */
  static cleanUpFile(filePath: string, loggingService?: LoggingService): void {
    try {
      fs.unlinkSync(filePath);
      loggingService?.log(`File cleanup completed: ${filePath}`, 'file-cleanup');
    } catch (cleanupError) {
      loggingService?.warn(`Failed to delete file ${filePath}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`, 'file-cleanup');
    }
  }
}