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
            title: 'students',
            disabled: false,
            to: '/admin/approvals/students',
          },
          {
            title: 'edit pending student',
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
          <h3 class="font-weight-bold mb-1">Edit Pending Student</h3>
          <div class="text-grey-darken-1 text-caption">
            Update pending student verification entry
          </div>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-6">
        <v-skeleton-loader
          v-if="loading && !pendingStudent"
          type="article"
        ></v-skeleton-loader>
        <v-form v-else ref="form" v-model="formValid">
          <!-- Student Information Section -->
          <div class="mb-6">
            <div class="d-flex align-center mb-4">
              <v-icon class="mr-2" color="primary">mdi-account</v-icon>
              <h3 class="font-weight-medium">Student Information</h3>
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
                    >
                      Upload Photo
                    </v-btn>
                    <input
                      type="file"
                      ref="avatarInput"
                      accept="image/*"
                      style="display: none"
                      @change="handleAvatarUpload"
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
              <!-- Student ID -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Student ID *</small>
                </div>
                <v-text-field
                  v-model="formData.student_id"
                  placeholder="Enter student ID"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-identifier"
                  :rules="[
                    (v) => !!v || 'Student ID is required',
                    (v) => (v && v.length <= 255) || 'Max 255 characters',
                  ]"
                  required
                />
              </v-col>

              <!-- Full Name -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Full Name</small>
                </div>
                <v-text-field
                  v-model="formData.full_name"
                  placeholder="Enter full name"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-account-outline"
                  :rules="[
                    (v) => !v || v.length <= 255 || 'Max 255 characters',
                  ]"
                  :disabled="true"
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
                    (v) => !!v || 'Email is required',
                    (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
                    (v) => v.length <= 255 || 'Max 255 characters',
                  ]"
                  required
                  :disabled="true"
                />
              </v-col>

              <!-- Phone Number -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Phone Number</small>
                </div>
                <v-phone-field
                  v-model="formData.phone_num"
                  :phone-number="phoneNumber"
                  @update:phone-number="phoneNumber = $event"
                  default-country="ID"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Input phone number"
                  :rules="[(v) => !v || v.length <= 50 || 'Max 50 characters']"
                  :isSignup="false"
                  :disabled="true"
                />
              </v-col>

             
            </v-row>
          </div>

          <v-divider class="my-6"></v-divider>

          <!-- Education Information Section -->
          <div class="mb-6">
            <div class="d-flex align-center mb-4">
              <v-icon class="mr-2" color="primary">mdi-school</v-icon>
              <h3 class="font-weight-medium">Education Information</h3>
            </div>
            <v-row>
              <!-- School -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>School *</small>
                </div>
                <v-autocomplete
                  v-model="formData.school_id"
                  :items="schoolFilterItems"
                  :loading="schoolFilterLoading"
                  item-title="name"
                  item-value="id"
                  placeholder="Search and select school"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-school-outline"
                  @update:search="handleSchoolFilterSearch"
                  :rules="[(v) => !!v || 'School is required']"
                  required
                  hide-no-data
                  clearable
                />
              </v-col>

              <!-- Major -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Major *</small>
                </div>
                <v-autocomplete
                  v-model="formData.major_id"
                  :items="majorFilterItems"
                  :loading="majorFilterLoading"
                  item-title="major_name"
                  item-value="id"
                  placeholder="Search and select major"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-book-open-variant-outline"
                  @update:search="handleMajorFilterSearch"
                  @update:model-value="handleMajorChange"
                  @click:clear="handleMajorClear"
                  :rules="[(v) => !!v || 'Major is required']"
                  required
                  hide-no-data
                  clearable
                />
              </v-col>

              <!-- Degree -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Degree *</small>
                </div>
                <v-select
                  v-model="formData.degree"
                  :items="degreeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Select education degree"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-certificate-outline"
                  :rules="[(v) => !!v || 'Degree is required']"
                  required
                />
              </v-col>

              <!-- Diploma Level -->
              <v-col cols="12" md="6">
                <div class="mb-1 text-grey-darken-2">
                  <small>Diploma Level</small>
                </div>
                <v-autocomplete
                  v-model="formData.diploma_level"
                  :items="diplomaLevelOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="Select diploma level"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  prepend-inner-icon="mdi-certificate"
                  :rules="[
                    (v) =>
                      !v ||
                      (v.length >= 1 && v.length <= 50) ||
                      'Must be between 1 and 50 characters',
                  ]"
                  hint="Optional: Select diploma level (e.g., L1, L2, L3, CERT_II, etc.)"
                  persistent-hint
                  clearable
                />
              </v-col>
            </v-row>
          </div>
        </v-form>
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
          color="primary"
          rounded="lg"
          variant="elevated"
          :loading="saving"
          :disabled="!formValid || saving || !pendingStudent"
          @click="handleSubmit"
          prepend-icon="mdi-check"
        >
          Update Student
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
const saving = ref(false);
const pendingStudent = ref(null);
const phoneNumber = ref("");
const avatarInput = ref(null);
const loadingAvatar = ref(false);
const photoErrorMessage = ref("");
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

