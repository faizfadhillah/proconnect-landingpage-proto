<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row class="mb-1">
      <v-col cols="12">
        <v-card elevation="0" class="bg-gradient-primary text-white rounded-lg">
          <v-card-text class="py-6">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">
                  <v-icon left size="large" class="mr-2"
                    >mdi-form-select</v-icon
                  >
                  {{ mode === "update" ? "Edit" : "Create" }} {{ entityName }}
                </h1>
                <p class="text-subtitle-1 opacity-90 mb-0">
                  {{
                    mode === "update"
                      ? "Update the details below"
                      : "Fill in the form to create a new entry"
                  }}
                </p>
              </div>
              <v-avatar size="64" class="bg-opacity-20">
                <v-icon size="32" color="white">
                  {{ mode === "update" ? "mdi-pencil" : "mdi-plus" }}
                </v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>

        <!-- Breadcrumbs -->
        <v-breadcrumbs class="mt-4 px-0" :items="breadcrumbItems" divider="/">
          <template v-slot:item="{ item }">
            <v-breadcrumbs-item
              :to="item.to"
              :disabled="item.disabled"
              class="text-decoration-none"
            >
              <span class="text-capitalize">{{ item.title }}</span>
            </v-breadcrumbs-item>
          </template>
        </v-breadcrumbs>
      </v-col>
    </v-row>

    <!-- Form Section -->
    <v-card elevation="2" class="rounded-lg overflow-hidden">
      <form @submit.prevent="onSubmit">
        <!-- Form Header -->
        <v-card-text class="bg-grey-lighten-5 py-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-3" color="primary"
                >mdi-clipboard-edit-outline</v-icon
              >
              <div>
                <h3 class="text-h6 font-weight-medium mb-1">Form Details</h3>
                <p class="text-body-2 text-grey-darken-1 mb-0">
                  Complete all required fields marked with *
                </p>
              </div>
            </div>
            <v-chip
              :color="mode === 'update' ? 'primary' : 'success'"
              variant="flat"
              size="small"
            >
              <v-icon start size="small">
                {{ mode === "update" ? "mdi-update" : "mdi-plus" }}
              </v-icon>
              {{ mode === "update" ? "Edit Mode" : "Create Mode" }}
            </v-chip>
          </div>
        </v-card-text>

        <!-- Form Content -->
        <v-card-text class="pa-6">
          <!-- Loading State -->
          <v-row v-if="loading">
            <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
              <v-skeleton-loader type="card" class="rounded-lg" height="120" />
            </v-col>
          </v-row>

          <!-- Form Fields -->
          <v-row v-else>
            <v-col
              v-for="field in fields"
              :key="field.name"
              :cols="12"
              :md="4"
              :lg="3"
              :sm="6"
              class="mb-4"
            >
              <!-- ID Field Display -->
              <div
                v-if="['id'].includes(field.name) && !field.options?.length"
                class="d-flex align-center pa-4 border border-primary border-opacity-25 rounded-lg bg-grey-lighten-5"
              >
                <v-icon color="primary" class="mr-3">mdi-identifier</v-icon>
                <div>
                  <div class="text-caption text-grey-darken-1">Record ID</div>
                  <div class="text-h6 font-weight-medium">
                    {{ form[field.name] || "(Auto-generated)" }}
                  </div>
                </div>
              </div>

              <!-- Region Autocomplete -->
              <div v-else-if="field.name == 'region_id'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  @keyup="handleInputRegion"
                  :items="regions"
                  :loading="regionLoading"
                  item-title="full_name"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                  prepend-inner-icon="mdi-map-marker"
                />
              </div>

              <!-- Salary Country Autocomplete -->
              <div v-else-if="field.name == 'salary_country_id'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  @keyup="
                    handleInput(
                      $event,
                      'salary_country',
                      ['country_name'],
                      'mst-salary-country'
                    )
                  "
                  :items="models['salary_country'].items"
                  :loading="models['salary_country'].loading"
                  item-title="country_name"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-currency-usd</v-icon>
                  </template>
                </v-autocomplete>
              </div>

              <!-- User Autocomplete -->
              <div v-else-if="['user_id', 'following_id'].includes(field.name)">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  @keyup="handleInputUser"
                  :items="users"
                  :loading="userLoading"
                  item-value="id"
                  item-title="displayText"
                  :error-messages="errors[field.name]"
                  clearable
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-account</v-icon>
                  </template>
                  <template v-slot:item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :subtitle="item.raw.email"
                      :title="item.raw.full_name"
                    >
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item, props }">
                    <v-chip
                      v-if="item.raw.full_name"
                      v-bind="props"
                      color="primary"
                      variant="flat"
                      size="small"
                    >
                      {{ item.raw.full_name }} - {{ item.raw.email }}
                    </v-chip>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Company Autocomplete -->
              <div v-else-if="field.name == 'company_id'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :placeholder="field.placeholder || field.label || ''"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  variant="outlined"
                  density="comfortable"
                  @keyup="
                    handleInput(
                      $event,
                      'company',
                      ['company_name'],
                      'mst-companies'
                    )
                  "
                  :items="models['company'].items"
                  :loading="models['company'].loading"
                  item-title="company_name"
                  item-value="id"
                  hide-no-data
                  clearable
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-office-building</v-icon>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Industry Autocomplete -->
              <div v-else-if="field.name == 'industry_id'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :placeholder="field.placeholder || field.label || ''"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  variant="outlined"
                  density="comfortable"
                  @keyup="
                    handleInput($event, 'industry', ['name'], 'mst-industries')
                  "
                  :items="models['industry'].items"
                  :loading="models['industry'].loading"
                  item-title="name"
                  item-value="id"
                  hide-no-data
                  clearable
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-domain</v-icon>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Checkbox Field -->
              <div
                v-else-if="
                  field.name.includes('is_') || field.options?.type == 'boolean'
                "
              >
                <v-switch
                  v-model="form[field.name]"
                  color="success"
                  :true-value="true"
                  :false-value="false"
                  :error-messages="errors[field.name]"
                  hide-details="auto"
                >
                  <template v-slot:prepend>
                    <v-icon color="success">mdi-toggle-switch</v-icon>
                  </template>
                </v-switch>
              </div>

              <!-- Number Field -->
              <div
                v-else-if="
                  field.options?.type == 'decimal' ||
                  field.options?.type == 'int'
                "
              >
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-text-field
                  v-model="form[field.name]"
                  type="number"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  :step="field.options.type == 'int' ? '0' : '0.0000'"
                  @keyup="form[field.name] = parseFloat(form[field.name])"
                  :error-messages="errors[field.name]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-numeric</v-icon>
                  </template>
                </v-text-field>
              </div>

              <!-- Date Field -->
              <div v-else-if="field.name.includes('date')">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-text-field
                  v-model="form[field.name]"
                  type="date"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  :error-messages="errors[field.name]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-calendar</v-icon>
                  </template>
                </v-text-field>
              </div>

              <!-- JSON Field -->
              <div v-else-if="field.options && field.options.type === 'jsonb'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-json-field v-model="form[field.name]" />
              </div>

              <!-- Text Field -->
              <div v-else-if="field.inputType === 'text'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-text-field
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  :error-messages="errors[field.name]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-form-textbox</v-icon>
                  </template>
                </v-text-field>
              </div>

              <!-- Textarea Field -->
              <div v-else-if="field.inputType === 'textarea'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-textarea
                  v-model="form[field.name]"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  rows="3"
                  :error-messages="errors[field.name]"
                  auto-grow
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-text</v-icon>
                  </template>
                </v-textarea>
              </div>

              <!-- Select Field -->
              <div v-else-if="field.inputType === 'select'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-select
                  v-model="form[field.name]"
                  :items="field.enums"
                  :rules="field.rules"
                  clearable
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  item-title="key"
                  item-value="value"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  :error-messages="errors[field.name]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-form-dropdown</v-icon>
                  </template>
                </v-select>
              </div>

              <!-- Default Field -->
              <div v-else>
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-text-field
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :rules="field.rules"
                  :clearable="field.clearable || false"
                  :required="field.required || false"
                  :placeholder="field.placeholder || field.label || ''"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  :error-messages="errors[field.name]"
                >
                  <template v-slot:prepend-inner>
                    <v-icon color="primary">mdi-form-textbox</v-icon>
                  </template>
                </v-text-field>
              </div>
            </v-col>
          </v-row>

          <!-- RBAC Section -->
          <v-row v-if="entity == 'rbac' && mode == 'update' && form['name']">
            <v-col cols="12">
              <v-card elevation="1" class="rounded-lg">
                <v-card-text class="bg-grey-lighten-5 py-4">
                  <div class="d-flex align-center">
                    <v-icon class="mr-3" color="primary"
                      >mdi-shield-account</v-icon
                    >
                    <div>
                      <h4 class="text-h6 font-weight-medium mb-1">
                        Role Permissions
                      </h4>
                      <p class="text-body-2 text-grey-darken-1 mb-0">
                        Configure role-based access control settings
                      </p>
                    </div>
                  </div>
                </v-card-text>
                <v-card-text class="pa-4">
                  <component
                    :is="formRbac"
                    :rolePermission="form['name']"
                    :meta="form['meta']"
                    @update-menus="updateMetaMenus"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Form Actions -->
        <v-divider />
        <v-card-actions class="pa-6 bg-grey-lighten-5">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="grey-darken-1"
            size="large"
            class="mr-3"
            @click="router.back()"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            :color="mode === 'update' ? 'primary' : 'success'"
            size="large"
            variant="elevated"
            :loading="submitLoading"
            class="px-8"
          >
            <v-icon start>
              {{ mode === "update" ? "mdi-content-save" : "mdi-plus" }}
            </v-icon>
            {{ mode === "update" ? "Save Changes" : "Create Entry" }}
          </v-btn>
        </v-card-actions>
      </form>
    </v-card>

    <!-- Error Snackbar -->
    <v-snackbar v-model="showErrorSnackbar" color="error" timeout="5000" top>
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        <div>
          <div class="font-weight-medium">Form Submission Error</div>
          <div v-if="providerErrors.length > 0" class="text-caption">
            {{ providerErrors[0] }}
          </div>
        </div>
      </div>
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="showErrorSnackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

