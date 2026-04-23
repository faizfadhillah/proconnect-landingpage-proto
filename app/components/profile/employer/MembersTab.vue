<template>
  <div>
    <!-- Statistics Cards -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6" md="3">
        <v-card
          elevation="0"
          rounded="lg"
          class="pa-4"
          style="background: white; border: 1px solid #e0e0e0"
        >
          <div class="text-caption text-grey mb-1">Total Member</div>
          <div class="font-weight-bold">
            <h2>{{ memberStats.totalMembers }}</h2>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          elevation="0"
          rounded="lg"
          class="pa-4"
          style="background: white; border: 1px solid #e0e0e0"
        >
          <div class="text-caption text-grey-darken-3 mb-1">Total Branch</div>
          <div class="font-weight-bold">
            <h2>{{ memberStats.totalBranches }}</h2>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          elevation="0"
          rounded="lg"
          class="pa-4"
          style="background: white; border: 1px solid #e0e0e0"
        >
          <div class="text-caption text-grey-darken-3 mb-1">
            Total Departments
          </div>
          <div class="font-weight-bold">
            <h2>{{ memberStats.totalDepartments }}</h2>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          elevation="0"
          rounded="lg"
          class="pa-4"
          style="background: white; border: 1px solid #e0e0e0"
        >
          <div class="text-caption text-grey-darken-3 mb-1">
            Showing Members
          </div>
          <div class="font-weight-bold">
            <h2>{{ filteredMembers.length }}</h2>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Members Card -->
    <v-card elevation="0" rounded="lg" style="background: white">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <h4 class="font-weight-bold">Members</h4>
        <template v-if="!isViewOnly">
          <v-btn
            color="primary"
            variant="outlined"
            rounded="lg"
            height="48"
            v-if="canEditTeamMgmt"
            :to="{
              path: '/admin/profile/employer/4',
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
              v-model="localMemberSearchKeyword"
              placeholder="Type your keywords here"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
            >
              <template v-slot:prepend>
                <v-select
                  v-model="localMemberSearchBy"
                  :items="memberSearchOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Name"
                  hide-details
                  variant="outlined"
                  min-width="120"
                  rounded="lg"
                  density="comfortable"
                >
                </v-select>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-row>
              <v-col cols="6" md="6">
                <div class="text-grey mb-1">Branch</div>
                <v-select
                  v-model="localSelectedMemberBranch"
                  :items="memberBranchOptions"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  placeholder="All"
                  hide-details
                  clearable
                />
              </v-col>
              <v-col cols="6" md="6">
                <div class="text-grey mb-1">Role</div>
                <v-select
                  v-model="localSelectedMemberRole"
                  :items="memberRoleOptions"
                  item-title="label"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  placeholder="All"
                  hide-details
                  clearable
                />
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="6" md="2">
            <v-btn
              color="primary"
              variant="outlined"
              block
              rounded="lg"
              size="large"
              class="mt-6"
              @click="handleSearch"
            >
              Search
            </v-btn>
          </v-col>
          <v-col cols="6" md="2">
            <v-btn
              color="grey"
              variant="text"
              @click="handleReset"
              size="large"
              rounded="lg"
              block
              class="mt-6"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>

        <!-- Members Table -->
        <v-data-table-server
          class="blue-lighten-5 rounded-lg border"
          v-model:items-per-page="localMemberItemsPerPage"
          v-model:page="localMemberPage"
          v-model:sort-by="localMemberSortBy"
          :headers="memberTableHeaders"
          :items="filteredMembers"
          :items-length="memberTotalItems"
          :loading="loadingMembers"
          multi-sort
        >
          <template v-slot:item.no="{ index }">
            {{ (localMemberPage - 1) * localMemberItemsPerPage + index + 1 }}
          </template>
          <template v-slot:item.full_name="{ item }">
            <div class="d-flex align-center py-2">
              <v-avatar size="32" class="mr-3" color="primary">
                <v-img
                  v-if="item.photo_url"
                  :src="
                    item.photo_url.includes('http')
                      ? item.photo_url
                      : BASE_URL + item.photo_url
                  "
                  :alt="item.full_name"
                ></v-img>
                <span v-else class="text-white text-caption">
                  {{ getInitials(item.full_name || "-") }}
                </span>
              </v-avatar>
              <div>
                <div class="font-weight-medium">
                  {{ item.full_name || "-" }}
                </div>
                <div class="text-caption text-grey">
                  {{ item.email || item.encrypted_phone || "-" }}
                </div>
              </div>
            </div>
          </template>
          <template v-slot:item.company_role="{ item }">
            {{
              item.company_role
                ? capitalizeWords(item.company_role || "-")
                : "-"
            }}
          </template>
          <template v-slot:item.branch="{ item }">
            {{ item.branch || "Headquarters" || "-" }}
          </template>
          <template v-slot:item.department="{ item }">
            {{ item.department || "-" }}
          </template>
          <template v-slot:item.profession_name="{ item }">
            {{ capitalizeWords(item.profession_name || "-") }}
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

