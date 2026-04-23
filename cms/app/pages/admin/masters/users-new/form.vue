<template>
  <v-container fluid grid-list-md>
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
            title: 'master',
            disabled: false,
            to: '/admin/masters',
          },
          {
            title: entity,
            disabled: false,
            to: `/admin/masters/${entity}`,
          },
          {
            title: 'form',
            disabled: true,
            to: `/admin/masters/${entity}/form`,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <form @submit.prevent="onSubmit">
      <v-card-actions class="px-1 pt-0">
        {{ mode === "update" ? "Update" : "Create" }} {{ entity }}
        <v-spacer />
        <v-btn
          type="submit"
          :color="mode === 'update' ? 'primary' : 'success'"
          large
          variant="elevated"
          :loading="submitLoading"
        >
          <v-icon left>{{
            mode === "update" ? "mdi-update" : "mdi-plus"
          }}</v-icon>
          {{ mode === "update" ? "Update" : "Create" }}
        </v-btn>
      </v-card-actions>
      <v-card-text class="px-1">
        <v-row grid-list-lg dense>
          <v-col cols="12" sm="6" md="4" lg="3" v-for="n in 8" v-if="loading">
            <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
          </v-col>
          <!-- Loop through fields and conditionally render based on field type -->
          <v-col
            v-else
            v-for="field in fields"
            :key="field.name"
            :cols="12"
            :md="field.cols || 4"
            :lg="field.cols || 3"
            :sm="field.cols || 6"
          >
            <v-list-item
              class="bg-blue-lighten-5 mb-8"
              rounded="md"
              v-if="['id'].includes(field.name) && !field.options.length"
            >
              <v-list-item-subtitle style="min-height: 40px; padding-top: 5px">
                ID : {{ form[field.name] || "(auto)" }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-autocomplete
              v-else-if="field.name == 'region_id'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              @keyup="handleInputRegion"
              :items="regions"
              :loading="regionLoading"
              item-title="full_name"
              item-value="id"
              hide-no-data
              clearable
              :error-messages="errors[field.name]"
            >
            </v-autocomplete>
            <v-autocomplete
              v-else-if="field.name == 'salary_country_id'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
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
            </v-autocomplete>
            <v-autocomplete
              v-else-if="['user_id', 'following_id'].includes(field.name)"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              @keyup="handleInputUser"
              :items="users"
              :loading="userLoading"
              item-value="id"
              item-title="displayText"
              :error-messages="errors[field.name]"
              clearable
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :subtitle="item.raw.email"
                  :title="item.raw.full_name"
                ></v-list-item>
              </template>

              <!-- Custom Selection Display -->
              <template v-slot:selection="{ item, props }">
                <v-chip
                  v-if="item.raw.full_name"
                  v-bind="props"
                  color="primary"
                  class="px-1"
                  label
                  small
                >
                  {{ item.raw.full_name }} - {{ item.raw.email }}
                </v-chip>
              </template>
            </v-autocomplete>
            <v-autocomplete
              v-else-if="field.name == 'company_id'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
              class="mb-3"
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
            </v-autocomplete>
            <v-autocomplete
              v-else-if="field.name == 'industry_id'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
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
            </v-autocomplete>
            <v-autocomplete
              v-else-if="field.name == 'invoice_id'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
              density="comfortable"
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
            >
            </v-autocomplete>
            <v-autocomplete
              v-else-if="
                field.name == 'parent_id' && entity == 'mst-professions'
              "
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
              density="comfortable"
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
            >
            </v-autocomplete>
            <v-autocomplete
              v-else-if="field.name == 'parent_id' && entity == 'mst-companies'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :required="field.required || false"
              outlined
              density="comfortable"
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
            >
            </v-autocomplete>
            <v-autocomplete
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
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
              density="comfortable"
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
              class="mb-3"
            >
            </v-autocomplete>
            <v-autocomplete
              v-else-if="
                [
                  'interest_ids',
                  'profession_ids',
                  'right_to_work_ids',
                ].includes(field.name)
              "
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
              density="comfortable"
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
              class="mb-3"
            >
            </v-autocomplete>
            <v-autocomplete
              v-else-if="['job_id', 'event_id'].includes(field.name)"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder || ''"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              outlined
              density="comfortable"
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
            >
            </v-autocomplete>

            <!--BERDASARKAN TYPE DATA-->
            <v-checkbox
              v-else-if="
                field.name.includes('is_') || field.options.type == 'boolean'
              "
              v-model="form[field.name]"
              :label="field.label"
              density="comfortable"
              color="success"
              :true-value="true"
              :false-value="false"
              :error-messages="errors[field.name]"
            ></v-checkbox>
            <v-text-field
              v-else-if="
                field.options.type == 'decimal' || field.options.type == 'int'
              "
              v-model="form[field.name]"
              :label="field.label"
              type="number"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              :step="field.options.type == 'int' ? '0' : '0.0000'"
              @keyup="form[field.name] = parseFloat(form[field.name])"
              :error-messages="errors[field.name]"
            ></v-text-field>
            <v-text-field
              v-else-if="field.name.includes('date')"
              v-model="form[field.name]"
              :label="field.label"
              type="date"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              :error-messages="errors[field.name]"
            ></v-text-field>

            <v-json-field
              v-else-if="field.options && field.options.type === 'jsonb'"
              v-model="form[field.name]"
              :label="field.label"
              class="mb-8"
            />

            <v-text-field
              v-else-if="field.inputType === 'text'"
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              :error-messages="errors[field.name]"
            ></v-text-field>

            <v-textarea
              v-else-if="field.inputType === 'textarea'"
              v-model="form[field.name]"
              :label="field.label"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              rows="1"
              :error-messages="errors[field.name]"
              auto-grow
              style="white-space: pre-wrap !important; resize: vertical"
            ></v-textarea>

            <v-select
              v-else-if="field.inputType === 'select'"
              v-model="form[field.name]"
              :label="field.label"
              :items="field.enums"
              :rules="field.rules"
              clearable
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              item-title="key"
              item-value="value"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              :error-messages="errors[field.name]"
            ></v-select>

            <v-text-field
              v-else
              v-model="form[field.name]"
              :label="field.label"
              :type="field.inputType || 'text'"
              :rules="field.rules"
              :clearable="field.clearable || false"
              :required="field.required || false"
              :placeholder="field.placeholder || ''"
              outlined
              density="comfortable"
              color="primary"
              class="mb-3"
              :error-messages="errors[field.name]"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row v-if="entity == 'rbac' && mode == 'update' && form['name']">
          <v-row class="pa-1">
            <component
              :is="formRbac"
              :rolePermission="form['name']"
              :meta="form['meta']"
              @update-menus="updateMetaMenus"
            ></component>
          </v-row>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          type="submit"
          :color="mode === 'update' ? 'primary' : 'success'"
          large
          :loading="submitLoading"
          variant="elevated"
        >
          <v-icon left>{{
            mode === "update" ? "mdi-update" : "mdi-plus"
          }}</v-icon>
          {{ mode === "update" ? "Update" : "Create" }}
        </v-btn>
      </v-card-actions>
    </form>
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
const entity = ref("users");
const isShowFields = ref(false);
const loading = ref(true);

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
const updateMetaMenus = (menus) => {
  form.value["meta"] = { ...form.value["meta"], ...{ menus: menus } };
};
</script>
