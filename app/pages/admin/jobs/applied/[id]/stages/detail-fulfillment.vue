<template>
  <v-card rounded="lg" elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-text v-if="route.hash == ''">
      <!-- Judul dan Deskripsi -->
      <div v-if="localAjs.status == 'CURRENT'">
        <div class="font-weight-bold" style="font-size: 20px">
          {{ localAjs.jobStep.step_name }}
        </div>
        <div class="mt-2" style="color: #757575">
          Thank you for your interest in {{ applicant.job.title }} at
          {{ applicant.job.company.company_name }}. Please provide or update the
          required information in your profile to proceed to the next stage of
          recruitment.
        </div>
        <div class="mt-2" style="color: #757575">
          {{ localAjs.jobStep.description }}
        </div>
      </div>
      <div v-else>
        <div class="font-weight-bold" style="font-size: 20px">
          {{ localAjs.jobStep.step_name }} {{ labelAjsStatus(localAjs.status) }}
          <v-chip
            :color="colorAjsStatus(localAjs.status)"
            variant="flat"
            size="small"
          >
            {{ labelAjsStatus(localAjs.status) }}
          </v-chip>
        </div>

        <div class="mt-2" style="color: #757575">
          <template v-if="localAjs.status == 'REVISED'">
            <strong>Message From Recruiter :</strong> {{ localAjs.notes }}
          </template>
          <template v-else-if="localAjs.status == 'ACCEPTED'">
            Congratulations! Your application has been accepted. You can now
            proceed to the next stage.
          </template>
          <template v-else>
            Your application is currently under review. We need a bit more
            information to proceed. Please check your email for our request or
            provide the required details in your profile.
          </template>
        </div>
      </div>
      <div
        style="margin: 0px -33px -33px -33px; z-index: -1"
        v-if="['ACCEPTED', 'FAILED', 'SUBMITTED'].includes(localAjs.status)"
      >
        <component
          :is="FillmentPreview"
          :attributes="localAjs.jobStep.attributes"
          :user_id="applicant.user_id"
        />
      </div>

      <!-- List Section -->
      <div class="mt-6" v-if="['CURRENT', 'REVISED'].includes(localAjs.status)">
        <template
          v-for="(section, idx) in localAjs.jobStep.attributes"
          :key="idx"
        >
          <div
            class="d-flex align-center justify-space-between py-3"
            style="border-bottom: 1px dashed #e0e0e0"
            v-if="section.state == 1"
          >
            <div>
              <div class="font-weight-bold mb-2" style="font-size: 15px">
                {{ section.label }}
              </div>
              <div style="color: #757575">{{ section.notes }}</div>
            </div>
            <v-btn
              :color="'primary'"
              variant="outlined"
              rounded="lg"
              style="min-width: 110px"
              @click="router.push({ hash: `#${section.id}` })"
            >
              {{
                me.wizard_state?.find((w) => w.id == section.id)?.state == 1
                  ? "UPDATE"
                  : "INPUT"
              }}
            </v-btn>
          </div>
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
          @click="router.push({ hash: '#review&submit' })"
        >
          REVIEW & SUBMIT
        </v-btn>
      </div>
    </v-card-text>
    <v-card-text
      class="pa-6"
      v-else-if="route.hash.replace('#', '') == 'review&submit'"
    >
      <v-btn
        color="primary"
        rounded="lg"
        style="font-weight: bold"
        @click="router.back()"
        variant="text"
        class="px-1 mb-4"
        height="30"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Back
      </v-btn>
      <h3 class="mb-3" style="font-size: 20px">Review your application</h3>
      <p class="text-grey mb-2" style="font-size: 14px">
        Review your application before submitting to ensure all details are
        accurate and complete.
      </p>
      <p class="text-grey" style="font-size: 14px">
        {{ localAjs.jobStep.description }}
      </p>
      <div style="margin: 0px -33px -33px -33px; z-index: -1">
        <component
          :is="FillmentPreview"
          :isFillment="true"
          :attributes="localAjs.jobStep.attributes"
          :user_id="applicant.user_id"
        />
      </div>
      <v-card-actions class="mt-2 px-0">
        <v-btn
          @click="router.back()"
          variant="outlined"
          color="primary"
          min-width="150"
          rounded="lg"
        >
          Back
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          @click="handleSubmit"
          variant="flat"
          color="primary"
          min-width="150"
          rounded="lg"
          :loading="loadingSubmit"
        >
          Submit
        </v-btn>
      </v-card-actions>
    </v-card-text>
    <v-card-text class="pa-6" v-else>
      <v-btn
        color="primary"
        rounded="lg"
        style="font-weight: bold"
        @click="router.back()"
        variant="text"
        class="px-1"
        height="30"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        Back
      </v-btn>
      <div class="mt-4">
        <div class="font-weight-bold mb-2" style="font-size: 18px">
          {{
            localAjs.jobStep?.attributes?.find(
              (a) => a.id == route.hash.replace("#", "")
            )?.label
          }}
        </div>
        <div style="color: #757575">
          {{
            localAjs.jobStep?.attributes?.find(
              (a) => a.id == route.hash.replace("#", "")
            )?.notes
          }}
        </div>
      </div>
      <div style="margin: 0px -33px -33px -33px; z-index: -1">
        <component
          v-if="route.hash.replace('#', '') == '1'"
          :is="Fillment1"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '2'"
          :is="Fillment2"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '3'"
          :is="Fillment3"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '4'"
          :is="Fillment4"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '5'"
          :is="Fillment5"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '6'"
          :is="Fillment6"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '7'"
          :is="Fillment7"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '8'"
          :is="Fillment8"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '9'"
          :is="Fillment9"
          :isFillment="true"
        />
        <component
          v-if="route.hash.replace('#', '') == '10'"
          :is="Fillment10"
          :isFillment="true"
        />
      </div>
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
import Fillment1 from "~/pages/admin/profile/candidate/1.vue";
import Fillment2 from "~/pages/admin/profile/candidate/2.vue";
import Fillment3 from "~/pages/admin/profile/candidate/3.vue";
import Fillment4 from "~/pages/admin/profile/candidate/4.vue";
import Fillment5 from "~/pages/admin/profile/candidate/5.vue";
import Fillment6 from "~/pages/admin/profile/candidate/6.vue";
import Fillment7 from "~/pages/admin/profile/candidate/7.vue";
import Fillment8 from "~/pages/admin/profile/candidate/8.vue";
import Fillment9 from "~/pages/admin/profile/candidate/9.vue";
import Fillment10 from "~/pages/admin/profile/candidate/10.vue";
import FillmentPreview from "~/components/detail-fulfillment-preview.vue";

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

