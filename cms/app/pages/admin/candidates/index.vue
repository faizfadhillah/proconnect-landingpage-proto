<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <v-text-field
        v-model="searchInput"
        placeholder="Search candidates here"
        append-inner-icon="mdi-magnify"
        clearable
        class="mr-2 bg-white"
        variant="outlined"
        elevation="0"
        density="comfortable"
        rounded="lg"
        hide-details
      ></v-text-field>

      <v-btn
        variant="outlined"
        size="large"
        @click="filterDialog = true"
        color="primary"
        height="48"
        rounded="lg"
        class="bg-white"
      >
        <span class="mr-2">Filter</span>
        <v-badge
          v-if="activeFilterCount > 0"
          :content="activeFilterCount"
          color="error"
          class="mr-2"
        >
          <v-icon color="primary" icon="mdi-tune"></v-icon>
        </v-badge>
        <template v-else>
          <v-icon color="primary" icon="mdi-tune"></v-icon>
        </template>
      </v-btn>
    </div>
    <v-card flat rounded="lg" style="border: 1px solid #e0e0e0">
      <v-card-text class="pb-0 pt-0">
        <!-- Search and Filter Section -->
        <v-row>
          <v-col cols="12" class="pa-0">
            <v-row class="mt-0">
              <!-- Job Listings -->
              <v-col
                cols="12"
                class="pa-0"
                style="overflow-y: auto; height: calc(100vh - 115px)"
              >
                <v-list class="my-1">
                  <template
                    v-for="(candidate, index) in candidates"
                    :key="candidate.id"
                  >
                    <v-list-item
                      :to="`/admin/candidates/${candidate.id}`"
                      class="py-4"
                      :class="{
                        'selected-candidate':
                          selectedCandidate?.id === candidate.id,
                      }"
                    >
                      <template v-slot:prepend>
                        <v-list-item-action class="mr-3">
                          <v-avatar
                            size="70"
                            rounded="lg"
                            class="ml-4 bg-grey-lighten-2"
                          >
                            <v-img
                              v-if="candidate.photo_url"
                              :src="
                                candidate.photo_url.includes('http')
                                  ? candidate.photo_url
                                  : BASE_URL + candidate.photo_url
                              "
                              cover
                            ></v-img>
                            <v-icon size="40" color="grey" v-else>
                              mdi-account-outline
                            </v-icon>
                          </v-avatar>
                        </v-list-item-action>
                      </template>
                      <v-list-item-title
                        class="font-weight-bold"
                        style="font-size: 14px"
                      >
                        <div class="d-flex align-center gap-2">
                          {{ candidate.full_name || candidate.email }}
                          <v-img
                            v-if="candidate.is_skill_passport_verified"
                            src="/images/asp-badge.svg"
                            max-width="20"
                            height="20"
                          ></v-img>
                          <v-avatar
                            color="brown"
                            size="20"
                            v-if="candidate.is_school_verified"
                          >
                            <v-icon size="18">mdi-school-outline</v-icon>
                          </v-avatar>
                        </div>
                      </v-list-item-title>
                      <div>
                        <div>
                          <span
                            class="text-grey-darken-2"
                            v-if="candidate.userCareerHistories"
                          >
                            <template
                              v-for="(
                                career, index
                              ) in candidate.userCareerHistories
                                .filter((career) => career.job_title)
                                .slice(0, 3)"
                              :key="career.id"
                            >
                              <span
                                class="text-grey-darken-2 mx-1"
                                v-if="index > 0"
                                >•</span
                              >
                              {{ capitalizeWords(career.job_title) }}
                            </template>
                          </span>
                        </div>
                        <div>
                          <span class="text-caption text-grey-darken-2">{{
                            candidate.is_outside_indo
                              ? candidate.other_country
                              : candidate.region
                              ? "Indonesia"
                              : "N/A"
                          }}</span>
                        </div>
                        <div>
                          <span class="text-caption text-grey-darken-2">{{
                            getAge(candidate.birth_year) || "N/A"
                          }}</span>
                        </div>
                      </div>
                    </v-list-item>
                    <v-divider
                      class="mt-0"
                      v-if="index < candidates.length - 1"
                    ></v-divider>
                  </template>
                  <template v-if="isLoading">
                    <div class="px-4">
                      <v-skeleton-loader
                        type="list-item-two-line"
                        height="100"
                      ></v-skeleton-loader>
                    </div>
                  </template>
                  <div
                    v-if="!isLoading && candidates.length === 0"
                    class="text-center my-8"
                  >
                    <v-icon size="48" color="grey-lighten-1"
                      >mdi-account-off-outline</v-icon
                    >
                    <div class="mt-2 text-grey-darken-1">
                      No candidates found
                    </div>
                  </div>
                </v-list>
                <v-card-text class="px-8 mb-8">
                  <v-btn
                    v-if="params.page < totalPages"
                    color="primary"
                    block
                    variant="outlined"
                    rounded
                    :loading="isLoading"
                    @click="fetchCandidates(params.page + 1)"
                  >
                    Load More
                  </v-btn>
                </v-card-text>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Main Content Area -->
      </v-card-text>
    </v-card>

    <v-dialog v-model="filterDialog" max-width="600" persistent>
      <v-card rounded="xl" elevation="0">
        <v-form @submit.prevent="applyFilter">
          <v-toolbar density="compact" flat class="bg-transparent">
            <v-toolbar-title>Filter Candidates</v-toolbar-title>
            <v-spacer />
            <v-btn icon @click="filterDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-divider />

          <v-card-text style="overflow-y: auto; height: 500px; font-size: 12px">
            <!-- City -->
            <div>
              <div class="mb-1"><b>City</b></div>
              <v-text-field
                placeholder="Search city"
                v-model="filterData.city"
                density="compact"
                variant="outlined"
                rounded="lg"
                clearable
              />
            </div>

            <!-- Employment Status -->
            <div class="mb-4">
              <div class="mb-1"><b>Employment Status</b></div>
              <v-row>
                <v-col cols="4" v-for="e in employmentStatuses" :key="e.name">
                  <v-checkbox
                    hide-details
                    density="compact"
                    class="mr-2"
                    :value="e.name"
                    :label="e.label"
                    v-model="filterData.employmentStatus"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Domicile Status -->
            <div class="mb-4">
              <div class="mb-1"><b>Domicile Status</b></div>
              <v-row>
                <v-col cols="4" v-for="e in domicileStatuses" :key="e.name">
                  <v-checkbox
                    hide-details
                    density="compact"
                    class="mr-2"
                    :value="e.name"
                    :label="e.label"
                    v-model="filterData.domicileStatus"
                  />
                </v-col>
              </v-row>
            </div>

            <!-- Interest -->
            <div class="mb-4">
              <div class="mb-1"><b>Interest</b></div>
              <v-autocomplete
                placeholder="Search interest"
                v-model="filterData.interest"
                :items="models.interest.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                v-model:search="filterDataText.interest"
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

            <!-- Skills -->
            <div class="mb-4">
              <div class="mb-1"><b>Professions</b></div>
              <v-autocomplete
                placeholder="You may select more than one profession"
                v-model="filterData.profession"
                :items="models.profession.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                v-model:search="filterDataText.profession"
                :loading="models.profession.loading"
                @update:search="
                  handleInput($event, 'profession', ['name'], 'mst-professions')
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

            <div class="mb-4">
              <div class="mb-1"><b>Skill Passport Verified</b></div>
              <v-radio-group
                v-model="filterData.is_skill_passport_verified"
                density="compact"
                inline
                hide-details
              >
                <v-radio
                  label="All"
                  :value="null"
                  color="primary"
                  class="mr-2"
                ></v-radio>
                <v-radio
                  label="Verified"
                  :value="true"
                  color="primary"
                  class="mr-2"
                ></v-radio>
                <v-radio
                  label="Unverified"
                  :value="false"
                  color="primary"
                ></v-radio>
              </v-radio-group>
            </div>
            <div class="mb-4">
              <div class="mb-1"><b>Education Verified</b></div>
              <v-radio-group
                v-model="filterData.is_school_verified"
                density="compact"
                inline
                hide-details
              >
                <v-radio
                  label="All"
                  :value="null"
                  color="primary"
                  class="mr-2"
                ></v-radio>
                <v-radio
                  label="Verified"
                  :value="true"
                  color="primary"
                  class="mr-2"
                ></v-radio>
                <v-radio
                  label="Unverified"
                  :value="false"
                  color="primary"
                ></v-radio>
              </v-radio-group>
            </div>
          </v-card-text>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-btn
                  block
                  variant="elevated"
                  color="grey-lighten-2"
                  rounded="lg"
                  @click="resetFilter"
                  >Reset</v-btn
                >
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  type="submit"
                  variant="elevated"
                  color="primary"
                  rounded="lg"
                  :loading="loadingApplyingFilter"
                  >Save</v-btn
                >
              </v-col>
            </v-row>
          </v-card-text>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

