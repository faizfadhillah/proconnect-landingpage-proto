<template>
  <v-container class="pa-2">
    <v-card elevation="0" rounded="xl" class="pa-2">
      <v-card-text>
        <v-row>
          <v-col cols="12" v-if="!isFillment">
            <h2>Education History</h2>
            <p class="text-grey mb-5">Describe your past education</p>
          </v-col>
          <v-col cols="12">
            <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
              <v-row>
                <template
                  v-for="(e, index) in educationHistory.items"
                  :key="index"
                >
                  <v-divider v-if="index > 0"></v-divider>
                  <v-col
                    cols="12"
                    :class="index % 2 == 0 ? '' : 'bg-grey-lighten-5'"
                  >
                    <v-row>
                      <v-col cols="12" v-if="index > 0">
                        <div class="d-flex align-center gap-2">
                          <h3>Education {{ index + 1 }}</h3>
                          <VerifiedBadge :is-verified="e.is_verified" />
                        </div>
                      </v-col>
                      <v-col cols="12" v-else>
                        <div class="d-flex align-center gap-2">
                          <h3>Education</h3>
                          <VerifiedBadge :is-verified="e.is_verified" />
                        </div>
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Degree *</small>
                        </div>
                        <v-select
                          v-model="e.education_degree"
                          :items="degrees"
                          item-title="label"
                          item-value="name"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Choose from one below"
                          :error-messages="errors.education_degree"
                          :rules="[(v) => !!v || 'Degree is required']"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                        />
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>School Name *</small>
                        </div>
                        <v-text-field
                          v-if="e.school_id == null && e.institution_name"
                          v-model="e.institution_name"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input your school name"
                          :clearable="!e.is_verified"
                          @click:clear="
                            e.school_id = null;
                            e.institution_name = null;
                          "
                          :rules="[(v) => !!v || 'School name is required']"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                        />
                        <v-autocomplete
                          v-else
                          v-model="e.school_id"
                          :items="models.school.items"
                          item-title="name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input your school name to show options"
                          :error-messages="errors.school_id"
                          :rules="[
                            (v) =>
                              !!v ||
                              !!e.institution_name ||
                              'School name is required',
                          ]"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                          @update:search="
                            (searchValue) => {
                              handleSchoolSearch(searchValue, e);
                              handleInput(
                                searchValue,
                                'school',
                                ['name'],
                                'mst-schools'
                              );
                            }
                          "
                          :loading="models.school.loading"
                          :clearable="!e.is_verified"
                          @click:clear="
                            e.school_id = null;
                            e.institution_name = null;
                            const index = educationHistory.items.indexOf(e);
                            if (index !== -1) {
                              schoolSearchValues[index] = null;
                            }
                          "
                          @update:model-value="handleChangeSchool($event, e)"
                          @blur="handleBlurSchool($event, e)"
                        />
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Major *</small>
                        </div>
                        <v-text-field
                          v-if="e.major_id == null && e.major"
                          v-model="e.major"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Enter your major"
                          :clearable="!e.is_verified"
                          @click:clear="
                            e.major_id = null;
                            e.major = null;
                          "
                          :error-messages="errors.major"
                          :rules="[(v) => !!v || 'Major is required']"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                        />
                        <v-autocomplete
                          v-else
                          v-model="e.major_id"
                          :items="models.major.items"
                          item-title="major_name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input your major to show options"
                          :error-messages="errors.major"
                          :rules="[
                            (v) => !!v || !!e.major || 'Major is required',
                          ]"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                          @update:search="
                            (searchValue) => {
                              handleMajorSearch(searchValue, e);
                              handleInput(
                                searchValue,
                                'major',
                                ['major_name'],
                                'mst-majors'
                              );
                            }
                          "
                          :loading="models.major.loading"
                          :clearable="!e.is_verified"
                          @click:clear="
                            e.major_id = null;
                            e.major = null;
                            const index = educationHistory.items.indexOf(e);
                            if (index !== -1) {
                              majorSearchValues[index] = null;
                            }
                          "
                          @update:model-value="handleChangeMajor($event, e)"
                          @blur="handleBlurMajor($event, e)"
                        />
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <v-switch
                          v-model="e.is_outside_indo"
                          label="Outside Indonesia?"
                          color="primary"
                          hide-details
                          density="comfortable"
                          :disabled="e.is_verified"
                        />
                      </v-col>

                      <template v-if="!e.is_outside_indo">
                        <v-col cols="12" class="py-0">
                          <div class="text-grey-darken-2 mb-1">
                            <small>City</small>
                          </div>
                          <v-autocomplete
                            v-model="e.region_id"
                            :items="regions"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="comfortable"
                            placeholder="Insert 3 characters or more to search"
                            :error-messages="errors.region_id"
                            @update:search="searchCities"
                            :readonly="e.is_verified"
                            
                            rounded="lg"
                            :loading="regionLoading"
                          />
                        </v-col>
                      </template>
                      <template v-else>
                        <v-col cols="12" class="py-0">
                          <div class="text-grey-darken-2 mb-1">
                            <small>Country</small>
                          </div>
                          <v-text-field
                            v-model="e.other_country"
                            variant="outlined"
                            density="comfortable"
                            placeholder="Input country"
                            :rules="[(v) => !!v || 'Country is required']"
                            :readonly="e.is_verified"
                            
                            rounded="lg"
                          />
                        </v-col>
                        <v-col cols="12" class="py-0">
                          <div class="text-grey-darken-2 mb-1">
                            <small>City</small>
                          </div>
                          <v-text-field
                            v-model="e.other_region"
                            variant="outlined"
                            density="comfortable"
                            placeholder="Input city"
                            :rules="[(v) => !!v || 'City is required']"
                            :readonly="e.is_verified"
                            
                            rounded="lg"
                          />
                        </v-col>
                      </template>

                      <v-col cols="12" class="pt-0">
                        <v-switch
                          v-model="e.is_current"
                          label="I'm Still Enrolling?"
                          color="primary"
                          hide-details
                          density="comfortable"
                          :disabled="e.is_verified"
                          @change="handleIsCurrentChange(e)"
                        />
                      </v-col>

                      <v-col cols="12" sm="6" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Start Date *</small>
                        </div>
                        <v-text-date
                          v-model="e.start_date"
                          type="date"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Start of enrollment"
                          :error-messages="errors.start_date"
                          :rules="[
                            (v) => !!v || 'Start year is required',
                            (v) => isValidDate(v) || 'Invalid date format',
                          ]"
                          :disabled="e.is_verified"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" sm="6" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>End Date {{ e.is_current ? "" : "*" }}</small>
                        </div>
                        <v-text-date
                          v-model="e.end_date"
                          type="date"
                          variant="outlined"
                          density="comfortable"
                          placeholder="End of enrollment"
                          :disabled="e.is_current || e.is_verified"
                          :error-messages="errors.end_date"
                          :rules="[
                            (v) =>
                              e.is_verified ||
                              e.is_current ||
                              !!v ||
                              'End year is required',
                            (v) =>
                              e.is_verified ||
                              !v ||
                              isValidDate(v) ||
                              'Invalid date format',
                            (v) =>
                              e.is_verified ||
                              !v ||
                              isEndDateValid(e.start_date, v) ||
                              'End year must be after start year',
                          ]"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Student ID (optional)</small>
                        </div>
                        <v-text-field
                          v-model="e.student_id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input your student ID for verification"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Diploma/Certificate Number (optional)</small>
                        </div>
                        <v-text-field
                          v-model="e.certificate_number"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input your diploma/certificate number for verification"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small
                            >Diploma Level (optional) *only for MRA-TP approved
                            Schools</small
                          >
                        </div>
                        <v-select
                          v-model="e.diploma_level"
                          :items="diplomaLevelOptions"
                          item-title="label"
                          item-value="value"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Select diploma level"
                          :readonly="e.is_verified"
                          
                          rounded="lg"
                          :clearable="!e.is_verified"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Upload Diploma (optional)</small>
                        </div>
                        <v-file-upload
                          v-model="e.file_url"
                          category="user_education"
                          accept=".pdf"
                          class="mb-4"
                          :user-id="me.id"
                          :disabled="e.is_verified"
                          placeholder="Upload bachelor certificate (in PDF)"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Curriculum Year (optional)</small>
                        </div>
                        <v-select
                          v-model="e.curriculum_year"
                          :items="yearOptions"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Select curriculum year"
                          :readonly="e.is_verified"                          
                          rounded="lg"
                          :clearable="!e.is_verified"
                        />
                      </v-col>

                      <v-col cols="12" class="d-flex justify-end mb-3">
                        <v-btn
                          variant="outlined"
                          color="error"
                          size="small"
                          class="font-weight-bold"
                          :disabled="e.is_verified"
                          @click="removeEducation(index)"
                          >DELETE</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-col>
                </template>
              </v-row>

              <v-row>
                <v-col cols="12" class="my-5">
                  <v-btn
                    block
                    variant="outlined"
                    color="primary"
                    size="large"
                    rounded="lg"
                    prepend-icon="mdi-plus"
                    @click="addEducation"
                    class="font-weight-bold"
                    >ADD EDUCATION</v-btn
                  >
                </v-col>
                <v-col cols="12" class="mt-5 d-flex justify-space-between">
                  <v-row>
                    <v-col cols="4">
                      <v-btn
                        v-if="!isFillment"
                        block
                        color="primary"
                        class="mb-4"
                        size="large"
                        rounded="lg"
                        variant="outlined"
                        @click="handleBack"
                      >
                        Back
                      </v-btn>
                    </v-col>
                    <v-col cols="4"></v-col>
                    <v-col cols="4">
                      <v-btn
                        block
                        color="primary"
                        size="large"
                        rounded="lg"
                        type="submit"
                        :loading="loadingSubmit"
                      >
                        {{ route.query.edit || isFillment ? "Save" : "Next" }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-dialog v-model="loadingInitial" persistent width="auto" max-width="200">
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
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "wizard-candidate",
  middleware: ["auth"],
});

