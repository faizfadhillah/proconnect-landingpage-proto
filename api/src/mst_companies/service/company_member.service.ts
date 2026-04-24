import {
    Injectable,
    Inject,
    forwardRef,
    BadRequestException,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "src/users/entities/user.entity";
import { FirebaseAdmin, InjectFirebaseAdmin } from "nestjs-firebase";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { EncryptedUserData } from "src/encrypted_user_data/entities/encrypted_user_data.entity";
import { MailjetService } from "src/users/mailjet.service";
import { ConfigsService } from "src/config/config.service";
import { LoggingService } from "src/logs/logs.service";
import { UsersService } from "src/users/users.service";
import { EncryptedUserDataService } from "src/encrypted_user_data/encrypted_user_data.service";
import { MstCompany } from "../entities/mst_company.entity";
import { CreateEncryptedUserDataDto } from "src/encrypted_user_data/dto/create-encrypted_user_data.dto";
import { decrypt, encrypt } from "src/encrypted_user_data/encryption.util";
import { UserRoleAssignmentRole } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { CompanyMemberResponseDto } from "../dto/company-member-response.dto";
import { UpsertMemberDto } from "../dto/upsert-member.dto";
import { UpsertMemberResponseDto } from "../dto/upsert-member-response.dto";
import { MstCompanyHqBranchRelationService } from "./company_hq_branch_relation.service";
import { UserRoleAssignmentHistoryResponseDto } from "src/user_role_assignments/dto/user_role_assignment_history_response.dto";
import { CompanyMemberDetailResponseDto } from "../dto/company-member-detail-response.dto";
import { BasePaginationCompanyMember } from "../dto/base-pagination-company-member.dto";

@Injectable()
export class MstCompanyMemberService {
    constructor(
        @InjectRepository(MstCompany)
        private mstCompanyRepository: Repository<MstCompany>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(EncryptedUserData)
        private encryptRepository: Repository<EncryptedUserData>,
        @InjectFirebaseAdmin()
        private readonly firebaseAdmin: FirebaseAdmin,
        private readonly emailService: MailjetService,
        private readonly configService: ConfigsService,
        @Inject(forwardRef(() => UserRoleAssignmentService))
        private readonly userRoleAssignmentService: UserRoleAssignmentService,
        private readonly logger: LoggingService,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private readonly encryptedUserDataService: EncryptedUserDataService,
        private readonly companyHqBranchRelationService: MstCompanyHqBranchRelationService,
    ) { }

    async upsertMember(dto: UpsertMemberDto, parent: User): Promise<UpsertMemberResponseDto> {
        this.logger.log(`Upserting member: ${dto.email}`, "member-upsert");

        if (!dto.assignments || dto.assignments.length === 0) {
            throw new BadRequestException("Assignments are required");
        }

        const firstAssignment = dto.assignments[0];
        const userId = firstAssignment.user_id;
        if (userId) {
            const existingUser = await this.usersRepository.findOne({
                where: { id: userId },
            });
            if (!existingUser) {
                throw new NotFoundException(`User with ID ${userId} not found`);
            }

            this.logger.log(`User exists, updating user data and assignments: ${existingUser.id}`, "member-upsert");

            // Update user profile data
            await this.usersService.updateUserProfile(existingUser, dto);

            // Upsert encrypted user data
            const encryptedData = await this.encryptedUserDataService.upsertEncryptedUserData(existingUser, dto);

            // Update role assignments
            const assignments = await this.upsertUserRoleAssignment(existingUser, dto);
            const response = Object.assign(new UpsertMemberResponseDto(), existingUser, {
                assignments,
                encrypted_date_of_birth: decrypt(encryptedData?.encrypted_date_of_birth),
                encrypted_nik: decrypt(encryptedData?.encrypted_nik),
                encrypted_phone: decrypt(encryptedData?.encrypted_phone),
                encrypted_address: decrypt(encryptedData?.encrypted_address)
            });
            return response;
        }

        const existingUser = await this.usersRepository.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new BadRequestException(`User with email ${dto.email} already exists`);
        }

        this.logger.log(`User does not exist, adding new member: ${dto.email}`, "member-upsert");
        const user = await this.addMember(dto, parent);
        const assignments = await this.upsertUserRoleAssignment(user, dto);
        
        // Get encrypted data for new member
        const encryptedData = await this.encryptedUserDataService.findOneDecrypted(user.id);
        
        const response = Object.assign(new UpsertMemberResponseDto(), user, {
            assignments,
            encrypted_date_of_birth: encryptedData?.encrypted_date_of_birth,
            encrypted_nik: encryptedData?.encrypted_nik,
            encrypted_phone: encryptedData?.encrypted_phone,
            encrypted_address: encryptedData?.encrypted_address
        });
        return response;
    }

    private async addMember(dto: UpsertMemberDto, parent: User) {
        this.logger.log(`Adding member: ${dto.email}`, "member-add");

        const password = this.generateRandomPassword(12);

        const firebaseUser = await this.firebaseAdmin.auth
            .createUser({
                email: dto.email,
                password: password,
            })
            .catch((error) => {
                this.logger.error(`Firebase user creation failed: ${error.message}`, "member-add");
                throw new BadRequestException("Firebase: " + error.message);
            });

        // Gunakan method helper untuk get wizard state
        const wizard_state = await this.getWizardState();

        let user = this.usersRepository.create(dto);
        user.email = firebaseUser.email;
        user.full_name = user.full_name || firebaseUser.displayName;
        user.firebase_uid = firebaseUser.uid;
        user.is_email_verified = firebaseUser.emailVerified;
        user.user_role = UserRole.COMPANY;
        user.company_id = dto.company_id || parent.company_id;
        user.roles = ["employer"];
        user.last_wizard_state = 99;
        user.wizard_state = wizard_state;

        // Save user first to get valid ID before creating encrypted data
        delete user.id;
        user = await this.usersRepository.save(user);

        // Handle encrypted data after user has valid ID
        if (
            dto.encrypted_phone ||
            dto.encrypted_date_of_birth ||
            dto.encrypted_address ||
            dto.phone
        ) {
            const dtoEncrypt = new CreateEncryptedUserDataDto();
            dtoEncrypt.encrypted_phone = encrypt(dto.encrypted_phone || dto.phone);
            dtoEncrypt.encrypted_date_of_birth = encrypt(dto.encrypted_date_of_birth);
            dtoEncrypt.encrypted_address = encrypt(dto.encrypted_address);
            dtoEncrypt.encrypted_nik = encrypt(dto.encrypted_nik);
            dtoEncrypt.user_id = user.id;
            const encryptUser = this.encryptRepository.create(dtoEncrypt);
            await this.encryptRepository.save(encryptUser);
            this.logger.log(`Encrypted user data created for: ${user.id} with ${JSON.stringify(encryptUser)}`,
                "encrypted-user-data-create");

            if (user && dto.encrypted_date_of_birth) {
                const dateString = dto.encrypted_date_of_birth;
                const date = new Date(dateString);
                const year = date.getFullYear();
                user.birth_year = year;
                await this.usersRepository.save(user);
            }
        }

        this.firebaseAdmin.auth.setCustomUserClaims(user.firebase_uid, {
            user_token_id: user.id,
            roles: [user.user_role],
        });

        const company = await this.mstCompanyRepository.findOneBy({
            id: user.company_id,
        });

        await this.emailService.sendDefaultCredentials(
            user,
            user.email,
            password,
            company,
        );

        this.logger.log(`Member added successfully: ${user.id}`, "member-add");
        return user;
    }

    /**
     * Helper method to create user role assignment
     */
    private async upsertUserRoleAssignment(user: User, dto: UpsertMemberDto): Promise<UserRoleAssignmentHistoryResponseDto[]> {
        // Populate user and company data
        const companyHq = await this.companyHqBranchRelationService.getHqCompanyFromBranch(dto.company_id);

        for (const assignment of dto.assignments) {
            assignment.user_id = assignment.user_id ?? user.id;
            assignment.company_id = assignment.company_id ?? dto.company_id;
            assignment.company_hq_id = companyHq?.id ?? dto.company_id;
            assignment.role = UserRoleAssignmentRole.EMPLOYER;
        }

        // Upsert user role assignments
        try {
            const assignments = await this.userRoleAssignmentService.upsert(dto.assignments, user.id, dto.company_id);
            this.logger.log(`Role assignments created for user: ${user.id}, assignments ${JSON.stringify(assignments)}`, "role-assignment");
            return assignments;
        } catch (error) {
            this.logger.error(`Role assignment failed for user: ${user.id}, error: ${error.message}`, error.stack, "role-assignment");
            throw new BadRequestException(`Failed to create role assignments for user: ${user.id}, error: ${error.message}`);
        }
    }

    /**
     * Get company members using user_role_assignments service
     */
    async getMembers(
        companyId?: string,
        companyHqId?: string,
        companyRole?: string,
        deptId?: string,
        name?: string,
        email?: string,
        status?: string,
        page?: number,
        limit?: number,
        userId?: string,
    ): Promise<BasePaginationCompanyMember<CompanyMemberResponseDto>> {
        this.logger.log(`Getting company members: companyId=${companyId}, hqId=${companyHqId}, status=${status}, name=${name}, email=${email}, page=${page}, limit=${limit}`, "member-get");

        if (!companyHqId && !companyId) {
            this.logger.error(`Getting company members failed: no company ID or HQ ID provided`, "member-get");
            throw new BadRequestException("Either companyId or companyHqId must be provided");
        }

        // Use new service method that supports status filtering and includes both active and inactive members
        const rawData = await this.userRoleAssignmentService.getCompanyMembers(
            companyId,
            companyHqId,
            companyRole,
            deptId,
            name,
            email,
            status,
            page,
            limit,
            userId
        );

        // Convert raw data to DTOs
        const members = rawData.map(data => CompanyMemberResponseDto.fromJoinedData(data));

        this.logger.log(`Retrieved ${members.length} members for company: ${companyId} with status: ${status || 'ALL'}`, "member-get");

        // Always return paginated result for consistency
        const total = await this.userRoleAssignmentService.countCompanyMembers(
            companyId,
            companyHqId,
            companyRole,
            deptId,
            name,
            email,
            status,
            userId
        );

        const totalShowMember = await this.userRoleAssignmentService.countDistinctCompanyMembersByUserId(
            companyId,
            companyHqId,
            companyRole,
            deptId,
            name,
            email,
            status,
            userId
        );

        if (page && limit) {
            return {
                items: members,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    totalShowMember
                }
            };
        }

        // Return all items with pagination metadata (page 1, limit = total)
        return {
            items: members,
            meta: {
                total,
                page: 1,
                limit: total,
                totalPages: 1,
                totalShowMember
            }
        };
    }

    /**
     * Delete member with cascade logic using user_role_assignments service
     */
    async deleteMember(userId: string, companyId?: string, companyHqId?: string) {
        this.logger.log(`Deleting member: userId=${userId}, companyId=${companyId}, companyHqId=${companyHqId}`, "member-delete");

        if (!companyId && !companyHqId) {
            this.logger.error(`Delete member failed: no company ID provided`, "member-delete");
            throw new BadRequestException("Either companyId or companyHqId must be provided");
        }

        const result = await this.userRoleAssignmentService.deactivateUserAssignmentsByCompany(
            userId,
            companyId,
            companyHqId,
        );

        this.logger.log(`Member deleted successfully: userId=${userId}`, "member-delete");
        return result;
    }

    private generateRandomPassword(length = 12) {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@";
        let password = "";

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }

        return password;
    }

    private async getWizardState() {
        const defaultWizardState = [
            {
                id: "1",
                name: "COMPANY_DETAIL",
                label: "Business Profile Details",
                state: "1",
            },
            {
                id: "2",
                name: "PIC_REGISTRATION",
                label: "Company Representative Info",
                state: "1",
            },
            { id: "3", name: "MANAGE_MEMBER", label: "Add Your Team", state: "1" },
        ];

        try {
            const configResult = await this.configService.findByKey(
                "list_of_wizard_employer",
            );
            const result = configResult?.value || defaultWizardState;
            return result.map((item) => {
                return {
                    id: item.id,
                    name: item.name,
                    label: item.label,
                    state: "1",
                };
            });
        } catch {
            this.logger.warn(
                "Config 'list_of_wizard_candidate' not found, using default wizard state",
            );
            return defaultWizardState;
        }
    }

    /**
     * Get detailed member information including encrypted data and role history
     */
    async getMemberDetail(userId: string, companyHqId: string): Promise<CompanyMemberDetailResponseDto> {
        this.logger.log(`Getting member detail: userId=${userId}, companyHqId=${companyHqId}`, "member-detail");

        if (!userId || !companyHqId) {
            this.logger.error(`Get member detail failed: userId and companyHqId are required`, "member-detail");
            throw new BadRequestException("Both userId and companyHqId are required");
        }

        // Get user data using UsersService
        const user = await this.usersService.findOne(userId);
        if (!user) {
            this.logger.error(`User not found: ${userId}`, "member-detail");
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        // Get encrypted user data using EncryptedUserDataService
        const encryptedData = await this.encryptedUserDataService.findOne(userId);

        // Get detailed role assignment history using UserRoleAssignmentService with joined relations
        const roleHistory = await this.userRoleAssignmentService.getCompanyMemberResponseList(userId);

        // Combine all data into response DTO with detailed assignments
        const response = CompanyMemberDetailResponseDto.fromData(user, encryptedData, roleHistory);

        this.logger.log(`Member detail retrieved successfully: ${userId}`, "member-detail");
        return response;
    }

}
