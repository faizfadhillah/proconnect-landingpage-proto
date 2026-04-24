import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../common/request-context/request-context.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly requestContextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || uuidv4();

    // Set request ID in CLS (request-scoped)
    this.requestContextService.setRequestId(requestId);

    // Add request ID to response headers
    res.setHeader('x-request-id', requestId);

    next();
  }
}