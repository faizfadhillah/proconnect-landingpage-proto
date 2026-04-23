<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row class="mb-1">
      <v-col cols="12">
        <v-card elevation="0" class="bg-gradient-primary rounded-lg">
          <v-card-text class="py-6">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h1 class="font-weight-bold mb-2">
                  <v-icon left size="large" class="mr-2"
                    >mdi-form-select</v-icon
                  >
                  {{ mode === "update" ? "Edit" : "Create" }} Informal
                  Certificate Mapping
                </h1>
                <p class="text-subtitle-1 opacity-90 mb-0">
                  {{
                    mode === "update"
                      ? "Update the informal certificate mapping details"
                      : "Create a new mapping for informal certificates (at least email or phone required)"
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
                <h3 class="text-h6 font-weight-medium mb-1">Mapping Details</h3>
                <p class="text-body-2 text-grey-darken-1 mb-0">
                  At least one of email or phone must be provided
                </p>
              </div>
            </div>
            <v-chip
              v-if="form.status === 'PROCESSED'"
              color="success"
              variant="flat"
              size="small"
            >
              <v-icon start size="small">mdi-check-circle</v-icon>
              Processed
            </v-chip>
            <v-chip
              v-else
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
          <v-alert
            v-if="form.status === 'PROCESSED'"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            This mapping has been processed and cannot be edited or deleted.
          </v-alert>

          <v-row>
            <!-- Email -->
            <v-col cols="12" md="6">
              <label class="form-label mb-2 d-block">
                Email
                <span class="text-caption text-grey"
                  >(Optional if phone provided)</span
                >
              </label>
              <v-text-field
                v-model="form.email"
                type="email"
                placeholder="user@example.com"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.email"
                :disabled="form.status === 'PROCESSED'"
                clearable
              >
                <template v-slot:prepend-inner>
                  <v-icon color="primary">mdi-email-outline</v-icon>
                </template>
              </v-text-field>
            </v-col>

            <!-- Phone -->
            <v-col cols="12" md="6">
              <label class="form-label mb-2 d-block">
                Phone
                <span class="text-caption text-grey"
                  >(Optional if email provided)</span
                >
              </label>
              <v-text-field
                v-model="form.phone"
                placeholder="+6281234567890"
                variant="outlined"
                density="comfortable"
                :error-messages="errors.phone"
                :disabled="form.status === 'PROCESSED'"
                maxlength="50"
                clearable
              >
                <template v-slot:prepend-inner>
                  <v-icon color="primary">mdi-phone-outline</v-icon>
                </template>
              </v-text-field>
            </v-col>

            <!-- License -->
            <v-col cols="12" md="6">
              <label class="form-label mb-2 d-block">
                License <span class="text-error">*</span>
              </label>
              <v-autocomplete
                v-model="form.license_id"
                :items="licenses"
                :loading="licenseLoading"
                item-title="license_name"
                item-value="id"
                placeholder="Search and select license"
                variant="outlined"
                density="comfortable"
                @update:search="handleLicenseSearch"
                :error-messages="errors.license_id"
                :disabled="form.status === 'PROCESSED'"
                required
                clearable
              >
                <template v-slot:prepend-inner>
                  <v-icon color="primary">mdi-certificate-outline</v-icon>
                </template>
              </v-autocomplete>
            </v-col>

            <!-- Status (Read-only for display) -->
            <v-col cols="12" md="6" v-if="mode === 'update'">
              <label class="form-label mb-2 d-block">Status</label>
              <v-text-field
                :model-value="form.status || 'UNPROCESSED'"
                readonly
                variant="outlined"
                density="comfortable"
              >
                <template v-slot:prepend-inner>
                  <v-icon color="primary">mdi-information-outline</v-icon>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Form Actions -->
        <v-card-actions class="pa-6 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn
            variant="outlined"
            color="grey"
            @click="
              $router.push('/admin/settings/mst-informal-certificate-mappings')
            "
          >
            Cancel
          </v-btn>
          <v-btn
            v-if="form.status !== 'PROCESSED'"
            type="submit"
            color="primary"
            variant="elevated"
            :loading="submitting"
            :disabled="!isFormValid"
          >
            {{ mode === "update" ? "Update" : "Create" }} Mapping
          </v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

const route = useRoute();
const router = useRouter();
const { $apiFetch } = useApi();

const mode = computed(() => (route.query.id ? "update" : "create"));
const submitting = ref(false);
const loading = ref(true);

const form = ref({
  email: "",
  phone: "",
  license_id: "",
  status: "UNPROCESSED",
});

const errors = ref({});

// Search states
const licenses = ref([]);
const licenseLoading = ref(false);

const breadcrumbItems = computed(() => [
  {
    title: "dashboard",
    disabled: false,
    to: "/admin/dashboard",
  },
  {
    title: "settings",
    disabled: false,
    to: "/admin/settings",
  },
  {
    title: "mst-informal-certificate-mappings",
    disabled: false,
    to: "/admin/settings/mst-informal-certificate-mappings",
  },
  {
    title: "form",
    disabled: true,
    to: route.path,
  },
]);

// Form validation - at least one of email or phone must be provided
const isFormValid = computed(() => {
  return (form.value.email || form.value.phone) && form.value.license_id;
});

// Search handlers
const handleLicenseSearch = async (search) => {
  if (!search || search.length < 2) {
    licenses.value = [];
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
    licenses.value = response.items || [];
  } catch (error) {
    console.error("Error searching licenses:", error);
  } finally {
    licenseLoading.value = false;
  }
};

// Load existing data for update
const loadData = async () => {
  if (!route.query.id) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const data = await $apiFetch(
      `/mst-informal-certificate-mappings/${route.query.id}`,
      {
        params: {
          expands: "license",
        },
      }
    );

    form.value = {
      email: data.email || "",
      phone: data.phone || "",
      license_id: data.license_id,
      status: data.status || "UNPROCESSED",
    };

    // Pre-populate search results
    if (data.license) {
      licenses.value = [data.license];
    }
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Failed to load mapping data");
    router.push("/admin/settings/mst-informal-certificate-mappings");
  } finally {
    loading.value = false;
  }
};

// Submit form
const onSubmit = async () => {
  if (form.value.status === "PROCESSED") {
    alert("Cannot update processed mapping");
    return;
  }

  errors.value = {};
  submitting.value = true;

  try {
    const payload = {
      license_id: form.value.license_id,
    };

    // Only include email/phone if they have values
    if (form.value.email) {
      payload.email = form.value.email;
    }
    if (form.value.phone) {
      payload.phone = form.value.phone;
    }

    if (mode.value === "update") {
      await $apiFetch(`/mst-informal-certificate-mappings/${route.query.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $apiFetch("/mst-informal-certificate-mappings", {
        method: "POST",
        body: payload,
      });
    }

    router.push("/admin/settings/mst-informal-certificate-mappings");
  } catch (error) {
    console.error("Error submitting form:", error);
    if (error.data?.message) {
      if (Array.isArray(error.data.message)) {
        error.data.message.forEach((msg) => {
          const field = msg.split(" ")[0].toLowerCase();
          errors.value[field] = msg;
        });
      } else {
        alert(error.data.message);
      }
    } else {
      alert("Failed to save mapping");
    }
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.form-label {
  font-weight: 500;
  font-size: 14px;
}
</style>
