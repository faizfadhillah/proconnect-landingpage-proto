<template>
  <v-container class="pa-4">
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-row>
          <v-col cols="12" v-if="!isFillment">
            <h2>Licenses / Certificates</h2>
            <p class="text-grey mb-5">
              License / Certificates you had taken along your career journey
            </p>
          </v-col>
          <v-col cols="12">
            <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
              <v-row>
                <template
                  v-for="(l, index) in licenseHistory.items"
                  :key="index"
                >
                  <v-divider v-if="index > 0"></v-divider>
                  <v-col
                    cols="12"
                    :class="index % 2 == 0 ? '' : 'bg-grey-lighten-5'"
                  >
                    <v-row>
                      <v-col cols="12" v-if="index > 0">
                        <div class="d-flex align-center gap-2">
                          <h3>License {{ index + 1 }}</h3>
                          <VerifiedBadge :is-verified="l.is_verified" />
                        </div>
                      </v-col>
                      <v-col cols="12" v-else>
                        <div class="d-flex align-center gap-2">
                          <h3>License</h3>
                          <VerifiedBadge :is-verified="l.is_verified" />
                        </div>
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>License / Certificates Number</small>
                        </div>
                        <v-text-field
                          v-model="l.license_number"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Input license number here"
                          :error-messages="errors.license_number"
                          :rules="[
                            (v) =>
                              l.is_verified ||
                              !!v ||
                              'License number is required',
                          ]"
                          :readonly="l.is_verified"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>License / Certificates Name</small>
                        </div>
                        <v-text-field
                          v-model="l.license_name"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Name of certification"
                          :error-messages="errors.license_name"
                          :rules="[(v) => !!v || 'License name is required']"
                          :readonly="l.is_verified"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Issue Organization</small>
                        </div>
                        <v-text-field
                          v-model="l.issuing_organization"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Who issued this certificate?"
                          :error-messages="errors.issuing_organization"
                          :rules="[
                            (v) => !!v || 'Issuing organization is required',
                          ]"
                          :readonly="l.is_verified"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Issue Date</small>
                        </div>
                        <v-text-date
                          v-model="l.issue_date"
                          variant="outlined"
                          density="comfortable"
                          placeholder="When this certificate was issued"
                          :error-messages="errors.issue_date"
                          :rules="[
                            (v) =>
                              l.is_verified || !!v || 'Issue date is required',
                            (v) =>
                              !v || isValidDate(v) || 'Invalid date format',
                          ]"
                          :disabled="l.is_verified"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="pt-0">
                        <v-switch
                          v-model="l.no_expiry"
                          label="No Expiry?"
                          color="primary"
                          hide-details
                          density="comfortable"
                          :disabled="l.is_verified"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0" v-if="!l.no_expiry">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Expiry Date (optional)</small>
                        </div>
                        <v-text-date
                          v-model="l.expiry_date"
                          variant="outlined"
                          density="comfortable"
                          placeholder="When this certificate will expire"
                          :error-messages="errors.expiry_date"
                          :rules="[
                            (v) =>
                              !v || isValidDate(v) || 'Invalid date format',
                          ]"
                          :readonly="l.is_verified"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Description</small>
                        </div>
                        <v-textarea
                          v-model="l.description"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Describe your certification"
                          :error-messages="errors.description"
                          :readonly="l.is_verified"
                          rows="3"
                          rounded="lg"
                          auto-grow
                          style="
                            white-space: pre-wrap !important;
                            resize: vertical;
                          "
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Attachment (optional)</small>
                        </div>
                        <v-file-upload
                          v-model="l.file_url"
                          category="user_certificate"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Upload file (in PDF format)"
                          accept=".pdf,.jpg,.jpeg"
                          :error-messages="errors.file"
                          :disabled="l.is_verified"
                          rounded="lg"
                          :user-id="me.id"
                          class="mb-6"
                        />
                      </v-col>
                      <v-col cols="12" class="d-flex justify-end mb-3">
                        <v-btn
                          variant="outlined"
                          color="error"
                          size="small"
                          class="font-weight-bold"
                          :disabled="l.is_verified"
                          @click="removeLicense(index)"
                          >DELETE</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-col>
                </template>
              </v-row>

              <v-row>
                <v-col cols="12" class="my-5">
                  <v-btn
                    block
                    variant="outlined"
                    color="primary"
                    size="large"
                    rounded="lg"
                    prepend-icon="mdi-plus"
                    @click="addLicense"
                    class="font-weight-bold"
                    >ADD LICENSE/CERTIFICATE</v-btn
                  >
                </v-col>
                <v-col cols="12" class="mt-5 d-flex justify-space-between">
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
                        :loading="loading"
                      >
                        {{ route.query.edit || isFillment ? "Save" : "Next" }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
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
const snackbar = useSnackbarStore();
const form = ref(null);
const valid = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const { me, fetchMe } = useUser();

const licenseHistory = ref({
  items: [],
  loading: false,
});

const currentLicense = ref({
  user_id: me.value.id,
  license_number: "",
  license_name: "",
  issuing_organization: "",
  issue_date: "",
  no_expiry: false,
  expiry_date: null,
  description: "",
  file_url: null,
});

const errors = ref({
  license_number: "",
  license_name: "",
  issuing_organization: "",
  issue_date: "",
  expiry_date: "",
  description: "",
  file_url: "",
});

// Date picker menus
const issueDateMenu = ref(false);
const expiryDateMenu = ref(false);

// Format date for display
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Clear errors when input changes
watch(
  currentLicense,
  () => {
    errors.value = {
      license_number: "",
      license_name: "",
      issuing_organization: "",
      issue_date: "",
      expiry_date: null,
      description: "",
      file_url: "",
    };
  },
  { deep: true }
);

// Watch no_expiry to clear expiry_date
watch(
  () => currentLicense.value.no_expiry,
  (newValue) => {
    if (newValue) {
      currentLicense.value.expiry_date = null;
    }
  }
);

const loadingInitial = ref(false);
const fetchLicenses = async () => {
  loadingInitial.value = true;
  licenseHistory.value.loading = true;
  try {
    const response = await $apiFetch("/user-certificates/search", {
      params: {
        filters: {
          user_id: me.value.id,
        },
      },
    });
    licenseHistory.value.items = response.items;
    if (licenseHistory.value.items.length <= 0) {
      addLicense();
    }
  } catch (error) {
    console.error("Error fetching licenses:", error);
  } finally {
    licenseHistory.value.loading = false;
    loadingInitial.value = false;
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  await fetchLicenses();
});

const addLicense = () => {
  licenseHistory.value.items.push(
    JSON.parse(JSON.stringify(currentLicense.value))
  );
};

const removeLicenseIds = ref([]);
const removeLicenses = async () => {
  removeLicenseIds.value.forEach(async (id) => {
    await $apiFetch(`/user-certificates/${id}`, {
      method: "DELETE",
    });
  });
};

const dialog = useDialogStore();
const removeLicense = async (index) => {
  const license = licenseHistory.value.items[index];

  // Prevent deletion of verified license
  if (license.is_verified) {
    snackbar.showSnackbar({
      message: "Cannot delete verified license",
      color: "error",
    });
    return;
  }

  try {
    await dialog.openDialog({
      title: "Delete License",
      message: "Are you sure you want to delete this license?",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
    });

    const id = licenseHistory.value.items[index].id;
    if (id) {
      removeLicenseIds.value.push(id);
    }
    licenseHistory.value.items.splice(index, 1);
  } catch {
    console.log("Delete cancelled");
  }
};

const handleSubmit = async () => {
  const fillLicense = licenseHistory.value.items.filter(
    (license) => license.license_number || license.issuing_organization
  );
  if (fillLicense.length > 0) {
    const { valid, errors } = await form.value.validate();
    if (!valid) {
      return;
    }
  }

  loading.value = true;
  errors.value = {
    license_number: "",
    license_name: "",
    issuing_organization: "",
    issue_date: "",
    expiry_date: "",
    description: "",
    file_url: "",
  };

  try {
    // Save all licenses (exclude verified licenses)
    const licensesToSave = licenseHistory.value.items.filter(
      (license) => license.license_number && !license.is_verified
    );
    for (const license of licensesToSave) {
      const licenseData = {
        ...license,
        user_id: me.value.id,
      };

      if (license.id) {
        await $apiFetch(`/user-certificates/${license.id}`, {
          method: "PATCH",
          body: licenseData,
        });
      } else {
        await $apiFetch("/user-certificates", {
          method: "POST",
          body: licenseData,
        });
      }
    }

    if (removeLicenseIds.value.length > 0) {
      await removeLicenses();
    }
    const index = me.value.wizard_state.findIndex((item) => item.id == 4);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        licenseHistory.value.items.length > 0 ? 1 : 0;
    }
    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 4 ? me.value.last_wizard_state : 5,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to save license history";
    showErrorField(error.response?._data?.message);
  } finally {
    loading.value = false;
  }
};

