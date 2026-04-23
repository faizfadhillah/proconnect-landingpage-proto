<template>
  <v-container fluid>
    <v-row>
      <v-breadcrumbs
        class="mb-3 text-caption"
        :items="[
          { title: 'dashboard', disabled: false, to: '/admin/dashboard' },
          { title: 'approvals', disabled: false, to: '/admin/approvals' },
          {
            title: 'students',
            disabled: false,
            to: '/admin/approvals/students',
          },
          { title: 'edit education', disabled: true },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>

    <v-card
      flat
      rounded="lg"
      style="border: 1px solid #e0e0e0"
      class="mx-auto"
      max-width="800"
    >
      <v-card-title class="mb-4">
        <div>
          <h2 class="font-weight-bold mb-1">Edit User Education</h2>
          <div class="text-grey-darken-1 text-caption">
            Update student education information (including Student ID)
          </div>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-6">
        <!-- User Info -->
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-2" color="primary">mdi-account</v-icon>
          <h3 class="font-weight-medium">Student Information</h3>
        </div>
        <div v-if="userEducation" class="mb-8">
          <v-skeleton-loader v-if="userLoading" type="avatar, text" />
          <div v-else class="d-flex align-center">
            <v-avatar size="56" class="mr-3 bg-grey">
              <v-img
                v-if="user?.photo_url"
                :src="BASE_URL + user.photo_url"
                cover
              ></v-img>
              <v-icon v-else size="28" color="grey">mdi-account-circle</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-bold">
                {{ user?.full_name || "-" }}
              </div>
              <div class="text-caption text-grey-darken-1">
                {{ user?.email || "-" }}
              </div>
            </div>
          </div>
        </div>

        <v-form ref="form" v-model="formValid" v-if="userEducation">
          <v-row>
            <!-- Student ID -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.student_id"
                label="Student ID"
                placeholder="Enter student ID"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                prepend-inner-icon="mdi-identifier"
                :rules="[(v) => !v || v.length <= 255 || 'Max 255 characters']"
              />
            </v-col>
          </v-row>
          <v-divider class="my-6"></v-divider>
          <div class="d-flex align-center mb-6">
            <v-icon class="mr-2" color="primary">mdi-school</v-icon>
            <h3 class="font-weight-medium">Education Information</h3>
          </div>
          <v-row>

            <!-- School -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.school_id"
                :items="schoolFilterItems"
                :loading="schoolFilterLoading"
                item-title="name"
                item-value="id"
                label="School *"
                placeholder="Search school"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                @update:search="handleSchoolFilterSearch"
                :rules="[
                  (v) =>
                    !!v || !!formData.institution_name || 'School is required',
                ]"
                hide-no-data
              />
              <v-text-field
                v-if="!formData.school_id"
                v-model="formData.institution_name"
                label="School Name (Free Text)"
                placeholder="Enter school name"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                class="mt-2"
                :rules="[
                  (v) =>
                    !!v || !!formData.school_id || 'School name is required',
                ]"
              />
            </v-col>

            <!-- Major -->
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="formData.major_id"
                :items="majorFilterItems"
                :loading="majorFilterLoading"
                item-title="major_name"
                item-value="id"
                label="Major *"
                placeholder="Search major"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                @update:search="handleMajorFilterSearch"
                @update:model-value="handleMajorChange"
                hide-no-data
              />
              
            </v-col>
            <!-- Degree -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.education_degree"
                :items="degreeOptions"
                item-title="label"
                item-value="value"
                label="Degree *"
                placeholder="Select degree"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :rules="[(v) => !!v || 'Degree is required']"
                required
              />
            </v-col>

            <!-- Diploma Level -->
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.diploma_level"
                :items="diplomaLevelOptions"
                item-title="label"
                item-value="value"
                label="Diploma Level (Optional)"
                placeholder="Select diploma level"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                clearable
              />
            </v-col>

          </v-row>  
          <v-divider class="my-6"></v-divider>
          <div class="d-flex align-center mb-6">
            <v-icon class="mr-2" color="primary">mdi-information-outline</v-icon>
            <h3 class="font-weight-medium">Education Details</h3>
          </div>
          <v-row> 
            

            <!-- Inside / Outside Indonesia -->
            <v-col cols="12">
              <v-switch
                v-model="formData.is_outside_indo"
                label="Outside Indonesia?"
                color="primary"
                hide-details
                density="comfortable"
              />
            </v-col>

            <!-- Region or Country / City -->
            <template v-if="!formData.is_outside_indo">
              <v-col cols="12" class="py-0">
                <div class="text-grey-darken-2 mb-1">
                  <small>City</small>
                </div>
                <v-autocomplete
                  v-model="formData.region_id"
                  :items="regions"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Insert 3 characters or more to search"
                  rounded="lg"
                  :loading="regionLoading"
                  @update:search="searchCities"
                />
              </v-col>
            </template>
            <template v-else>
              <v-col cols="12" class="py-0">
                <div class="text-grey-darken-2 mb-1">
                  <small>Country</small>
                </div>
                <v-text-field
                  v-model="formData.other_country"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Input country"
                  rounded="lg"
                />
              </v-col>
              <v-col cols="12" class="py-0">
                <div class="text-grey-darken-2 mb-1">
                  <small>City</small>
                </div>
                <v-text-field
                  v-model="formData.other_region"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Input city"
                  rounded="lg"
                />
              </v-col>
            </template>

            <!-- Is Current -->
            <v-col cols="12" class="pt-0">
              <v-switch
                v-model="formData.is_current"
                label="I'm Still Enrolling?"
                color="primary"
                hide-details
                density="comfortable"
                @change="handleIsCurrentChange"
              />
            </v-col>

            <!-- Start Date / End Date -->
            <v-col cols="12" sm="6" class="py-0">
              <div class="text-grey-darken-2 mb-1">
                <small>Start Date *</small>
              </div>
              <v-text-date
                v-model="formData.start_date"
                type="date"
                variant="outlined"
                density="comfortable"
                placeholder="Start of enrollment"
                rounded="lg"
              />
            </v-col>

            <v-col cols="12" sm="6" class="py-0">
              <div class="text-grey-darken-2 mb-1">
                <small>End Date {{ formData.is_current ? "" : "*" }}</small>
              </div>
              <v-text-date
                v-model="formData.end_date"
                type="date"
                variant="outlined"
                density="comfortable"
                placeholder="End of enrollment"
                :disabled="formData.is_current"
                rounded="lg"
              />
            </v-col>

            <!-- Certificate Number -->
            <v-col cols="12" class="py-0">
              <div class="text-grey-darken-2 mb-1">
                <small>Diploma/Certificate Number (optional)</small>
              </div>
              <v-text-field
                v-model="formData.certificate_number"
                variant="outlined"
                density="comfortable"
                placeholder="Input diploma/certificate number"
                rounded="lg"
              />
            </v-col>

            <!-- Upload Diploma -->
            <v-col cols="12" class="py-0">
              <div class="text-grey-darken-2 mb-1">
                <small>Upload Diploma (optional)</small>
              </div>
              <v-file-upload
                v-model="formData.file_url"
                category="user_education"
                accept=".pdf"
                class="mb-4"
                placeholder="Upload bachelor certificate (in PDF)"
              />
            </v-col>

            <!-- Curriculum Year -->
            <v-col cols="12" class="py-0">
              <div class="text-grey-darken-2 mb-1">
                <small>Curriculum Year (optional)</small>
              </div>
              <v-select
                v-model="formData.curriculum_year"
                :items="yearOptions"
                variant="outlined"
                density="comfortable"
                placeholder="Select curriculum year"
                rounded="lg"
                clearable
              />
            </v-col>
          </v-row>
        </v-form>
        <v-skeleton-loader v-else type="article"></v-skeleton-loader>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="outlined" color="grey" rounded="lg" @click="goBack">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          rounded="lg"
          variant="elevated"
          :loading="loading"
          :disabled="!formValid || !userEducation"
          @click="handleSubmit"
        >
          Save Changes
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
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

