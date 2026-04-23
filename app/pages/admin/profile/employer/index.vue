<template>
  <v-container fluid class="pa-0">
    <!-- Header with back arrow and title -->
    <div class="d-flex align-center pa-4">
      <v-icon
        @click="$router.back()"
        color="grey-darken-2"
        size="24"
        class="mr-2"
        >mdi-chevron-left</v-icon
      >
      <h3 class="font-weight-medium text-grey-darken-4">Profile</h3>
    </div>

    <!-- Tab Navigation -->
    <div class="px-4">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab v-if="canViewProfile" value="personal" class="text-capitalize"
          >Personal</v-tab
        >
        <v-tab
          v-if="canViewCompanyDetails"
          value="company"
          class="text-capitalize"
          >Company Info</v-tab
        >
        <v-tab v-if="canViewOrgOverview" value="members" class="text-capitalize"
          >Members</v-tab
        >
      </v-tabs>
      <v-divider />
    </div>
  </v-container>
  <v-container fluid class="pa-4" style="min-height: 100vh">
    <form @submit.prevent="onSubmit">
      <v-row align="center">
        <v-col cols="12" sm="12" md="10" lg="10" class="mx-auto">
          <v-window v-model="activeTab">
            <!-- Personal Tab Content -->
            <v-window-item v-if="canViewProfile" value="personal">
              <PersonalTab :genders="genders" :me="me" />
            </v-window-item>

            <!-- Company Info Tab Content -->
            <v-window-item v-if="canViewCompanyDetails" value="company">
              <CompanyTab
                :form="form"
                :branches="branches"
                v-model:branchSearchKeyword="branchSearchKeyword"
                v-model:branchSearchBy="branchSearchBy"
                v-model:selectedBranchDepartment="selectedBranchDepartment"
                v-model:branchPage="branchPage"
                v-model:branchItemsPerPage="branchItemsPerPage"
                v-model:branchSortBy="branchSortBy"
                :branchSearchOptions="branchSearchOptions"
                :branchDepartments="branchDepartments"
                :branchTableHeaders="branchTableHeaders"
                :filteredBranches="filteredBranches"
                :branchTotalItems="branchTotalItems"
                :loadingBranches="loadingBranches"
                @branchSearch="handleBranchSearch"
                @branchReset="handleBranchReset"
              />
            </v-window-item>

            <!-- Members Tab Content -->
            <v-window-item v-if="canViewOrgOverview" value="members">
              <MembersTab
                :memberStats="memberStats"
                :filteredMembers="filteredMembers"
                v-model:memberSearchKeyword="memberSearchKeyword"
                v-model:memberSearchBy="memberSearchBy"
                v-model:selectedMemberBranch="selectedMemberBranch"
                v-model:selectedMemberRole="selectedMemberRole"
                v-model:memberPage="memberPage"
                v-model:memberItemsPerPage="memberItemsPerPage"
                v-model:memberSortBy="memberSortBy"
                :memberSearchOptions="memberSearchOptions"
                :memberBranchOptions="memberBranchOptions"
                :memberRoleOptions="memberRoleOptions"
                :memberTableHeaders="memberTableHeaders"
                :memberTotalItems="memberTotalItems"
                :loadingMembers="loadingMembers"
                @memberSearch="handleMemberSearch"
                @memberReset="handleMemberReset"
              />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </form>
    <v-dialog v-model="loadingInitial" persistent width="auto" max-width="200">
      <v-card
        height="130"
        class="d-flex flex-column align-center justify-center text-center mx-auto pa-3"
        rounded="xl"
        style="background-color: rgba(255, 255, 255, 0.9)"
      >
        <v-img :src="`/logo-double.svg`" width="100" class="mb-3" />
        <div class="d-flex align-center justify-center mb-2">
          <v-progress-circular
            size="25"
            width="3"
            indeterminate
            color="primary"
            class="mr-2"
          >
          </v-progress-circular>
          <strong style="font-size: 16px" class="text-primary">
            Loading...
          </strong>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();

// Permission checks
const { hasPermission, canAccessProfileSection } = usePermissions();
const canViewProfile = computed(() =>
  hasPermission("perm:view_profile:self_profile:view")
);
const canViewCompanyDetails = computed(() =>
  hasPermission("perm:view_profile:company_details:view")
);
const canViewOrgOverview = computed(() =>
  hasPermission("perm:view_profile:org_overview:view")
);

