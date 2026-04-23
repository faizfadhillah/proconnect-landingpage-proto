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

        <!-- Date -->
      </div>
    </v-card-text>
  </v-card>
  <v-card
    class="mt-4"
    elevation="0"
    rounded="lg"
    style="border: 1px solid #e0e0e0; margin-bottom: 80px"
  >
    <v-card-text>
      <h3 class="mb-3" style="font-size: 18px">
        {{ localAjs.jobStep.step_name }}
      </h3>
      <p class="text-grey" style="font-size: 14px">
        {{ localAjs.jobStep.description }}
      </p>
    </v-card-text>
    <v-card-text
      class="pt-0"
      v-if="localAjs.attributes && Array.isArray(localAjs.attributes)"
    >
      <v-skeleton-loader
        v-if="loadingQuestionnaire"
        type="list-item-two-line"
        class="mb-4"
      />
      <v-card
        v-for="(test, idx) in localAjs.attributes"
        :key="idx"
        elevation="0"
        rounded="lg"
        style="border: 1px solid #e0e0e0"
        class="mb-4"
      >
        <v-card-text class="pa-6 pb-0">
          <!-- Test Header -->
          <div class="mb-4">
            <h4
              class="font-weight-bold mb-2"
              style="color: #424242; font-size: 16px"
            >
              {{ test.test_name }}
            </h4>
            <div class="mb-4">
              <p class="text-grey-darken-2 mb-3">
                {{ test.test_description }}
              </p>
            </div>
          </div>

          <!-- File Type Test -->
          <template v-if="test.test_type === 'FILE'">
            <!-- Instructions -->

            <!-- Download Section -->
            <div class="mb-4">
              <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                Test Document
              </p>
              <div
                v-if="test.test_file_employer"
                class="d-flex align-center pa-1 px-2 rounded-lg"
                style="border: 1px solid #e0e0e0"
              >
                <div class="flex-grow-1">
                  <a
                    :href="
                      test.test_file_employer.includes('http')
                        ? test.test_file_employer
                        : BASE_URL + test.test_file_employer
                    "
                    target="_blank"
                    class="text-primary"
                  >
                    {{ test.test_file_employer }}
                  </a>
                </div>
                <v-btn
                  variant="text"
                  icon
                  size="small"
                  :href="
                    test.test_file_employer.includes('http')
                      ? test.test_file_employer
                      : BASE_URL + test.test_file_employer
                  "
                  target="_blank"
                  :loading="downloadingTemplate"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>
              </div>
            </div>

            <!-- Upload Section -->
            <div>
              <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                Filled Test Document
              </p>
              <v-file-upload
                v-model="test.test_file_candidate"
                placeholder="Upload file (max size 5mb)"
                rounded="lg"
                :required="true"
                category="test_submission_candidate"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                class="mb-5"
                readonly
              />
            </div>
          </template>

          <!-- Link Type Test -->
          <template v-else-if="test.test_type === 'LINK'">
            <!-- Test Link Section -->
            <div class="mb-4">
              <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                Test Link
              </p>
              <div
                v-if="test.test_url"
                class="d-flex align-center pa-3 px-2 rounded-lg"
                style="border: 1px solid #e0e0e0"
              >
                <a
                  :href="test.test_url"
                  target="_blank"
                  style="font-size: 14px"
                >
                  {{ test.test_url }}
                </a>
              </div>
            </div>

            <!-- Confirmation Section -->
            <div class="mb-4">
              <p class="mb-2 text-grey-darken-1" style="font-size: 13px">
                Please confirm if you have filled the test document and fill out
                the name you put in the submission.
              </p>

              <v-checkbox
                v-model="test.test_candidate_confirmed"
                density="compact"
                class="mr-4 my-0 py-0"
                :rules="[
                  (v) =>
                    !!v ||
                    'Please confirm if you have filled the test document',
                ]"
                readonly
              >
                <template #label>
                  <span class="text-grey-darken-2" style="font-size: 14px"
                    >Yes, the test document has been submitted.</span
                  >
                </template></v-checkbox
              >

              <div>
                <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                  Submission Name
                </p>
                <v-text-field
                  v-model="test.test_candidate_input_name"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :rules="[
                    (v) =>
                      !!v ||
                      'Please fill out the name you put in the submission',
                  ]"
                  readonly
                ></v-text-field>
              </div>
            </div>
          </template>

          <template v-if="['ACCEPTED', 'FAILED'].includes(localAjs.status)">
            <div class="mb-2" style="color: #757575">Notes (Optional)</div>
            <v-textarea
              v-model="test.test_result_notes"
              :placeholder="
                test.test_result_notes ? test.test_result_notes : 'Not Provided'
              "
              rows="4"
              variant="outlined"
              rounded="lg"
              auto-grow
              style="white-space: pre-wrap !important; resize: vertical"
              readonly
            />
            <div class="text-grey-darken-2 mb-1">
              <small>Result File (optional)</small>
            </div>
            <v-file-upload
              :placeholder="
                test.test_result_file ? test.test_result_file : 'Not Provided'
              "
              v-model="test.test_result_file"
              category="result_test_submission"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
              class="mb-4"
              readonly
            />
          </template>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>

  <div
    class="bottom-nav"
    v-if="!['ACCEPTED', 'FAILED'].includes(localAjs?.status)"
  >
    <v-container class="d-flex justify-end align-center">
      <v-btn
        :color="
          ['SKIPPED', 'CURRENT', 'PENDING', 'REVISED'].includes(localAjs.status)
            ? 'grey-darken-3'
            : 'primary'
        "
        class="text-white"
        style="font-weight: bold"
        rounded="lg"
        :disabled="
          ['SKIPPED', 'CURRENT', 'PENDING', 'REVISED'].includes(localAjs.status)
        "
        @click="handleReview"
      >
        REVIEW
      </v-btn>

      <v-menu v-if="localAjs.id == applicant.last_applicant_job_step_id">
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
          <v-list-item
            v-if="['SUBMITTED'].includes(localAjs.status)"
            @click="handleRequestRevision"
            style="cursor: pointer"
          >
            <v-list-item-title>Request Revision</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-container>
  </div>

  <v-dialog v-model="showResultDialog" scrollable max-width="600">
    <v-card rounded="lg">
      <v-toolbar class="bg-transparent" density="compact">
        <v-toolbar-title class="font-weight-bold">Test Result</v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" @click="showResultDialog = false" />
      </v-toolbar>
      <v-divider />
      <v-card-text>
        <div class="d-flex align-center mb-4" style="gap: 16px">
          <v-avatar size="56" rounded="lg">
            <v-img :src="BASE_URL + user.photo_url" />
          </v-avatar>
          <div>
            <div class="font-weight-bold" style="font-size: 20px">
              {{ user.full_name }}
            </div>
            <div style="color: #757575; font-size: 14px">
              Applied for {{ applicant.job.title }}
            </div>
          </div>
        </div>
        <v-card
          v-for="(test, idx) in localAjs.attributes"
          :key="idx"
          elevation="0"
          rounded="lg"
          style="border: 1px solid #e0e0e0"
          class="mb-4"
        >
          <v-card-text class="pa-6 pb-0">
            <!-- Test Header -->
            <div class="mb-4">
              <h4
                class="font-weight-bold mb-2"
                style="color: #424242; font-size: 16px"
              >
                {{ test.test_name }}
              </h4>
              <div class="mb-4">
                <p class="text-grey-darken-2 mb-3">
                  {{ test.test_description }}
                </p>
              </div>
            </div>

            <!-- File Type Test -->
            <template v-if="test.test_type === 'FILE'">
              <!-- Instructions -->

              <!-- Download Section -->
              <!-- Upload Section -->
              <div>
                <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                  Filled Test Document
                </p>
                <v-file-upload
                  v-model="test.test_file_candidate"
                  placeholder="Upload file (max size 5mb)"
                  rounded="lg"
                  :required="true"
                  category="test_submission_candidate"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                  class="mb-5"
                  readonly
                />
              </div>
            </template>

            <!-- Link Type Test -->
            <template v-else-if="test.test_type === 'LINK'">
              <!-- Test Link Section -->
              <div class="mb-4">
                <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                  Test Link
                </p>
                <div
                  v-if="test.test_url"
                  class="d-flex align-center pa-3 px-2 rounded-lg"
                  style="border: 1px solid #e0e0e0"
                >
                  <a
                    :href="test.test_url"
                    target="_blank"
                    style="font-size: 14px"
                  >
                    {{ test.test_url }}
                  </a>
                </div>
              </div>

              <!-- Confirmation Section -->
              <div class="mb-4">
                <div>
                  <p class="mb-1 text-grey-darken-1" style="font-size: 12px">
                    Submission Name
                  </p>
                  <v-text-field
                    v-model="test.test_candidate_input_name"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[
                      (v) =>
                        !!v ||
                        'Please fill out the name you put in the submission',
                    ]"
                    readonly
                  ></v-text-field>
                </div>
              </div>
            </template>

            <div class="mb-2" style="color: #757575">Notes (Optional)</div>
            <v-textarea
              v-model="test.test_result_notes"
              placeholder="Write your assessment or feedback regarding the test outcome"
              rows="4"
              variant="outlined"
              rounded="lg"
              auto-grow
              style="white-space: pre-wrap !important; resize: vertical"
            />
            <div class="text-grey-darken-2 mb-1">
              <small>Upload Result File (optional)</small>
            </div>
            <v-file-upload
              placeholder="Upload File (max size 5 MB)"
              v-model="test.test_result_file"
              category="result_test_submission"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
              class="mb-4"
            />
          </v-card-text>
        </v-card>
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-6 py-4 d-flex justify-end">
        <v-btn
          variant="outlined"
          color="primary"
          class="mr-2"
          :loading="rejectLoading"
          @click="handleReject"
          rounded="lg"
          style="font-weight: bold"
          >REJECT</v-btn
        >
        <v-btn
          color="primary"
          class="text-white"
          :loading="acceptLoading"
          @click="handleAccept"
          rounded="lg"
          variant="flat"
          style="font-weight: bold"
          >APPROVE</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

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

