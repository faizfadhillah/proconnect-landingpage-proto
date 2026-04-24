import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  UseInterceptors,
  UseGuards,
  HttpException,
  HttpStatus,
  UploadedFile,
  Res,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { EMAIL_OTP_VALIDITY_SECONDS, UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { BasePagination } from "src/base.pagination";
import { Public } from "src/auth/public.decorator";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "../zfields/fields.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Response } from "express";
import { MailjetService } from "./mailjet.service";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { UserRoleAssignmentHistoryDao } from "src/user_role_assignments/dao/user_role_assignment_history.dao";
import { UserRoleAssignmentRole } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { UserWithRolesDto } from "./dto/user-with-roles.dto";
import { AuthService } from "src/auth/auth.service";
import { OtpType } from "./enums/otp-type.enum";
import { SmsOtpService } from "./sms-otp.service";
import { NotificationRateLimitGuard } from "src/notifications/guard/notification-rate-limit.guard";
import { NotificationRateLimitService, SMS_OTP_VALIDITY_SECONDS } from "src/notifications/service/notification-rate-limit.service";
import { UserFieldGuardService } from "./user-field-guard.service";
import { UserFieldGuardType } from "./enums/user-field-guard-type.enum";
import { OtpEligibilityResponseDto } from "./dto/otp-eligibility-response.dto";
import { SendOtpResponseDto } from "./dto/send-otp-response.dto";
import { EncryptedUserDataService } from "src/encrypted_user_data/encrypted_user_data.service";

@ApiTags("users")
@Controller("users")
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fieldsService: FieldsService,
    private readonly emailService: MailjetService,
    private readonly smsOtpService: SmsOtpService,
    private readonly notificationRateLimitService: NotificationRateLimitService,
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly userRoleAssignmentHistoryDao: UserRoleAssignmentHistoryDao,
    private readonly authService: AuthService,
    private readonly userFieldGuardService: UserFieldGuardService,
    private readonly encryptedUserDataService: EncryptedUserDataService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { full_name: "", email: "" },
  })
  @ApiQuery({ name: "age_start", required: false, type: Number })
  @ApiQuery({ name: "age_end", required: false, type: Number })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      full_name: "ASC",
      email: "DESC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<User>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Request() req,
    @Query("id") id?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("page") page?: number,
    @Query("age_start") age_start?: number,
    @Query("age_end") age_end?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: any,
    @Query("expands") expands?: string,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    const user: User = req.user;

    // Handle user_role filter: get user IDs from role assignment history
    if (parsedFilters.user_role) {
      const userRoleFilter = parsedFilters.user_role;

      // Map user_role filter to UserRoleAssignmentRole enum value
      // "candidate" -> "candidate", "company" -> "employer", etc.
      let roleAssignmentRole: string = userRoleFilter;
      if (userRoleFilter === "company") {
        roleAssignmentRole = UserRoleAssignmentRole.EMPLOYER;
      } else if (userRoleFilter === "candidate") {
        roleAssignmentRole = UserRoleAssignmentRole.CANDIDATE;
      } else if (userRoleFilter === "admin") {
        roleAssignmentRole = UserRoleAssignmentRole.ADMIN;
      }

      const userIds =
        await this.userRoleAssignmentHistoryDao.getUserIdsByRole(
          roleAssignmentRole,
        );

      // Remove user_role from filters as it's handled separately
      delete parsedFilters.user_role;

      // Append user IDs to id filter (merge if id already exists)
      if (userIds.length > 0) {
        if (parsedFilters.id) {
          // If id filter already exists, merge arrays
          const existingIds = Array.isArray(parsedFilters.id)
            ? parsedFilters.id
            : [parsedFilters.id];
          parsedFilters.id = [...new Set([...existingIds, ...userIds])];
        } else {
          parsedFilters.id = userIds;
        }
      } else {
        // No users found with this role, set empty array to return no results
        parsedFilters.id = [];
      }
    }

    return this.fieldsService.search(User, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      options: {
        age_start,
        age_end,
      },
      isExcel,
      res,
      user,
    });
  }

  @Post("import-xls")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads", // Direktori sementara
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validasi tipe file
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              "Hanya file Excel yang diperbolehkan.",
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException("File tidak ditemukan.", HttpStatus.BAD_REQUEST);
    }
    return this.fieldsService.importFromExcel(User, file);
  }

  @Post("send-otp")
  @UseGuards(NotificationRateLimitGuard)
  @ApiOperation({
    summary: "Send OTP to user email or phone",
    operationId: "sendOtp",
  })
  @ApiQuery({
    name: "type",
    enum: OtpType,
    required: false,
    description: "Channel: email or sms. Default email.",
  })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully",
    type: SendOtpResponseDto,
  })
  @ApiResponse({ status: 400, description: "User has no phone data (when type=sms)" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 429, description: "Too many OTP requests (rate limited)" })
  async sendOtp(
    @Query("type") type: OtpType = OtpType.EMAIL,
    @Request() req,
  ): Promise<SendOtpResponseDto> {
    const user = await this.usersService.findByFirebaseUid(
      req.firebaseUser.uid,
    );
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const now = new Date();

    if (type === OtpType.SMS) {
      await this.userFieldGuardService.assertCanChange(user.id, UserFieldGuardType.PHONE);
      await this.smsOtpService.requestOtp(user);
      await this.notificationRateLimitService.recordSmsSent(user.id);
      return {
        message: "OTP sent successfully via SMS",
        validUntil: new Date(now.getTime() + SMS_OTP_VALIDITY_SECONDS * 1000).toISOString(),
      };
    }

    await this.userFieldGuardService.assertCanChange(user.id, UserFieldGuardType.EMAIL);
    const otp = await this.usersService.generateOtp(user);
    const emailResult = await this.emailService.sendOtp(user, otp);

    return {
      message: emailResult?.message ?? "OTP sent successfully",
      validUntil: new Date(now.getTime() + EMAIL_OTP_VALIDITY_SECONDS * 1000).toISOString(),
    };
  }

  @Get("eligible-to-send-otp")
  @ApiOperation({
    summary: "Check if user is eligible to request OTP (no guard or guard expired)",
    operationId: "eligibleToSendOtp",
  })
  @ApiQuery({
    name: "type",
    enum: OtpType,
    required: true,
    description: "Channel: email or sms",
  })
  @ApiResponse({
    status: 200,
    description: "Eligibility for sending OTP",
    type: OtpEligibilityResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async eligibleToSendOtp(
    @Query("type") type: OtpType,
    @Request() req,
  ): Promise<OtpEligibilityResponseDto> {
    const validTypes = Object.values(OtpType);
    if (!type || !validTypes.includes(type)) {
      throw new BadRequestException(
        `Query "type" is required and must be one of: ${validTypes.join(", ")}`,
      );
    }
    const user = await this.usersService.findByFirebaseUid(
      req.firebaseUser.uid,
    );
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const guardType =
      type === OtpType.SMS ? UserFieldGuardType.PHONE : UserFieldGuardType.EMAIL;
    return this.userFieldGuardService.getOtpEligibility(user.id, guardType);
  }

  @Public()
  @Post("public-request-otp")
  @ApiOperation({ summary: "Send OTP to user email", operationId: "sendOtp" })
  @ApiResponse({
    status: 200,
    description: "OTP sent successfully",
    type: SendOtpResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The user's email pre register",
          example: "example@mail.com",
        },
      },
    },
  })
  async publicRequestOtp(
    @Body("email") email: string,
  ): Promise<SendOtpResponseDto> {
    const otp = await this.usersService.publicGenerateOtp(email);

    const now = new Date();
    const expiry = new Date(now.getTime());
    expiry.setMinutes(expiry.getMinutes() + 5);

    const emailResult = await this.emailService.publicSendOtp(email, otp);

    return {
      message: emailResult?.message ?? "OTP sent successfully",
      validUntil: expiry.toISOString(),
    };
  }

  @Post("verify-otp")
  @ApiOperation({
    summary: "Verify user OTP (email or phone)",
    operationId: "verifyOtp",
  })
  @ApiResponse({ status: 200, description: "OTP verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired OTP" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        otp: {
          type: "string",
          description: "The OTP code sent to the user's email or phone",
          example: "123456",
        },
        type: {
          type: "string",
          enum: Object.values(OtpType),
          description: "Channel: email or sms. Default email.",
        },
      },
    },
  })
  async verifyOtp(
    @Body("otp") otp: string,
    @Body("type") type: OtpType = OtpType.EMAIL,
    @Request() req,
  ) {
    const user = await this.usersService.findByFirebaseUid(
      req.firebaseUser.uid,
    );
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (type === OtpType.SMS) {
      return this.smsOtpService.verifyOtp(user, otp);
    }
    return this.usersService.verifyOtp(user, otp);
  }

  /*@Public()
  @Post("login")
  @ApiOperation({
    summary: "Login to get JWT token",
    operationId: "login",
  })
  @ApiResponse({
    status: 200,
    description: "User logged in successfully",
    type: Object,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.usersService.login(loginUserDto.email, loginUserDto.password);
  }*/

  @Public()
  @Post()
  @ApiOperation({
    summary: "Create a new user",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "User created successfully",
    type: User,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    /*if (user && !user.is_email_verified) {
      const otp = await this.usersService.generateOtp(user);
      await this.emailService.sendOtp(user, otp);
    }*/
    return user;
  }

  @Get()
  @ApiOperation({
    summary: "Get all users",
    operationId: "findAll",
  })
  @ApiResponse({ status: 200, description: "Return all users", type: [User] })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get("me")
  @ApiOperation({
    summary: "Get info of user session",
  })
  @ApiResponse({
    status: 200,
    description: "Return user profile with role and permissions",
    type: UserWithRolesDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findMe(@Request() req): Promise<UserWithRolesDto> {
    // Public endpoint but still need token to identify user
    let firebaseUid: string;
    if (req.firebaseUser?.uid) {
      firebaseUid = req.firebaseUser.uid;
    } else if (req.headers.authorization) {
      // If public but token provided, verify it
      const token = req.headers.authorization.split(" ")[1];
      const firebaseUser = await this.authService.verifyFirebaseToken(token);
      firebaseUid = firebaseUser.uid;
    } else {
      throw new UnauthorizedException("Authorization required");
    }

    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    // Get role assignment and permissions from service
    const roles = await this.usersService.getUserProfile(user.id);

    // Get decrypted phone number from encrypted user data
    const encryptedData =
      await this.encryptedUserDataService.findOneDecrypted(user.id);
    const fullPhone =
      (encryptedData as any)?.encrypted_phone ?? null;

    return {
      ...user,
      roles,
      phone: fullPhone,
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get single user",
    operationId: "findOne",
  })
  @ApiResponse({ status: 200, description: "Return single user", type: User })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a user",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "User updated successfully",
    type: User,
  })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a user",
    operationId: "remove",
  })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - non-sysadmin can only delete self" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id") id: string, @Request() req: { user?: { id: string; isSysAdmin?: boolean } }) {
    if (!req.user?.isSysAdmin && req.user?.id !== id) {
      throw new ForbiddenException("Access denied. You can only delete your own account.");
    }
    return this.usersService.softDelete(id);
  }

  @Post("change-password")
  @ApiOperation({
    summary: "Change Password a user",
    operationId: "change-password",
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    if (req.user) {
      await this.usersService.changePassword(req.user, changePasswordDto);
      return { message: "Password changed successfully" };
    }
    throw new UnauthorizedException("session expired, please login again!");
  }

  @Post("forgot-password")
  @Public()
  @ApiOperation({
    summary: "Forgot Password a user",
    operationId: "forgot-password",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset link has been sent",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "The email",
          example: "user@mail.com",
        },
      },
    },
  })
  async forgotPassword(@Body("email") email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const link = await this.usersService.getResetPasswordLink(
      email,
      user.firebase_uid,
    );
    return this.emailService.sendPasswordResetEmail(user, link);
  }
}
