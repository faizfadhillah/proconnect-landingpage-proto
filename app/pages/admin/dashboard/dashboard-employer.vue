<template>
  <v-container>
    <v-row style="max-width: 1000px; margin: 0 auto">
      <v-col cols="12">
        <div class="text-center">
          <h3>Hello {{ me.full_name }}</h3>
          <p style="font-size: 1.2rem">Get Started Finding Candidates Here!</p>
        </div>
        <v-text-field
          v-model="search"
          placeholder="Find Candidate Here"
          append-inner-icon="mdi-magnify"
          class="my-4 bg-white"
          variant="outlined"
          hide-details
          rounded="lg"
          density="comfortable"
          @keyup.enter.prevent="searchCandidates"
          @keyup="searchCandidates"
          elevation="0"
        ></v-text-field>
        <v-alert
          color="#485bff"
          class="mb-4"
          closable
          rounded="lg"
          v-if="stepDone < stepItems.length"
        >
          <p class="mb-2 font-weight-bold" style="font-size: 0.9rem">
            Complete your profile to increase your company's visibility!
          </p>
          <v-btn
            :to="`/admin/profile/employer/${stepItems[stepDone]?.id}`"
            dark
            variant="elevated"
            size="small"
            >Complete Profile</v-btn
          >
        </v-alert>
        <v-card
          elevation="0"
          class="mb-5"
          rounded="lg"
          style="border: 1px solid #e0e0e0"
        >
          <v-card-text class="pa-5">
            <h4>Profile Completion</h4>
            <p class="my-4">
              {{ stepDone }} of {{ stepItems.length }} steps completed
            </p>
            <v-progress-linear
              v-model="progress"
              color="blue-lighten-2"
              height="10"
              rounded
              class="mb-4"
            ></v-progress-linear>
            <div class="vertical-stepper mt-3">
              <div
                v-for="(step, index) in stepItems"
                :key="index"
                class="stepper-item d-flex align-center mb-1 py-2 position-relative"
                :class="{ active: currentStep > step.id }"
              >
                <div
                  v-if="step.state == 1"
                  class="mr-4"
                  style="margin-left: -2px"
                >
                  <v-icon size="23" color="primary">mdi-check-circle</v-icon>
                </div>
                <div
                  v-else
                  class="mr-4 text-body-2 font-weight-medium stepper-circle"
                  :style="`width: 20px; height: 20px; border-radius: 50%; border: 1px solid ${
                    currentStep >= step.id || step.state == 1
                      ? '#1560bd'
                      : '#bbb'
                  }; display: flex; align-items: center; justify-content: center; color: ${
                    currentStep >= step.id || step.state == 1
                      ? '#1560bd'
                      : '#bbb'
                  };`"
                >
                  {{ step.id }}
                </div>

                <div
                  class="stepper-text"
                  @click="
                    router.push({
                      path: `/admin/profile/employer/${step.id}`,
                      query: { edit: stepDone >= index ? 1 : null },
                    })
                  "
                >
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="
                      currentStep >= step.id || step.state == 1
                        ? 'text-primary font-weight-bold'
                        : 'text-grey'
                    "
                    style="cursor: pointer"
                  >
                    {{ step.label }}
                  </span>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="step.state != 1"
                  color="error"
                  variant="tonal"
                  size="x-small"
                  @click="
                    router.push({
                      path: `/admin/profile/employer/${step.id}`,
                      query: { edit: stepDone >= step.id ? 1 : null },
                    })
                  "
                  >Not Completed</v-btn
                >
              </div>
            </div>
          </v-card-text>

          <template v-if="showWelcome">
            <v-card-text class="text-center py-2">
              <v-avatar color="primary" size="96" class="me-4 mb-4">
                <v-icon size="48" color="white">mdi-hand-wave</v-icon>
              </v-avatar>
              <h3 class="text-h5 font-weight-medium mb-4">Welcome to</h3>
              <v-img src="/logo.svg" contain height="50" class="mb-4"></v-img>
              <p class="text-body-1 mb-4">
                Powered by <strong>ASEANTA</strong>
              </p>
            </v-card-text>

            <v-divider class="mb-4"></v-divider>

            <div class="px-2">
              <p class="text-body-1 mb-4">
                <v-icon color="primary" size="20" class="me-3"
                  >mdi-account</v-icon
                >
                If you are a <strong>Candidate</strong>, please complete your
                profile by accessing menu
                <v-chip
                  color="primary"
                  size="small"
                  class="font-weight-medium mx-1"
                  >PROFILE</v-chip
                >
              </p>

              <p class="text-body-1 mb-4">
                <v-icon color="primary" size="20" class="me-3"
                  >mdi-domain</v-icon
                >
                If you are a <strong>PIC of an Company</strong>, you may Add
                member by accessing menu
                <v-chip
                  color="primary"
                  size="small"
                  class="font-weight-medium mx-1"
                  >PROFILE</v-chip
                >
                or create Job on menu
                <v-chip
                  color="primary"
                  size="small"
                  class="font-weight-medium mx-1"
                  >JOBS</v-chip
                >
              </p>
              <p class="text-body-1 mb-4">
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-account-circle"
                  @click="$router.push('/admin/profile')"
                >
                  Go to Profile
                  <v-icon size="20" color="primary" class="ml-2"
                    >mdi-arrow-right</v-icon
                  >
                </v-btn>
              </p>
            </div>
          </template>
        </v-card>

        <div class="my-5">
          <h3 class="mb-5">What do you want to do today?</h3>
          <v-row>
            <v-col cols="12" md="4">
              <v-card
                to="/admin/jobs/employer"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0; min-height: 105px"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-briefcase</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Manage Jobs</h3>
                    <p class="text-caption text-grey">
                      Post Jobs and Manage Candidate Recruitment for Your
                      Business
                    </p>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card
                to="/admin/candidates"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0; min-height: 105px"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-account-group</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Find Candidates</h3>
                    <div class="text-caption text-grey">
                      Directly Find the Ideal Candidates for Your Business
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card
                to="/admin/profile"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0; min-height: 105px"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-account-box</v-icon
                  >

                  <div>
                    <div class="text-subtitle-1 font-weight-bold mb-1">
                      Manage Profile
                    </div>
                    <div class="text-caption text-grey">
                      View and Manage Your Business Profile Details
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
    <v-dialog v-model="loadingInitial" persistent width="auto" max-width="200">
      <v-card
        height="130"
        class="d-flex flex-column align-center justify-center text-center mx-auto pa-3"
        rounded="xl"
        style="background-color: rgba(255, 255, 255, 0.9)"
      >
        <v-img :src="`/logo-double.svg`" width="100" class="mb-3" />
        <div class="d-flex align-center justify-center mb-2">
          <v-progress-circular
            size="25"
            width="3"
            indeterminate
            color="primary"
            class="mr-2"
          >
          </v-progress-circular>
          <strong style="font-size: 16px" class="text-primary">
            Loading...
          </strong>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
// Page meta for layout and middleware
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});
const showWelcome = ref(false);
const route = useRoute();
const router = useRouter();
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();
const loadingInitial = ref(true);
const { handleLogout: logout } = useLogout();

const companyRoleOptions = ref([
  { label: "Owner HQ", value: "owner_hq", order: 1 },
  { label: "HRD HQ", value: "hrd_hq", order: 2 },
  { label: "Dept Head HQ", value: "dept_head_hq", order: 3 },
  { label: "PIC Branch", value: "pic_branch", order: 4 },
  { label: "HRD Branch", value: "hrd_branch", order: 5 },
  { label: "Dept Head Branch", value: "dept_head_branch", order: 6 },
  { label: "Member", value: "member", order: 7 },
]);

const currentStep = ref(0);
const stepItems = ref([]);
const stepDone = ref(0);
const snackbar = useSnackbarStore();
const fetchStep = async () => {
  let company_roles = [];
  if (Array.isArray(me.value.roles) && me.value.roles.length > 0) {
    company_roles = me.value.roles.map((role) => role.assignment.company_role);
  } else {
    loadingInitial.value = false;
    router.replace("/admin/profile/choose-role");    
    return;
  }
  let highCompanyRole = company_roles.reduce((a, b) => {
    return companyRoleOptions.value.find((role) => role.value === a)?.order <
      companyRoleOptions.value.find((role) => role.value === b)?.order
      ? a
      : b;
  });
  const isOwnerHq = company_roles.includes("owner_hq");
  const response = await $apiFetch(`/configs/key/list_of_wizard_employer_v2`);
  const stepItemsFilter = response.value.filter((item) =>
    item.roles.includes(highCompanyRole)
  );
  stepItems.value = stepItemsFilter.map((item) => {
    return {
      ...item,
      state:
        (me.value.wizard_state.find((state) => state.id === item.id)?.state !==
          undefined && isOwnerHq
          ? me.value.wizard_state.find((state) => state.id === item.id)?.state
          : 1) || 1,
    };
  });

  if (
    Array.isArray(me.value.wizard_state) &&
    me.value.wizard_state.length > 0
  ) {
    stepDone.value = stepItems.value.filter((item) => item.state == 1).length;
    stepDone.value =
      stepDone.value > stepItems.value.length
        ? stepItems.value.length
        : stepDone.value;
  }
  progress.value = (stepDone.value / stepItems.value.length) * 100;

  $apiFetch(`/users/${me.value.id}`, {
    method: "PATCH",
    body: {
      wizard_state: stepItems.value,
      last_wizard_state: isOwnerHq
        ? me.value.last_wizard_state
        : stepItems.value.length + 9,
    },
  });
  loadingInitial.value = false;
};

const progress = ref(0);

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchStep();
});

const search = ref("");
const searchJobs = async () => {
  router.push(`/admin/jobs/all?search=${search.value}`);
};
const searchCandidates = debounce(async () => {
  router.push(`/admin/candidates?search=${search.value}`);
}, 500);
</script>
<style scoped>
.vertical-stepper {
  position: relative;
}

.stepper-item {
  position: relative;
  z-index: 1;
}

.stepper-circle {
  background: white;
  position: relative;
  z-index: 2;
}

.stepper-line {
  position: absolute;
  left: 28px; /* Adjust this value to align with the center of the circle */
  top: 50px; /* Adjust to start from bottom of circle */
  width: 1px;
  height: 30px; /* Adjust height as needed */
  background-color: #bbb;
}

.stepper-line-active {
  background-color: #1560bd;
}
</style>
