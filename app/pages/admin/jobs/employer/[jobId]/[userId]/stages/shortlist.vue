<template>
  <v-card rounded="lg" elevation="0" style="border: 1px solid #e0e0e0">
    <v-card-text>
      <div class="d-flex flex-column">
        <!-- Header: Name, Position, Status -->

        <div class="d-flex align-center justify-space-between mb-2">
          <div>
            <span class="font-weight-bold" style="font-size: 16px">
              <template v-if="['ACCEPTED', 'FAILED'].includes(localAjs.status)">
                Application Shortlisted
              </template>
              <template v-else>
                {{ user.full_name }} Applied
                {{ applicant.job.title }}
              </template>
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
          <template v-if="['ACCEPTED'].includes(localAjs.status)">
            You have Approved {{ user.full_name }} to continue the next stage
          </template>
          <template v-else-if="['FAILED'].includes(localAjs.status)">
            You have Rejected {{ user.full_name }}
          </template>
          <template v-else> Applicant is waiting for your decision </template>
        </div>
        <!-- Date -->

        <div class="text-grey-darken-1" style="font-size: 12px">
          Applied on
          {{
            applicant?.applied_at
              ? new Date(applicant.applied_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "20 March 2025"
          }}
        </div>

        <template
          v-if="!['ACCEPTED', 'FAILED', 'SKIPPED'].includes(localAjs.status)"
        >
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
  >
    <v-card-text>
      <h3 class="mb-4">Profile Summary</h3>
      <div class="d-flex align-center mb-3">
        <v-avatar size="66" class="bg-grey-lighten-3 mr-4">
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
          </div>
        </div>
      </div>
    </v-card-text>
    <v-card-text class="pt-0">
      <table class="w-100 text-grey-darken-2">
        <tbody>
          <tr>
            <td class="py-1" style="width: 120px">Date of Birth</td>
            <td style="width: 20px">:</td>
            <td>
              {{ user.date_of_birth ? formatDate(user.date_of_birth) : "-" }}
            </td>
          </tr>
          <tr>
            <td class="py-1">Gender</td>
            <td>:</td>
            <td>{{ capitalizeWords(user.gender || "-") }}</td>
          </tr>
          <tr>
            <td class="py-1">Address</td>
            <td>:</td>
            <td>{{ user.address || "-" }}</td>
          </tr>
          <tr>
            <td class="py-1">City</td>
            <td>:</td>
            <td>
              <template v-if="user.is_outside_indonesia">
                {{ user.other_region || "-" }}
                {{ user.other_country || "-" }}
              </template>
              <template v-else>
                {{ user.region?.full_name || "-" }}
              </template>
            </td>
          </tr>
          <tr>
            <td class="py-1">Postal Code</td>
            <td>:</td>
            <td>{{ user.postal_code || "-" }}</td>
          </tr>
          <tr>
            <td class="py-1">Resume</td>
            <td>:</td>
            <td>
              <a
                v-if="user.resume_url"
                :href="BASE_URL + user.resume_url"
                target="_blank"
                class="text-primary font-weight-bold text-decoration-none"
              >
                Download
              </a>
              <span v-else>-</span>
            </td>
          </tr>
          <tr>
            <td class="py-1">Skills</td>
            <td>:</td>
            <td>
              {{
                user.userSkills?.map((skill) => skill.skill.name).join(", ") ||
                "-"
              }}
            </td>
          </tr>
          <tr>
            <td class="py-1">Interests</td>
            <td>:</td>
            <td>
              {{
                user.userInterests
                  ?.map((interest) => interest.interest.name)
                  .join(", ") || "-"
              }}
            </td>
          </tr>
          <tr>
            <td colspan="3" class="py-1">
              <v-btn
                color="primary"
                variant="text"
                class="px-0 font-weight-bold"
                density="comfortable"
                :to="`/admin/jobs/employer/${route.params.jobId}/${route.params.userId}`"
                target="_blank"
              >
                <v-icon start>mdi-chevron-right</v-icon>
                View Detail
              </v-btn>
            </td>
          </tr>
        </tbody>
      </table>
    </v-card-text>
  </v-card>

  <!-- Move Candidate Dialog -->
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

const { isMobile, isDesktop } = useScreenSize();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const { $apiFetch } = useApi();

const emit = defineEmits(["update:ajs", "update:tab"]);

const localAjs = ref({ ...props.ajs });
const stages = ref([]);
const selectedStage = ref(null);

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
  } catch (error) {
  } finally {
    rejectLoading.value = false;
    dialog.closeDialog();
  }
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
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
