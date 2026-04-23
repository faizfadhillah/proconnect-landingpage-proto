<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row class="mb-1">
      <v-col cols="12">
        <!-- Breadcrumbs -->
        <v-breadcrumbs
          class="mt-0 px-0 text-caption"
          :items="breadcrumbItems"
          divider="/"
        >
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
        <v-card elevation="0" class="bg-gradient-primary text-white rounded-lg">
          <v-card-text class="py-6">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h1 class="text-h4 font-weight-bold mb-2">
                  <v-icon left size="large" class="mr-2"
                    >mdi-account-plus</v-icon
                  >
                  {{ mode === "update" ? "Edit" : "Create" }} User
                </h1>
                <p class="text-subtitle-1 opacity-90 mb-0">
                  {{
                    mode === "update"
                      ? "Update user details below"
                      : "Fill in the form to create a new user"
                  }}
                </p>
              </div>
              <v-avatar size="64" class="bg-opacity-20">
                <v-icon size="32" color="white">
                  {{
                    mode === "update" ? "mdi-account-edit" : "mdi-account-plus"
                  }}
                </v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Form Section -->
    <v-card elevation="0" class="rounded-lg overflow-hidden">
      <form @submit.prevent="onSubmit">
        <!-- Form Header -->
        <v-card-text class="bg-grey-lighten-5 py-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-3" color="primary"
                >mdi-clipboard-edit-outline</v-icon
              >
              <div>
                <h3 class="text-h6 font-weight-medium mb-1">
                  User Information
                </h3>
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
              <v-skeleton-loader type="card" class="rounded-lg" />
            </v-col>
          </v-row>

          <!-- Form Fields -->
          <v-row v-else>
            <v-col
              v-for="field in fields"
              :key="field.name"
              :cols="12"
              :md="field.cols || 4"
              :lg="field.cols || 4"
              :sm="field.cols || 6"
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
                  rounded="lg"
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
                  rounded="lg"
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
                  prepend-inner-icon="mdi-currency-usd"
                />
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
                  rounded="lg"
                  @keyup="handleInputUser"
                  :items="users"
                  :loading="userLoading"
                  item-value="id"
                  item-title="displayText"
                  :error-messages="errors[field.name]"
                  clearable
                  prepend-inner-icon="mdi-account"
                >
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
                  <span v-if="form.user_role === 'company'" class="text-error"
                    >*</span
                  >
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :placeholder="field.placeholder || field.label || ''"
                  :rules="getCompanyIdRules(field)"
                  :clearable="field.clearable || false"
                  :required="form.user_role === 'company'"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
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
                  :error-messages="errors[field.name]"
                  prepend-inner-icon="mdi-domain"
                />
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
                  rounded="lg"
                  @keyup="
                    handleInput($event, 'industry', ['name'], 'mst-industries')
                  "
                  :items="models['industry'].items"
                  :loading="models['industry'].loading"
                  item-title="name"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                  prepend-inner-icon="mdi-briefcase"
                />
              </div>

              <!-- Invoice Autocomplete -->
              <div v-else-if="field.name == 'invoice_id'">
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
                  rounded="lg"
                  @keyup="
                    handleInput(
                      $event,
                      'invoice',
                      ['invoice_number'],
                      'mst-invoices'
                    )
                  "
                  :items="models['invoice'].items"
                  :loading="models['invoice'].loading"
                  item-title="invoice_number"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                  prepend-inner-icon="mdi-receipt"
                />
              </div>

              <!-- Parent Profession Autocomplete -->
              <div
                v-else-if="
                  field.name == 'parent_id' && entity == 'mst-professions'
                "
              >
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
                  rounded="lg"
                  @keyup="
                    handleInput(
                      $event,
                      'profession_parent',
                      ['name'],
                      'mst-professions'
                    )
                  "
                  :items="models['profession_parent'].items"
                  :loading="models['profession_parent'].loading"
                  item-title="name"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                />
              </div>

              <!-- Parent Company Autocomplete -->
              <div
                v-else-if="
                  field.name == 'parent_id' && entity == 'mst-companies'
                "
              >
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-autocomplete
                  v-model="form[field.name]"
                  :type="field.inputType || 'text'"
                  :placeholder="field.placeholder || field.label || ''"
                  :rules="field.rules"
                  :required="field.required || false"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  @keyup="
                    handleInput(
                      $event,
                      'company',
                      ['company_name'],
                      'mst-companies'
                    )
                  "
                  :items="
                    models['company'].items.filter(
                      (item) => item.id !== route.query.id && !item.branch
                    )
                  "
                  :loading="models['company'].loading"
                  item-title="company_name"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                />
              </div>

              <!-- Skill/Group/Paket/School/etc Autocomplete -->
              <div
                v-else-if="
                  [
                    'skill_id',
                    'group_id',
                    'paket_id',
                    'school_id',
                    'interest_id',
                    'language_id',
                    'profession_id',
                    'right_to_work_id',
                    'subscription_id',
                  ].includes(field.name)
                "
              >
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
                  rounded="lg"
                  @keyup="
                    handleInput(
                      $event,
                      `${field.name.slice(0, -3)}`,
                      ['name'],
                      `${
                        field.name == 'paket_id'
                          ? 'event'
                          : field.name != 'group_id'
                          ? 'mst'
                          : ''
                      }-${field.name.slice(0, -3)}s`
                    )
                  "
                  :items="models[`${field.name.slice(0, -3)}`].items"
                  :loading="models[`${field.name.slice(0, -3)}`].loading"
                  item-title="name"
                  item-value="id"
                  hide-no-data
                  :error-messages="errors[field.name]"
                />
              </div>

              <!-- Multiple Selection Autocomplete -->
              <div
                v-else-if="
                  [
                    'interest_ids',
                    'profession_ids',
                    'right_to_work_ids',
                  ].includes(field.name)
                "
              >
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
                  rounded="lg"
                  multiple
                  @keyup="
                    handleInput(
                      $event,
                      `${field.name.slice(0, -4)}`,
                      ['name'],
                      `mst-${field.name.slice(0, -4)}s`
                    )
                  "
                  :items="models[`${field.name.slice(0, -4)}`].items"
                  :loading="models[`${field.name.slice(0, -4)}`].loading"
                  item-title="name"
                  item-value="id"
                  hide-no-data
                  :error-messages="errors[field.name]"
                />
              </div>

              <!-- Job/Event Autocomplete -->
              <div v-else-if="['job_id', 'event_id'].includes(field.name)">
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
                  rounded="lg"
                  @keyup="
                    handleInput(
                      $event,
                      `${field.name.slice(0, -3)}`,
                      ['title'],
                      `${field.name.slice(0, -3)}s`
                    )
                  "
                  :items="models[`${field.name.slice(0, -3)}`].items"
                  :loading="models[`${field.name.slice(0, -3)}`].loading"
                  item-title="title"
                  item-value="id"
                  hide-no-data
                  clearable
                  :error-messages="errors[field.name]"
                />
              </div>

              <!-- Checkbox Field -->
              <div
                v-else-if="
                  field.name.includes('is_') || field.options?.type == 'boolean'
                "
              >
                <v-checkbox
                  v-model="form[field.name]"
                  :label="field.label"
                  density="comfortable"
                  color="success"
                  :true-value="true"
                  :false-value="false"
                  :error-messages="errors[field.name]"
                />
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
                  rounded="lg"
                  :step="field.options.type == 'int' ? '0' : '0.0000'"
                  @keyup="form[field.name] = parseFloat(form[field.name])"
                  :error-messages="errors[field.name]"
                />
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
                  rounded="lg"
                  :error-messages="errors[field.name]"
                />
              </div>

              <!-- JSON Field -->
              <div v-else-if="field.options && field.options.type === 'jsonb'">
                <label class="form-label mb-2 d-block">
                  {{ field.label }}
                  <span v-if="field.required" class="text-error">*</span>
                </label>
                <v-json-field v-model="form[field.name]" :label="field.label" />
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
                  rounded="lg"
                  :error-messages="errors[field.name]"
                />
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
                  rounded="lg"
                  rows="3"
                  :error-messages="errors[field.name]"
                  auto-grow
                />
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
                  rounded="lg"
                  :error-messages="errors[field.name]"
                />
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
                  rounded="lg"
                  :error-messages="errors[field.name]"
                />
              </div>
            </v-col>
          </v-row>

          <!-- RBAC Section -->
          <v-row
            v-if="entity == 'rbac' && mode == 'update' && form['name']"
            class="mt-4"
          >
            <v-col cols="12">
              <v-divider class="my-4"></v-divider>
              <component
                :is="formRbac"
                :rolePermission="form['name']"
                :meta="form['meta']"
                @update-menus="updateMetaMenus"
              ></component>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Form Actions -->
        <v-divider></v-divider>
        <v-card-actions class="pa-6 bg-grey-lighten-5">
          <v-spacer></v-spacer>
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
            :loading="submitLoading"
            variant="elevated"
            class="px-8"
          >
            <v-icon start>
              {{ mode === "update" ? "mdi-content-save" : "mdi-plus" }}
            </v-icon>
            {{ mode === "update" ? "Save Changes" : "Create User" }}
          </v-btn>
        </v-card-actions>
      </form>
    </v-card>

    <!-- Error Snackbar -->
    <v-snackbar
      v-model="showErrorSnackbar"
      color="error"
      timeout="5000"
      location="top"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        <div>
          <div class="font-weight-medium">Validation Error</div>
          <div
            v-for="(error, index) in providerErrors"
            :key="index"
            class="text-caption"
          >
            {{ error }}
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

