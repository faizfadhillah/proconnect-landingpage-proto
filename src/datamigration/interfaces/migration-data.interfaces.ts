import { CompanyStatus } from 'src/mst_companies/entities/mst_company.entity';
import { DepartmentFlag } from 'src/mst_departments/entities/mst_department.entity';

export interface CompanyNameUpdate {
  companyId: string;
  companyName: string;
}

export interface CompanyStatusUpdate {
  companyId: string;
  status: CompanyStatus;
}

export interface CompanySoftDelete {
  companyId: string;
}

export interface CompanyBranchEmpty {
  companyId: string;
}

export interface CompanyParentBranchNameUpdate {
  companyId: string;
  parentId: string;
  branch: string;
  companyName: string;
}

export interface DepartmentInsert {
  name: string;
  flag: DepartmentFlag;
}

export interface CompanyDepartmentMapping {
  companyHqId: string;
  companyId: string;
}

export interface UserSoftDelete {
  email: string;
}

export interface UserRoleAssignmentData {
  email: string;
  companyId: string;
  role: string;
  department: string;
  jobTitle: string;
}

