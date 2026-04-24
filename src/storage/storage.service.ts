import { StorageFile } from "./storage-file";
import { DownloadResponse, Storage } from "@google-cloud/storage";
import { Injectable } from "@nestjs/common";
import StorageConfig from "./storage-config";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucket: string;

  constructor(private readonly loggingService: LoggingService) {
    this.storage = new Storage({
      projectId: StorageConfig.projectId,
      credentials: {
        client_email: StorageConfig.client_email,
        private_key: StorageConfig.private_key,
      },
    });

    this.bucket = StorageConfig.mediaBucket;
  }

  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string },
  ) {
    const file = this.storage.bucket(this.bucket).file(path);

    try {
      await file.save(media, {
        metadata: {
          contentType: contentType,
          metadata: metadata,
        },
      });

      this.loggingService.log(`File saved to ${path} in bucket ${this.bucket}`, 'storage');
    } catch (error) {
      this.loggingService.error("Failed to save file to Google Cloud Storage", 'storage', error instanceof Error ? error.stack : undefined, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    /*const stream = file.createWriteStream();
    stream.on('finish', async () => {
      return await file.setMetadata({
        contentType: contentType,
        metadata: object,
      });
    });
    stream.end(media);*/
    return {
      mediaId: metadata.mediaId,
      path: path,
    };
  }

  async delete(path: string) {
    await this.storage
      .bucket(this.bucket)
      .file(path)
      .delete({ ignoreNotFound: true });
  }

  async get(path: string): Promise<StorageFile> {
    const file = this.storage.bucket(this.bucket).file(path);
    const fileResponse: DownloadResponse = await file.download();
    const [metadata] = await file.getMetadata();
    const [buffer] = fileResponse;
    const storageFile = new StorageFile();
    storageFile.buffer = buffer;
    storageFile.contentType = metadata.contentType;
    storageFile.metadata = metadata;
    return storageFile;
  }

  async getWithMetaData(path: string): Promise<StorageFile> {
    const [metadata] = await this.storage
      .bucket(this.bucket)
      .file(path)
      .getMetadata();
    const fileResponse: DownloadResponse = await this.storage
      .bucket(this.bucket)
      .file(path)
      .download();
    const [buffer] = fileResponse;

    const storageFile = new StorageFile();
    storageFile.buffer = buffer;

    // Ensure metadata is defined and is an object
    if (metadata && typeof metadata === "object") {
      // Type assertion to [string, string][]
      const metadataEntries = Object.entries(metadata) as [string, string][];
      storageFile.metadata = new Map<string, string>(metadataEntries);
    } else {
      // Initialize with an empty map if metadata is null or not an object
      storageFile.metadata = new Map<string, string>();
    }

    storageFile.contentType = storageFile.metadata.get("contentType");
    return storageFile;
  }
}