const props = defineProps({
  isFillment: {
    type: Boolean,
    default: false,
  },
});

const { $apiFetch } = useApi();
const router = useRouter();
const snackbar = useSnackbarStore();
const loading = ref(false);
const currentIndex = ref(null);
const errorMessage = ref("");
const { me, fetchMe } = useUser();
const educationHistory = ref({
  items: [],
  loading: false,
});
const currentEducation = ref({
  user_id: me.value.id,
  institution_name: null,
  school_id: null,
  major: null,
  major_id: null,
  education_degree: null,
  region_id: null,
  is_outside_indo: false,
  other_country: null,
  other_region: null,
  school_id: null,
  start_date: null,
  end_date: null,
  is_current: false,
  file_url: null,
  diploma_level: null,
});
const errors = ref({
  education_degree: "",
  school_id: "",
  major: "",
  institution_name: "",
  region_id: "",
  start_date: "",
  end_date: "",
  other_country: "",
  other_region: "",
});

const degrees = useState("degrees", () => []);

// Add year options for curriculum year picker
const yearOptions = ref([]);
const fetchYearOptions = async () => {
  const response = await $apiFetch("/configs/key/education_curriculum_year");
  yearOptions.value = response.value;
};

// Add diploma level options
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

const fetchDegrees = async () => {
  const response = await $apiFetch("/configs/key/education_degree");
  degrees.value = response.value;
};

