<template>
  <v-container fluid>
    <!-- Filters Section -->
    <v-row>
      <v-breadcrumbs
        class="mb-3 text-caption"
        :items="[
          {
            title: 'dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'settings',
            disabled: false,
            to: '/admin/settings',
          },
          {
            title: 'mst-education-profession-mappings',
            disabled: true,
            to: '/admin/settings/mst-education-profession-mappings',
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <v-card rounded="lg" elevation="0">
      <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
        <div>
          <h3 class="font-weight-bold mb-1">Education Profession Mappings</h3>
          <p class="text-caption text-medium-emphasis mb-0">
            Define which professions are required or recommended for each major.
          </p>
        </div>
        <div class="d-flex gap-2">
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            rounded="lg"
          >
            Add Major Map
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="pt-0 pb-3 px-4">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchMajor"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search majors..."
              hide-details
              variant="outlined"
              density="comfortable"
              rounded="lg"
            />
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-end align-center gap-2">
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
            <v-btn
              color="secondary"
              prepend-icon="mdi-file-excel"
              variant="outlined"
              size="small"
              @click="handleExportData"
              rounded="lg"
            >
              Export
            </v-btn>
            <VImportXlsDialog
              @export-data="downloadTemplate"
              @import-data="handleImportData"
              ref="importDialog"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-text class="pa-0">
        <v-dialog v-model="first" persistent width="auto" max-width="200">
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
        <v-table class="elevation-0">
          <thead>
            <tr>
              <th class="text-left" style="width: 60px">No</th>
              <th class="text-left" style="width: 40%">Major / Education</th>
              <th class="text-left">Default Professions</th>
              <th class="text-right" style="width: 120px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, idx) in displayedGroups" :key="group.key">
              <td>{{ (loadedPage - 1) * loadedItemsPerPage + idx + 1 }}</td>
              <td class="font-weight-medium py-1">
                {{ capitalizeWords(group.majorName) || group.major_id }}
                <div
                  class="text-caption text-medium-emphasis"
                  v-if="group.schoolName"
                >
                  {{ capitalizeWords(group.schoolName) }}
                </div>
                <div
                  class="text-caption text-grey"
                  v-if="group.degree || group.diploma_level"
                >
                  {{ group.degree }}
                  <span v-if="group.diploma_level"
                    >• {{ group.diploma_level }}</span
                  >
                </div>
              </td>
              <td>
                <v-chip
                  v-for="(prof, idx) in group.professions"
                  :key="prof.id || idx"
                  class="ma-1"
                  size="small"
                  color="primary"
                  variant="tonal"
                  label
                >
                  {{ prof.name }}
                </v-chip>
              </td>
              <td class="text-right">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  density="compact"
                  color="primary"
                  size="medium"
                  class="mr-2"
                  @click="openEditDialog(group)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  density="compact"
                  color="error"
                  size="medium"
                  @click="confirmDeleteGroup(group)"
                ></v-btn>
              </td>
            </tr>
            <tr v-if="!loading && displayedGroups.length === 0">
              <td colspan="4" class="text-center text-medium-emphasis py-6">
                No mappings found.
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="4" class="text-center">
                Loading data...
                <v-progress-linear
                  indeterminate
                  color="primary"
                  class="mt-2"
                  rounded
                  style="max-width: 200px; margin: 0 auto"
                ></v-progress-linear>
              </td>
            </tr>
          </tbody>
        </v-table>
        <div class="d-flex align-center justify-space-between px-4 py-3">
          <div class="d-flex align-center gap-2">
            <span class="text-caption text-medium-emphasis">Rows per page</span>
            <v-select
              v-model="itemsPerPage"
              :items="[5, 10, 20, 50]"
              density="compact"
              hide-details
              style="max-width: 100px"
            />
          </div>
          <div class="d-flex align-center gap-3">
            <v-progress-circular
              v-if="loading && !first"
              indeterminate
              color="primary"
              size="20"
              width="2"
            />
            <v-pagination
              v-model="page"
              :length="Math.max(1, Math.ceil(totalitems / itemsPerPage))"
              density="comfortable"
              rounded="circle"
              total-visible="7"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Delete Confirmation Dialog... -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete all mappings for this major group?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red" text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteGroup"
            :loading="deleteUserLoading"
            >Confirm</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="640">
      <v-card rounded="lg">
        <v-progress-linear
          v-if="groupDetailLoading"
          indeterminate
          color="primary"
          height="3"
        />
        <v-card-title class="d-flex align-center justify-space-between">
          <div>
            <div class="font-weight-medium">
              {{
                formMode === "create"
                  ? "Add New Profession Mapping"
                  : "Edit Profession Mapping"
              }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Select the professions that should be automatically added.
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeForm"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <label class="form-label mb-1 d-block"
                >School <span class="text-error">*</span></label
              >
              <v-autocomplete
                v-model="form.school_id"
                :items="schoolFilterItems"
                :loading="schoolFilterLoading"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                clearable
                placeholder="Select school"
                rounded="lg"
                :disabled="groupDetailLoading"
                @update:search="handleSchoolFilterSearch"
              />
            </v-col>
            <v-col cols="12" md="6">
              <label class="form-label mb-1 d-block"
                >Major <span class="text-error">*</span></label
              >
              <v-autocomplete
                v-model="form.major_id"
                :items="majorFilterItems"
                :loading="majorFilterLoading"
                item-title="major_name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                clearable
                placeholder="Select major"
                rounded="lg"
                :disabled="groupDetailLoading"
                @update:search="handleMajorFilterSearch"
              />
            </v-col>
            <v-col cols="12" md="6">
              <label class="form-label mb-1 d-block">Degree</label>
              <v-select
                v-model="form.degree"
                :items="degreeFilterOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                clearable
                placeholder="Select degree"
                rounded="lg"
                :disabled="groupDetailLoading"
              />
            </v-col>
            <v-col cols="12" md="6">
              <label class="form-label mb-1 d-block">Diploma Level</label>
              <v-select
                v-model="form.diploma_level"
                :items="diplomaLevelOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                clearable
                placeholder="Select diploma level"
                rounded="lg"
                :disabled="groupDetailLoading"
              />
            </v-col>
            <v-col cols="12">
              <label class="form-label mb-2 d-block">
                Select Related Professions <span class="text-error">*</span>
              </label>
              <LicenseCheckboxList
                :key="professionListKey"
                v-model="form.profession_ids"
                :items="professionFilterItems"
                :loading="professionFilterLoading"
                label="Search profession"
                placeholder="Type to search profession..."
                :disabled="groupDetailLoading"
                @search="handleProfessionFilterSearch"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeForm">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="formSaving"
            :disabled="!canSubmitForm"
            @click="saveGroup"
            variant="elevated"
            rounded="lg"
          >
            Save Mapping
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

import { debounce } from "~/utils/debounce";
import { capitalizeWords } from "~/utils/format";
import LicenseCheckboxList from "~/components/LicenseCheckboxList.vue";
import { useSnackbarStore } from "~/stores/snackbar";

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const snackbar = useSnackbarStore();
const items = ref([]);
const loading = ref(true);
const first = ref(true);
const totalitems = ref(0);
const page = ref(1);
const loadedPage = ref(1);
const loadedItemsPerPage = ref(10);
const deleteDialog = ref(false);
const selectedGroup = ref(null);
const entity = ref("mst-education-profession-mappings");
const sortBy = useState(`${entity.value}sortBy`, () => []);
const itemsPerPage = useState(`itemsPerPage`, () => 10);
const templateLoading = ref(false);
const uploadResultDialog = ref(false);
const uploadResult = ref({
  success_count: 0,
  error_count: 0,
  errors: [],
  message: "",
});
const { $apiFetch, $apiFetchRaw } = useApi();

const importDialog = ref(null);
const formDialog = ref(false);
const formMode = ref("create");
const formSaving = ref(false);
const searchMajor = ref("");
const deleteUserLoading = ref(false);
const groupDetailLoading = ref(false);
const professionNameMap = ref({});
const professionListKey = ref(0);

const form = ref({
  school_id: null,
  major_id: null,
  degree: null,
  diploma_level: null,
  profession_ids: [],
});

const ensureItemInList = (listRef, predicate, item) => {
  if (!item) return;
  const exists = (listRef.value || []).some(predicate);
  if (!exists) {
    listRef.value = [...(listRef.value || []), item];
  }
};

// Helper function to extract error message from API error response
const getErrorMessage = (error, defaultMessage = "Something went wrong!") => {
  const errorData = error?.response?._data;
  let errorMessage = defaultMessage;

  // Extract error message
  if (errorData) {
    // Check for message field first (contains specific error like "Mapping already exists")
    // message can be string or array
    if (errorData.message) {
      if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(", ");
      } else {
        errorMessage = errorData.message;
      }
    }
    // Fallback to error field (usually generic like "Bad Request")
    else if (errorData.error) {
      errorMessage =
        typeof errorData.error === "string"
          ? errorData.error
          : String(errorData.error);
    }
  } else if (error?.message) {
    errorMessage = error.message;
  }

  // Extract status code
  const statusCode = error?.response?.status || errorData?.statusCode || null;

  // Extract HTTP method if available
  let method = null;
  if (error?.request?.method) {
    method = error.request.method;
  } else if (errorData?.method) {
    method = errorData.method;
  }

  // Extract endpoint/URL
  let endpoint = null;
  if (errorData?.path) {
    // Path from error response (e.g., "/mst-education-profession-mappings")
    endpoint = errorData.path;
  } else if (error?.url) {
    // URL from error object
    try {
      const url = new URL(error.url);
      endpoint = url.pathname;
    } catch {
      endpoint = error.url;
    }
  } else if (error?.request) {
    // Request object or URL string
    if (typeof error.request === "string") {
      try {
        const url = new URL(error.request);
        endpoint = url.pathname;
      } catch {
        endpoint = error.request;
      }
    } else if (error.request?.url) {
      try {
        const url = new URL(error.request.url);
        endpoint = url.pathname;
      } catch {
        endpoint = error.request.url;
      }
    }
  }

  // Format message with status code, method, and endpoint
  let formattedMessage = errorMessage;

  if (statusCode || method || endpoint) {
    const parts = [];
    if (statusCode) {
      parts.push(`[${statusCode}]`);
    }
    if (method) {
      parts.push(method);
    }
    if (endpoint) {
      // Remove leading slash if present for cleaner display
      const cleanEndpoint = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;
      parts.push(cleanEndpoint);
    }
    if (parts.length > 0) {
      formattedMessage = `${errorMessage} ${parts.join(" ")}`;
    }
  }

  return formattedMessage;
};

// Download Excel template
const downloadTemplate = async () => {
  templateLoading.value = true;
  try {
    const response = await $apiFetchRaw(
      `/mst-education-profession-mappings/template/download`,
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
    a.download = "education_profession_mapping_template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    snackbar.showSnackbar({
      message: getErrorMessage(error, "Failed to download template"),
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
      `/mst-education-profession-mappings/upload`,
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
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  } catch (error) {
    snackbar.showSnackbar({
      message: getErrorMessage(error, "Failed to upload file"),
      color: "error",
    });
  } finally {
    importDialog.value.attributes.loading = false;
  }
};

const handleExportData = () => {
  loadItems({
    isExcel: true,
  });
};

// Filters
const filterLoading = ref(true);

// Filter search states
const schoolFilterItems = ref([]);
const schoolFilterLoading = ref(false);
const majorFilterItems = ref([]);
const majorFilterLoading = ref(false);
const professionFilterItems = ref([]);
const professionFilterLoading = ref(false);

// Degree filter options
const degreeFilterOptions = [
  { label: "S1", value: "S1" },
  { label: "S2", value: "S2" },
  { label: "S3", value: "S3" },
  { label: "D3", value: "D3" },
  { label: "D4", value: "D4" },
  { label: "SMK", value: "SMK" },
  { label: "SMA", value: "SMA" },
];

// Diploma level options
const diplomaLevelOptions = ref([]);
const fetchDiplomaLevelOptions = async () => {
  try {
    const response = await $apiFetch("/configs/key/education_level");
    if (response && response.value && Array.isArray(response.value)) {
      diplomaLevelOptions.value = response.value.map((level) => ({
        label: level.label,
        value: level.code,
      }));
    }
  } catch (error) {
    console.error("Error loading diploma levels:", error);
  }
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

const handleProfessionFilterSearch = async (search) => {
  if (!search || search.length < 2) {
    professionFilterItems.value = [];
    return;
  }
  professionFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-professions/search", {
      params: {
        filters: { name: search },
        limit: 20,
      },
    });
    professionFilterItems.value = response.items || [];
  } catch (error) {
    console.error("Error searching professions:", error);
  } finally {
    professionFilterLoading.value = false;
  }
};