// Import tab components
const PersonalTab = defineAsyncComponent(() =>
  import("~/components/profile/employer/PersonalTab.vue")
);
const CompanyTab = defineAsyncComponent(() =>
  import("~/components/profile/employer/CompanyTab.vue")
);
const MembersTab = defineAsyncComponent(() =>
  import("~/components/profile/employer/MembersTab.vue")
);

// Use hash tabs for navigation
const {
  activeTab,
  initializeFromHash,
  setupHashListener,
  cleanupHashListener,
} = useHashTabs("personal", ["personal", "company", "members"]);

const form = ref({}); // Form data object
const mode = ref("update"); // Mode for the form, can be "create" or "update"
const entity = ref("mst-companies");
const isShowFields = ref(false);
const loading = ref(true);

// Branch Info variables
const branches = ref([]);
const loadingBranches = ref(false);
const branchSearchKeyword = ref("");
const branchSearchBy = ref("branch");
const selectedBranchDepartment = ref("All");
const branchPage = ref(1);
const branchItemsPerPage = ref(10);
const branchTotalItems = ref(0);
const branchSortBy = ref([]);

const branchSearchOptions = ref([
  { label: "Branch", value: "branch" },
  { label: "Location", value: "location" },
  { label: "Email", value: "email" },
  { label: "Phone Number", value: "phone" },
]);

const branchDepartments = ref([{ label: "All", value: "All" }]);

const branchTableHeaders = ref([
  { title: "No", key: "no", sortable: false },
  { title: "Branch", key: "branch", sortable: true },
  { title: "Department", key: "departments", sortable: false },
  { title: "Location", key: "location", sortable: true },
  { title: "Email", key: "email", sortable: true },
  { title: "Phone Number", key: "phone", sortable: true },
]);

// Computed property for filtered branches - filtering is now handled by backend
const filteredBranches = computed(() => {
  return branches.value.map((item, index) => ({
    ...item,
    no: (branchPage.value - 1) * branchItemsPerPage.value + index + 1,
    branch: item.display_name || item.branch || "Headquarters",
  }));
});

// Branch functions
const handleBranchSearch = () => {
  branchPage.value = 1; // Reset to first page when searching
  fetchBranches(me.value.company_id);
};

const handleBranchReset = () => {
  branchSearchKeyword.value = "";
  selectedBranchDepartment.value = "All";
  branchSearchBy.value = "branch";
  branchPage.value = 1;
  fetchBranches(me.value.company_id);
};

const fetchBranches = async (companyHqID) => {
  if (!companyHqID) return;

  loadingBranches.value = true;
  try {
    // Get HQ company first to know company_name
    const hqRes = await $apiFetch("/mst-companies/search", {
      params: {
        filters: { id: companyHqID },
        limit: 1,
      },
    });

    if (!hqRes.items || hqRes.items.length === 0) {
      branches.value = [];
      branchTotalItems.value = 0;
      return;
    }

    const hqCompany = hqRes.items[0];

    // Build filters for /mst-companies/search
    const filters = {
      company_name: hqCompany.company_name, // Get all branches with same company_name
    };

    // Add search filters if they exist (backend filtering)
    if (branchSearchKeyword.value) {
      const keyword = branchSearchKeyword.value.trim();
      if (keyword) {
        switch (branchSearchBy.value) {
          case "branch":
            filters.branch = keyword;
            break;
          case "location":
            filters.location = keyword;
            break;
          case "email":
            filters.email = keyword;
            break;
          case "phone":
            filters.phone = keyword;
            break;
        }
      }
    }

    // Add department filter if selected (backend filtering)
    if (
      selectedBranchDepartment.value &&
      selectedBranchDepartment.value !== "All"
    ) {
      filters.dept_id = selectedBranchDepartment.value;
    }

    // Build sortBy object from sortBy array
    let sortByParam = {};
    if (branchSortBy.value && branchSortBy.value.length > 0) {
      // Take the first sort option (Vuetify supports multi-sort but we'll use first one)
      const firstSort = branchSortBy.value[0];
      sortByParam[firstSort.key] = firstSort.order === "desc" ? "DESC" : "ASC";
    } else {
      // Default sort by branch ASC if no sorting specified
      //sortByParam = { branch: "ASC" };
    }

    // Fetch branches with filtering and pagination using /mst-companies/search
    const response = await $apiFetch("/mst-companies/search", {
      params: {
        filters,
        page: branchPage.value,
        limit: branchItemsPerPage.value,
        sortBy: sortByParam,
      },
    });

    // Fetch departments for each branch in parallel
    const departmentsRes = await Promise.all(
      response.items.map((branch) =>
        $apiFetch(`/mst-companies/departments/${branch.id}`).catch((error) => {
          console.error(
            `Error fetching departments for branch ${branch.id}:`,
            error
          );
          return { items: [] };
        })
      )
    );

    // Map branches with departments
    branches.value = response.items.map((branch, index) => ({
      ...branch,
      departments: departmentsRes[index]?.items || [],
      display_name: branch.branch || "Headquarters",
    }));

    branchTotalItems.value = response.meta?.total || 0;

    // Populate departments dropdown
    const departmentMap = new Map();
    departmentMap.set("All", { label: "All", value: "All" });

    branches.value.forEach((branch) => {
      if (branch.departments) {
        branch.departments.forEach((dept) => {
          if (dept.id && dept.dept_name) {
            departmentMap.set(dept.id, {
              label: dept.dept_name,
              value: dept.id, // Use UUID as value
            });
          }
        });
      }
    });

    branchDepartments.value = Array.from(departmentMap.values());
  } catch (error) {
    console.error("Error fetching branches:", error);
    branches.value = [];
    branchTotalItems.value = 0;
  } finally {
    loadingBranches.value = false;
  }
};

