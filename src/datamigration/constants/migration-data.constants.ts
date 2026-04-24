import { CompanyStatus } from 'src/mst_companies/entities/mst_company.entity';
import { DepartmentFlag } from 'src/mst_departments/entities/mst_department.entity';
import {
  CompanyNameUpdate,
  CompanyStatusUpdate,
  CompanySoftDelete,
  CompanyBranchEmpty,
  CompanyParentBranchNameUpdate,
  DepartmentInsert,
  CompanyDepartmentMapping,
  UserSoftDelete,
  UserRoleAssignmentData,
} from '../interfaces/migration-data.interfaces';

export const COMPANY_NAME_UPDATES: CompanyNameUpdate[] = [
  { companyId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyName: 'PT Altar Filadelfia' },
  { companyId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0', companyName: 'PT Ganesha Utama Raya' },
  { companyId: 'c28d331d-a32d-445e-8611-9d724b03c1f0', companyName: 'ABC Cooking Studio Indonesia' },
];

export const COMPANY_SOFT_DELETES: CompanySoftDelete[] = [
  { companyId: '2650102e-cdfb-44dc-b96a-eff8c199f7bf' },
  { companyId: 'f668abb4-5250-40fa-9739-35a9b588ca43' },
];

export const COMPANY_STATUS_UPDATES: CompanyStatusUpdate[] = [
  { companyId: '4bbc6767-f3a0-4fc2-b810-9f5bc8bb8585', status: CompanyStatus.INACTIVE },
  { companyId: '5f0fdeb3-1130-468c-9427-892b82494b71', status: CompanyStatus.INACTIVE },
  { companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', status: CompanyStatus.ACTIVE },
  { companyId: 'd26dd652-e6ba-4233-9508-0fc1cba0f607', status: CompanyStatus.INACTIVE },
  { companyId: '36657638-91ab-4855-9243-5fa17292cee8', status: CompanyStatus.INACTIVE },
];

export const COMPANY_BRANCH_EMPTY: CompanyBranchEmpty[] = [
  { companyId: '4bbc6767-f3a0-4fc2-b810-9f5bc8bb8585' },
  { companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a' },
  { companyId: 'c28d331d-a32d-445e-8611-9d724b03c1f0' },
];

export const COMPANY_PARENT_BRANCH_NAME_UPDATES: CompanyParentBranchNameUpdate[] = [
  { companyId: '832e61ed-8b77-44f7-88ec-8bceb9591fab', parentId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', branch: 'ARTOTEL SUITES BIANTI (PT JONATAN BINTANG UTAMA)', companyName: 'PT Altar Filadelfia' },
  { companyId: '1f70b6eb-92c9-4f42-97cd-0a05e3d2aaef', parentId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', branch: 'ARTOTEL Gajahmada Semarang (PT Humana Demiatri Agung)', companyName: 'PT Altar Filadelfia' },
  { companyId: '822dbc8b-1ff1-41ff-8afb-58eec27e6974', parentId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', branch: 'ARTOTEL Gelora Senayan Jakarta (PT Artotel Gelora Indonesia)', companyName: 'PT Altar Filadelfia' },
  { companyId: '68cf2cdc-89a1-4164-8057-43137fb893af', parentId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', branch: 'The Green Peak Artotel-Curated Hotel & Conventions (Artotel Kamar Indonesi)', companyName: 'PT Altar Filadelfia' },
  { companyId: '1bbdd3dc-0741-4800-95dc-c57e0fef5c32', parentId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', branch: 'ARTOTEL Casa Kuningan (PT Selat Niagatama)', companyName: 'PT Altar Filadelfia' },
];

export const DEPARTMENT_INSERTS: DepartmentInsert[] = [
  { name: 'C-Level', flag: DepartmentFlag.GLOBAL },
  { name: 'Finance', flag: DepartmentFlag.GLOBAL },
  { name: 'Human Resources', flag: DepartmentFlag.GLOBAL },
  { name: 'Marketing', flag: DepartmentFlag.GLOBAL },
  { name: 'Sales', flag: DepartmentFlag.GLOBAL },
  { name: 'Operations', flag: DepartmentFlag.GLOBAL },
  { name: 'Information Technology', flag: DepartmentFlag.GLOBAL },
  { name: 'Legal', flag: DepartmentFlag.GLOBAL },
  { name: 'Customer Service', flag: DepartmentFlag.GLOBAL },
  { name: 'Research and Development', flag: DepartmentFlag.GLOBAL },
  { name: 'Procurement', flag: DepartmentFlag.GLOBAL },
  { name: 'Administration', flag: DepartmentFlag.GLOBAL },
  { name: 'Accounting', flag: DepartmentFlag.GLOBAL },
  { name: 'Engineering', flag: DepartmentFlag.GLOBAL },
  { name: 'Production', flag: DepartmentFlag.GLOBAL },
  { name: 'Quality Assurance', flag: DepartmentFlag.GLOBAL },
  { name: 'Business Development', flag: DepartmentFlag.GLOBAL },
  { name: 'Communications', flag: DepartmentFlag.GLOBAL },
  { name: 'Logistics', flag: DepartmentFlag.GLOBAL },
  { name: 'Facilities Management', flag: DepartmentFlag.GLOBAL },
  { name: 'Product Management', flag: DepartmentFlag.GLOBAL },
  { name: 'Strategy', flag: DepartmentFlag.GLOBAL },
  { name: 'Compliance', flag: DepartmentFlag.GLOBAL },
  { name: 'Public Relations', flag: DepartmentFlag.GLOBAL },
  { name: 'Supply Chain', flag: DepartmentFlag.GLOBAL },
  { name: 'Training and Development', flag: DepartmentFlag.GLOBAL },
];

export const COMPANY_DEPARTMENT_MAPPINGS: CompanyDepartmentMapping[] = [
  { companyHqId: '06b79460-3c67-44e6-8058-07e1dd4f60e2', companyId: '06b79460-3c67-44e6-8058-07e1dd4f60e2' },
  { companyHqId: '3689e66e-edc7-4f2f-b9a8-b44c0da13b7a', companyId: '3689e66e-edc7-4f2f-b9a8-b44c0da13b7a' },
  { companyHqId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0', companyId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0' },
  { companyHqId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyId: '1bbdd3dc-0741-4800-95dc-c57e0fef5c32' },
  { companyHqId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyId: '1f70b6eb-92c9-4f42-97cd-0a05e3d2aaef' },
  { companyHqId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e' },
  { companyHqId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyId: '68cf2cdc-89a1-4164-8057-43137fb893af' },
  { companyHqId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyId: '822dbc8b-1ff1-41ff-8afb-58eec27e6974' },
  { companyHqId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', companyId: '832e61ed-8b77-44f7-88ec-8bceb9591fab' },
  { companyHqId: '8c5aeea8-9bbc-4542-b3c5-f562f98ea063', companyId: '8c5aeea8-9bbc-4542-b3c5-f562f98ea063' },
  { companyHqId: '9ea09b5e-fe15-4362-a680-f6de7db136e8', companyId: '9ea09b5e-fe15-4362-a680-f6de7db136e8' },
  { companyHqId: 'c28d331d-a32d-445e-8611-9d724b03c1f0', companyId: 'c28d331d-a32d-445e-8611-9d724b03c1f0' },
  { companyHqId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a' },
];

export const USER_SOFT_DELETES: UserSoftDelete[] = [
  { email: 'sheena.shroff@shrofftravel.com' },
  { email: 'devi.trihapsari@roomsinchotels.com' },
  { email: 'lpiamochkevinsudrajat@gmail.com' },
  { email: 'indrarahwana425@gmail.com' },
  { email: 'krismeidi@gmail.com' },
  { email: 'company.branch@openmail.pro' },
];

export const USER_ROLE_ASSIGNMENTS: UserRoleAssignmentData[] = [
  { email: 'lamere.edon@malldrops.com', companyId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0', role: 'Member', department: 'Human Resources', jobTitle: 'division manager' },
  { email: 'zyannah.yuliya@themodish.org', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'dominic.kaylob@themodish.org', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'Business Development', jobTitle: 'division manager' },
  { email: 'nazim.meshulem@moneyleak.org', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'Business Development', jobTitle: 'division manager' },
  { email: 'alida.katalena@themodish.org', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'veronika@artotelcasa.com', companyId: '1bbdd3dc-0741-4800-95dc-c57e0fef5c32', role: 'HRD HQ', department: 'Human Resources', jobTitle: 'head of human resources' },
  { email: 'imant@artotelgroup.com', companyId: '1f70b6eb-92c9-4f42-97cd-0a05e3d2aaef', role: 'PIC Branch', department: 'Human Resources', jobTitle: 'division human resources manager' },
  { email: 'pradiramaezindonesia@gmail.com', companyId: '3689e66e-edc7-4f2f-b9a8-b44c0da13b7a', role: 'Owner HQ', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'agus.yuliantoss@gmail.com', companyId: '3689e66e-edc7-4f2f-b9a8-b44c0da13b7a', role: 'HRD HQ', department: 'Human Resources', jobTitle: 'division human resources manager' },
  { email: 'natalia@thereizsuites.com', companyId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0', role: 'Member', department: 'Human Resources', jobTitle: 'division manager' },
  { email: 'proconnectjob@gmail.com', companyId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0', role: 'Member', department: 'C-level', jobTitle: 'executive chairman' },
  { email: 'pcmanagement@sharklasers.com', companyId: '3f1d627e-cb29-426d-9a75-0c770ab9fba0', role: 'Owner HQ', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'artoteltest@sharklasers.com', companyId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', role: 'Owner HQ', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'widy@artotelindonesia.com', companyId: '5a508b8b-6cb8-4b7e-8f03-6b3f8e819c2e', role: 'HRD HQ', department: 'Human Resources', jobTitle: 'head of human resources' },
  { email: 'agus.rojali@thegreenpeak.com', companyId: '68cf2cdc-89a1-4164-8057-43137fb893af', role: 'PIC Branch', department: 'Human Resources', jobTitle: 'division human resources manager' },
  { email: 'hr.bianti@artotelsuites.com', companyId: '832e61ed-8b77-44f7-88ec-8bceb9591fab', role: 'PIC Branch', department: 'Human Resources', jobTitle: 'head of human resources' },
  { email: 'hr.artoteltssuites@gmail.com', companyId: '832e61ed-8b77-44f7-88ec-8bceb9591fab', role: 'HRD Branch', department: 'Human Resources', jobTitle: 'division human resources manager' },
  { email: 'wsaemployer@sharklasers.com', companyId: '8c5aeea8-9bbc-4542-b3c5-f562f98ea063', role: 'Owner HQ', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'testerapplicant3+1@gmail.com', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Owner HQ', department: 'C-level', jobTitle: 'chairman and ceo' },
  { email: 'tukikinovas+1@gmail.com', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'Product Management', jobTitle: 'division manager' },
  { email: 'rahmat@sharklasers.com', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'Information Technology', jobTitle: 'project management it specialist' },
  { email: 'aditya@sharklasers.com', companyId: 'ae837fca-449e-4a34-b0a5-bf009ed7433a', role: 'Member', department: 'Information Technology', jobTitle: 'project management it specialist' },
  { email: 'recruitment.id@abc-cooking.co.id', companyId: 'c28d331d-a32d-445e-8611-9d724b03c1f0', role: 'Owner HQ', department: 'Human Resources', jobTitle: 'head of human resources' },
  { email: 'oki@artotelgelorasenayan.com', companyId: '822dbc8b-1ff1-41ff-8afb-58eec27e6974', role: 'PIC Branch', department: 'Human Resources', jobTitle: 'head of human resources' },
  { email: 'siska@artotelgelorasenayan.com', companyId: '822dbc8b-1ff1-41ff-8afb-58eec27e6974', role: 'HRD Branch', department: 'Human Resources', jobTitle: 'division human resources manager' },
]; 