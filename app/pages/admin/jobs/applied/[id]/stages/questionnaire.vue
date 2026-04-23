<template>
  <v-card
    rounded="lg"
    elevation="0"
    class="pa-2"
    style="border: 1px solid #e0e0e0"
  >
    <v-card-text v-if="route.hash == ''" class="pt-2">
      <v-form @submit.prevent="handleSubmit" ref="form">
        <!-- Judul dan Deskripsi -->
        <div v-if="localAjs.status == 'CURRENT'">
          <div class="font-weight-bold" style="font-size: 20px">
            {{ localAjs.jobStep.step_name }}
          </div>
          <div class="mt-2" style="color: #757575">
            {{ localAjs.jobStep.description }}
          </div>
        </div>
        <div v-else>
          <div class="font-weight-bold" style="font-size: 20px">
            {{ localAjs.jobStep.step_name }}
            <template v-if="localAjs.status == 'ACCEPTED'">
              Qualified
            </template>
            <template v-if="localAjs.status == 'SUBMITTED'">
              Submitted
            </template>
            <template v-else>
              {{ labelAjsStatus(localAjs.status) }}
            </template>

            <v-chip
              :color="colorAjsStatus(localAjs.status)"
              variant="flat"
              size="small"
              class="ml-1"
            >
              {{ labelAjsStatus(localAjs.status) }}
            </v-chip>
          </div>

          <div class="mt-2" style="color: #757575">
            <template v-if="localAjs.status == 'REVISED'">
              <strong>Message From Recruiter :</strong> {{ localAjs.notes }}
            </template>
            <template v-else-if="localAjs.status == 'ACCEPTED'">
              Congratulations! You've successfully passed this stage of the
              hiring process.
            </template>
            <template v-else-if="localAjs.status == 'FAILED'">
              Thank you for your interest in the position. After careful
              consideration, we've decided not to move forward with your
              application at this stage. We appreciate the time and effort you
              put into the process and wish you the best in your job search.
            </template>
            <template v-else>
              Your application is currently under review. We need a bit more
              information to proceed. Please check your email for our request or
              provide the required details in your profile.
            </template>
          </div>
        </div>

        <!-- List Section -->
        <div
          class="mt-6"
          v-if="
            ['CURRENT', 'SUBMITTED', 'REVISED', 'ACCEPTED', 'FAILED'].includes(
              localAjs.status
            )
          "
        >
          <v-skeleton-loader
            v-if="loadingQuestionnaire"
            type="list-item-two-line"
            class="mb-4"
          />
          <template v-for="(q, idx) in questionnaireAnswers" :key="idx">
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED', 'FAILED'].includes(
                        localAjs.status
                      )
                    "
                    :rows="2"
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED', 'FAILED'].includes(
                        localAjs.status
                      )
                    "
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED'].includes(localAjs.status)
                    "
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED', 'FAILED'].includes(
                        localAjs.status
                      )
                    "
                  >
                    <template v-slot:chip="{ props, item }">
                      <v-chip
                        v-bind="props"
                        label
                        color="primary"
                        variant="flat"
                        closable
                      >
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED'].includes(localAjs.status)
                    "
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED', 'FAILED'].includes(
                        localAjs.status
                      )
                    "
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED', 'FAILED'].includes(
                        localAjs.status
                      )
                    "
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
                    :disabled="
                      ['SUBMITTED', 'ACCEPTED', 'FAILED'].includes(
                        localAjs.status
                      )
                    "
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
        </div>

        <!-- Tombol Submit -->
        <div
          class="d-flex justify-end mt-8"
          v-if="['CURRENT', 'REVISED'].includes(localAjs.status)"
        >
          <v-btn
            color="primary"
            rounded="lg"
            style="font-weight: bold"
            :loading="loadingSubmit"
            type="submit"
            :min-width="160"
          >
            Submit
          </v-btn>
        </div>
      </v-form>
    </v-card-text>

    <v-dialog v-model="showSuccessDialog" persistent max-width="400">
      <v-card
        rounded="xl"
        class="pa-6 d-flex flex-column align-center justify-center"
      >
        <v-icon color="success" size="80">mdi-check-circle</v-icon>
        <div class="font-weight-bold mt-4 mb-2" style="font-size: 20px">
          Application Submitted
        </div>
        <div class="mb-4" style="color: #757575">
          Thank you for completing your application.<br />
          You will be automatically redirected to the list of applications in
          {{ redirectCountdown }} seconds.
        </div>
        <v-btn
          color="primary"
          @click="router.push('/admin/jobs/applied')"
          rounded
        >
          Go Now
        </v-btn>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
const { $apiFetch } = useApi();
const router = useRouter();
const route = useRoute();

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
const me = useState("me", () => ({}));

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

