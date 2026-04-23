<template>
  <v-card rounded="lg" elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-text>
      <div v-if="localAjs.status == 'ACCEPTED'" class="d-flex flex-column">
        <div class="mb-2">
          <h2 class="text-h5 font-weight-bold mb-2">
            Congratulations, {{ user.full_name }}!
          </h2>

          <p class="text-grey-darken-1" style="font-size: 14px">
            We're excited to announce that you've been hired! Congratulations on
            joining our team. Below are the details of your new role:
          </p>
        </div>

        <ul class="pa-4">
          <li class="mb-2">
            <strong>Job Title : </strong>
            <span>{{ applicant.job?.title }}</span>
          </li>

          <li class="mb-2">
            <strong>Start Date : </strong>
            <span v-if="localAjs.attributes?.start_date">{{
              formatDate(localAjs.attributes?.start_date) || "Not specified"
            }}</span>
            <span v-else>Not specified</span>
          </li>

          <li class="mb-2">
            <strong>Description : </strong>
            <span>
              {{
                localAjs.attributes?.hiring_description ||
                "No additional details provided"
              }}
            </span>
          </li>
          <li v-if="localAjs.attributes?.hiring_attachment" class="mb-2">
            <strong>Attachment : </strong>
            <a
              :href="BASE_URL + localAjs.attributes?.hiring_attachment"
              target="_blank"
              class="text-primary text-decoration-none"
            >
              {{ localAjs.attributes?.hiring_attachment }}
            </a>
          </li>
        </ul>

        <p class="text-grey-darken-1 mb-4" style="font-size: 14px">
          The employer will be contacting you shortly to request any necessary
          documents. Please check your email or phone for further instructions.
          We look forward to having you on board!
        </p>
      </div>
      <div v-else-if="localAjs.status == 'FAILED'" style="line-height: 1.5">
        <div>
          <h2 class="font-weight-bold mb-2">Thank You for Your Application</h2>

          <p class="text-grey-darken-1" style="font-size: 14px">
            Thank you for your interest in joining our team. After careful
            consideration, we regret to inform you that we will not be
            proceeding with your application at this time. While your
            qualifications are impressive, we have selected another candidate
            who better fits the current needs of the position. We encourage you
            to apply for future openings that may align with your skills and
            experience.
          </p>

          <p class="text-grey-darken-1 mt-4" style="font-size: 14px">
            Thank you again for your time and effort, and we wish you all the
            best in your job search.
          </p>
        </div>
      </div>
      <div v-else>
        <div>
          <h2 class="font-weight-bold mb-2">Hiring Process Pending</h2>

          <p class="text-grey-darken-1" style="font-size: 14px">
            Thank you for your application! It is currently under review, and
            our team is carefully evaluating your qualifications. We appreciate
            your patience during this process and will keep you informed about
            the next steps as soon as possible.
          </p>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
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

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const { $apiFetch } = useApi();
const emit = defineEmits(["update:ajs", "update:tab"]);
const localAjs = ref({ ...props.ajs });

watch(
  () => props.ajs.status,
  (newAjs) => {
    localAjs.value = { ...props.ajs };
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

const handleReject = async () => {
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
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
