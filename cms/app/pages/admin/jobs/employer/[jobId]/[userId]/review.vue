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
  <v-container fluid class="pt-0">
    <v-card
      rounded="lg"
      elevation="0"
      class="pa-4"
      style="border: 1px solid #e0e0e0"
    >
      <!-- Job Header Section -->
      <div
        class="font-weight-bold mb-2"
        style="font-size: 14px"
        v-if="applicant?.job"
      >
        Applying for {{ applicant?.job.title }}
        <v-chip
          color="grey"
          variant="outlined"
          size="small"
          class="ml-2"
          height="18"
          v-for="s in applicant?.job.employment_status"
          :key="s"
        >
          <v-icon start>mdi-briefcase-clock-outline</v-icon> {{ s }}
        </v-chip>
      </div>
      <div class="d-flex align-center mb-3">
        <v-avatar size="66" rounded="lg" class="bg-grey-lighten-3 mr-4">
          <v-img
            v-if="user.photo_url"
            :src="
              user.photo_url.includes('http')
                ? user.photo_url
                : BASE_URL + user.photo_url
            "
            cover
          />
          <div
            v-else
            class="d-flex align-center justify-center"
            style="height: 100%"
          >
            <span class="text-h3">{{ getInitials(user.full_name) }}</span>
          </div>
        </v-avatar>

        <!-- Profile Info -->
        <div class="mt-2 mb-2 pl-1">
          <!-- Badges -->
          <div class="d-flex gap-2 mb-1">
            <h3 class="font-weight-bold">
              {{ user.full_name || "(not set)" }}
            </h3>
            <div class="d-flex gap-2" style="margin-top: 2px">
              <v-img
                v-if="user.is_skill_passport_verified"
                src="/images/asp-badge.svg"
                width="24"
                height="24"
              ></v-img>
              <v-avatar color="brown" size="24" v-if="user.is_school_verified">
                <v-icon size="20">mdi-school-outline</v-icon>
              </v-avatar>
            </div>
            <SkillMatchBadge
              v-if="
                applicant?.skill_match !== undefined &&
                applicant?.skill_match !== null
              "
              :skill-match="applicant.skill_match"
              :clickable="true"
              :job-id="route.params.jobId"
              :user-id="route.params.userId"
              @click="openSkillMatchDialog"
              container-class="mb-0"
            />
          </div>

          <!-- Contact Info -->
          <div
            class="gap-4 text-subtitle-2 text-grey-darken-1"
            :class="{ 'd-flex': isDesktop, 'd-block': isMobile }"
          >
            <div class="d-flex align-center">
              <a
                :href="`tel:${user.phone}`"
                target="_blank"
                class="text-grey-darken-1"
              >
                <v-icon color="primary" class="mr-2">mdi-phone-outline</v-icon>
                {{ user.phone }}
              </a>
            </div>
            <div class="d-flex align-center">
              <a
                :href="`mailto:${user.email}`"
                target="_blank"
                class="text-grey-darken-1"
              >
                <v-icon color="primary" class="mr-2">mdi-email-outline</v-icon>
                {{ user.email }}
              </a>
            </div>
            <router-link
              :to="`/admin/jobs/employer/${route.params.jobId}/${route.params.userId}`"
              target="_blank"
              variant="text"
              class="pa-0 px-2font-weight-bold"
              color="primary"
              density="compact"
            >
              <v-icon start>mdi-open-in-new</v-icon>
              Candidate Profile
            </router-link>
          </div>
        </div>
      </div>

      <!-- Application Status -->
      <div class="mb-2 status-flow-container" style="margin: -6px">
        <v-slide-group show-arrows center-active v-model="tab">
          <v-slide-group-item
            v-for="(ajs, i) in applicant?.applicantJobSteps"
            :key="i"
            v-slot="{ isSelected, toggle }"
          >
            <div class="status-item">
              <v-chip
                :color="
                  ajs.id == applicant.last_applicant_job_step_id &&
                  !['ACCEPTED', 'FAILED'].includes(ajs.status)
                    ? 'primary'
                    : colorAjsStatus(
                        ajs.status,
                        'employer',
                        ajs.jobStep.type == 'INTERVIEW'
                      )
                "
                :variant="isSelected ? 'flat' : 'outlined'"
                class="ma-2 bg-white"
                rounded="lg"
                label
                size="large"
                @click="!isSelected && toggle()"
                :disabled="
                  (i > maxTab && ajs.status == 'PENDING') ||
                  loadingChip ||
                  loadingInitial
                "
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
        v-if="applicant && applicant.updated_at"
      >
        Update on
        {{ formatDate(applicant.updated_at) }}
      </div>
    </v-card>
  </v-container>
  <v-container class="pt-0" style="max-width: 900px">
    <v-tabs-window v-model="tab">
      <v-tabs-window-item v-for="(ajs, i) in applicant?.applicantJobSteps">
        <template v-if="ajs.jobStep.type == 'SYS_SHORTLIST'">
          <component
            :is="ShortlistStage"
            :user="user"
            :applicant="applicant"
            :ajs="ajs"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-if="ajs.jobStep.type == 'DETAIL_FULFILLMENT'">
          <component
            :is="DetailFulfillmentStage"
            :applicant="applicant"
            :user="user"
            :ajs="ajs"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
          />
        </template>
        <template v-if="ajs.jobStep.type == 'QUESTIONNAIRE'">
          <component
            :is="QuestionnaireStage"
            :ajs="ajs"
            :user="user"
            :applicant="applicant"
            @update:tab="updateTab"
            @update:ajs="updateAjs"
            @update:loading="updateLoading"
          />
        </template>
        <template v-if="ajs.jobStep.type == 'INTERVIEW'">
          <component
            :is="InterviewStage"
            :ajs="ajs"
            :user="user"
            :me="me"
            :applicant="applicant"
            @update:ajs="updateAjs"
            @update:tab="updateTab"
          />
        </template>
        <template v-if="ajs.jobStep.type == 'TEST_PSYCHO'">
          <component
            :is="TestPsychoStage"
            :ajs="ajs"
            :user="user"
            :me="me"
            :applicant="applicant"
            @update:ajs="updateAjs"
            @update:tab="updateTab"
          />
        </template>
        <template v-if="ajs.jobStep.type == 'SYS_HIRED'">
          <component
            :is="HiredStage"
            :user="user"
            :applicant="applicant"
            :ajs="ajs"
            @update:ajs="updateAjs"
            @update:tab="updateTab"
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
    :is-candidate="true"
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
  middleware: ["auth", "employer-jobs"],
});

