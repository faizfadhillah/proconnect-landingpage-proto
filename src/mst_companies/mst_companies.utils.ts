import {
    Injectable,
    Inject,
    forwardRef,
    NotFoundException,
    BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MstCompanyResponseDto } from "./dto/mst-company-response.dto";
import { MstCompany } from "./entities/mst_company.entity";
import { CreateMstCompanyDto } from "./dto/create-mst_company.dto";
import { UpdateMstCompanyDto } from "./dto/update-mst_company.dto";
import { MstCountry } from "src/mst_country/entities/mst_country.entity";
import { CompanyDepartmentMapService } from "src/company_department_map/company_department_map.service";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";

@Injectable()
export class MstCompaniesUtils {
    constructor(
        @InjectRepository(MstCountry)
        private mstCountryRepository: Repository<MstCountry>,
        @InjectRepository(MstRegion)
        private mstRegionRepository: Repository<MstRegion>,
        @Inject(forwardRef(() => CompanyDepartmentMapService))
        private readonly companyDepartmentMapService: CompanyDepartmentMapService,
    ) { }

    /**
     * Convert MstCompany entity to MstCompanyResponseDto with departments
     * @param company The MstCompany entity to convert.
     * @returns A promise that resolves to the MstCompanyResponseDto with departments.
     */
    public async mapToResponseDto(company: MstCompany): Promise<MstCompanyResponseDto> {
        const departments = await this.companyDepartmentMapService.getDepartmentsByCompanyId(company.id);
        const responseDto = new MstCompanyResponseDto();
        Object.assign(responseDto, company);
        responseDto.departments = departments;
        return responseDto;
    }

    /**
     * Convert multiple MstCompany entities to MstCompanyResponseDto array with departments
     * @param companies An array of MstCompany entities to convert.
     * @returns A promise that resolves to an array of MstCompanyResponseDto with departments.
     */
    public async mapToResponseDtoArray(companies: MstCompany[]): Promise<MstCompanyResponseDto[]> {
        const result: MstCompanyResponseDto[] = [];
        for (const company of companies) {
            const responseDto = await this.mapToResponseDto(company);
            result.push(responseDto);
        }
        return result;
    }

    /**
     * Safely assign properties from a DTO to an entity, excluding specified keys
     * @param entity The entity object to assign to
     * @param dto The DTO object to assign from
     * @param excludeKeys Array of property keys to exclude from assignment
     * @returns The modified entity
     */
    public assignDtoToEntity<T extends object>(entity: T, dto: any, excludeKeys: string[] = []): T {
        const filteredDto = { ...dto };
        excludeKeys.forEach(key => delete filteredDto[key]);
        Object.assign(entity, filteredDto);
        return entity;
    }

    /**
     * Validate region and country fields, and auto-set is_outside_indo
     * @param dto The DTO to validate and prepare
     */
    public async validateAndPrepareDto(dto: CreateMstCompanyDto | UpdateMstCompanyDto): Promise<void> {
        await this.validateRegion(dto);
        await this.validateCountry(dto);
        await this.setIsOutsideIndo(dto);
    }

    /**
     * Validate that either region_id or other_region is provided
     * @param dto The DTO to validate
     */
    private async validateRegion(dto: CreateMstCompanyDto | UpdateMstCompanyDto): Promise<void> {
        if (!dto.region_id && !dto.other_region) {
            throw new BadRequestException('Either region_id or other_region must be provided');
        }

        if (dto.region_id && dto.other_region) {
            throw new BadRequestException('Only one of region_id or other_region can be provided');
        }

        if (dto.region_id) {
            const region = await this.mstRegionRepository.findOneBy({ id: dto.region_id });
            if (!region) {
                throw new NotFoundException(`Region with ID ${dto.region_id} not found`);
            }
        }
    }

    /**
     * Validate that either country_id or other_country is provided
     * @param dto The DTO to validate
     */
    private async validateCountry(dto: CreateMstCompanyDto | UpdateMstCompanyDto): Promise<void> {
        if (!dto.country_id && !dto.other_country) {
            throw new BadRequestException('Either country_id or other_country must be provided');
        }

        if (dto.country_id) {
            const country = await this.mstCountryRepository.findOneBy({ id: dto.country_id });
            if (!country) {
                throw new NotFoundException(`Country with ID ${dto.country_id} not found`);
            }
        }
    }

    /**
     * Auto-set is_outside_indo based on country_id
     * @param dto The DTO to update
     */
    private async setIsOutsideIndo(dto: CreateMstCompanyDto | UpdateMstCompanyDto): Promise<void> {
        if (!dto.country_id) {
            dto.is_outside_indo = true;
            return;
        }

        const country = await this.mstCountryRepository.findOneBy({ id: dto.country_id });
        if (!country) {
            throw new NotFoundException(`Country with ID ${dto.country_id} not found`);
        }

        dto.is_outside_indo = country.name !== 'Indonesia';
    }

    public static formatDateToYYYYMMDD(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}
