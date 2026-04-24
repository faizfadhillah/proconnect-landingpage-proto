import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { CreateMstLicenseDto } from "./dto/create-mst_license.dto";
import { UpdateMstLicenseDto } from "./dto/update-mst_license.dto";
import { MstLicense } from "./entities/mst_license.entity";
import { MstLicenseDao } from "./dao/mst_license.dao";
import { ConfigsService } from "../config/config.service";

@Injectable()
export class MstLicensesService {
  constructor(
    private readonly mstLicenseDao: MstLicenseDao,
    private readonly configService: ConfigsService,
  ) { }

  async create(createMstLicenseDto: CreateMstLicenseDto): Promise<MstLicense> {
    // Validate certificate_level against config
    if (createMstLicenseDto.certificate_level) {
      try {
        const certificateLevelConfig = await this.configService.findByKey("certificate_level");
        const validLevels = certificateLevelConfig.value.map((l: any) => l.code);
        if (!validLevels.includes(createMstLicenseDto.certificate_level)) {
          throw new BadRequestException(
            `Invalid certificate level: ${createMstLicenseDto.certificate_level}. Valid levels: ${validLevels.join(", ")}`
          );
        }
      } catch (error) {
        // If config not found, skip validation
        if (error instanceof NotFoundException) {
          // Skip validation if config not found
        } else {
          throw error;
        }
      }
    }

    // Validate duplicate license_template_code (only if provided)
    if (createMstLicenseDto.license_template_code) {
      const duplicate = await this.mstLicenseDao.findByLicenseTemplateCode(createMstLicenseDto.license_template_code);
      if (duplicate) {
        throw new ConflictException(`License with template code '${createMstLicenseDto.license_template_code}' already exists`);
      }
    }

    try {
      return await this.mstLicenseDao.create(createMstLicenseDto);
    } catch (error) {
      throw new BadRequestException('Failed to create license');
    }
  }

  async findOne(id: string): Promise<MstLicense> {
    const mstLicense = await this.mstLicenseDao.findById(id);
    if (!mstLicense) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
    return mstLicense;
  }

  async update(
    id: string,
    updateMstLicenseDto: UpdateMstLicenseDto,
  ): Promise<MstLicense> {
    const existingLicense = await this.findOne(id);
    if (!existingLicense) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }

    // Validate certificate_level against config
    if (updateMstLicenseDto.certificate_level) {
      try {
        const certificateLevelConfig = await this.configService.findByKey("certificate_level");
        const validLevels = certificateLevelConfig.value.map((l: any) => l.code);
        if (!validLevels.includes(updateMstLicenseDto.certificate_level)) {
          throw new BadRequestException(
            `Invalid certificate level: ${updateMstLicenseDto.certificate_level}. Valid levels: ${validLevels.join(", ")}`
          );
        }
      } catch (error) {
        throw error;
      }
    }

    // Validate duplicate license_template_code (only if provided and different from existing)
    if (updateMstLicenseDto.license_template_code && updateMstLicenseDto.license_template_code !== existingLicense.license_template_code) {
      const duplicate = await this.mstLicenseDao.findByLicenseTemplateCode(updateMstLicenseDto.license_template_code);
      if (duplicate) {
        throw new ConflictException(`License with template code '${updateMstLicenseDto.license_template_code}' already exists`);
      }
    }

    try {
      const updatedLicense = await this.mstLicenseDao.update(id, updateMstLicenseDto);
      return updatedLicense;
    } catch (error) {
      throw new BadRequestException('Failed to update license');
    }
  }

  async remove(id: string): Promise<void> {
    const existingLicense = await this.findOne(id);
    if (!existingLicense) {
      throw new NotFoundException(`License with ID ${id} not found`);
    }
    await this.mstLicenseDao.softDelete(id);
  }
}