import { ref, computed } from "vue";

// State
const router = useRouter();
const route = useRoute();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const searchInput = ref(route.query.search || null);
const citySearch = ref("");
const activeFilter = ref("all");
const selectedJob = ref(null);
const { $apiFetch } = useApi();
const candidates = useState("candidates", () => []);
const { me, fetchMe } = useUser();

const params = ref({
  page: 1,
  limit: 10,
  expands: "company, region, salary_country",
});
const totalPages = ref(0);
const isLoading = ref(true);
watch(searchInput, () => {
  searchCandidates();
});
const searchCandidates = debounce(async () => {
  await fetchCandidates();
}, 500);
const firstTimeFetching = ref(true);
const fetchCandidates = async (page = 1) => {
  if (page == 1) {
    if (firstTimeFetching.value && candidates.value.length > 0) {
      isLoading.value = false;
    } else {
      isLoading.value = true;
      candidates.value = [];
    }
  } else {
    isLoading.value = true;
  }
  params.value.page = page;
  params.value.filters = {
    full_name: searchInput.value,
    email: searchInput.value,
    user_role: "candidate",
    other_region: filterData.value.city,
    "region.full_name": filterData.value.city,
    orWhere: ["full_name", "email", "other_region", "region.full_name"],
  };
  if (filterData.value.interest.length > 0) {
    params.value.filters["userInterests.interest_id"] =
      filterData.value.interest;
  }
  if (filterData.value.profession.length > 0) {
    params.value.filters["userCareerHistories.profession_id"] =
      filterData.value.profession;
  }
  if (filterData.value.is_skill_passport_verified !== null) {
    params.value.filters["is_skill_passport_verified"] =
      filterData.value.is_skill_passport_verified;
  }
  if (filterData.value.is_school_verified !== null) {
    params.value.filters["is_school_verified"] =
      filterData.value.is_school_verified;
  }
  params.value.sortBy = {
    updated_at: "desc",
  };
  params.value.limit = 20;
  params.value.expands = "user, region, userInterests, userCareerHistories";
  const response = await $apiFetch("/users/search", {
    params: params.value,
  });
  if (page == 1) {
    candidates.value = response.items;
  } else {
    candidates.value = [...candidates.value, ...response.items];
  }
  totalPages.value = response.meta.totalPages;
  isLoading.value = false;
  firstTimeFetching.value = false;
};

const getTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

const getAge = (birthYear) => {
  if (!birthYear) return "";
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return `${age} years old`;
};

const filterDialog = ref(false);
const filterData = ref({
  city: null,
  employmentStatus: [],
  domicileStatus: [],
  interest: [],
  profession: [],
  is_skill_passport_verified: null,
  is_school_verified: null,
});
const filterDataText = ref({
  interest: null,
  profession: null,
});
const activeFilterCount = computed(() => {
  return Object.values(filterData.value).filter((value) =>
    Array.isArray(value) ? value.length > 0 : !!value
  ).length;
});
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
const { models, debouncedFetch, fetch } = useDynamicSearch([
  "interest",
  "profession",
]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
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

const resetFilter = () => {
  filterData.value = {
    city: null,
    employmentStatus: [],
    domicileStatus: [],
    interest: [],
    profession: [],
    is_skill_passport_verified: null,
    is_school_verified: null,
  };
  searchInput.value = null;
  fetchCandidates(1);
  filterDialog.value = false;
};

const loadingApplyingFilter = ref(false);
const applyFilter = () => {
  loadingApplyingFilter.value = true;
  route.query.id = null;
  fetchCandidates(1);
  setTimeout(() => {
    filterDialog.value = false;
    loadingApplyingFilter.value = false;
  }, 500);
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchEmploymentStatuses();
  fetchDomicileStatuses();
  await fetchCandidates();
});
</script>

<style scoped>
.v-btn-group .v-btn {
  text-transform: none;
}

.selected-job {
  background-color: #e4edf8;
}

.job-details ul {
  list-style-type: disc;
  margin-bottom: 1rem;
}

.job-details li {
  margin-bottom: 0.5rem;
}

.sticky-card {
  position: sticky !important;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}
</style>
