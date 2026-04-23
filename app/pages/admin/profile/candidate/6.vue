<template>
  <v-container>
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-form v-model="valid" ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" v-if="!isFillment">
              <h2 class="mb-2">Work Preferences</h2>
              <p class="text-grey mb-5">
                Tell us about your working arrangements preferences, employment
                types and when you're available to start.
              </p>
            </v-col>
            <v-col cols="12" class="py-0">
              <div class="mb-2">
                <h4 class="font-weight-medium">Availability</h4>
                <small class="text-grey">
                  Let us know when you're available to start
                </small>
              </div>
              <v-select
                v-model="me.availability"
                :items="availabilityStatuses"
                item-title="label"
                item-value="name"
                rounded="lg"
                variant="outlined"
                density="comfortable"
                placeholder="Choose one from the list"
                clearable
              ></v-select>
            </v-col>
            <v-col cols="12">
              <div class="mb-2">
                <h4 class="font-weight-medium">Employment Types</h4>
                <small class="text-grey">
                  Choose the type of work you're open to
                </small>
              </div>
              <div v-for="status in employmentStatuses" :key="status.id">
                <v-checkbox
                  v-model="currentEmploymentStatus"
                  :value="status.name"
                  color="primary"
                  hide-details
                  class="ma-0 shrink"
                  :label="status.label"
                  density="comfortable"
                ></v-checkbox>
                <div
                  style="
                    border-bottom: 1px dashed rgba(0, 0, 0, 0.12);
                    height: 1px;
                  "
                ></div>
              </div>
            </v-col>
            <v-col cols="12">
              <div class="mb-2">
                <h4 class="font-weight-medium">
                  Working Arrangement Preferences
                </h4>
                <small class="text-grey">
                  Choose the your preferred work setup
                </small>
              </div>
              <v-row>
                <v-col
                  cols="6"
                  sm="4"
                  v-for="status in domicileStatuses"
                  :key="status.name"
                >
                  <v-checkbox
                    v-model="currentDomicileStatus"
                    :value="status.name"
                    color="primary"
                    :label="status.label"
                    density="comfortable"
                    class="ma-0 shrink"
                    hide-details
                  ></v-checkbox>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" class="mt-4 d-flex justify-space-between">
              <v-row>
                <v-col cols="4">
                  <v-btn
                    v-if="!isFillment"
                    block
                    color="primary"
                    class="mb-4"
                    size="large"
                    rounded="lg"
                    variant="outlined"
                    @click="handleBack"
                  >
                    Back
                  </v-btn>
                </v-col>
                <v-col cols="4"></v-col>
                <v-col cols="4">
                  <v-btn
                    block
                    color="primary"
                    size="large"
                    rounded="lg"
                    type="submit"
                    :loading="loadingSubmit"
                  >
                    {{ route.query.edit || isFillment ? "Save" : "Next" }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
    <!-- Header -->

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
definePageMeta({
  ssr: false,
  layout: "wizard-candidate",
  middleware: ["auth"],
});

const props = defineProps({
  isFillment: {
    type: Boolean,
    default: false,
  },
});

const { $apiFetch } = useApi();
const router = useRouter();
const loading = ref(false);
const showError = ref(false);
const showValidationError = ref(false);
const { me, fetchMe } = useUser();
const currentEmploymentStatus = ref([]);
const currentDomicileStatus = ref([]);
const errorMessage = ref("Please select at least one employment status");

const loadingInitial = ref(true);
const availabilityStatuses = ref([]);
const fetchAvailabilityStatuses = async () => {
  const response = await $apiFetch("/configs/key/availibility");
  availabilityStatuses.value = response.value;
};
const employmentStatuses = ref([]);
const fetchEmploymentStatuses = async () => {
  const response = await $apiFetch("/configs/key/employment_status");
  employmentStatuses.value = response.value;
};
const domicileStatuses = ref([]);
const fetchDomicileStatuses = async () => {
  loadingInitial.value = true;
  const response = await $apiFetch("/configs/key/domicile_status");
  domicileStatuses.value = response.value;
  loadingInitial.value = false;
};
watch(currentEmploymentStatus, (newVal) => {
  me.value.employment_status = newVal.join(",");
});
watch(currentDomicileStatus, (newVal) => {
  me.value.domicile_status = newVal.join(",");
});

const form = ref(null);
const valid = ref(false);
const loadingSubmit = ref(false);
const handleSubmit = async () => {
  const { valid, errors } = await form.value.validate();
  if (!valid) {
    console.log(errors);
    return;
  }

  loadingSubmit.value = true;
  try {
    const index = me.value.wizard_state.findIndex((item) => item.id == 6);
    if (index !== -1) {
      if (
        me.value.availability ||
        me.value.employment_status ||
        me.value.domicile_status
      ) {
        me.value.wizard_state[index].state = 1;
      } else {
        me.value.wizard_state[index].state = 0;
      }
    }

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 6 ? me.value.last_wizard_state : 7,
        wizard_state: me.value.wizard_state,
        availability: me.value.availability,
        employment_status: me.value.employment_status,
        domicile_status: me.value.domicile_status,
      },
    });

    handleNext();
  } catch (error) {
    console.error("Error saving employment status:", error);
    errorMessage.value = "Failed to save employment status";
    showError.value = true;
  } finally {
    loadingSubmit.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Work preferences updated successfully",
    color: "success",
  });
  if (props.isFillment) {
    router.back();
    return;
  }
  if (route.query.edit) {
    const authRoutes = ["/admin/dashboard"];
    const previousPath = router.options.history.state.back;

    if (previousPath && authRoutes.includes(previousPath)) {
      router.back();
    } else {
      router.replace("/admin/profile");
    }
  } else {
    router.push({
      path: "/admin/profile/candidate/7",
      query: route.query,
    });
  }
};

const handleBack = () => {
  if (route.query.edit) {
    router.back();
  } else {
    const authRoutes = ["/login", "/signup", "/signup-verify-otp"];
    const previousPath = router.options.history.state.back;

    if (previousPath && !authRoutes.includes(previousPath)) {
      router.back();
    }
    router.replace({
      path: "/admin/profile/candidate/5",
      query: route.query,
    });
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchEmploymentStatuses();
  fetchAvailabilityStatuses();
  await fetchDomicileStatuses();
  currentEmploymentStatus.value = me.value.employment_status
    ? me.value.employment_status.split(",")
    : [];
  currentDomicileStatus.value = me.value.domicile_status
    ? me.value.domicile_status.split(",")
    : [];
});
</script>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px);
}

.text-error {
  color: rgb(var(--v-theme-error));
}

.cursor-pointer {
  cursor: pointer;
}

.v-checkbox {
  margin-bottom: 0;
}
</style>
