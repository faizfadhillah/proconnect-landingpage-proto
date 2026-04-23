<template>
  <v-container fluid>
    <!-- Create New Job Post Button -->

    <v-card flat style="border: 1px solid #e0e0e0; border-radius: 8px">
      <v-card-text class="pb-0 pt-2">
        <!-- Search and Filter Section -->
        <v-row>
          <v-col
            cols="12"
            md="5"
            class="pt-6"
            style="border-right: 1px solid #e0e0e0"
          >
            <h2 class="mb-2">Find Jobs</h2>
            <v-btn
              v-if="!isUserMember"
              color="primary"
              prepend-icon="mdi-plus"
              variant="elevated"
              rounded="lg"
              class="my-2"
              to="/admin/jobs/employer/form?c=true"
              block
            >
              Create Job Post
            </v-btn>
            <v-chip-group
              v-model="activeFilter"
              class="mb-2"
              mandatory
              selected-class="text-white"
            >
              <v-chip
                value="all"
                color="primary"
                :variant="activeFilter === 'all' ? 'elevated' : 'outlined'"
                class="mr-2"
              >
                All
              </v-chip>
              <v-chip
                value="publish"
                color="primary"
                :variant="activeFilter === 'publish' ? 'elevated' : 'outlined'"
                class="mr-2"
              >
                Published
              </v-chip>
              <v-chip
                value="draft"
                color="primary"
                :variant="activeFilter === 'draft' ? 'elevated' : 'outlined'"
                class="mr-2"
              >
                Draft
              </v-chip>
              <v-chip
                value="close"
                color="primary"
                :variant="activeFilter === 'close' ? 'elevated' : 'outlined'"
              >
                Closed
              </v-chip>
            </v-chip-group>

            <div>
              <v-text-field
                v-model="searchInput"
                placeholder="Search job here"
                append-inner-icon="mdi-magnify"
                clearable
                hide-details
                variant="outlined"
                rounded="lg"
                density="compact"
                @keyup.prevent="searchJobs"
                @keyup.enter.prevent="searchJobs"
              ></v-text-field>
            </div>

            <v-row class="mt-0">
              <!-- Job Listings -->
              <v-col
                cols="12"
                class="px-0"
                style="overflow-y: auto; height: calc(100vh - 260px)"
              >
                <v-list>
                  <template v-for="(job, index) in jobs" :key="job.id">
                    <v-list-item
                      @click="selectJob(job)"
                      class="pb-2 pt-1"
                      :class="{ 'selected-job': selectedJob?.id === job.id }"
                    >
                      <template v-slot:append>
                        <v-list-item-action>
                          <v-avatar
                            size="60"
                            rounded="lg"
                            class="ml-4 bg-grey-lighten-2"
                          >
                            <v-img
                              v-if="job.company?.logo_url"
                              :src="BASE_URL + job.company?.logo_url"
                              cover
                            ></v-img>
                            <v-icon size="40" color="grey" v-else>
                              mdi-briefcase-outline
                            </v-icon>
                          </v-avatar>
                        </v-list-item-action>
                      </template>
                      <v-list-item-title
                        class="font-weight-bold"
                        style="font-size: 14px"
                        >{{ job.title }}</v-list-item-title
                      >
                      <div>
                        <div>
                          <span class="text-caption text-grey-darken-2">
                            {{
                              job.is_outside_indo
                                ? job.other_region
                                : job.region?.name
                            }}
                          </span>
                        </div>
                        <div>
                          <span
                            class="text-caption font-weight-bold"
                            :class="`text-${getStatusColor(job.status)}`"
                            >{{
                              getStatusText(job.status)?.toUpperCase()
                            }}</span
                          >
                          &nbsp;-&nbsp;
                          <span class="text-caption text-grey-darken-2">{{
                            formatTimeAgo(job.updated_at)
                          }}</span>
                        </div>
                      </div>
                    </v-list-item>
                    <v-divider
                      class="mt-0"
                      v-if="index < filteredJobs.length - 1"
                    ></v-divider>
                  </template>
                  <template v-if="isLoading">
                    <v-skeleton-loader
                      type="list-item-two-line"
                      height="100"
                    ></v-skeleton-loader>
                  </template>
                  <div
                    v-if="!isLoading && jobs.length === 0"
                    class="text-center my-8"
                  >
                    <v-icon size="48" color="grey-lighten-1">
                      mdi-briefcase-off-outline
                    </v-icon>
                    <div class="mt-2 text-grey-darken-1">
                      {{
                        searchInput
                          ? "No jobs found matching your search"
                          : "No jobs available"
                      }}
                    </div>
                    <div class="text-caption text-grey mt-1" v-if="searchInput">
                      Try adjusting your search terms or filters
                    </div>
                  </div>
                  <v-card-text>
                    <v-btn
                      v-if="params.page < totalPages"
                      color="primary"
                      block
                      variant="outlined"
                      rounded
                      :loading="isLoading"
                      @click="fetchJobs(params.page + 1)"
                    >
                      Load More
                    </v-btn>
                  </v-card-text>
                </v-list>
              </v-col>
            </v-row>
          </v-col>
          <v-col
            cols="12"
            md="7"
            style="overflow-y: auto; height: calc(100vh - 130px)"
            v-if="isDesktop"
          >
            <v-card flat v-if="selectedJob && selectedJob.id">
              <v-list>
                <v-list-item class="pb-2">
                  <template v-slot:append>
                    <v-list-item-action>
                      <div class="d-flex flex-column align-center">
                        <v-avatar
                          size="80"
                          rounded="lg"
                          class="ml-4 bg-grey-lighten-2 mb-2"
                        >
                          <v-img
                            v-if="selectedJob.company?.logo_url"
                            :src="BASE_URL + selectedJob.company?.logo_url"
                            cover
                          ></v-img>
                          <v-icon size="40" color="grey" v-else>
                            mdi-briefcase-outline
                          </v-icon>
                        </v-avatar>
                        <v-btn
                          v-if="selectedJob.status === 'PUBLISH'"
                          variant="text"
                          size="small"
                          @click="shareDialog = true"
                          class="text-caption"
                          style="min-width: auto;"
                        >
                          <v-icon size="18" class="mr-1">mdi-share-variant</v-icon>
                          Share
                        </v-btn>
                      </div>
                    </v-list-item-action>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{
                    selectedJob.title
                  }}</v-list-item-title>
                  <div class="d-flex flex-column">
                    <div class="text-caption text-grey-darken-2">
                      {{
                        selectedJob.is_outside_indo
                          ? selectedJob.other_region
                          : selectedJob.region?.name
                      }}
                    </div>
                    <div class="d-flex align-center mt-1">
                      <span
                        class="text-caption font-weight-bold"
                        :class="`text-${getStatusColor(selectedJob.status)}`"
                        >{{
                          getStatusText(selectedJob.status)?.toUpperCase()
                        }}</span
                      >
                      &nbsp;-&nbsp;
                      <span class="text-caption text-grey-darken-2">{{
                        formatTimeAgo(selectedJob.updated_at)
                      }}</span>
                    </div>
                    <div class="my-2">
                      <v-chip
                        class="mr-2"
                        label
                        size="small"
                        v-for="s in selectedJob.domicile_status?.filter(
                          (s) => s !== null
                        )"
                        :key="s"
                      >
                        {{
                          domicileStatuses.find((e) => e.name === s)?.label || s
                        }}
                      </v-chip>
                      <v-chip
                        class="mr-2"
                        label
                        size="small"
                        v-for="s in selectedJob.employment_status?.filter(
                          (s) => s !== null
                        )"
                        :key="s"
                      >
                        {{
                          employmentStatuses.find((e) => e.name === s)?.label ||
                          s
                        }}
                      </v-chip>
                    </div>
                  </div>
                </v-list-item>
              </v-list>
              <v-card-text class="pt-0 text-caption">
                <v-row class="mx-n1">
                  <v-col cols="12" md="4" class="px-1">
                    <v-btn
                      v-if="selectedJob.status == 'DRAFT' && !isUserMember"
                      color="primary"
                      block
                      @click="publishJob(selectedJob.id)"
                      rounded="lg"
                    >
                      Publish Post
                    </v-btn>
                    <v-btn
                      v-else-if="!isUserMember"
                      color="primary"
                      block
                      :disabled="selectedJob.applicants?.length <= 0"
                      :to="`/admin/jobs/employer/${selectedJob.id}`"
                      rounded="lg"
                    >
                      View Applicants ({{ selectedJob.applicant_count || 0 }})
                    </v-btn>
                  </v-col>
                  <v-col cols="6" md="4" class="px-1">
                    <v-btn
                      v-if="!isUserMember"
                      color="primary"
                      block
                      variant="outlined"
                      :to="`/admin/jobs/employer/form/${selectedJob.id}/1`"
                      rounded="lg"
                      :disabled="selectedJob.status == 'CLOSE'"
                    >
                      Edit Post
                    </v-btn>
                  </v-col>
                  <v-col cols="6" md="4" class="px-1">
                    <v-btn
                      v-if="!isUserMember && selectedJob.status == 'DRAFT'"
                      color="error"
                      variant="outlined"
                      block
                      @click="deleteJob(selectedJob.id)"
                      rounded="lg"
                    >
                      Delete Post
                    </v-btn>
                    <v-btn
                      v-if="
                        ['PUBLISH', 'CLOSE'].includes(selectedJob.status) &&
                        !isUserMember
                      "
                      color="error"
                      variant="outlined"
                      block
                      @click="closeJob(selectedJob.id)"
                      rounded="lg"
                      :disabled="selectedJob.status == 'CLOSE'"
                    >
                      Close Post
                    </v-btn>
                    <v-btn
                      style="display: none"
                      v-if="selectedJob.status == 'CLOSE' && !isUserMember"
                      color="primary"
                      variant="outlined"
                      block
                      @click="reopenJob(selectedJob.id)"
                      rounded="lg"
                    >
                      Re-Open Post
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text class="pt-0">
                <div class="job-details">
                  <h3 class="text-title mb-3">Job Description</h3>

                  <rich-text-view v-model="selectedJob.description" />

                  <h3 class="text-title mb-2">Right To Work</h3>
                  <div class="mb-6">
                    <ul class="ml-4">
                      <li
                        v-for="rtw in selectedJob.right_to_works"
                        :key="rtw.id"
                      >
                        {{ rtw.salary_country?.country_name }} - {{ rtw.name }}
                      </li>
                    </ul>
                    <span v-if="selectedJob.right_to_works.length === 0"
                      >Not specified</span
                    >
                  </div>
                  <h3 class="text-title mb-2">Location</h3>
                  <div class="mb-6">
                    <template v-if="selectedJob.is_outside_indo">
                      {{ selectedJob.other_region }}
                      {{ selectedJob.other_country }}
                    </template>
                    <template v-else>
                      {{ selectedJob.region?.name }} INDONESIA
                    </template>
                  </div>

                  <div class="mb-6">
                    <h3 class="text-title font-weight-bold mb-2">Job Skills</h3>
                    <v-chip
                      v-for="skill in selectedJob.skills"
                      :key="skill.id"
                      variant="tonal"
                      label
                      class="mr-1 mb-1"
                    >
                      {{ skill.name }}
                    </v-chip>

                    <span
                      v-if="
                        selectedJob.skills.length === 0 || !selectedJob.skills
                      "
                      >Not specified</span
                    >
                  </div>

                  <div class="mb-6">
                    <h3 class="text-title font-weight-bold mb-2">Interest</h3>
                    <v-chip
                      v-for="interest in selectedJob.interests"
                      :key="interest.id"
                      variant="tonal"
                      class="mr-1 mb-1"
                      label
                    >
                      {{ interest.name }}
                    </v-chip>

                    <span
                      v-if="
                        selectedJob.interests.length === 0 ||
                        !selectedJob.interests
                      "
                      >Not specified</span
                    >
                  </div>

                  <div class="mb-6">
                    <h3 class="text-title font-weight-bold mb-2">Language</h3>
                    <v-chip
                      v-for="language in selectedJob.languages"
                      :key="language.id"
                      variant="tonal"
                      class="mr-1 mb-1"
                      label
                    >
                      {{ language.name }}
                    </v-chip>

                    <span
                      v-if="
                        selectedJob.languages.length === 0 ||
                        !selectedJob.languages
                      "
                      >Not specified</span
                    >
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-dialog
            v-if="isMobile"
            v-model="detailDialog"
            persistent
            fullscreen
          >
            <v-card flat>
              <v-toolbar density="comfortable" class="bg-transparent px-2" flat>
                <v-row class="align-center px-3" style="min-width: 220px">
                  <v-btn
                    icon
                    size="small"
                    @click="router.replace('/admin/jobs/employer')"
                    elevation="0"
                    color="primary"
                    class="mr-2"
                    style="background: rgba(255, 255, 255, 0.1)"
                  >
                    <v-icon size="20">mdi-arrow-left</v-icon>
                  </v-btn>
                </v-row>
                <v-spacer style="width: 90%"></v-spacer>
                <Notification></Notification>
              </v-toolbar>
              <v-divider />
              <template v-if="selectedJob">
                <v-list style="min-height: 140px">
                  <v-list-item class="pb-2">
                    <template v-slot:append>
                      <v-list-item-action>
                        <div class="d-flex flex-column align-center">
                          <v-avatar
                            size="80"
                            rounded="lg"
                            class="ml-4 bg-grey-lighten-2 mb-2"
                          >
                            <v-img
                              v-if="selectedJob.company?.logo_url"
                              :src="BASE_URL + selectedJob.company?.logo_url"
                              cover
                            ></v-img>
                            <v-icon size="40" color="grey" v-else>
                              mdi-briefcase-outline
                            </v-icon>
                          </v-avatar>
                          <v-btn
                            v-if="selectedJob.status === 'PUBLISH'"
                            variant="text"
                            size="small"
                            @click="shareDialog = true"
                            class="text-caption"
                            style="min-width: auto;"
                          >
                            <v-icon size="18" class="mr-1">mdi-share-variant</v-icon>
                            Share
                          </v-btn>
                        </div>
                      </v-list-item-action>
                    </template>
                    <v-list-item-title class="font-weight-bold">{{
                      selectedJob.title
                    }}</v-list-item-title>
                    <div class="d-flex flex-column">
                      <div class="text-caption text-grey-darken-2">
                        {{
                          selectedJob.is_outside_indo
                            ? selectedJob.other_region
                            : selectedJob.region?.name
                        }}
                      </div>
                      <div class="d-flex align-center mt-1">
                        <span
                          class="text-caption font-weight-bold"
                          :class="`text-${getStatusColor(selectedJob.status)}`"
                          >{{
                            getStatusText(selectedJob.status)?.toUpperCase()
                          }}</span
                        >
                        &nbsp;-&nbsp;
                        <span class="text-caption text-grey-darken-2">{{
                          formatTimeAgo(selectedJob.updated_at)
                        }}</span>
                      </div>
                      <div class="my-2">
                        <v-chip
                          class="mr-2"
                          label
                          v-for="s in selectedJob.domicile_status?.filter(
                            (s) => s !== null
                          )"
                          :key="s"
                        >
                          {{
                            domicileStatuses.find((e) => e.name === s)?.label ||
                            s
                          }}
                        </v-chip>
                        <v-chip
                          class="mr-2"
                          label
                          v-for="s in selectedJob.employment_status?.filter(
                            (s) => s !== null
                          )"
                          :key="s"
                        >
                          {{
                            employmentStatuses.find((e) => e.name === s)
                              ?.label || s
                          }}
                        </v-chip>
                      </div>
                    </div>
                  </v-list-item>
                </v-list>
                <v-card-text class="pt-0 px-4 text-caption">
                  <v-row class="mx-n1">
                    <v-col cols="12" md="4" class="px-1">
                      <v-btn
                        v-if="selectedJob.status == 'DRAFT'"
                        color="primary"
                        block
                        @click="publishJob(selectedJob.id)"
                        rounded="lg"
                      >
                        Publish Post
                      </v-btn>
                      <v-btn
                        v-else-if="!isUserMember"
                        color="primary"
                        block
                        :disabled="selectedJob.applicants?.length <= 0"
                        :to="`/admin/jobs/employer/${selectedJob.id}`"
                        rounded="lg"
                      >
                        View Applicants ({{ selectedJob.applicant_count || 0 }})
                      </v-btn>
                    </v-col>
                    <v-col cols="6" md="4" class="px-1">
                      <v-btn
                        v-if="!isUserMember"
                        color="primary"
                        block
                        variant="outlined"
                        :to="`/admin/jobs/employer/form?id=${selectedJob.id}`"
                        rounded="lg"
                      >
                        Edit Post
                      </v-btn>
                    </v-col>
                    <v-col cols="6" md="4" class="px-1">
                      <v-btn
                        v-if="!isUserMember && selectedJob.status == 'DRAFT'"
                        color="error"
                        variant="outlined"
                        block
                        @click="deleteJob(selectedJob.id)"
                        rounded="lg"
                      >
                        Delete Post
                      </v-btn>
                      <v-btn
                        v-if="selectedJob.status == 'PUBLISH'"
                        color="error"
                        variant="outlined"
                        block
                        rounded="lg"
                        @click="closeJob(selectedJob.id)"
                      >
                        Close Post
                      </v-btn>
                      <v-btn
                        v-if="selectedJob.status == 'CLOSE'"
                        color="primary"
                        variant="outlined"
                        block
                        rounded="lg"
                        @click="reopenJob(selectedJob.id)"
                      >
                        Re-Open Post
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-text class="pt-0">
                  <div class="job-details">
                    <h3 class="text-title mb-3">Job Description</h3>
                    <rich-text-view v-model="selectedJob.description" />

                    <h3 class="text-title mb-2">Right To Work</h3>
                    <div class="mb-6">
                      <ul class="ml-4">
                        <li
                          v-for="rtw in selectedJob.right_to_works"
                          :key="rtw.id"
                        >
                          {{ rtw.salary_country?.country_name }} -
                          {{ rtw.name }}
                        </li>
                      </ul>
                      <span v-if="selectedJob.right_to_works.length === 0"
                        >Not specified</span
                      >
                    </div>
                    <h3 class="text-title mb-2">Location</h3>
                    <div class="mb-6">
                      <template v-if="selectedJob.is_outside_indo">
                        {{ selectedJob.other_region }}
                        {{ selectedJob.other_country }}
                      </template>
                      <template v-else>
                        {{ selectedJob.region?.name }} INDONESIA
                      </template>
                    </div>

                    <div class="mb-6">
                      <h3 class="text-title font-weight-bold mb-2">
                        Job Skills
                      </h3>
                      <v-chip
                        v-for="skill in selectedJob.skills"
                        :key="skill.id"
                        variant="tonal"
                        label
                        class="mr-1 mb-1"
                      >
                        {{ skill.name }}
                      </v-chip>

                      <span
                        v-if="
                          selectedJob.skills.length === 0 || !selectedJob.skills
                        "
                        >Not specified</span
                      >
                    </div>

                    <div class="mb-6">
                      <h3 class="text-title font-weight-bold mb-2">Interest</h3>
                      <v-chip
                        v-for="interest in selectedJob.interests"
                        :key="interest.id"
                        variant="tonal"
                        class="mr-1 mb-1"
                        label
                      >
                        {{ interest.name }}
                      </v-chip>

                      <span
                        v-if="
                          selectedJob.interests.length === 0 ||
                          !selectedJob.interests
                        "
                        >Not specified</span
                      >
                    </div>

                    <div class="mb-6">
                      <h3 class="text-title font-weight-bold mb-2">Language</h3>
                      <v-chip
                        v-for="language in selectedJob.languages"
                        :key="language.id"
                        variant="tonal"
                        class="mr-1 mb-1"
                        label
                      >
                        {{ language.name }}
                      </v-chip>

                      <span
                        v-if="
                          selectedJob.languages.length === 0 ||
                          !selectedJob.languages
                        "
                        >Not specified</span
                      >
                    </div>
                  </div>
                </v-card-text>
              </template>
            </v-card>
          </v-dialog>
        </v-row>

        <!-- Main Content Area -->
      </v-card-text>
    </v-card>

    <!-- Share Job Dialog -->
    <ShareJobDialog
      v-model="shareDialog"
      :job-id="selectedJob?.id"
      :job-title="selectedJob?.title"
      :company-name="selectedJob?.company?.brand_name"
      :location="jobLocation"
    />
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth", "employer-jobs"],
});
// State
const router = useRouter();
const route = useRoute();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const searchInput = ref(route.query.search || null);
const citySearch = ref("");
const activeFilter = ref("all");
const selectedJob = ref({
  languages: [],
  interests: [],
  job_skills: [],
  right_to_works: [],
  skills: [],
});