const { models, debouncedFetch, fetch } = useDynamicSearch(["school", "major"]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
};

const handleChangeSchool = (newSchoolId, e) => {
  if (newSchoolId) {
    const selectedSchool = models.value.school.items.find(
      (item) => item.id === newSchoolId
    );
    if (selectedSchool) {
      e.institution_name = selectedSchool.name;
      e.school_id = selectedSchool.id;
      if (selectedSchool.region_id) {
        e.region_id = selectedSchool.region_id;
        fetchRegions(selectedSchool.region_id, "id");
      }
      // Clear search value after selection
      const index = educationHistory.value.items.indexOf(e);
      if (index !== -1) {
        schoolSearchValues.value[index] = null;
      }
    }
  } else {
    // If school_id is cleared, keep the custom value if it exists
    if (e.institution_name) {
      e.school_id = null;
      e.region_id = null;
    }
  }
};

const loadingInitial = ref(false);
const fetchEducations = async () => {
  loadingInitial.value = true;
  resetCurrentEducation();
  educationHistory.value.loading = true;
  try {
    // Step 1: Sync pending students to user educations in database
    // Handles Case 2 (update existing) and Case 3 (auto-insert new)
    // Semua update dilakukan di database, bukan hanya di form
    try {
      await $apiFetch("/user-educations/sync-pending-students", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error syncing pending students:", error);
      // Continue even if sync fails
    }

    // Step 2: Fetch existing user educations (sudah ter-update dan ter-insert dari sync)
    const response = await $apiFetch("/user-educations/search", {
      params: {
        filters: {
          user_id: me.value.id,
        },
      },
    });
    educationHistory.value.items = response.items;

    // If no educations at all, add empty one
    if (educationHistory.value.items.length <= 0) {
      educationHistory.value.items.push(
        JSON.parse(JSON.stringify(currentEducation.value))
      );
    }

    // Fetch related data for all educations
    educationHistory.value.items.forEach((career) => {
      if (career.school_id) {
        fetch("school", career.school_id, ["id"], "mst-schools");
      }
      if (career.major_id) {
        fetch("major", career.major_id, ["id"], "mst-majors");
      }
      if (career.region_id) {
        fetchRegions(career.region_id, ["id"]);
      }
    });
  } catch (error) {
    console.error("Error fetching education history:", error);
  } finally {
    educationHistory.value.loading = false;
    loadingInitial.value = false;
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  await fetchEducations();
  await fetchDegrees();
  await fetchYearOptions();
  await fetchDiplomaLevelOptions();
});

const loadingAddEducation = ref(false);
const addEducation = async () => {
  resetCurrentEducation();
  educationHistory.value.items.push(
    JSON.parse(JSON.stringify(currentEducation.value))
  );
};

const removeEducationIds = ref([]);
const removeEducations = async () => {
  removeEducationIds.value.forEach(async (id) => {
    await $apiFetch(`/user-educations/${id}`, {
      method: "DELETE",
    });
  });
};

const dialog = useDialogStore();
const removeEducation = async (index) => {
  const education = educationHistory.value.items[index];

  // Prevent deletion of verified education
  if (education.is_verified) {
    snackbar.showSnackbar({
      message: "Cannot delete verified education",
      color: "error",
    });
    return;
  }

  try {
    await dialog.openDialog({
      title: "Delete Education",
      message: "Are you sure you want to delete this education?",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
    });

    const id = educationHistory.value.items[index].id;
    if (id) {
      removeEducationIds.value.push(id);
    }
    educationHistory.value.items.splice(index, 1);
  } catch {
    console.log("Delete cancelled");
  }
};

const editEducation = async (education) => {
  loadingAddEducation.value = true;
  try {
    await $apiFetch(`/user-educations/${education.id}`, {
      method: "PATCH",
      body: education,
    });
    await fetchEducations();
  } catch (error) {
    console.error("Error editing education:", error);
    showErrorField(error.response._data.message);
  } finally {
    loadingAddEducation.value = false;
  }
};

const form = ref(null);
const loadingSubmit = ref(false);
const handleSubmit = async () => {
  const { valid, errors } = await form.value.validate();
  if (!valid) {
    return;
  }

  // Additional validation for school and major
  for (let i = 0; i < educationHistory.value.items.length; i++) {
    const education = educationHistory.value.items[i];
    if (!education.school_id && !education.institution_name) {
      errors.value.school_id = "School name is required";
      return;
    }
    if (!education.major_id && !education.major) {
      errors.value.major = "Major is required";
      return;
    }
  }

  loadingSubmit.value = true;
  errors.value = {
    education_degree: "",
    school_id: "",
    major: "",
    start_date: "",
    end_date: "",
    file_url: "",
  };

  try {
    // Save all educations (exclude verified ones)
    const educationsToSave = educationHistory.value.items.filter(
      (career) => career.education_degree && career.is_verified !== true
    );
    for (const education of educationsToSave) {
      // Ensure data consistency: if school_id exists, use it; otherwise use institution_name
      const educationData = {
        ...education,
        user_id: me.value.id,
      };

      // Clean up school data: if school_id is null, ensure it's explicitly null
      // If school_id exists, ensure institution_name matches the selected school
      if (education.school_id) {
        let selectedSchool = models.value.school.items.find(
          (item) => item.id === education.school_id
        );
        // If school not found in models, fetch it first
        if (!selectedSchool) {
          await fetch("school", education.school_id, ["id"], "mst-schools");
          selectedSchool = models.value.school.items.find(
            (item) => item.id === education.school_id
          );
        }
        if (selectedSchool) {
          educationData.institution_name = selectedSchool.name;
          educationData.school_id = selectedSchool.id;
        }
      } else {
        // Explicitly set school_id to null if using free text
        educationData.school_id = null;
        // Ensure institution_name is set for free text
        if (!educationData.institution_name) {
          educationData.institution_name = education.institution_name || "";
        }
      }

      // Clean up major data: if major_id is null, ensure it's explicitly null
      // If major_id exists, ensure major matches the selected major
      if (education.major_id) {
        let selectedMajor = models.value.major.items.find(
          (item) => item.id === education.major_id
        );
        // If major not found in models, fetch it first
        if (!selectedMajor) {
          await fetch("major", education.major_id, ["id"], "mst-majors");
          selectedMajor = models.value.major.items.find(
            (item) => item.id === education.major_id
          );
        }
        if (selectedMajor) {
          educationData.major = selectedMajor.major_name;
          educationData.major_id = selectedMajor.id;
        }
      } else {
        // Explicitly set major_id to null if using free text
        educationData.major_id = null;
        // Ensure major is set for free text
        if (!educationData.major) {
          educationData.major = education.major || "";
        }
      }

      if (education.id) {
        await $apiFetch(`/user-educations/${education.id}`, {
          method: "PATCH",
          body: educationData,
        });
      } else {
        await $apiFetch("/user-educations", {
          method: "POST",
          body: educationData,
        });
      }
    }

    // Remove deleted educations
    await removeEducations();
    const index = me.value.wizard_state.findIndex((item) => item.id == 3);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        educationHistory.value.items.length > 0 ? 1 : 0;
    }
    $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 3 ? me.value.last_wizard_state : 4,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to save education history";
    showErrorField(error.response?._data?.message);
    console.log("error", error);
  } finally {
    loadingSubmit.value = false;
  }
};
const route = useRoute();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Education history updated successfully",
    color: "success",
  });
  if (props.isFillment) {
    router.back();
    return;
  }
  if (route.query.edit) {
    const authRoutes = ["/admin/dashboard"];
    const previousPath = router.options.history.state.back;

    if (previousPath && authRoutes.includes(previousPath)) {
      router.back();
    } else {
      router.replace("/admin/profile");
    }
  } else {
    router.push({
      path: "/admin/profile/candidate/4",
      query: route.query,
    });
  }
};

