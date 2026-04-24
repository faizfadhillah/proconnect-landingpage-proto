import {
  Injectable,
  forwardRef,
  NotFoundException,
  Inject,
  BadRequestException,
  NotAcceptableException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { DataSource, Repository, EntityManager } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RegisterCandidateDto } from "./dto/register-candidate.dto";
import { AuthService } from "../auth/auth.service";
import { FirebaseAdmin, InjectFirebaseAdmin } from "nestjs-firebase";
import { UserOtp } from "./entities/user_otp.entity";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { EncryptedUserData } from "src/encrypted_user_data/entities/encrypted_user_data.entity";
import { encrypt } from "../encrypted_user_data/encryption.util";
import { CreateEncryptedUserDataDto } from "src/encrypted_user_data/dto/create-encrypted_user_data.dto";
import { LoggingService } from "src/logs/logs.service";
import {
  StatusSkillPassport,
  UserSkillPassport,
} from "src/user_skill_passports/entities/user_skill_passport.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { RbacService } from "src/rbac/rbac.service";
import { UserSubscription } from "src/user_subscription/entities/user_subscription.entity";
import { UserSkill } from "src/user_skills/entities/user_skill.entity";
import { UserSalaryCountry } from "src/user_salary_country/entities/user_salary_country.entity";
import { UserRightToWork } from "src/user_right_to_work/entities/user-right-to-work.entity";
import { UserProfession } from "src/user_professions/entities/user_profession.entity";
import { UserLanguage } from "src/user_languages/entities/user_language.entity";
import { UserInterest } from "src/user_interests/entities/user_interest.entity";
import { UserFile } from "src/user_files/entities/user_file.entity";
import { UserCertificate } from "src/user_certificates/entities/user_certificates.entity";
import { UserCareerHistory } from "src/user_career_history/entities/user_career_history.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { MailjetService } from "./mailjet.service";
import { FirebaseService } from "src/firebase/firebase.service";
import { ConfigsService } from "src/config/config.service";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { MstCompaniesService } from "src/mst_companies/service/mst_companies.service";
import {
  UserRoleAssignmentCompanyRole,
  UserRoleAssignmentRole,
  UserRoleAssignmentStatus,
} from "src/user_role_assignments/enums/user_role_assignment.enums";
import { UpsertUserRoleAssignmentDto } from "src/user_role_assignments/dto/upsert_user_role_assignment.dto";
import { UserRoleAssignmentHistoryResponseDto } from "src/user_role_assignments/dto/user_role_assignment_history_response.dto";
import { MstCompanyHqBranchRelationService } from "src/mst_companies/service/company_hq_branch_relation.service";
import { RoleDto } from "./dto/role.dto";
import { MstInformalCertificateMappingsService } from "src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.service";
import { EncryptedUserDataService } from "src/encrypted_user_data/encrypted_user_data.service";
import { INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE } from "src/common/queues/queue.constants";
import { extractLast4Digits } from "src/utils/phone.util";
import { UserFieldGuardService } from "./user-field-guard.service";
import { UserFieldGuardType } from "./enums/user-field-guard-type.enum";