const questionnaireAnswers = ref([]);
const loadingQuestionnaire = ref(false);
const fetchAjs = async () => {
  try {
    loadingQuestionnaire.value =
      questionnaireAnswers.value.length == 0 ? true : false;
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

    // Update local reactive data
    localAjs.value = response.items[0];
    if (
      !questionnaireAnswers.value.length &&
      response.items[0]?.jobStep?.questionnaires
    ) {
      questionnaireAnswers.value = response.items[0].jobStep.questionnaires.map(
        (q) => {
          q.questionnaire_id = q.id;
          delete q.id;
          let answer = "";
          if (q.type == "CHECKBOX" || q.type == "DROP-DOWN") {
            answer = [];
          }
          if (q.type == "RADIO-BUTTON") {
            answer = "";
          }
          if (q.type == "DATE" || q.type == "TIME") {
            answer = "";
          }
          if (q.type == "ATTACHMENT") {
            answer = null;
          }
          return {
            ...q,
            applicant_job_step_id: props.ajs.id,
            job_id: props.ajs.job_id,
            value: answer,
          };
        }
      );
      // Sort questionnaire answers by number
      questionnaireAnswers.value.sort((a, b) => {
        const numA = parseInt(a.no) || 0;
        const numB = parseInt(b.no) || 0;
        return numA - numB;
      });
      const answers = response.items[0].questionnaireAnswers;
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

              if (
                q.value &&
                typeof q.value === "string" &&
                q.value.includes("T")
              ) {
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
    }

    // Emit the updated data to parent
    emit("update:ajs", response.items[0]);
  } catch (error) {
    console.error("Error fetching AJS:", error);
  } finally {
    loadingQuestionnaire.value = false;
  }
};

onMounted(() => {
  fetchAjs();
});

const continueLoading = ref(false);
const handleContinue = async () => {
  continueLoading.value = true;
  emit("update:tab", props.tab + 1);
  continueLoading.value = false;
};

const snackbar = useSnackbarStore();
const loadingSubmit = ref(false);
const showSuccessDialog = ref(false);
const redirectCountdown = ref(3);
let redirectTimer = null;

const handleUpdateDetails = async () => {
  loadingSubmit.value = true;
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "CURRENT",
      },
    });
    snackbar.showSnackbar({
      message: "Application submitted successfully",
      type: "success",
    });
    showSuccessDialog.value = true;
    fetchAjs();
    startRedirectTimer();
  } catch (error) {
    console.error("Error submitting AJS:", error);
  } finally {
    loadingSubmit.value = false;
  }
};

const form = ref(null);
const handleSubmit = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    return;
  }

  // Additional validation for required file uploads
  const hasRequiredFileErrors = questionnaireAnswers.value.some((q) => {
    if (q.type === "ATTACHMENT" && q.is_required && !q.value) {
      return true;
    }
    return false;
  });

  if (hasRequiredFileErrors) {
    snackbar.showSnackbar({
      message: "Please upload all required files to continue.",
      type: "error",
    });
    return;
  }

  const questionnaireAnswersFormatted = [];
  questionnaireAnswers.value.forEach((q) => {
    questionnaireAnswersFormatted.push({
      ...q,
      applicant_job_step_id: props.ajs.id,
      job_id: props.ajs.job_id,
      value: Array.isArray(q.value) ? q.value : [q.value],
    });
  });

  loadingSubmit.value = true;
  const isPost = questionnaireAnswers.value.some((q) => !q.id);
  try {
    const response = await $apiFetch(`/questionnaire-answers/bulk`, {
      method: isPost ? "POST" : "PATCH",
      body: {
        data: questionnaireAnswersFormatted,
      },
    });
    const responseAjs = await $apiFetch(
      `/applicant-job-steps/${props.ajs.id}`,
      {
        method: "PATCH",
        body: {
          status: "SUBMITTED",
        },
      }
    );

    snackbar.showSnackbar({
      message: "Congratulations! Your have successfully submitted application.",
      type: "success",
    });
    fetchAjs();
  } catch (error) {
    console.error("Error submitting:", error);
  } finally {
    loadingSubmit.value = false;
  }
};

function startRedirectTimer() {
  redirectCountdown.value = 5;
  redirectTimer = setInterval(() => {
    redirectCountdown.value--;
    if (redirectCountdown.value <= 0) {
      clearInterval(redirectTimer);
      router.push(`/admin/jobs/applied?id=${props.ajs.job_id}`);
    }
  }, 1000);
}

const sections = [
  {
    title: "Personal Details",
    desc: "Tell me about yourself.",
    buttonLabel: "UPDATE",
  },
  {
    title: "Career History",
    desc: "Atleast have 2 years experience.",
    buttonLabel: "INPUT",
  },
  {
    title: "Skills & Languages",
    desc: "",
    buttonLabel: "UPDATE",
  },
  {
    title: "Right to Work",
    desc: "Tell us about your work permit or legal status.",
    buttonLabel: "UPDATE",
  },
  {
    title: "Interest",
    desc: "Let us know what you're interested in professionally.",
    buttonLabel: "UPDATE",
  },
  {
    title: "Skill Passport (MRA-TP Standard)",
    desc: "Candidate must have ASEAN Skill Passport",
    buttonLabel: "UPDATE",
  },
];
</script>

<style scoped>
/* Tambahkan styling custom jika perlu */
</style>
