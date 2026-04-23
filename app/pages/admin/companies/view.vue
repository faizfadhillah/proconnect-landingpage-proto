<template>
  <v-container fluid class="pa-0">
    <v-breadcrumbs
      class="text-caption"
      :items="[
        {
          title: 'dashboard',
          disabled: false,
          to: '/admin/dashboard',
        },
        {
          title: 'companies',
          disabled: false,
          to: '/admin/companies',
        },
        {
          title: 'view',
          disabled: true,
          to: `/admin/companies/view?id=${route.query.id}`,
        },
      ]"
      divider="/"
    ></v-breadcrumbs>

    <!-- Header with back arrow and title -->
    <div class="d-flex align-center px-4 pb-0">
      <v-icon @click="$router.back()" color="primary" size="24" class="mr-2"
        >mdi-arrow-left</v-icon
      >
      <h3 class="font-weight-medium text-grey-darken-4">
        {{ form.company_name }}
      </h3>
    </div>
  </v-container>
  <v-container fluid style="min-height: 100vh">
    <!-- Tab Navigation -->
    <div class="px-0 mb-6">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="company" class="text-capitalize">Company Info</v-tab>
        <v-tab value="pic" class="text-capitalize">PIC</v-tab>
        <v-tab value="members" class="text-capitalize">Members</v-tab>
      </v-tabs>
      <v-divider />
    </div>
    <form @submit.prevent="onSubmit">
      <v-card-text class="px-1 pt-0">
        <v-row grid-list-lg dense>
          <v-col v-if="loading" cols="12" md="10" class="mx-auto">
            <v-card elevation="0" rounded="lg">
              <v-skeleton-loader
                cols="12"
                v-for="n in 8"
                type="list-item-two-line"
              ></v-skeleton-loader>
            </v-card>
          </v-col>
          <template v-else>
            <v-col cols="12" class="pt-0">
              <v-window v-model="activeTab">
                <v-window-item value="company">
                  <v-row align="center">
                    <v-col cols="12" sm="12" md="10" lg="10" class="mx-auto">
                      <CompanyTab
                        :form="form"
                        :branches="branches"
                        v-model:branchSearchKeyword="branchSearchKeyword"
                        v-model:branchSearchBy="branchSearchBy"
                        v-model:selectedBranchDepartment="
                          selectedBranchDepartment
                        "
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
                        :isViewOnly="true"
                      />
                    </v-col>
                  </v-row>
                </v-window-item>

                <v-window-item value="pic">
                  <v-row align="center">
                    <v-col cols="12" sm="12" md="10" lg="10" class="mx-auto">
                      <v-card elevation="0" rounded="lg">
                        <v-card-title>PIC Info</v-card-title>
                        <v-card-text>
                          <!-- Loading State -->
                          <div v-if="loadingPIC" class="text-center py-12">
                            <v-progress-circular
                              indeterminate
                              color="primary"
                              size="48"
                            ></v-progress-circular>
                            <p class="text-grey-darken-1 mt-4">
                              Loading PIC information...
                            </p>
                          </div>

                          <!-- No PIC Placeholder -->
                          <div v-else-if="!hasPIC" class="text-center py-12">
                            <v-icon
                              color="grey-lighten-1"
                              size="80"
                              class="mb-4"
                            >
                              mdi-account-off
                            </v-icon>
                            <h3
                              class="text-grey-darken-2 mb-2 font-weight-medium"
                            >
                              PIC Not Found
                            </h3>
                            <p class="text-grey-darken-1">
                              This company does not have a Person In Charge
                              (PIC) assigned yet.
                            </p>
                          </div>

                          <!-- PIC Data -->
                          <table v-else style="width: 100%">
                            <tbody>
                              <template
                                v-for="field in fieldsPIC"
                                :key="field.name"
                              >
                                <template
                                  v-if="
                                    [
                                      'photo_url',
                                      'full_name',
                                      'email',
                                      'company_role',
                                      'gender',
                                      'region_id',
                                      'other_country',
                                      'postal_code',
                                      'encrypted_date_of_birth',
                                      'encrypted_phone',
                                      'encrypted_address',
                                    ].includes(field.name)
                                  "
                                >
                                  <tr>
                                    <td valign="top" class="py-2 pr-2">
                                      {{
                                        field.label.replace("Encrypted ", "")
                                      }}
                                    </td>
                                    <td valign="top" class="pa-2">:</td>
                                    <td valign="top" class="py-2 pl-2">
                                      <template
                                        v-if="
                                          ['photo_url', 'logo_url'].includes(
                                            field.name
                                          )
                                        "
                                      >
                                        <v-avatar
                                          rounded="lg"
                                          size="55"
                                          class="bg-grey-lighten-3"
                                        >
                                          <v-img
                                            v-if="formPIC[field.name]"
                                            :src="
                                              formPIC[field.name].includes(
                                                'http'
                                              )
                                                ? formPIC[field.name]
                                                : BASE_URL + formPIC[field.name]
                                            "
                                          />
                                          <v-icon
                                            color="grey-darken-1"
                                            v-else
                                            size="50"
                                            >{{
                                              field.name == "photo_url"
                                                ? "mdi-account"
                                                : "mdi-domain"
                                            }}</v-icon
                                          >
                                        </v-avatar>
                                      </template>
                                      <template
                                        v-else-if="field.name == 'region_id'"
                                      >
                                        {{
                                          formPIC["region"]
                                            ? formPIC["region"].name
                                            : formPIC[field.name]
                                        }}
                                      </template>
                                      <template v-else>
                                        {{ formPIC[field.name] }}
                                      </template>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colspan="4">
                                      <div
                                        style="border-bottom: 1px dotted #aaa"
                                      ></div>
                                    </td>
                                  </tr>
                                </template>
                              </template>
                            </tbody>
                          </table>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-window-item>

                <v-window-item value="members">
                  <v-row align="center">
                    <v-col cols="12" sm="12" md="10" lg="10" class="mx-auto">
                      <MembersTab
                        :memberStats="memberStats"
                        :filteredMembers="filteredMembersMembers"
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
                        :isViewOnly="true"
                      />
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>
            </v-col>
          </template>

          <!-- Loop through fields and conditionally render based on field type -->
        </v-row>
      </v-card-text>
      <!-- View-only: no actions -->
    </form>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();