const handleBack = () => {
  if (route.query.edit) {
    router.back();
  } else {
    const authRoutes = ["/login", "/signup", "/signup-verify-otp"];
    const previousPath = router.options.history.state.back;

    if (previousPath && !authRoutes.includes(previousPath)) {
      router.back();
    }
    router.replace({
      path: "/admin/profile/candidate/2",
      query: route.query,
    });
  }
};

const resetCurrentEducation = () => {
  currentIndex.value = null;
  Object.assign(currentEducation.value, {
    institution_name: null,
    education_degree: null,
    region_id: null,
    is_outside_indo: false,
    school_id: null,
    major: null,
    major_id: null,
    other_country: null,
    other_region: null,
    start_date: null,
    end_date: null,
    is_current: false,
    file_url: null,
    diploma_level: null,
  });
};

const formatDuration = (startYear, endYear) => {
  if (startYear && endYear) {
    return `${startYear} - ${endYear}`;
  } else if (startYear) {
    return `${startYear} - Present`;
  } else {
    return "N/A";
  }
};

const isValidDate = (date) => {
  const parsedDate = Date.parse(date);
  return !isNaN(parsedDate);
};

const isEndDateValid = (startYear, endYear) => {
  const startYearDate = Date.parse(startYear);
  const endYearDate = Date.parse(endYear);
  return endYearDate >= startYearDate;
};

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

