<template>
  <v-card
    rounded="lg"
    elevation="0"
    class="pa-2"
    style="border: 1px solid #e0e0e0"
  >
    <v-card-text class="pt-2">
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
                    {{ test.test_file_candidate ? "" : "Upload" }} Filled Test
                    Document
                  </p>
                  <v-file-upload
                    v-model="test.test_file_candidate"
                    placeholder="Upload file (max size 5mb)"
                    rounded="lg"
                    :required="true"
                    category="test_submission_candidate"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z"
                    :rules="[(v) => !!v || 'Test file is required']"
                    class="mb-5"
                    :readonly="
                      !['CURRENT', 'REVISED'].includes(localAjs.status)
                    "
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
                    Please confirm if you have filled the test document and fill
                    out the name you put in the submission.
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
                    :readonly="
                      !['CURRENT', 'REVISED'].includes(localAjs.status)
                    "
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
                      :readonly="
                        !['CURRENT', 'REVISED'].includes(localAjs.status)
                      "
                    ></v-text-field>
                  </div>
                </div>
              </template>
            </v-card-text>
          </v-card>
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
  </v-card>
</template>

<script setup>
const { $apiFetch } = useApi();
const router = useRouter();
const route = useRoute();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

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

const snackbar = useSnackbarStore();
const loadingSubmit = ref(false);

const form = ref(null);
const handleSubmit = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    return;
  }

  loadingSubmit.value = true;
  try {
    const responseAjs = await $apiFetch(
      `/applicant-job-steps/${props.ajs.id}`,
      {
        method: "PATCH",
        body: {
          attributes: localAjs.value.attributes,
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
</script>

<style scoped>
/* Tambahkan styling custom jika perlu */
</style>
