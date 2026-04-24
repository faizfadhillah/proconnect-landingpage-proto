import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { EncryptedUserData } from "./entities/encrypted_user_data.entity";
import { CreateEncryptedUserDataDto } from "./dto/create-encrypted_user_data.dto";
import { UpdateEncryptedUserDataDto } from "./dto/update-encrypted_user_data.dto";
import { decrypt, encrypt } from "./encryption.util";
import { User } from "src/users/entities/user.entity";
import * as moment from "moment-timezone";
import { RequestContextService } from "src/common/request-context/request-context.service";
import { UpsertMemberDto } from "src/mst_companies/dto/upsert-member.dto";
import { LoggingService } from "src/logs/logs.service";
import { UserFieldGuardService } from "src/users/user-field-guard.service";
import { UserFieldGuardType } from "src/users/enums/user-field-guard-type.enum";

@Injectable()
export class EncryptedUserDataService {
  constructor(
    @InjectRepository(EncryptedUserData)
    private encryptedUserDataRepository: Repository<EncryptedUserData>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly logger: LoggingService,
    private readonly requestContextService: RequestContextService,
    private readonly userFieldGuardService: UserFieldGuardService,
  ) { }

  /**
   * Update birth_year based on encrypted_date_of_birth
   */
  private async updateBirthYear(userId: string, encryptedDateOfBirth: string | null): Promise<void> {
    const userData = await this.userRepository.findOneBy({ id: userId });
    if (userData) {
      if (encryptedDateOfBirth) {
        const dateString = encryptedDateOfBirth;
        const date = new Date(dateString);
        const year = date.getFullYear();
        userData.birth_year = isNaN(year) ? null : year;
      } else {
        // Clear birth_year if date_of_birth is empty
        userData.birth_year = null;
      }
      await this.userRepository.save(userData);
    }
  }

  async create(
    createEncryptedUserDataDto: CreateEncryptedUserDataDto,
  ): Promise<EncryptedUserData> {
    // Find existing encrypted user data by user_id
    let encryptedUserData = await this.encryptedUserDataRepository.findOneBy({
      user_id: createEncryptedUserDataDto.user_id,
    });

    // Common encrypted fields
    const encryptedFields = {
      encrypted_date_of_birth: encrypt(
        createEncryptedUserDataDto.encrypted_date_of_birth,
      ),
      encrypted_nik: encrypt(createEncryptedUserDataDto.encrypted_nik),
      encrypted_phone: encrypt(createEncryptedUserDataDto.encrypted_phone),
      encrypted_address: encrypt(createEncryptedUserDataDto.encrypted_address),
    };

    if (encryptedUserData) {
      // Update existing encrypted user data

      Object.assign(encryptedUserData, encryptedFields);
    } else {
      // Create new encrypted user data
      encryptedUserData = this.encryptedUserDataRepository.create({
        ...createEncryptedUserDataDto,
        ...encryptedFields,
      });
    }

    // Update user data with the birth year
    const userData = await this.userRepository.findOneBy({
      id: createEncryptedUserDataDto.user_id,
    });
    if (userData) {
      const dateString = createEncryptedUserDataDto.encrypted_date_of_birth;
      const date = new Date(dateString);
      const year = date.getFullYear();
      userData.birth_year = isNaN(year) ? null : year;
      await this.userRepository.save(userData);
    }

    // Save and return the encrypted user data
    return await this.encryptedUserDataRepository.save(encryptedUserData);
  }

  async findAll(): Promise<EncryptedUserData[]> {
    return await this.encryptedUserDataRepository.find();
  }

  async findOne(user_id: string): Promise<EncryptedUserData> {
    let userEncryptedData = await this.encryptedUserDataRepository.findOne({
      where: { user_id },
    });
    if (!userEncryptedData) {
      userEncryptedData = await this.encryptedUserDataRepository.findOne({
        where: { id: user_id },
      });
    }
    return userEncryptedData;
  }

  async findOneDecrypted(user_id: string): Promise<Partial<EncryptedUserData>> {
    let userEncryptedData = await this.encryptedUserDataRepository.findOne({
      where: { user_id },
    });
    if (!userEncryptedData) {
      userEncryptedData = await this.encryptedUserDataRepository.findOne({
        where: { id: user_id },
      });
    }

    // Return empty object if no encrypted data found
    if (!userEncryptedData) {
      return {};
    }

    return {
      ...userEncryptedData,
      encrypted_date_of_birth: decrypt(userEncryptedData.encrypted_date_of_birth),
      encrypted_nik: decrypt(userEncryptedData.encrypted_nik),
      encrypted_phone: decrypt(userEncryptedData.encrypted_phone),
      encrypted_address: decrypt(userEncryptedData.encrypted_address),
    };
  }

  /**
   * Find bulk decrypted user data by user IDs
   * Returns a map of user_id -> decrypted data to avoid N+1 queries
   */
  async findBulkDecrypted(userIds: string[]): Promise<Map<string, Partial<EncryptedUserData>>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // Get all encrypted data in one query using In operator
    const encryptedDataList = await this.encryptedUserDataRepository.find({
      where: {
        user_id: In(userIds),
        deleted_at: null,
      },
    });

    // Create map of user_id -> decrypted data
    const decryptedMap = new Map<string, Partial<EncryptedUserData>>();
    