const CompanyTab = defineAsyncComponent(() =>
  import("~/components/profile/employer/CompanyTab.vue")
);
const MembersTab = defineAsyncComponent(() =>
  import("~/components/profile/employer/MembersTab.vue")
);

const form = ref({}); // Form data object
const formPIC = ref({}); // Form data object
const isFormValid = ref(false); // Track form validation status
const mode = ref(route.query.id ? "update" : "create"); // Mode for the form, can be "create" or "update"
const entity = ref("mst-companies");
const isShowFields = ref(false);
const loading = ref(true);
const activeTab = ref("company");
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const hasPIC = ref(false); // Track if PIC exists
const loadingPIC = ref(true); // Track PIC loading state

// Define fields with configuration
const fieldsOld = ref([
  {
    name: "firebase_uid",
    label: "Firebase UID",
    type: "text",
    rules: [(v) => !!v || "Firebase UID is required"],
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    inputType: "email",
    rules: [
      (v) => !!v || "Email is required",
      (v) => /.+@.+\..+/.test(v) || "Must be a valid email",
    ],
    required: true,
  },
  {
    name: "user_role",
    label: "User Role",
    type: "select",
    options: ["user", "admin", "manager"],
    rules: [(v) => !!v || "User role is required"],
    required: true,
  },
  {
    name: "company_id",
    label: "Company ID",
    type: "text",
    rules: [
      (v) =>
        v ? /^[0-9a-fA-F-]{36}$/.test(v) || "Must be a valid UUID" : true,
    ],
  },
  {
    name: "company_role",
    label: "Company Role",
    type: "select",
    options: ["owner", "member", "admin"],
  },
  {
    name: "full_name",
    label: "Full Name",
    type: "text",
    rules: [(v) => !!v || "Full name is required"],
    required: true,
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["male", "female", "other"],
  },
  {
    name: "personal_summary",
    label: "Personal Summary",
    type: "textarea",
  },
  {
    name: "availability",
    label: "Availability",
    type: "select",
    options: ["full-time", "part-time", "contract"],
  },
]);

