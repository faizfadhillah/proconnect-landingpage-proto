<template>
  <v-card rounded="lg" elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-text>
      <div class="d-flex flex-column">
        <!-- Header: Name, Position, Status -->
        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <span class="font-weight-bold" style="font-size: 18px">
              {{ localAjs.jobStep.step_name }}
            </span>
            <v-chip
              :color="colorAjsStatus(localAjs.status, 'employer')"
              variant="flat"
              class="ml-2"
              size="small"
              style="vertical-align: middle"
            >
              {{ labelAjsStatus(localAjs.status, "employer") }}
            </v-chip>
          </div>
          <v-menu
            v-if="
              !['SUBMITTED'].includes(localAjs.status) &&
              ajs.id == applicant.last_applicant_job_step_id
            "
          >
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                variant="outlined"
                rounded="lg"
                size="small"
                color="primary"
                v-bind="props"
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
        <!-- Subheader -->
        <div class="mb-2" style="font-size: 14px">
          <template v-if="['CURRENT'].includes(localAjs.status)">
            {{ user.full_name }} has no filled out
            {{ localAjs.jobStep.step_name }}
          </template>
          <template v-else-if="['ACCEPTED'].includes(localAjs.status)">
            You have Approved {{ user.full_name }} to continue the next stage
          </template>
          <template v-else-if="['FAILED'].includes(localAjs.status)">
            You have Rejected {{ user.full_name }}
          </template>
          <template v-else-if="['REVISED'].includes(localAjs.status)">
            {{ user.full_name }} is working on the revision request
          </template>
          <template v-else> Applicant is waiting for your decision </template>
        </div>
        <div class="text-grey-darken-1" style="font-size: 12px">
          Applied on
          {{ formatDateTime(localAjs.updated_at) }}
        </div>
        <!-- Date -->
        <template v-if="['SUBMITTED'].includes(localAjs.status)">
          <!-- Action Buttons -->
          <div class="d-flex align-center gap-2 mt-4">
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
              :disabled="['CURRENT'].includes(localAjs.status)"
              :loading="acceptLoading"
            >
              Approve
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
                >
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="openMoveDialog" style="cursor: pointer">
                  <v-list-item-title>Move Candidate</v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="!['REVISED'].includes(localAjs.status)"
                  @click="handleRequestRevision"
                  style="cursor: pointer"
                >
                  <v-list-item-title>Request Revision</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </div>
    </v-card-text>
  </v-card>
  <v-card
    class="mt-4"
    elevation="0"
    rounded="lg"
    style="border: 1px solid #e0e0e0"
    v-if="!['PENDING', 'CURRENT'].includes(localAjs.status)"
  >
    <v-card-text>
      <h3 class="mb-3" style="font-size: 20px">
        {{ localAjs.jobStep.step_name }}
      </h3>
      <p class="text-grey" style="font-size: 14px">
        {{ localAjs.jobStep.description }}
      </p>
    </v-card-text>
    <v-card-text>
      <v-skeleton-loader
        v-if="loadingQuestionnaire"
        type="list-item-two-line"
        class="mb-4"
      />
      <template v-else v-for="(q, idx) in questionnaireAnswers" :key="idx">
        <v-card
          rounded="lg"
          class="mb-4"
          elevation="0"
          style="border: 1px solid #e0e0e0"
        >
          <v-card-text>
            <div class="mb-4" style="font-size: 14px">
              {{ idx + 1 }}. {{ q.question }} {{ q.is_required ? "*" : "" }}
            </div>
            <div v-if="q.type == 'TEXT'">
              <v-textarea
                density="comfortable"
                variant="outlined"
                v-model="q.value"
                placeholder="Enter your answer"
                rounded="lg"
                :rules="[
                  (v) =>
                    !q.is_required ||
                    v?.length > 0 ||
                    'Please enter your answer to continue to the next step.',
                ]"
                :rows="2"
                readonly
                auto-grow
                style="white-space: pre-wrap !important; resize: vertical"
              />
            </div>
            <div v-if="q.type == 'CHECKBOX'">
              <v-checkbox
                v-for="(opt, optIdx) in q.options"
                :key="optIdx"
                :true-value="opt"
                v-model="q.value"
                :label="opt"
                density="compact"
                hide-details
                :rules="[
                  (v) =>
                    !q.is_required ||
                    v?.length > 0 ||
                    'Please select an option to continue to the next step.',
                ]"
                readonly
              />
            </div>
            <div v-if="q.type == 'RADIO-BUTTON'">
              <v-radio-group
                v-model="q.value"
                :rules="[
                  (v) =>
                    !q.is_required ||
                    !!v ||
                    'Please select an option to continue to the next step.',
                ]"
                readonly
              >
                <v-radio
                  v-for="(opt, optIdx) in q.options"
                  :key="optIdx"
                  :value="opt"
                  :label="opt"
                />
              </v-radio-group>
            </div>
            <div v-if="q.type == 'DROP-DOWN'">
              <v-select
                density="comfortable"
                variant="outlined"
                v-model="q.value"
                :items="q.options"
                placeholder="Select an option"
                rounded="lg"
                multiple
                :rules="[
                  (v) =>
                    !q.is_required ||
                    v?.length > 0 ||
                    'Please select an option to continue to the next step.',
                ]"
                readonly
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip v-bind="props" label color="primary" variant="flat">
                    {{ item.value }}
                  </v-chip>
                </template>
              </v-select>
            </div>
            <div v-if="q.type == 'DATE'">
              <v-text-field
                density="comfortable"
                variant="outlined"
                v-model="q.value"
                type="date"
                placeholder="Select date"
                rounded="lg"
                :rules="[
                  (v) =>
                    !q.is_required ||
                    !!v ||
                    'Please select a date to continue to the next step.',
                ]"
                readonly
              />
            </div>
            <div v-if="q.type == 'TIME'">
              <v-text-field
                density="comfortable"
                variant="outlined"
                v-model="q.value"
                type="time"
                placeholder="Select time"
                rounded="lg"
                :rules="[
                  (v) =>
                    !q.is_required ||
                    !!v ||
                    'Please select a time to continue to the next step.',
                ]"
                readonly
              />
            </div>
            <div v-if="q.type == 'DATE-TIME'">
              <v-text-field
                density="comfortable"
                variant="outlined"
                v-model="q.value"
                type="datetime-local"
                placeholder="Select date & time"
                rounded="lg"
                :rules="[
                  (v) =>
                    !q.is_required ||
                    !!v ||
                    'Please select a time to continue to the next step.',
                ]"
                readonly
              />
            </div>
            <div v-if="q.type == 'ATTACHMENT'">
              <v-file-upload
                density="comfortable"
                variant="outlined"
                v-model="q.value"
                :placeholder="q.placeholder || 'Upload file'"
                rounded="lg"
                :required="q.is_required"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.ppt,.pptx,.csv,.mp3,.mp4,.wav,.zip,.rar,.7z"
                prepend-icon="mdi-paperclip"
                category="questionnaire"
                class="mb-1"
                readonly
              />
              <div
                v-if="q.is_required && !q.value"
                class="text-error text-caption mt-1 pl-4"
              >
                Please upload a file to continue to the next step.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </v-card-text>
  </v-card>
  <v-dialog v-model="revisionDialog" max-width="500">
    <v-card rounded="lg" elevation="0">
      <v-card-title
        class="font-weight-bold d-flex align-center justify-space-between"
      >
        Request Revision
        <v-icon
          icon="mdi-close"
          size="small"
          class="ml-2"
          @click="revisionDialog = false"
        ></v-icon>
      </v-card-title>
      <v-card-text>
        <p class="text-grey mb-2" style="font-size: 12px">Message</p>
        <v-textarea
          variant="outlined"
          rounded="lg"
          v-model="revisionMessage"
          placeholder="What part needs revision?"
          rows="5"
          auto-grow
          style="white-space: pre-wrap"
        />
      </v-card-text>
      <v-card-actions class="justify-end px-6 pb-4">
        <v-btn
          variant="outlined"
          color="primary"
          @click="revisionDialog = false"
          rounded="lg"
          class="mr-1"
        >
          Cancel
        </v-btn>
        <v-btn
          rounded="lg"
          variant="flat"
          color="primary"
          @click="sendRevisionRequest"
          :disabled="!revisionMessage"
          :loading="loadingSendRevision"
        >
          Send Message
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

