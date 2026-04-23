// composables/usePermissions.js
export function usePermissions() {
  const me = useState("me");

  /**
   * Get all user permissions
   * @returns {Array} Array of permission objects
   */
  const getUserPermissions = () => {
    if (!me.value?.roles || !Array.isArray(me.value.roles)) {
      return [];
    }

    // Flatten all permissions from all roles
    const allPermissions = [];
    me.value.roles.forEach((role) => {
      if (role.permissions && Array.isArray(role.permissions)) {
        allPermissions.push(...role.permissions);
      }
    });

    return allPermissions;
  };

  /**
   * Check if user has a specific permission
   * @param {string} permissionCode - The permission code to check (e.g., "perm:team_mgmt:view")
   * @param {string} level - Optional level to check (e.g., "hq", "branch", "self")
   * @returns {boolean} True if user has the permission
   */
  const hasPermission = (permissionCode, level = null) => {
    const permissions = getUserPermissions();

    if (!permissionCode) return false;

    return permissions.some((perm) => {
      const matchesCode = perm.permission === permissionCode;
      const matchesLevel = !level || perm.level === level;
      return matchesCode && matchesLevel;
    });
  };

  /**
   * Check if user has view permission for a resource
   * @param {string} resource - The resource identifier (e.g., "team_mgmt", "business_profile")
   * @returns {boolean} True if user can view
   */
  const canView = (resource) => {
    return hasPermission(`perm:${resource}:view`);
  };

  /**
   * Check if user has edit permission for a resource
   * @param {string} resource - The resource identifier (e.g., "team_mgmt", "business_profile")
   * @returns {boolean} True if user can edit
   */
  const canEdit = (resource) => {
    return hasPermission(`perm:${resource}:edit`);
  };

  /**
   * Check if user has delete permission for a resource
   * @param {string} resource - The resource identifier (e.g., "team_mgmt", "business_profile")
   * @returns {boolean} True if user can delete
   */
  const canDelete = (resource) => {
    return hasPermission(`perm:${resource}:delete`);
  };

  /**
   * Check if user has create permission for a resource
   * @param {string} resource - The resource identifier (e.g., "team_mgmt", "business_profile")
   * @returns {boolean} True if user can create
   */
  const canCreate = (resource) => {
    return hasPermission(`perm:${resource}:create`);
  };

  /**
   * Check if user has any permission that matches a pattern
   * @param {string} pattern - Pattern to match (can use wildcards with includes)
   * @returns {boolean} True if user has any matching permission
   */
  const hasAnyPermission = (patterns) => {
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }

    const permissions = getUserPermissions();
    return patterns.some((pattern) =>
      permissions.some((perm) => perm.permission.includes(pattern))
    );
  };

  /**
   * Check if user has all specified permissions
   * @param {Array<string>} permissionCodes - Array of permission codes
   * @returns {boolean} True if user has all permissions
   */
  const hasAllPermissions = (permissionCodes) => {
    if (!Array.isArray(permissionCodes)) {
      return false;
    }
    return permissionCodes.every((code) => hasPermission(code));
  };

  /**
   * Check if user is owner at HQ level
   * @returns {boolean} True if user is owner_hq
   */
  const isOwnerHq = () => {
    return me.value?.roles?.some(
      (role) => role.assignment?.company_role === "owner_hq"
    );
  };

  /**
   * Check if user is owner (any level)
   * @returns {boolean} True if user is owner
   */
  const isOwner = () => {
    return me.value?.company_role === "owner" || isOwnerHq();
  };

  /**
   * Get user's company role
   * @returns {string} Company role
   */
  const getCompanyRoles = () => {
    let company_roles = [];
    if (me.value.roles) {
      company_roles = me.value.roles.map(
        (role) => role.assignment.company_role
      );
    }
    return company_roles;
  };

  const companyRoleOptions = ref([
    { label: "Owner HQ", value: "owner_hq", order: 1 },
    { label: "HRD HQ", value: "hrd_hq", order: 2 },
    { label: "Dept Head HQ", value: "dept_head_hq", order: 3 },
    { label: "PIC Branch", value: "pic_branch", order: 4 },
    { label: "HRD Branch", value: "hrd_branch", order: 5 },
    { label: "Dept Head Branch", value: "dept_head_branch", order: 6 },
    { label: "Member", value: "member", order: 7 },
  ]);

  const isMember = () => {
    let company_roles = [];
    if (Array.isArray(me.value.roles) && me.value.roles.length > 0) {
      company_roles = me.value.roles.map(
        (role) => role.assignment.company_role
      );
    }
    let highCompanyRole =
      company_roles?.length > 0
        ? company_roles.reduce((a, b) => {
            return companyRoleOptions.value.find((role) => role.value === a)
              ?.order <
              companyRoleOptions.value.find((role) => role.value === b)?.order
              ? a
              : b;
          })
        : "member";
    return highCompanyRole === "member";
  };

  /**
   * Check if button should be visible based on permissions
   * @param {string} action - The action type: "view", "edit", "create", "delete"
   * @param {string} resource - The resource identifier
   * @returns {boolean} True if button should be visible
   */
  const canPerformAction = (action, resource) => {
    switch (action) {
      case "view":
        return canView(resource);
      case "edit":
        return canEdit(resource);
      case "create":
        return canCreate(resource);
      case "delete":
        return canDelete(resource);
      default:
        return false;
    }
  };

  /**
   * Check if user can access profile completion section
   * @param {string} section - Section name: "business_profile", "comp_rep", "hq_branch_info"
   * @param {string} action - Action: "view" or "edit"
   * @returns {boolean} True if user can access
   */
  const canAccessProfileSection = (section, action = "view") => {
    const permissionCode = `perm:profile_completion:${section}:${action}`;
    return hasPermission(permissionCode);
  };

  return {
    getUserPermissions,
    hasPermission,
    canView,
    canEdit,
    canDelete,
    canCreate,
    hasAnyPermission,
    hasAllPermissions,
    isOwnerHq,
    isOwner,
    isMember,
    getCompanyRoles,
    canPerformAction,
    canAccessProfileSection,
  };
}