const fields = useState(`${entity.value}fields`, () => []);
const fieldsPIC = useState(`usersfields`, () => []);

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
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};

const setAutoComplete = (field) => {
  if (form.value[field.name]) {
    if (field.name == "region_id") {
      fetchRegions(form.value[field.name], "id");
    }
    if (["user_id", "following_id"].includes(field.name)) {
      fetchUsers(form.value[field.name], ["id"]);
    }
    if (field.name == "salary_country_id") {
      fetch(
        "salary_country",
        form.value[field.name],
        ["id"],
        "mst-salary-country"
      );
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
      ].includes(field.name)
    ) {
      fetch(
        `${field.name.slice(0, -3)}`,
        form.value[field.name],
        ["id"],
        `mst-${field.name.slice(0, -3)}s`
      );
    }
    if (
      ["interest_ids", "profession_ids", "right_to_work_ids"].includes(
        field.name
      )
    ) {
      fetch(
        `${field.name.slice(0, -4)}`,
        form.value[field.name],
        ["id"],
        `mst-${field.name.slice(0, -4)}s`
      );
    }
    if (["job_id", "event_id", "group_id", "invoice_id"].includes(field.name)) {
      fetch(
        `${field.name.slice(0, -3)}`,
        form.value[field.name],
        ["id"],
        `${field.name.slice(0, -3)}s`
      );
    }
    if (field.name == "group_id") {
      fetch("group", form.value[field.name], ["id"], "groups");
    }
    if (field.name == "paket_id") {
      fetch("paket", form.value[field.name], ["id"], "event-pakets");
    }
    if (field.name == "invoice_id") {
      fetch("invoice", form.value[field.name], ["id"], "invoices");
    }
    if (field.name == "company_id") {
      fetch("company", form.value[field.name], ["id"], "mst-companies");
    }
    if (field.name == "parent_id" && entity == "mst-professions") {
      fetch(
        "parent_profession",
        form.value[field.name],
        ["id"],
        "mst-professions"
      );
    }
  }
};

const loadFields = async () => {
  let items = fields.value;
  if (!items.length) {
    items = await $apiFetch(`/fields/${entity.value}`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fields.value.push(item);
        errors.value[item.name] = [];
      });
    }
  }

  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

const loadFieldsPIC = async () => {
  let items = fieldsPIC.value;
  if (!items.length) {
    items = await $apiFetch(`/fields/users`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fieldsPIC.value.push(item);
        errorsPIC.value[item.name] = [];
      });
    }
  }
  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

const loadFieldsPICEncrypted = async () => {
  let items = fieldsPIC.value;
  console.log(items);
  if (!items.find((x) => x.name == "encrypted_phone")) {
    items = await $apiFetch(`/fields/encrypted-user-data`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fieldsPIC.value.push(item);
        errorsPIC.value[item.name] = [];
      });
    }
  }

  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