// Mock data for jobs (replace with actual API data)
const jobs = ref([]);

const { $apiFetch } = useApi();
const { isMember } = usePermissions();

const isUserMember = computed(() => {
  return isMember();
});
// Computed to check if user is a member
const params = ref({
  page: 1,
  limit: 10,
  expands: "company, region",
});
const totalPages = ref(0);
const isLoading = ref(false);
watch(searchInput, () => {
  searchJobs();
});
const searchJobs = debounce(async () => {
  router.replace(`/admin/jobs/employer`);
  await fetchJobs();
}, 500);
const fetchJobs = async (page = 1) => {
  if (page == 1) {
    jobs.value = [];
  }
  isLoading.value = true;
  params.value.page = page;
  params.value.filters = {
    title: searchInput.value,
    description: searchInput.value,
    orWhere: ["title", "description"],
    status:
      activeFilter.value == "all" ? null : activeFilter.value.toUpperCase(),
    "applicants.status": [
      "CONNECT",
      "NEED_REVIEW",
      "PROCESS",
      "SCHEDULE_INTERVIEW",
      "ACCEPTED",
      "REJECTED",
    ],
  };
  params.value.expands =
    "company, region, skill, interest, language, right_to_work.salary_country";
  params.value.isApplicantCount = true;
  params.value.sortBy = { updated_at: "desc" };
  const response = await $apiFetch("/jobs/search", { params: params.value });
  if (page == 1) {
    jobs.value = [];
  }
  jobs.value = [...jobs.value, ...response.items];
  totalPages.value = response.meta.totalPages;
  isLoading.value = false;
  if (response.items.length > 0) {
    if (route.query.id) {
      selectedJob.value = jobs.value.find((job) => job.id === route.query.id);
      if (!selectedJob.value && activeFilter.value == "all") {
        $apiFetch("/jobs/search", {
          params: {
            id: route.query.id,
            expands:
              "company, region, skill, interest, language, right_to_work.salary_country",
            isApplicantCount: true,
          },
        }).then((res) => {
          jobs.value = [...res.items, ...jobs.value];
          if (res.items.length > 0) {
            selectedJob.value = res.items[0];
          }

          /*selectedJob.value = res.items[0];
          totalApplicants.value = null;
          detailDialog.value = true;*/
        });
      }
      detailDialog.value = true;
    } else {
      selectedJob.value = response.items[0];
    }
  } else {
    selectedJob.value = null;
  }
};

