<template>
  <v-dialog
    v-model="dialog"
    max-width="650"
    persistent
    :z-index="3000"
    scrim="rgba(0, 0, 0, 0.5)"
    attach
    class="skill-match-dialog"
  >
    <v-card rounded="xl" elevation="0">
      <v-toolbar density="compact" flat class="bg-transparent">
        <v-toolbar-title class="font-weight-bold">Skill Match</v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-divider />

      <v-card-text v-if="loading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
        <div class="mt-4 text-grey-darken-1">
          Loading skill match details...
        </div>
      </v-card-text>

      <v-card-text v-else-if="skillMatchDetail">
        <!-- Employer POV Design -->
        <template v-if="!isCandidate">
          <!-- Skill Match Badge and Job Title -->
          <div class="d-flex align-center justify-space-between mb-6">
            <div class="flex-grow-1">
              <div class="d-flex align-center gap-2 mb-2">
                <v-chip
                  v-if="!hasNoSkillMatch"
                  size="small"
                  class="skill-match-badge-headr"
                  color="#ffb74c"
                  variant="outlined"
                >
                  <v-icon size="14" class="mr-1">mdi-shield-check</v-icon>
                  {{ formatPercentage(skillMatchDetail.percentage) }}% Skill
                  Match
                </v-chip>
                <v-chip
                  v-if="!hasNoSkillMatch && skillMatchDetail.is_education_match"
                  size="x-small"
                  color="brown"
                  variant="flat"
                >
                  <v-icon size="14" class="mr-1">mdi-school</v-icon>
                  Match by Education
                </v-chip>
               
              </div>
              <h4 class="font-weight-bold mb-0">
                {{ skillMatchDetail.job_name }}
              </h4>
            </div>
            <v-avatar
              v-if="jobDetail?.company?.logo_url"
              size="50"
              rounded="lg"
              class="ml-3 bg-grey-lighten-2"
            >
              <v-img :src="BASE_URL + jobDetail.company.logo_url" cover></v-img>
            </v-avatar>
          </div>

          <!-- Verified Skill Match -->
          <div
            class="mb-4"
            v-if="skillMatchDetail.verified_match_skills.length > 0"
          >
            <h3 class="font-weight-bold mb-3" style="font-size: 17px">
              Verified Skill Match
            </h3>
            <div
              v-for="skill in skillMatchDetail.verified_match_skills"
              :key="`verified-${skill}`"
              class="d-flex align-center mb-2"
              style="font-size: 14px"
            >
              <v-icon size="20" class="mr-2 verified-skill-icon"
                >mdi-shield-check-outline</v-icon
              >
              <span>{{ skill }}</span>
            </div>
          </div>

          <!-- Unverified Skill Match -->
          <div
            class="mb-4"
            v-if="skillMatchDetail.unverified_match_skills.length > 0"
          >
            <h3 class="font-weight-bold mb-3" style="font-size: 17px">
              Unverified Skill Match
            </h3>
            <div
              v-for="skill in skillMatchDetail.unverified_match_skills"
              :key="`unverified-${skill}`"
              class="d-flex align-center mb-2"
              style="font-size: 14px"
            >
              <v-icon size="20" color="primary" class="mr-2"
                >mdi-check-circle</v-icon
              >
              <span>{{ skill }}</span>
            </div>
          </div>

          <!-- Not Matched -->
          <div v-if="skillMatchDetail.unmatched_job_skills.length > 0">
            <h3 class="font-weight-bold mb-3" style="font-size: 17px">
              Not Matched
            </h3>
            <div
              v-for="skill in skillMatchDetail.unmatched_job_skills"
              :key="skill"
              class="d-flex align-center mb-2"
              style="font-size: 14px"
            >
              <v-icon size="20" color="grey" class="mr-2"
                >mdi-minus-circle</v-icon
              >
              <span class="text-grey-darken-1">{{ skill }}</span>
            </div>
          </div>
        </template>

        <!-- Candidate POV Design (Keep existing design) -->
        <template v-else>
          <!-- Skill Match Percentage -->
          <div class="d-flex align-center mb-4">
            <span v-if="hasNoSkillMatch" class="text-primary font-weight-bold">
              No Skill match for {{ skillMatchDetail.job_name }} - No Skills
            </span>
            <div v-else class="d-flex align-center gap-2">
              <span class="text-primary font-weight-bold">
                {{ formatPercentage(skillMatchDetail.percentage) }}% Skill match
                for
                {{ skillMatchDetail.job_name }}
              </span>
              <v-chip
                v-if="skillMatchDetail.is_education_match"
                size="small"
                color="brown"
                variant="flat"
                class="pr-4"                
              >
                <v-icon size="14" class="mr-1">mdi-school</v-icon>
                Match by Education
              </v-chip>
            </div>
            <v-tooltip v-if="!hasNoSkillMatch && !skillMatchDetail.is_education_match" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" color="grey" class="ml-2"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span
                >Skill match percentage based on verified and unverified
                skills</span
              >
            </v-tooltip>
          </div>

          <!-- Candidate Information -->
          <div class="d-flex align-center mb-6">
            <v-avatar size="70" class="mr-3 bg-grey">
              <v-img
                v-if="skillMatchDetail.user.photo_url"
                :src="BASE_URL + skillMatchDetail.user.photo_url"
                cover
              ></v-img>
              <v-icon v-else size="30" color="grey">mdi-account-circle</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="d-flex align-center mb-1">
                <span class="font-weight-bold">{{
                  skillMatchDetail.user.name
                }}</span>
                <v-icon
                  size="small"
                  color="grey"
                  class="mx-2"
                  @click="openCandidateProfile"
                  style="cursor: pointer"
                  >mdi-open-in-new</v-icon
                >
                <div class="d-flex gap-2" style="margin-top: 2px">
                  <v-img
                    v-if="skillMatchDetail.user.is_skill_passport_verified"
                    src="/images/asp-badge.svg"
                    width="24"
                    height="24"
                  ></v-img>
                  <v-avatar
                    color="brown"
                    size="24"
                    v-if="skillMatchDetail.user.is_school_verified"
                  >
                    <v-icon size="20">mdi-school-outline</v-icon>
                  </v-avatar>
                </div>
              </div>
              <div
                v-if="skillMatchDetail.user.occupation"
                class="d-flex align-center text-caption text-grey-darken-1 mb-1"
              >
                <v-icon size="14" class="mr-1">mdi-briefcase-outline</v-icon>
                {{ skillMatchDetail.user.occupation }}
              </div>
              <div
                v-if="skillMatchDetail.user.location"
                class="d-flex align-center text-caption text-grey-darken-1"
              >
                <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
                {{ skillMatchDetail.user.location }}
              </div>
            </div>
          </div>

          <!-- Verified Skill Match (includes both verified and unverified matched skills) -->
          <div class="mb-4">
            <h3 class="font-weight-bold mb-3" font-size="17px">Skill Match</h3>
            <div
              v-if="
                skillMatchDetail.verified_match_skills.length > 0 ||
                skillMatchDetail.unverified_match_skills.length > 0
              "
            >
              <!-- Verified Skills (Gold Shield Icon) -->
              <div
                v-for="skill in skillMatchDetail.verified_match_skills"
                :key="`verified-${skill}`"
                class="d-flex align-center mb-2"
                style="font-size: 14px"
              >
                <v-icon size="20" color="amber-darken-2" class="mr-2"
                  >mdi-shield-check-outline</v-icon
                >
                <span>{{ skill }}</span>
              </div>
              <!-- Unverified Skills (Blue Circle Icon) -->
              <div
                v-for="skill in skillMatchDetail.unverified_match_skills"
                :key="`unverified-${skill}`"
                class="d-flex align-center mb-2"
                style="font-size: 14px"
              >
                <v-icon size="20" color="primary" class="mr-2"
                  >mdi-check-circle</v-icon
                >
                <span>{{ skill }}</span>
              </div>
            </div>
            <div v-else class="text-grey-darken-1">Data not found</div>
          </div>

          <!-- Not Matched -->
          <div>
            <h3 class="font-weight-bold mb-3" style="font-size: 17px">
              Not Matched
            </h3>
            <div v-if="skillMatchDetail.unmatched_job_skills.length > 0">
              <div
                v-for="skill in skillMatchDetail.unmatched_job_skills"
                :key="skill"
                class="d-flex align-center mb-2"
                style="font-size: 14px"
              >
                <v-icon size="20" color="grey" class="mr-2"
                  >mdi-minus-circle</v-icon
                >
                <span class="text-grey-darken-1">{{ skill }}</span>
              </div>
            </div>
            <div v-else class="text-grey-darken-1">Data not found</div>
          </div>
        </template>
      </v-card-text>

      <v-card-text v-else-if="error" class="text-center py-8">
        <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
        <div class="text-error">{{ error }}</div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  jobId: {
    type: String,
    default: null,
  },
  userId: {
    type: String,
    default: null,
  },
  isCandidate: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const dialog = ref(false);