    for (const encryptedData of encryptedDataList) {
      decryptedMap.set(encryptedData.user_id, {
        ...encryptedData,
        encrypted_date_of_birth: decrypt(encryptedData.encrypted_date_of_birth),
        encrypted_nik: decrypt(encryptedData.encrypted_nik),
        encrypted_phone: decrypt(encryptedData.encrypted_phone),
        encrypted_address: decrypt(encryptedData.encrypted_address),
      });
    }

    return decryptedMap;
  }

  async update(
    idOrUserId: string,
    updateEncryptedUserDataDto: UpdateEncryptedUserDataDto,
  ): Promise<EncryptedUserData> {
    let userEncryptedData = await this.encryptedUserDataRepository.findOne({
      where: { user_id: idOrUserId },
    });
    if (!userEncryptedData) {
      userEncryptedData = await this.encryptedUserDataRepository.findOne({
        where: { id: idOrUserId },
      });
    }
    if (!userEncryptedData) {
      userEncryptedData = this.encryptedUserDataRepository.create();
      Object.assign(userEncryptedData, updateEncryptedUserDataDto);
      userEncryptedData.user_id = idOrUserId;
      return await this.create(userEncryptedData);
    }

    // Encrypt the fields in the DTO O
    const encryptedUpdateDto = {
      ...updateEncryptedUserDataDto,
      encrypted_date_of_birth:
        updateEncryptedUserDataDto.encrypted_date_of_birth !== undefined
          ? encrypt(updateEncryptedUserDataDto.encrypted_date_of_birth)
          : userEncryptedData.encrypted_date_of_birth,
      encrypted_nik: updateEncryptedUserDataDto.encrypted_nik !== undefined
        ? encrypt(updateEncryptedUserDataDto.encrypted_nik)
        : userEncryptedData.encrypted_nik,
      encrypted_phone: updateEncryptedUserDataDto.encrypted_phone !== undefined
        ? encrypt(updateEncryptedUserDataDto.encrypted_phone)
        : userEncryptedData.encrypted_phone,
      encrypted_address: updateEncryptedUserDataDto.encrypted_address !== undefined
        ? encrypt(updateEncryptedUserDataDto.encrypted_address)
        : userEncryptedData.encrypted_address,
    };
    encryptedUpdateDto.updated_at = moment().add(7, "hours").toDate();
    encryptedUpdateDto.updated_by = this.requestContextService.getCurrentUserId();

    const updateIdObj = {
      id: userEncryptedData.id,
      user_id: userEncryptedData.user_id,
    };

    await this.encryptedUserDataRepository.update(
      updateIdObj,
      encryptedUpdateDto,
    );

    const targetUserId = userEncryptedData.user_id;
    if (updateEncryptedUserDataDto.encrypted_phone !== undefined) {
      const currentPhoneDecrypted = decrypt(userEncryptedData.encrypted_phone);
      if (currentPhoneDecrypted !== updateEncryptedUserDataDto.encrypted_phone) {
        // Phone value changed — reset verification so user must verify again
        await this.userRepository.update(targetUserId, { is_phone_verified: false });
      }
    }

    // Update birth_year if encrypted_date_of_birth is provided
    if (updateEncryptedUserDataDto.encrypted_date_of_birth !== undefined) {
      await this.updateBirthYear(userEncryptedData.user_id, updateEncryptedUserDataDto.encrypted_date_of_birth);
    }

    const updatedData = await this.findOne(idOrUserId);
    return updatedData;
  }

  async remove(user_id: string): Promise<void> {
    await this.encryptedUserDataRepository.softDelete(user_id);
  }

  /**
   * Upsert encrypted user data for existing users
   */
  async upsertEncryptedUserData(user: User, dto: UpsertMemberDto): Promise<EncryptedUserData> {
    // Find existing encrypted data
    const encryptedData = await this.encryptedUserDataRepository.findOne({
      where: { user_id: user.id },
    });

    const updateDto: any = {};

    // Update encrypted fields if explicitly provided (including empty/null values)
    if (dto.encrypted_phone !== undefined || dto.phone !== undefined) {
      updateDto.encrypted_phone = dto.encrypted_phone !== undefined ? dto.encrypted_phone : dto.phone;
    }
    if (dto.encrypted_date_of_birth !== undefined) {
      updateDto.encrypted_date_of_birth = dto.encrypted_date_of_birth;
      // Update birth_year if date_of_birth provided
      await this.updateBirthYear(user.id, dto.encrypted_date_of_birth);
    }
    if (dto.encrypted_address !== undefined) {
      updateDto.encrypted_address = dto.encrypted_address;
    }
    if (dto.encrypted_nik !== undefined) {
      updateDto.encrypted_nik = dto.encrypted_nik;
    }

    if (Object.keys(updateDto).length > 0) {
      this.logger.log(`Updating encrypted user data for: ${user.id} with ${JSON.stringify(updateDto)}`, "encrypted-user-data-update");
      return await this.update(user.id, updateDto);
    }

    this.logger.log(`No updates needed for encrypted user data for: ${user.id} returning ${JSON.stringify(encryptedData)}`,
      "encrypted-user-data-update");

    // Return existing data if no updates
    return encryptedData;
  }
}