const loadFields = async () => {
  filterLoading.value = false;
};

const loadItems = async (options) => {
  if (filterLoading.value) {
    return;
  }
  loading.value = true;
  try {
    if (options.isExcel) {
      const response = await $apiFetchRaw(`/${entity.value}/search`, {
        method: "GET",
        params: {
          page: options.page,
          limit: options.itemsPerPage,
          expands: "school,major,profession",
          isExcel: true,
        },
        responseType: "blob",
      });

      const blob = new Blob([response._data], {
        type: response.headers.get("Content-Type"),
      });

      const validMimeTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validMimeTypes.includes(blob.type)) {
        snackbar.showSnackbar({
          message: "Template .xls is not available. Please contact your admin.",
          color: "error",
        });
        return;
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${entity.value}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } else {
      // Use grouped endpoint
      const params = {
        page: options.page,
        limit: options.itemsPerPage,
      };

      if (searchMajor.value) {
        params.major_name = searchMajor.value;
      }

      const data = await $apiFetch(`/${entity.value}/grouped`, {
        params,
      });

      // Map grouped response to display format
      items.value = (data.items || []).map((item) => {
        // Build key for grouping (for edit/delete operations)
        const key = `${item.school?.id || ""}|${item.major?.id || ""}|${
          item.degree || ""
        }|${item.diploma_level || ""}`;

        // Map professions to the format expected by the template
        const professions = (item.professions || []).map((prof, idx) => ({
          mappingId: null, // Will be fetched when needed for edit/delete
          id: prof.id,
          name: prof.profession_name || prof.name || prof.id,
        }));

        return {
          key,
          school_id: item.school?.id,
          major_id: item.major?.id,
          degree: item.degree,
          diploma_level: item.diploma_level,
          schoolName: item.school?.name,
          majorName: item.major?.major_name,
          professions,
          mappingIds: [], // Will be fetched when needed for edit/delete
        };
      });

      totalitems.value = data.meta?.total || 0;
      loadedPage.value = options.page;
      loadedItemsPerPage.value = options.itemsPerPage;

      // Cache profession names from response
      (data.items || []).forEach((item) => {
        (item.professions || []).forEach((prof) => {
          if (prof.id) {
            professionNameMap.value = {
              ...professionNameMap.value,
              [prof.id]: prof.profession_name || prof.name || prof.id,
            };
          }
        });
      });
    }
  } catch (error) {
    console.error("Error loading items:", error);
  } finally {
    loading.value = false;
    first.value = false;
  }
};

