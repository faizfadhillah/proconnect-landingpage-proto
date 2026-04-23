<template>
  <v-container fluid>
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
            title: 'approvals',
            disabled: false,
            to: '/admin/approvals',
          },
          {
            title: 'license-verification',
            disabled: false,
            to: '/admin/approvals/license-verification',
          },
          {
            title: 'edit certificate',
            disabled: true,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>

    <v-card
      flat
      rounded="lg"
      style="border: 1px solid #e0e0e0"
      max-width="800"
      class="mx-auto"
    >
      <v-card-title class="mb-0">
        <div>
          <h3 class="font-weight-bold mb-1">Edit Informal Certificate</h3>
          <div class="text-grey-darken-1 text-caption">
            Update informal certificate mapping entry
          </div>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-6">
        <v-alert
          v-if="mappingData?.status === 'PROCESSED'"
          type="warning"
          variant="tonal"
          class="mb-4"
          rounded="lg"
        >
          This mapping has been processed and cannot be edited or deleted.
        </v-alert>

        <v-form ref="form" v-model="formValid" v-if="!loading">
          <!-- Certificate Information Section -->
          <div class="mb-6">
            <div class="d-flex align-center mb-4">
              <v-icon class="mr-2" color="primary">mdi-certificate</v-icon>
              <h3 class="font-weight-medium">Certificate Information</h3>
            </div>
            <v-row>
              <!-- Photo Upload -->
              <v-col cols="12">
                <div class="mb-1 text-grey-darken-2">
                  <small>Photo</small>
                </div>
                <div class="d-flex">
                  <v-avatar rounded="lg" size="75" color="grey-lighten-2">
                    <v-img
                      v-if="formData.photo_url"
                      :src="`${
                        formData.photo_url.includes('http') ? '' : BASE_URL
                      }${formData.photo_url}`"
                    ></v-img>
                    <v-icon v-else size="70">mdi-account</v-icon>
                    <v-progress-circular
                      v-if="loadingAvatar"
                      indeterminate
                      color="blue"
                      style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                      "
                    ></v-progress-circular>
                  </v-avatar>
                  <div class="ml-4">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      @click="triggerAvatarUpload"
                      class="font-weight-bold"
                      width="230"
                      :disabled="mappingData?.status === 'PROCESSED'"
                    >
                      Upload Photo
                    </v-btn>
                    <input
                      type="file"
                      ref="avatarInput"
                      accept="image/*"
                      style="display: none"
                      @change="handleAvatarUpload"
                      :disabled="mappingData?.status === 'PROCESSED'"
                    />
                    <p class="text-body-2 text-grey mt-4">
                      Size recommendation: 400 x 400px
                    </p>
                  </div>
                </div>
                <v-alert
                  v-if="photoErrorMessage"
                  color="error"
                  variant="outlined"
                  class="mt-2"
                >
                  {{ photoErrorMessage }}
                </v-alert>
              </v-col>
              <!-- Name -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Name *</small>
                </div>
                <v-text-field
                  v-model="formData.name"
                  placeholder="Enter name"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-account-outline"
                  :rules="[
                    (v) => !!v || 'Name is required',
                    (v) => (v && v.length <= 255) || 'Max 255 characters',
                  ]"
                  :disabled="mappingData?.status === 'PROCESSED'"
                  required
                />
              </v-col>

              <!-- License -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>License *</small>
                </div>
                <v-autocomplete
                  v-model="formData.license_id"
                  :items="licenseOptions"
                  :loading="licenseLoading"
                  item-title="license_name"
                  item-value="id"
                  placeholder="Search and select license"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-certificate-outline"
                  @update:search="handleLicenseSearch"
                  :rules="[(v) => !!v || 'License is required']"
                  :disabled="mappingData?.status === 'PROCESSED'"
                  required
                  hide-no-data
                  clearable
                />
              </v-col>

              <!-- Email -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Email *</small>
                </div>
                <v-text-field
                  v-model="formData.email"
                  placeholder="Enter email address"
                  type="email"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-email-outline"
                  :rules="[
                    (v) => !v || /.+@.+\..+/.test(v) || 'Email must be valid',
                    (v) => !v || v.length <= 255 || 'Max 255 characters',
                  ]"
                  :disabled="mappingData?.status === 'PROCESSED'"
                />
              </v-col>

              <!-- Phone Number -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Phone Number</small>
                </div>
                <v-phone-field
                  v-model="formData.phone"
                  :phone-number="phoneNumber"
                  @update:phone-number="phoneNumber = $event"
                  default-country="ID"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Input phone number"
                  :rules="[(v) => !v || v.length <= 50 || 'Max 50 characters']"
                  :disabled="mappingData?.status === 'PROCESSED'"
                  :isSignup="false"
                />
              </v-col>

              

              <!-- Status (Read-only) -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Status</small>
                </div>
                <v-text-field
                  :model-value="mappingData?.status || 'UNPROCESSED'"
                  readonly
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-information-outline"
                />
              </v-col>
            </v-row>
          </div>
        </v-form>

        <v-skeleton-loader v-else type="article, article"></v-skeleton-loader>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          rounded="lg"
          @click="goBack"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="mappingData?.status !== 'PROCESSED'"
          color="primary"
          rounded="lg"
          variant="elevated"
          :loading="loading"
          :disabled="!formValid || loading || !isFormValid"
          @click="handleSubmit"
          prepend-icon="mdi-check"
        >
          Update Certificate
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { useSnackbarStore } from "~/stores/snackbar";
import { debounce } from "~/utils/debounce";

definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
const route = useRoute();
const router = useRouter();
const { $apiFetch } = useApi();
const snackbar = useSnackbarStore();

const form = ref(null);
const formValid = ref(false);
const loading = ref(true);
const phoneNumber = ref("");
const avatarInput = ref(null);
const loadingAvatar = ref(false);
const photoErrorMessage = ref("");
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

const formData = reactive({
  name: "",
  license_id: null,
  email: "",
  phone: "",
  photo_url: "",
});

const mappingData = ref(null);
const licenseOptions = ref([]);
const licenseLoading = ref(false);

// Form validation - at least one of email or phone must be provided
const isFormValid = computed(() => {
  const hasPhone = formData.phone || phoneNumber.value;
  return formData.name && formData.license_id && (formData.email || hasPhone);
});

const handleLicenseSearch = debounce(async (search) => {
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
}, 300);

const triggerAvatarUpload = () => {
  if (mappingData.value?.status === "PROCESSED") {
    return;
  }
  avatarInput.value.click();
};

const handleAvatarUpload = async (event) => {
  if (mappingData.value?.status === "PROCESSED") {
    return;
  }

  const file = event.target.files[0];
  if (file) {
    loadingAvatar.value = true;
    photoErrorMessage.value = "";

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("category", "profileImage");

      const postMediaResponse = await $apiFetch("/media", {
        method: "POST",
        body: formDataUpload,
      });

      formData.photo_url = postMediaResponse.path;
    } catch (error) {
      photoErrorMessage.value =
        error.message || "An error occurred while uploading the file";
      if (avatarInput.value) {
        avatarInput.value.value = "";
      }
    } finally {
      loadingAvatar.value = false;
    }
  }
};

// Load existing data
const loadData = async () => {
  const mappingId = route.params.id;
  if (!mappingId) {
    snackbar.showSnackbar({
      message: "Mapping ID not found",
      color: "error",
    });
    router.push("/admin/approvals/license-verification");
    return;
  }

  loading.value = true;
  try {
    const data = await $apiFetch(
      `/mst-informal-certificate-mappings/${mappingId}`,
      {
        params: {
          expands: "license",
        },
      }
    );

    mappingData.value = data;

    formData.name = data.name || "";
    formData.license_id = data.license_id || null;
    formData.email = data.email || "";
    formData.phone = data.phone || "";
    formData.photo_url = data.photo_url || "";

    // Set phoneNumber for v-phone-field component
    if (data.phone) {
      phoneNumber.value = data.phone;
    }

    // Pre-populate license in search results
    if (data.license) {
      licenseOptions.value = [data.license];
    }
  } catch (error) {
    console.error("Error loading mapping data:", error);
    snackbar.showSnackbar({
      message: "Failed to load mapping data",
      color: "error",
    });
    router.push("/admin/approvals/license-verification");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (mappingData.value?.status === "PROCESSED") {
    snackbar.showSnackbar({
      message: "Cannot update processed mapping",
      color: "warning",
    });
    return;
  }

  const { valid } = await form.value.validate();
  if (!valid) {
    snackbar.showSnackbar({
      message: "Please fill in all required fields correctly",
      color: "warning",
    });
    return;
  }

  // Validate that at least one of email or phone is provided
  // Check both formData.phone and phoneNumber.value (v-phone-field might update either)
  const hasPhone = formData.phone?.trim() || phoneNumber.value?.trim();
  if (!formData.email?.trim() && !hasPhone) {
    snackbar.showSnackbar({
      message: "Either email or phone must be provided",
      color: "warning",
    });
    return;
  }

  // Validate that license_id is provided
  if (!formData.license_id) {
    snackbar.showSnackbar({
      message: "Please select a license",
      color: "warning",
    });
    return;
  }

  loading.value = true;
  try {
    const payload = {
      name: formData.name.trim(),
      license_id: formData.license_id,
    };

    // Add optional fields only if they have values
    if (formData.email?.trim()) {
      payload.email = formData.email.trim();
    } else {
      payload.email = null;
    }
    // Use phoneNumber.value if formData.phone is empty (v-phone-field might update phoneNumber instead)
    const phoneValue = formData.phone?.trim() || phoneNumber.value?.trim();
    if (phoneValue) {
      payload.phone = phoneValue;
    } else {
      payload.phone = null;
    }
    if (formData.photo_url?.trim()) {
      payload.photo_url = formData.photo_url.trim();
    } else {
      payload.photo_url = null;
    }

    await $apiFetch(`/mst-informal-certificate-mappings/${route.params.id}`, {
      method: "PUT",
      body: payload,
    });

    snackbar.showSnackbar({
      message: "Certificate mapping updated successfully!",
      color: "success",
    });

    router.push("/admin/approvals/license-verification");
  } catch (error) {
    console.error("Error updating certificate mapping:", error);

    let errorMessage = "Failed to update certificate mapping";
    if (error.data?.message) {
      errorMessage = error.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle duplicate entry error
    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("duplicate")
    ) {
      errorMessage =
        "A mapping with this email/phone and license combination already exists.";
    }

    snackbar.showSnackbar({
      message: errorMessage,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/admin/approvals/license-verification");
};

onMounted(() => {
  loadData();
});
</script>

<style scoped></style>