const fetchAjs = async () => {
  try {
    const response = await $apiFetch(`/applicant-job-steps/search`, {
      method: "GET",
      params: {
        id: props.ajs.id,
        expands: "jobStep",
      },
    });

    localAjs.value = response.items[0];
    // Emit the updated data to parent
    emit("update:ajs", localAjs.value);
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
    fetchAjs();
  } catch (error) {
    console.error("Error submitting AJS:", error);
  } finally {
    loadingSubmit.value = false;
  }
};

const handleSubmit = async () => {
  loadingSubmit.value = true;
  localAjs.value.attributes = localAjs.value.jobStep.attributes.map((a) => {
    a.state_from_job_step = a.state;
    a.state_from_candidate = a.state;
    delete a.state;
    return a;
  });
  try {
    const response = await $apiFetch(`/applicant-job-steps/${props.ajs.id}`, {
      method: "PATCH",
      body: {
        status: "SUBMITTED",
        attributes: localAjs.value.attributes,
      },
    });
    snackbar.showSnackbar({
      message: "Application submitted successfully",
      type: "success",
    });
    router.replace({
      hash: "",
    });
    fetchAjs();

    //showSuccessDialog.value = true;
    //startRedirectTimer();
  } catch (error) {
    console.error("Error submitting AJS:", error);
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

onMounted(() => {
  //fetchAjs();
});
</script>

<style scoped>
/* Tambahkan styling custom jika perlu */
</style>