// Props
const props = defineProps({
  me: {
    type: Object,
    required: true,
    default: () => ({}),
  },
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

const { isMobile, isDesktop } = useScreenSize();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const { $apiFetch } = useApi();
const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const citySearch = ref("");
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

const emit = defineEmits(["update:ajs", "update:tab"]);
const localAjs = ref({ ...props.ajs });
const stages = ref([]);
const selectedStage = ref(null);
const revisionDialog = ref(false);
const revisionMessage = ref("");
const loadingSendRevision = ref(false);

watch(
  () => props.ajs?.status,
  (newStatus) => {
    if (!props.ajs) return;

    localAjs.value = { ...props.ajs };
    stages.value = props.applicant.applicantJobSteps
      .filter((step) => step.id != localAjs.value.id)
      .map((step) => ({
        id: step.id,
        name: step.jobStep.step_name,
      }));
  },
  { immediate: true }
);

onMounted(() => {
  localAjs.value = { ...props.ajs };
  postData.value = Object.assign(
    {},
    props.ajs.attributes || props.ajs.jobStep.attributes
  );
});

const snackbar = useSnackbarStore();
const acceptLoading = ref(false);
const rejectLoading = ref(false);
const currentLoading = ref(false);
const rejectRescheduleLoading = ref(false);
const acceptRescheduleLoading = ref(false);

function handleRequestRevision() {
  revisionDialog.value = true;
}

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

const handleRejectReschedule = async () => {
  rejectRescheduleLoading.value = true;
  postData.value.reschedule_request = "REJECTED";
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "SCHEDULED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Reschedule request rejected",
      color: "error",
    });
    localAjs.value.status = response.status;
    localAjs.value.attributes = response.attributes;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    rejectRescheduleLoading.value = false;
  }
};

