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
            title: 'mst-license-skill-mappings',
            disabled: true,
            to: '/admin/settings/mst-license-skill-mappings',
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <v-card rounded="lg" elevation="0">
      <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
        <div>
          <h3 class="font-weight-bold mb-1">License Skill Mappings</h3>
          <p class="text-caption text-medium-emphasis mb-0">
            Define which skills are required or recommended for each license.
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
            Add License Map
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text class="pt-0 pb-3 px-4">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchLicense"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search licenses..."
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
              <th class="text-left" style="width: 40%">License</th>
              <th class="text-left">Default Skills</th>
              <th class="text-right" style="width: 120px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, idx) in displayedGroups" :key="group.key">
              <td>{{ (loadedPage - 1) * loadedItemsPerPage + idx + 1 }}</td>
              <td class="font-weight-medium py-1">
                {{ capitalizeWords(group.licenseName) || group.license_id }}
                <div
                  class="text-caption text-medium-emphasis"
                  v-if="group.licenseNumber"
                >
                  {{ group.licenseNumber }}
                </div>
              </td>
              <td>
                <v-chip
                  v-for="skill in group.skills"
                  :key="skill.mappingId"
                  class="ma-1"
                  size="small"
                  color="primary"
                  variant="tonal"
                  label
                >
                  {{ skill.name }}
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete all mappings for this license?
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
                  ? "Add New License Mapping"
                  : "Edit License Mapping"
              }}
            </div>
            <div class="text-caption text-medium-emphasis">
              Select the skills that should be automatically added.
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" @click="closeForm"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <label class="form-label mb-1 d-block"
                >License <span class="text-error">*</span></label
              >
              <v-autocomplete
                v-model="form.license_id"
                :items="licenseFilterItems"
                :loading="licenseFilterLoading"
                item-title="license_name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                clearable
                placeholder="Select license"
                rounded="lg"
                :disabled="groupDetailLoading"
                @update:search="handleLicenseFilterSearch"
              />
            </v-col>
            <v-col cols="12">
              <label class="form-label mb-2 d-block">
                Select Related Skills <span class="text-error">*</span>
              </label>
              <LicenseCheckboxList
                :key="skillListKey"
                v-model="form.skill_ids"
                :items="skillFilterItems"
                :loading="skillFilterLoading || groupDetailLoading"
                label="Search skill"
                placeholder="Type to search skill..."
                :disabled="groupDetailLoading"
                @search="handleSkillFilterSearch"
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
const formDialog = ref(false);
const formMode = ref("create");
const formSaving = ref(false);
const searchLicense = ref("");
const totalitems = ref(0);
const page = ref(1);
const loadedPage = ref(1);
const loadedItemsPerPage = ref(10);
const deleteDialog = ref(false);
const selectedGroup = ref(null);
const entity = ref("mst-license-skill-mappings");
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
const deleteUserLoading = ref(false);
const groupDetailLoading = ref(false);
const skillNameMap = ref({});
const skillListKey = ref(0);

const form = ref({
  license_id: null,
  skill_ids: [],
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
    // Path from error response (e.g., "/mst-license-skill-mappings")
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
      `/mst-license-skill-mappings/template/download`,
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
    a.download = "license_skill_mapping_template.xlsx";
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
    const response = await $apiFetch(`/mst-license-skill-mappings/upload`, {
      method: "POST",
      body: formData,
    });

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

// Filter search states
const licenseFilterItems = ref([]);
const licenseFilterLoading = ref(false);
const skillFilterItems = ref([]);
const skillFilterLoading = ref(false);

// Filter search handlers
const handleLicenseFilterSearch = async (search) => {
  if (!search || search.length < 2) {
    licenseFilterItems.value = [];
    return;
  }
  licenseFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-licenses/search", {
      params: {
        filters: { license_name: search },
        limit: 20,
      },
    });
    licenseFilterItems.value = response.items || [];
  } catch (error) {
    console.error("Error searching licenses:", error);
  } finally {
    licenseFilterLoading.value = false;
  }
};

const handleSkillFilterSearch = async (search) => {
  if (!search || search.length < 2) {
    skillFilterItems.value = [];
    return;
  }
  skillFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-skills/search", {
      params: {
        filters: { name: search },
        limit: 20,
      },
    });
    skillFilterItems.value = response.items || [];
  } catch (error) {
    console.error("Error searching skills:", error);
  } finally {
    skillFilterLoading.value = false;
  }
};

