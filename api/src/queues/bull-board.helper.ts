import { INestApplication } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { Request, Response, NextFunction } from 'express';
import {
  EDUCATION_VERIFICATION_QUEUE,
  CERTIFICATE_VERIFICATION_QUEUE,
  INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
  INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
  RETROACTIVE_EDUCATION_LICENSE_QUEUE,
  RETROACTIVE_LICENSE_SKILL_QUEUE,
  SEND_EMAIL_QUEUE,
} from '../common/queues/queue.constants';
import { LoggingService } from 'src/logs/logs.service';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { UserRoleAssignmentService } from 'src/user_role_assignments/services/user_role_assignments.service';

/**
 * Create authentication middleware for Bull Board
 * Only SYS_ADMIN users can access the queue dashboard
 */
function createBullBoardAuthMiddleware(
  authService: AuthService,
  usersService: UsersService,
  userRoleAssignmentService: UserRoleAssignmentService,
  loggingService: LoggingService,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        loggingService.warn(
          `Unauthorized access attempt to Bull Board from ${req.ip}`,
          "bull-board-auth",
        );
        return res.status(401).json({
          statusCode: 401,
          message: 'Unauthorized - Bearer token required',
        });
      }

      // Extract and verify token
      const token = authHeader.split(' ')[1];
      const firebaseUser = await authService.verifyFirebaseToken(token);
      
      // Get user from database
      const user = await usersService.findByFirebaseUid(firebaseUser.uid);
      if (!user) {
        loggingService.warn(
          `User not found for Bull Board access: ${firebaseUser.uid}`,
          "bull-board-auth",
        );
        return res.status(401).json({
          statusCode: 401,
          message: 'User not found',
        });
      }

      // Check if user is SYS_ADMIN
      const isSysAdmin = await userRoleAssignmentService.isUserSysAdmin(user.id);
      if (!isSysAdmin) {
        loggingService.warn(
          `Forbidden access attempt to Bull Board by user ${user.id} (${user.email})`,
          "bull-board-auth",
        );
        return res.status(403).json({
          statusCode: 403,
          message: 'Forbidden - SYS_ADMIN role required to access queue dashboard',
        });
      }

      // Log successful access
      loggingService.log(
        `Bull Board accessed by SYS_ADMIN: ${user.email} (${user.id})`,
        "bull-board-auth",
      );

      // Attach user to request for potential future use
      (req as any).user = user;
      (req as any).firebaseUser = firebaseUser;

      next();
    } catch (error) {
      loggingService.error(
        `Bull Board authentication error: ${error instanceof Error ? error.message : String(error)}`,
        "bull-board-auth",
        error instanceof Error ? error.stack : undefined,
      );
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized - Invalid or expired token',
      });
    }
  };
}

/**
 * Setup Bull Board dashboard for queue monitoring
 * Protected by authentication - only SYS_ADMIN users can access
 * 
 * @param app - NestJS application instance
 * @param loggingService - Logging service for error/warning messages
 * @param port - Application port (optional, for logging purposes)
 * @returns ExpressAdapter instance if setup successful, null otherwise
 */
export function setupBullBoard(
  app: INestApplication,
  loggingService: LoggingService,
  port?: number,
): ExpressAdapter | null {
  try {
    // Get required services for authentication
    const authService = app.get(AuthService);
    const usersService = app.get(UsersService);
    const userRoleAssignmentService = app.get(UserRoleAssignmentService);

    // Create authentication middleware
    const authMiddleware = createBullBoardAuthMiddleware(
      authService,
      usersService,
      userRoleAssignmentService,
      loggingService,
    );

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath("/admin/queues");

    // Get all queues from app context
    const queues: Queue[] = [];
    const queueNames = [
      EDUCATION_VERIFICATION_QUEUE,
      CERTIFICATE_VERIFICATION_QUEUE,
      INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
      INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
      RETROACTIVE_EDUCATION_LICENSE_QUEUE,
      RETROACTIVE_LICENSE_SKILL_QUEUE,
      SEND_EMAIL_QUEUE,
    ];

    for (const queueName of queueNames) {
      try {
        const queue = app.get<Queue>(getQueueToken(queueName));
        queues.push(queue);
      } catch (error) {
        // Queue might not be registered yet, skip it
        loggingService.warn(
          `Queue ${queueName} not found, skipping Bull Board registration`,
          "bull-board-setup",
        );
      }
    }

    if (queues.length > 0) {
      createBullBoard({
        queues: queues.map((queue) => new BullAdapter(queue)),
        serverAdapter,
      });

      // Apply authentication middleware before Bull Board router
      app.use("/admin/queues", authMiddleware, serverAdapter.getRouter());

      loggingService.log(
        `Bull Board dashboard available at: http://localhost:${port || 3000}/admin/queues (SYS_ADMIN only)`,
        "bull-board-setup",
      );

      return serverAdapter;
    } else {
      loggingService.warn(
        "No queues found for Bull Board setup",
        "bull-board-setup",
      );
      return null;
    }
  } catch (error) {
    loggingService.error(
      `Failed to setup Bull Board: ${error instanceof Error ? error.message : String(error)}`,
      "bull-board-setup",
      error instanceof Error ? error.stack : undefined,
    );
    return null;
  }
}

