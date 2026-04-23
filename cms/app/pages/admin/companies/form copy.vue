<template>
  <v-container grid-list-md>
    <v-row>
      <v-breadcrumbs
        class="mb-3"
        :items="[
          {
            title: 'Dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'Master',
            disabled: false,
            to: '/admin/settings/masters',
          },
          {
            title: entity,
            disabled: false,
            to: `/admin/settings/masters/${entity}`,
          },
          {
            title: 'Form',
            disabled: true,
            to: `/admin/settings/masters/${entity}/form`,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <v-card elevation="3">
      <v-card-title class="mb-3 text-center"
        >{{ mode === "update" ? "Update" : "Create" }} User</v-card-title
      >
      <v-card-text>
        <v-form ref="formRef" v-model="isFormValid" @submit.prevent="onSubmit">
          <v-row dense>
            <!-- Loop through fields and conditionally render based on field type -->
            <v-col
              v-for="field in fields"
              :key="field.name"
              :cols="12"
              :md="field.cols || 6"
            >
              <v-text-field
                v-if="field.inputType === 'text'"
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
                auto-grow
                style="white-space: pre-wrap !important; resize: vertical"
              ></v-textarea>

              <v-select
                v-else-if="field.inputType === 'select'"
                v-model="form[field.name]"
                :label="field.label"
                :items="field.enums"
                :rules="field.rules"
                :clearable="field.clearable || false"
                :required="field.required || false"
                :placeholder="field.placeholder || ''"
                outlined
                density="comfortable"
                color="primary"
                class="mb-3"
              ></v-select>

              <span v-else>{{ field.name }}</span>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <v-row>
            <v-col cols="12" class="text-right">
              <v-btn
                type="submit"
                :color="mode === 'update' ? 'primary' : 'success'"
                :disabled="!isFormValid"
                class="mx-2"
                large
                :loading="submitLoading"
              >
                <v-icon left>{{
                  mode === "update" ? "mdi-update" : "mdi-plus"
                }}</v-icon>
                {{ mode === "update" ? "Update" : "Create" }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();

const form = ref({
  id: null,
}); // Form data object
const isFormValid = ref(false); // Track form validation status
const mode = ref(route.query.id ? "update" : "create"); // Mode for the form, can be "create" or "update"
const entity = ref(route.params.entity);
const isShowFields = ref(false);

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

const loadFields = async () => {
  const items = await $apiFetch(`/fields/${entity.value}`);
  if (Array.isArray(items)) {
    items.forEach((item) => {
      console.log(item);
      fields.value.push(item);
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
    field.rules = [];
    form.value[field.name] = data && data[field.name] ? data[field.name] : ""; // Set existing data or empty
  });
};

// Initialize form based on mode
onMounted(async () => {
  await loadFields();
  if (mode.value === "update") {
    setTimeout(async () => {
      const existingData = await $apiFetch(
        `/${entity.value}/${route.query.id}`
      );
      initializeForm(existingData); // Load existing data if in update mode
    }, 100);
  } else {
    initializeForm(); // Start with empty form for create mode
  }
});

// Submit handler
const submitLoading = ref(false);
const onSubmit = async () => {
  if (isFormValid.value) {
    submitLoading.value = true;
    if (mode.value === "create") {
      await $apiFetch(`/${entity.value}`, {
        method: "POST",
        body: form.value,
      });
      console.log("Creating entry:", form.value);
      // Implement API call for creating entry
    } else {
      await $apiFetch(`/${entity.value}/${route.query.id}`, {
        method: "PATCH",
        body: form.value,
      });
      console.log("Updating entry:", form.value);
      // Implement API call for updating entry
    }
    submitLoading.value = false;
    // Optionally, redirect after form submission
    router.back();
  }
};
</script>
