<template>
  <v-container fluid class="pb-0">
    <!-- Back Navigation -->
    <v-row class="mb-2">
      <v-btn
        icon="mdi-arrow-left"
        color="primary"
        variant="text"
        elevation="0"
        @click="handleBack"
      >
      </v-btn>
    </v-row>
  </v-container>
  <v-container fluid class="pt-0" v-if="applicant.job">
    <v-card
      rounded="lg"
      elevation="0"
      class="pa-4"
      style="border: 1px solid #e0e0e0"
    >
      <!-- Job Header Section -->
      <div class="d-flex align-center mb-3">
        <v-avatar size="56" rounded="lg" class="bg-grey-lighten-3 mr-4">
          <v-img
            v-if="applicant.job.company?.logo_url"
            :src="`${
              applicant.job.company.logo_url.includes('http') ? '' : BASE_URL
            }${applicant.job.company.logo_url}`"
            cover
          ></v-img>
          <v-icon v-else size="28" color="grey">mdi-briefcase-outline</v-icon>
        </v-avatar>
        <div class="job-info">
          <div class="d-flex align-center gap-2 mb-1 flex-wrap">
            <h3 class="mb-0">
              {{ applicant.job.title || "Loading ..." }}
            </h3>
            <SkillMatchBadge
              :skill-match="applicant.job.skill_match"
              :is-internal="applicant.job.is_internal"
              container-class="mb-0"
              :clickable="true"
              :job-id="applicant.job.id"
              :user-id="me?.id"
              @click="openSkillMatchDialog"
            />
          </div>
          <div class="d-flex align-center" style="font-size: 12px">
            <div class="company-name text-grey-darken-1 mb-1">
              {{ applicant.job.company?.company_name }}
            </div>
            <router-link
              :to="`/admin/jobs/applied?id=${applicant.job.id}`"
              target="_blank"
              variant="text"
              class="pa-0 px-2 ml-2 mb-1 font-weight-bold"
              color="primary"
              density="compact"
            >
              <v-icon size="small" start>mdi-open-in-new</v-icon>
              Job Post
            </router-link>
          </div>
        </div>
      </div>

      <!-- Application Status -->
      <div class="mb-2 status-flow-container" style="margin: -6px">
        <v-slide-group show-arrows v-model="tab">
          <v-slide-group-item
            v-for="(ajs, i) in applicant.applicantJobSteps"
            :key="i"
            v-slot="{ isSelected, toggle }"
          >
            <div class="status-item">
              <v-chip
                :color="colorAjsStatus(ajs.status)"
                :variant="isSelected ? 'flat' : 'outlined'"
                class="ma-2"
                rounded="lg"
                label
                size="large"
                @click="!isSelected && toggle()"
                :disabled="i > maxTab || ajs.status == 'PENDING' || loadingChip"
              >
                <v-icon
                  v-if="ajs.status == 'ACCEPTED'"
                  start
                  :color="isSelected ? 'white' : 'success'"
                  >mdi-check</v-icon
                >
                {{ ajs.jobStep.step_name }}
              </v-chip>
              <div class="connector"></div>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <div
        class="text-grey-darken-1 px-1"
        style="font-size: 12px"
        v-if="applicant.lastApplicantJobStep"
      >
        Update on
        {{ formatDateTime(applicant.lastApplicantJobStep?.updated_at) }}
      </div>
    </v-card>
  </v-container>
  <v-container class="pt-0" style="max-width: 900px">
    <v-tabs-window v-model="tab">
      <v-tabs-window-item v-for="(ajs, i) in applicant?.applicantJobSteps">
        <template v-if="ajs.jobStep.type == 'SYS_SHORTLIST'">
          <component
            :is="ShortlistStage"
            :ajs="ajs"
            :applicant="applicant"
            :tab="tab"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-else-if="ajs.jobStep.type == 'DETAIL_FULFILLMENT'">
          <component
            :is="DetailFulfillmentStage"
            :ajs="ajs"
            :applicant="applicant"
            :tab="tab"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-else-if="ajs.jobStep.type == 'QUESTIONNAIRE'">
          <component
            :is="QuestionnaireStage"
            :ajs="ajs"
            :applicant="applicant"
            :tab="tab"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-else-if="ajs.jobStep.type == 'TEST_PSYCHO'">
          <component
            :is="TestPsychoStage"
            :ajs="ajs"
            :applicant="applicant"
            :tab="tab"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-else-if="ajs.jobStep.type == 'INTERVIEW'">
          <component
            :is="InterviewStage"
            :ajs="ajs"
            :applicant="applicant"
            :tab="tab"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-else-if="ajs.jobStep.type == 'SYS_HIRED'">
          <component
            :is="HiredStage"
            :ajs="ajs"
            :applicant="applicant"
            :tab="tab"
            :user="me"
            @update:ajs="updateAjs"
          />
        </template>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-container>

  <!-- Loading Dialog -->
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
import ShortlistStage from "./stages/shortlist.vue";
import DetailFulfillmentStage from "./stages/detail-fulfillment.vue";
import QuestionnaireStage from "./stages/questionnaire.vue";
import InterviewStage from "./stages/interview.vue";
import HiredStage from "./stages/hired.vue";
import TestPsychoStage from "./stages/test_psycho.vue";

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
const applicant = ref({});
const loadingInitial = ref(true);
const tab = ref(0);
const maxTab = ref(0);
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

const updateAjs = (updatedAjs) => {
  // Find the index of the applicantJobStep to update
  const index = applicant.value.applicantJobSteps.findIndex(
    (ajs) => ajs.id === updatedAjs.id
  );

  // If found, update the specific applicantJobStep
  if (index !== -1) {
    applicant.value.applicantJobSteps[index] = updatedAjs;
  }
};

const updateTab = async (newTab) => {
  tab.value = newTab;
  maxTab.value = newTab;
  const currentAjs = applicant.value.applicantJobSteps[tab.value];
  if (["ACCEPTED", "FAILED"].includes(currentAjs.status)) {
    return;
  }
  await $apiFetch(`/applicants/${applicant.value.id}`, {
    method: "PATCH",
    body: {
      last_applicant_job_step_id: currentAjs.id,
    },
  });
  await $apiFetch(`/applicant-job-steps/${currentAjs.id}`, {
    method: "PATCH",
    body: {
      status: "CURRENT",
    },
  });
};

const loadingChip = ref(false);
const fetchApplicant = async () => {
  try {
    loadingChip.value = true;
    const responseApplicant = await $apiFetch(`/applicants/search`, {
      params: {
        filters: {
          job_id: route.params.id,
          user_id: me.value.id,
        },
        expands: "job.company,applicantJobSteps.jobStep,lastApplicantJobStep",
        sortBy: {
          "applicantJobSteps.jobStep.step_order": "asc",
        },
      },
    });
    applicant.value = responseApplicant.items[0];

    // Assign skill_match from applicant to job (skill_match already calculated by backend)
    if (
      applicant.value?.skill_match !== undefined &&
      applicant.value?.skill_match !== null
    ) {
      applicant.value.job.skill_match = applicant.value.skill_match;
    }

    if (applicant.value.last_applicant_job_step_id) {
      const index = applicant.value.applicantJobSteps.findIndex(
        (ajs) => ajs.id == applicant.value.last_applicant_job_step_id
      );
      tab.value = index;
      maxTab.value = index;
    }
  } catch (error) {
    console.error("Error fetching job:", error);
    // Show error message
  } finally {
    loadingInitial.value = false;
    loadingChip.value = false;
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
    if (me.value.company_id && me.value.company_role) {
      router.push(
        `/admin/jobs/employer/${route.params.id}/${
          route.query.applied_by ? route.query.applied_by + "/review" : ""
        }`
      );
    }
  }
  fetchApplicant();
});

/*watch(tab, (newVal) => {
  stopInterval();
  if (newVal == maxTab.value) {
    startInterval();
  }
});*/
const notificationStore = useNotificationStore();
watch(
  () => notificationStore.lastUpdated,
  (newValue) => {
    if (newValue) {
      fetchApplicant();
    }
  }
);
</script>

<style scoped>
.company-name {
  font-size: 0.95rem;
  font-weight: 500;
}

.location-time {
  font-size: 0.875rem;
}

.status-chip {
  font-weight: 500;
  background-color: white !important;
  border: 2px solid rgb(25, 118, 210) !important;
}

.custom-stepper {
  background: transparent !important;
}

.custom-stepper :deep(.v-stepper-header) {
  box-shadow: none;
  justify-content: space-between;
}

.custom-stepper :deep(.v-stepper-item) {
  flex: none;
}

.custom-stepper :deep(.v-stepper-item--complete) {
  color: rgb(25, 118, 210) !important;
}

.custom-stepper :deep(.v-stepper-item--complete .v-stepper-item__icon) {
  background-color: rgb(25, 118, 210) !important;
  color: white !important;
}

.custom-stepper :deep(.v-divider) {
  margin: 0 16px;
  border-width: 1px;
  flex: 1;
  opacity: 0.2;
}

.custom-stepper :deep(.step-title) {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
}

.custom-stepper :deep(.v-stepper-item__icon) {
  width: 28px;
  height: 28px;
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.12);
}

.status-flow-container {
  overflow: hidden;
}

.status-item {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.connector {
  position: absolute;
  right: -8px;
  top: 50%;
  width: 16px;
  height: 2px;
  background-color: #e0e0e0;
  z-index: 1;
}

.status-item:last-child .connector {
  display: none;
}
</style>