export const EMAIL_OTP_VALIDITY_SECONDS = 5 * 60; // 5 minutes

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => AuthService)) // Inject AuthService with forwardRef
    private readonly authService: AuthService,
    @InjectFirebaseAdmin()
    private readonly firebaseAdmin: FirebaseAdmin,
    private firebaseService: FirebaseService,
    private readonly rbacService: RbacService,
    @InjectRepository(UserOtp) private otpRepository: Repository<UserOtp>,
    @InjectRepository(EncryptedUserData)
    private encryptRepository: Repository<EncryptedUserData>,
    private readonly dataSource: DataSource,
    private readonly loggingService: LoggingService,
    @InjectRepository(UserSkillPassport)
    private userSkillPassportRepository: Repository<UserSkillPassport>,
    @InjectRepository(UserEducation)
    private userEducationRepository: Repository<UserEducation>,
    private readonly entityManager: EntityManager,
    private readonly emailService: MailjetService,
    @InjectRepository(MstCompany)
    private mstCompanyRepository: Repository<MstCompany>,
    private readonly configService: ConfigsService,
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly mstCompaniesService: MstCompaniesService,
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
    private readonly informalCertificateMappingService: MstInformalCertificateMappingsService,
    private readonly encryptedUserDataService: EncryptedUserDataService,
    @InjectQueue(INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE)
    private readonly informalCertificateUserProcessingQueue: Queue,
    private readonly userFieldGuardService: UserFieldGuardService,
  ) { }

  private filterMenusByIds(menuItems: any[], ids: string[]): any[] {
    return menuItems.reduce((acc, menuItem) => {
      if (ids.includes(menuItem.id)) {
        const filteredMenuItem = { ...menuItem };
        if (filteredMenuItem.children) {
          filteredMenuItem.children = this.filterMenusByIds(
            filteredMenuItem.children,
            ids,
          );
        }
        acc.push(filteredMenuItem);
      } else {
        //console.log("No match for menu item:", menuItem); // Log when no match is found
      }
      return acc;
    }, []);
  }

  async findByFirebaseUid(firebase_uid: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { firebase_uid },
      relations: ["company"],
    });

    if (!user) {
      throw new NotFoundException(
        `User with firebase_uid ${firebase_uid} not found`,
      );
    }

    const userRoles =
      await this.userRoleAssignmentService.getActiveUserRoleByUserId(user.id);

    let userMenus = [];
    if (userRoles && userRoles.length) {
      const menuItems = this.rbacService.getMenuItems();

      const rbacs = await this.rbacService.getRbacFromUserRoles(userRoles);

      let userMenuIds = [];
      for (const rbac of rbacs) {
        userMenuIds = [...(rbac.meta?.menus || []), ...userMenuIds];
      }

      userMenus = this.filterMenusByIds(menuItems, userMenuIds);
    }

    return { ...user, ...{ menus: userMenus } };
  }

  // Seeding logic
  async seedSuperAdmin(): Promise<void> {
    const existingUsers = await this.usersRepository.find({ take: 1 });

    if (existingUsers.length === 0) {
      const superAdminEmail = "superadmin@mail.com";
      const password = process.env.SEED_SUPER_ADMIN_PASSWORD || "REDACTED_SET_ENV_SEED_SUPER_ADMIN_PASSWORD";

      // Create user in Firebase
      const firebaseUser = await this.firebaseAdmin.auth
        .createUser({
          email: superAdminEmail,
          password: password,
        })
        .catch((error) => {
          this.loggingService.error(
            `Firebase user creation failed: ${error.message}`,
            "seed",
            error.stack,
          );
          throw new BadRequestException("Firebase: " + error.message);
        });

      // Create user in database
      const createUserDto = new User();
      createUserDto.email = firebaseUser.email;
      createUserDto.firebase_uid = firebaseUser.uid;
      createUserDto.is_email_verified = firebaseUser.emailVerified;
      createUserDto.user_role = UserRole.ADMIN;

      const superAdmin = this.usersRepository.create(createUserDto);
      await this.usersRepository.save(superAdmin);

      // Set custom user claims
      await this.firebaseAdmin.auth.setCustomUserClaims(
        superAdmin.firebase_uid,
        {
          user_token_id: superAdmin.id,
          roles: [superAdmin.user_role],
        },
      );

      // Create SYS_ADMIN role assignment
      const assignmentDto = new UpsertUserRoleAssignmentDto();
      assignmentDto.user_id = superAdmin.id;
      assignmentDto.role = UserRoleAssignmentRole.SYS_ADMIN;
      assignmentDto.status = UserRoleAssignmentStatus.ACTIVE;
      assignmentDto.start_date = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

      await this.userRoleAssignmentService.upsert(
        [assignmentDto],
        superAdmin.id,
      );

      this.loggingService.log(
        "Superadmin user and role assignment seeded",
        "seed",
      );
    }
  }

  // Seed admin viewer user
  async seedAdminViewer(): Promise<void> {
    const adminViewerEmail = "adminviewer@mail.com";
    const existingUser = await this.usersRepository.findOne({
      where: { email: adminViewerEmail },
    });

    if (!existingUser) {
      const password = process.env.SEED_ADMIN_VIEWER_PASSWORD || "REDACTED_SET_ENV_SEED_ADMIN_VIEWER_PASSWORD";

      // Create user in Firebase
      let firebaseUser;
      try {
        firebaseUser = await this.firebaseAdmin.auth.createUser({
          email: adminViewerEmail,
          password: password,
        });
      } catch (error) {
        // If user already exists in Firebase, get the existing user
        if (
          error.code === "auth/email-already-exists" ||
          error.message?.includes("already exists")
        ) {
          this.loggingService.log(
            `Firebase user already exists, getting existing user: ${adminViewerEmail}`,
            "seed",
          );
          firebaseUser =
            await this.firebaseAdmin.auth.getUserByEmail(adminViewerEmail);
        } else {
          this.loggingService.error(
            `Firebase user creation failed: ${error.message}`,
            "seed",
            error.stack,
          );
          throw new BadRequestException("Firebase: " + error.message);
        }
      }

      // Create user in database
      const createUserDto = new User();
      createUserDto.email = firebaseUser.email;
      createUserDto.firebase_uid = firebaseUser.uid;
      createUserDto.is_email_verified = firebaseUser.emailVerified;
      createUserDto.user_role = UserRole.ADMIN;

      const adminViewer = this.usersRepository.create(createUserDto);
      await this.usersRepository.save(adminViewer);

      // Set custom user claims
      await this.firebaseAdmin.auth.setCustomUserClaims(
        adminViewer.firebase_uid,
        {
          user_token_id: adminViewer.id,
          roles: [adminViewer.user_role],
        },
      );

      // Create ADMIN_VIEWER role assignment
      const assignmentDto = new UpsertUserRoleAssignmentDto();
      assignmentDto.user_id = adminViewer.id;
      assignmentDto.role = UserRoleAssignmentRole.ADMIN_VIEWER;
      assignmentDto.status = UserRoleAssignmentStatus.ACTIVE;
      assignmentDto.start_date = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

      await this.userRoleAssignmentService.upsert(
        [assignmentDto],
        adminViewer.id,
      );

      // Seed RBAC for admin_viewer
      await this.rbacService.seedAdminViewerRbac();

      this.loggingService.log(
        "Admin viewer user and role assignment seeded",
        "seed",
      );
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    return await this.authService.login(email, password);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Log: User creation request received
    this.loggingService.log(
      `[user-create] START - Creating user with firebase_uid: ${createUserDto.firebase_uid}, email: ${createUserDto.email}`,
      "user",
    );

    const firebaseUser = await this.firebaseAdmin.auth
      .getUser(createUserDto.firebase_uid)
      .catch((error) => {
        this.loggingService.error(
          `[user-create] FAILED - Firebase user validation failed for firebase_uid: ${createUserDto.firebase_uid}`,
          "user",
          error.stack,
        );
        throw new BadRequestException("Firebase: " + error.message);
      });

    // Log: Firebase validation succeeded
    this.loggingService.log(
      `[user-create] Firebase validation SUCCESS - firebase_uid: ${firebaseUser.uid}, email: ${firebaseUser.email}, emailVerified: ${firebaseUser.emailVerified}`,
      "user",
    );

    let user = this.usersRepository.create(createUserDto);
    user.email = firebaseUser.email;
    user.full_name = firebaseUser.displayName;
    user.firebase_uid = firebaseUser.uid;
    user.is_email_verified = firebaseUser.emailVerified;

    // Candidates should not have company_role
    if (user.user_role === UserRole.CANDIDATE) {
      user.company_role = null;
      user.company_id = null;
    }
    if (!firebaseUser.emailVerified) {
      const isOptValid = await this.publicVerifyOtp(
        firebaseUser.email,
        createUserDto.otp,
      );
      if (isOptValid) {
        user.is_email_verified = true;
      } else {
        await this.firebaseAdmin.auth.deleteUser(firebaseUser.uid);
        throw new NotFoundException("Invalid or expired OTP");
      }
    }
    user = await this.usersRepository.save(user);

    // Log: Database save succeeded
    this.loggingService.log(
      `[user-create] DB save SUCCESS - user_id: ${user.id}, firebase_uid: ${user.firebase_uid}, email: ${user.email}`,
      "user",
    );

    // Fix: Karena ini self-registration (endpoint @Public()), created_by harus selalu diisi dengan ID user sendiri
    // Ini untuk memastikan bahwa meskipun ada user lain yang sedang login, created_by tetap diisi dengan user yang mendaftar
    if (user.created_by !== user.id) {
      user.created_by = user.id;
      user.updated_by = user.id;
      user = await this.usersRepository.save(user);
    }

    if (createUserDto.phone) {
      await this.savePhoneToEncryptedUserData(user, createUserDto.phone);
      const last4Digits = extractLast4Digits(createUserDto.phone);
      if (last4Digits) {
        user.phone_last_4_digits = last4Digits;
      }
      user = await this.usersRepository.save(user);
    }

    this.firebaseAdmin.auth.setCustomUserClaims(createUserDto.firebase_uid, {
      user_token_id: user.id,
      roles: [user.user_role || UserRole.CANDIDATE],
    });

    user = await this.updateUserVerified(user);

    // Log: User creation completed successfully
    this.loggingService.log(
      `[user-create] COMPLETED - user_id: ${user.id}, firebase_uid: ${user.firebase_uid}, email: ${user.email}, role: ${user.user_role}`,
      "user",
    );

    return user;
  }

  /**
   * Register a new candidate user for bulk upload operations
   *
   * This method creates both Firebase authentication user and local database user
   * without OTP verification and email verification status. It's specifically
   * designed for bulk candidate registration where only initial data is saved.
   *
   * @param dto - The candidate registration data
   * @param dto.email - Candidate's email address
   * @param dto.name - Candidate's full name
   * @param dto.phone - Candidate's phone number (optional)
   * @param dto.gender - Candidate's gender
   * @returns Promise<{user: User, password: string}> - The created user entity and generated password
   *
   * @throws BadRequestException - If Firebase user creation fails
   */
  async registerCandidate(
    dto: RegisterCandidateDto,
  ): Promise<{ user: User; password: string }> {
    // Log: Bulk registration request received
    this.loggingService.log(
      `[bulk-register] START - Registering candidate: email=${dto.email}, name=${dto.name}`,
      "user",
    );

    // Create Firebase user first
    const password = this.generateRandomPassword(12);
    const firebaseUser = await this.firebaseAdmin.auth
      .createUser({
        email: dto.email,
        displayName: dto.name,
        emailVerified: false,
        password: password,
      })
      .catch((error) => {
        this.loggingService.error(
          `[bulk-register] FAILED - Firebase user creation failed for email: ${dto.email}`,
          "user",
          error.stack,
        );
        throw new BadRequestException("Firebase: " + error.message);
      });

    // Log: Firebase user created
    this.loggingService.log(
      `[bulk-register] Firebase user created - firebase_uid: ${firebaseUser.uid}, email: ${firebaseUser.email}`,
      "user",
    );

    // Create user in database
    let user = new User();
    user.email = firebaseUser.email;
    user.full_name = firebaseUser.displayName || dto.name;
    user.firebase_uid = firebaseUser.uid;
    user.user_role = UserRole.CANDIDATE;
    user.company_role = null; // Candidates should not have company_role
    user.company_id = null; // Candidates should not have company_id
    user.gender = dto.gender;
    user.photo_url = "";
    user.birth_year = new Date().getFullYear() - 25; // Default age
    user.roles = [UserRole.CANDIDATE];

    // Force active email and wizard state
    user.is_email_verified = true;
    user.last_wizard_state = 99;
    user.wizard_state = await this.getCandidateWizardState();

    user = await this.usersRepository.save(user);

    // Log: Database save succeeded
    this.loggingService.log(
      `[bulk-register] DB save SUCCESS - user_id: ${user.id}, firebase_uid: ${user.firebase_uid}, email: ${user.email}`,
      "user",
    );

    // Fix: Jika created_by null (tidak ada user yang login saat bulk upload), set ke ID user sendiri
    // Jika ada admin yang login (created_by sudah terisi), biarkan tetap dengan admin ID
    if (!user.created_by) {
      user.created_by = user.id;
      user.updated_by = user.id;
      user = await this.usersRepository.save(user);
    }

    if (dto.phone) {
      await this.savePhoneToEncryptedUserData(user, dto.phone);
      const last4Digits = extractLast4Digits(dto.phone);
      if (last4Digits) {
        user.phone_last_4_digits = last4Digits;
      }
      user = await this.usersRepository.save(user);
    }

    // Set custom claims
    await this.firebaseAdmin.auth.setCustomUserClaims(user.firebase_uid, {
      user_token_id: user.id,
      roles: [user.user_role],
    });

    // Process informal certificates asynchronously via queue
    await this.informalCertificateUserProcessingQueue.add(
      INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
      {
        userId: user.id,
        phone: dto.phone,
      },
    );

    // Log: Bulk registration completed
    this.loggingService.log(
      `[bulk-register] COMPLETED - user_id: ${user.id}, firebase_uid: ${user.firebase_uid}, email: ${user.email}`,
      "user",
    );

    return { user, password };
  }

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { deleted_at: null },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, deleted_at: null },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email, deleted_at: null },
    });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  /**
   * Returns true if the stored phone (from encrypted_user_data) differs from newPhone when normalized (digits only).
   */
  private async isPhoneValueChanged(userId: string, newPhone: string): Promise<boolean> {
    const decrypted = await this.encryptedUserDataService.findOneDecrypted(userId);
    const currentNorm = (decrypted?.encrypted_phone ?? "").replace(/\D/g, "");
    const newNorm = newPhone.replace(/\D/g, "");
    return currentNorm !== newNorm;
  }

  /**
   * Saves phone to encrypted_user_data (create or update) and sets user.phone_last_4_digits.
   * Does not save user - caller must save.
   */
  private async savePhoneToEncryptedUserData(
    user: User,
    phone: string,
    countryCode?: string,
  ): Promise<void> {
    const encryptedData = await this.encryptRepository.findOne({
      where: { user_id: user.id },
    });

    const encryptedPhone = encrypt(phone);
    const updatePayload: Partial<EncryptedUserData> = {
      encrypted_phone: encryptedPhone,
    };
    if (countryCode !== undefined) {
      updatePayload.country_code = countryCode;
    }

    if (encryptedData) {
      await this.encryptRepository.update(
        { user_id: user.id },
        updatePayload,
      );
    } else {
      const dto = new CreateEncryptedUserDataDto();
      dto.user_id = user.id;
      dto.encrypted_phone = encryptedPhone;
      if (countryCode !== undefined) {
        dto.country_code = countryCode;
      }
      const encryptUser = this.encryptRepository.create(dto);
      await this.encryptRepository.save(encryptUser);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      let user = await this.findOne(id);

      // Update email
      const oldUserEmail = user.email;
      if (updateUserDto.email && updateUserDto.email !== oldUserEmail) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: updateUserDto.email, deleted_at: null },
        });

        if (existingUser) {
          throw new BadRequestException(
            "The email already exists and cannot be updated.",
          );
        }
        user.is_email_verified = false;
      }

      // Guard: block phone change if within cooldown (only when value actually changes)
      const phoneActuallyChanged =
        updateUserDto.phone !== undefined &&
        (await this.isPhoneValueChanged(id, updateUserDto.phone));
      if (phoneActuallyChanged) {
        user.is_phone_verified = false;
      }

      // Di users.service.ts method update()
      if (
        updateUserDto.firebase_uid &&
        updateUserDto.firebase_uid !== user.firebase_uid
      ) {
        // Validasi bahwa firebase_uid baru exists di Firebase
        await this.firebaseAdmin.auth
          .getUser(updateUserDto.firebase_uid)
          .catch((error) => {
            throw new BadRequestException(
              "Firebase UID not found: " + error.message,
            );
          });
      }

      // Store old user_role to check if it changed
      const oldUserRole = user.user_role;

      User.fromUpdateUserDto(user, updateUserDto);

      // Explicitly set user_role to ensure TypeORM tracks the change
      if (updateUserDto.user_role !== undefined) {
        user.user_role = updateUserDto.user_role;
      }

      // Candidates should not have company_role
      if (user.user_role === UserRole.CANDIDATE) {
        user.company_role = null;
        user.company_id = null;
      }

      user = await this.updateUserEmail(user, oldUserEmail);

      if (updateUserDto.phone !== undefined) {
        await this.savePhoneToEncryptedUserData(user, updateUserDto.phone);
        const last4Digits = extractLast4Digits(updateUserDto.phone);
        if (last4Digits) {
          user.phone_last_4_digits = last4Digits;
        }
      }

      // Update role assignment
      await this.handleUpdateRoleAssignment(user, updateUserDto);

      // Candidates should not have company_role
      if (user.user_role === UserRole.CANDIDATE) {
        user.company_role = null;
        user.company_id = null;
      }

      user = await this.usersRepository.save(user);

      // Update Firebase custom claims if user_role changed
      if (updateUserDto.user_role && updateUserDto.user_role !== oldUserRole) {
        try {
          await this.firebaseAdmin.auth.setCustomUserClaims(user.firebase_uid, {
            user_token_id: user.id,
            roles: [user.user_role],
          });
          this.loggingService.log(
            `Updated Firebase custom claims for user ${user.id}: user_role changed from ${oldUserRole} to ${user.user_role}`,
            "user",
          );
        } catch (error) {
          this.loggingService.error(
            `Failed to update Firebase custom claims for user ${user.id}`,
            "user",
            error.stack,
          );
          // Don't throw error, just log it - database update should still succeed
        }
      }

      user = await this.updateUserVerified(user);

      // If email or phone changed, check for informal certificates
      const emailChanged =
        updateUserDto.email && updateUserDto.email !== oldUserEmail;
      // Note: phone is stored in encrypted_user_data, so we need to check if encrypted_phone is being updated
      // For now, we'll trigger processing if email changed or if phone field is in updateUserDto
      const phoneChanged = updateUserDto.phone !== undefined;

      if (emailChanged || phoneChanged) {
        await this.informalCertificateUserProcessingQueue.add(
          INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
          {
            userId: user.id,
            phone: updateUserDto.phone,
          },
        );
      }

      this.loggingService.log(`User updated successfully: ${user.id}`, "user");
      return user;
    } catch (error) {
      this.loggingService.error(
        `An error occurred while updating user ID:${id}`,
        "user",
        error.stack,
      );
      throw new NotAcceptableException(error);
    }
  }

  /**
   * Auto-create candidate role assignment if user_role='candidate' and no assignment exists
   */
  private async ensureCandidateRoleAssignment(user: User, updateUserDto: UpdateUserDto): Promise<void> {
    const isCandidateRole = (updateUserDto.user_role ?? user.user_role) === UserRole.CANDIDATE;

    if (!isCandidateRole) {
      return;
    }

    // Check if candidate assignment already exists in request body
    const hasCandidateInRequest = updateUserDto.assignments?.some(
      (a) => a.role === UserRoleAssignmentRole.CANDIDATE,
    );

    if (hasCandidateInRequest) {
      return;
    }

    // Check if candidate assignment already exists in database
    const activeAssignments =
      await this.userRoleAssignmentService.getActiveByUserId(user.id);
    const hasCandidateAssignment = activeAssignments.some(
      (a) => a.role === UserRoleAssignmentRole.CANDIDATE,
    );

    if (hasCandidateAssignment) {
      return;
    }

    const candidateAssignment = new UpsertUserRoleAssignmentDto();
    candidateAssignment.user_id = user.id;
    candidateAssignment.role = UserRoleAssignmentRole.CANDIDATE;
    candidateAssignment.start_date = user.created_at
      ? user.created_at.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    candidateAssignment.status = UserRoleAssignmentStatus.ACTIVE;
    candidateAssignment.employment_type = user.employment_status || null;

    if (!updateUserDto.assignments) {
      updateUserDto.assignments = [];
    }
    updateUserDto.assignments.push(candidateAssignment);

    this.loggingService.log(
      `Auto-created candidate role assignment for user ID: ${user.id}`,
      "user",
    );
  }

  /**
   * Auto-create employer role assignment if user has company_id but no assignment exists
   * This handles the case where user is in employer onboarding state but hasn't submitted assignments yet
   */
  private async ensureEmployerRoleAssignment(user: User, updateUserDto: UpdateUserDto): Promise<void> {
    const userRole = updateUserDto.user_role ?? user.user_role;
    if (userRole !== UserRole.COMPANY) {
      return;
    }

    const companyId = updateUserDto.company_id;
    if (!companyId) {
      this.loggingService.log(
        `Skipping employer role assignment auto-create for user ${user.id}: no company_id provided`,
        'user',
      );
      return;
    }

    // Check if employer assignment already exists in request body
    const hasEmployerInRequest = updateUserDto.assignments?.some(
      (a) => a.role === UserRoleAssignmentRole.EMPLOYER,
    );

    if (hasEmployerInRequest) {
      this.loggingService.log(
        `Skipping employer role assignment auto-create for user ${user.id}: employer assignment already in request body`,
        'user',
      );
      return;
    }

    // Check if employer assignment already exists in database
    const activeAssignments = await this.userRoleAssignmentService.getActiveByUserId(user.id);
    const hasEmployerAssignment = activeAssignments.some(
      (a) => a.role === UserRoleAssignmentRole.EMPLOYER,
    );

    if (hasEmployerAssignment) {
      this.loggingService.log(
        `Skipping employer role assignment auto-create for user ${user.id}: employer assignment already exists in database`,
        'user',
      );
      return;
    }

    // Fetch company HQ ID - required for role assignment
    // If company is a branch, get its HQ; if it's already HQ, return itself
    let companyHqId: string;
    try {
      const hqCompany = await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(companyId);
      companyHqId = hqCompany.id;
      this.loggingService.log(
        `Fetched HQ company ${companyHqId} for company ${companyId}`,
        'user',
      );
    } catch (error) {
      // Fallback: use company_id as company_hq_id if HQ not found
      // This handles edge cases where company structure is not yet fully set up
      this.loggingService.warn(
        `Could not get HQ for company ${companyId}: ${error.message}. Using company_id as company_hq_id.`,
        'user',
      );
      companyHqId = companyId;
    }

    // Auto-create employer assignment with default OWNER_HQ role
    // This is the default for users who create companies during onboarding
    const employerAssignment = new UpsertUserRoleAssignmentDto();
    employerAssignment.user_id = user.id;
    employerAssignment.role = UserRoleAssignmentRole.EMPLOYER;
    employerAssignment.company_id = companyId;
    employerAssignment.company_hq_id = companyHqId;
    employerAssignment.company_role = UserRoleAssignmentCompanyRole.OWNER_HQ;
    employerAssignment.start_date = user.created_at
      ? user.created_at.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    employerAssignment.status = UserRoleAssignmentStatus.ACTIVE;
    employerAssignment.employment_type = user.employment_status || null;

    if (!updateUserDto.assignments) {
      updateUserDto.assignments = [];
    }
    updateUserDto.assignments.push(employerAssignment);

    this.loggingService.log(
      `Auto-created employer role assignment for user ID: ${user.id} with company_id: ${companyId}, company_hq_id: ${companyHqId}, company_role: ${UserRoleAssignmentCompanyRole.OWNER_HQ}`,
      'user',
    );
  }

  private async handleUpdateRoleAssignment(user: User, updateUserDto: UpdateUserDto) {
    // Auto-create candidate assignment if user_role='candidate' and no assignment exists
    await this.ensureCandidateRoleAssignment(user, updateUserDto);

    // Auto-create employer assignment if user has company_id but no assignment exists
    await this.ensureEmployerRoleAssignment(user, updateUserDto);

    if (!updateUserDto.assignments || updateUserDto.assignments.length === 0) {
      this.loggingService.log(
        `No role assignments provided for user ID: ${user.id} | skip upsert role assignment`,
        "user",
      );
      return;
    }

    // Get current active assignments to detect role change
    const activeAssignments = await this.userRoleAssignmentService.getActiveByUserId(user.id);

    // Handle initial role assignment
    if (activeAssignments.length === 0) {
      return await this.handleInitialRoleAssignment(user, updateUserDto);
    }

    // Handle existing role assignment
    return await this.upsertExistingRoleAssignment(user, updateUserDto, activeAssignments);
  }

  /**
   * Handle initial role assignment when user has no active assignments
   * This is for new users who are creating their first role assignment
   */
  private async handleInitialRoleAssignment(user: User, updateUserDto: UpdateUserDto): Promise<void> {
    // Populate company_id in assignments if not provided (fallback to DTO company_id)
    updateUserDto.assignments.forEach(a => {
      if (!a.company_id) {
        a.company_id = updateUserDto.company_id;
      }
    });

    this.loggingService.log(
      `Creating initial role assignment for user ${user.id} with ${updateUserDto.assignments.length} assignment(s)`,
      'user',
    );

    await this.userRoleAssignmentService.upsert(updateUserDto.assignments, user.id, updateUserDto.company_id);
  }

  /**
   * Handle existing role assignment update/change
   * Handles both role updates (same role) and role changes (different role)
   */
  private async upsertExistingRoleAssignment(
    user: User,
    updateUserDto: UpdateUserDto,
    activeAssignments: UserRoleAssignmentHistoryResponseDto[],
  ): Promise<void> {
    // Validate: ensure only 1 role, no multiple roles (candidate & employer cannot coexist)
    const proposedRoles = updateUserDto.assignments.map(a => a.role);
    if (proposedRoles.length > 1) {
      this.loggingService.error(
        `Multiple roles proposed for user ${user.id}: ${proposedRoles.join(', ')}`,
        'user',
      );
      throw new BadRequestException("Multiple roles proposed");
    }

    const currentRole = activeAssignments[0].role;
    const proposedRole = proposedRoles[0];

    // If roles are different, cleanup first (based on current role from database)
    // This ensures proper cleanup before creating new role assignment
    if (currentRole !== proposedRole) {
      this.loggingService.log(
        `Role change detected for user ${user.id}: ${currentRole} -> ${proposedRole}. Performing cleanup first.`,
        'user',
      );
      await this.softDeletePreviousRelatedEntities(user.id, currentRole, proposedRole);
      await this.userRoleAssignmentService.changeUserRole(user.id, proposedRole, updateUserDto.assignments);
      return;
    }

    // If roles are same, just upsert (update existing assignment)
    this.loggingService.log(
      `Updating role assignment for user ${user.id} with same role: ${currentRole}`,
      'user',
    );
    await this.userRoleAssignmentService.upsert(updateUserDto.assignments, user.id, updateUserDto.company_id);
  }

  /**
   * Soft delete previous role-related entities when user changes role
   * This ensures data consistency when switching between roles (e.g., EMPLOYER -> CANDIDATE)
   */
  private async softDeletePreviousRelatedEntities(userId: string, currentRole: UserRoleAssignmentRole, proposedRole: UserRoleAssignmentRole) {
    if (currentRole == proposedRole) {
      return;
    }

    // If leaving EMPLOYER role, soft delete company owned by user
    // This handles the case where user created a company but then switches to another role
    if (currentRole === UserRoleAssignmentRole.EMPLOYER) {
      this.loggingService.log(
        `User ${userId} is leaving EMPLOYER role, removing company from owner`,
        "user"
      );
      await this.mstCompaniesService.removeCompanyFromOwner(userId);
    }

    // If leaving CANDIDATE role, soft delete all candidate-related profile data
    // This includes skills, education, certificates, etc. that are specific to candidate profile
    if (currentRole === UserRoleAssignmentRole.CANDIDATE) {
      this.loggingService.log(
        `User ${userId} is leaving CANDIDATE role, soft deleting candidate-related entities`,
        "user"
      );
      const relatedEntities = [
        UserSubscription,
        UserEducation,
        UserSkill,
        UserSkillPassport,
        UserSalaryCountry,
        UserRightToWork,
        UserProfession,
        UserLanguage,
        UserInterest,
        UserFile,
        UserCertificate,
        UserCareerHistory,
      ];

      for (const entity of relatedEntities) {
        await this.entityManager
          .getRepository(entity)
          .softDelete({ user_id: userId });
      }

      this.loggingService.log(
        `Soft deleted ${relatedEntities.length} candidate-related entities for user ${userId}`,
        "user"
      );
    }
  }

  async softDelete(id: string): Promise<void> {
    // Log: Soft delete request received
    this.loggingService.log(
      `[soft-delete] START - Soft deleting user: ${id}`,
      "user",
    );

    // Start a new transaction
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the user
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        this.loggingService.error(
          `[soft-delete] FAILED - User not found: ${id}`,
          "user",
        );
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Log: User found
      this.loggingService.log(
        `[soft-delete] User found - user_id: ${user.id}, firebase_uid: ${user.firebase_uid}, email: ${user.email}`,
        "user",
      );

      // Validate delete-account rules for employer owner/PIC
      await this.userRoleAssignmentService.assertCanDeleteUserAccount(user.id);

      // Delete all role assignment and history records for this user (same transaction)
      await this.userRoleAssignmentService.deleteAllAssignmentsAndHistoryForUser(user.id, queryRunner.manager);

      const firebaseUid = user.firebase_uid;
      const timestamp = new Date().toISOString();
      user.firebase_uid = `${user.firebase_uid}-deleted-${timestamp}`;
      user.email = `${user.email}-deleted-${timestamp}`;

      // Log: Firebase UID modified
      this.loggingService.log(
        `[soft-delete] Modified user data - original_firebase_uid: ${firebaseUid}, new_firebase_uid: ${user.firebase_uid}`,
        "user",
      );

      // Save user modifications and soft delete within the transaction
      await queryRunner.manager.save(user);
      const result = await queryRunner.manager.softDelete(
        this.usersRepository.target,
        { id },
      );

      // Log: DB soft delete succeeded
      this.loggingService.log(
        `[soft-delete] DB soft delete SUCCESS - user_id: ${id}, affected_rows: ${result.affected}`,
        "user",
      );

      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Delete user from Firebase
      try {
        // Log: Attempting Firebase deletion
        this.loggingService.log(
          `[soft-delete] Attempting Firebase deletion - firebase_uid: ${firebaseUid}`,
          "user",
        );

        // Check if Firebase user exists before attempting to delete
        try {
          await this.firebaseAdmin.auth.getUser(firebaseUid);
          // User exists, proceed with deletion
          await this.firebaseAdmin.auth.deleteUser(firebaseUid);

          // Log: Firebase deletion succeeded
          this.loggingService.log(
            `[soft-delete] Firebase deletion SUCCESS - firebase_uid: ${firebaseUid}`,
            "user",
          );
        } catch (getUserError) {
          // If user not found, it's already deleted - this is OK
          if (getUserError.code === "auth/user-not-found") {
            this.loggingService.log(
              `[soft-delete] Firebase user already deleted (not found) - firebase_uid: ${firebaseUid}`,
              "user",
            );
          } else {
            // Other error, re-throw
            this.loggingService.error(
              `[soft-delete] Firebase getUser error - firebase_uid: ${firebaseUid}`,
              "user",
              getUserError.stack,
            );
            throw getUserError;
          }
        }
      } catch (error) {
        this.loggingService.error(
          `Failed to delete user from Firebase: ${firebaseUid}`,
          "user",
          error.stack,
        );
        // If Firebase user not found, it's already deleted - continue with soft delete
        if (error.code === "auth/user-not-found") {
          this.loggingService.log(
            `Firebase user not found, continuing with soft delete: ${firebaseUid}`,
          );
        } else {
          throw new NotAcceptableException(error);
        }
      }

      // Commit the transaction if all steps succeed
      await queryRunner.commitTransaction();

      // Log: Transaction committed successfully
      this.loggingService.log(
        `[soft-delete] COMPLETED - Transaction committed for user_id: ${id}, firebase_uid: ${firebaseUid}`,
        "user",
      );
    } catch (error) {
      this.loggingService.error(
        `[soft-delete] FAILED - Transaction rollback for user_id: ${id}`,
        "user",
        error.stack,
      );
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();

      this.loggingService.log(
        `[soft-delete] Transaction rolled back for user_id: ${id}`,
        "user",
      );
      throw error;
    } finally {
      // Release the query runner to prevent memory leaks
      await queryRunner.release();
    }
  }

  async generateOtp(user: User): Promise<string> {
    const latestOtp = await this.otpRepository.findOne({
      where: { user_id: user.id },
      order: { expiry_date: "DESC" },
    });

    if (latestOtp && new Date() < new Date(latestOtp.expiry_date)) {
      throw new BadRequestException(
        "OTP request limit exceeded. Please wait until the current OTP expires.",
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_date = new Date();
    expiry_date.setSeconds(expiry_date.getSeconds() + EMAIL_OTP_VALIDITY_SECONDS);
    const newOtp = this.otpRepository.create({
      user_id: user.id,
      otp,
      expiry_date,
    });
    await this.otpRepository.save(newOtp);
    return otp;
  }

  async verifyOtp(user: User, otp: string) {
    const savedOtp = await this.otpRepository.findOne({
      where: { user_id: user.id, otp },
    });

    if (!savedOtp || savedOtp.expiry_date < new Date()) {
      throw new NotFoundException("Invalid or expired OTP");
    }

    user.is_email_verified = true;
    await this.usersRepository.save(user);
    await this.otpRepository.remove(savedOtp);
    await this.userFieldGuardService.recordGuard(user.id, UserFieldGuardType.EMAIL, user.email);

    return { message: "OTP verified successfully" };
  }

  async changePassword(
    user: User,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { newPassword } = changePasswordDto;
    try {
      await this.firebaseAdmin.auth.updateUser(user.firebase_uid, {
        password: newPassword,
      });
    } catch (error: any) {
      throw new NotFoundException(
        `Failed to change password : ${error.message}`,
      );
    }
  }

  async getResetPasswordLink(email: string, firebaseUid?: string) {
    try {
      let firebaseUser;

      this.loggingService.debug(`getResetPasswordLink firebaseUid=${firebaseUid ?? "undefined"}`, "users");
      // Try to get Firebase user by UID first (more reliable), fallback to email
      if (firebaseUid) {
        try {
          this.loggingService.debug("getResetPasswordLink fetching firebaseUser by uid", "users");
          firebaseUser = await this.firebaseAdmin.auth.getUser(firebaseUid);
        } catch (uidError) {
          // If UID lookup fails, try email
          this.loggingService.debug(
            `getResetPasswordLink uid lookup failed: ${uidError instanceof Error ? uidError.message : String(uidError)}`,
            "users",
          );
          firebaseUser = await this.firebaseAdmin.auth.getUserByEmail(email);
        }
      } else {
        firebaseUser = await this.firebaseAdmin.auth.getUserByEmail(email);
      }

      // Check if user has email/password authentication
      const hasPasswordProvider = firebaseUser.providerData.some(
        (provider) => provider.providerId === "password",
      );

      if (!hasPasswordProvider) {
        // Get OAuth provider names
        const oauthProviders = firebaseUser.providerData
          .filter((provider) => provider.providerId !== "password")
          .map((provider) => {
            const providerMap: { [key: string]: string } = {
              "google.com": "Google",
              "apple.com": "Apple",
              "facebook.com": "Facebook",
              "github.com": "GitHub",
            };
            return providerMap[provider.providerId] || provider.providerId;
          });

        const providerNames = oauthProviders.join(" or ");
        throw new BadRequestException(
          `This account was registered using ${providerNames}. Please sign in using ${providerNames} to access your account.`,
        );
      }

      return await this.firebaseAdmin.auth.generatePasswordResetLink(email);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException(
        `Failed to send password reset email: ${error.message}`,
      );
    }
  }

  async publicGenerateOtp(email: string): Promise<string> {
    const userExist = await this.usersRepository.findOneBy({ email });
    if (userExist) {
      throw new BadRequestException("email is already exist, please login.");
    }

    const latestOtp = await this.otpRepository.findOne({
      where: { email: email },
      order: { expiry_date: "DESC" },
    });

    if (latestOtp && new Date() < new Date(latestOtp.expiry_date)) {
      throw new BadRequestException(
        "OTP request limit exceeded. Please wait until the current OTP expires.",
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_date = new Date();
    expiry_date.setMinutes(expiry_date.getMinutes() + 5); // OTP expires in 10 minutes
    const newOtp = this.otpRepository.create({
      email: email,
      otp,
      expiry_date,
    });
    await this.otpRepository.save(newOtp);
    return otp;
  }

  async publicVerifyOtp(email: string, otp: string) {
    const savedOtp = await this.otpRepository.findOne({
      where: { email, otp },
    });
    if (!savedOtp || savedOtp.expiry_date < new Date()) {
      return false;
      //throw new NotFoundException("Invalid or expired OTP");
    }
    await this.otpRepository.remove(savedOtp);
    return true;
  }

  async updateUserVerified(user: User): Promise<User> {
    // Cek status skill passport
    const userSkillPassports = await this.userSkillPassportRepository.findBy({
      user_id: user.id,
    });

    if (userSkillPassports.length === 0) {
      user.is_skill_passport_verified = null;
    } else {
      user.is_skill_passport_verified = userSkillPassports.some(
        (passport) => passport.status === StatusSkillPassport.VERIFIED,
      )
        ? true
        : false;
    }

    // Cek status sekolah yang terverifikasi
    const userEducations = await this.userEducationRepository
      .createQueryBuilder("userEducation")
      .innerJoinAndSelect("userEducation.school", "school")
      .where("userEducation.user_id = :userId", { userId: user.id })
      .andWhere("school.is_verified = true")
      .getMany();

    user.is_school_verified = userEducations.length > 0 ? true : false;
    user = await this.usersRepository.save(user);

    return user;
  }

  async updateUserEmail(user: User, oldUserEmail: string): Promise<User> {
    if (user.email !== oldUserEmail) {
      if (
        await this.userRoleAssignmentService.isUserInAnyCompanyRole(user.id, [
          UserRoleAssignmentCompanyRole.MEMBER,
          UserRoleAssignmentCompanyRole.HRD_BRANCH,
          UserRoleAssignmentCompanyRole.HRD_HQ,
        ])
      ) {
        user = await this.usersRepository.save(user);
        try {
          const password = this.generateRandomPassword();

          await this.firebaseAdmin.auth.updateUser(user.firebase_uid, {
            email: user.email,
            password: password,
          });

          const company = await this.mstCompanyRepository.findOneBy({
            id: user.company_id,
          });

          // Send new credentials via email
          await this.emailService.sendDefaultCredentials(
            user,
            user.email,
            password,
            company,
          );
        } catch (error) {
          throw new NotFoundException(
            `Failed to update email and password in Firebase: ${error.message}`,
          );
        }
      } else {
        await this.firebaseAdmin.auth.updateUser(user.firebase_uid, {
          email: user.email,
        });
      }
    }
    return user;
  }

  public generateRandomPassword(length = 12) {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@";
    let password = "";

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Update Firebase user password for retry scenarios
   */
  async updateFirebaseUserPassword(
    firebaseUid: string,
    newPassword: string,
  ): Promise<void> {
    try {
      await this.firebaseAdmin.auth.updateUser(firebaseUid, {
        password: newPassword,
      });
    } catch (error: any) {
      throw new NotFoundException(
        `Failed to update Firebase user password: ${error.message}`,
      );
    }
  }

  private async getCandidateWizardState() {
    const defaultWizardState = [
      { id: "1", name: "PERSONAL_RESUME", label: "Personal Detail", state: 0 },
      { id: "2", name: "CAREER_HISTORY", label: "Career History", state: 0 },
      {
        id: "3",
        name: "EDUCATION_HISTORY",
        label: "Education History",
        state: 0,
      },
      {
        id: "4",
        name: "LICENSE_CERTIFICATE",
        label: "License / Certifications",
        state: 0,
      },
      {
        id: "5",
        name: "SKILL_LANGUAGE",
        label: "Skills and Languages",
        state: 0,
      },
      { id: "6", name: "WORK_PREFERENCE", label: "Work Preference", state: 0 },
      { id: "7", name: "RIGHT_TO_WORK", label: "Right To Work", state: 0 },
      { id: "8", name: "INTEREST", label: "Interest", state: 0 },
      {
        id: "9",
        name: "SALARY_EXPECTATION",
        label: "Salary Expectation",
        state: 0,
      },
      {
        id: "10",
        name: "ASEAN_SKILL_PASSPORT",
        label: "Skill Passport (MRA-TP Standard)",
        state: 0,
      },
    ];

    try {
      const configResult = await this.configService.findByKey(
        "list_of_wizard_candidate",
      );
      const result = configResult?.value || defaultWizardState;
      return result.map((item) => {
        return {
          id: item.id,
          name: item.name,
          label: item.label,
          state: item.state ?? 0,
        };
      });
    } catch {
      this.loggingService.warn(
        "Config 'list_of_wizard_candidate' not found, using default wizard state",
        "users",
      );
      return defaultWizardState;
    }
  }

  /**
   * Update user profile data for existing users
   */
  async updateUserProfile(
    user: User,
    updateData: Partial<User>,
  ): Promise<User> {
    this.loggingService.log(
      `Updating user profile for: ${user.id}`,
      "user-profile-update",
    );

    // Update user fields if provided
    if (updateData.full_name !== undefined)
      user.full_name = updateData.full_name;
    if (updateData.photo_url !== undefined)
      user.photo_url = updateData.photo_url;
    if (updateData.region_id !== undefined)
      user.region_id = updateData.region_id;
    if (updateData.is_outside_indo !== undefined)
      user.is_outside_indo = updateData.is_outside_indo;
    if (updateData.other_country !== undefined)
      user.other_country = updateData.other_country;
    if (updateData.other_region !== undefined)
      user.other_region = updateData.other_region;
    if (updateData.gender !== undefined) user.gender = updateData.gender;
    if (updateData.postal_code !== undefined)
      user.postal_code = updateData.postal_code;
    if (updateData.company_id !== undefined)
      user.company_id = updateData.company_id;

    user = await this.usersRepository.save(user);
    this.loggingService.log(
      `User profile updated for: ${user.id} to ${JSON.stringify(user)}`,
      "user-profile-update",
    );
    return user;
  }

  /**
   * Process informal certificates for a user
   * @param userId - User ID to process
   * @param phone - Optional phone from DTO to avoid querying encrypted_user_data
   */
  async processInformalCertificatesForUser(
    userId: string,
    phone?: string,
  ): Promise<void> {
    const user = await this.findOne(userId);

    // Use phone from parameter if provided, otherwise get from encrypted_user_data
    let decryptedPhone: string | undefined = phone;

    if (!decryptedPhone) {
      // Only query encrypted_user_data if phone not provided from caller
      try {
        const encryptedData =
          await this.encryptedUserDataService.findOneDecrypted(userId);
        decryptedPhone = encryptedData?.encrypted_phone || undefined;
      } catch (error) {
        // If encrypted data not found or error, continue with email only
        this.loggingService.warn(
          `Could not retrieve encrypted phone for user ${userId}`,
          "informal_certificate_processing",
          { error: error?.message || String(error), userId },
        );
      }
    }

    if (!user.email && !decryptedPhone) {
      return; // No contact info to match
    }

    // Process mappings for this user (efficient - no need to get all users)
    await this.informalCertificateMappingService.processMappingsForUser(
      user.id,
      user.email || undefined,
      decryptedPhone,
    );
  }

  /**
   * Get user profile with role and permissions
   */
  async getUserProfile(userId: string): Promise<RoleDto[]> {
    // Get active role assignments
    const roleAssignments =
      await this.userRoleAssignmentService.getActiveByUserId(userId);

    // If no active assignments, return empty array (OK for new registered users)
    if (!roleAssignments.length) {
      return [];
    }

    const result: RoleDto[] = [];
    for (const roleAssignment of roleAssignments) {
      const permissions =
        await this.rbacService.getPermissionsByUserRoleAssignment(
          roleAssignment,
        );
      result.push({
        assignment: roleAssignment,
        permissions,
      });
    }

    return result;
  }
}
