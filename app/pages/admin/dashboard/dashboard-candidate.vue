<template>
  <v-container>
    <v-row style="max-width: 1000px; margin: 0 auto">
      <v-col cols="12">
        <div class="text-center">
          <h3>Hello {{ me.full_name }}</h3>
          <p style="font-size: 1.2rem">Get Started Finding Jobs Here!</p>
        </div>
        <v-text-field
          v-model="search"
          placeholder="Find Jobs or Companies Here"
          append-inner-icon="mdi-magnify"
          class="my-4 bg-white"
          variant="outlined"
          hide-details
          rounded="lg"
          density="comfortable"
          @keyup="searchJobs"
          @keyup.enter.prevent="searchJobs"
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
            Complete your profile to increase your chances of getting hired!
          </p>
          <v-btn
            to="/admin/profile/candidate/1"
            dark
            variant="elevated"
            size="small"
            >Complete Profile</v-btn
          >
        </v-alert>
        <v-card
          class="rounded-lg mb-5"
          elevation="0"
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
                :class="{ active: currentStep > index + 1 }"
                @click="handleStepClick(index + 1)"
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
                    currentStep >= index + 1 || step.state == 1
                      ? '#1560bd'
                      : '#bbb'
                  }; display: flex; align-items: center; justify-content: center; color: ${
                    currentStep >= index + 1 || step.state == 1
                      ? '#1560bd'
                      : '#bbb'
                  };`"
                >
                  {{ index + 1 }}
                </div>

                <div
                  class="stepper-text"
                  @click="
                    router.push({
                      path: `/admin/profile/candidate/${index + 1}`,
                      query: {
                        edit: stepDone > stepItems.length ? 1 : 0,
                      },
                    })
                  "
                >
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="
                      currentStep >= index + 1 || step.state == 1
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
                      path: `/admin/profile/candidate/${index + 1}`,
                      query: {
                        edit: stepDone > stepItems.length ? 1 : 0,
                      },
                    })
                  "
                  >Not Completed</v-btn
                >
              </div>
            </div>
          </v-card-text>
        </v-card>
        <div>
          <h3 class="mb-5">What do you want to do today?</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-card
                to="/admin/jobs/all"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-briefcase</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Find Jobs</h3>
                    <div class="text-caption text-grey">
                      Find and Apply the Ideal Job for You
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card
                to="/admin/profile"
                elevation="0"
                rounded="lg"
                style="border: 1px solid #e0e0e0"
              >
                <v-card-text class="d-flex align-center">
                  <v-icon size="24" class="mr-3 align-self-start"
                    >mdi-account-group</v-icon
                  >
                  <div>
                    <h3 class="font-weight-bold mb-1">Manage Profile</h3>
                    <div class="text-caption text-grey">
                      View and Update Your Profile Details
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
const showWelcome = ref(false);
const route = useRoute();
const router = useRouter();
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();

const currentStep = ref(0);
const stepItems = ref([]);
const stepDone = ref(0);
const fetchStep = async () => {
  const response = await $apiFetch(`/configs/key/list_of_wizard_candidate`);
  stepItems.value = response.value;
};
const progress = ref(0);

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  if (
    Array.isArray(me.value.wizard_state) &&
    me.value.wizard_state.length > 0
  ) {
    stepItems.value = me.value.wizard_state;
    currentStep.value = me.value.last_wizard_state;
    stepDone.value = stepItems.value.filter((item) => item.state == 1).length;
  } else {
    await fetchStep();
  }
  progress.value = (stepDone.value / stepItems.value.length) * 100;
});

import { debounce } from "~/utils/debounce";
const search = ref("");
const searchJobs = debounce(async () => {
  router.push(`/admin/jobs/all?search=${search.value}`);
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
