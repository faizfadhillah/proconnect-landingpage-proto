<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12" class="pt-0">
        <v-breadcrumbs
          class="px-0 text-caption"
          :items="[
            {
              title: 'Dashboard',
              disabled: false,
              to: '/admin/dashboard',
            },
            {
              title: 'Master Data',
              disabled: false,
              to: '/admin/masters',
            },
            {
              title: 'Users',
              disabled: false,
              to: '/admin/masters/users',
            },
            {
              title: `Batch ${batchId.substring(0, 8)}...`,
              disabled: true,
            },
          ]"
          divider="/"
        ></v-breadcrumbs>

        <!-- Page Header -->
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold text-grey-darken-3 mb-2">
              Batch Details
            </h1>
            <p class="text-body-1 text-grey-darken-1 mb-0">
              View and manage batch upload details
            </p>
          </div>
          <div class="d-flex align-center gap-3">
            <v-btn
              color="primary"
              prepend-icon="mdi-arrow-left"
              variant="outlined"
              rounded="lg"
              @click="$router.back()"
            >
              Back to Users
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Batch Summary Card -->
    <v-card elevation="0" rounded="lg" class="mb-6" v-if="batch">
      <v-card-title class="pa-6 pb-4">
        <div class="d-flex align-center gap-3">
          <v-avatar color="primary" size="48">
            <v-icon color="white">mdi-upload-multiple</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold">Batch Information</h3>
            <p class="text-body-2 text-grey mb-0">
              Upload details and progress
            </p>
          </div>
        </div>
      </v-card-title>
      <v-card-text class="pa-6 pt-0">
        <v-row>
          <v-col cols="6" md="3">
            <v-card variant="outlined" rounded="lg" class="pa-4">
              <div class="text-center">
                <v-icon color="primary" size="32" class="mb-2"
                  >mdi-file-document-multiple</v-icon
                >
                <h4 class="text-h6 font-weight-bold">{{ batch.total_rows }}</h4>
                <p class="text-body-2 text-grey mb-0">Total Rows</p>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card variant="outlined" rounded="lg" class="pa-4">
              <div class="text-center">
                <v-icon color="success" size="32" class="mb-2"
                  >mdi-check-circle</v-icon
                >
                <h4 class="text-h6 font-weight-bold text-success">
                  {{ batch.valid_rows }}
                </h4>
                <p class="text-body-2 text-grey mb-0">Valid Rows</p>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card variant="outlined" rounded="lg" class="pa-4">
              <div class="text-center">
                <v-icon color="error" size="32" class="mb-2"
                  >mdi-alert-circle</v-icon
                >
                <h4 class="text-h6 font-weight-bold text-error">
                  {{ batch.invalid_rows }}
                </h4>
                <p class="text-body-2 text-grey mb-0">Invalid Rows</p>
              </div>
            </v-card>
          </v-col>
          <v-col cols="6" md="3">
            <v-card variant="outlined" rounded="lg" class="pa-4">
              <div class="text-center">
                <v-icon color="info" size="32" class="mb-2"
                  >mdi-progress-clock</v-icon
                >
                <h4 class="text-h6 font-weight-bold">
                  {{ batch.progress_percentage }}%
                </h4>
                <p class="text-body-2 text-grey mb-0">Progress</p>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Progress Bar -->
        <v-row class="mt-4">
          <v-col cols="12">
            <div class="d-flex align-center gap-3">
              <span class="font-weight-medium">Overall Progress:</span>
              <v-progress-linear
                :model-value="batch.progress_percentage"
                color="primary"
                height="12"
                rounded
                class="flex-grow-1"
              ></v-progress-linear>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Filters Section -->
    <v-card rounded="lg" elevation="0" class="mb-6">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="filters.email"
              label="Search by email"
              prepend-inner-icon="mdi-magnify"
              clearable
              hide-details
              variant="outlined"
              density="comfortable"
              placeholder="Enter email..."
              rounded="lg"
              @input="debouncedLoadRows"
            ></v-text-field>
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="filters.phone"
              label="Search by phone"
              prepend-inner-icon="mdi-phone"
              clearable
              hide-details
              variant="outlined"
              density="comfortable"
              placeholder="Enter phone..."
              rounded="lg"
              @input="debouncedLoadRows"
            ></v-text-field>
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.gender"
              :items="genderOptions"
              label="Gender"
              clearable
              hide-details
              variant="outlined"
              density="comfortable"
              rounded="lg"
              @update:model-value="loadRows"
            ></v-select>
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              clearable
              hide-details
              variant="outlined"
              density="comfortable"
              rounded="lg"
              @update:model-value="loadRows"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2" class="d-flex align-center justify-end">
            <v-btn
              v-if="hasFailedRows"
              color="error"
              prepend-icon="mdi-delete"
              variant="outlined"
              rounded="lg"
              @click="deleteAllFailedRows"
              :loading="deleteLoading"
            >
              Delete Failed
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Rows Table -->
    <v-data-table-server
      class="elevation-0 border rounded-lg"
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :headers="headers"
      :items="rows"
      :items-length="totalRows"
      :loading="loading"
      :sort-by="sortBy"
      multi-sort
      @update:options="debouncedLoadRows"
    >
      <!-- Custom column rendering -->
      <template v-slot:item.index="{ index }">
        <v-chip color="primary" size="small" variant="outlined">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </v-chip>
      </template>

      <template v-slot:item.email="{ item }">
        <span class="font-weight-medium">{{
          item.additional_data?.email || "-"
        }}</span>
      </template>

      <template v-slot:item.name="{ item }">
        <span class="font-weight-medium">{{
          item.additional_data?.name || "-"
        }}</span>
      </template>

      <template v-slot:item.email_sent_status="{ item }">
        <span class="font-weight-medium">{{
          capitalizeWords(item.email_sent_status) || "-"
        }}</span>
      </template>

      <template v-slot:item.phone="{ item }">
        <span>{{ item.additional_data?.phone || "-" }}</span>
      </template>

      <template v-slot:item.gender="{ item }">
        <v-chip
          :color="getGenderColor(item.additional_data?.gender)"
          size="small"
          label
          variant="flat"
        >
          {{ item.additional_data?.gender || "-" }}
        </v-chip>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getRowStatusColor(item.row_status)"
          size="small"
          label
          variant="flat"
        >
          {{ item.row_status }}
        </v-chip>
      </template>

      <template v-slot:item.error_messages="{ item }">
        <div v-if="item.error_messages && item.error_messages.length > 0">
          <v-tooltip location="top">
            <template v-slot:activator="{ props }">
              <v-chip
                color="error"
                size="small"
                label
                variant="flat"
                v-bind="props"
              >
                {{ item.error_messages.length }} error(s)
              </v-chip>
            </template>
            <div>
              <div
                v-for="(error, index) in item.error_messages"
                :key="index"
                class="mb-1"
              >
                {{ error }}
              </div>
            </div>
          </v-tooltip>
        </div>
        <span v-else class="text-grey">-</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="d-flex align-center gap-2">
          <v-btn
            v-if="item.row_status === 'FAILED' || item.row_status === 'INVALID'"
            icon="mdi-delete"
            variant="text"
            size="small"
            density="compact"
            color="error"
            @click="deleteRow(item.id)"
          ></v-btn>
        </div>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

