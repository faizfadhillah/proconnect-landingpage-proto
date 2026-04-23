<template>
  <v-container fluid>
    <v-btn
      v-if="selectedJob.status == 'DRAFT'"
      color="primary"
      variant="outlined"
      @click="handleSubmit('DRAFT')"
      :loading="loadingAsDraft"
      width="140"
      rounded="lg"
      height="42"
      style="position: fixed; top: 8px; right: 20px; z-index: 1998"
    >
      Save as draft
    </v-btn>
    <v-btn
      v-else-if="selectedJob.status == 'PUBLISH'"
      color="primary"
      variant="outlined"
      @click="handleSubmit('PUBLISH')"
      :loading="loadingAsDraft"
      width="220"
      rounded="lg"
      height="42"
      style="position: fixed; top: 8px; right: 20px; z-index: 1998"
    >
      Save & Update Changes
    </v-btn>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="12" md="10" lg="8">
        <v-card rounded="lg" elevation="0">
          <v-form
            ref="form"
            @submit.prevent="handleSubmit(postData.status, true)"
          >
            <v-card-text>
              <h2 class="font-weight-bold mb-2">
                {{
                  postData.id
                    ? postData.status == "PUBLISH"
                      ? "Edit Published Job"
                      : `Edit ${
                          postData.status.charAt(0).toUpperCase() +
                          postData.status.slice(1).toLowerCase()
                        } Job`
                    : "Create Job"
                }}
              </h2>
              <div class="text-grey mb-6">
                Fill in the details and get matched with the right talent
              </div>

              <!-- Job Form -->

              <!-- Job Title -->
              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Job Overview
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  What job are you hiring for?
                </p>
                <div class="text-grey-darken-1 mb-1" style="font-size: 12px">
                  Job Title *
                </div>
                <v-autocomplete
                  v-model="postData.profession_ids[0]"
                  :items="models.profession.items"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Ex: Front Office, Chef, etc."
                  :rules="[(v) => !!v || 'Job title is required']"
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
                  :disabled="postData.status == 'PUBLISH'"
                  @update:model-value="handleProfessionChange($event)"
                />

                <p class="text-grey-darken-2 mb-1" style="font-size: 12px">
                  Job Description *
                </p>
                <RichTextEditor
                  v-model="postData.description"
                  placeholder="Enter job description"
                  :rules="[(v) => !!v || 'Job description is required']"
                />
              </div>
              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Salary <small>(optional)</small>
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  What are the salary range for this job?
                </p>
                <div
                  class="text-grey-darken-1 mb-1"
                  style="font-size: 12px; display: none"
                >
                  Select pay interval
                </div>
                <v-row>
                  <v-col cols="12" lg="4" md="4" class="pb-0">
                    <div class="text-grey mb-1" style="font-size: 12px">
                      Currency
                    </div>
                    <v-select
                      placeholder="Select Currency"
                      v-model="postData.salary_country_id"
                      :items="salaryCountry.items"
                      item-title="currency_code"
                      item-value="id"
                      rounded="lg"
                      variant="outlined"
                      density="comfortable"
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="6" lg="4" md="4" class="pb-0">
                    <div class="text-grey mb-1" style="font-size: 12px">
                      Minimum
                    </div>
                    <v-currency-field
                      v-model="postData.min_salary"
                      :prefix="
                        salaryCountry.items.find(
                          (item) => item.id === postData.salary_country_id
                        )?.currency_code
                      "
                      placeholder="Minimum"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      :rules="[
                        (value) =>
                          !postData.salary_country_id ||
                          !value ||
                          parseFloat(value?.toString().replace(/[,.]/g, '')) >
                            0 ||
                          'Minimum salary must be greater than 0',
                      ]"
                      :disabled="!postData.salary_country_id"
                    ></v-currency-field>
                  </v-col>
                  <v-col cols="6" lg="4" md="4" class="pb-0">
                    <div class="text-grey mb-1" style="font-size: 12px">
                      Maximum
                    </div>
                    <v-currency-field
                      v-model="postData.max_salary"
                      :prefix="
                        salaryCountry.items.find(
                          (item) => item.id === postData.salary_country_id
                        )?.currency_code
                      "
                      placeholder="Maximum"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      :rules="[
                        (value) =>
                          !postData.salary_country_id ||
                          !value ||
                          (parseFloat(value?.toString().replace(/[,.]/g, '')) >
                            0 &&
                            (!postData.min_salary ||
                              parseFloat(
                                value?.toString().replace(/[,.]/g, '')
                              ) >
                                parseFloat(
                                  postData.min_salary
                                    ?.toString()
                                    .replace(/[,.]/g, '')
                                ))) ||
                          'Maximum salary must be greater than 0 and greater than minimum salary',
                      ]"
                      :disabled="!postData.salary_country_id"
                    ></v-currency-field>
                  </v-col>
                </v-row>
              </div>

              <!-- Employment Status -->
              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Employment Types
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  What are the employment you offer for this position
                </p>
                <div class="d-flex flex-wrap gap-2">
                  <v-radio-group
                    v-model="postData.employment_status[0]"
                    color="primary"
                    class="d-flex flex-wrap gap-2"
                  >
                    <v-radio
                      v-for="item in employmentStatuses"
                      :key="item.name"
                      :label="item.label"
                      :value="item.name"
                    ></v-radio>
                  </v-radio-group>
                </div>
              </div>

              <!-- Job Location -->
              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Job Location
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  Where is the location of the job ?
                </p>
                <v-row>
                  <v-col cols="12">
                    <v-switch
                      v-model="postData.is_outside_indo"
                      label="Outside Indonesia?"
                      color="primary"
                      hide-details
                    />
                  </v-col>

                  <template v-if="!postData.is_outside_indo">
                    <v-col cols="12" class="py-0">
                      <div class="text-grey-darken-2 mb-1">
                        <small>City *</small>
                      </div>
                      <v-autocomplete
                        v-model="postData.region_id"
                        variant="outlined"
                        density="comfortable"
                        placeholder="Insert 3 characters or more to search"
                        :items="regions"
                        item-title="name"
                        item-value="id"
                        :loading="regionLoading"
                        :search-input.sync="citySearch"
                        :rules="[(v) => !!v || 'City is required']"
                        @update:search="searchCities"
                        rounded="lg"
                      />
                    </v-col>
                  </template>
                  <template v-else>
                    <v-col cols="12" class="py-0">
                      <div class="text-grey-darken-2 mb-1">
                        <small>Country</small>
                      </div>
                      <v-text-field
                        v-model="postData.other_country"
                        variant="outlined"
                        density="comfortable"
                        placeholder="Input country"
                        :rules="[(v) => !!v || 'Country is required']"
                        rounded="lg"
                      />
                    </v-col>
                    <v-col cols="12" class="py-0">
                      <div class="text-grey-darken-2 mb-1">
                        <small>City</small>
                      </div>
                      <v-text-field
                        v-model="postData.other_region"
                        variant="outlined"
                        density="comfortable"
                        placeholder="Input city"
                        :rules="[(v) => !!v || 'City is required']"
                        rounded="lg"
                      />
                    </v-col>
                  </template>
                </v-row>
              </div>

              <!-- Job Description -->
              <div class="mb-6"></div>

              <!-- Job Skills -->

              <!-- Domicile Status -->
              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Domicile Status
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  Choose the types of work you're open to.
                </p>
                <div class="d-flex flex-wrap gap-2">
                  <v-radio-group
                    v-model="postData.domicile_status[0]"
                    color="primary"
                    class="d-flex flex-wrap gap-2"
                  >
                    <v-radio
                      v-for="item in domicileStatuses"
                      :key="item.name"
                      :label="item.label"
                      :value="item.name"
                    ></v-radio>
                  </v-radio-group>
                </div>
              </div>

              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Mastered Language (optional)
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  What languages are required for this job ?
                </p>
                <v-autocomplete
                  placeholder="select language"
                  v-model="postData.language_ids"
                  :items="models.language.items"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  v-model:search="searchLanguages"
                  :loading="models.language.loading"
                  @update:search="
                    handleInput($event, 'language', ['name'], 'mst-languages')
                  "
                  rounded="lg"
                  multiple
                  clearable
                  hide-no-data
                  hide-details
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      label
                      color="primary"
                      variant="flat"
                      closable
                    >
                      {{ item.raw.name }}
                    </v-chip>
                  </template>
                </v-autocomplete>
              </div>

              <div class="mb-6">
                <p class="text-grey-darken-2 mb-1" style="font-size: 16px">
                  Right to work (optional)
                </p>
                <p style="font-size: 12px" class="text-grey mb-2">
                  What right to work should candidate have ?
                </p>
                <v-autocomplete
                  placeholder="Search right to work"
                  v-model="postData.right_to_work_ids"
                  :items="rightToWork.items"
                  item-title="text"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  @update:search="searchRightToWork"
                  :loading="rightToWork.loading"
                  rounded="lg"
                  multiple
                  clearable
                  hide-no-data
                  hide-details
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      label
                      color="primary"
                      variant="flat"
                      closable
                    >
                      {{ item.raw.name }}
                    </v-chip>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Skills -->
              <div class="mb-1">
                <p class="mb-1 text-grey-darken-2" style="font-size: 16px">
                  Skills *
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  List the key skills, strengths and expertise that candidate
                  should show case
                </p>
                <v-autocomplete
                  placeholder="You may select more than one skill"
                  v-model="postData.skill_ids"
                  :items="models.skill.items"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  v-model:search="searchSkills"
                  :loading="models.skill.loading"
                  @update:search="
                    handleInput($event, 'skill', ['name'], 'mst-skills')
                  "
                  rounded="lg"
                  multiple
                  clearable
                  hide-no-data
                  :rules="[(v) => (v && v.length > 0) || 'Skills is required']"
                  required
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      label
                      color="primary"
                      variant="flat"
                      closable
                    >
                      {{ item.raw.name }}
                    </v-chip>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Interest -->
              <div class="mb-6">
                <p class="mb-1 text-grey-darken-2" style="font-size: 16px">
                  Interest (optional)
                </p>
                <p style="font-size: 13px" class="text-grey mb-2">
                  What interest should the candidate have ?
                </p>
                <v-autocomplete
                  placeholder="Search interest"
                  v-model="postData.interest_ids"
                  :items="models.interest.items"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  v-model:search="searchInterest"
                  :loading="models.interest.loading"
                  @update:search="
                    handleInput($event, 'interest', ['name'], 'mst-interests')
                  "
                  rounded="lg"
                  multiple
                  clearable
                  hide-no-data
                  hide-details
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip v-bind="props" label color="primary" variant="flat">
                      {{ item.raw.name }}
                    </v-chip>
                  </template>
                </v-autocomplete>
              </div>

              <!-- Right to Work -->

              <!-- Action Buttons -->
            </v-card-text>
            <v-card-text>
              <v-row class="pa-2">
                <v-col
                  v-if="!route.query.c"
                  cols="12"
                  md="2"
                  lg="2"
                  class="px-1 py-2"
                  :order="isMobile ? 4 : 1"
                >
                  <v-btn
                    v-if="selectedJob.status == 'DRAFT'"
                    color="error"
                    variant="outlined"
                    @click="handleDeletePost"
                    block
                    height="42"
                    rounded="lg"
                  >
                    Delete Post
                  </v-btn>
                  <v-btn
                    v-else-if="selectedJob.status == 'PUBLISH'"
                    color="error"
                    variant="outlined"
                    @click="handleCloseJob"
                    block
                    height="42"
                    rounded="lg"
                  >
                    Close Post
                  </v-btn>
                  <v-btn
                    v-else-if="selectedJob.status == 'CLOSE'"
                    color="primary"
                    variant="outlined"
                    @click="handleReopenJob"
                    block
                    height="42"
                    size="small"
                    rounded="lg"
                  >
                    Re-Open Post
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  md="2"
                  lg="2"
                  class="px-1 py-2"
                  :order="isMobile ? 3 : 2"
                >
                  <v-btn
                    color="primary"
                    variant="outlined"
                    @click="handleCancel"
                    rounded="lg"
                    height="42"
                    block
                  >
                    Cancel
                  </v-btn>
                </v-col>
                <v-col
                  cols="12"
                  :lg="route.query.c ? 8 : 6"
                  :md="route.query.c ? 8 : 6"
                  class="pa-1 py-2"
                  v-if="isDesktop"
                  order="3"
                >
                </v-col>

                <v-col
                  cols="12"
                  md="2"
                  lg="2"
                  class="px-1 py-2"
                  :order="isMobile ? 2 : 5"
                >
                  <v-btn
                    color="primary"
                    variant="elevated"
                    type="submit"
                    :loading="loadingAsPublish"
                    block
                    rounded="lg"
                    height="42"
                  >
                    Next
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-form>
        </v-card>
      </v-col>
      <v-dialog
        v-model="loadingInitial"
        persistent
        width="auto"
        max-width="200"
      >
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
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "wizard-job",
  middleware: ["auth", "employer-jobs"],
});
const { isMobile, isDesktop, isTablet } = useScreenSize();
const route = useRoute();
const router = useRouter();
const loadingInitial = ref(false);
const { me, fetchMe } = useUser();
const postData = ref({
  company_id: null,
  title: null,
  is_outside_indo: false,
  other_country: null,
  other_region: null,
  region_id: null,
  salary_country_id: null,
  min_salary: 0,
  max_salary: 0,
  description: null,
  profession_ids: [],
  employment_status: [],
  domicile_status: [],
  language_ids: [],
  skill_ids: [],
  interest_ids: [],
  right_to_work_ids: [],
  status: "DRAFT",
});