// Initialize form data with either empty values (for create) or predefined values (for update)
const initializeForm = (data = null) => {
  //Object.assign(form.value, data);
  fields.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    form.value[field.name] = data && data[field.name] ? data[field.name] : ""; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          form.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          form.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      form.value[field.name] = data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    if (data["region"]) {
      form.value["region"] = data["region"];
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

const initializeFormPIC = (data = null) => {
  //Object.assign(form.value, data);
  fieldsPIC.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    formPIC.value[field.name] =
      data && data[field.name] ? data[field.name] : ""; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          formPIC.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          formPIC.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      formPIC.value[field.name] =
        data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    if (data["region"]) {
      formPIC.value["region"] = data["region"];
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

const initializeFormPICEncrypted = (data = null) => {
  //Object.assign(form.value, data);
  fieldsPIC.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    formPIC.value[field.name] =
      data && data[field.name] ? data[field.name] : formPIC.value[field.name]; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          formPIC.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          formPIC.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      formPIC.value[field.name] =
        data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

// Initialize form based on mode
onMounted(async () => {
  await loadFields();
  await loadFieldsPIC();
  await loadFieldsPICEncrypted();
  if (mode.value === "update") {
    setTimeout(async () => {
      $apiFetch(`/${entity.value}/search`, {
        params: { id: route.query.id, expands: "region" },
      }).then(async (data) => {
        if (data.items && data.items[0]) {
          initializeForm(data.items[0]); // Load existing data if in update mode
          // After company data loaded, fetch branches/members based on HQ id
          const hqId = route.query.id;
          if (hqId) {
            await fetchBranches(hqId);
            fetchMemberStats(hqId);
            fetchMembers();
          }
        }
      });
    }, 100);

    setTimeout(async () => {
      // Get PIC using user role assignments (new system)
      // Use /mst-companies/members endpoint which uses user_role_assignments
      loadingPIC.value = true;
      hasPIC.value = false;

      try {
        const membersResponse = await $apiFetch(`/mst-companies/members`, {
          params: {
            company_hq_id: route.query.id,
            company_role: "owner_hq",
            limit: 1,
          },
        });

        if (membersResponse.items && membersResponse.items[0]) {
          const picMember = membersResponse.items[0];
          // Get full user data with expands
          const userResponse = await $apiFetch(`/users/search`, {
            params: {
              id: picMember.user_id,
              expands: "region",
            },
          });

          if (userResponse.items && userResponse.items[0]) {
            const picData = userResponse.items[0];
            initializeFormPIC(picData);
            hasPIC.value = true;

            // Get encrypted data
            $apiFetch(`/encrypted-user-data/search`, {
              params: {
                filters: {
                  user_id: picData.id,
                },
              },
            }).then((data) => {
              if (data.items && data.items[0]) {
                initializeFormPICEncrypted(data.items[0]);
              }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching PIC:", error);
      } finally {
        loadingPIC.value = false;
      }
    }, 100);
  }
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

// =========================
// Branches and Members (for tabs)
// =========================
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

const filteredBranches = computed(() => {
  return branches.value.map((item, index) => ({
    ...item,
    no: (branchPage.value - 1) * branchItemsPerPage.value + index + 1,
    branch: item.display_name || item.branch || "Headquarters",
  }));
});

const handleBranchSearch = () => {
  branchPage.value = 1;
  fetchBranches(route.query.id);
};

const handleBranchReset = () => {
  branchSearchKeyword.value = "";
  selectedBranchDepartment.value = "All";
  branchSearchBy.value = "branch";
  branchPage.value = 1;
  fetchBranches(route.query.id);
};

const fetchBranches = async (companyHqID) => {
  if (!companyHqID) return;
  loadingBranches.value = true;
  try {
    const hqRes = await $apiFetch("/mst-companies/search", {
      params: { filters: { id: companyHqID }, limit: 1 },
    });
    if (!hqRes.items || hqRes.items.length === 0) {
      branches.value = [];
      branchTotalItems.value = 0;
      return;
    }
    const hqCompany = hqRes.items[0];
    const filters = { company_name: hqCompany.company_name };
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
    if (
      selectedBranchDepartment.value &&
      selectedBranchDepartment.value !== "All"
    ) {
      filters.dept_id = selectedBranchDepartment.value;
    }
    let sortByParam = {};
    if (branchSortBy.value && branchSortBy.value.length > 0) {
      const firstSort = branchSortBy.value[0];
      sortByParam[firstSort.key] = firstSort.order === "desc" ? "DESC" : "ASC";
    } else {
      sortByParam = { branch: "ASC" };
    }
    const response = await $apiFetch("/mst-companies/search", {
      params: {
        filters,
        page: branchPage.value,
        limit: branchItemsPerPage.value,
        sortBy: sortByParam,
      },
    });
    const departmentsRes = await Promise.all(
      response.items.map((branch) =>
        $apiFetch(`/mst-companies/departments/${branch.id}`).catch(() => ({
          items: [],
        }))
      )
    );
    branches.value = response.items.map((branch, index) => ({
      ...branch,
      departments: departmentsRes[index]?.items || [],
      display_name: branch.branch || "Headquarters",
    }));
    branchTotalItems.value = response.meta?.total || 0;
    const departmentMap = new Map();
    departmentMap.set("All", { label: "All", value: "All" });
    branches.value.forEach((branch) => {
      if (branch.departments) {
        branch.departments.forEach((dept) => {
          if (dept.id && dept.dept_name) {
            departmentMap.set(dept.id, {
              label: dept.dept_name,
              value: dept.id,
            });
          }
        });
      }
    });
    branchDepartments.value = Array.from(departmentMap.values());
  } finally {
    loadingBranches.value = false;
  }
};

// Members
const members = ref([]);
const loadingMembers = ref(false);
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

const memberStats = ref({
  totalMembers: 0,
  totalBranches: 0,
  totalDepartments: 0,
});

const fetchMemberStats = async (companyHqId) => {
  if (!companyHqId) return;
  try {
    const response = await $apiFetch("/mst-companies/metrics", {
      params: { company_hq_id: companyHqId },
    });
    memberStats.value = {
      totalMembers: response.total_users || 0,
      totalBranches: response.total_branches || 0,
      totalDepartments: response.total_departments || 0,
    };
  } catch (e) {
    memberStats.value = {
      totalMembers: 0,
      totalBranches: 0,
      totalDepartments: 0,
    };
  }
};

const filteredMembersMembers = computed(() => {
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

const handleMemberSearch = () => {
  memberPage.value = 1;
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
  const hqId = route.query.id;
  if (!hqId) return;
  loadingMembers.value = true;
  try {
    const params = {
      company_hq_id: hqId,
      page: memberPage.value,
      limit: memberItemsPerPage.value,
    };
    if (memberSearchKeyword.value) {
      if (memberSearchBy.value === "name")
        params.full_name = memberSearchKeyword.value;
      else if (memberSearchBy.value === "email")
        params.email = memberSearchKeyword.value;
    }
    if (selectedMemberRole.value)
      params.company_role = selectedMemberRole.value;
    if (selectedMemberBranch.value) {
      const selectedBranch = branches.value.find(
        (b) =>
          b.display_name === selectedMemberBranch.value ||
          b.branch === selectedMemberBranch.value
      );
      if (selectedBranch) params.company_id = selectedBranch.id;
    }
    if (memberSortBy.value && memberSortBy.value.length > 0) {
      const firstSort = memberSortBy.value[0];
      params.sortBy = firstSort.key;
      params.sortOrder = firstSort.order === "desc" ? "DESC" : "ASC";
    }
    const response = await $apiFetch("/mst-companies/members", { params });
    members.value = response.items || [];
    memberTotalItems.value = response.meta?.total || 0;
    memberTotalPages.value = response.meta?.totalPages || 0;
    if (branches.value.length > 0) {
      const branchSet = new Set();
      branches.value.forEach((branch) => {
        const branchName = branch.display_name || branch.branch;
        if (branchName) branchSet.add(branchName);
      });
      memberBranchOptions.value = [
        { label: "All", value: null },
        ...Array.from(branchSet).map((branch) => ({
          label: branch,
          value: branch,
        })),
      ];
    }
  } catch (e) {
    members.value = [];
    memberTotalItems.value = 0;
    memberTotalPages.value = 0;
  } finally {
    loadingMembers.value = false;
  }
};

watch(
  [branchPage, branchItemsPerPage, branchSortBy],
  () => {
    if (route.query.id) fetchBranches(route.query.id);
  },
  { deep: true }
);

watch(
  [memberPage, memberItemsPerPage, memberSortBy],
  () => {
    fetchMembers();
  },
  { deep: true }
);
</script>
