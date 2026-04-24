import {
    Injectable,
    Inject,
    forwardRef,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { MailjetService } from "src/users/mailjet.service";
import { LoggingService } from "src/logs/logs.service";
import { FirebaseService } from "src/firebase/firebase.service";
import { UpsertUserRoleAssignmentDto } from "src/user_role_assignments/dto/upsert_user_role_assignment.dto";
import { UserRoleAssignmentCompanyRole, UserRoleAssignmentRole, UserRoleAssignmentStatus } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { TransferOwnershipDto, UpdatedPlacementDto } from "../dto/transfer-ownership.dto";
import { MstCompany } from "../entities/mst_company.entity";
import { UserRoleAssignment } from "src/user_role_assignments/entities/user_role_assignment.entity";

@Injectable()
export class HqTransferOwnershipService {
    constructor(
        @InjectRepository(MstCompany)
        private mstCompanyRepository: Repository<MstCompany>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private readonly emailService: MailjetService,
        @Inject(forwardRef(() => UserRoleAssignmentService))
        private readonly userRoleAssignmentService: UserRoleAssignmentService,
        private readonly logger: LoggingService,
        private readonly firebaseService: FirebaseService,
    ) { }

    public async transferOwnership(transferDto: TransferOwnershipDto, currentUser: User): Promise<{ success: boolean; message: string; }> {
        this.logger.log(`Transferring ownership of company HQ ${transferDto.company_hq_id} from ${currentUser.id} to ${transferDto.new_owner_user_id}`);

        // Get active role assignments for current user
        const currentAssignments = await this.userRoleAssignmentService.getActiveByUserId(currentUser.id);

        // Check if current user is the owner of the company HQ
        const isOwnerOrSysAdmin = currentAssignments.some(assignment => {
            // return if owner
            if (assignment.company_hq_id === transferDto.company_hq_id &&
                assignment.company_role === UserRoleAssignmentCompanyRole.OWNER_HQ) {
                return true;
            }

            // return if sys admin
            return assignment.role === UserRoleAssignmentRole.SYS_ADMIN;
        });

        if (!isOwnerOrSysAdmin) {
            throw new BadRequestException("You are not the owner of this company");
        }

        // cannot set prev owner to owner
        if (transferDto.updated_placement.company_role == UserRoleAssignmentCompanyRole.OWNER_HQ) {
            throw new BadRequestException("Cannot set previous owner to owner");
        }

        // Get active role assignments for new owner
        const newOwnerAssignments = await this.userRoleAssignmentService.getActiveByUserId(transferDto.new_owner_user_id);

        // Check if new owner has an employer role assignment in the same company HQ
        const newOwnerAssignment = newOwnerAssignments.find(assignment =>
            assignment.company_hq_id === transferDto.company_hq_id &&
            assignment.role === UserRoleAssignmentRole.EMPLOYER
        );
        if (!newOwnerAssignment) {
            throw new NotFoundException(`New owner not found for company HQ ${transferDto.company_hq_id}`);
        }

        // Get owner assignment
        const ownerAssignment: UserRoleAssignment = await this.userRoleAssignmentService.getOwnerAssignment(transferDto.company_hq_id);

        // Update current owner placement
        await this.updateCurrentOwnerPlacement(transferDto.updated_placement, transferDto.company_hq_id, ownerAssignment.userId);

        // Update new owner to OWNER_HQ
        await this.updateNewOwnerPlacement(transferDto.company_hq_id, transferDto.new_owner_user_id);

        this.sendNotificationCompanyRoleUpdated(transferDto.new_owner_user_id, transferDto.company_hq_id, UserRoleAssignmentCompanyRole.OWNER_HQ);

        this.logger.log(`Ownership transferred successfully from ${ownerAssignment.userId} to ${transferDto.new_owner_user_id} for company HQ ${transferDto.company_hq_id}`);

        return {
            success: true,
            message: "Ownership transferred successfully",
        }
    }

    private async updateCurrentOwnerPlacement(updatedPlacementDto: UpdatedPlacementDto, companyHqId: string, currentUserId: string) {
        const currentOwnerUpdate = UpdatedPlacementDto.toUpsertUserRoleAssignmentDto(updatedPlacementDto,
            currentUserId,
            companyHqId);
        const currentOwnerUpdates: UpsertUserRoleAssignmentDto[] = [];
        currentOwnerUpdates.push(currentOwnerUpdate);
        await this.userRoleAssignmentService.upsert(currentOwnerUpdates, currentUserId, companyHqId);
    }

    private async updateNewOwnerPlacement(companyHqId: string, newOwnerUserId: string) {
        const newOwnerUpdate: UpsertUserRoleAssignmentDto = new UpsertUserRoleAssignmentDto();
        newOwnerUpdate.user_id = newOwnerUserId
        newOwnerUpdate.company_hq_id = companyHqId
        newOwnerUpdate.company_id = companyHqId
        newOwnerUpdate.dept_id = null
        newOwnerUpdate.company_role = UserRoleAssignmentCompanyRole.OWNER_HQ;
        newOwnerUpdate.role = UserRoleAssignmentRole.EMPLOYER;
        newOwnerUpdate.status = UserRoleAssignmentStatus.ACTIVE;
        newOwnerUpdate.start_date = new Date().toISOString().split('T')[0];

        const newOwnerUpdates: UpsertUserRoleAssignmentDto[] = [];
        newOwnerUpdates.push(newOwnerUpdate);
        await this.userRoleAssignmentService.upsert(newOwnerUpdates, newOwnerUpdate.user_id, newOwnerUpdate.company_id);
    }

    private async sendNotificationCompanyRoleUpdated(newOwnerUserId: string, companyHqId: string, newRole: string) {
        //sendi notification and email to this user
        const user = await this.usersRepository.findOneBy({ id: newOwnerUserId });
        const company = await this.mstCompanyRepository.findOneBy({ id: companyHqId });

        if (!user || !company) {
            this.logger.error(`User or company not found for company role updated notification: ${newOwnerUserId} - ${companyHqId}`);
            return;
        }

        this.firebaseService.sendPushNotification(
            user.firebase_uid,
            {
                notification: {
                    title: "Company Role Updated",
                    body: `Hi ${user.full_name || user.email}, you have been assigned as Company Owner ${company.company_name}`,
                    image: company.logo_url,
                },
                data: {
                    entity: "company",
                    id: company.id,
                },
            },
            { company: company },
        );
        await this.emailService.sendCompanyRoleChange(user, newRole);
    }
}
