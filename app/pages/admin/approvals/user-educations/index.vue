<template>
  <v-container fluid>
    <v-row>
      <v-breadcrumbs
        class="mb-3"
        :items="[
          {
            title: 'dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'approval',
            disabled: false,
            to: '/admin/approvals',
          },
          {
            title: 'user-educations',
            disabled: true,
            to: '/admin/approvals/user-educations',
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>

    <v-card elevation="0" rounded="lg">
      <v-card-title class="mb-3 font-weight-bold text-primary"
        >User Education Approval</v-card-title
      >
      <v-card-text class="pb-0">
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center gap-2">
              <v-text-field
                v-model="searchInput"
                placeholder="Search by user name, email, school, or student ID"
                append-inner-icon="mdi-magnify"
                clearable
                class="bg-white"
                variant="outlined"
                elevation="0"
                density="comfortable"
                rounded="lg"
                hide-details
                @keyup.enter.prevent="debouncedLoadItems"
                @keyup.prevent="debouncedLoadItems"
                @click:clear="debouncedLoadItems"
              ></v-text-field>
              <v-btn
                :color="showFilter ? 'primary' : 'default'"
                variant="outlined"
                prepend-icon="mdi-filter"
                @click="showFilter = !showFilter"
                rounded="lg"
                size="large"
                height="48"
              >
                Filters
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <!-- Advanced Filters -->
        <v-expand-transition>
          <v-row v-if="showFilter" dense class="mt-2">
            <v-col cols="12" sm="6" md="3">
              <v-autocomplete
                v-model="filters.school_id"
                label="School"
                placeholder="Search school"
                clearable
                variant="outlined"
                density="compact"
                @update:search="handleSchoolFilterSearch"
                :items="schoolFilterItems"
                :loading="schoolFilterLoading"
                item-title="name"
                item-value="id"
                hide-no-data
                hide-details
                rounded="lg"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-autocomplete
                v-model="filters.major"
                label="Major"
                placeholder="Search major"
                clearable
                variant="outlined"
                density="compact"
                @update:search="handleMajorFilterSearch"
                :items="majorFilterItems"
                :loading="majorFilterLoading"
                item-title="major_name"
                item-value="major_name"
                hide-no-data
                hide-details
                rounded="lg"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-text-field
                v-model="filters.student_id"
                label="Student ID"
                placeholder="Enter student ID"
                clearable
                hide-details
                variant="outlined"
                density="compact"
                rounded="lg"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="filters.approval_state"
                :items="approvalStateOptions"
                label="Approval State"
                item-title="label"
                item-value="value"
                clearable
                hide-details
                variant="outlined"
                density="compact"
                multiple
                rounded="lg"
              ></v-select>
            </v-col>
          </v-row>
        </v-expand-transition>
      </v-card-text>
      <v-card-text>
        <v-card flat border rounded="lg">
          <v-data-table-server
            class="blue-lighten-5"
            v-model:items-per-page="itemsPerPage"
            v-model:page="page"
            :headers="allHeaders"
            :items="items"
            :items-length="totalitems"
            :loading="loading || first"
            :search="filters.search"
            :sort-by="sortBy"
            multi-sort
            @update:options="debouncedLoadItems"
          >
            <!-- Custom column rendering -->
            <template v-slot:item.index="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>

            <template v-slot:item.user_id="{ item }">
              <div v-if="item.user" class="d-flex align-center">
                <v-avatar size="50" class="mr-3" color="primary">
                  <v-img
                    v-if="item.user.photo_url"
                    :src="`${
                      item.user.photo_url.includes('http') ? '' : BASE_URL
                    }${item.user.photo_url}`"
                    :alt="item.user.full_name"
                  ></v-img>
                  <span v-else class="text-white">
                    {{ getInitials(item.user.full_name || "-") }}
                  </span>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">
                    {{ item.user.full_name || "-" }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ item.user.email || "-" }}
                  </div>
                </div>
              </div>
              <div v-else>{{ item.user_id }}</div>
            </template>

            <template v-slot:item.school_major_student="{ item }">
              <div class="d-flex flex-column my-1">
                <div class="font-weight-medium">
                  <v-icon size="small" class="mr-1">mdi-school</v-icon>
                  {{ item.school ? item.school.name : item.school_id || "-" }}
                </div>
                <div class="text-caption text-grey">
                  <v-icon size="small" class="mr-1"
                    >mdi-book-open-variant</v-icon
                  >
                  {{ item.major || "-" }}
                </div>
                <div class="text-caption text-grey">
                  <v-icon size="small" class="mr-1">mdi-identifier</v-icon>
                  {{ item.student_id || "-" }}
                </div>
              </div>
            </template>

            <template v-slot:item.degree_diploma="{ item }">
              <div class="d-flex flex-column gap-1">
                <v-chip size="small" label color="primary">{{
                  item.education_degree || "-"
                }}</v-chip>
                <v-chip
                  v-if="item.diploma_level"
                  size="small"
                  label
                  color="info"
                  >{{ item.diploma_level }}</v-chip
                >
                <span v-else class="text-caption text-grey">-</span>
              </div>
            </template>

            <template v-slot:item.status_actions="{ item }">
              <div class="d-flex flex-column align-center gap-2">
                <v-chip
                  :color="getApprovalStateColor(item.approval_state)"
                  size="x-small"
                  label
                  rounded="xl"
                >
                  {{ item.approval_state }}
                </v-chip>
                <div class="d-flex gap-2">
                  <v-btn
                    color="success"
                    size="small"
                    variant="elevated"
                    prepend-icon="mdi-check-circle"
                    @click="confirmApprove(item)"
                    :loading="approvingId === item.id"
                    :disabled="
                      approvingId === item.id || rejectingId === item.id
                    "
                    rounded="lg"
                    class="text-none"
                  >
                    Approve
                  </v-btn>
                  <v-btn
                    color="error"
                    size="small"
                    variant="elevated"
                    prepend-icon="mdi-close-circle"
                    @click="confirmReject(item)"
                    :loading="rejectingId === item.id"
                    :disabled="
                      approvingId === item.id || rejectingId === item.id
                    "
                    rounded="lg"
                    class="text-none"
                  >
                    Reject
                  </v-btn>
                </div>
              </div>
            </template>

            <template v-slot:item.created_at="{ item }">
              {{ formatDateTimeShort(item.created_at) }}
            </template>

            <template v-slot:item.file_url="{ item }">
              <div class="d-flex align-center gap-2">
                <a
                  v-if="item.file_url"
                  :href="BASE_URL + item.file_url"
                  target="_blank"
                  class="d-flex align-center gap-2 text-decoration-none"
                >
                  <v-icon color="primary">mdi-file-document</v-icon>
                  View File
                </a>
                <span v-else class="text-grey">-</span>
              </div>
            </template>
          </v-data-table-server>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Approve Confirmation Dialog -->
    <v-dialog v-model="approveDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title>Confirm Approval</v-card-title>
        <v-card-text>
          Are you sure you want to approve this education?
          <div v-if="selectedItem" class="mt-3">
            <div><strong>User:</strong> {{ selectedItem.user?.full_name }}</div>
            <div><strong>School:</strong> {{ selectedItem.school?.name }}</div>
            <div><strong>Major:</strong> {{ selectedItem.major }}</div>
            <div>
              <strong>Degree:</strong> {{ selectedItem.education_degree }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="approveDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            variant="elevated"
            @click="handleApprove"
            :loading="approvingId === selectedItem?.id"
            >Approve</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Confirmation Dialog -->
    <v-dialog v-model="rejectDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title>Confirm Rejection</v-card-title>
        <v-card-text>
          Are you sure you want to reject this education?
          <div v-if="selectedItem" class="mt-3">
            <div><strong>User:</strong> {{ selectedItem.user?.full_name }}</div>
            <div><strong>School:</strong> {{ selectedItem.school?.name }}</div>
            <div><strong>Major:</strong> {{ selectedItem.major }}</div>
            <div>
              <strong>Degree:</strong> {{ selectedItem.education_degree }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="rejectDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="handleReject"
            :loading="rejectingId === selectedItem?.id"
            >Reject</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

import { ref, computed, onMounted, watch } from "vue";
import { debounce } from "~/utils/debounce";
import { useSnackbarStore } from "~/stores/snackbar";

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const items = ref([]);
const loading = ref(false);
const first = ref(true);
const totalitems = ref(0);
const page = ref(1);
const entity = ref("user-educations");
const sortBy = useState(`${entity.value}sortBy`, () => []);
const itemsPerPage = useState(`itemsPerPage`, () => 10);
const { $apiFetch } = useApi();
const snackbar = useSnackbarStore();

const searchInput = ref("");
const approveDialog = ref(false);
const rejectDialog = ref(false);
const selectedItem = ref(null);
const approvingId = ref(null);
const rejectingId = ref(null);
const showFilter = ref(false);

// Filter state
const schoolFilterItems = ref([]);
const schoolFilterLoading = ref(false);
const majorFilterItems = ref([]);
const majorFilterLoading = ref(false);

// Headers for the table
const allHeaders = ref([
  {
    title: "No",
    key: "index",
    sortable: false,
  },
  {
    title: "User",
    key: "user_id",
    sortable: true,
  },
  {
    title: "School / Major / Student ID",
    key: "school_major_student",
    width: 400,
    sortable: false,
  },
  {
    title: "Degree / Diploma Level",
    key: "degree_diploma",
    sortable: false,
  },
  {
    title: "File",
    key: "file_url",
    sortable: false,
  },
  {
    title: "Created At",
    key: "created_at",
    sortable: true,
  },
  {
    title: "Status / Actions",
    key: "status_actions",
    sortable: false,
    align: "center",
  },
]);

const filters = ref({
  school_id: null,
  major: null,
  student_id: null,
  approval_state: null,
});

// Approval state options for filter
const approvalStateOptions = [
  { label: "Approved", value: "APPROVED" },
  { label: "Reject", value: "REJECT" },
  { label: "Waiting Approval", value: "WAITING_APPROVAL" },
];

// Get approval state color
const getApprovalStateColor = (state) => {
  switch (state) {
    case "APPROVED":
      return "success";
    case "REJECT":
      return "error";
    case "WAITING_APPROVAL":
      return "warning";
    default:
      return "grey";
  }
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// Filter search handlers
const handleSchoolFilterSearch = async (search) => {
  if (!search || search.length < 2) {
    schoolFilterItems.value = [];
    return;
  }
  schoolFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-schools/search", {
      params: {
        filters: { name: search },
        limit: 20,
      },
    });
    schoolFilterItems.value = response.items || [];
  } catch (error) {
    console.error("Error searching schools:", error);
  } finally {
    schoolFilterLoading.value = false;
  }
};

const handleMajorFilterSearch = async (search) => {
  if (!search || search.length < 2) {
    majorFilterItems.value = [];
    return;
  }
  majorFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-majors/search", {
      params: {
        filters: { major_name: search },
        limit: 20,
      },
    });
    majorFilterItems.value = response.items || [];
  } catch (error) {
    console.error("Error searching majors:", error);
  } finally {
    majorFilterLoading.value = false;
  }
};

// Load items that need approval
const loadItems = async (options = {}) => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  try {
    // Update page and itemsPerPage from options (v-data-table-server passes these)
    // v-data-table-server passes: { page, itemsPerPage, sortBy }
    if (options.page !== undefined && options.page !== null) {
      page.value = options.page;
    }
    if (options.itemsPerPage !== undefined && options.itemsPerPage !== null) {
      itemsPerPage.value = options.itemsPerPage;
    }
    if (options.sortBy !== undefined) {
      sortBy.value = options.sortBy;
    }

    // If searching, load all data for frontend filtering
    // Otherwise, use pagination from backend
    if (searchInput.value) {
      // Load all items for search filtering
      const allData = await $apiFetch(`/user-educations/need-approval`, {
        params: {
          page: 1,
          limit: 20, // Load large number to get all items
        },
      });

      let allItems = allData.items || [];

      // Ensure user and school relations are loaded
      if (allItems.length > 0) {
        const needsUserRelation = allItems.some((item) => !item.user);
        const needsSchoolRelation = allItems.some((item) => !item.school);

        if (needsUserRelation || needsSchoolRelation) {
          console.log("Loading missing relations for search results...");
          allItems = await Promise.all(
            allItems.map(async (item) => {
              if (!item.user || !item.school) {
                try {
                  const fullItem = await $apiFetch(
                    `/user-educations/${item.id}`,
                    {
                      params: {
                        expands: "user,school",
                      },
                    }
                  );
                  return fullItem;
                } catch (error) {
                  console.error(
                    `Error loading relations for item ${item.id}:`,
                    error
                  );
                  return item;
                }
              }
              return item;
            })
          );
        }
      }
      const searchLower = searchInput.value.toLowerCase();

      // Filter items
      const filteredItems = allItems.filter((item) => {
        // Apply search filter
        if (searchInput.value) {
          const userName = item.user?.full_name?.toLowerCase() || "";
          const userEmail = item.user?.email?.toLowerCase() || "";
          const schoolName = item.school?.name?.toLowerCase() || "";
          const studentId = item.student_id?.toLowerCase() || "";
          const major = item.major?.toLowerCase() || "";

          const matchesSearch =
            userName.includes(searchLower) ||
            userEmail.includes(searchLower) ||
            schoolName.includes(searchLower) ||
            studentId.includes(searchLower) ||
            major.includes(searchLower);

          if (!matchesSearch) return false;
        }

        // Apply school filter
        if (
          filters.value.school_id &&
          item.school_id !== filters.value.school_id
        ) {
          return false;
        }

        // Apply major filter
        if (filters.value.major && item.major !== filters.value.major) {
          return false;
        }

        // Apply student_id filter
        if (
          filters.value.student_id &&
          !item.student_id
            ?.toLowerCase()
            .includes(filters.value.student_id.toLowerCase())
        ) {
          return false;
        }

        // Apply approval_state filter
        if (filters.value.approval_state) {
          const states = Array.isArray(filters.value.approval_state)
            ? filters.value.approval_state
            : [filters.value.approval_state];
          if (!states.includes(item.approval_state)) {
            return false;
          }
        }

        return true;
      });

      // Apply pagination to filtered results
      const startIndex = (page.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      items.value = filteredItems.slice(startIndex, endIndex);
      totalitems.value = filteredItems.length;
    } else {
      // Normal pagination from backend
      const params = {
        page: page.value,
        limit: itemsPerPage.value,
        expands: "user,school",
      };

      // Add filters to params
      if (filters.value.school_id) {
        params.filters = params.filters || {};
        params.filters.school_id = filters.value.school_id;
      }
      if (filters.value.major) {
        params.filters = params.filters || {};
        params.filters.major = filters.value.major;
      }
      if (filters.value.student_id) {
        params.filters = params.filters || {};
        params.filters.student_id = filters.value.student_id;
      }
      if (filters.value.approval_state) {
        params.filters = params.filters || {};
        if (Array.isArray(filters.value.approval_state)) {
          params.filters.approval_state = filters.value.approval_state;
        } else {
          params.filters.approval_state = [filters.value.approval_state];
        }
      }

      const data = await $apiFetch(`/user-educations/need-approval`, {
        params: params,
      });

      let itemsData = data.items || [];

      // Ensure user and school relations are loaded
      // If backend doesn't return relations, load them separately

      // Apply frontend filtering as fallback (in case backend doesn't support all filters)
      const hasFilters =
        filters.value.school_id ||
        filters.value.major ||
        filters.value.student_id ||
        filters.value.approval_state;

      if (hasFilters) {
        itemsData = itemsData.filter((item) => {
          // Apply school filter
          if (
            filters.value.school_id &&
            item.school_id !== filters.value.school_id
          ) {
            return false;
          }

          // Apply major filter
          if (filters.value.major && item.major !== filters.value.major) {
            return false;
          }

          // Apply student_id filter
          if (
            filters.value.student_id &&
            !item.student_id
              ?.toLowerCase()
              .includes(filters.value.student_id.toLowerCase())
          ) {
            return false;
          }

          // Apply approval_state filter
          if (filters.value.approval_state) {
            const states = Array.isArray(filters.value.approval_state)
              ? filters.value.approval_state
              : [filters.value.approval_state];
            if (!states.includes(item.approval_state)) {
              return false;
            }
          }

          return true;
        });
      }

      items.value = itemsData;

      // Set totalitems from backend meta for proper pagination
      // If we applied frontend filtering, we need to recalculate total
      if (hasFilters && data.meta && typeof data.meta.total === "number") {
        // For filtered results, we might need to load all and count
        // For now, use the filtered items length
        totalitems.value = itemsData.length;
      } else if (data.meta && typeof data.meta.total === "number") {
        totalitems.value = data.meta.total;
      } else {
        // Fallback if meta not available
        totalitems.value = itemsData.length || 0;
      }
    }
  } catch (error) {
    console.error("Error loading items:", error);
    alert("Failed to load user educations: " + error.message);
  } finally {
    loading.value = false;
    first.value = false;
  }
};

const debouncedLoadItems = debounce(loadItems, 200);

// Confirm approve
const confirmApprove = (item) => {
  selectedItem.value = item;
  approveDialog.value = true;
};

// Confirm reject
const confirmReject = (item) => {
  selectedItem.value = item;
  rejectDialog.value = true;
};

// Handle approve
const handleApprove = async () => {
  if (!selectedItem.value) return;

  approvingId.value = selectedItem.value.id;
  try {
    await $apiFetch(`/user-educations/${selectedItem.value.id}/approval`, {
      method: "PATCH",
      body: {
        approval_state: "APPROVED",
      },
    });

    approveDialog.value = false;
    selectedItem.value = null;

    // Refresh the list
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });

    // Show success message
    snackbar.showSnackbar({
      message: "Education approved successfully!",
      color: "success",
    });
  } catch (error) {
    console.error("Error approving education:", error);
    snackbar.showSnackbar({
      message:
        "Failed to approve education: " +
        (error.data?.message || error.message),
      color: "error",
    });
  } finally {
    approvingId.value = null;
  }
};

// Handle reject
const handleReject = async () => {
  if (!selectedItem.value) return;

  rejectingId.value = selectedItem.value.id;
  try {
    await $apiFetch(`/user-educations/${selectedItem.value.id}/approval`, {
      method: "PATCH",
      body: {
        approval_state: "REJECT",
      },
    });

    rejectDialog.value = false;
    selectedItem.value = null;

    // Refresh the list
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });

    // Show success message
    snackbar.showSnackbar({
      message: "Education rejected successfully!",
      color: "success",
    });
  } catch (error) {
    console.error("Error rejecting education:", error);
    snackbar.showSnackbar({
      message:
        "Failed to reject education: " + (error.data?.message || error.message),
      color: "error",
    });
  } finally {
    rejectingId.value = null;
  }
};

// Watch for search input changes
watch(searchInput, () => {
  page.value = 1;
  debouncedLoadItems({
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
});

// Watch for filter changes
watch(
  () => [
    filters.value.school_id,
    filters.value.major,
    filters.value.student_id,
    filters.value.approval_state,
  ],
  () => {
    page.value = 1;
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  },
  { deep: true }
);

onMounted(() => {
  loadItems({
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
});
</script>

<style scoped>
.text-grey {
  color: rgba(0, 0, 0, 0.6);
}
</style>
