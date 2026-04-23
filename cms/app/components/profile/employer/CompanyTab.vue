<template>
  <div>
    <!-- Company Info Card -->
    <v-card elevation="0" rounded="lg" class="mb-4" style="background: white">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <h4 class="font-weight-bold">Company Info</h4>
        <template v-if="!isViewOnly">
          <v-btn
            color="primary"
            variant="outlined"
            rounded="lg"
            height="48"
            v-if="canEditBusinessProfile"
            :to="{
              path: '/admin/profile/employer/1',
              query: { edit: 1 },
            }"
          >
            Edit
          </v-btn>
        </template>
      </v-card-title>
      <v-card-text class="pa-4">
        <table style="width: 100%">
          <tbody>
            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Company Logo</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <v-avatar rounded="lg" size="54" class="bg-grey-lighten-3">
                  <v-img
                    v-if="form.logo_url"
                    :src="
                      form.logo_url.includes('http')
                        ? form.logo_url
                        : BASE_URL + form.logo_url
                    "
                  />
                </v-avatar>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Brand Name</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.brand_name || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Company Name</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.company_name || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Branch</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.branch || "Headquarters" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Phone</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.phone || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Email</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.email || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Website</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.website || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Industry</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.industry || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Organization Size</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.organization_size || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Organization Type</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.organization_type || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Tagline</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.tagline || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Location</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ form.location || "-" }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Verification Status</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{
                  form.is_verified ? "Verified" : "Unverified" || "-"
                }}</span>
              </td>
            </tr>

            <tr>
              <td valign="top" class="py-2 pr-4" style="width: 30%">
                <span class="font-weight-medium">Company Status</span>
              </td>
              <td valign="top" class="pa-1">:</td>
              <td valign="top" class="py-2 pl-2">
                <span>{{ capitalizeWords(form.status) || "-" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </v-card-text>
    </v-card>

    <!-- Branch Info Card -->
    <v-card elevation="0" rounded="lg" style="background: white">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <h4 class="font-weight-bold">Branch Info</h4>
        <template v-if="!isViewOnly">
          <v-btn
            color="primary"
            variant="outlined"
            rounded="lg"
            height="48"
            v-if="canEditHqBranchInfo"
            :to="{
              path: '/admin/profile/employer/3',
              query: { edit: 1 },
            }"
          >
            Edit
          </v-btn>
        </template>
      </v-card-title>
      <v-card-text class="pa-4">
        <!-- Search and Filter Section -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <div class="text-grey mb-1">Search by</div>
            <v-text-field
              v-model="localBranchSearchKeyword"
              placeholder="Type your keywords here"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
            >
              <template v-slot:prepend>
                <v-select
                  v-model="localBranchSearchBy"
                  :items="branchSearchOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Branch"
                  hide-details
                  variant="outlined"
                  min-width="150"
                  rounded="lg"
                  density="comfortable"
                >
                </v-select>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <div class="text-grey mb-1">Department</div>
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="localSelectedBranchDepartment"
                  :items="branchDepartments"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  placeholder="All"
                  hide-details
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  rounded="lg"
                  size="large"
                  @click="handleSearch"
                >
                  Search
                </v-btn>
              </v-col>
              <v-col cols="6" md="3">
                <v-btn
                  color="grey"
                  variant="text"
                  @click="handleReset"
                  size="large"
                  rounded="lg"
                  block
                >
                  Reset
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Branch Information Table -->
        <v-data-table-server
          class="blue-lighten-5 rounded-lg border"
          v-model:items-per-page="localBranchItemsPerPage"
          v-model:page="localBranchPage"
          v-model:sort-by="localBranchSortBy"
          :headers="branchTableHeaders"
          :items="localFilteredBranches"
          :items-length="localBranchTotalItems"
          :loading="loadingBranches"
          multi-sort
        >
          <template v-slot:item.no="{ index }">
            {{ (localBranchPage - 1) * localBranchItemsPerPage + index + 1 }}
          </template>
          <template v-slot:item.branch="{ item }">
            {{ item.display_name || item.branch || "-" }}
          </template>

          <template v-slot:item.departments="{ item }">
            <template v-if="item.departments && item.departments.length > 0">
              <div>
                <template
                  v-for="(department, index) in getVisibleDepartments(item)"
                  :key="department.id"
                >
                  {{ department.dept_name
                  }}<span v-if="index < getVisibleDepartments(item).length - 1"
                    >,
                  </span>
                </template>
                <span
                  v-if="shouldShowLoadMore(item)"
                  class="text-primary ml-1"
                  style="cursor: pointer; text-decoration: underline"
                  @click="toggleDepartmentExpansion(item.id)"
                >
                  <span
                    v-if="
                      !isDepartmentExpanded(item.id) &&
                      getVisibleDepartments(item).length > 0
                    "
                    >,
                  </span>
                  {{
                    isDepartmentExpanded(item.id)
                      ? " (Show less)"
                      : `+${
                          item.departments.length - maxVisibleDepartments
                        } more`
                  }}
                </span>
              </div>
            </template>
            <template v-else>-</template>
          </template>

          <template v-slot:item.location="{ item }">
            {{ item.location || "-" }}
          </template>

          <template v-slot:item.email="{ item }">
            {{ item.email || "-" }}
          </template>

          <template v-slot:item.phone="{ item }">
            {{ item.phone || "-" }}
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { capitalizeWords } from "~/utils/format";

const BASE_URL = useRuntimeConfig().public.apiBase + "/";

// Permissions
const me = useState("me");
const { canAccessProfileSection } = usePermissions();
const canEditBusinessProfile = computed(() =>
  canAccessProfileSection("business_profile", "edit")
);
const canEditHqBranchInfo = computed(() =>
  canAccessProfileSection("hq_branch_info", "edit")
);

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  branches: {
    type: Array,
    default: () => [],
  },
  branchSearchKeyword: {
    type: String,
    default: "",
  },
  branchSearchBy: {
    type: String,
    default: "branch",
  },
  selectedBranchDepartment: {
    type: String,
    default: "All",
  },
  branchPage: {
    type: Number,
    default: 1,
  },
  branchItemsPerPage: {
    type: Number,
    default: 10,
  },
  branchSortBy: {
    type: Array,
    default: () => [],
  },
  branchSearchOptions: {
    type: Array,
    default: () => [],
  },
  branchDepartments: {
    type: Array,
    default: () => [],
  },
  branchTableHeaders: {
    type: Array,
    default: () => [],
  },
  filteredBranches: {
    type: Array,
    default: () => [],
  },
  branchTotalItems: {
    type: Number,
    default: 0,
  },
  loadingBranches: {
    type: Boolean,
    default: false,
  },
  isViewOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:branchSearchKeyword",
  "update:branchSearchBy",
  "update:selectedBranchDepartment",
  "update:branchPage",
  "update:branchItemsPerPage",
  "update:branchSortBy",
  "branchSearch",
  "branchReset",
]);