const handleProfessionChange = (newProfessionId) => {
  if (newProfessionId) {
    // Find the selected profession from models
    const selectedProfession = models.value.profession.items.find(
      (item) => item.id === newProfessionId
    );

    if (selectedProfession) {
      // Set the job_title to the profession name
      postData.value.title = selectedProfession.name;
    }
  }
};

const form = ref(null);
const { $apiFetch } = useApi();

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};
watch(
  () => postData.value.is_outside_indo,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
    if (newVal === true && oldVal === false) {
      postData.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      postData.value.other_country = null;
      postData.value.other_region = null;
    }
  }
);

// Watcher untuk salary_country_id
watch(
  () => postData.value.salary_country_id,
  (newVal, oldVal) => {
    // Jika salary_country_id di-clear (menjadi null atau undefined)
    if (!newVal && oldVal) {
      postData.value.min_salary = 0;
      postData.value.max_salary = 0;
    }
  }
);

const { models, debouncedFetch, fetch } = useDynamicSearch([
  "skill",
  "profession",
  "interest",
  "language",
  "right_to_work",
]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
};

const salaryCountry = ref({
  items: [],
  loading: false,
});
const fetchSalaryCountry = async () => {
  const response = await $apiFetch("/mst-salary-country/search", {
    params: {
      limit: 100,
    },
  });
  salaryCountry.value.items = response.items;
};