const route = useRoute();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Licenses / Certificates updated successfully",
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
      path: "/admin/profile/candidate/5",
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
      path: "/admin/profile/candidate/3",
      query: route.query,
    });
  }
};

const showErrorField = (message) => {
  if (Array.isArray(message)) {
    message.forEach((msg) => {
      if (msg.includes("user_id")) {
        errors.value.user_id = "Invalid selection";
      }
      if (msg.includes("license_number")) {
        errors.value.license_number = "License number is required";
      }
      if (msg.includes("license_name")) {
        errors.value.license_name = "License name is required";
      }
      if (msg.includes("issuing_organization")) {
        errors.value.issuing_organization = "Issuing organization is required";
      }
      if (msg.includes("issue_date")) {
        errors.value.issue_date = "Issue date is required";
      }
      if (msg.includes("expiry_date")) {
        errors.value.expiry_date = "Expiry date is required";
      }
      if (msg.includes("description")) {
        errors.value.description = "Description is required";
      }
      if (msg.includes("file_url")) {
        errors.value.file_url = "File is required";
      }
    });
  }
};

const isValidDate = (date) => {
  const parsedDate = Date.parse(date);
  return !isNaN(parsedDate);
};
</script>

<style scoped>
.v-slide-group__content {
  align-items: stretch;
}

.text-truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