const showErrorField = (message) => {
  if (Array.isArray(message)) {
    message.forEach((msg) => {
      if (msg.includes("user_id")) {
        errors.value.user_id = "Invalid selection";
      }
      if (msg.includes("school_id")) {
        errors.value.school_id = "Invalid selection";
      }
      if (msg.includes("major")) {
        errors.value.major = "Major is required";
      }
      if (msg.includes("region_id")) {
        errors.value.region_id = "City is required";
      }
      if (msg.includes("other_country")) {
        errors.value.other_country = "Country is required";
      }
      if (msg.includes("other_region")) {
        errors.value.other_region = "City is required";
      }
      if (msg.includes("file_url")) {
        errors.value.file_url = "Diploma file is required";
      }
      if (msg.includes("institution_name")) {
        errors.value.institution_name =
          "Institution name must be at least 3 characters";
      }
      if (msg.includes("education_degree")) {
        errors.value.education_degree = "Please select a valid degree";
      }
      if (msg.includes("start_date")) {
        errors.value.start_date = "Please enter a valid date";
      }
      if (msg.includes("end_date")) {
        errors.value.end_date = "Please enter a valid date";
      }
    });
  }
};

watch(
  () => currentEducation.value.is_outside_indo,
  (newVal, oldVal) => {
    if (newVal === true && oldVal === false) {
      currentEducation.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      currentEducation.value.other_country = null;
      currentEducation.value.other_region = null;
    }
  }
);

