import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyDepartmentMap } from 'src/company_department_map/entities/company_department_map.entity';
import { MstDepartment, DepartmentFlag } from 'src/mst_departments/entities/mst_department.entity';
import { In, Repository } from 'typeorm';
import { LoggingService } from 'src/logs/logs.service';

@Injectable()
export class ScopeFilterDao {
  constructor(
    @InjectRepository(CompanyDepartmentMap)
    private companyDepartmentMapRepository: Repository<CompanyDepartmentMap>,
    @InjectRepository(MstDepartment)
    private mstDepartmentRepository: Repository<MstDepartment>,
    private readonly logger: LoggingService,
  ) { }

  public async getCompanyIdsByHqIds(hqIds: string[]): Promise<string[]> {
    const result = await this.companyDepartmentMapRepository.find({
      where: {
        company_hq_id: In(hqIds)
      },
      select: ['company_id'],
    });
    const childCompanyIds = result.map((item) => item.company_id);
    const allCompanyIds = [...new Set([...hqIds, ...childCompanyIds])];
    return allCompanyIds;
  }
  
  public async getDeptIdsByCompanyIds(companyIds: string[]): Promise<string[]> {
    const deptIdsFromMap = await this.companyDepartmentMapRepository.find({
      where: {
        company_id: In(companyIds)
      },
      select: ['dept_id'],
    }).then((result) => result.map((item) => item.dept_id));

    const globalDeptIds = await this.mstDepartmentRepository.find({
      where: {
        flag: DepartmentFlag.GLOBAL
      },
      select: ['id'],
    }).then((result) => result.map((item) => item.id));

    return [...new Set([...deptIdsFromMap, ...globalDeptIds])];
  }
}