const form = ref(null);
const formValid = ref(false);
const loading = ref(false);
const userEducation = ref(null);
const user = ref(null);
const userLoading = ref(true);

const degreeOptions = [
  { label: "S1", value: "S1" },
  { label: "S2", value: "S2" },
  { label: "S3", value: "S3" },
  { label: "D3", value: "D3" },
  { label: "D4", value: "D4" },
  { label: "SMK", value: "SMK" },
  { label: "SMA", value: "SMA" },
];

const formData = reactive({
  student_id: "",
  education_degree: null,
  diploma_level: "",
  school_id: null,
  institution_name: "",
  major_id: null,
  major: "",
  region_id: null,
  is_outside_indo: false,
  other_country: "",
  other_region: "",
  start_date: "",
  end_date: "",
  is_current: false,
  file_url: "",
  certificate_number: "",
  curriculum_year: null,
});

const schoolFilterItems = ref([]);
const schoolFilterLoading = ref(false);
const majorFilterItems = ref([]);
const majorFilterLoading = ref(false);

const diplomaLevelOptions = ref([]);
const yearOptions = ref([]);

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

const fetchUserEducation = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const educationResponse = await $apiFetch("/user-educations/search", {
      params: {
        id,
        limit: 1,
      },
    });

    if (!educationResponse?.items || educationResponse.items.length === 0) {
      snackbar.showSnackbar({
        message: "User education not found",
        color: "error",
      });
      router.push("/admin/approvals/students");
      return;
    }

    const educationData = educationResponse.items[0];
    userEducation.value = educationData;
    user.value = null;

    formData.student_id = educationData.student_id || "";
    formData.education_degree = educationData.education_degree || null;
    formData.diploma_level = educationData.diploma_level || "";
    formData.school_id = educationData.school_id || null;
    formData.institution_name = educationData.institution_name || "";
    formData.major_id = educationData.major_id || null;
    formData.major = educationData.major || "";
    formData.region_id = educationData.region_id || null;
    formData.is_outside_indo = educationData.is_outside_indo || false;
    formData.other_country = educationData.other_country || "";
    formData.other_region = educationData.other_region || "";
    formData.start_date = educationData.start_date || "";
    formData.end_date = educationData.end_date || "";
    formData.is_current = educationData.is_current || false;
    formData.file_url = educationData.file_url || "";
    formData.certificate_number = educationData.certificate_number || "";
    formData.curriculum_year = educationData.curriculum_year || null;

    if (educationData.school_id) {
      try {
        const schoolResponse = await $apiFetch("/mst-schools/search", {
          params: {
            id: educationData.school_id,
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

    if (educationData.major_id) {
      try {
        const majorResponse = await $apiFetch("/mst-majors/search", {
          params: {
            id: educationData.major_id,
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

    // Fetch region data if region_id exists
    if (educationData.region_id && !educationData.is_outside_indo) {
      try {
        await fetchRegions(educationData.region_id, "id");
      } catch (error) {
        console.error("Error fetching region:", error);
      }
    }

    // Fetch user info (for header card)
    if (educationData.user_id) {
      await fetchUserById(educationData.user_id);
    }
  } catch (error) {
    console.error("Error fetching user education:", error);
    snackbar.showSnackbar({
      message: "Failed to load education data",
      color: "error",
    });
    router.push("/admin/approvals/students");
  } finally {
    loading.value = false;
  }
};

const fetchUserById = async (userId) => {
  userLoading.value = true;
  try {
    const response = await $apiFetch("/users/search", {
      params: {
        filters: { id: userId },
        limit: 1,
      },
    });
    user.value = response?.items?.[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    user.value = null;
  } finally {
    userLoading.value = false;
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
  if (majorId) {
    const selectedMajor = majorFilterItems.value.find((m) => m.id === majorId);
    if (selectedMajor) {
      formData.major = selectedMajor.major_name;
    }
  } else {
    formData.major = "";
  }
};

const handleIsCurrentChange = () => {
  if (formData.is_current) {
    formData.end_date = "";
    formData.file_url = "";
    formData.certificate_number = "";
  }
};

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
  }
};

const fetchYearOptions = async () => {
  try {
    const response = await $apiFetch("/configs/key/education_curriculum_year");
    if (response && response.value && Array.isArray(response.value)) {
      yearOptions.value = response.value;
    }
  } catch (error) {
    console.error("Error loading curriculum years:", error);
  }
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const id = route.params.id;
    const payload = {
      student_id: formData.student_id || null,
      education_degree: formData.education_degree,
      school_id: formData.school_id || null,
      institution_name: formData.institution_name || null,
      major: formData.major,
      major_id: formData.major_id || null,
      region_id: formData.region_id || null,
      is_outside_indo: formData.is_outside_indo,
      other_country: formData.other_country || null,
      other_region: formData.other_region || null,
      start_date: formData.start_date || null,
      end_date: formData.is_current ? null : formData.end_date || null,
      is_current: formData.is_current,
      file_url: formData.file_url || null,
      certificate_number: formData.certificate_number || null,
      curriculum_year: formData.curriculum_year || null,
    };

    if (formData.diploma_level) {
      payload.diploma_level = formData.diploma_level;
    }

    await $apiFetch(`/user-educations/${id}`, {
      method: "PATCH",
      body: payload,
    });

    snackbar.showSnackbar({
      message: "Education updated successfully!",
      color: "success",
    });

    router.push("/admin/approvals/students");
  } catch (error) {
    console.error("Error updating education:", error);
    snackbar.showSnackbar({
      message:
        "Failed to update education: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/admin/approvals/students");
};

onMounted(async () => {
  await fetchDiplomaLevelOptions();
  await fetchYearOptions();
  await fetchUserEducation();
});
</script>

<style scoped></style>
