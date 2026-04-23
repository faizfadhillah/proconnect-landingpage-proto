<template>
  <v-container class="pa-2">
    <v-card elevation="0" rounded="xl" class="pa-2">
      <v-card-text>
        <v-form v-model="valid" ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12">
              <h2 class="mb-2">Business Profile Details</h2>
              <p class="text-grey mb-5">
                Tell us about your company so we can set up your business
                profile
              </p>
            </v-col>
            <v-col cols="12">
              <div class="text-grey-darken-2 mb-1">
                <small>Company Logo *</small>
              </div>
              <div class="d-flex">
                <v-avatar rounded="lg" size="75" color="grey-lighten-2">
                  <v-img
                    v-if="company.logo_url"
                    :src="`${
                      company.logo_url.includes('http') ? '' : BASE_URL
                    }${company.logo_url}`"
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
                    :loading="uploadingLogo"
                    width="230"
                  >
                    Upload Photo
                  </v-btn>
                  <input
                    type="file"
                    ref="avatarInput"
                    accept="image/*"
                    style="display: none"
                    @change="handleLogoUpload"
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
                <div class="text-grey-darken-2 mb-1">
                  <small>Brand Name *</small>
                </div>
                <v-text-field
                  v-model="company.brand_name"
                  placeholder="Your brand name, ie: ABC Hotel"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.brand_name"
                  :rules="[(v) => !!v || 'Brand name is required']"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Company Name *</small>
                </div>
                <v-text-field
                  v-model="company.company_name"
                  placeholder="Your company name, ex: PT ABC"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :rules="[
                    (v) => !!v || 'Company name is required',
                    (v) =>
                      /^[a-zA-Z0-9\s]*$/.test(v) ||
                      'Only letters, numbers and spaces are allowed',
                  ]"
                  :error-messages="errors.company_name"
                ></v-text-field>
              </div>

              <div class="mb-2">
                <v-switch
                  v-model="company.is_branch"
                  label="Is this a branch company?"
                  color="primary"
                  density="comfortable"
                  rounded="lg"
                  hide-details
                />
              </div>

              <div v-if="company.parent_id || company.is_branch">
                <div class="d-flex align-center">
                  <small>Branch *</small>
                  <v-menu
                    location="top"
                    open-on-hover
                    transition="scale-transition"
                  >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="plain"
                        density="comfortable"
                        icon="mdi-information"
                        size="small"
                        color="primary"
                        class="ms-1"
                      ></v-btn>
                    </template>
                    <v-card max-width="300">
                      <v-card-text class="text-body-2">
                        If you are registering as a branch company, please state
                        your branch name.
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </div>
                <v-text-field
                  v-model="company.branch"
                  placeholder="Please state your branch name"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.branch"
                  :rules="[(v) => !!v || 'Branch name is required']"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Industry *</small>
                </div>
                <v-autocomplete
                  v-model="company.industry_id"
                  placeholder="Choose one that suits your company"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.industry_id"
                  @keyup="
                    handleInput($event, 'industry', ['name'], 'mst-industries')
                  "
                  :items="models['industry'].items"
                  :loading="models['industry'].loading"
                  :rules="[(v) => !!v || 'Industry is required']"
                  item-title="name"
                  item-value="id"
                ></v-autocomplete>
              </div>
              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Organization Sizes</small>
                </div>
                <v-select
                  v-model="company.organization_size"
                  :items="organizationSizes"
                  item-title="label"
                  item-value="name"
                  placeholder="What is your company size?"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.organization_size"
                ></v-select>
              </div>
              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Organization Type</small>
                </div>
                <v-select
                  v-model="company.organization_type"
                  :items="organizationTypes"
                  item-title="label"
                  item-value="name"
                  placeholder="What is your company type?"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.organization_type"
                ></v-select>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Tagline</small>
                </div>
                <v-text-field
                  v-model="company.tagline"
                  placeholder="Describe your company motto/tagline"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.tagline"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Location</small>
                </div>
                <v-textarea
                  v-model="company.location"
                  placeholder="Please state your address, city, and postal code (optional)"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.location"
                  rows="3"
                  auto-grow
                  style="white-space: pre-wrap !important; resize: vertical"
                ></v-textarea>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>NPWP/TIN Number</small>
                </div>
                <v-text-field
                  v-model="company.tax_identification_number"
                  placeholder="Input your NPWP/Tax ID Number"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.tax_identification_number"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>NPWP/TIN File</small>
                </div>
                <v-file-upload
                  v-model="company.tax_identification_url"
                  category="company_tax"
                  class="mb-5"
                >
                  <template v-slot:append>
                    <v-icon>mdi-upload</v-icon>
                  </template>
                </v-file-upload>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Website</small>
                </div>
                <v-text-field
                  v-model="company.website"
                  placeholder="Input your website (without https)"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.website"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Company Phone</small>
                </div>
                <v-phone-field
                  v-model="company.phone"
                  placeholder="Input your general phone number"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.phone"
                  default-country="ID"
                  type="tel"
                  :isSignup="false"
                ></v-phone-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Company Email</small>
                </div>
                <v-text-field
                  v-model="company.email"
                  placeholder="Input your general email address"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.email"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Verification Status</small>
                </div>
                <v-sheet
                  class="pa-3 bg-grey-lighten-3"
                  height="48"
                  rounded="lg"
                >
                  {{ company.is_verified ? "Verified" : "Unverified" }}
                </v-sheet>
              </div>
            </v-col>
          </v-row>
          <v-row class="mt-8">
            <v-col cols="4">
              <v-btn
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
                type="submit"
                :loading="loading"
                rounded="lg"
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

    <!-- Help Text -->
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "wizard-employer", middleware: ["auth"] });

const { $apiFetch } = useApi();
const router = useRouter();
const { me, fetchMe } = useUser();
const valid = ref(false);
const form = ref(null);
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
// States
const company = ref({
  brand_name: null,
  is_branch: false,
  parent_id: null,
  company_name: null,
  branch: null,
  phone: null,
  email: null,
  photo_url: null,
  unique_url: null,
  website: null,
  industry_id: null,
  industry: null,
  organization_size: null,
  organization_type: null,
  logo_url: null,
  tagline: null,
  location: null,
  legal_type: null,
  number_of_employees: null,
  business_license: null,
  tax_identification_number: null,
  tax_identification_url: null,
  region_id: null,
  other_region: null,
  is_verified: false,
  is_premium: false,
  status: "ACTIVE",
});

const errors = ref({});
const loading = ref(false);
const uploadingLogo = ref(false);
const uploadingTaxFile = ref(false);

// Data
const industries = ref([]);
const organizationTypes = ref([]);
const fetchOrganizationTypes = async () => {
  const res = await $apiFetch("/configs/key/company_types");
  organizationTypes.value = res.value;
};

// Add organization sizes
const organizationSizes = ref([]);
const fetchOrganizationSizes = async () => {
  const res = await $apiFetch("/configs/key/company_sizes");
  organizationSizes.value = res.value;
};

const avatarInput = ref(null);
const triggerAvatarUpload = () => {
  avatarInput.value.click();
};
// Methods
const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadingLogo.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "company_logo");

    const response = await $apiFetch("/media", {
      method: "POST",
      body: formData,
    });

    company.value.logo_url = response.path;
  } catch (error) {
    console.error("Error uploading logo:", error);
  } finally {
    uploadingLogo.value = false;
  }
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
      } else {
        router.replace("/admin/profile/choose-role");
      }
    }
  } catch (error) {
    console.error("Error back:", error);
  }
};

const handleSubmit = async () => {
  const { valid, errors } = await form.value.validate();
  if (!valid) {
    snackbar.showSnackbar({
      message: "Please fill in all required fields",
      color: "error",
    });
    return;
  }

  if (!company.value.logo_url) {
    snackbar.showSnackbar({
      message: "Company logo is required",
      color: "error",
    });
    return;
  }

  loading.value = true;
  errors.value = {};

  try {
    let response;
    if (company.value.id) {
      response = await $apiFetch(`/mst-companies/${company.value.id}`, {
        method: "PATCH",
        body: company.value,
      });
    } else {
      response = await $apiFetch("/mst-companies", {
        method: "POST",
        body: company.value,
      });
    }

    if (me.value.wizard_state) {
      const index = me.value.wizard_state.findIndex((item) => item.id == 1);
      if (index !== -1) {
        me.value.wizard_state[index].state = response.id ? 1 : 0;
      }

      await $apiFetch(`/users/${me.value.id}`, {
        method: "PATCH",
        body: {
          company_id: response.id,
          company_role: "owner",
          last_wizard_state:
            me.value.last_wizard_state > 1 ? me.value.last_wizard_state : 2,
          wizard_state: me.value.wizard_state,
        },
      });
    }

    handleNext();
  } catch (error) {
    console.error("Error saving company:", error);
    if (error.response?._data?.message) {
      errors.value = error.response._data.message;
    }
  } finally {
    loading.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
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
      path: "/admin/profile/employer/2",
      query: route.query,
    });
  }
};

const loadingInitial = ref(true);
// Fetch existing company data if any
const fetchCompanyData = async () => {
  loadingInitial.value = true;
  try {
    const response = await $apiFetch("/mst-companies/search", {
      params: {
        filters: {
          id: me.value.company_id,
        },
      },
    });

    if (response.items.length > 0) {
      company.value = response.items[0];
    }

    if (company.value.industry_id) {
      fetch("industry", company.value.industry_id, "id", "mst-industries");
    }
    if (company.value.parent_id) {
      fetch("company", company.value.parent_id, "id", "mst-companies");
      company.value.is_branch = true;
    }
  } catch (error) {
    console.error("Error fetching company data:", error);
  } finally {
    loadingInitial.value = false;
  }
};

// Watch for changes
watch(
  () => company.value,
  (val) => {
    errors.value = {};
    if (!val.is_branch) {
      company.value.parent_id = null;
      company.value.branch = null;
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }

  if (!["hrd", "owner"].includes(me.value.company_role)) {
    snackbar.showSnackbar({
      message: "You are not authorized to access this page",
      color: "error",
    });
    router.replace("/admin/profile/employer/2?edit=1");
  }
  if (me.value.company_id) {
    await fetchCompanyData();
  } else {
    loadingInitial.value = false;
  }
  fetchOrganizationTypes();
  fetchOrganizationSizes();
});

const { models, debouncedFetch, fetch } = useDynamicSearch([
  "industry",
  "company",
]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
