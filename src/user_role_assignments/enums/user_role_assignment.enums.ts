export enum UserRoleAssignmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserRoleAssignmentRole {
  SYS_ADMIN = 'sys_admin',
  CANDIDATE = 'candidate',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
  ADMIN_VIEWER = 'admin_viewer',
  PIC_SCHOOL = 'pic_school',
}

export enum UserRoleAssignmentCompanyRole {
  OWNER_HQ = "owner_hq",
  HRD_HQ = "hrd_hq",
  DEPT_HEAD_HQ = "dept_head_hq",
  PIC_BRANCH = "pic_branch",
  HRD_BRANCH = "hrd_branch",
  DEPT_HEAD_BRANCH = "dept_head_branch",
  MEMBER = "member",
}