const { isMobile, isDesktop } = useScreenSize();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const router = useRouter();
const { $apiFetch } = useApi();

// States
const job = ref({});
const applicant = ref({});
const user = ref({ phone: "" });
const saving = ref(false);
const applying = ref(false);
const loadingInitial = ref(true);
const loadingChip = ref(false);
const tab = ref(0);
const maxTab = ref(0);
const skillMatchDialog = ref(false);
const selectedSkillMatchJobId = ref(null);
const selectedSkillMatchUserId = ref(null);
const { me, fetchMe } = useUser();

const handleBack = () => {
  router.back();
};

const openSkillMatchDialog = (data) => {
  selectedSkillMatchJobId.value = data.jobId;
  selectedSkillMatchUserId.value = data.userId;
  skillMatchDialog.value = true;
};

// Fetch job data

const fetchApplicant = async () => {
  loadingChip.value = true;
  try {
    const responseApplicant = await $apiFetch(`/applicants/search`, {
      params: {
        filters: {
          job_id: route.params.jobId,
          user_id: route.params.userId,
        },
        expands: "job,applicantJobSteps.jobStep",
        sortBy: {
          "applicantJobSteps.jobStep.step_order": "asc",
        },
      },
    });
    applicant.value = responseApplicant.items[0];

    if (applicant.value.applicantJobSteps.length > 0) {
      const detailFulfillmentIndex =
        applicant.value.applicantJobSteps.findIndex(
          (ajs) => ajs.id == applicant.value.last_applicant_job_step_id
        );
      if (detailFulfillmentIndex >= 0) {
        tab.value = detailFulfillmentIndex;
        maxTab.value = detailFulfillmentIndex;
      }
    }
  } catch (error) {
    console.error("Error fetching job:", error);
    // Show error message
  } finally {
    loadingInitial.value = false;
    loadingChip.value = false;
  }
};

const fetchUser = async () => {
  const response = await $apiFetch(`/users/search`, {
    params: {
      filters: {
        id: route.params.userId,
      },
      expands: "region,userSkills.skill,userInterests.interest",
    },
  });
  user.value = response.items[0];
  const responseEncrypted = await $apiFetch(`/encrypted-user-data/search`, {
    params: {
      filters: {
        user_id: user.value.id,
      },
    },
  });
  if (responseEncrypted.items && responseEncrypted.items[0]) {
    const encryptedUser = responseEncrypted.items[0];
    user.value.phone = encryptedUser.encrypted_phone;
    user.value.address = encryptedUser.encrypted_address;
    user.value.date_of_birth = encryptedUser.encrypted_date_of_birth;
  }

  const responseResume = await $apiFetch(`/user-files/search`, {
    params: {
      filters: { user_id: route.params.userId, file_url: "resume" },
    },
  });
  if (responseResume.items && responseResume.items[0]) {
    user.value.resume_url = responseResume.items[0].file_url;
  }
};

const updateAjs = (ajs) => {
  applicant.value.applicantJobSteps[tab.value] = ajs;
  if (["ACCEPTED", "FAILED"].includes(ajs.status)) {
    fetchApplicant();
  }
};

const updateTab = (newTab) => {
  tab.value = newTab;
  fetchApplicant();
};

const updateLoading = (newLoading) => {
  loadingChip.value = newLoading;
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe(true);
  } else {
    if (me.value.user_role == "candidate") {
      router.push(`/admin/dashboard`);
    }
  }
  fetchApplicant();
  fetchUser();
  //startInterval();
});

const notificationStore = useNotificationStore();
watch(
  () => notificationStore.lastUpdated,
  (newValue) => {
    if (newValue) {
      fetchApplicant();
    }
  }
);

/*const interval = ref(null);

const startInterval = () => {
  interval.value = setInterval(fetchApplicant, 25000);
};

const stopInterval = () => {
  if (interval.value) {
    clearInterval(interval.value);
    interval.value = null;
  }
};

watch(tab, (newVal) => {
  stopInterval();
  if (newVal == maxTab.value) {
    startInterval();
  }
});

onBeforeUnmount(() => {
  stopInterval();
});

onUnmounted(() => {
  stopInterval();
});*/
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