import FillmentPreview from "~/components/detail-fulfillment-preview.vue";
const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({}),
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

const { isMobile, isDesktop } = useScreenSize();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const { $apiFetch } = useApi();
const emit = defineEmits(["update:ajs", "update:tab", "update:loading"]);

const localAjs = ref({ ...props.ajs });
const stages = ref([]);
const selectedStage = ref(null);
const isFirstLoad = ref(true);

const snackbar = useSnackbarStore();
const acceptLoading = ref(false);
const rejectLoading = ref(false);
const revisionDialog = ref(false);
const revisionMessage = ref("");

onMounted(async () => {
  fetchAjs();
});

const questionnaireAnswers = ref([]);
const loadingQuestionnaire = ref(true);
const fetchAjs = async () => {
  loadingQuestionnaire.value = true;
  emit("update:loading", true);
  const response = await $apiFetch(`/applicant-job-steps/search`, {
    method: "GET",
    params: {
      id: props.ajs.id,
      expands: "jobStep.questionnaires, questionnaireAnswers",
      sortBy: {
        "questionnaireAnswers.created_at": "DESC",
      },
    },
  });
  localAjs.value = response.items[0];
  questionnaireAnswers.value = response.items[0].jobStep.questionnaires.map(
    (q) => {
      q.questionnaire_id = q.id;
      delete q.id;
      return {
        ...q,
        value: null,
      };
    }
  );

  setQuestionnaireAnswers(response);

  emit("update:ajs", localAjs.value);
  loadingQuestionnaire.value = false;
  emit("update:loading", false);
};

