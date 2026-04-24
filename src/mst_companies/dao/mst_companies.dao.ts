import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MstCompany } from "../entities/mst_company.entity";
import { Job, JobStatus } from "src/jobs/entities/job.entity";

@Injectable()
export class MstCompaniesDao {
  constructor(
    @InjectRepository(MstCompany)
    private mstCompanyRepository: Repository<MstCompany>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  /**
   * Custom update function that only updates the provided attributes
   * This avoids TypeORM's save() method behavior that might clear fields
   */
  async update(id: string, updateEntity: MstCompany): Promise<void> {
    // Build update data object with only provided fields
    const updateData: Partial<MstCompany> = {};
    
    // List all possible fields that can be updated
    const possibleFields = [
      'brand_name', 'parent_id', 'branch', 'company_name', 'company_description',
      'phone', 'email', 'photo_url', 'unique_url', 'website', 'industry_id',
      'industry', 'organization_size', 'organization_type', 'logo_url',
      'tagline', 'location', 'legal_type', 'number_of_employees',
      'business_license', 'tax_identification_number', 'tax_identification_url',
      'region_id', 'other_region', 'country_id', 'other_country',
      'is_outside_indo', 'use_hq_business_profile', 'is_verified',
      'is_premium', 'status'
    ];

    // Only include fields that are actually provided in the DTO
    for (const field of possibleFields) {
      if (updateEntity[field] !== undefined) {
        updateData[field] = updateEntity[field];
      }
    }

    // Perform the update
    const result = await this.mstCompanyRepository.update(id, updateData);
    
    if (result.affected === 0) {
      throw new Error(`Company with ID ${id} not found`);
    }
  }

  async findById(id: string): Promise<MstCompany> {
    return await this.mstCompanyRepository.findOne({ where: { id } });
  }

  /**
   * Update company for migration purposes - bypasses service-level validations
   * This method is specifically for migration use cases where we need to update
   * company data without triggering region/country validations
   */
  async updateForMigration(id: string, updateData: Partial<MstCompany>): Promise<void> {
    // Perform the update directly with provided data (no validation)
    const result = await this.mstCompanyRepository.update(id, updateData);
    
    if (result.affected === 0) {
      throw new Error(`Company with ID ${id} not found`);
    }
  }

  /**
   * Get count of available (PUBLISH, not soft-deleted) jobs grouped by company_id.
   * Used by mst-companies search when showAvailableJobCount=true.
   */
  async findAvailableJobCountGroupedByCompany(
    companyIds: string[],
  ): Promise<Record<string, number>> {
    if (!companyIds || companyIds.length === 0) {
      return {};
    }

    const rows = await this.jobRepository
      .createQueryBuilder("job")
      .select("job.company_id", "company_id")
      .addSelect("COUNT(*)", "count")
      .where("job.company_id IN (:...companyIds)", { companyIds })
      .andWhere("job.deleted_at IS NULL")
      .andWhere("job.status = :status", { status: JobStatus.PUBLISH })
      .groupBy("job.company_id")
      .getRawMany<{ company_id: string; count: string }>();

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row.company_id] = Number(row.count) || 0;
    }
    return result;
  }

  /**
   * Soft delete company/companies by updating company_name with timestamp and then soft deleting
   * Similar to users service soft delete pattern
   */
  async softDelete(companyIds: string | string[]): Promise<void> {
    // Normalize to array
    const ids = Array.isArray(companyIds) ? companyIds : [companyIds];
    
    if (ids.length === 0) {
      return;
    }

    // Get all companies to update
    const companies = await this.mstCompanyRepository.find({
      where: ids.map(id => ({ id })),
    });

    if (companies.length === 0) {
      throw new Error(`No companies found with the provided IDs`);
    }

    // Update company_name with timestamp for each company
    const timestamp = new Date().toISOString();
    const updatePromises = companies.map(company => {
      const updatedName = `${company.company_name}-deleted-${timestamp}`;
      return this.mstCompanyRepository.update(company.id, {
        company_name: updatedName,
      });
    });

    await Promise.all(updatePromises);

    // Perform soft delete
    const result = await this.mstCompanyRepository.softDelete(ids);
    
    if (result.affected === 0) {
      throw new Error(`Failed to soft delete companies`);
    }
  }
}