const formData = reactive({
  student_id: "",
  school_id: null,
  full_name: "",
  email: "",
  phone_num: "",
  photo_url: "",
  major_id: null,
  degree: null,
  diploma_level: "",
});

// Degree options matching EducationDegree enum
const degreeOptions = [
  { label: "S1 (Sarjana)", value: "S1" },
  { label: "S2 (Magister)", value: "S2" },
  { label: "S3 (Doktor)", value: "S3" },
  { label: "D3 (Diploma 3)", value: "D3" },
  { label: "D4 (Diploma 4)", value: "D4" },
  { label: "SMK (Sekolah Menengah Kejuruan)", value: "SMK" },
  { label: "SMA (Sekolah Menengah Atas)", value: "SMA" },
];

// Diploma level options from config
const diplomaLevelOptions = ref([]);

const schoolFilterItems = ref([]);
const schoolFilterLoading = ref(false);
const majorFilterItems = ref([]);
const majorFilterLoading = ref(false);

const fetchPendingStudent = async () => {
  loading.value = true;
  try {
    const pendingId = route.params.id;
    // Use search endpoint with id filter since GET by ID doesn't exist
    const response = await $apiFetch("/pending-student-verifications/search", {
      params: {
        id: pendingId,
        limit: 1,
      },
    });

    if (!response?.items || response.items.length === 0) {
      throw new Error("Pending student verification not found");
    }

    pendingStudent.value = response.items[0];
    const data = pendingStudent.value;

    // Populate form with existing data
    formData.student_id = data.student_id || "";
    formData.school_id = data.school_id || null;
    formData.full_name = data.full_name || "";
    formData.email = data.email || "";
    formData.phone_num = data.phone_num || "";
    formData.photo_url = data.photo_url || "";
    formData.major_id = data.major_id || null;
    formData.degree = data.degree || null;
    formData.diploma_level = data.diploma_level || "";

    // Parse phone number if exists (extract number part from full phone with country code)
    if (data.phone_num) {
      // Only parse if phone number starts with + (has country code format)
      // If phone_num contains country code like "+62 8123456789", extract the number part
      if (data.phone_num.startsWith("+")) {
        const phoneMatch = data.phone_num.match(/^(\+\d{1,4})\s*(.+)$/);
        if (phoneMatch) {
          // Has country code format, extract the number part
          phoneNumber.value = phoneMatch[2].replace(/\D/g, "");
        } else {
          // Starts with + but doesn't match expected format, use as is
          phoneNumber.value = data.phone_num.replace(/\D/g, "");
        }
      } else {
        // No country code, use the full number as is (don't truncate)
        phoneNumber.value = data.phone_num.replace(/\D/g, "");
      }
    } else {
      phoneNumber.value = "";
    }

    // Fetch school name if school_id exists
    if (data.school_id) {
      try {
        const schoolResponse = await $apiFetch("/mst-schools/search", {
          params: {
            id: data.school_id,
            limit: 1,
          },
        });
        if (schoolResponse?.items && schoolResponse.items.length > 0) {
          schoolFilterItems.value = [schoolResponse.items[0]];
        }
      } catch (error) {
        console.error("Error fetching school:", error);
      }
    }

    // Fetch major name if major_id exists
    if (data.major_id) {
      try {
        const majorResponse = await $apiFetch("/mst-majors/search", {
          params: {
            id: data.major_id,
            limit: 1,
          },
        });
        if (majorResponse?.items && majorResponse.items.length > 0) {
          majorFilterItems.value = [majorResponse.items[0]];
        }
      } catch (error) {
        console.error("Error fetching major:", error);
      }
    }
  } catch (error) {
    console.error("Error fetching pending student:", error);
    snackbar.showSnackbar({
      message: "Failed to load pending student data",
      color: "error",
    });
    router.push("/admin/approvals/students");
  } finally {
    loading.value = false;
  }
};

