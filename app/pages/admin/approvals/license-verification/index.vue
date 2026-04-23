<template>
  <v-container fluid>
    <!-- Header -->
    <v-row class="mb-0">
      <v-col cols="12" md="9">
        <h2 class="font-weight-bold mb-1">Student Licenses Verification</h2>
        <div class="text-grey-darken-1">
          Verify licenses and manage skill mappings for each student
        </div>
      </v-col>
      <v-col cols="12" md="3" class="d-flex justify-end align-end">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="goToCreate"
          rounded="lg"
        >
          Add Certificate
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-2">
      <v-col cols="6" md="3" v-for="card in summaryCards" :key="card.label">
        <v-card rounded="lg" elevation="0" class="pa-4">
          <div class="text-caption text-grey-darken-1 mb-1">
            {{ card.label }}
          </div>
          <h2 class="font-weight-bold">
            {{ card.value ?? "-" }}
          </h2>
        </v-card>
      </v-col>
    </v-row>

    <!-- Students Directory Card -->
    <v-card flat rounded="lg" style="border: 1px solid #e0e0e0">
      <v-card-title class="pa-4 pb-2">
        <h4 class="font-weight-bold">Students Directory</h4>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Search and Filter Section -->
      <v-card-text class="pt-4">
        <v-row class="align-end mb-2">
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="searchType"
              :items="searchTypeOptions"
              label="Search by"
              variant="outlined"
              density="compact"
              hide-details
              rounded="lg"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="searchKeyword"
              label="Type your keywords here..."
              variant="outlined"
              density="compact"
              hide-details
              rounded="lg"
              @keyup.enter="handleSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-autocomplete
              v-model="filters.license_id"
              :items="licenseOptions"
              label="License"
              variant="outlined"
              density="compact"
              hide-details
              rounded="lg"
              clearable
              @update:search="handleLicenseSearch"
              :loading="licenseLoading"
              item-title="license_name"
              item-value="id"
              hide-no-data
            ></v-autocomplete>
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="compact"
              hide-details
              rounded="lg"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" class="d-flex justify-end gap-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-magnify"
              @click="handleSearch"
              rounded="lg"
            >
              Search
            </v-btn>
            <v-btn
              prepend-icon="mdi-close-circle-outline"
              @click="handleReset"
              variant="outlined"
              rounded="lg"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Toolbar Actions -->
      <v-card-actions class="pa-4">
        <div class="d-flex flex-wrap gap-2 align-center" style="width: 100%">
          <v-btn
            color="success"
            prepend-icon="mdi-download"
            variant="outlined"
            size="small"
            @click="downloadTemplate"
            :loading="templateLoading"
            rounded="lg"
          >
            Template
          </v-btn>

          <v-btn
            color="info"
            prepend-icon="mdi-upload"
            variant="outlined"
            size="small"
            @click="importDialog.attributes.dialog = true"
            rounded="lg"
          >
            Upload
          </v-btn>

          <!-- Export feature temporarily disabled -->
          <!-- <v-btn
            color="secondary"
            prepend-icon="mdi-file-excel"
            variant="outlined"
            size="small"
            @click="handleExportData"
            rounded="lg"
          >
            Export
          </v-btn> -->

          <VImportXlsDialog
            @export-data="downloadTemplate"
            @import-data="handleImportData"
            ref="importDialog"
          />

          <v-spacer></v-spacer>
        </div>
      </v-card-actions>

      <v-divider></v-divider>

      <!-- Students Table -->
      <v-card-text class="pa-0">
        <v-data-table
          :headers="headers"
          :items="students"
          :items-per-page="params.limit"
          :page="params.page"
          :server-items-length="meta.total"
          :loading="loading"
          :item-value="
            (item) => item.user_id || item.licenses?.[0]?.mapping_id || item.id
          "
          show-expand
          class="elevation-0"
          @update:page="
            (page) => {
              params.page = page;
              fetchStudents();
            }
          "
          @update:items-per-page="
            (limit) => {
              params.limit = limit;
              params.page = 1;
              fetchStudents();
            }
          "
        >
          <!-- No Column -->
          <template #item.no="{ index }">
            <span class="text-caption">
              {{ (params.page - 1) * params.limit + index + 1 }}
            </span>
          </template>

          <!-- Student Name Column -->
          <template v-slot:item.full_name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="40" class="mr-3 bg-grey-lighten-3">
                <v-img
                  v-if="item.photo_url"
                  :src="
                    item.photo_url.includes('http')
                      ? item.photo_url
                      : BASE_URL + item.photo_url
                  "
                  cover
                />
                <v-icon v-else size="26">mdi-account</v-icon>
              </v-avatar>
              <div>
                <span class="font-weight-medium">{{
                  item.full_name || "-"
                }}</span>
                <v-chip
                  v-if="!item.user_id"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="ml-2"
                >
                  Unprocessed
                </v-chip>
              </div>
            </div>
          </template>

          <!-- Email Column -->
          <template v-slot:item.email="{ item }">
            <span>{{ item.email || "-" }}</span>
          </template>

          <!-- Phone Column -->
          <template v-slot:item.phone="{ item }">
            <span>{{ item.phone || "-" }}</span>
          </template>

          <!-- Total Licenses Column -->
          <template v-slot:item.total_licenses="{ item }">
            <v-btn variant="text" color="primary" size="small">
              {{ item.total_licenses }}
              {{ item.total_licenses === 1 ? "License" : "Licenses" }}
            </v-btn>
          </template>

          <!-- Action Column -->
          <template v-slot:item.actions="{ item }">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  size="small"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item v-if="item.user_id" @click="verifyStudent(item)">
                  <template v-slot:prepend>
                    <v-icon color="success">mdi-account-check</v-icon>
                  </template>
                  <v-list-item-title>Verify Student</v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="!item.user_id && item.licenses?.[0]?.mapping_id"
                  @click="editMapping(item.licenses[0], item)"
                >
                  <template v-slot:prepend>
                    <v-icon color="info">mdi-pencil</v-icon>
                  </template>
                  <v-list-item-title>Edit Mapping</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>

          <!-- Expand Row -->
          <template v-slot:expanded-row="{ item }">
            <tr>
              <td :colspan="headers.length" class="pa-4 bg-grey-lighten-5">
                <div class="d-flex align-center mb-3">
                  <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                  <span class="font-weight-bold"
                    >License Verification & Skills</span
                  >
                </div>
                <div
                  v-for="license in item.licenses"
                  :key="license.id"
                  class="mb-4"
                >
                  <v-card
                    class="pa-4"
                    style="background-color: white; border: 1px solid #e0e0e0"
                    rounded="lg"
                    elevation="0"
                  >
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div>
                        <h4 class="font-weight-bold mb-1">
                          {{ license.license_name }}
                        </h4>
                        <div class="text-caption text-grey-darken-1">
                          ID: {{ formatLicenseId(license) }}
                        </div>
                      </div>
                      <div class="d-flex flex-column align-end gap-2">
                        <v-chip
                          :color="getStatusColor(license)"
                          size="small"
                          variant="tonal"
                          class="text-capitalize"
                        >
                          {{ getStatusText(license) }}
                        </v-chip>
                        <!-- Actions positioned on the right -->
                        <div class="d-flex gap-2">
                          <v-btn
                            v-if="license.file_url"
                            prepend-icon="mdi-file-document"
                            @click="viewDocument(license.file_url)"
                            variant="outlined"
                            rounded="lg"
                            size="small"
                          >
                            View Document
                          </v-btn>
                          <v-btn
                            v-if="license.mapping_id || item.is_mapping"
                            prepend-icon="mdi-pencil"
                            @click="editMapping(license, item)"
                            variant="outlined"
                            rounded="lg"
                            size="small"
                            color="info"
                          >
                            Edit Mapping
                          </v-btn>
                          <v-btn
                            v-if="license.is_verified"
                            prepend-icon="mdi-close-circle"
                            @click="revokeVerification(license, item)"
                            :loading="verifyingLicenseId === license.id"
                            rounded="lg"
                            size="small"
                            variant="outlined"
                          >
                            Revoke Verification
                          </v-btn>
                          <v-btn
                            v-else
                            color="success"
                            prepend-icon="mdi-check-circle"
                            @click="verifyLicense(license, item)"
                            :loading="verifyingLicenseId === license.id"
                            rounded="lg"
                            size="small"
                          >
                            Verify License
                          </v-btn>
                        </div>
                      </div>
                    </div>

                    <!-- Mapped Skills -->
                    <div class="mb-3">
                      <div class="text-caption text-grey-darken-1 mb-1">
                        MAPPED SKILLS:
                      </div>
                      <div class="d-flex flex-wrap gap-1">
                        <v-chip
                          v-for="skill in license.skills"
                          :key="skill"
                          size="small"
                          variant="outlined"
                          class="mr-1 mb-1"
                        >
                          {{ skill }}
                        </v-chip>
                        <span
                          v-if="!license.skills || license.skills.length === 0"
                          class="text-grey text-caption"
                        >
                          No skills mapped
                        </span>
                      </div>
                    </div>
                  </v-card>
                </div>
                <div
                  v-if="!item.licenses || item.licenses.length === 0"
                  class="text-center text-grey py-4"
                >
                  No licenses found
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Upload Result Dialog -->
    <v-dialog v-model="uploadResultDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon
            class="mr-2"
            :color="uploadResult.error_count > 0 ? 'warning' : 'success'"
          >
            {{
              uploadResult.error_count > 0 ? "mdi-alert" : "mdi-check-circle"
            }}
          </v-icon>
          Upload Result
        </v-card-title>
        <v-card-text>
          <v-alert
            :type="uploadResult.error_count > 0 ? 'warning' : 'success'"
            variant="tonal"
            class="mb-4"
          >
            {{ uploadResult.message }}
          </v-alert>
          <div v-if="uploadResult.errors && uploadResult.errors.length > 0">
            <h4 class="mb-2">Errors:</h4>
            <v-list density="compact">
              <v-list-item
                v-for="(error, index) in uploadResult.errors"
                :key="index"
              >
                <v-list-item-title class="text-caption">{{
                  error
                }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="uploadResultDialog = false"
            >Close</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

import { useSnackbarStore } from "~/stores/snackbar";
import { useDialogStore } from "~/stores/dialog";

const BASE_URL = useRuntimeConfig().public.apiBase + "/";

const { $apiFetch, $apiFetchRaw } = useApi();
const snackbar = useSnackbarStore();
const dialog = useDialogStore();
const router = useRouter();

// State
const loading = ref(false);
const students = ref([]);
const expandedRows = ref([]);
const searchType = ref("name");
const searchKeyword = ref("");
const verifyingLicenseId = ref(null);

const searchTypeOptions = [
  { title: "Name", value: "name" },
  { title: "Email", value: "email" },
];

const filters = reactive({
  license_id: null,
  status: null,
});

const statusOptions = [
  { title: "All Status", value: null },
  { title: "Verified", value: "VERIFIED" },
  { title: "Pending", value: "PENDING" },
];

const licenseOptions = ref([]);
const licenseLoading = ref(false);
const showAdvancedFilters = ref(false);
const templateLoading = ref(false);
const importDialog = ref(null);
const uploadResultDialog = ref(false);
const uploadResult = ref({
  success_count: 0,
  error_count: 0,
  errors: [],
  message: "",
});

const params = reactive({
  page: 1,
  limit: 10,
});

const meta = reactive({
  total: 0,
  totalPages: 1,
});

const summary = reactive({
  total_students: 0,
  verified_licenses: 0,
  pending_licenses: 0,
  showing_students: 0,
});

// Computed
const summaryCards = computed(() => [
  {
    label: "Total Students",
    value: summary.total_students,
  },
  {
    label: "Verified Licenses",
    value: summary.verified_licenses,
  },
  {
    label: "Pending Licenses",
    value: summary.pending_licenses,
  },
  {
    label: "Showing Students",
    value: summary.showing_students,
  },
]);

const headers = [
  { title: "No", key: "no", sortable: false, width: 60 },
  { title: "Student Name", key: "full_name", sortable: false },
  { title: "Email", key: "email", sortable: false },
  { title: "Phone", key: "phone", sortable: false },
  { title: "Total Licenses", key: "total_licenses", sortable: false },
  { title: "Action", key: "actions", sortable: false, align: "end" },
  { title: "", key: "data-table-expand", sortable: false, width: 1 },
];

// Methods
const fetchStudents = async () => {
  loading.value = true;
  try {
    const query = {
      page: params.page,
      limit: params.limit,
    };

    if (searchKeyword.value && searchKeyword.value.trim()) {
      if (searchType.value === "name") {
        query.name = searchKeyword.value.trim();
      } else if (searchType.value === "email") {
        query.email = searchKeyword.value.trim();
      }
    }

    if (filters.license_id) {
      query.license_id = filters.license_id;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const data = await $apiFetch(
      "/mst-informal-certificate-mappings/students",
      {
        method: "GET",
        query,
      }
    );

    console.log("API Response:", data);

    students.value = data?.items || [];
    meta.total = data?.meta?.total || 0;
    meta.totalPages = data?.meta?.totalPages || 1;

    if (data?.summary) {
      summary.total_students = data.summary.total_students || 0;
      summary.verified_licenses = data.summary.verified_licenses || 0;
      summary.pending_licenses = data.summary.pending_licenses || 0;
      summary.showing_students = data.summary.showing_students || 0;
    }

    console.log("Students after processing:", students.value);
    console.log("Summary:", summary);
  } catch (error) {
    console.error("Failed to fetch data", error);
    snackbar.showSnackbar({
      message:
        "Failed to fetch data: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  params.page = 1;
  fetchStudents();
};

const handleReset = () => {
  searchKeyword.value = "";
  searchType.value = "name";
  filters.license_id = null;
  filters.status = null;
  licenseOptions.value = [];
  params.page = 1;
  fetchStudents();
};

// Remove toggleExpand - using v-data-table's built-in expand

const getStatusColor = (license) => {
  if (license.is_verified) {
    return "success";
  } else if (license.approval_state === "WAITING_APPROVAL") {
    return "warning"; // Yellow for pending
  } else if (license.approval_state === "REJECT") {
    return "error";
  }
  return "grey";
};

const getStatusText = (license) => {
  if (license.is_verified) {
    return "Verified";
  } else if (license.approval_state === "WAITING_APPROVAL") {
    return "Pending Verification";
  } else if (license.approval_state === "REJECT") {
    return "Rejected";
  }
  return "Unknown";
};

const formatLicenseId = (license) => {
  // Try to use license_number first, then format from ID
  if (license.license_number) {
    return license.license_number;
  }
  // Format UUID to short code (first 8 chars, uppercase)
  const id = license.mst_license_id || license.id || "";
  if (id.length >= 8) {
    return id.substring(0, 8).toUpperCase();
  }
  return id;
};

const verifyLicense = async (license, student) => {
  verifyingLicenseId.value = license.id;
  try {
    // Call approval endpoint
    await $apiFetch(
      `/mst-informal-certificate-mappings/certificates/${license.id}/approval`,
      {
        method: "PATCH",
        body: {
          approval_state: "APPROVED",
        },
      }
    );

    snackbar.showSnackbar({
      message: "License verified successfully",
      color: "success",
    });

    // Refresh data
    await fetchStudents();
  } catch (error) {
    console.error("Failed to verify license", error);
    snackbar.showSnackbar({
      message:
        "Failed to verify license: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    verifyingLicenseId.value = null;
  }
};

const revokeVerification = async (license, student) => {
  verifyingLicenseId.value = license.id;
  try {
    // Call approval endpoint to reject (revoke verification)
    await $apiFetch(
      `/mst-informal-certificate-mappings/certificates/${license.id}/approval`,
      {
        method: "PATCH",
        body: {
          approval_state: "REJECT",
        },
      }
    );

    snackbar.showSnackbar({
      message: "License verification revoked successfully",
      color: "success",
    });

    // Refresh data
    await fetchStudents();
  } catch (error) {
    console.error("Failed to revoke verification", error);
    snackbar.showSnackbar({
      message:
        "Failed to revoke verification: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    verifyingLicenseId.value = null;
  }
};

const editSkills = (license, student) => {
  // Navigate to edit skills page or open dialog
  // For now, just show a message
  snackbar.showSnackbar({
    message: "Edit skills functionality coming soon",
    color: "info",
  });
};

const viewDocument = (fileUrl) => {
  if (!fileUrl) {
    snackbar.showSnackbar({
      message: "Document not available",
      color: "warning",
    });
    return;
  }

  const url = fileUrl.includes("http") ? fileUrl : BASE_URL + fileUrl;
  window.open(url, "_blank");
};

const goToCreate = () => {
  router.push("/admin/approvals/license-verification/create");
};

const editMapping = async (license, student) => {
  if (!license || !student) {
    snackbar.showSnackbar({
      message: "License or student data not found",
      color: "warning",
    });
    return;
  }

  // If mapping_id is directly available (from unprocessed mapping)
  if (license.mapping_id) {
    router.push(
      `/admin/approvals/license-verification/${license.mapping_id}/edit`
    );
    return;
  }

  // Otherwise, search for mapping by email/phone and license_id
  try {
    const searchFilters = {
      license_id: license.mst_license_id || license.id,
    };

    // Add email or phone if available
    if (student.email) {
      searchFilters.email = student.email;
    } else if (student.phone) {
      searchFilters.phone = student.phone;
    }

    const response = await $apiFetch(
      "/mst-informal-certificate-mappings/search",
      {
        params: {
          filters: searchFilters,
          limit: 1,
        },
      }
    );

    if (response?.items && response.items.length > 0) {
      const mapping = response.items[0];
      router.push(`/admin/approvals/license-verification/${mapping.id}/edit`);
    } else {
      snackbar.showSnackbar({
        message: "Mapping not found for this license",
        color: "warning",
      });
    }
  } catch (error) {
    console.error("Error finding mapping:", error);
    snackbar.showSnackbar({
      message: "Failed to find mapping",
      color: "error",
    });
  }
};

const verifyStudent = async (student) => {
  if (!student.licenses || student.licenses.length === 0) {
    snackbar.showSnackbar({
      message: "No licenses found to verify",
      color: "warning",
    });
    return;
  }

  // Filter licenses that need verification (not already verified)
  const licensesToVerify = student.licenses.filter(
    (license) => !license.is_verified && license.approval_state !== "APPROVED"
  );

  if (licensesToVerify.length === 0) {
    snackbar.showSnackbar({
      message: "All licenses are already verified",
      color: "info",
    });
    return;
  }

  // Show confirmation dialog
  try {
    const confirmed = await dialog.openDialog({
      title: "Verify Student",
      message: `Are you sure you want to verify all licenses for <strong>${
        student.full_name || "this student"
      }</strong>?<br/><br/>This will approve ${
        licensesToVerify.length
      } license(s).`,
      confirmButtonText: "Yes, Verify All",
      cancelButtonText: "Cancel",
      confirmButtonColor: "success",
      cancelButtonColor: "grey-darken-1",
    });

    if (!confirmed) {
      return;
    }
  } catch (error) {
    // User cancelled
    return;
  }

  // Verify all licenses
  verifyingLicenseId.value = "all"; // Use special value for batch operation
  try {
    const verifyPromises = licensesToVerify.map((license) =>
      $apiFetch(
        `/mst-informal-certificate-mappings/certificates/${license.id}/approval`,
        {
          method: "PATCH",
          body: {
            approval_state: "APPROVED",
          },
        }
      )
    );

    await Promise.all(verifyPromises);

    snackbar.showSnackbar({
      message: `Successfully verified ${licensesToVerify.length} license(s)!`,
      color: "success",
    });

    // Refresh data
    await fetchStudents();
  } catch (error) {
    console.error("Failed to verify licenses", error);
    snackbar.showSnackbar({
      message:
        "Failed to verify licenses: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    verifyingLicenseId.value = null;
  }
};

const handleLicenseSearch = async (search) => {
  if (!search || search.length < 2) {
    licenseOptions.value = [];
    return;
  }
  licenseLoading.value = true;
  try {
    const response = await $apiFetch("/mst-licenses/search", {
      params: {
        filters: { license_name: search },
        limit: 20,
      },
    });
    licenseOptions.value = response.items || [];
  } catch (error) {
    console.error("Error searching licenses:", error);
    licenseOptions.value = [];
  } finally {
    licenseLoading.value = false;
  }
};

// Download Excel template
const downloadTemplate = async () => {
  templateLoading.value = true;
  try {
    const response = await $apiFetchRaw(
      `/mst-informal-certificate-mappings/template/download`,
      {
        method: "GET",
        responseType: "blob",
      }
    );

    const blob = new Blob([response._data], {
      type: response.headers.get("Content-Type"),
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "informal_certificate_mapping_template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    snackbar.showSnackbar({
      message:
        "Failed to download template: " + (error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    templateLoading.value = false;
  }
};

// Handle Excel upload
const handleImportData = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  importDialog.value.attributes.loading = true;

  try {
    const response = await $apiFetch(
      `/mst-informal-certificate-mappings/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    uploadResult.value = response;
    uploadResultDialog.value = true;
    importDialog.value.attributes.dialog = false;
    importDialog.value.attributes.file = null;

    // Refresh the table
    await fetchStudents();
  } catch (error) {
    snackbar.showSnackbar({
      message:
        "Failed to upload file: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    importDialog.value.attributes.loading = false;
  }
};

// Handle Excel export - temporarily disabled
// const handleExportData = async () => {
//   try {
//     const query = {
//       page: params.page,
//       limit: params.limit,
//       isExcel: true,
//     };

//     if (searchKeyword.value && searchKeyword.value.trim()) {
//       if (searchType.value === "name") {
//         query.name = searchKeyword.value.trim();
//       } else if (searchType.value === "email") {
//         query.email = searchKeyword.value.trim();
//       }
//     }

//     if (filters.license_id) {
//       query.license_id = filters.license_id;
//     }

//     if (filters.status) {
//       query.status = filters.status;
//     }

//     const response = await $apiFetchRaw(
//       `/mst-informal-certificate-mappings/students`,
//       {
//         method: "GET",
//         params: query,
//         responseType: "blob",
//       }
//     );

//     const blob = new Blob([response._data], {
//       type: response.headers.get("Content-Type"),
//     });

//     const validMimeTypes = [
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "application/vnd.ms-excel",
//     ];

//     if (!validMimeTypes.includes(blob.type)) {
//       snackbar.showSnackbar({
//         message: "Template .xls is not available. Please contact your admin.",
//         color: "error",
//       });
//       return;
//     }

//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `license_verification_students.xlsx`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   } catch (error) {
//     snackbar.showSnackbar({
//       message:
//         "Failed to export data: " +
//         (error.data?.message || error.message || "Unknown error"),
//       color: "error",
//     });
//   }
// };

// Lifecycle
onMounted(() => {
  fetchStudents();
});
</script>

<style scoped>
.v-data-table :deep(.v-data-table__td) {
  padding: 12px 16px;
}
</style>
