<template>
  <v-card
    class="mb-8"
    rounded="lg"
    elevation="0"
    style="border: 1px solid #e0e0e0"
  >
    <v-card-text>
      <div class="d-flex flex-column">
        <div class="d-flex align-center mb-2">
          <h3 class="mr-2" style="font-size: 18px">Hiring Process</h3>
          <v-chip
            v-if="localAjs.status == 'ACCEPTED'"
            color="success"
            variant="flat"
            size="small"
            class="ml-1"
          >
            Approved
          </v-chip>
          <v-chip
            v-if="localAjs.status == 'FAILED'"
            color="error"
            variant="flat"
            size="small"
            class="ml-1"
          >
            Rejected
          </v-chip>
        </div>
        <template v-if="!['FAILED'].includes(localAjs.status)">
          <p
            class="mb-4"
            style="font-size: 16px"
            v-if="!localAjs.status == 'ACCEPTED'"
          >
            Ensure all required documents are accurate and complete. Update the
            status accordingly whether the process is smooth or there are
            issues. If you've decided to proceed with this candidate, input the
            start date, add any necessary details, and optionally upload
            attachments as proof of hire.
          </p>

          <p class="mb-4" style="font-size: 16px" v-else>
            Congratulations! You have successfully hired {{ user.full_name }},
            and they have signed the contract. Please ensure a smooth and
            welcoming onboarding experience once they join the team. Make them
            feel valued from day one and help them integrate into the company
            culture seamlessly.
          </p>

          <div class="mb-4">
            <label
              class="mb-2 d-block text-grey-darken-1"
              style="font-size: 12px"
              >Start Date (Optional)</label
            >

            <v-text-field
              v-model="startDateForInput"
              type="date"
              placeholder="Choose date"
              variant="outlined"
              rounded="lg"
              density="comfortable"
              :rules="dateRules"
              :error-messages="dateError"
              :readonly="['ACCEPTED'].includes(localAjs.status)"
              :min="today"
            ></v-text-field>
          </div>

          <div class="mb-4">
            <label
              class="mb-2 d-block text-grey-darken-1"
              style="font-size: 12px"
              >Description (Optional)</label
            >
            <v-textarea
              v-model="postData.hiring_description"
              :placeholder="
                !['ACCEPTED', 'FAILED'].includes(localAjs.status)
                  ? 'Enter details or instructions for the candidate here'
                  : 'Not Provided'
              "
              variant="outlined"
              density="comfortable"
              hide-details
              rounded="lg"
              rows="4"
              auto-grow
              style="white-space: pre-wrap !important; resize: vertical"
              :readonly="['ACCEPTED'].includes(localAjs.status)"
            ></v-textarea>
          </div>

          <div class="mb-6">
            <label
              class="mb-2 d-block text-grey-darken-1"
              style="font-size: 12px"
              >Attachment (Optional)</label
            >
            <v-file-upload
              v-model="postData.hiring_attachment"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading.sync="loadingUpload"
              class="rounded-lg"
              category="result_hiring"
              placeholder="Upload attachment (max size 20MB)"
              :max-size="20"
              :accept="'.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.mkv,.mp3,.wav,.m4a,.ogg,.webm,.webp'"
              :readonly="['ACCEPTED'].includes(localAjs.status)"
            ></v-file-upload>
          </div>

          <div
            class="d-flex align-center gap-2"
            v-if="!['ACCEPTED'].includes(localAjs.status)"
          >
            <v-btn
              color="error"
              variant="outlined"
              class="font-weight-bold"
              block
              style="min-width: 120px"
              rounded="lg"
              height="40"
              @click="handleReject"
              :loading="rejectLoading"
            >
              Reject
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="font-weight-bold"
              style="min-width: 120px"
              block
              rounded="lg"
              height="40"
              @click="handleAccept"
              :loading="acceptLoading"
            >
              Hire
            </v-btn>
            <v-menu v-if="ajs.id == applicant.last_applicant_job_step_id">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon
                  variant="outlined"
                  rounded="lg"
                  size="small"
                  color="primary"
                  v-bind="props"
                  class="ml-2"
                  height="36"
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="openMoveDialog" style="cursor: pointer">
                  <v-list-item-title>Move Candidate</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
        <template v-else>
          <div
            class="text-grey-darken-1 font-weight-regular"
            style="font-size: 14px"
          >
            After careful consideration, {{ user.full_name }} has not been
            selected for the position. While they were not the right fit for
            this role, we appreciate their time and effort during the
            application process. Please ensure that the candidate is informed
            professionally and kindly, and maintain a positive relationship for
            potential future opportunities.
          </div>
        </template>
      </div>
    </v-card-text>
  </v-card>
  <v-dialog v-model="moveDialog" max-width="700">
    <v-card rounded="lg">
      <v-card-title class="px-6 font-weight-bold d-flex align-center">
        Move Candidate
        <v-spacer />
        <v-btn icon @click="closeMoveDialog" variant="text">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="pt-0">
        <div class="mb-4 text-grey-darken-1" style="font-size: 14px">
          By moving candidate stage you can skip recruitment steps you find
          unnecessary for certain candidates
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
                <v-avatar
                  color="brown"
                  size="24"
                  v-if="user.is_school_verified"
                >
                  <v-icon size="20">mdi-school-outline</v-icon>
                </v-avatar>

                <v-chip
                  style="display: none"
                  class="ml-2"
                  size="small"
                  color="primary"
                  variant="outlined"
                >
                  3 / 10 Skill Match
                </v-chip>
              </div>
            </div>

            <!-- Contact Info -->
            <div
              class="gap-4 text-subtitle-2 text-grey-darken-1"
              :class="{ 'd-flex': isDesktop, 'd-block': isMobile }"
            >
              <div class="d-flex align-center text-caption">
                <a
                  :href="`tel:${user.phone}`"
                  target="_blank"
                  class="text-grey-darken-1"
                >
                  <v-icon color="primary">mdi-phone-outline</v-icon>
                  {{ user.phone }}
                </a>
              </div>
              <div class="d-flex align-center">
                <a
                  :href="`mailto:${user.email}`"
                  target="_blank"
                  class="text-grey-darken-1"
                >
                  <v-icon color="primary">mdi-email-outline</v-icon>
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

        <div class="mb-2 text-caption text-grey">
          Updated on
          {{
            new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })
          }}
        </div>

        <div class="mb-1 text-grey-darken-1" style="font-size: 12px">
          Recruitment Stage
        </div>
        <v-select
          variant="outlined"
          rounded="lg"
          v-model="selectedStage"
          :items="stages"
          placeholder="Choose Destination Stage"
          item-title="name"
          density="comfortable"
          item-value="id"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-6">
        <v-spacer />
        <v-btn variant="outlined" rounded="lg" @click="closeMoveDialog"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          rounded="lg"
          variant="flat"
          min-width="120"
          @click="handleMoveCandidate"
          :disabled="!selectedStage"
          :loading="moveLoading"
          >Move</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth", "employer-jobs"],
});