const rightToWork = ref({
  items: [],
  loading: false,
});
const searchRightToWork = debounce(async (event) => {
  rightToWork.value.loading = true;
  const response = await $apiFetch("/mst-right-to-works/search", {
    params: {
      filters: {
        name: event,
        "salary_country.country_name": event,
        orWhere: ["name", "salary_country.country_name"],
      },
      expands: "salary_country",
    },
  });
  rightToWork.value.items = [
    ...rightToWork.value.items,
    ...response.items.map((item) => ({
      id: item.id,
      name: item.name,
      country_name: item.salary_country.country_name,
      text: `${item.salary_country.country_name} - ${item.name}`,
    })),
  ];
  rightToWork.value.items = Array.from(
    new Map(rightToWork.value.items.map((item) => [item.id, item])).values()
  );
  rightToWork.value.loading = false;
}, 500);

const skillHistory = ref({
  items: [],
  loading: false,
});
const currentSkill = ref({
  skill_id: null,
});
const addSkill = async () => {
  if (!currentSkill.value.skill_id) {
    return;
  }

  const isDuplicate = skillHistory.value.items.some(
    (item) => item.skill_id === currentSkill.value.skill_id
  );

  if (isDuplicate) {
    return;
  }
  let skill = models.skill.items.find(
    (item) => item.id === currentSkill.value.skill_id
  );
  skillHistory.value.items.push(skill);
};

