import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryRunner } from "typeorm";
import { MstDepartment, DepartmentStatus, DepartmentFlag } from "../entities/mst_department.entity";

@Injectable()
export class MstDepartmentsDao {
    constructor(
        @InjectRepository(MstDepartment)
        private readonly mstDepartmentRepository: Repository<MstDepartment>,
    ) { }

    async create(department: Partial<MstDepartment>, queryRunner?: QueryRunner): Promise<MstDepartment> {
        const newDepartment = this.mstDepartmentRepository.create(department);
        if (queryRunner) {
            return await queryRunner.manager.save(MstDepartment, newDepartment);
        }
        return await this.mstDepartmentRepository.save(newDepartment);
    }

    async findByIds(ids: string[]): Promise<MstDepartment[]> {
        return await this.mstDepartmentRepository.find({
            where: ids.map(id => ({ id, status: DepartmentStatus.PUBLISHED })),
        });
    }

    async findByFlag(flag: DepartmentFlag): Promise<MstDepartment[]> {
        return await this.mstDepartmentRepository.find({
            where: { flag, status: DepartmentStatus.PUBLISHED },
        });
    }

    async findAll(): Promise<MstDepartment[]> {
        return await this.mstDepartmentRepository.find();
    }

    async findById(id: string): Promise<MstDepartment | null> {
        return await this.mstDepartmentRepository.findOne({ where: { id } });
    }

    async update(id: string, updateData: Partial<MstDepartment>): Promise<MstDepartment | null> {
        await this.mstDepartmentRepository.update(id, updateData);
        return await this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.mstDepartmentRepository.delete(id);
        return (result.affected || 0) > 0;
    }
}