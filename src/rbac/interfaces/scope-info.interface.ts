export interface ScopeInfo {
  companyHqIds: string[];
  companyIds: string[];
  deptIds: string[];
  isSysAdmin: boolean;
  isCandidate: boolean;
  userId: string;
  permissionScopes: PermissionScopeInfo[];
  assignments?: Array<{
    company_role: string | null;
    role: string;
    company_id: string | null;
    company_hq_id: string | null;
    dept_id: string | null;
  }>;
}

export interface PermissionScopeInfo {
  permission_name: string;
  level: 'hq' | 'branch' | 'dept' | 'self' | "public";
  branch_scope?: 'all' | 'self';
  dept_scope?: 'all' | 'self';
}

export interface PermissionMeta {
  resource: string;
  action: string;
  level?: 'hq' | 'branch' | 'dept' | 'self' | 'public';
  branch_scope?: 'all' | 'self';
  dept_scope?: 'all' | 'self';
}