const fields = useState(`${entity.value}fields`, () => []);
const fieldsPIC = useState(`usersfields`, () => []);
const genders = useState("genders", () => []);
const fetchGenders = async () => {
  const response = await $apiFetch(`/configs/key/gender`);
  genders.value = response.value;
};

const errors = ref({});
const errorsPIC = ref({});

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const handleInputRegion = (event) => {
  debouncedFetchRegions(event.target.value);
};

const { users, debouncedFetchUsers, userLoading, fetchUsers } = useUserSearch();
const handleInputUser = (event) => {
  debouncedFetchUsers(event.target.value, ["full_name", "email"]);
};

const { models, debouncedFetch, fetch } = useDynamicSearch([
  "salary_country",
  "industry",
  "company",
  "profession_parent",
  "invoice",

  "skill",
  "group",
  "paket",
  "school",
  "interest",
  "language",
  "profession",
  "right_to_work",
  "subscription",

  "event",
  "job",
]);

const setAutoComplete = (field) => {
  if (form.value[field]) {
    if (field == "region_id") {
      fetchRegions(form.value[field], "id");
    }
    if (["user_id", "following_id"].includes(field)) {
      fetchUsers(form.value[field], ["id"]);
    }
    if (field == "salary_country_id") {
      fetch("salary_country", form.value[field], ["id"], "mst-salary-country");
    }
    if (
      [
        "skill_id",
        "school_id",
        "interest_id",
        "language_id",
        "profession_id",
        "right_to_work_id",
        "subscription_id",
      ].includes(field)
    ) {
      fetch(
        `${field.slice(0, -3)}`,
        form.value[field],
        ["id"],
        `mst-${field.slice(0, -3)}s`
      );
    }
    if (
      ["interest_ids", "profession_ids", "right_to_work_ids"].includes(field)
    ) {
      fetch(
        `${field.slice(0, -4)}`,
        form.value[field],
        ["id"],
        `mst-${field.slice(0, -4)}s`
      );
    }
    if (["job_id", "event_id", "group_id", "invoice_id"].includes(field)) {
      fetch(
        `${field.slice(0, -3)}`,
        form.value[field],
        ["id"],
        `${field.slice(0, -3)}s`
      );
    }
    if (field == "group_id") {
      fetch("group", form.value[field], ["id"], "groups");
    }
    if (field == "paket_id") {
      fetch("paket", form.value[field], ["id"], "event-pakets");
    }
    if (field.name == "invoice_id") {
      fetch("invoice", form.value[field], ["id"], "invoices");
    }
    if (field == "company_id") {
      fetch("company", form.value[field], ["id"], "mst-companies");
    }
    if (field.name == "parent_id" && entity == "mst-professions") {
      fetch("parent_profession", form.value[field], ["id"], "mst-professions");
    }
  }
};

// Initialize form data with either empty values (for create) or predefined values (for update)
const initializeForm = (data = {}) => {
  //Object.assign(form.value, data);
  Object.keys(data).forEach((field) => {
    form.value[field] = data && data[field] ? data[field] : ""; // Set existing data or empty

    if (field.endsWith("_ids")) {
      form.value[field] = data && data[field] ? data[field] : []; // Set existing data or empty
    }

    setAutoComplete(field);
  });

  if (data["region"]) {
    form.value["region"] = data["region"];
  }

  if (data["industri"]) {
    form.value["industry"] = data["industri"].name;
  }

  loading.value = false;
};