// Local reactive copies with v-model support
const localBranchSearchKeyword = computed({
  get: () => props.branchSearchKeyword,
  set: (value) => emit("update:branchSearchKeyword", value),
});

const localBranchSearchBy = computed({
  get: () => props.branchSearchBy,
  set: (value) => emit("update:branchSearchBy", value),
});

const localSelectedBranchDepartment = computed({
  get: () => props.selectedBranchDepartment,
  set: (value) => emit("update:selectedBranchDepartment", value),
});

const localBranchPage = computed({
  get: () => props.branchPage,
  set: (value) => emit("update:branchPage", value),
});

const localBranchItemsPerPage = computed({
  get: () => props.branchItemsPerPage,
  set: (value) => emit("update:branchItemsPerPage", value),
});

const localBranchSortBy = computed({
  get: () => props.branchSortBy,
  set: (value) => emit("update:branchSortBy", value),
});

const localFilteredBranches = computed(() => props.filteredBranches);
const localBranchTotalItems = computed(() => props.branchTotalItems);

const handleSearch = () => {
  emit("branchSearch");
};

const handleReset = () => {
  emit("branchReset");
};

// Department expansion state
const expandedDepartments = ref(new Set());
const maxVisibleDepartments = ref(3);

// Department expansion functions
const getVisibleDepartments = (item) => {
  if (!item.departments || item.departments.length === 0) return [];

  if (
    isDepartmentExpanded(item.id) ||
    item.departments.length <= maxVisibleDepartments.value
  ) {
    return item.departments;
  }

  return item.departments.slice(0, maxVisibleDepartments.value);
};

const shouldShowLoadMore = (item) => {
  return (
    item.departments && item.departments.length > maxVisibleDepartments.value
  );
};

const isDepartmentExpanded = (branchId) => {
  return expandedDepartments.value.has(branchId);
};

const toggleDepartmentExpansion = (branchId) => {
  if (expandedDepartments.value.has(branchId)) {
    expandedDepartments.value.delete(branchId);
  } else {
    expandedDepartments.value.add(branchId);
  }
};
</script>