const showRescheduleDialog = ref(false);
const handleAcceptReschedule = async () => {
  showScheduleDialog.value = true;
  showRescheduleDialog.value = true;
};

const handleAcceptReschedule2 = async () => {
  acceptRescheduleLoading.value = true;
  postData.value.reschedule_request = "ACCEPTED";
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "RESCHEDULED",
        attributes: postData.value,
      },
    });
    snackbar.showSnackbar({
      message: "Reschedule request accepted",
      color: "success",
    });
    localAjs.value.status = response.status;
    localAjs.value.attributes = response.attributes;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    acceptRescheduleLoading.value = false;
  }
};

const handleCurrent = async () => {
  currentLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "CURRENT",
      },
    });
    snackbar.showSnackbar({
      message: "Application set to current",
      color: "success",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
  } catch (error) {
  } finally {
    currentLoading.value = false;
  }
};

const handleAccept = async () => {
  acceptLoading.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "ACCEPTED",
        attributes: localAjs.value.attributes,
      },
    });
    snackbar.showSnackbar({
      message: "Application accepted",
      color: "success",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
    showResultDialog.value = false;
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
        attributes: localAjs.value.attributes,
      },
    });
    snackbar.showSnackbar({
      message: "Application rejected",
      color: "error",
    });
    localAjs.value.status = response.status;
    emit("update:ajs", localAjs.value);
    showResultDialog.value = false;
  } catch (error) {
  } finally {
    rejectLoading.value = false;
    dialog.closeDialog();
  }
};