const debouncedLoadItems = debounce(loadItems, 200);

watch(
  () => searchMajor.value,
  () => {
    page.value = 1;
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }
);

// Data is already grouped from backend, so we can use it directly
const displayedGroups = computed(() => {
  return items.value;
});

onMounted(async () => {
  await loadFields();
  await fetchDiplomaLevelOptions();
  debouncedLoadItems({
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
});

watch(
  () => searchMajor.value,
  () => {
    page.value = 1;
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }
);

watch(
  () => itemsPerPage.value,
  () => {
    page.value = 1;
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }
);

watch(
  () => page.value,
  () => {
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }
);

const resetForm = () => {
  form.value = {
    school_id: null,
    major_id: null,
    degree: null,
    diploma_level: null,
    profession_ids: [],
  };
};

const fetchGroupMappings = async (group) => {
  const data = await $apiFetch(`/${entity.value}/search`, {
    params: {
      page: 1,
      limit: 1000,
      filters: {
        school_id: group.school_id,
        major_id: group.major_id,
        degree: group.degree,
        diploma_level: group.diploma_level,
      },
      expands: "profession",
    },
  });
  return data.items || [];
};

const openCreateDialog = () => {
  formMode.value = "create";
  resetForm();
  professionListKey.value += 1; // reset checkbox list (clear search state)
  formDialog.value = true;
};

const openEditDialog = async (group) => {
  formMode.value = "edit";
  selectedGroup.value = group;
  professionListKey.value += 1; // reset checkbox list (clear search state)
  formDialog.value = true;
  groupDetailLoading.value = true;
  try {
    const mappings = await fetchGroupMappings(group);
    selectedGroup.value.mappingIds = mappings.map((m) => m.id);
    
    // Store full mappings for reference
    selectedGroup.value.fullMappings = mappings;
    
    // Create a map of profession_id to mapping_id for easy lookup
    const professionToMappingMap = new Map();
    mappings.forEach((m) => {
      professionToMappingMap.set(m.profession_id, m.id);
    });
    
    // Update professions with mappingId
    selectedGroup.value.professions = (selectedGroup.value.professions || []).map((profession) => ({
      ...profession,
      mappingId: professionToMappingMap.get(profession.id) || null,
    }));
    
    form.value = {
      school_id: group.school_id,
      major_id: group.major_id,
      degree: group.degree,
      diploma_level: group.diploma_level,
      profession_ids: mappings.map((m) => m.profession_id),
    };

    ensureItemInList(
      schoolFilterItems,
      (s) => s.id === group.school_id,
      group.school_id
        ? { id: group.school_id, name: group.schoolName || group.school_id }
        : null
    );
    ensureItemInList(
      majorFilterItems,
      (m) => m.id === group.major_id,
      group.major_id
        ? { id: group.major_id, major_name: group.majorName || group.major_id }
        : null
    );
    mappings.forEach((m) => {
      ensureItemInList(
        professionFilterItems,
        (p) => p.id === m.profession_id,
        m.profession_id
          ? {
              id: m.profession_id,
              name:
                m.profession?.profession_name ||
                m.profession?.name ||
                m.profession_name ||
                m.name ||
                group.professions?.find((p) => p.id === m.profession_id)
                  ?.name ||
                m.profession_id,
              license_name:
                m.profession?.profession_name ||
                m.profession?.name ||
                m.profession_name ||
                m.name ||
                group.professions?.find((p) => p.id === m.profession_id)
                  ?.name ||
                m.profession_id,
              profession_name:
                professionNameMap.value[m.profession_id] ||
                m.profession?.profession_name ||
                m.profession?.name ||
                m.profession_name ||
                m.name ||
                group.professions?.find((p) => p.id === m.profession_id)
                  ?.name ||
                m.profession_id,
            }
          : null
      );
    });
  } catch (error) {
    snackbar.showSnackbar({
      message: getErrorMessage(error, "Failed to load mapping detail"),
      color: "error",
    });
    formDialog.value = false;
  } finally {
    groupDetailLoading.value = false;
  }
};

const closeForm = () => {
  formDialog.value = false;
  formMode.value = "create";
  selectedGroup.value = null;
  resetForm();
};

const canSubmitForm = computed(() => {
  return (
    !!form.value.major_id &&
    !!form.value.school_id &&
    !!form.value.degree &&
    !!form.value.diploma_level &&
    Array.isArray(form.value.profession_ids) &&
    form.value.profession_ids.length > 0
  );
});

const saveGroup = async () => {
  if (!canSubmitForm.value) return;
  formSaving.value = true;
  try {
    if (formMode.value === "create") {
      for (const professionId of form.value.profession_ids) {
        await $apiFetch(`/mst-education-profession-mappings`, {
          method: "POST",
          body: {
            school_id: form.value.school_id,
            major_id: form.value.major_id,
            degree: form.value.degree,
            diploma_level: form.value.diploma_level,
            profession_id: professionId,
          },
        });
      }
    } else if (formMode.value === "edit" && selectedGroup.value) {
      const existingIds = new Set(
        selectedGroup.value.professions.map((p) => p.id)
      );
      const nextIds = new Set(form.value.profession_ids);

      // Create new ones
      for (const id of nextIds) {
        if (!existingIds.has(id)) {
          await $apiFetch(`/mst-education-profession-mappings`, {
            method: "POST",
            body: {
              school_id: form.value.school_id,
              major_id: form.value.major_id,
              degree: form.value.degree,
              diploma_level: form.value.diploma_level,
              profession_id: id,
            },
          });
        }
      }

      // Delete removed ones - use fullMappings if available for more reliable mapping
      const mappingsToDelete = selectedGroup.value.fullMappings || [];
      for (const mapping of mappingsToDelete) {
        if (!nextIds.has(mapping.profession_id)) {
          await $apiFetch(
            `/mst-education-profession-mappings/${mapping.id}`,
            {
              method: "DELETE",
            }
          );
        }
      }
    }

    closeForm();
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  } catch (error) {
    snackbar.showSnackbar({
      message: getErrorMessage(error, "Failed to save mapping"),
      color: "error",
    });
  } finally {
    formSaving.value = false;
  }
};

const confirmDeleteGroup = (group) => {
  selectedGroup.value = group;
  deleteDialog.value = true;
};

const deleteGroup = async () => {
  if (!selectedGroup.value) return;
  deleteUserLoading.value = true;
  try {
    if (
      !selectedGroup.value.mappingIds ||
      selectedGroup.value.mappingIds.length === 0
    ) {
      const mappings = await fetchGroupMappings(selectedGroup.value);
      selectedGroup.value.mappingIds = mappings.map((m) => m.id);
    }
    for (const id of selectedGroup.value.mappingIds) {
      await $apiFetch(`/mst-education-profession-mappings/${id}`, {
        method: "DELETE",
      });
    }
    deleteDialog.value = false;
    selectedGroup.value = null;
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  } catch (error) {
    snackbar.showSnackbar({
      message: getErrorMessage(error, "Failed to delete mappings"),
      color: "error",
    });
  } finally {
    deleteUserLoading.value = false;
  }
};
</script>

<style scoped>
.drag-drop-area {
  border: 2px dashed #1976d2;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}
.drag-drop-area.dragging {
  background-color: #e3f2fd;
  border-color: #64b5f6;
}
.hidden {
  display: none;
}
.upload-link {
  color: #1976d2;
  font-weight: bold;
  cursor: pointer;
}
.upload-link:hover {
  text-decoration: underline;
}
.file-info {
  text-align: center;
}
</style>
