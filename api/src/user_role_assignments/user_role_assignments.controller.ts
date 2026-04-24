import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRoleAssignmentService } from './services/user_role_assignments.service';
import { UserRoleAssignmentHistoryResponseDto } from './dto/user_role_assignment_history_response.dto';
import { BasePagination } from 'src/base.pagination';

@ApiTags('User Role Assignments')
@ApiBearerAuth()
@Controller('user-role-assignments')
export class UserRoleAssignmentsController {
  constructor(
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
  ) { }

  @Get('active/:userId')
  @ApiOperation({
    summary: 'Get active role assignments by user ID',
    operationId: 'getActiveByUserId'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Active role assignments found',
    type: [UserRoleAssignmentHistoryResponseDto],
  })
  async getActiveByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    return this.userRoleAssignmentService.getActiveByUserId(userId);
  }

  @Get('history/:userId')
  @ApiOperation({
    summary: 'Retrieve role assignment history for a specific user',
    description: 'Fetches detailed role assignment history by user ID',
    operationId: 'getHistoryByUserId'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Role assignment history retrieved successfully',
    type: BasePagination<UserRoleAssignmentHistoryResponseDto>,
  })
  async getHistoryByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<BasePagination<UserRoleAssignmentHistoryResponseDto>> {
    return this.userRoleAssignmentService.getHistoryByUserId(userId, page, limit);
  }
}