watch(activeFilter, () => {
  fetchJobs(1);
});

const selectJob = (job) => {
  router.push(`/admin/jobs/employer?id=${job.id}`);
  selectedJob.value = job;
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

const { isMobile, isDesktop } = useScreenSize();
const detailDialog = ref(false);
const shareDialog = ref(false);
watch(
  () => route.query.id,
  (newId) => {
    if (newId) {
      selectedJob.value = jobs.value.find((job) => job.id === newId);
      totalApplicants.value = null;
      detailDialog.value = true;
    } else {
      detailDialog.value = false;
    }
  }
);

// Computed property for filtered jobs
const filteredJobs = computed(() => {
  let filtered = jobs.value;

  // Filter by search input
  if (searchInput.value) {
    filtered = filtered.filter((job) =>
      job.title.toLowerCase().includes(searchInput.value.toLowerCase())
    );
  }

  // Filter by city
  if (citySearch.value) {
    filtered = filtered.filter((job) =>
      job.location.toLowerCase().includes(citySearch.value.toLowerCase())
    );
  }

  // Filter by status
  if (activeFilter.value !== "all") {
    filtered = filtered.filter(
      (job) => job.status.toLowerCase() === activeFilter.value.toLowerCase()
    );
  }

  return filtered;
});

const jobLocation = computed(() => {
  if (!selectedJob.value) return "";
  if (selectedJob.value.is_outside_indo) {
    return `${selectedJob.value.other_city || ""} ${selectedJob.value.other_country || ""}`.trim();
  }
  return selectedJob.value.region?.name ? `${selectedJob.value.region.name} INDONESIA` : "";
});

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "publish":
      return "green-darken-3";
    case "close":
      return "error";
    case "draft":
      return "warning";
    default:
      return "grey";
  }
};