// Permissions
const { hasPermission } = usePermissions();
const canEditTeamMgmt = computed(() => hasPermission("perm:team_mgmt:edit"));

const props = defineProps({
  memberStats: {
    type: Object,
    required: true,
  },
  filteredMembers: {
    type: Array,
    default: () => [],
  },
  memberSearchKeyword: {
    type: String,
    default: "",
  },
  memberSearchBy: {
    type: String,
    default: "name",
  },
  selectedMemberBranch: {
    type: [String, null],
    default: null,
  },
  selectedMemberRole: {
    type: [String, null],
    default: null,
  },
  memberPage: {
    type: Number,
    default: 1,
  },
  memberItemsPerPage: {
    type: Number,
    default: 20,
  },
  memberSortBy: {
    type: Array,
    default: () => [],
  },
  memberSearchOptions: {
    type: Array,
    default: () => [],
  },
  memberBranchOptions: {
    type: Array,
    default: () => [],
  },
  memberRoleOptions: {
    type: Array,
    default: () => [],
  },
  memberTableHeaders: {
    type: Array,
    default: () => [],
  },
  memberTotalItems: {
    type: Number,
    default: 0,
  },
  loadingMembers: {
    type: Boolean,
    default: false,
  },
  isViewOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:memberSearchKeyword",
  "update:memberSearchBy",
  "update:selectedMemberBranch",
  "update:selectedMemberRole",
  "update:memberPage",
  "update:memberItemsPerPage",
  "update:memberSortBy",
  "memberSearch",
  "memberReset",
]);

// Local reactive copies with v-model support
const localMemberSearchKeyword = computed({
  get: () => props.memberSearchKeyword,
  set: (value) => emit("update:memberSearchKeyword", value),
});

const localMemberSearchBy = computed({
  get: () => props.memberSearchBy,
  set: (value) => emit("update:memberSearchBy", value),
});

const localSelectedMemberBranch = computed({
  get: () => props.selectedMemberBranch,
  set: (value) => emit("update:selectedMemberBranch", value),
});

const localSelectedMemberRole = computed({
  get: () => props.selectedMemberRole,
  set: (value) => emit("update:selectedMemberRole", value),
});

const localMemberPage = computed({
  get: () => props.memberPage,
  set: (value) => emit("update:memberPage", value),
});

const localMemberItemsPerPage = computed({
  get: () => props.memberItemsPerPage,
  set: (value) => emit("update:memberItemsPerPage", value),
});

const localMemberSortBy = computed({
  get: () => props.memberSortBy,
  set: (value) => emit("update:memberSortBy", value),
});

const handleSearch = () => {
  emit("memberSearch");
};

const handleReset = () => {
  emit("memberReset");
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
</script>
