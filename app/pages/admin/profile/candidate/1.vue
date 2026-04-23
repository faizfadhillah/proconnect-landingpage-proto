<template>
  <v-container class="pa-2">
    <v-row align="center" justify="center">
      <v-col cols="12">
        <v-card elevation="0" rounded="xl" class="pa-2">
          <v-card-text>
            <template v-if="!isFillment">
              <h2 class="mb-2">Personal Detail</h2>
              <p class="text-grey mb-8">Tell me about yourself</p>
            </template>
            <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
              <v-row>
                <v-col cols="12" class="mb-4">
                  <div class="d-flex">
                    <v-avatar rounded="lg" size="75" color="grey-lighten-2">
                      <v-img
                        v-if="postData.photo_url"
                        :src="`${
                          postData.photo_url.includes('http') ? '' : BASE_URL
                        }${postData.photo_url}`"
                      ></v-img>
                      <v-icon v-else size="70">mdi-account</v-icon>
                      <v-progress-circular
                        v-if="loadingAvatar"
                        indeterminate
                        color="blue"
                        style="
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                        "
                      ></v-progress-circular>
                    </v-avatar>
                    <div class="ml-4">
                      <v-btn
                        color="primary"
                        variant="outlined"
                        @click="triggerAvatarUpload"
                        class="font-weight-bold"
                        width="230"
                      >
                        Upload Photo
                      </v-btn>
                      <input
                        type="file"
                        ref="avatarInput"
                        accept="image/*"
                        style="display: none"
                        @change="handleAvatarUpload"
                      />
                      <p class="text-body-2 text-grey mt-4">
                        Size recommendation: 400 x 400px
                      </p>
                    </div>
                  </div>
                  <v-alert v-if="errorMessage" color="error" variant="outlined">
                    {{ errorMessage }}
                  </v-alert>
                </v-col>

                <v-col cols="12" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Full Name *</small>
                  </div>
                  <v-text-field
                    v-model="postData.full_name"
                    :rules="[(v) => !!v || 'Full name is required']"
                    placeholder="Input your full name here"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                  />
                </v-col>

                <v-col cols="12" sm="6" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Gender *</small>
                  </div>
                  <v-select
                    v-model="postData.gender"
                    placeholder="Select your gender"
                    :items="genders"
                    item-title="label"
                    item-value="name"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[(v) => !!v || 'Gender is required']"
                  />
                </v-col>

                <v-col cols="12" sm="6" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Date of Birth</small>
                  </div>
                  <v-text-date
                    v-model="postData.encrypted_date_of_birth"
                    type="date"
                    variant="outlined"
                    placeholder="Click to choose date"
                    density="comfortable"
                    rounded="lg"
                  />
                </v-col>

                <v-col cols="12" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Email</small>
                  </div>
                  <v-text-field
                    v-model="postData.email"
                    placeholder="Input your email here"
                    type="email"
                    :disabled="true"
                    variant="outlined"
                    density="comfortable"
                    :rules="[(v) => !!v || 'Email is required']"
                    rounded="lg"
                  />
                </v-col>

                <v-col cols="12" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Phone Number *</small>
                  </div>
                  <v-phone-field
                    v-model="postData.phone"
                    type="tel"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Input phone number"
                    :rules="[
                      (v) => !!v || 'Phone number is required',
                      (v) =>
                        /^[0-9]{1,}$/.test(v) || 'Phone must be numbers only',
                    ]"
                    hide-details="auto"
                  >
                  </v-phone-field>
                </v-col>

                <v-col cols="12">
                  <v-switch
                    v-model="postData.is_outside_indo"
                    label="Outside Indonesia?"
                    color="primary"
                    hide-details
                  />
                </v-col>

                <template v-if="!postData.is_outside_indo">
                  <v-col cols="12" class="py-0">
                    <div class="text-grey-darken-2 mb-1">
                      <small>City *</small>
                    </div>
                    <v-autocomplete
                      v-model="postData.region_id"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Insert 3 characters or more to search"
                      :items="regions"
                      item-title="name"
                      item-value="id"
                      :loading="regionLoading"
                      :search-input.sync="citySearch"
                      :rules="[
                        (v) =>
                          postData.is_outside_indo || !!v || 'City is required',
                      ]"
                      @update:search="searchCities"
                      rounded="lg"
                    />
                  </v-col>
                </template>
                <template v-else>
                  <v-col cols="12" class="py-0">
                    <div class="text-grey-darken-2 mb-1">
                      <small>Country *</small>
                    </div>
                    <v-text-field
                      v-model="postData.other_country"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Input country"
                      :rules="[
                        (v) =>
                          !postData.is_outside_indo ||
                          !!v ||
                          'Country is required',
                      ]"
                      rounded="lg"
                    />
                  </v-col>
                  <v-col cols="12" class="py-0">
                    <div class="text-grey-darken-2 mb-1">
                      <small>City *</small>
                    </div>
                    <v-text-field
                      v-model="postData.other_region"
                      variant="outlined"
                      density="comfortable"
                      placeholder="Input city"
                      :rules="[
                        (v) =>
                          !postData.is_outside_indo ||
                          !!v ||
                          'City is required',
                      ]"
                      rounded="lg"
                    />
                  </v-col>
                </template>

                <v-col cols="12" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Postal Code</small>
                  </div>
                  <v-text-field
                    v-model="postData.postal_code"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Input postal code"
                    rounded="lg"
                  />
                </v-col>

                <v-col cols="12" class="py-0">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Address *</small>
                  </div>
                  <v-textarea
                    v-model="postData.encrypted_address"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Input your full address"
                    rows="3"
                    rounded="lg"
                    :hint="`${
                      255 - (postData.encrypted_address?.length || 0)
                    } characters remaining`"
                    :rules="[
                      (v) => !!v || 'Address is required',
                      (v) =>
                        v.length <= 255 || 'Maximum 255 characters allowed',
                    ]"
                    auto-grow
                    style="white-space: pre-wrap !important; resize: vertical"
                  />
                </v-col>

                <v-col cols="12">
                  <div class="text-grey-darken-2 mb-1">
                    <small>Resume (optional)</small>
                  </div>
                  <v-file-upload
                    placeholder="Upload Resume File (max size 5 MB)"
                    v-model="userFile.file_url"
                    category="user_resume"
                    accept=".pdf,.doc,.docx"
                    class="mb-4"
                    :user-id="me.id"
                  />
                </v-col>
              </v-row>

              <v-row class="mt-10">
                <v-col cols="4">
                  <v-btn
                    v-if="!isFillment"
                    variant="outlined"
                    color="primary"
                    size="large"
                    rounded="lg"
                    block
                    @click="handleBack"
                  >
                    Back
                  </v-btn>
                </v-col>
                <v-col cols="4"> </v-col>
                <v-col cols="4">
                  <v-btn
                    color="primary"
                    size="large"
                    type="submit"
                    :loading="loading"
                    block
                    rounded="lg"
                  >
                    {{ route.query.edit || isFillment ? "Save" : "Next" }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      <v-dialog
        v-model="loadingInitial"
        persistent
        width="auto"
        max-width="200"
      >
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
    </v-row>
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

const router = useRouter();
const loading = ref(false);
const valid = ref(false);
const form = ref(null);
const avatar = ref(null);
const avatarInput = ref(null);
const { $apiFetch } = useApi();
const { me, fetchMe } = useUser();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const errorMessage = ref("");
const citySearch = ref("");

const postData = ref({
  full_name: "",
  gender: "",
  date_of_birth: "",
  email: "",
  encrypted_phone: "",
  encrypted_address: "",
  encrypted_date_of_birth: "",
  encrypted_nik: "",
  photo_url: "",
  is_outside_indo: false,
  region_id: "",
  other_country: "",
  other_region: "",
  postal_code: "",
});

const phoneNumber = ref("");

const selectedCountryCode = ref({
  name: "Indonesia",
  dial_code: "+62",
  code: "ID",
  flag: "🇮🇩",
});

const countryCodes = [
  { name: "Indonesia", dial_code: "+62", code: "ID", flag: "🇮🇩" },
  { name: "Malaysia", dial_code: "+60", code: "MY", flag: "🇲🇾" },
  { name: "Singapore", dial_code: "+65", code: "SG", flag: "🇸🇬" },
  { name: "Thailand", dial_code: "+66", code: "TH", flag: "🇹🇭" },
  { name: "Vietnam", dial_code: "+84", code: "VN", flag: "🇻🇳" },
  { name: "Philippines", dial_code: "+63", code: "PH", flag: "🇵🇭" },
  { name: "Brunei", dial_code: "+673", code: "BN", flag: "🇧🇳" },
  { name: "Cambodia", dial_code: "+855", code: "KH", flag: "🇰🇭" },
  { name: "Laos", dial_code: "+856", code: "LA", flag: "🇱🇦" },
  { name: "Myanmar", dial_code: "+95", code: "MM", flag: "🇲🇲" },
  // Add more country codes as needed
];

const genders = ref([]);

const fetchGenders = async () => {
  const response = await $apiFetch("/configs/key/gender");
  genders.value = response.value;
};

const triggerAvatarUpload = () => {
  avatarInput.value.click();
};

const loadingAvatar = ref(false);
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    loadingAvatar.value = true;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "profileImage");

      const postMediaResponse = await $apiFetch("/media", {
        method: "POST",
        body: formData,
      });

      postData.value.photo_url = postMediaResponse.path;
    } catch (error) {
      errorMessage.value =
        error.message || "An error occurred while uploading the file";
      if (avatarInput.value) {
        avatarInput.value.value = "";
      }
    } finally {
      loadingAvatar.value = false;
    }
  }
};

const resumeInput = ref(null);
const triggerResumeUpload = () => {
  resumeInput.value.click();
};

const loadingInitial = ref(true);
const fetchUser = async () => {
  try {
    await fetchMe(true);

    let user = me.value;

    Object.assign(postData.value, user);
    if (postData.value.region_id) {
      fetchRegions(postData.value.region_id, "id");
    }
    if (postData.value.encrypted_phone) {
      postData.value.phone = postData.value.encrypted_phone;
    }
    if (
      Array.isArray(postData.value.wizard_state) &&
      postData.value.wizard_state.length > 0
    ) {
      wizardState.value = postData.value.wizard_state;
    } else {
      fetchWizardState();
    }
    fetchUserFiles();
  } catch (error) {
    console.log(error);
  } finally {
    loadingInitial.value = false;
  }
};

const userFile = ref({
  id: null,
  file_name: null,
  file_url: null,
});
const loadingUserFile = ref(false);
const fetchUserFiles = async () => {
  loadingUserFile.value = true;
  const response = await $apiFetch("/user-files/search", {
    method: "GET",
    params: {
      filters: {
        user_id: me.value.id,
        file_url: "resume",
      },
      sortBy: {
        created_at: "DESC",
      },
    },
  });

  Object.assign(userFile.value, response.items[0]);
  loadingUserFile.value = false;
};

const wizardState = ref([]);
const fetchWizardState = async () => {
  const response = await $apiFetch("/configs/key/list_of_wizard_candidate");
  wizardState.value = response.value;
};

const dialog = useDialogStore();
const handleBack = async () => {
  try {
    await dialog.openDialog({
      title: "Are you sure?",
      message: "Are you sure you want to leave this page?",
      confirmButtonText: "Yes",
      cancelButtonText: "No",
      confirmButtonColor: "error",
      cancelButtonColor: "grey-darken-1",
    });
    if (route.query.edit) {
      router.replace("/admin/profile");
    } else {
      const authRoutes = ["/login", "/signup", "/signup-verify-otp"];
      const previousPath = router.options.history.state.back;

      if (
        previousPath &&
        previousPath != "/" &&
        !authRoutes.includes(previousPath)
      ) {
        router.back();
      }
      router.replace("/admin/profile/choose-role");
    }
  } catch (error) {
    console.error("Error back:", error);
  }
};

const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }
  loading.value = true;
  const index = wizardState.value.findIndex((item) => item.id == 1);
  if (index !== -1) {
    wizardState.value[index].state = parseInt(1);
  }
  postData.value.wizard_state = wizardState.value;
  postData.value.last_wizard_state =
    postData.value.last_wizard_state > 1 ? postData.value.last_wizard_state : 2;
  postData.value.encrypted_phone = postData.value.phone;

  try {
    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: postData.value,
    });
    await $apiFetch(`/encrypted-user-data/${me.value.id}`, {
      method: "PATCH",
      body: {
        encrypted_phone: postData.value.encrypted_phone,
        encrypted_address: postData.value.encrypted_address,
        encrypted_date_of_birth: postData.value.encrypted_date_of_birth,
        encrypted_nik: postData.value.encrypted_nik,
      },
    });
    if (userFile.value.id && !userFile.value.file_url) {
      $apiFetch(`/user-files/${userFile.value.id}`, {
        method: "DELETE",
      });
    }

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to update profile";
  } finally {
    loading.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Profile updated successfully",
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
      path: "/admin/profile/candidate/2",
      query: route.query,
    });
  }
};

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

watch(
  () => postData.value.is_outside_indo,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
    if (newVal === true && oldVal === false) {
      postData.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      postData.value.other_country = null;
      postData.value.other_region = null;
    }
  }
);

// Watch for changes in phone number and country code
watch(
  [() => phoneNumber.value, selectedCountryCode],
  ([newPhone, newCountryCode]) => {
    if (newPhone && !newPhone.startsWith("+")) {
      postData.value.encrypted_phone = `${newCountryCode.dial_code} ${newPhone}`;
    }
  },
  { deep: true }
);

onMounted(async () => {
  fetchGenders();
  await fetchUser();
});
</script>

<style scoped>
.country-code-select {
  max-width: 120px;
}
</style>
