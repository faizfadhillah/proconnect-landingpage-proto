<template>
  <v-app class="bg-grey-lighten-4">
    <!-- Sidebar -->
    <v-app-bar density="comfortable" class="px-2" elevation="0">
      <v-row class="align-center px-3" style="min-width: 220px">
        <v-btn
          icon
          size="small"
          @click="handleBack"
          elevation="0"
          color="primary"
          class="mr-2"
          style="background: rgba(255, 255, 255, 0.1)"
        >
          <v-icon size="20">mdi-arrow-left</v-icon>
        </v-btn>
        <v-img v-if="isDesktop" src="/logo.svg" height="24"></v-img>
      </v-row>
      <v-spacer style="width: 90%"></v-spacer>
      <v-spacer></v-spacer>
    </v-app-bar>
    <v-main>
      <v-container>
        <v-row>
          <v-col
            v-if="isDesktop"
            cols="12"
            style="position: sticky; top: 30px; height: fit-content"
          >
            <div class="horizontal-stepper mt-3 d-flex align-center">
              <div
                v-for="(step, index) in stepItems"
                :key="index"
                class="stepper-item d-flex align-center position-relative"
                @click="handleStepClick(index + 1)"
                :class="{
                  active: currentStep >= index + 1,
                }"
              >
                <div
                  class="text-body-2 font-weight-medium stepper-circle"
                  :style="`width: 25px; height: 25px; border-radius: 50%; border: 1px solid ${
                    currentStep == index + 1 ? '#1560bd' : '#bbb'
                  }; display: flex; align-items: center; justify-content: center; color: ${
                    currentStep == index + 1 ? '#1560bd' : '#bbb'
                  };`"
                >
                  <v-icon v-if="step.state == 1" size="29"
                    >mdi-check-circle</v-icon
                  >
                  <template v-else>{{ index + 1 }}</template>
                </div>
                <div class="stepper-text mx-2">
                  <span
                    class="text-body-2 font-weight-bold"
                    :class="
                      currentStep == index + 1
                        ? 'text-primary font-weight-bold'
                        : 'text-grey'
                    "
                  >
                    {{ step.label }}
                  </span>
                </div>
              </div>
            </div>

            <div
              class="d-flex align-center text-center justify-center"
              v-if="loadingProfile"
            >
              <v-skeleton-loader
                v-for="i in 3"
                :key="i"
                class="bg-grey-lighten-4 mx-2"
                style="width: 100px"
                type="text"
              ></v-skeleton-loader>
            </div>
          </v-col>
          <v-col v-else cols="12" class="pb-0">
            <div class="d-flex align-center mb-4">
              <v-progress-linear
                color="blue"
                rounded="lg"
                height="12"
                style="margin-top: 7px"
                :model-value="(currentStep / stepItems.length) * 100"
              ></v-progress-linear>
              <div style="min-width: 90px" class="ml-2 text-right">
                Step {{ currentStep }} of {{ stepItems.length }}
              </div>
            </div>
            <div class="d-flex align-center">
              <div
                class="text-body-2 font-weight-medium stepper-circle"
                :style="`width: 25px; height: 25px; border-radius: 50%; border: 1px solid #1560bd; display: flex; align-items: center; justify-content: center; color: #1560bd`"
              >
                {{ parseInt(currentStep) }}
              </div>
              <div class="stepper-text mx-2">
                <span class="text-primary font-weight-bold">
                  {{ stepItems[currentStep - 1]?.label }}
                </span>
              </div>
            </div>
          </v-col>
          <v-col cols="12" class="pa-0">
            <NuxtPage />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Footer -->

    <v-footer app style="border-top: 1px solid #eee" class="bg-grey-lighten-4">
      <v-container class="pa-0">
        <div class="d-flex justify-center w-100">
          <p class="text-caption text-grey-darken-1 ma-0">
            Aseanta ProConnect &copy; {{ new Date().getFullYear() }}
          </p>
        </div>
      </v-container>
    </v-footer>
    <Snackbar />
    <ConfirmDialog />
  </v-app>
</template>

<script setup>
// Define middleware
definePageMeta({
  ssr: false,
  middleware: ["auth"],
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Reactive data
const appName = ref("ProConnect Admin ");

// Computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Determine if the drawer should be permanent
const { isMobile, isDesktop } = useScreenSize();
const drawer = ref(false); // Start with the drawer closed by default
const { me, fetchMe } = useUser();

const dialog = useDialogStore();
const handleBack = async () => {
  if (currentStep.value == 1) {
    try {
      await dialog.openDialog({
        title: "Are you sure?",
        message: "Are you sure you want to leave this page?",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        confirmButtonColor: "error",
        cancelButtonColor: "grey-darken-1",
      });
      router.replace("/admin/jobs/employer?id=" + (route.params.id || ""));
    } catch (error) {
      console.error("Error back:", error);
    }
    return;
  } else if (currentStep.value > 1) {
    router.replace(
      "/admin/jobs/employer/form/" +
        route.params.id +
        "/" +
        (currentStep.value - 1)
    );
  } else {
    router.replace("/admin/jobs/employer?id=" + (route.params.id || ""));
  }
};
// Methods
const handleLogout = async () => {
  try {
    await authStore.clearToken();
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Toggle drawer state for mobile view
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

const handleStepClick = (step) => {
  if (route.params.id) {
    router.push(`/admin/jobs/employer/form/${route.params.id}/${step}`);
  }
};

const loadingProfile = ref(false);

const { $apiFetch } = useApi();
onMounted(async () => {
  drawer.value = isDesktop.value;
  if (!me.value.id) {
    await fetchMe();
  }
});

const currentStep = ref(
  isNaN(Number(route.path.split("/").pop()))
    ? 1
    : Number(route.path.split("/").pop())
);
const stepItems = ref([
  {
    id: 1,
    label: "Job Details",
    state: 0,
  },
  {
    id: 2,
    label: "Recruitment Stages",
    state: 0,
  },
  {
    id: 3,
    label: "Review & Publish",
    state: 0,
  },
]);

watch(
  () => route.path,
  (newPath, oldPath) => {
    currentStep.value = isNaN(Number(newPath.split("/").pop()))
      ? 1
      : Number(newPath.split("/").pop());
    checkStatus();
  }
);

const checkStatus = () => {
  if (route.params.id) {
    $apiFetch("/jobs/search", {
      params: {
        filters: {
          id: route.params.id,
        },
      },
    }).then((response) => {
      if (response.items.length > 0) {
        stepItems.value[0].state = 1;
      }
      if (response.items[0] && response.items[0].status == "PUBLISH") {
        stepItems.value[2].state = 1;
      }
    });

    $apiFetch("/job-steps/search", {
      params: {
        filters: {
          job_id: route.params.id,
        },
        sortBy: { step_order: "asc" },
        limit: 100,
      },
    }).then((response) => {
      if (response.items.length > 0) {
        stepItems.value[1].state = 1;
      } else {
        stepItems.value[1].state = 0;
      }
    });
  }
};

onMounted(() => {
  console.log(currentStep);
  checkStatus();
});
</script>

<style scoped>
.horizontal-stepper {
  position: relative;
  width: 100%;
  justify-content: center;
}

.stepper-item {
  position: relative;
  z-index: 1;
  padding: 0 16px;
}

.stepper-circle {
  background: white;
  position: relative;
  z-index: 2;
}

.stepper-line {
  position: absolute;
  left: calc(100% - 8px);
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 1px;
  background-color: #bbb;
}

.stepper-line-active {
  background-color: #1560bd;
}

.stepper-text {
  white-space: nowrap;
}
</style>