// Props
const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({ phone: "" }),
  },
  applicant: {
    type: Object,
    required: true,
    default: () => ({}),
  },
  ajs: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

const { $apiFetch } = useApi();
const emit = defineEmits(["update:ajs", "update:tab"]);
const localAjs = ref({ ...props.ajs });

const postData = ref({
  start_date: null,
  hiring_attachment: null,
  hiring_description: null,
});

// Helper function to format date for HTML input
const formatDateForInput = (dateString) => {
  if (!dateString) return null;

  // Extract date part directly from ISO string to avoid timezone issues
  if (dateString.includes("T")) {
    return dateString.split("T")[0]; // Direct extraction: "2025-08-31T00:00:00.000" -> "2025-08-31"
  }

  // If it's already in YYYY-MM-DD format, return as is
  return dateString;
};

// Helper function to format date back to ISO string
const formatDateFromInput = (dateString) => {
  if (!dateString) return null;
  // Keep it simple - just add time component without timezone conversion
  return dateString + "T00:00:00.000";
};

// Computed property for the date input
const startDateForInput = computed({
  get() {
    return formatDateForInput(postData.value.start_date);
  },
  set(value) {
    postData.value.start_date = value ? formatDateFromInput(value) : null;
  },
});

const stages = ref([]);
const selectedStage = ref(null);

watch(
  () => props.ajs.status,
  (newAjs) => {
    localAjs.value = { ...props.ajs };

    // Format the start_date properly for the input
    postData.value = Object.assign(postData.value, props.ajs.attributes);

    stages.value = props.applicant.applicantJobSteps
      .filter((step) => step.id != localAjs.value.id)
      .map((step) => ({
        id: step.id,
        name: step.jobStep.step_name,
      }));
  },
  { immediate: true }
);

const snackbar = useSnackbarStore();
const acceptLoading = ref(false);
const rejectLoading = ref(false);

const handleAccept = async () => {
  acceptLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "ACCEPTED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Application accepted",
      color: "success",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    acceptLoading.value = false;
  }
};

const dialog = useDialogStore();
const handleReject = async () => {
  await dialog.openDialog({
    title: "Reject Application",
    message: "Are you sure you want to reject the candidate?",
    confirmButtonText: "Reject",
    confirmButtonColor: "error",
    cancelButtonText: "No",
    autoClose: false,
  });
  dialog.loading = true;
  rejectLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "FAILED",
      },
    });
    snackbar.showSnackbar({
      message: "Application rejected",
      color: "error",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    rejectLoading.value = false;
    dialog.closeDialog();
  }
};

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const moveDialog = ref(false);
const openMoveDialog = () => {
  moveDialog.value = true;
};
const closeMoveDialog = () => {
  moveDialog.value = false;
  selectedStage.value = null;
};
const moveLoading = ref(false);
const handleMoveCandidate = async () => {
  moveLoading.value = true;
  try {
    if (!selectedStage.value) {
      snackbar.showSnackbar({
        message: "Please select a destination stage",
        color: "error",
      });
      return;
    }
    await $apiFetch(`/applicants/${props.applicant.id}`, {
      method: "PATCH",
      body: {
        last_applicant_job_step_id: selectedStage.value,
      },
    });
    snackbar.showSnackbar({
      message: "Candidate moved successfully!",
      color: "success",
    });
    const dtab = props.applicant.applicantJobSteps.findIndex(
      (step) => step.id == selectedStage.value
    );
    emit("update:tab", dtab);
    closeMoveDialog();
  } catch (error) {
  } finally {
    moveLoading.value = false;
  }
};

// Get today's date in YYYY-MM-DD format
const today = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

// Validation rules for the date field
const dateRules = ref([
  (value) => {
    if (!value || ["ACCEPTED", "FAILED"].includes(props.ajs.status))
      return true; // Optional field, so empty is valid
    const selectedDate = new Date(value);
    const todayDate = new Date(today.value);
    return (
      selectedDate >= todayDate || "Start date cannot be earlier than today"
    );
  },
]);

// Reactive error message for better UX
const dateError = computed(() => {
  if (
    !startDateForInput.value ||
    ["ACCEPTED", "FAILED"].includes(props.ajs.status)
  )
    return [];
  const selectedDate = new Date(startDateForInput.value);
  const todayDate = new Date(today.value);
  return selectedDate < todayDate
    ? ["Start date cannot be earlier than today"]
    : [];
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
