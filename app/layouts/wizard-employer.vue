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
          :disabled="me.last_wizard_state > 2"
        >
          <v-icon size="20">mdi-arrow-left</v-icon>
        </v-btn>
        <v-img v-if="isDesktop" src="/logo.svg" height="24"></v-img>
      </v-row>
      <v-spacer style="width: 90%"></v-spacer>
      <v-spacer></v-spacer>
    </v-app-bar>
    <v-main>
      <v-container :fluid="['3', '4'].includes(currentStep)">
        <v-row>
          <v-col
            v-if="isDesktop"
            :cols="['3', '4'].includes(currentStep) ? 3 : 4"
            style="
              position: sticky;
              top: 30px;
              height: fit-content;
              overflow-x: auto;
            "
          >
            <div
              class="vertical-stepper mt-3"
              v-if="!route.query.edit"
              style="min-width: 350px"
            >
              <div
                v-for="(step, index) in stepItems"
                :key="index"
                class="stepper-item d-flex align-center mb-1 pa-4 position-relative"
                :class="{
                  active: currentStep >= index + 1,
                }"
              >
                <div
                  class="mr-4 text-body-2 font-weight-medium stepper-circle"
                  :style="`width: 25px; height: 25px; border-radius: 50%; border: ${
                    step.state == 1 ? '0' : '1'
                  }px solid ${
                    currentStep >= index + 1 ? '#1560bd' : '#bbb'
                  }; display: flex; align-items: center; justify-content: center; color: ${
                    currentStep >= index + 1 ? '#1560bd' : '#bbb'
                  };`"
                >
                  <v-icon v-if="step.state == 1" size="29"
                    >mdi-check-circle</v-icon
                  >
                  <template v-else>{{ index + 1 }}</template>
                </div>
                <div class="stepper-text">
                  <span
                    style="font-size: 14px"
                    :class="
                      currentStep >= step.id
                        ? currentStep == step.id
                          ? 'text-primary font-weight-bold'
                          : ''
                        : 'text-grey'
                    "
                  >
                    {{ step.label }}
                  </span>
                </div>
                <div
                  v-if="index !== stepItems.length - 1"
                  class="stepper-line"
                  :class="{ 'stepper-line-active': currentStep > index + 1 }"
                ></div>
              </div>
            </div>
            <div class="vertical-stepper mt-3" style="max-width: 350px" v-else>
              <template v-for="(step, index) in stepItems" :key="index">
                <div
                  class="stepper-item d-flex align-center mb-4 pa-3 position-relative"
                  :class="{
                    active: currentStep >= step.id,
                  }"
                  :style="`
                  border-left: 4px solid #1560bd;
                  cursor: pointer;
                  ${currentStep == step.id ? 'background-color:#e1ecf7' : ''};
                `"
                  @click="handleStepClick(step.id)"
                >
                  <div class="stepper-text">
                    <span
                      style="font-size: 14px"
                      :class="
                        currentStep == step.id
                          ? 'text-primary font-weight-bold'
                          : ''
                      "
                    >
                      {{
                        step.id == 2 &&
                        !["owner", "hrd"].includes(me.company_role)
                          ? "Profile Info"
                          : step.label
                      }}
                    </span>
                  </div>
                </div>
              </template>
            </div>

            <v-skeleton-loader
              v-for="i in 3"
              :key="i"
              class="bg-grey-lighten-4"
              style="max-width: 200px"
              type="list-item-avatar"
              v-if="loadingProfile && stepItems.length == 0"
            ></v-skeleton-loader>
          </v-col>
          <v-col v-else cols="12" class="pb-0">
            <div class="d-flex align-center mb-4">
              <v-progress-linear
                color="blue"
                rounded="lg"
                height="12"
                style="margin-top: 7px"
                :model-value="(stepIndex / stepItems.length) * 100"
              ></v-progress-linear>
              <div style="min-width: 90px" class="ml-2 text-right">
                Step {{ stepIndex }} of {{ stepItems.length }}
              </div>
            </div>
            <div class="d-flex align-center">
              <div
                class="text-body-2 font-weight-medium stepper-circle"
                :style="`width: 25px; height: 25px; border-radius: 50%; border: 1px solid #1560bd; display: flex; align-items: center; justify-content: center; color: #1560bd`"
              >
                {{ parseInt(stepIndex) }}
              </div>
              <div class="stepper-text mx-2">
                <span class="text-primary font-weight-bold">
                  {{ stepItems[stepIndex - 1]?.label }}
                </span>
              </div>
            </div>
          </v-col>
          <v-col
            :cols="isDesktop ? (['3', '4'].includes(currentStep) ? 9 : 8) : 12"
            class="pa-0"
          >
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
  try {
    if (route.query.edit) {
      router.replace("/admin/profile");
    } else {
      const authRoutes = ["/login", "/signup", "/signup-verify-otp", "/"];
      const previousPath = router.options.history.state.back;
      if (me.value.last_wizard_state > 2) {
        if (currentStep.value == 1) {
          await dialog.openDialog({
            title: "Are you sure?",
            message: "Are you sure you want to leave this page?",
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            confirmButtonColor: "error",
            cancelButtonColor: "grey-darken-1",
          });
          router.replace("/login");
        } else {
          router.back();
        }
      } else if (
        previousPath &&
        previousPath != "/" &&
        !authRoutes.includes(previousPath)
      ) {
        router.back();
      } else {
        await dialog.openDialog({
          title: "Are you sure?",
          message: "Are you sure you want to leave this page?",
          confirmButtonText: "Yes",
          cancelButtonText: "No",
          confirmButtonColor: "error",
          cancelButtonColor: "grey-darken-1",
        });
        router.replace("/admin/profile/choose-role");
      }
    }
  } catch (error) {
    console.error("Error back:", error);
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
  router.push({
    path: `/admin/profile/employer/${step}`,
    query: route.query,
  });
};