const handleSetSchedule = () => {
  postData.value = Object.assign(
    {},
    props.ajs.attributes || props.ajs.jobStep.attributes
  );
  postData.value.offline_region_id = postData.value.offline_region_id || null;
  if (postData.value.offline_region_id) {
    fetchRegions(postData.value.offline_region_id, "id");
  }
  if (!postData.value.recipient_to) {
    postData.value.recipient_to = props.user.email;
  }
  if (!postData.value.interviewer_list) {
    postData.value.interviewer_list = [
      { name: "", email: "", phone_number: "", is_show: true },
    ];
  }
  showScheduleDialog.value = true;
  if (!postData.value.pic_name) {
    postData.value.pic_name = props.me.full_name;
  }
  if (!postData.value.pic_phone_number) {
    postData.value.pic_phone_number =
      props.me.phone || postData.value.pic_phone_number;
  }
  if (!postData.value.pic_email) {
    postData.value.pic_email = props.me.email || postData.value.pic_email;
  }
};

const showScheduleDialog = ref(false);
watch(
  () => showScheduleDialog.value,
  (newVal) => {
    if (!newVal) {
      showRescheduleDialog.value = false;
    }
  }
);
const dateMenu = ref(false);
const timeMenu = ref(false);

const postData = ref(
  Object.assign(
    {},
    props.ajs.jobStep.attributes || {
      recipient_to: "",
      recipient_bcc: "",
      pic_name: "",
      pic_phone_number: "",
      pic_email: "",
      interviewer_list: [
        {
          name: "",
          phone_number: "",
          email: "",
          is_show: true,
          user_id: null,
        },
      ],
      interview_date: "",
      interview_date_time: "",
      interview_time: "",
      interview_timezone: "",
      interview_type: "",
      link_online: "",
      link_offline: "",
      offline_region_id: "",
      offline_is_outside_indo: "",
      offline_other_country: "",
      offline_other_region: "",
      offline_address: "",
      notes_applicant_interview: "",
      notes_interview_results: "",
      attachment_interview_results: "",
      reschedule_request: "",
      reschedule_request_notes_from_candidate: "",
    }
  )
);

const descriptionUpdated = ref(false);
watch(
  () => localAjs.value.jobStep.description,
  (newVal, oldVal) => {
    if (newVal != oldVal) {
      descriptionUpdated.value = true;
    }
  }
);

const saveLoading = ref(false);
const form = ref(null);
const saveSchedule = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    snackbar.showSnackbar({
      message: "Please fill all required fields",
      color: "error",
    });
    return;
  }
  saveLoading.value = true;
  postData.value.interview_date_time = `${postData.value.interview_date} ${
    postData.value.interview_time || "00:00"
  }`;
  postData.value.interview_timezone = getTimezoneName();

  if (showRescheduleDialog.value) {
    acceptRescheduleLoading.value = true;
    postData.value.reschedule_request = "ACCEPTED";
  }
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status:
          showRescheduleDialog.value ||
          ["SCHEDULED", "RESCHEDULED"].includes(props.ajs.status)
            ? "RESCHEDULED"
            : "SCHEDULED",
        attributes: postData.value,
      },
    });
    localAjs.value.status = response.status;
    localAjs.value.attributes = response.attributes;
    emit("update:ajs", localAjs.value);
    showScheduleDialog.value = false;
    snackbar.showSnackbar({
      message: "Interview schedule saved",
      color: "success",
    });

    if (descriptionUpdated.value) {
      await $apiFetch(`/applicants/${props.applicant.id}`, {
        method: "PATCH",
        body: {
          description: localAjs.value.jobStep.description,
          applicant_job_step_id: props.ajs.id,
        },
      });
      descriptionUpdated.value = false;
    }
  } catch (error) {
    console.log(error);
  } finally {
    saveLoading.value = false;
    acceptRescheduleLoading.value = false;
  }
};

const showResultDialog = ref(false);