const loading = ref(false);
const error = ref(null);
const skillMatchDetail = ref(null);
const jobDetail = ref(null);
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const { $apiFetch } = useApi();

const hasNoSkillMatch = computed(() => {
  if (!skillMatchDetail.value) return false;
  // If percentage is 100% due to education match, it's not "no skill match"
  if (skillMatchDetail.value.percentage === 100 && skillMatchDetail.value.is_education_match) {
    return false;
  }
  return (
    skillMatchDetail.value.percentage === -1 ||
    (skillMatchDetail.value.verified_match_skills.length === 0 &&
      skillMatchDetail.value.unverified_match_skills.length === 0 &&
      skillMatchDetail.value.unmatched_job_skills.length === 0)
  );
});

watch(
  () => props.modelValue,
  (newVal) => {
    dialog.value = newVal;
    if (newVal && props.jobId && props.userId) {
      fetchSkillMatchDetail();
    }
  }
);

watch(dialog, (newVal) => {
  emit("update:modelValue", newVal);
});

const formatPercentage = (percentage) => {
  if (percentage === -1 || percentage === null || percentage === undefined) {
    return "-";
  }
  return percentage.toFixed(0);
};

const fetchSkillMatchDetail = async () => {
  if (!props.jobId || !props.userId) {
    error.value = "Job ID and User ID are required";
    return;
  }

  loading.value = true;
  error.value = null;
  skillMatchDetail.value = null;
  jobDetail.value = null;

  try {
    // Fetch skill match detail (required)
    const skillMatchResponse = await $apiFetch("/skill-match/detail", {
      params: {
        job_id: props.jobId,
        applicant_user_id: props.userId,
      },
    });
    skillMatchDetail.value = skillMatchResponse;

    // Fetch job detail for company logo (only for employer POV, optional)
    if (!props.isCandidate) {
      try {
        const jobResponse = await $apiFetch(`/jobs/search`, {
          params: {
            filters: {
              id: props.jobId,
            },
            expands: "company",
          },
        });
        jobDetail.value = jobResponse.items[0];
      } catch (jobErr) {
        // Log but don't fail - job detail is optional
        console.warn("Failed to fetch job detail:", jobErr);
      }
    }
  } catch (err) {
    console.error("Error fetching skill match detail:", err);
    error.value =
      err.response?.data?.message || "Failed to load skill match details";
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  dialog.value = false;
  skillMatchDetail.value = null;
  jobDetail.value = null;
  error.value = null;
};

const openCandidateProfile = () => {
  if (skillMatchDetail.value?.user?.user_id) {
    // Navigate to candidate profile in new tab
    let url;
    if (!props.isCandidate) {
      url = `/admin/profile`;
    } else {
      url = `/admin/jobs/employer/${props.jobId}/${skillMatchDetail.value.user.user_id}`;
    }
    window.open(url, "_blank");
  }
};
</script>

<style scoped>
.v-toolbar-title {
  font-size: 1.25rem;
}

.skill-match-badge-header {
  background-color: #ffb74d !important;
  color: #ffffff !important;
  font-weight: 500;
  height: 28px !important;
}

.verified-skill-icon {
  color: #ffb74d !important;
}
</style>

<style>
/* Ensure skill match dialog appears above job detail dialog on mobile */
.skill-match-dialog .v-overlay__content {
  z-index: 3000 !important;
}

.skill-match-dialog .v-overlay__scrim {
  z-index: 2999 !important;
}
</style>