const loadingProfile = ref(false);
const companyRole = ref(null);
const getProfile = async () => {
  loadingProfile.value = true;
  await fetchMe();
  if (
    (me.value.roles && me.value.roles[0]?.assignment) ||
    me.value.company_role
  ) {
    companyRole.value =
      me.value.roles[0]?.assignment?.company_role || me.value.company_role;
  }
  if (!me.value.wizard_state || me.value.wizard_state.length == 0) {
    await fetchStepItems(null, true);
  } else {
    if (me.value.wizard_state[0] && !me.value.wizard_state[0].roles) {
      await fetchStepItems(null, true);
    } else {
      stepItems.value = me.value.wizard_state.map((item) => {
        return {
          ...item,
          label:
            stepItems.value.find((step) => step.id == item.id)?.label ||
            item.label,
        };
      });
    }
  }
  stepIndex.value =
    stepItems.value.findIndex((item) => item.id == currentStep.value) + 1;
  loadingProfile.value = false;
};

const { $apiFetch } = useApi();
onMounted(() => {
  drawer.value = isDesktop.value;
  getProfile();
});

const currentStep = ref(route.path.split("/").pop() || 1);
const stepIndex = ref(currentStep.value);
const stepItems = ref([]);
const fetchStepItems = async (justId = null, isFirst = false) => {
  const data = await $apiFetch("/configs/key/list_of_wizard_employer_v2");
  if (justId) {
    stepItems.value = data.value.filter((item) => item.id == justId);
  } else {
    stepItems.value = data.value;
    if (companyRole.value) {
      stepItems.value = data.value.filter((item) =>
        item.roles.includes(companyRole.value)
      );
    }
    if (isFirst) {
      $apiFetch(`/users/${me.value.id}`, {
        method: "PATCH",
        body: {
          wizard_state: stepItems.value,
          last_wizard_state: 1,
        },
      });
    }
  }
};
watch(
  () => route.path,
  (newPath, oldPath) => {
    currentStep.value = newPath.split("/").pop() || 1;
    setTimeout(() => {
      if (!loadingProfile.value) {
        getProfile();
      }
    }, 100);
  }
);
</script>

<style scoped>
.vertical-stepper {
  position: relative;
}

.horizontal-stepper {
  position: relative;
  width: 100%;
  justify-content: center;
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
  height: 20px; /* Adjust height as needed */
  background-color: #bbb;
}

.stepper-line-active {
  background-color: #1560bd;
}

.stepper-text {
  white-space: nowrap;
}
</style>