const getStatusText = (status) => {
  switch (status?.toLowerCase()) {
    case "publish":
      return "Published";
    case "close":
      return "Closed";
    case "draft":
      return "Draft";
    default:
      return status;
  }
};

const dialog = useDialogStore();
const snackbar = useSnackbarStore();
const closeJob = async (id) => {
  try {
    await dialog.openDialog({
      title: "Close Job Applications",
      message: "Are you sure you want to close this job?",
      confirmButtonText: "Close",
      confirmButtonColor: "error",
      autoClose: false,
    });
    dialog.loading = true;
    $apiFetch(`/jobs/${id}`, {
      method: "PATCH",
      body: {
        status: "CLOSE",
      },
    }).then(() => {
      dialog.closeDialog();

      snackbar.showSnackbar({
        message: "Job closed successfully",
        color: "success",
      });
      fetchJobs();
    });
  } catch {
    console.log("Close cancelled");
  }
};

const deleteJob = async (id) => {
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
    $apiFetch(`/jobs/${id}`, {
      method: "DELETE",
    }).then(() => {
      dialog.closeDialog();
      snackbar.showSnackbar({
        message: "Job deleted successfully",
        color: "success",
      });
      fetchJobs();
    });
  } catch {
    console.log("Close cancelled");
  }
};

