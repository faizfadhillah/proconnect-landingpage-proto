import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";

import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { FirebaseService } from "./firebase.service";
import { SendNotificationDto } from "./dto/send-notification.dto";
import {
  OrphanEmailsResponseDto,
  DeleteFirebaseUserResponseDto,
  BulkDeleteFirebaseUsersResponseDto,
  CreateFirebaseUserResponseDto,
  BulkCreateFirebaseUsersResponseDto,
} from "./dto/orphan-emails-response.dto";
import { Public } from "src/auth/public.decorator";

@Controller("firebase")
@ApiTags("firebase")
@ApiBearerAuth()
export class FirebaseController {
  constructor(private readonly firebaseService: FirebaseService) {}

  @Post("save-token")
  @ApiOperation({ summary: "Save FCM Token", operationId: "save-fcm-token" })
  @ApiResponse({ status: 200, description: "FCM Token saved successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired FCM Token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "The fcm token to the user's email",
          example: "123456asda8asdasd89vdgfd8g9",
        },
      },
    },
  })
  async saveToken(@Body() body: { token: string }, @Request() req) {
    return await this.firebaseService.saveToken(
      req.firebaseUser.uid,
      body.token,
    );
  }

  @Post("send-notification")
  async sendNotification(@Body() body: SendNotificationDto, @Request() req) {
    const payload = {
      notification: {
        title: body.title,
        body: body.body,
        image: "https://picsum.photos/64",
      },
      data: {
        id: "uuid-xxxxx-xxxxxxx-xxxxxxxxx",
        entity: "job",
      },
    };

    const response = await this.firebaseService.sendPushNotification(
      req.firebaseUser.uid,
      payload,
    );

    return response;
  }

  @Get("list-notification")
  async getNotifications(@Request() req) {
    const notifications = await this.firebaseService.getNotifications(
      req.firebaseUser.uid,
    );
    return { success: true, items: notifications };
  }

  @Post("read-notification/:id")
  async readNotification(@Param("id") id: string) {
    await this.firebaseService.readNotification(id);
    return { success: true };
  }

  @Get("orphan-emails")
  @ApiOperation({
    summary: "Get orphan emails",
    description:
      "Mendapatkan list email yang terdaftar di Firebase Auth tetapi tidak ada di sistem. Berguna untuk mengidentifikasi akun yang nyangkut ketika login.",
    operationId: "get-orphan-emails",
  })
  @ApiQuery({
    name: "maxResults",
    required: false,
    type: Number,
    description: "Maximum number of Firebase users to check (default: 1000)",
    example: 1000,
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved orphan emails",
    type: OrphanEmailsResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getOrphanEmails(
    @Query("maxResults", new DefaultValuePipe(1000), ParseIntPipe)
    maxResults: number,
  ): Promise<OrphanEmailsResponseDto> {
    return await this.firebaseService.getOrphanEmails(maxResults);
  }

  @Get("orphan-users")
  @ApiOperation({
    summary: "Get orphan users",
    description:
      "Mendapatkan list users yang ada di database tetapi firebase_uid-nya tidak ada di Firebase Auth. Berguna untuk mengidentifikasi akun yang ada di database tapi tidak bisa login.",
    operationId: "get-orphan-users",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved orphan users",
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error",
  })
  async getOrphanUsers() {
    return await this.firebaseService.getOrphanUsers();
  }

  @Delete("orphan-user/:uid")
  @ApiOperation({
    summary: "Delete Firebase orphan user",
    description:
      "Menghapus user dari Firebase Auth berdasarkan UID. Berguna untuk membersihkan akun orphan.",
    operationId: "delete-firebase-orphan-user",
  })
  @ApiResponse({
    status: 200,
    description: "User deleted successfully or deletion failed",
    type: DeleteFirebaseUserResponseDto,
  })
  @Public()
  async deleteFirebaseUser(
    @Param("uid") uid: string,
  ): Promise<DeleteFirebaseUserResponseDto> {
    return await this.firebaseService.deleteFirebaseUser(uid);
  }

  @Delete("orphan-users/bulk")
  @ApiOperation({
    summary: "Bulk delete Firebase orphan users",
    description:
      "Menghapus multiple Firebase users sekaligus berdasarkan array UIDs.",
    operationId: "bulk-delete-firebase-orphan-users",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        uids: {
          type: "array",
          items: { type: "string" },
          description: "Array of Firebase UIDs to delete",
          example: ["uid1", "uid2", "uid3"],
        },
      },
      required: ["uids"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Bulk deletion completed",
    type: BulkDeleteFirebaseUsersResponseDto,
  })
  async bulkDeleteFirebaseUsers(
    @Body() body: { uids: string[] },
  ): Promise<BulkDeleteFirebaseUsersResponseDto> {
    return await this.firebaseService.bulkDeleteFirebaseUsers(body.uids);
  }

  @Post("orphan-users/:id/create-firebase-user")
  @ApiOperation({
    summary: "Create Firebase user for database orphan user",
    description:
      "Membuat Firebase Auth user baru untuk user yang ada di database tapi firebase_uid-nya tidak ada di Firebase Auth. Akan membuat Firebase user baru dan update firebase_uid di database.",
    operationId: "create-firebase-user-for-orphan-user",
  })
  @ApiResponse({
    status: 200,
    description: "Firebase user created successfully or already exists",
    type: CreateFirebaseUserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "User not found",
  })
  async createFirebaseUserForOrphanUser(
    @Param("id") userId: string,
  ): Promise<CreateFirebaseUserResponseDto> {
    return await this.firebaseService.createFirebaseUserForOrphanUser(userId);
  }

  @Post("orphan-users/bulk-create-firebase-users")
  @ApiOperation({
    summary: "Bulk create Firebase users for database orphan users",
    description:
      "Membuat multiple Firebase Auth users sekaligus untuk users yang ada di database tapi firebase_uid-nya tidak ada di Firebase Auth.",
    operationId: "bulk-create-firebase-users-for-orphan-users",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        userIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of user IDs to create Firebase users for",
          example: ["uuid1", "uuid2", "uuid3"],
        },
      },
      required: ["userIds"],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Bulk creation completed",
    type: BulkCreateFirebaseUsersResponseDto,
  })
  async bulkCreateFirebaseUsersForOrphanUsers(
    @Body() body: { userIds: string[] },
  ): Promise<BulkCreateFirebaseUsersResponseDto> {
    return await this.firebaseService.bulkCreateFirebaseUsersForOrphanUsers(
      body.userIds,
    );
  }
}
