import { forwardRef, Inject, Injectable, BadRequestException } from "@nestjs/common";
import { DataSource } from "typeorm";
import { MstDepartmentsDao } from "./dao/mst_departments.dao";
import { MstDepartment } from "./entities/mst_department.entity";
import { DepartmentFlag, DepartmentStatus } from "./entities/mst_department.entity";
import { CompanyDepartmentMapService } from "../company_department_map/company_department_map.service";
import { UserRoleAssignmentService } from "../user_role_assignments/services/user_role_assignments.service";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class MstDepartmentsService {
    constructor(
        private readonly mstDepartmentsDao: MstDepartmentsDao,
        private readonly dataSource: DataSource,
        @Inject(forwardRef(() => CompanyDepartmentMapService))
        private readonly companyDepartmentMapService: CompanyDepartmentMapService,
        @Inject(forwardRef(() => UserRoleAssignmentService))
        private readonly userRoleAssignmentService: UserRoleAssignmentService,
        private readonly loggingService: LoggingService,
    ) { }

    public async create(departmentData: {
        dept_code?: string;
        dept_name: string;
        flag?: DepartmentFlag;
        status?: DepartmentStatus;
        companyHqId?: string;
    }): Promise<MstDepartment> {
        this.loggingService.log(`Creating department with dept_code: ${departmentData.dept_code}, dept_name: ${departmentData.dept_name}, companyHqId: ${departmentData.companyHqId}`, 'department');

        if (!departmentData.companyHqId && departmentData.flag === DepartmentFlag.PRIVATE) {
            throw new BadRequestException('Company HQ ID is required for private department');
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const data = {
                ...departmentData,
                flag: departmentData.flag || DepartmentFlag.PRIVATE,
                status: departmentData.status || DepartmentStatus.PUBLISHED,
            };

            const department = await this.mstDepartmentsDao.create(data, queryRunner);
            this.loggingService.log(`Department created with id: ${department.id}`, 'department');

            if (departmentData.companyHqId) {
                await this.companyDepartmentMapService.insertDepartmentMapping(departmentData.companyHqId, department.id, queryRunner);
                this.loggingService.log(`Department mapping created for company HQ: ${departmentData.companyHqId}`, 'department');
            }

            await queryRunner.commitTransaction();
            return department;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.loggingService.error(`Failed to create department: ${error instanceof Error ? error.message : String(error)}`, 'department', error instanceof Error ? error.stack : undefined);
            throw new BadRequestException(`Failed to create department: ${error.message}`);
        } finally {
            await queryRunner.release();
        }
    }

    public async findByIds(ids: string[]): Promise<MstDepartment[]> {
        this.loggingService.log(`Finding departments by IDs: ${ids.join(', ')}`, 'department');

        const departments = await this.mstDepartmentsDao.findByIds(ids);
        this.loggingService.log(`Found ${departments.length} departments`, 'department');

        return departments;
    }

    public async findByFlag(flag: DepartmentFlag): Promise<MstDepartment[]> {
        this.loggingService.log(`Finding departments by flag: ${flag}`, 'department');

        const departments = await this.mstDepartmentsDao.findByFlag(flag);
        this.loggingService.log(`Found ${departments.length} departments with flag: ${flag}`, 'department');

        return departments;
    }

    public async findAll(): Promise<MstDepartment[]> {
        return await this.mstDepartmentsDao.findAll();
    }

    public async findById(id: string): Promise<MstDepartment | null> {
        return await this.mstDepartmentsDao.findById(id);
    }

    public async update(id: string, updateData: Partial<MstDepartment>): Promise<MstDepartment | null> {
        return await this.mstDepartmentsDao.update(id, updateData);
    }

    public async delete(id: string): Promise<boolean> {
        this.loggingService.log(`Attempting to delete department: ${id}`, "department-delete");

        // Check if department exists
        const department = await this.findById(id);
        if (!department) {
            this.loggingService.error(`Department not found: ${id}`, "department-delete");
            throw new Error('Department not found');
        }

        this.loggingService.log(`Department found: ${department.dept_name} (${department.id})`, "department-delete");

        // Check if department is mapped to any company
        const isMapped = await this.companyDepartmentMapService.isDepartmentMapped(id);
        if (isMapped) {
            this.loggingService.error(`Cannot delete department ${id}: mapped to companies`, "department-delete");
            throw new Error('Cannot delete department that is mapped to companies');
        }

        this.loggingService.log(`Department ${id} is not mapped to any companies`, "department-delete");

        // Check if department is used in any active user role assignments
        const isUsedInAssignments = await this.userRoleAssignmentService.isDepartmentUsedInAssignments(id);
        if (isUsedInAssignments) {
            this.loggingService.error(`Cannot delete department ${id}: used in active assignments`, "department-delete");
            throw new Error('Cannot delete department that is used in active user role assignments');
        }

        this.loggingService.log(`Department ${id} is not used in any active assignments`, "department-delete");

        this.loggingService.log(`Department ${id} validation passed, proceeding with deletion`, "department-delete");
        const result = await this.mstDepartmentsDao.delete(id);

        if (result) {
            this.loggingService.log(`Department ${id} deleted successfully`, "department-delete");
        } else {
            this.loggingService.error(`Failed to delete department ${id}`, "department-delete");
        }

        return result;
    }
}