<template>
  <v-container fluid class="pb-0">
    <!-- Filters Section -->
    <v-row>
      <v-breadcrumbs
        class="mb-3"
        :items="[
          {
            title: 'dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'jobs',
            disabled: false,
            to: `/admin/jobs/all`,
          },
          {
            title: job.title,
            disabled: true,
            to: `/admin/jobs/all/${id}`,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
  </v-container>
  <v-container class="pt-0">
    <!-- Back Button & Header -->
    <v-card flat>
      <v-card-title class="px-0">
        <v-btn
          icon="mdi-arrow-left"
          color="primary"
          variant="text"
          elevation="0"
          @click="handleBack"
        >
        </v-btn>
        <span class="text-h6 font-weight-bold">{{
          job.title || "Loading ..."
        }}</span>
      </v-card-title>
      <div class="px-3 mb-2">
        <SkillMatchBadge
          :skill-match="job.skill_match"
          :is-internal="job.is_internal"
          :clickable="true"
          :job-id="job.id"
          :user-id="me?.id"
          @click="openSkillMatchDialog"
        />
      </div>
      <div class="d-flex justify-space-between align-center px-3">
        <div class="job-main-info">
          <div class="text-body-1 mb-1 text-blue">
            {{ job.company?.company_name }}
          </div>
          <div class="text-caption">
            {{ job.region?.name }}
          </div>

          <!-- Posted Time -->
          <div class="text-caption text-grey">
            {{ formatTimeAgo(job.created_at) }}
          </div>
        </div>
        <v-avatar size="80" rounded="lg" class="bg-grey mr-3">
          <v-img
            v-if="job.company && job.company.logo_url"
            :src="`${job.company.logo_url.includes('http') ? '' : BASE_URL}${
              job.company.logo_url
            }`"
            cover
          ></v-img>
          <v-icon v-else size="40" class="text-white">
            mdi-briefcase-outline
          </v-icon>
        </v-avatar>
      </div>

      <v-card-text class="px-3">
        <!-- Salary Range -->

        <div class="mb-6" v-if="job.min_salary || job.max_salary">
          <div class="text-body-1 mb-2">Salary Range</div>
          <div class="text-body-2">
            IDR {{ formatSalary(job.min_salary) }} -
            {{ formatSalary(job.max_salary) }}
          </div>
        </div>

        <!-- Job Description -->
        <div class="mb-6">
          <div class="text-body-1 mb-2">Job description</div>
          <div v-html="job.description"></div>
        </div>

        <!-- Skills/Tags -->
        <div class="mb-6">
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="profession in job.professions"
              :key="profession.id"
              color="grey-lighten-3"
              variant="flat"
              size="small"
              label
            >
              {{ profession.name }}
            </v-chip>
          </div>
        </div>

        <!-- Action Buttons -->
        <v-row>
          <v-col cols="6">
            <v-btn
              block
              color="primary"
              rounded="lg"
              @click="handleSave"
              :loading="saving"
            >
              SAVE
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              block
              color="primary"
              rounded="lg"
              @click="handleApply"
              :loading="applying"
            >
              APPLY
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
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

  <!-- Skill Match Dialog -->
  <SkillMatchDialog
    v-model="skillMatchDialog"
    :job-id="selectedSkillMatchJobId"
    :user-id="selectedSkillMatchUserId"
  />
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const router = useRouter();
const { $apiFetch } = useApi();

// States
const job = ref({});
const saving = ref(false);
const applying = ref(false);
const loadingInitial = ref(true);
const { me, fetchMe } = useUser();
const skillMatchDialog = ref(false);
const selectedSkillMatchJobId = ref(null);
const selectedSkillMatchUserId = ref(null);

// Methods
const formatSalary = (value) => {
  if (!value) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
};

const handleBack = () => {
  router.back();
};

const openSkillMatchDialog = (data) => {
  selectedSkillMatchJobId.value = data.jobId;
  selectedSkillMatchUserId.value = data.userId;
  skillMatchDialog.value = true;
};

const handleSave = async () => {
  saving.value = true;
  try {
    await $apiFetch(`/applicants`, {
      method: "POST",
      body: {
        job_id: route.params.id,
        user_id: me.value.id,
        status: "SAVED",
      },
    });
    router.push(`/admin/jobs/saved`);
    // Show success message
  } catch (error) {
    console.error("Error saving job:", error);
    // Show error message
  } finally {
    saving.value = false;
  }
};

const handleApply = async () => {
  applying.value = true;
  try {
    await $apiFetch(`/applicants`, {
      method: "POST",
      body: {
        job_id: route.params.id,
        user_id: me.value.id,
        status: "CONNECT",
      },
    });
  } catch (error) {
    console.error("Error applying to job:", error);
    // Show error message
  } finally {
    applying.value = false;
  }
};

// Fetch job data
const fetchJob = async () => {
  loadingInitial.value = true;
  try {
    const response = await $apiFetch(`/jobs/search`, {
      params: {
        filters: {
          id: route.params.id,
        },
        expands: "company,region,professions",
        isCalculateSkillMatch: true,
      },
    });
    job.value = response.items[0];

    if (
      Array.isArray(job.value.profession_ids) &&
      job.value.profession_ids.length
    ) {
      const responseProfessions = await $apiFetch(`/mst-professions/search`, {
        params: {
          filters: {
            id: job.value.profession_ids,
          },
        },
      });
      job.value.professions = responseProfessions.items;
    }
  } catch (error) {
    console.error("Error fetching job:", error);
    // Show error message
  } finally {
    loadingInitial.value = false;
  }
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const posted = new Date(date);
  const diffTime = Math.abs(now - posted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

onMounted(() => {
  fetchJob();
  fetchMe();
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