import FormRbac from "./form-rbac.vue";

const formRbac = ref(FormRbac);

// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();

const form = ref({}); // Form data object
const isFormValid = ref(false); // Track form validation status
const mode = ref(route.query.id ? "update" : "create"); // Mode for the form, can be "create" or "update"
const entity = ref(route.params.entity);
const isShowFields = ref(false);
const loading = ref(true);
const showErrorSnackbar = ref(false);

// Computed properties
const entityName = computed(() => {
  return entity.value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
});

const breadcrumbItems = computed(() => [
  {
    title: "dashboard",
    disabled: false,
    to: "/admin/dashboard",
  },
  {
    title: "master",
    disabled: false,
    to: "/admin/settings/masters/other-masters",
  },
  {
    title: entity.value,
    disabled: false,
    to: `/admin/settings/masters/other-masters/${entity.value}`,
  },
  {
    title: "form",
    disabled: true,
    to: `/admin/settings/masters/other-masters/${entity.value}/form`,
  },
]);

const fields = ref([]);
const errors = ref({});

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
    if (field.name == "parent_id" && entity.value == "mst-professions") {
      fetch(
        "parent_profession",
        form.value[field.name],
        ["id"],
        "mst-professions"
      );
    }
    if (field.name == "parent_id" && entity.value == "mst-companies") {
      fetch("company", form.value[field.name], ["id"], "mst-companies");
    }
  }
};