const loadItems = async (options) => {
  loading.value = true;
  try {
    if (options.isExcel) {
      const response = await $apiFetchRaw(`/${entity.value}/search`, {
        method: "GET",
        params: {
          page: options.page,
          limit: options.itemsPerPage,
          expands: "license,skill",
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
      const params = {
        page: options.page,
        limit: options.itemsPerPage,
        license_name: searchLicense.value || undefined,
      };

      const data = await $apiFetch(`/${entity.value}/grouped`, {
        params,
      });
      items.value = data.items || [];
      totalitems.value = data.meta?.total || 0;
      loadedPage.value = options.page;
      loadedItemsPerPage.value = options.itemsPerPage;

      // Cache skill names from response
      (data.items || []).forEach((it) => {
        if (it.skills && Array.isArray(it.skills)) {
          it.skills.forEach((skill) => {
            if (skill.id && skill.name) {
              skillNameMap.value = {
                ...skillNameMap.value,
                [skill.id]: skill.name,
              };
            }
          });
        }
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

onMounted(async () => {
  debouncedLoadItems({
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
});

watch(
  () => searchLicense.value,
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

// Grouped view helpers (backend already grouped)
const groupedItems = computed(() => {
  return (items.value || []).map((g) => ({
    key: g.license?.id || "",
    license_id: g.license?.id,
    licenseName: g.license?.license_name,
    licenseNumber: g.license?.license_number,
    skills: (g.skills || []).map((s) => ({
      id: s.id,
      name: skillNameMap.value[s.id] || s.name || s.id,
      mappingId: null, // will be fetched on demand
    })),
    mappingIds: [], // fetched on demand when editing/deleting
  }));
});

const displayedGroups = computed(() => {
  if (!searchLicense.value) return groupedItems.value;
  return groupedItems.value.filter((g) =>
    (g.licenseName || "")
      .toLowerCase()
      .includes(searchLicense.value.toLowerCase())
  );
});

const resetForm = () => {
  form.value = {
    license_id: null,
    skill_ids: [],
  };
};

const openCreateDialog = () => {
  formMode.value = "create";
  resetForm();
  skillListKey.value += 1; // reset checkbox list (clear search state)
  formDialog.value = true;
};

const fetchGroupMappings = async (group) => {
  const data = await $apiFetch(`/${entity.value}/search`, {
    params: {
      page: 1,
      limit: 1000,
      filters: {
        license_id: group.license_id,
      },
      expands: "skill",
    },
  });
  const mappings = data.items || [];

  // Cache skill names from fetched mappings
  mappings.forEach((m) => {
    if (m.skill_id && m.skill?.name) {
      skillNameMap.value = {
        ...skillNameMap.value,
        [m.skill_id]: m.skill.name,
      };
    }
  });

  return mappings;
};

const openEditDialog = async (group) => {
  formMode.value = "edit";
  selectedGroup.value = group;
  skillListKey.value += 1; // reset checkbox list (clear search state)
  formDialog.value = true;
  groupDetailLoading.value = true;
  try {
    const mappings = await fetchGroupMappings(group);
    selectedGroup.value.mappingIds = mappings.map((m) => m.id);
    form.value = {
      license_id: group.license_id,
      skill_ids: mappings.map((m) => m.skill_id),
    };

    // Ensure selected options are present with readable labels
    ensureItemInList(
      licenseFilterItems,
      (l) => l.id === group.license_id,
      group.license_id
        ? {
            id: group.license_id,
            license_name: group.licenseName || group.license_id,
            license_number: group.licenseNumber,
          }
        : null
    );

    mappings.forEach((m) => {
      ensureItemInList(
        skillFilterItems,
        (s) => s.id === m.skill_id,
        m.skill_id
          ? {
              id: m.skill_id,
              name:
                skillNameMap.value[m.skill_id] ||
                m.skill?.name ||
                group.skills?.find((s) => s.id === m.skill_id)?.name ||
                m.skill_id,
              license_name:
                skillNameMap.value[m.skill_id] ||
                m.skill?.name ||
                group.skills?.find((s) => s.id === m.skill_id)?.name ||
                m.skill_id,
              profession_name:
                skillNameMap.value[m.skill_id] ||
                m.skill?.name ||
                group.skills?.find((s) => s.id === m.skill_id)?.name ||
                m.skill_id,
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
    !!form.value.license_id &&
    Array.isArray(form.value.skill_ids) &&
    form.value.skill_ids.length > 0
  );
});

const saveGroup = async () => {
  if (!canSubmitForm.value) return;
  formSaving.value = true;
  try {
    if (formMode.value === "create") {
      for (const skillId of form.value.skill_ids) {
        await $apiFetch(`/mst-license-skill-mappings`, {
          method: "POST",
          body: {
            license_id: form.value.license_id,
            skill_id: skillId,
          },
        });
      }
    } else if (formMode.value === "edit" && selectedGroup.value) {
      // Fetch current mappings to get mapping IDs
      const currentMappings = await fetchGroupMappings(selectedGroup.value);
      const existingSkillIds = new Set(currentMappings.map((m) => m.skill_id));
      const nextSkillIds = new Set(form.value.skill_ids);

      // Create new ones
      for (const skillId of nextSkillIds) {
        if (!existingSkillIds.has(skillId)) {
          await $apiFetch(`/mst-license-skill-mappings`, {
            method: "POST",
            body: {
              license_id: form.value.license_id,
              skill_id: skillId,
            },
          });
        }
      }

      // Delete removed ones
      for (const mapping of currentMappings) {
        if (!nextSkillIds.has(mapping.skill_id)) {
          await $apiFetch(`/mst-license-skill-mappings/${mapping.id}`, {
            method: "DELETE",
          });
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
      await $apiFetch(`/mst-license-skill-mappings/${id}`, {
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