<style scoped>
.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  margin-bottom: 0.5rem;
}

.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.bg-opacity-20 {
  background-color: rgba(255, 255, 255, 0.2);
}
</style>

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
const entity = ref("users");
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
    to: "/admin/masters",
  },
  {
    title: entity.value,
    disabled: false,
    to: `/admin/masters/${entity.value}`,
  },
  {
    title: "form",
    disabled: true,
    to: `/admin/masters/${entity.value}/form`,
  },
]);

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

// Function to get company_id rules dynamically based on user_role
const getCompanyIdRules = (field) => {
  const rules = [];

  // If user_role is 'company', company_id is required
  if (form.value.user_role === "company") {
    rules.push((v) => !!v || "Company is required when user role is company");
    rules.push((v) => {
      if (!v) return true;
      return (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          v
        ) || "Must be a valid UUID"
      );
    });
  } else {
    // If user_role is not 'company', company_id is optional but must be valid UUID if provided
    rules.push((v) => {
      if (!v) return true;
      return (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          v
        ) || "Must be a valid UUID"
      );
    });
  }

  return rules;
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
          initializeForm(data.items[0]); // Load existing data if in update mode
        }
      });
    }, 100);
  } else {
    initializeForm(); // Start with empty form for create mode
  }
});

// Submit handler
const submitLoading = ref(false);
const providerErrors = ref([]);
const onSubmit = async () => {
  Object.keys(errors.value).forEach((key) => {
    errors.value[key] = [];
  });

  // Set company_id to null if user_role is not 'company'
  if (form.value.user_role !== "company") {
    form.value.company_id = null;
  }

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
        // Handle nested arrays (e.g., [["company_id must be a UUID"]])
        const flatMessages = errorMessages.flat();

        Object.keys(errors.value).forEach((key) => {
          flatMessages.forEach((errMsg) => {
            const errMsgStr = Array.isArray(errMsg)
              ? errMsg.join(", ")
              : errMsg;
            if (errMsgStr.toLowerCase().includes(key.toLowerCase())) {
              if (!errors.value[key]) {
                errors.value[key] = [];
              }
              if (!errors.value[key].includes(errMsgStr)) {
                errors.value[key].push(errMsgStr);
              }
            }
          });
        });

        // If there are messages that don't match any field, add to providerErrors
        const unmatchedMessages = flatMessages.filter((errMsg) => {
          const errMsgStr = Array.isArray(errMsg) ? errMsg.join(", ") : errMsg;
          return !Object.keys(errors.value).some((key) =>
            errMsgStr.toLowerCase().includes(key.toLowerCase())
          );
        });

        if (unmatchedMessages.length > 0) {
          providerErrors.value = unmatchedMessages.map((msg) =>
            Array.isArray(msg) ? msg.join(", ") : msg
          );
          showErrorSnackbar.value = true;
        }
      } else {
        providerErrors.value = [errorMessages];
        showErrorSnackbar.value = true;
      }
    } else {
      providerErrors.value = [
        "An unexpected error occurred. Please try again.",
      ];
      showErrorSnackbar.value = true;
    }
  }
};
const updateMetaMenus = (menus) => {
  form.value["meta"] = { ...form.value["meta"], ...{ menus: menus } };
};
</script>