const handleReview = () => {
  showResultDialog.value = true;
  postData.value.attachment_interview_results =
    postData.value.attachment_interview_results || null;
};

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

// Add interviewer search composable
const {
  interviewers,
  interviewerLoading,
  debouncedFetchInterviewers,
  fetchInterviewers,
} = useInterviewerSearch();

// Add new reactive variables
const showDropdown = ref({});

// Add the new filtering function
const getFilteredInterviewers = (index) => {
  const searchQuery =
    postData.value.interviewer_list[index]?.name?.toLowerCase();

  if (searchQuery) {
    return interviewers.value.filter((interviewer) =>
      interviewer.displayText.toLowerCase().includes(searchQuery)
    );
  }

  return interviewers.value;
};

// Update searchInterviewers method
const searchInterviewers = (index, query) => {
  // Store the search query in name field directly
  postData.value.interviewer_list[index].name = query;

  if (query && query.length > 0) {
    showDropdown.value[index] = true;

    if (props.me?.company_id) {
      debouncedFetchInterviewers(query, props.me.company_id, [
        "full_name",
        "email",
      ]);
    } else {
      debouncedFetchInterviewers(query, null, ["full_name", "email"]);
    }
  } else {
    showDropdown.value[index] = false;
  }
};

// Update selectInterviewer method to work with the new approach
const selectInterviewer = (index, selectedUser) => {
  console.log("selectedUser", selectedUser, index);
  if (selectedUser) {
    postData.value.interviewer_list[index].name = selectedUser.full_name;
    postData.value.interviewer_list[index].email = selectedUser.email;
    postData.value.interviewer_list[index].phone_number =
      selectedUser.phone || "";
    postData.value.interviewer_list[index].user_id = selectedUser.id;
  }

  // Hide dropdown after selection
  showDropdown.value[index] = false;
};

// Add blur handler function
const handleInterviewerBlur = (index) => {
  setTimeout(() => {
    showDropdown.value[index] = false;
  }, 300);
};

// Add new reactive variables for PIC dropdown
const showPICDropdown = ref(false);

// Add the PIC filtering function
const getFilteredPIC = () => {
  const searchQuery = postData.value.pic_name?.toLowerCase();

  if (searchQuery) {
    return interviewers.value.filter((interviewer) =>
      interviewer.displayText.toLowerCase().includes(searchQuery)
    );
  }

  return interviewers.value;
};

// Add PIC search method
const searchPIC = (query) => {
  // Store the search query in pic_name field directly
  postData.value.pic_name = query;

  if (query && query.length > 0) {
    showPICDropdown.value = true;

    if (props.me?.company_id) {
      debouncedFetchInterviewers(query, props.me.company_id, [
        "full_name",
        "email",
      ]);
    } else {
      debouncedFetchInterviewers(query, null, ["full_name", "email"]);
    }
  } else {
    showPICDropdown.value = false;
  }
};

// Add PIC selection method
const selectPIC = (selectedUser) => {
  console.log("selectedPIC", selectedUser);
  if (selectedUser) {
    postData.value.pic_name = selectedUser.full_name;
    postData.value.pic_email = selectedUser.email;
    postData.value.pic_phone_number = selectedUser.phone || "";
  }

  // Hide dropdown after selection
  showPICDropdown.value = false;
};

// Add PIC blur handler function
const handlePICBlur = () => {
  setTimeout(() => {
    showPICDropdown.value = false;
  }, 300);
};

// Add click outside handler to close dropdowns
onMounted(() => {
  localAjs.value = { ...props.ajs };
  postData.value = Object.assign(
    {},
    props.ajs.attributes || props.ajs.jobStep.attributes
  );

  // Initialize interviewer search with company filter
  if (props.me?.company_id) {
    fetchInterviewers("", props.me.company_id);
  }

  // Add global click handler to close dropdowns
  document.addEventListener("click", (e) => {
    // Check if click is outside any dropdown
    const isInsideDropdown = e.target.closest(".v-card");
    const isInsideTextField = e.target.closest(".v-text-field");

    if (!isInsideDropdown && !isInsideTextField) {
      // Close all dropdowns
      Object.keys(showDropdown.value).forEach((key) => {
        showDropdown.value[key] = false;
      });
      showPICDropdown.value = false;
    }
  });
});
</script>

<style scoped>
/* Add any component-specific styles here */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  z-index: 100;
  padding: 4px 0;
}
</style>