import { debounce } from "~/utils/debounce";

// Get batch ID from route
const route = useRoute();
const batchId = route.params.batchId;

// API
const { $apiFetch } = useApi();

// State
const batch = ref(null);
const rows = ref([]);
const totalRows = ref(0);
const loading = ref(false);
const deleteLoading = ref(false);

// Pagination
const page = ref(1);
const itemsPerPage = ref(20);
const sortBy = useState("batchRowsSortBy", () => []);

// Filters
const filters = ref({
  email: "",
  phone: "",
  gender: "",
  status: "",
});

// Options
const genderOptions = ref([
  { title: "Male", value: "male" },
  { title: "Female", value: "female" },
  { title: "Non-binary", value: "non-binary" },
]);

const statusOptions = ref([
  { title: "Pending", value: "PENDING" },
  { title: "In Process", value: "IN_PROCESS" },
  { title: "Valid", value: "VALID" },
  { title: "Invalid", value: "INVALID" },
  { title: "Failed", value: "FAILED" },
  { title: "Deleted", value: "DELETED" },
]);

// Headers
const headers = ref([
  { title: "No", key: "index", sortable: false },
  { title: "Email", key: "email", sortable: true },
  { title: "Name", key: "name", sortable: true },
  { title: "Phone", key: "phone", sortable: true },
  { title: "Gender", key: "gender", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Email Status", key: "email_sent_status", sortable: true },
  { title: "Errors", key: "error_messages", sortable: false },
  { title: "Created At", key: "created_at", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
]);

// Computed
const hasFailedRows = computed(() => {
  return batch.value && batch.value.invalid_rows > 0;
});

// Methods
const loadBatch = async () => {
  try {
    const data = await $apiFetch(
      `/bulk-upload/users/candidate/batches/${batchId}`
    );
    batch.value = data;
  } catch (error) {
    console.error("Error loading batch:", error);
  }
};

const loadRows = async (options = {}) => {
  if (loading.value) return;

  loading.value = true;
  try {
    const params = {
      page: options.page || page.value,
      limit: options.itemsPerPage || itemsPerPage.value,
      sortBy: options.sortBy || sortBy.value,
    };

    // Add filters
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });

    const data = await $apiFetch(
      `/bulk-upload/users/candidate/batches/${batchId}/rows`,
      { params }
    );
    rows.value = data.items;
    totalRows.value = data.meta.total;
  } catch (error) {
    console.error("Error loading rows:", error);
  } finally {
    loading.value = false;
  }
};

// Debounced functions
const debouncedLoadRows = debounce(loadRows, 500);

const deleteRow = async (rowId) => {
  try {
    await $apiFetch("/bulk-upload/users/candidate/delete-failed", {
      method: "DELETE",
      body: { rowId },
    });

    // Refresh data
    loadRows();
    loadBatch();
  } catch (error) {
    console.error("Error deleting row:", error);
  }
};

const deleteAllFailedRows = async () => {
  deleteLoading.value = true;
  try {
    await $apiFetch("/bulk-upload/users/candidate/delete-failed", {
      method: "DELETE",
      body: { batchId },
    });

    // Refresh data
    loadRows();
    loadBatch();
  } catch (error) {
    console.error("Error deleting failed rows:", error);
  } finally {
    deleteLoading.value = false;
  }
};

const getBatchStatusColor = (status) => {
  if (!status) return "grey";

  const colors = {
    processing: "orange",
    completed: "green",
    failed: "red",
    pending: "blue",
  };
  return colors[status.toLowerCase()] || "grey";
};

const getGenderColor = (gender) => {
  if (!gender) return "grey";

  const colors = {
    male: "blue",
    female: "pink",
    "non-binary": "grey",
  };
  return colors[gender.toLowerCase()] || "grey";
};

const getRowStatusColor = (status) => {
  if (!status) return "grey";

  const colors = {
    pending: "blue",
    in_process: "orange",
    valid: "green",
    invalid: "red",
    failed: "red",
    deleted: "grey",
  };
  return colors[status.toLowerCase()] || "grey";
};

// Lifecycle
onMounted(() => {
  loadBatch();
  loadRows();
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>
