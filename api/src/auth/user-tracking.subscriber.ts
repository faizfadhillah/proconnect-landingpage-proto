import { Connection, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../common/request-context/request-context.service';
import { BaseEntity } from '../base.entity';

@Injectable()
export class UserTrackingSubscriber implements EntitySubscriberInterface {
  constructor(
    connection: Connection,
    private readonly requestContextService: RequestContextService,
  ) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return BaseEntity;
  }

  beforeInsert(event: InsertEvent<any>) {
    const userId = this.requestContextService.getCurrentUserId();
    if (userId) {
      event.entity.created_by = userId;
      event.entity.updated_by = userId;
    }
  }

  beforeUpdate(event: UpdateEvent<any>) {
    const userId = this.requestContextService.getCurrentUserId();
    if (userId) {
      event.entity.updated_by = userId;
    }
  }

  beforeDelete(event: RemoveEvent<any>) {
    const userId = this.requestContextService.getCurrentUserId();
    if (userId) {
      event.entity.deleted_by = userId;
    }
  }
}