const removeSkill = async (index) => {
  skillHistory.value.items.splice(index, 1);
};

const employmentStatuses = ref([]);
const fetchEmploymentStatuses = async () => {
  const response = await $apiFetch("/configs/key/employment_status");
  employmentStatuses.value = response.value;
};
const domicileStatuses = ref([]);
const fetchDomicileStatuses = async () => {
  const response = await $apiFetch("/configs/key/domicile_status");
  domicileStatuses.value = response.value;
};

const handleDeletePost = async () => {
  try {
    await dialog.openDialog({
      title: "Delete Post",
      message:
        "Are you sure you want to delete this post?<br/> this action cannot be undone.",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
      autoClose: false,
    });
    dialog.loading = true;
    $apiFetch(`/jobs/${route.params.id}`, {
      method: "DELETE",
    }).then(() => {
      dialog.closeDialog();
      snackbar.showSnackbar({
        message: "Job deleted successfully",
        color: "success",
      });
      router.replace("/admin/jobs/employer");
    });
  } catch {
    console.log("Close cancelled");
  }
};

const handleCancel = async () => {
  await dialog.openDialog({
    title: "Cancel",
    message: "Are you sure you want to cancel from this job post?",
    confirmButtonText: "Yes, Confirm",
    confirmButtonColor: "primary",
    autoClose: false,
  });
  dialog.loading = true;
  router.replace("/admin/jobs/employer?id=" + route.params.id);
  dialog.closeDialog();
};