const members = ref([]);
const loadingInitial = ref(true);
const loadingMembers = ref(false);

// Member search and filter variables
const memberSearchKeyword = ref("");
const memberSearchBy = ref("name");
const selectedMemberBranch = ref(null);
const selectedMemberRole = ref(null);
const memberPage = ref(1);
const memberItemsPerPage = ref(25);
const memberTotalItems = ref(0);
const memberTotalPages = ref(0);
const memberSortBy = ref([]);

const memberSearchOptions = ref([
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
]);

const memberBranchOptions = ref([{ label: "All", value: null }]);

const memberRoleOptions = ref([
  { label: "All", value: null },
  { label: "Owner Hq", value: "owner_hq" },
  { label: "HRD HQ", value: "hrd_hq" },
  { label: "Dept Head Hq", value: "dept_head_hq" },
  { label: "PIC Branch", value: "pic_branch" },
  { label: "HRD Branch", value: "hrd_branch" },
  { label: "Dept Head Branch", value: "dept_head_branch" },
  { label: "Member", value: "member" },
]);

const memberTableHeaders = ref([
  { title: "No", key: "no", sortable: false, width: "60px" },
  { title: "Name", key: "full_name", sortable: true },
  { title: "Role", key: "company_role", sortable: true },
  { title: "Branch", key: "branch", sortable: true },
  { title: "Department", key: "dept_name", sortable: true },
  { title: "Job Title", key: "profession_name", sortable: true },
]);

// Member statistics
const memberStats = ref({
  totalMembers: 0,
  totalBranches: 0,
  totalDepartments: 0,
});

const fetchMemberStats = async () => {
  if (!me.value.company_id) return;

  try {
    const params = {
      company_hq_id: me.value.company_hq_id,
      //company_id: me.value.company_id,
    };

    /*if (me.value.company_id != me.value.company_hq_id) {
      params.company_id = me.value.company_id;
    }*/

    const response = await $apiFetch("/mst-companies/metrics", {
      params,
    });

    memberStats.value = {
      totalMembers: response.total_users || 0,
      totalBranches: response.total_branches || 0,
      totalDepartments: response.total_departments || 0,
    };
  } catch (error) {
    console.error("Error fetching member stats:", error);
    // Set default values on error
    memberStats.value = {
      totalMembers: 0,
      totalBranches: 0,
      totalDepartments: 0,
    };
  }
};

// Filtered members computed property - now just adds row numbers and maps fields
const filteredMembers = computed(() => {
  return members.value.map((item, index) => ({
    ...item,
    no: (memberPage.value - 1) * memberItemsPerPage.value + index + 1,
    name: item.full_name,
    role: item.company_role,
    branch_name: item.branch || item.company_name,
    placement_branch: item.branch || item.company_name,
    department: item.dept_name,
    job_title: item.profession_name,
  }));
});

// Member functions
const handleMemberSearch = () => {
  memberPage.value = 1; // Reset to first page when searching
  fetchMembers();
};

const handleMemberReset = () => {
  memberSearchKeyword.value = "";
  selectedMemberBranch.value = null;
  selectedMemberRole.value = null;
  memberSearchBy.value = "name";
  memberPage.value = 1;
  fetchMembers();
};

const fetchMembers = async () => {
  if (!me.value.company_id) return;

  loadingMembers.value = true;
  try {
    const params = {
      company_hq_id: me.value.company_hq_id,
      //company_id: me.value.company_id,
      page: memberPage.value,
      limit: memberItemsPerPage.value,
    };

    /*if (me.value.company_id != me.value.company_hq_id) {
      params.company_id = me.value.company_id;
    }*/

    // Add filters if they exist
    if (memberSearchKeyword.value) {
      if (memberSearchBy.value === "name") {
        params.full_name = memberSearchKeyword.value;
      } else if (memberSearchBy.value === "email") {
        params.email = memberSearchKeyword.value;
      }
    }

    if (selectedMemberRole.value) {
      params.company_role = selectedMemberRole.value;
    }

    // For branch filter, we need to use company_id
    if (selectedMemberBranch.value) {
      const selectedBranch = branches.value.find(
        (b) =>
          b.display_name === selectedMemberBranch.value ||
          b.branch === selectedMemberBranch.value
      );
      if (selectedBranch) {
        params.company_id = selectedBranch.id;
      }
    }

    // Add sorting if specified
    if (memberSortBy.value && memberSortBy.value.length > 0) {
      // Take the first sort option (Vuetify supports multi-sort but we'll use first one)
      const firstSort = memberSortBy.value[0];
      params.sortBy = firstSort.key;
      params.sortOrder = firstSort.order === "desc" ? "DESC" : "ASC";
    }

    const response = await $apiFetch("/mst-companies/members", { params });

    members.value = response.items || [];
    memberTotalItems.value = response.meta?.total || 0;
    memberTotalPages.value = response.meta?.totalPages || 0;

    // Update branch options from branches data
    if (branches.value.length > 0) {
      const branchSet = new Set();
      branches.value.forEach((branch) => {
        const branchName = branch.display_name || branch.branch;
        if (branchName) {
          branchSet.add(branchName);
        }
      });

      memberBranchOptions.value = [
        { label: "All", value: null },
        ...Array.from(branchSet).map((branch) => ({
          label: branch,
          value: branch,
        })),
      ];
    }
  } catch (error) {
    console.error("Error fetching members:", error);
    members.value = [];
    memberTotalItems.value = 0;
    memberTotalPages.value = 0;
  } finally {
    loadingMembers.value = false;
    if (loadingInitial.value) {
      loadingInitial.value = false;
    }
  }
};