const schoolSearchValues = ref({});

const handleSchoolSearch = (searchValue, e) => {
  const index = educationHistory.value.items.indexOf(e);
  if (index !== -1) {
    schoolSearchValues.value[index] = searchValue;
  }
};

const handleBlurSchool = (event, e) => {
  const index = educationHistory.value.items.indexOf(e);
  const searchValue = index !== -1 ? schoolSearchValues.value[index] : null;

  // If user typed something but didn't select from autocomplete, use the typed value
  if (searchValue && !e.school_id) {
    e.institution_name = searchValue;
    e.school_id = null;
  }
};

const majorSearchValues = ref({});

const handleChangeMajor = (newMajorId, e) => {
  if (newMajorId) {
    const selectedMajor = models.value.major.items.find(
      (item) => item.id === newMajorId
    );
    if (selectedMajor) {
      e.major = selectedMajor.major_name;
      e.major_id = selectedMajor.id;
      // Clear search value after selection
      const index = educationHistory.value.items.indexOf(e);
      if (index !== -1) {
        majorSearchValues.value[index] = null;
      }
    }
  } else {
    // If major_id is cleared, keep the custom value if it exists
    if (e.major) {
      e.major_id = null;
    }
  }
};

const handleBlurMajor = (event, e) => {
  const index = educationHistory.value.items.indexOf(e);
  const searchValue = index !== -1 ? majorSearchValues.value[index] : null;

  // If user typed something but didn't select from autocomplete, use the typed value
  if (searchValue && !e.major_id) {
    e.major = searchValue;
    e.major_id = null;
  }
};

const handleMajorSearch = (searchValue, e) => {
  const index = educationHistory.value.items.indexOf(e);
  if (index !== -1) {
    majorSearchValues.value[index] = searchValue;
  }
};

const handleIsCurrentChange = (e) => {
  if (e.is_current) {
    e.end_date = null;
    e.file_url = null;
    e.certificate_number = null;
  }
};
</script>

<style scoped>
.v-slide-group__content {
  align-items: stretch;
}

.text-truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