const loadingAsDraft = ref(false);
const loadingAsPublish = ref(false);
const snackbar = useSnackbarStore();

// Helper function to convert Delta object to JSON string
const convertDescriptionToString = (description) => {
  if (!description) return null;
  
  // If it's already a string, return it
  if (typeof description === "string") {
    return description;
  }
  
  // If it's an object (Delta), convert to JSON string
  if (typeof description === "object") {
    // Check if it has ops property (Delta format)
    if (description.ops) {
      return JSON.stringify(description);
    }
    // Otherwise stringify the whole object
    return JSON.stringify(description);
  }
  
  return description;
};

// Helper function to convert JSON string back to object for RichTextEditor
const convertDescriptionToObject = (description) => {
  if (!description) return null;
  
  // If it's already an object, return it
  if (typeof description === "object") {
    return description;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof description === "string") {
    try {
      const parsed = JSON.parse(description);
      return parsed;
    } catch (e) {
      // If parsing fails, return the string as is (plain text)
      return description;
    }
  }
  
  return description;
};

const handleSubmit = async (status = "DRAFT", isNext = false) => {
  const validation = await form.value.validate();
  if (!validation.valid && (!["DRAFT"].includes(status) || isNext)) {
    snackbar.showSnackbar({
      message: "Please fill in all required fields",
      color: "error",
    });
    return;
  }

  if (["DRAFT", "CLOSE", "PUBLISH"].includes(status) && !isNext) {
    loadingAsDraft.value = true;
  }
  if (isNext) {
    loadingAsPublish.value = true;
  }
  
  // Prepare data with converted description
  const submitData = {
    ...postData.value,
    description: convertDescriptionToString(postData.value.description),
    status: status,
  };
  
  if (route.params.id) {
    $apiFetch(`/jobs/${route.params.id}`, {
      method: "PATCH",
      body: submitData,
    })
      .then((response) => {
        snackbar.showSnackbar({
          message: "Job updated successfully",
          color: "success",
        });
        if (isNext) {
          router.push({
            path: `/admin/jobs/employer/form/${route.params.id}/2`,
            query: route.query,
          });
        } else {
          router.replace(`/admin/jobs/employer?id=${response.id}`);
        }
      })
      .finally(() => {
        loadingAsDraft.value = false;
        loadingAsPublish.value = false;
      });
  } else {
    $apiFetch("/jobs", {
      method: "POST",
      body: submitData,
    })
      .then((response) => {
        snackbar.showSnackbar({
          message: "Job created successfully",
          color: "success",
        });
        if (isNext) {
          router.push(
            `/admin/jobs/employer/form/${
              route.params.id || response.id
            }/2?c=true`
          );
        } else {
          router.replace(`/admin/jobs/employer?id=${response.id}`);
        }
      })
      .finally(() => {
        loadingAsDraft.value = false;
        loadingAsPublish.value = false;
      });
  }
};

