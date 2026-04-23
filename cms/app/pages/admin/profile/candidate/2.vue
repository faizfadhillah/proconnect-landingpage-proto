<template>
  <v-container class="pa-2">
    <v-row>
      <v-col cols="12">
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-card elevation="0" rounded="xl" class="pb-2 px-2">
            <v-card-text v-if="!isFillment">
              <h2 class="mb-2">Career History</h2>
              <p class="text-grey mb-5">Describe your past experience</p>
            </v-card-text>
            <v-card-text>
              <v-row>
                <template
                  v-for="(career, index) in careerHistory.items"
                  :key="index"
                >
                  <v-divider v-if="index > 0"></v-divider>
                  <v-col
                    cols="12"
                    :class="index % 2 == 0 ? '' : 'bg-grey-lighten-5'"
                  >
                    <v-row>
                      <v-col cols="12" v-if="index > 0">
                        <h3>Career {{ index + 1 }}</h3>
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Job Title</small>
                        </div>
                        <v-autocomplete
                          v-model="career.profession_id"
                          :items="models.profession.items"
                          item-title="name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Insert 3 characters or more to show options"
                          :error-messages="errors.profession_id"
                          :rules="[
                            (v) => !!v || 'Job title is required',
                            (v) =>
                              isValidUUID(v) || 'Invalid profession selected',
                          ]"
                          @update:search="
                            handleInput(
                              $event,
                              `profession`,
                              ['name'],
                              `mst-professions`
                            )
                          "
                          rounded="lg"
                          hide-no-data
                          :loading="models.profession.loading"
                          @update:model-value="
                            handleProfessionChange($event, career)
                          "
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Company Name</small>
                        </div>
                        <v-text-field
                          v-model="career.company_name"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input your previous workplace"
                          :error-messages="errors.company_name"
                          :rules="[
                            (v) => !!v || 'Company name is required',
                            (v) =>
                              v?.length >= 3 ||
                              'Company name must be at least 3 characters',
                          ]"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col
                        cols="12"
                        sm="6"
                        class="py-0"
                        style="position: relative"
                      >
                        <div class="text-grey-darken-2 mb-1">
                          <small>Start Date</small>
                        </div>
                        <v-text-date
                          v-model="career.start_date"
                          type="date"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Start of employment"
                          append-inner-icon="mdi-calendar"
                          :error-messages="errors.start_date"
                          :rules="[
                            (v) => !!v || 'Start date is required',
                            (v) => isValidDate(v) || 'Invalid date format',
                          ]"
                          rounded="lg"
                          clearable
                        />
                      </v-col>

                      <v-col cols="12" sm="6" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>End Date</small>
                        </div>
                        <v-text-date
                          v-model="career.end_date"
                          type="date"
                          variant="outlined"
                          density="comfortable"
                          placeholder="End of employment"
                          append-inner-icon="mdi-calendar"
                          :disabled="career.is_current"
                          :error-messages="errors.end_date"
                          :rules="[
                            (v) =>
                              career.is_current ||
                              !!v ||
                              'End date is required',
                            (v) =>
                              !v || isValidDate(v) || 'Invalid date format',
                            (v) =>
                              !v ||
                              isEndDateValid(career.start_date, v) ||
                              'End date must be after start date',
                          ]"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <v-switch
                          v-model="career.is_current"
                          label="Currently Here"
                          color="primary"
                          hide-details
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Job Description</small>
                        </div>
                        <v-textarea
                          v-model="career.job_description"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Describe your job description and responsibilities"
                          rows="3"
                          class="mb-2"
                          rounded="lg"
                          :rules="[
                            (v) =>
                              !v ||
                              v.length <= 3000 ||
                              'Maximum 3000 characters allowed',
                          ]"
                          :hint="`${
                            3000 - (career.job_description?.length || 0)
                          } characters remaining`"
                          auto-grow
                          style="
                            white-space: pre-wrap !important;
                            resize: vertical;
                          "
                        />
                      </v-col>

                      <!-- Achievement Section -->
                      <v-col cols="12" class="pt-0">
                        <div class="text-grey-darken-2 mb-2">
                          <h4>Achievements</h4>
                          <small>
                            Share your most impactfull work achievements
                          </small>
                        </div>

                        <div
                          v-for="(
                            achievement, indexAchievement
                          ) in career.achievement_history"
                          :key="indexAchievement"
                          class="mb-4"
                        >
                          <v-card
                            style="border: 1px solid #e0e0e0"
                            rounded="lg"
                            elevation="0"
                          >
                            <v-card-text>
                              <div class="d-flex justify-space-between">
                                <h3>{{ achievement.achievement_name }}</h3>
                                <v-spacer></v-spacer>
                                <v-icon
                                  icon="mdi-close"
                                  color="error"
                                  size="small"
                                  @click="
                                    removeAchievement(index, indexAchievement)
                                  "
                                ></v-icon>
                              </div>
                              <div class="text-grey my-2">
                                {{ formatDate(achievement.achievement_date) }}
                              </div>
                              <div style="font-size: 12px">
                                <p>{{ achievement.description }}</p>
                              </div>
                              <div>
                                <a
                                  v-if="achievement.file_link"
                                  @click="downloadFile(achievement.file_link)"
                                  style="cursor: pointer"
                                  >{{ achievement.file_link }}</a
                                >
                              </div>
                            </v-card-text>
                          </v-card>
                        </div>
                        <v-card
                          variant="outlined"
                          rounded="lg"
                          class="text-left"
                          color="grey"
                          height="48"
                          @click="addAchievement(index)"
                        >
                          <v-card-text class="pa-3" style="font-size: 15px">
                            Add Achievement History
                            <v-icon style="position: absolute; right: 10px"
                              >mdi-plus</v-icon
                            >
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" class="d-flex justify-end mb-3">
                        <v-btn
                          variant="outlined"
                          color="error"
                          size="small"
                          class="font-weight-bold"
                          @click="removeCareer(index)"
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
                    height="48"
                    size="large"
                    rounded="lg"
                    prepend-icon="mdi-plus"
                    class="font-weight-bold"
                    @click="addCareer"
                    >ADD WORK EXPERIENCE</v-btn
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
            </v-card-text>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
    <v-dialog v-model="dialogAchievement" max-width="500">
      <v-card rounded="lg">
        <v-toolbar class="bg-transparent">
          <v-toolbar-title class="font-weight-bold"
            >Achievement</v-toolbar-title
          >
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="dialogAchievement = false"
          ></v-btn>
        </v-toolbar>
        <v-divider></v-divider>
        <v-card-text>
          <v-form
            ref="formAchievement"
            v-model="validAchievement"
            @submit.prevent="handleSubmitAchievement"
          >
            <div>
              <small>Achievements Name</small>
            </div>
            <v-text-field
              v-model="currentAchievement.achievement_name"
              placeholder="example: Best Employee of the Month"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[
                (v) => !!v || 'Achievement title is required',
                (v) =>
                  !v ||
                  v.length >= 3 ||
                  'Achievement title must be at least 3 characters',
              ]"
            />
            <div>
              <small>Issued Date (Optional)</small>
            </div>
            <v-text-date
              v-model="currentAchievement.achievement_date"
              label="Achievement Date"
              placeholder="Date the achievements received"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[(v) => isValidDate(v) || 'Invalid date format']"
            />
            <div>
              <small>File Link (Optional)</small>
            </div>
            <v-file-upload
              v-model="currentAchievement.file_link"
              category="user_achievement"
              accept=".pdf"
              class="mb-4"
              :user-id="me.id"
            />
            <div>
              <small>Achievement Description</small>
            </div>
            <v-textarea
              v-model="currentAchievement.description"
              placeholder="Describe your accomplishment and their impact"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              rows="3"
              :rules="[
                (v) => !!v || 'Achievement description is required',
                (v) =>
                  !v ||
                  v.length >= 3 ||
                  'Achievement description must be at least 3 characters',
                (v) =>
                  !v ||
                  v.length <= 3000 ||
                  'Achievement description cannot exceed 3000 characters',
              ]"
              :hint="`${
                3000 - (currentAchievement.description?.length || 0)
              } characters remaining`"
              class="mb-2"
            />

            <div class="d-flex justify-end">
              <v-btn
                variant="outlined"
                color="primary"
                size="large"
                rounded="lg"
                class="mr-2"
                @click="dialogAchievement = false"
              >
                Back
              </v-btn>
              <v-btn
                type="submit"
                color="primary"
                size="large"
                rounded="lg"
                :loading="loadingSubmit"
              >
                Save
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
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

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const downloadFile = (url) => {
  window.open(BASE_URL + url, "_blank");
};

const { $apiFetch } = useApi();
const router = useRouter();
const route = useRoute();
const currentIndex = ref(null);
const errorMessage = ref("");
const valid = ref(false);
const { me, fetchMe } = useUser();
const loadingInitial = ref(false);

const careerHistory = ref({
  items: [],
  loading: false,
});

const { models, debouncedFetch, fetch } = useDynamicSearch(["profession"]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
};

const currentCareer = ref({
  user_id: me.value.id,
  company_name: null,
  profession_id: null,
  job_title: null,
  start_date: null,
  end_date: null,
  is_current: false,
  job_description: null,
  achievements: [],
});

const handleProfessionChange = (newProfessionId, career) => {
  if (newProfessionId) {
    // Find the selected profession from models
    const selectedProfession = models.value.profession.items.find(
      (item) => item.id === newProfessionId
    );

    if (selectedProfession) {
      // Set the job_title to the profession name
      career.job_title = selectedProfession.name;
    }
  }
};

const resetCurrentCareer = () => {
  currentIndex.value = null;
  Object.assign(currentCareer.value, {
    company_name: null,
    profession_id: null,
    job_title: null,
    start_date: null,
    end_date: null,
    is_current: false,
    job_description: null,
    achievement_history: [],
  });
};

onMounted(async () => {
  loadingInitial.value = true;
  if (!me.value.id) {
    await fetchMe();
  }
  loadingInitial.value = false;
  await fetchCareers();
});

const fetchCareers = async () => {
  loadingInitial.value = true;
  try {
    careerHistory.value.loading = true;
    const responseCareer = await $apiFetch("/user-career-history/search", {
      params: {
        filters: { user_id: me.value.id },
      },
    });
    careerHistory.value.items = responseCareer.items;
    if (careerHistory.value.items.length <= 0) {
      careerHistory.value.items.push(
        JSON.parse(JSON.stringify(currentCareer.value))
      );
    }
    careerHistory.value.items.forEach((career) => {
      if (career.profession_id) {
        fetch("profession", career.profession_id, ["id"], "mst-professions");
      }
    });
  } catch (error) {
    errorMessage.value = error.message || "Failed to fetch career history";
  } finally {
    careerHistory.value.loading = false;
    loadingInitial.value = false;
  }
};

const addCareer = async () => {
  resetCurrentCareer();
  careerHistory.value.items.push(
    JSON.parse(JSON.stringify(currentCareer.value))
  );
};

const removeCareerIds = ref([]);
const removeCareers = async () => {
  removeCareerIds.value.forEach(async (id) => {
    await $apiFetch(`/user-career-history/${id}`, {
      method: "DELETE",
    });
  });
};

const dialog = useDialogStore();
const removeCareer = async (index) => {
  try {
    await dialog.openDialog({
      title: "Delete Career History",
      message: "Are you sure you want to delete this career history?",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
    });

    const id = careerHistory.value.items[index].id;
    if (id) {
      removeCareerIds.value.push(id);
    }
    careerHistory.value.items.splice(index, 1);
  } catch {
    console.log("Delete cancelled");
  }
};

const dialogAchievement = ref(false);
const validAchievement = ref(false);
const currentAchievement = ref({
  achievement_name: null,
  achievement_date: null,
  description: null,
  file_link: null,
});
const currentAchievementIndex = ref(null);

const addAchievement = (index) => {
  currentAchievementIndex.value = index;
  dialogAchievement.value = true;
};
const formAchievement = ref(null);
const handleSubmitAchievement = async () => {
  const { valid, errors } = await formAchievement.value.validate();
  if (valid) {
    try {
      const career = careerHistory.value.items[currentAchievementIndex.value];
      const dachievement = JSON.parse(JSON.stringify(currentAchievement.value));
      if (Array.isArray(career.achievement_history)) {
        career.achievement_history.push(dachievement);
      } else {
        career.achievement_history = [dachievement];
      }
      dialogAchievement.value = false;
      resetCurrentAchievement();
    } catch (error) {
      errorMessage.value = error.message || "Failed to add achievement";
      console.log(error);
    }
  }
};
const resetCurrentAchievement = () => {
  Object.assign(currentAchievement.value, {
    achievement_name: null,
    achievement_date: null,
    description: null,
    file_link: null,
  });
};
const removeAchievement = (index, indexAchievement) => {
  careerHistory.value.items[index].achievement_history.splice(
    indexAchievement,
    1
  );
};

const errors = ref({
  profession_id: "",
  company_name: "",
  start_date: "",
  end_date: "",
  job_description: "",
});

// Validation helpers
const isValidUUID = (uuid) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const isValidDate = (date) => {
  return !isNaN(new Date(date).getTime());
};

const isEndDateValid = (startDate, endDate) => {
  if (!startDate || !endDate) return true;
  return new Date(endDate) > new Date(startDate);
};

// Clear errors when input changes
watch(
  currentCareer,
  () => {
    errors.value = {
      profession_id: "",
      company_name: "",
      start_date: "",
      end_date: "",
      job_description: "",
    };
  },
  { deep: true }
);

const form = ref(null);
const loadingSubmit = ref(false);
const handleSubmit = async () => {
  const fillCareer = careerHistory.value.items.filter(
    (career) => career.company_name || career.job_title
  );
  if (fillCareer.length > 0) {
    const validation = await form.value.validate();
    const valid = validation.valid;
    if (!valid) {
      return;
    }
  }
  loadingSubmit.value = true;
  try {
    careerHistory.value.items = careerHistory.value.items.filter(
      (career) => career.company_name || career.job_title
    );
    careerHistory.value.items.forEach(async (career) => {
      if (career.id) {
        await $apiFetch(`/user-career-history/${career.id}`, {
          method: "PATCH",
          body: career,
        });
      } else {
        await $apiFetch("/user-career-history", {
          method: "POST",
          body: career,
        });
      }
    });

    removeCareers();
    const index = me.value.wizard_state.findIndex((item) => item.id == 2);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        careerHistory.value.items.length > 0 ? 1 : 0;
    }
    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 2 ? me.value.last_wizard_state : 3,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to save career history";
    console.log(error);
    //showErrorField(error.response._data.message);
  } finally {
    loadingSubmit.value = false;
  }
};

const showErrorField = (message) => {
  if (Array.isArray(message)) {
    message.forEach((msg) => {
      if (msg.includes("user_id")) {
        errors.value.profession_id = "Invalid selection";
      }
      if (msg.includes("company_name")) {
        errors.value.company_name =
          "Company name must be at least 3 characters";
      }
      if (msg.includes("profession_id")) {
        errors.value.profession_id = "Please select a valid job title";
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

const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Career history updated successfully",
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
      path: "/admin/profile/candidate/3",
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
      path: "/admin/profile/candidate/1",
      query: route.query,
    });
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

.date-input:invalid::before {
  content: "DD/MM/YYYY";
  color: #aaa;
}
.date-input:focus::before {
  content: "";
}
</style>
