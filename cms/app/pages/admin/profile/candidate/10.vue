<template>
  <v-container>
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" v-if="!isFillment">
              <h2 class="mb-2">Skill Passport (MRA-TP Standard)</h2>
              <p class="text-grey mb-5">
                Do you have Skill Passport (MRA-TP Standard)?
              </p>
            </v-col>
            <v-col cols="12">
              <!-- ASEAN Skill Passport Number -->
              <div class="mb-2">
                <div class="text-grey-darken-2 mb-1">
                  <small>Skill Passport Number</small>
                </div>
                <v-text-field
                  v-model="passport.number"
                  placeholder="Input your ID number for ASEAN Skill Passport"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.number"
                  @update:model-value="validateNumber"
                  rounded="lg"
                  :rules="[
                    (v) =>
                      !passport.file_url ||
                      !!v ||
                      'ASEAN Skill Passport Number is required when uploading passport file',
                  ]"
                ></v-text-field>
              </div>

              <div class="mb-5">
                <div class="text-grey-darken-2 mb-1">
                  <small>Upload your Skill Passport</small>
                </div>
                <v-file-upload
                  v-model="passport.file_url"
                  category="user_skill_passport"
                  placeholder="Upload your ASEAN Skill Passport (in PDF format or JPEG format)"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :user-id="me.id"
                  accept=".pdf,.jpg,.jpeg,.png"
                ></v-file-upload>
              </div>

              <!-- Status Section -->
              <div class="mb-4">
                <v-alert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  closable
                  class="mb-4"
                >
                  {{ errorMessage }}
                </v-alert>

                <div class="text-grey-darken-2 mb-1">
                  <small>Status</small>
                </div>
                <v-sheet
                  class="pa-3 bg-grey-lighten-3"
                  height="48"
                  rounded="lg"
                >
                  {{ passport.status }}
                </v-sheet>
              </div>
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
                    {{ isFillment ? "Save" : "Submit" }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
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
const loading = ref(false);
const { me, fetchMe } = useUser();

const passport = ref({
  user_id: me.value.id,
  number: null,
  file_url: null,
  status: "UNVERIFIED",
});

const uploadedFile = ref(null);
const errorMessage = ref("");

const errors = ref({
  number: "",
  file: "",
});

const validateNumber = (value) => {
  errors.value.number = "";

  if (!value) {
    errors.value.number = "ASEAN Skill Passport Number is required";
    return false;
  }

  if (value.length < 5) {
    errors.value.number = "Number must be at least 5 characters";
    return false;
  }

  return true;
};

const validateFile = (file) => {
  errors.value.file = "";

  if (!file && !passport.value.file_url) {
    errors.value.file = "Skill passport file is required";
    return false;
  }

  if (file && !file.name.toLowerCase().endsWith(".pdf")) {
    errors.value.file = "Only PDF files are allowed";
    return false;
  }

  if (file && file.size > 5 * 1024 * 1024) {
    // 5MB limit
    errors.value.file = "File size should not exceed 5MB";
    return false;
  }

  return true;
};

const form = ref(null);
const handleSubmit = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    return;
  }
  // Validate all fields
  if (passport.value.file_url || passport.value.number) {
    const isNumberValid = validateNumber(passport.value.number);
    const isFileValid = validateFile();

    if (!isNumberValid || !isFileValid) {
      return;
    }
  }

  loading.value = true;
  try {
    if (passport.value.id) {
      await $apiFetch(`/user-skill-passports/${passport.value.id}`, {
        method: "PATCH",
        body: passport.value,
      });
    } else {
      await $apiFetch("/user-skill-passports", {
        method: "POST",
        body: passport.value,
      });
    }

    const index = me.value.wizard_state.findIndex((item) => item.id == 10);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        passport.value.file_url || passport.value.number ? 1 : 0;
    }

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 10 ? me.value.last_wizard_state : 11,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    console.error("Error saving ASEAN passport:", error);
    if (error.response?._data?.message) {
      // Handle specific API validation errors
      const apiErrors = error.response._data.message;
      if (typeof apiErrors === "object") {
        Object.keys(apiErrors).forEach((key) => {
          errors.value[key] = apiErrors[key];
        });
      } else {
        errors.value.number = apiErrors;
      }
    } else {
      errors.value.number = error.message || "An error occurred while saving";
    }
  } finally {
    loading.value = false;
  }
};

// Watch for changes to clear errors
watch(
  () => passport.value.number,
  () => {
    errors.value.number = "";
  }
);

watch(
  () => uploadedFile.value,
  () => {
    errors.value.file = "";
  }
);

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "ASEAN Skill Passport updated successfully",
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
    router.push("/admin/dashboard");
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
      path: "/admin/profile/candidate/9",
      query: route.query,
    });
  }
};

const loadingInitial = ref(false);
const fetchASEANPassport = async () => {
  loadingInitial.value = true;
  try {
    const response = await $apiFetch("/user-skill-passports/search", {
      params: {
        filters: {
          user_id: me.value.id,
        },
      },
    });

    if (response.items.length > 0) {
      Object.assign(passport.value, response.items[0]);
    }
  } catch (error) {
    console.error("Error fetching ASEAN passport:", error);
  } finally {
    loadingInitial.value = false;
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  await fetchASEANPassport();
});
</script>

<style scoped>
.fill-height {
  min-height: calc(100vh - 64px);
}

.v-text-field,
.v-file-input {
  border-radius: 8px;
}

:deep(.v-file-input .v-field__append-inner) {
  padding-inline-start: 0px;
}
</style>