const setQuestionnaireAnswers = (response) => {
  // Sort questionnaire answers by number
  questionnaireAnswers.value.sort((a, b) => {
    const numA = parseInt(a.no) || 0;
    const numB = parseInt(b.no) || 0;
    return numA - numB;
  });
  const answers = response.items[0].questionnaireAnswers;
  //const answers = questionnaireAnswers.value;
  for (const q of questionnaireAnswers.value) {
    const answer = answers.find(
      (a) => a.questionnaire_id == q.questionnaire_id
    );
    if (answer) {
      q.id = answer.id;
      switch (q.type) {
        case "TEXT":
          q.value = Array.isArray(answer.value)
            ? answer.value[0]
            : answer.value || "";
          break;
        case "CHECKBOX":
          // For checkbox, value should be an array
          q.value = answer.value || [];
          break;
        case "RADIO-BUTTON":
          q.value = Array.isArray(answer.value)
            ? answer.value[0]
            : answer.value || "";
          break;
        case "DROP-DOWN":
          // For dropdown (multiple select), value should be an array
          q.value = answer.value || [];
          break;
        case "DATE":
          // If date format contains 'T', split and take only the date part
          q.value = Array.isArray(answer.value)
            ? answer.value[0]
            : answer.value || "";

          if (q.value && typeof q.value === "string" && q.value.includes("T")) {
            q.value = q.value.split("T")[0];
          }
          break;
        case "TIME":
          q.value = Array.isArray(answer.value)
            ? answer.value[0]
            : answer.value || "";
          break;
        case "DATE-TIME":
          q.value = Array.isArray(answer.value)
            ? answer.value[0]
            : answer.value || "";
          break;
        case "ATTACHMENT":
          q.value = Array.isArray(answer.value)
            ? answer.value
            : answer.value || [];
          break;
        default:
          q.value = Array.isArray(answer.value)
            ? answer.value
            : answer.value || [];
          break;
      }
    }
  }
};

watch(
  () => props.ajs.status,
  (newAjs) => {
    localAjs.value = { ...props.ajs };
    stages.value = props.applicant.applicantJobSteps
      .filter((step) => step.id != localAjs.value.id)
      .map((step) => ({
        id: step.id,
        name: step.jobStep.step_name,
      }));
    fetchAjs();
  },
  { immediate: true }
);

const handleAccept = async () => {
  acceptLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "ACCEPTED",
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

function handleRequestRevision() {
  revisionDialog.value = true;
}

const loadingSendRevision = ref(false);
async function sendRevisionRequest() {
  loadingSendRevision.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "REVISED",
        notes: revisionMessage.value,
      },
    });
    // TODO: Kirim pesan revisi ke backend di sini
    snackbar.showSnackbar({
      message: "Revision requested",
      color: "info",
    });
    localAjs.value.notes = revisionMessage.value;
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
    revisionDialog.value = false;
    revisionMessage.value = "";
  } catch (error) {
  } finally {
    loadingSendRevision.value = false;
  }
}

const moveDialog = ref(false);
const openMoveDialog = () => {
  moveDialog.value = true;
};
const closeMoveDialog = () => {
  moveDialog.value = false;
  selectedJob.value = null;
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
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
