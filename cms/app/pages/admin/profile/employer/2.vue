<template>
  <v-container class="pa-2">
    <v-card elevation="0" rounded="xl" class="pa-2">
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12">
              <h2 class="mb-1">
                {{
                  me.company_role == "owner"
                    ? "Company Representative Info"
                    : "Profile Info"
                }}
              </h2>
              <p class="text-grey mb-3">
                Provide your information as the company's point of contact
              </p>
            </v-col>
            <v-col cols="12" class="mb-4">
              <div class="d-flex">
                <v-avatar rounded="lg" size="75" color="grey-lighten-2">
                  <v-img
                    v-if="pic.photo_url"
                    :src="`${pic.photo_url.includes('http') ? '' : BASE_URL}${
                      pic.photo_url
                    }`"
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
                <div class="ml-4" v-if="canEditCompanyRep">
                  <v-btn
                    color="primary"
                    variant="outlined"
                    @click="triggerAvatarUpload"
                    :loading="loadingAvatar"
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
            <v-col cols="12">
              <div>
                <div class="mb-1 text-grey-darken-2">
                  <small>Full Name *</small>
                </div>
                <v-text-field
                  v-model="pic.full_name"
                  placeholder="Input your full name, Please use formal name"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.full_name"
                  :rules="[(v) => !!v || 'Full name is required']"
                  :readonly="!canEditCompanyRep"
                  :disabled="!canEditCompanyRep"
                ></v-text-field>
              </div>

              <div>
                <div class="mb-1 text-grey-darken-2">
                  <small>Gender*</small>
                </div>
                <v-select
                  v-model="pic.gender"
                  :items="genders"
                  placeholder="Choose Gender"
                  item-title="label"
                  item-value="name"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.gender"
                  :rules="[(v) => !!v || 'Gender is required']"
                  rounded="lg"
                  :readonly="!canEditCompanyRep"
                  :disabled="!canEditCompanyRep"
                ></v-select>
              </div>

              <div>
                <div class="mb-1 text-grey-darken-2">
                  <small>Date of Birth *</small>
                </div>
                <v-text-date
                  v-model="pic.encrypted_date_of_birth"
                  placeholder="Click to show calendar"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.birth_date"
                  rounded="lg"
                  :max="maxDate"
                  :rules="[
                    (v) => !!v || 'Date of birth is required',
                    (v) => {
                      if (!v) return true;
                      return (
                        v <= maxDate || 'Date of birth cannot be in the future'
                      );
                    },
                  ]"
                  :readonly="!canEditCompanyRep"
                  :disabled="!canEditCompanyRep"
                ></v-text-date>
              </div>

              <div>
                <div class="mb-1 text-grey-darken-2"><small>Email</small></div>
                <v-text-field
                  v-model="pic.email"
                  placeholder="me@usermail.com"
                  variant="outlined"
                  density="comfortable"
                  disabled
                  rounded="lg"
                  :rules="[(v) => !!v || 'Email is required']"
                ></v-text-field>
              </div>

              <div>
                <div class="mb-1 text-grey-darken-2">
                  <small>Phone Number *</small>
                </div>
                <v-phone-field
                  v-model="pic.encrypted_phone"
                  :phone-number="phoneNumber"
                  @update:phone-number="phoneNumber = $event"
                  :error-messages="errors.phone"
                  default-country="ID"
                  type="tel"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Input phone number"
                  :rules="[
                    (v) => !!v || 'Phone number is required',
                    (v) =>
                      /^[0-9]{1,}$/.test(v) || 'Phone must be numbers only',
                  ]"
                  :isSignup="false"
                  :readonly="!canEditCompanyRep"
                  :disabled="!canEditCompanyRep"
                />
              </div>

              <div class="mb-2">
                <v-switch
                  v-model="pic.is_outside_indo"
                  label="Outside Indonesia?"
                  color="primary"
                  density="comfortable"
                  rounded="lg"
                  hide-details
                />
              </div>

              <template v-if="!pic.is_outside_indo">
                <div>
                  <div class="mb-1 text-grey-darken-2">
                    <small>City *</small>
                  </div>
                  <v-autocomplete
                    v-model="pic.region_id"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Insert 3 characters or more to search"
                    :items="regions"
                    item-title="name"
                    item-value="id"
                    :loading="regionLoading"
                    :search-input.sync="citySearch"
                    @update:search="searchCities"
                    :rules="[(v) => !!v || 'City is required']"
                    rounded="lg"
                    :readonly="!canEditCompanyRep"
                    :disabled="!canEditCompanyRep"
                  />
                </div>
              </template>
              <template v-else>
                <div>
                  <div class="mb-1 text-grey-darken-2">
                    <small>Country *</small>
                  </div>
                  <v-text-field
                    v-model="pic.other_country"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Input country"
                    rounded="lg"
                    :rules="[(v) => !!v || 'Country is required']"
                    :readonly="!canEditCompanyRep"
                    :disabled="!canEditCompanyRep"
                  />
                </div>
                <div>
                  <div class="mb-1 text-grey-darken-2">
                    <small>City *</small>
                  </div>
                  <v-text-field
                    v-model="pic.other_region"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Input city"
                    rounded="lg"
                    :rules="[(v) => !!v || 'City is required']"
                    :readonly="!canEditCompanyRep"
                    :disabled="!canEditCompanyRep"
                  />
                </div>
              </template>

              <div>
                <div class="mb-1 text-grey-darken-2">
                  <small>Postal Code *</small>
                </div>
                <v-text-field
                  v-model="pic.postal_code"
                  placeholder="Input your postal code"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="errors.postal_code"
                  :rules="[(v) => !!v || 'Postal code is required']"
                  rounded="lg"
                  :readonly="!canEditCompanyRep"
                  :disabled="!canEditCompanyRep"
                ></v-text-field>
              </div>

              <div>
                <div class="mb-1 text-grey-darken-2">
                  <small>Address</small>
                </div>
                <v-textarea
                  v-model="pic.encrypted_address"
                  placeholder="Please state your address"
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  :error-messages="errors.address"
                  rounded="lg"
                  :hint="`${
                    255 - (pic.encrypted_address?.length || 0)
                  } characters remaining`"
                  :rules="[
                    (v) =>
                      !v || v.length <= 255 || 'Maximum 255 characters allowed',
                  ]"
                  auto-grow
                  style="white-space: pre-wrap !important; resize: vertical"
                  :readonly="!canEditCompanyRep"
                  :disabled="!canEditCompanyRep"
                ></v-textarea>
              </div>

              <v-alert
                v-if="errorMessage"
                v-model="errorMessage"
                color="error"
                density="compact"
                class="mb-4"
              >
                {{ errorMessage }}
              </v-alert>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-btn
                block
                color="primary"
                class="mb-4"
                size="large"
                rounded="lg"
                variant="outlined"
                @click="handleBack"
                :disabled="me.last_wizard_state > 2"
              >
                Back
              </v-btn>
            </v-col>
            <v-col cols="4"></v-col>
            <v-col cols="4" v-if="canEditCompanyRep">
              <v-btn
                block
                color="primary"
                size="large"
                rounded="lg"
                type="submit"
                :loading="loadingSubmit"
              >
                {{ route.query.edit ? "Save" : "Next" }}
              </v-btn>
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
definePageMeta({ ssr: false, layout: "wizard-employer", middleware: ["auth"] });
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const { $apiFetch } = useApi();
const router = useRouter();
const { me, fetchMe } = useUser();

// Permission checks
const { canAccessProfileSection } = usePermissions();
const canEditCompanyRep = computed(
  () =>
    canAccessProfileSection("comp_rep", "edit") ||
    me.value.company_role == "owner_hq" ||
    me.value.company_role == "owner"
);
const canViewCompanyRep = computed(
  () =>
    canAccessProfileSection("comp_rep", "view") ||
    me.value.company_role == "owner_hq" ||
    me.value.company_role == "owner"
);

const fetchUser = async () => {
  loadingInitial.value = true;
  if (!me.value.id) {
    await fetchMe();
  }

  const memberDetail = await $apiFetch("/mst-companies/member-detail", {
    params: {
      user_id: me.value.id,
      company_hq_id: me.value.company_id,
    },
  });
  delete memberDetail.roles;
  Object.assign(me.value, memberDetail);
  Object.assign(pic.value, memberDetail);
  loadingInitial.value = false;
  if (pic.value.region_id) {
    fetchRegions(pic.value.region_id, "id");
  }
};

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

watch(
  [() => phoneNumber.value, selectedCountryCode],
  ([newPhone, newCountryCode]) => {
    if (newPhone && !newPhone.startsWith("+")) {
      pic.value.encrypted_phone = `${newCountryCode.dial_code} ${newPhone}`;
    }
  },
  { deep: true }
);
// States
const form = ref(null);
const pic = ref({
  full_name: "",
  email: me.value.email,
  is_outside_indo: false,
  city_id: null,
  postal_code: "",
  gender: "",
  company_role: "",
  encrypted_address: "",
  encrypted_date_of_birth: "",
  encrypted_nik: "",
  encrypted_phone: "",
});

const errors = ref({});
const loading = ref(false);

// Data
const cities = ref([]);
const roles = ref([
  { label: "HRD", name: "hrd" },
  { label: "Owner", name: "owner" },
]);

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

const avatarInput = ref(null);
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

      pic.value.photo_url = postMediaResponse.path;
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

watch(
  () => pic.value.is_outside_indo,
  (newVal, oldVal) => {
    if (newVal === true && oldVal === false) {
      pic.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      pic.value.other_country = null;
      pic.value.other_region = null;
    }
  }
);

// Methods

const valid = ref(false);
const errorMessage = ref("");
const loadingSubmit = ref(false);

// Max date for date of birth (today)
const maxDate = computed(() => new Date().toISOString().slice(0, 10));
const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  // Show confirmation dialog
  if (!route.query.edit) {
    try {
      const confirmed = await dialog.openDialog({
        title: "Confirm Submission",
        message:
          "By clicking submit, you will no longer be able to change your role from company to candidate. Are you sure you want to proceed?",
        confirmButtonText: "Yes, Submit",
        cancelButtonText: "Cancel",
        confirmButtonColor: "primary",
        cancelButtonColor: "grey-darken-1",
      });

      if (!confirmed) {
        return;
      }
    } catch (error) {
      // User cancelled
      return;
    }
  }
  loadingSubmit.value = true;
  try {
    const index = pic.value.wizard_state.findIndex((item) => item.id == 2);
    if (index !== -1) {
      pic.value.wizard_state[index].state = 1;
    }
    pic.value.last_wizard_state =
      pic.value.last_wizard_state > 2 ? pic.value.last_wizard_state : 3;

    const body = pic.value;
    body.assignments =
      Array.isArray(me.value.assignments) && me.value.assignments.length
        ? me.value.assignments
        : me.value.roles?.[0]?.assignment
        ? [me.value.roles?.[0]?.assignment]
        : [
            {
              user_id: me.value.id,
              company_id: me.value.company_id,
              company_hq_id: me.value.company_id,
              company_role: "owner_hq",
              role: "employer",
              status: "active",
            },
          ];
    body.assignments = body.assignments.map((assignment) => ({
      ...assignment,
      user_id: me.value.id,
      company_id: assignment.company_id || me.value.company_id,
      company_hq_id: assignment.company_hq_id || me.value.company_id,
      company_role: "owner_hq",
      role: "employer",
    }));

    await $apiFetch(`/mst-companies/upsert-member`, {
      method: "POST",
      body,
    });
    $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        wizard_state: body.wizard_state,
        last_wizard_state: body.last_wizard_state,
      },
    });
    me.value.last_wizard_state = body.last_wizard_state;
    me.value.wizard_state = body.wizard_state;
    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to update profile";
  } finally {
    loadingSubmit.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const dialog = useDialogStore();
const handleNext = () => {
  if (route.query.edit) {
    snackbar.showSnackbar({
      message: "Profile updated successfully",
      color: "success",
    });

    const authRoutes = ["/admin/dashboard"];
    const previousPath = router.options.history.state.back;

    if (previousPath && authRoutes.includes(previousPath)) {
      router.back();
    } else {
      router.replace("/admin/profile");
    }
  } else {
    router.push({
      path: "/admin/profile/employer/3",
      query: route.query,
    });
  }
};

const handleBack = () => {
  if (route.query.edit) {
    router.back();
  } else {
    router.replace({
      path: "/admin/profile/employer/1",
      query: route.query,
    });
  }
};

const genders = ref([]);

const fetchGenders = async () => {
  const response = await $apiFetch("/configs/key/gender");
  genders.value = response.value;
};

const loadingInitial = ref(false);
const citySearch = ref("");

onMounted(async () => {
  await fetchUser();
  fetchGenders();
});
</script>