// Watch for pagination and sorting changes - members
watch(
  [memberPage, memberItemsPerPage, memberSortBy],
  () => {
    fetchMembers();
  },
  { deep: true }
);

// Watch for pagination and sorting changes - branches
watch(
  [branchPage, branchItemsPerPage, branchSortBy],
  () => {
    if (me.value.company_id) {
      fetchBranches(me.value.company_id);
    }
  },
  { deep: true }
);

const { me, fetchMe } = useUser();
// Initialize form based on mode

onMounted(async () => {
  // Initialize hash tabs
  initializeFromHash();
  setupHashListener();

  if (!me.value.id) {
    await fetchMe();
  }
  fetchGenders();

  if (mode.value === "update" && me.value.company_id) {
    const memberDetail = await $apiFetch("/mst-companies/member-detail", {
      params: {
        user_id: me.value.id,
        company_hq_id: me.value.company_id,
      },
    });
    delete memberDetail.roles;
    delete memberDetail.company_id;
    Object.assign(me.value, memberDetail);
    loadingInitial.value = false;

    // Fetch branches, member stats, and members
    const companyHqID = me.value.company_hq_id || me.value.company_id;
    if (companyHqID) {
      await fetchBranches(companyHqID);
    }
    fetchMemberStats();
    fetchMembers();

    $apiFetch(`/${entity.value}/search`, {
      params: {
        filters: {
          id: me.value.company_id,
        },
        expands: "region,industri",
      },
    }).then((data) => {
      if (data.items && data.items[0]) {
        initializeForm(data.items[0]); // Load existing data if in update mode
      }
    });
  } else {
    loadingInitial.value = false;
  }
});

onBeforeUnmount(() => {
  // Cleanup hash listener
  cleanupHashListener();
});

// Submit handler
const submitLoading = ref(false);
const providerErrors = ref([]);
const onSubmit = async () => {
  Object.keys(errors.value).forEach((key) => {
    errors.value[key] = [];
  });
  console.log(form.value);
  Object.keys(form.value).forEach((key) => {
    if (
      !form.value[key] &&
      form.value[key] !== 0 &&
      form.value[key] !== false
    ) {
      delete form.value[key];
    }
  });

  try {
    submitLoading.value = true;
    if (mode.value === "create") {
      await $apiFetch(`/${entity.value}`, {
        method: "POST",
        body: form.value,
      });
      console.log("Creating entry:", form.value);
    } else {
      delete form.value.id;
      await $apiFetch(`/${entity.value}/${route.query.id}`, {
        method: "PATCH",
        body: form.value,
      });
      console.log("Updating entry:", form.value);
    }
    submitLoading.value = false;
    // Optionally, redirect after form submission
    router.back();
  } catch (error) {
    submitLoading.value = false;
    console.log(error.response);
    if (
      error.response &&
      error.response._data &&
      error.response._data.message
    ) {
      const errorMessages = error.response._data.message;
      if (Array.isArray(errorMessages)) {
        Object.keys(errors.value).forEach((key) => {
          errorMessages.forEach((errMsg) => {
            if (errMsg.includes(key)) {
              errors.value[key].push(errMsg);
            }
          });
        });
      } else {
        providerErrors.value.push(errorMessages);
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
    }
  }
};

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
</script>

<style scoped>
.member-item:hover {
  background-color: rgb(245, 245, 245);
}

.member-item:last-child .v-divider {
  display: none;
}
</style>