const publishJob = async (id) => {
  try {
    await dialog.openDialog({
      title: "Publish Job Post",
      message: "Are you sure you want to publish this job?",
      confirmButtonText: "Publish",
      confirmButtonColor: "primary",
      autoClose: false,
    });
    dialog.loading = true;
    $apiFetch(`/jobs/${id}`, {
      method: "PATCH",
      body: {
        status: "PUBLISH",
      },
    }).then(() => {
      dialog.closeDialog();

      snackbar.showSnackbar({
        message: "Job published successfully",
        color: "success",
      });
      fetchJobs();
    });
  } catch {
    console.log("Reopen cancelled");
  }
};

const reopenJob = async (id) => {
  try {
    await dialog.openDialog({
      title: "Reopen Job Applications",
      message: "Are you sure you want to reopen this job?",
      confirmButtonText: "Reopen",
      confirmButtonColor: "primary",
      autoClose: false,
    });
    dialog.loading = true;
    $apiFetch(`/jobs/${id}`, {
      method: "PATCH",
      body: {
        status: "PUBLISH",
      },
    }).then(() => {
      dialog.closeDialog();

      snackbar.showSnackbar({
        message: "Job reopened successfully",
        color: "success",
      });
      fetchJobs();
    });
  } catch {
    console.log("Reopen cancelled");
  }
};

const totalApplicants = ref(0);
const fetchTotalApplicants = async (id) => {
  const response = await $apiFetch(`/applicants/search`, {
    params: {
      filters: {
        job_id: id,
      },
    },
  });
  totalApplicants.value = response.meta.total;
};

onMounted(async () => {
  await fetchJobs();
  fetchDomicileStatuses();
  fetchEmploymentStatuses();
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
