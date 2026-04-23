<template>
  <v-card rounded="lg" elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-text>
      <div class="d-flex flex-column">
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <span class="font-weight-bold" style="font-size: 20px">
              <template v-if="localAjs.status == 'ACCEPTED'">
                Application Shortlisted
              </template>
              <template v-else-if="localAjs.status == 'FAILED'">
                Application Rejected
              </template>
              <template v-else> Application Submitted </template>
            </span>
            <v-chip
              :color="colorAjsStatus(localAjs.status)"
              variant="flat"
              class="ml-2"
              size="small"
              style="vertical-align: middle"
            >
              {{ labelAjsStatus(localAjs.status) }}
            </v-chip>
          </div>
        </div>
        <!-- Subheader -->
        <div class="mb-2 text-grey-darken-1" style="font-size: 14px">
          <template v-if="localAjs.status == 'ACCEPTED'">
            Your have been accepted to continue the next stage.
          </template>
          <template v-else-if="localAjs.status == 'FAILED'">
            Thank you for applying for the {{ applicant.job.title }} position at
            {{ applicant.job.company.company_name }}. We have chosen to proceed
            with another candidate, we appreciate your interest and wish you
            success in your job search.
          </template>
          <template v-else>
            Your application is currently waiting to be reviewed by employer.
          </template>
        </div>

        <div
          v-if="['SUBMITTED', 'PENDING'].includes(localAjs.status)"
          class="text-caption text-grey-darken-1"
        >
          Applied on
          {{ formatDate(localAjs.created_at) }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { formatDate, colorAjsStatus, labelAjsStatus } from "~/utils/format.js";
const { $apiFetch } = useApi();

// Props
const props = defineProps({
  ajs: {
    type: Object,
    required: true,
  },
  applicant: {
    type: Object,
    required: true,
  },
  tab: {
    type: Number,
    required: true,
  },
});

// Emit event to update parent
const emit = defineEmits(["update:ajs", "update:tab"]);

// Create reactive local data
const localAjs = ref({ ...props.ajs });

// Watch for props changes and update local data
watch(
  () => props.ajs,
  (newAjs) => {
    localAjs.value = { ...newAjs };
  },
  { immediate: true }
);

const fetchAjs = async () => {
  try {
    const response = await $apiFetch(`/applicant-job-steps/search`, {
      method: "GET",
      params: {
        id: props.ajs.id,
        expands: "jobStep",
      },
    });

    // Update local reactive data
    localAjs.value = response.items[0];

    // Emit the updated data to parent
    emit("update:ajs", response.items[0]);
  } catch (error) {
    console.error("Error fetching AJS:", error);
  }
};

const continueLoading = ref(false);
const handleContinue = async () => {
  continueLoading.value = true;
  emit("update:tab", props.tab + 1);
  continueLoading.value = false;
};
</script>

<style scoped>
/* Component-specific styles can be added here if needed */
</style>