const loadFields = async () => {
  const items = await $apiFetch(`/fields/${entity.value}`);
  if (Array.isArray(items)) {
    items.forEach((item) => {
      fields.value.push(item);
      errors.value[item.name] = [];
    });
  }
  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

// Initialize form data with either empty values (for create) or predefined values (for update)
const initializeForm = (data = null) => {
  fields.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    form.value[field.name] = data && data[field.name] ? data[field.name] : "";

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
      form.value[field.name] = data && data[field.name] ? data[field.name] : [];
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

// Initialize form based on mode
onMounted(async () => {
  await loadFields();
  if (mode.value === "update") {
    setTimeout(async () => {
      $apiFetch(`/${entity.value}/search`, {
        params: { id: route.query.id },
      }).then((data) => {
        if (data.items && data.items[0]) {
          initializeForm(data.items[0]);
        }
      });
    }, 100);
  } else {
    initializeForm();
  }
});

// Submit handler
const submitLoading = ref(false);
const providerErrors = ref([]);
const onSubmit = async () => {
  Object.keys(errors.value).forEach((key) => {
    errors.value[key] = [];
  });
  Object.keys(form.value).forEach((key) => {
    if (
      !form.value[key] &&
      form.value[key] !== 0 &&
      form.value[key] !== false &&
      !["company_role", "company_id", "branch"].includes(key)
    ) {
      form.value[key] = null;
    }
  });

  try {
    submitLoading.value = true;
    if (mode.value === "create") {
      delete form.value.id;
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
        showErrorSnackbar.value = true;
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
      showErrorSnackbar.value = true;
    }
  }
};

const updateMetaMenus = (menus) => {
  form.value["meta"] = { ...form.value["meta"], ...{ menus: menus } };
};
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.form-field-card {
  border: 1px solid rgba(25, 118, 210, 0.12);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.form-field-card:hover {
  border-color: rgba(25, 118, 210, 0.3);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
}

.form-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  font-size: 0.875rem;
  margin-bottom: 8px;
  display: block;
}

.text-capitalize {
  text-transform: capitalize;
}

.v-skeleton-loader {
  border-radius: 12px;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-1px);
}
</style>
