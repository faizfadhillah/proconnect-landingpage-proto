import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LogsModule } from 'src/logs/logs.module';

@Module({
  imports: [LogsModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