const handleDraftJob = async () => {
  await handleSubmit("DRAFT");
};

const dialog = useDialogStore();
const handleReopenJob = async () => {
  await dialog.openDialog({
    title: "Re-open Job",
    message: "Are you sure you want to re-open this job?",
    confirmButtonText: "Re-open",
    confirmButtonColor: "success",
    autoClose: false,
  });
  dialog.loading = true;
  await handleSubmit("PUBLISH");
  dialog.closeDialog();
};

const handleCloseJob = async () => {
  await dialog.openDialog({
    title: "Close Job",
    message: "Are you sure you want to close this job?",
    confirmButtonText: "Close",
    confirmButtonColor: "error",
    autoClose: false,
  });
  dialog.loading = true;
  await handleSubmit("CLOSE");
  dialog.closeDialog();
};

const selectedJob = useState("selectedJob", () => ({ status: "DRAFT" }));

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
    postData.value.company_id = me.value.company_id;
  }
  fetchEmploymentStatuses();
  fetchDomicileStatuses();
  fetchSalaryCountry();

  if (route.params.id) {
    loadingInitial.value = true;
    const response = await $apiFetch(`/jobs/search`, {
      params: {
        filters: {
          id: route.params.id,
        },
        params: {
          expands: "jobSkills",
        },
      },
    });
    loadingInitial.value = false;

    if (!response.items[0]) {
      router.replace("/admin/jobs/employer");
      return;
    }

    postData.value = response.items[0];
    // Convert description from JSON string to object for RichTextEditor
    if (postData.value.description) {
      postData.value.description = convertDescriptionToObject(postData.value.description);
    }
    Object.assign(selectedJob.value, response.items[0]);
    if (postData.value.profession_ids[0]) {
      fetch(
        "profession",
        postData.value.profession_ids[0],
        ["id"],
        "mst-professions"
      );
    }

    if (postData.value.region_id) {
      fetchRegions(postData.value.region_id, "id");
    }

    if (!Array.isArray(postData.value.employment_status)) {
      postData.value.employment_status = [postData.value.employment_status];
    }
    if (!Array.isArray(postData.value.domicile_status)) {
      postData.value.domicile_status = [postData.value.domicile_status];
    }

    if (
      Array(postData.value.language_ids) &&
      postData.value.language_ids?.length > 0
    ) {
      fetch("language", postData.value.language_ids, ["id"], "mst-languages");
    }

    if (
      Array.isArray(postData.value.interest_ids) &&
      postData.value.interest_ids.length > 0
    ) {
      fetch("interest", postData.value.interest_ids, ["id"], "mst-interests");
    }

    if (
      Array.isArray(postData.value.skill_ids) &&
      postData.value.skill_ids.length > 0
    ) {
      fetch("skill", postData.value.skill_ids, ["id"], "mst-skills");
    }

    if (
      Array.isArray(postData.value.right_to_work_ids) &&
      postData.value.right_to_work_ids.length > 0
    ) {
      $apiFetch("/mst-right-to-works/search", {
        params: {
          filters: {
            id: postData.value.right_to_work_ids,
          },
          expands: "salary_country",
        },
      }).then((response) => {
        rightToWork.value.items = response.items.map((item) => ({
          id: item.id,
          name: item.name,
          country_name: item.salary_country.country_name,
          text: `${item.salary_country.country_name} - ${item.name}`,
        }));
      });
    }
  }

  fetch("language", "-1", ["name"], "mst-languages");
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
</style>
