export const useUser = () => {
  const { $apiFetch } = useApi();
  const me = useState("me", () => ({
    id: null,
    full_name: "",
    email: "",
    phone: "",
    user_role: null,
    company_id: null,
    company_hq_id: null,
    company_role: null,
    wizard_state: [],
    last_wizard_state: 0,
    roles: [],
  }));

  const roles = ref([
    { label: "Owner HQ", name: "owner_hq", type: "" },
    {
      label: "HRD HQ",
      name: "hrd_hq",
      type: "hq",
      allowedRoles: ["owner_hq", "hrd_hq"],
    },
    {
      label: "PIC Branch",
      name: "pic_branch",
      type: "branch",
      allowedRoles: ["owner_hq", "hrd_hq", "pic_branch"],
    },
    {
      label: "HRD Branch",
      name: "hrd_branch",
      type: "branch",
      allowedRoles: ["owner_hq", "hrd_hq", "hrd_branch"],
    },
    {
      label: "Dept Head HQ",
      name: "dept_head_hq",
      type: "hq",
      allowedRoles: ["owner_hq", "hrd_hq", "dept_head_hq"],
    },
    {
      label: "Dept Head Branch",
      name: "dept_head_branch",
      type: "branch",
      allowedRoles: ["owner_hq", "hrd_hq", "dept_head_branch"],
    },
    {
      label: "Member",
      name: "member",
      type: "branch,hq",
      allowedRoles: [
        "owner_hq",
        "hrd_hq",
        "dept_head_hq",
        "pic_branch",
        "hrd_branch",
        "dept_head_branch",
        "member",
      ],
    },
  ]);

  // Roles without owner for placement after transfer
  const nonOwnerRoles = ref([
    { label: "HRD HQ", name: "hrd_hq", type: "hq" },
    { label: "PIC Branch", name: "pic_branch", type: "branch" },
    { label: "HRD Branch", name: "hrd_branch", type: "branch" },
    { label: "Dept Head HQ", name: "dept_head_hq", type: "hq" },
    { label: "Dept Head Branch", name: "dept_head_branch", type: "branch,hq" },
    { label: "Member", name: "member", type: "branch,hq" },
  ]);

  const fetchMe = async (withEncrypted = false) => {
    try {
      const response = await $apiFetch("/users/me");

      //di sini urutkan me.value.roles berdasarkan me.value.roles[0]?.assignment?.company_role dan urutanny sesuai roles diatas.
      if (Array.isArray(response.roles) && response.roles.length) {
        const roleOrder = roles.value.reduce((acc, role, index) => {
          acc[role.name] = index;
          return acc;
        }, {});

        response.roles = response.roles.sort((roleA, roleB) => {
          const keyA = roleA?.assignment?.company_role;
          const keyB = roleB?.assignment?.company_role;
          const orderA =
            typeof roleOrder[keyA] === "number" ? roleOrder[keyA] : Infinity;
          const orderB =
            typeof roleOrder[keyB] === "number" ? roleOrder[keyB] : Infinity;
          return orderA - orderB;
        });
      }

      if (response.roles && response.roles.length > 0) {
        response.company_id =
          response.roles[0]?.assignment?.company_id || response.company_id;
        response.company_hq_id =
          response.roles[0]?.assignment?.company_hq_id ||
          response.roles[0]?.assignment?.company_id ||
          response.company_id;

        // Determine user_role from roles array if not already set by backend
        // Backend now uses role assignments, so user_role might be null
        if (!response.user_role) {
          // Priority: sys_admin > candidate > employer
          const roleAssignments = response.roles
            .map((r) => r.assignment?.role)
            .filter(Boolean);

          if (roleAssignments.includes("sys_admin")) {
            response.user_role = "sys_admin";
          } else if (roleAssignments.includes("candidate")) {
            response.user_role = "candidate";
          } else if (roleAssignments.includes("employer")) {
            // Use 'company' for backward compatibility with existing frontend code
            // Frontend uses both 'employer' and 'company' in different places
            response.user_role = "company";
          } else if (
            roleAssignments.includes("admin") ||
            roleAssignments.includes("admin_viewer")
          ) {
            response.user_role = "sys_admin"; // Treat admin as sys_admin for frontend
          } else if (roleAssignments.includes("pic_school")) {
            response.user_role = "employer"; // Treat pic_school as employer for frontend
          }
        }

        // Also set company_role from the first role assignment if available and not already set
        if (
          !response.company_role &&
          response.roles[0]?.assignment?.company_role
        ) {
          response.company_role = response.roles[0].assignment.company_role;
        }
      }

      Object.assign(me.value, response);

      if (withEncrypted) {
        const responseEncrypted = await $apiFetch(
          `/encrypted-user-data/search`,
          {
            params: {
              filters: {
                user_id: me.value.id,
              },
            },
          }
        );
        if (responseEncrypted.items && responseEncrypted.items[0]) {
          const encryptedUser = responseEncrypted.items[0];
          me.value.phone = encryptedUser.encrypted_phone;
          me.value.address = encryptedUser.encrypted_address;
          me.value.nik = encryptedUser.encrypted_nik;
          me.value.date_of_birth = encryptedUser.encrypted_date_of_birth;
          me.value.encrypted_phone = encryptedUser.encrypted_phone;
          me.value.encrypted_address = encryptedUser.encrypted_address;
          me.value.encrypted_date_of_birth =
            encryptedUser.encrypted_date_of_birth;
          me.value.encrypted_nik = encryptedUser.encrypted_nik;
        }
      }
      return me.value;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  return {
    me,
    roles,
    nonOwnerRoles,
    fetchMe,
  };
};