const handleSchoolFilterSearch = debounce(async (search) => {
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
    schoolFilterItems.value = response?.items || [];
  } catch (error) {
    console.error("Error searching schools:", error);
    schoolFilterItems.value = [];
  } finally {
    schoolFilterLoading.value = false;
  }
}, 300);

const handleMajorFilterSearch = debounce(async (search) => {
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
    majorFilterItems.value = response?.items || [];
  } catch (error) {
    console.error("Error searching majors:", error);
    majorFilterItems.value = [];
  } finally {
    majorFilterLoading.value = false;
  }
}, 300);

const handleMajorChange = (majorId) => {
  // Major selected from autocomplete
  // No additional action needed as major_id is already set
};

const handleMajorClear = () => {
  formData.major_id = null;
};

const triggerAvatarUpload = () => {
  avatarInput.value.click();
};

const handleAvatarUpload = async (event) => {
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

// Fetch diploma level options from config
const fetchDiplomaLevelOptions = async () => {
  try {
    const response = await $apiFetch("/configs/key/education_level");
    if (response && response.value && Array.isArray(response.value)) {
      diplomaLevelOptions.value = response.value.map((level) => ({
        label: level.label || level.name || level.code,
        value: level.code,
      }));
    }
  } catch (error) {
    console.error("Error loading diploma levels:", error);
    // Fallback to common diploma levels
    diplomaLevelOptions.value = [
      { label: "L1", value: "L1" },
      { label: "L2", value: "L2" },
      { label: "L3", value: "L3" },
      { label: "L4", value: "L4" },
      { label: "Certificate II", value: "CERT_II" },
      { label: "Certificate III", value: "CERT_III" },
      { label: "Certificate IV", value: "CERT_IV" },
      { label: "Diploma", value: "DIPLOMA" },
      { label: "Advanced Diploma", value: "ADV_DIPLOMA" },
    ];
  }
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    snackbar.showSnackbar({
      message: "Please fill in all required fields correctly",
      color: "warning",
    });
    return;
  }

  if (!formData.email?.trim()) {
    snackbar.showSnackbar({
      message: "Email is required",
      color: "warning",
    });
    return;
  }

  // Validate that major_id is provided
  if (!formData.major_id) {
    snackbar.showSnackbar({
      message: "Please select a major",
      color: "warning",
    });
    return;
  }

  saving.value = true;
  try {
    const pendingId = route.params.id;
    const payload = {
      student_id: formData.student_id.trim(),
      school_id: formData.school_id,
      major_id: formData.major_id,
      degree: formData.degree,
      email: formData.email.trim(),
    };

    // Add optional fields only if they have values
    if (formData.full_name?.trim()) {
      payload.full_name = formData.full_name.trim();
    }
    if (formData.phone_num?.trim()) {
      payload.phone_num = formData.phone_num.trim();
    }
    if (formData.photo_url?.trim()) {
      payload.photo_url = formData.photo_url.trim();
    }

    if (formData.diploma_level?.trim()) {
      payload.diploma_level = formData.diploma_level.trim();
    }

    await $apiFetch(`/pending-student-verifications/${pendingId}`, {
      method: "PATCH",
      body: payload,
    });

    snackbar.showSnackbar({
      message: "Pending student updated successfully!",
      color: "success",
    });

    router.push("/admin/approvals/students");
  } catch (error) {
    console.error("Error updating pending student:", error);

    let errorMessage = "Failed to update pending student";
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
        "A student with this information already exists. Please check the student ID, school, major, degree, and diploma level.";
    }

    snackbar.showSnackbar({
      message: errorMessage,
      color: "error",
    });
  } finally {
    saving.value = false;
  }
};

const goBack = () => {
  router.push("/admin/approvals/students");
};

onMounted(async () => {
  await fetchDiplomaLevelOptions();
  await fetchPendingStudent();
});
</script>

<style scoped></style>
