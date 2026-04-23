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
                <div class="ml-4" v-if="canEditBusinessProfile">
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  :error-messages="companyNameError || errors.company_name"
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
                  :loading="companyNameValidating"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Company Description *</small>
                </div>
                <v-textarea
                  v-model="company.company_description"
                  placeholder="Explain about your company"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :rules="[(v) => !!v || 'Company name is required']"
                  :error-messages="errors.company_name"
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
                ></v-textarea>
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
                ></v-select>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>List of Department *</small>
                </div>
                <v-autocomplete
                  v-model="company.department_ids"
                  :items="availableDepartments"
                  item-title="dept_name"
                  item-value="id"
                  placeholder="Select the available departments"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  multiple
                  chips
                  closable-chips
                  :loading="departmentsLoading"
                  @keyup.prevent="handleDepartmentSearch"
                  :rules="[
                    (v) =>
                      (v && v.length > 0) ||
                      'At least one department is required',
                  ]"
                  :error-messages="errors.department_ids"
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
                >
                  <template v-slot:chip="{ props, item }">
                    <v-chip
                      v-bind="props"
                      label
                      color="primary"
                      class="text-white"
                      variant="flat"
                      closable
                    >
                      {{ item.raw.dept_name }}
                    </v-chip>
                  </template>

                  <template v-slot:no-data>
                    <div class="pa-4 text-center">
                      <div class="text-grey mb-3">
                        <v-icon size="48" color="grey-lighten-1"
                          >mdi-office-building-outline</v-icon
                        >
                        <p class="text-body-2 mt-2">No departments found</p>
                        <p class="text-caption">
                          Create a new department to get started
                        </p>
                      </div>
                      <v-btn
                        v-if="canEditBusinessProfile"
                        color="primary"
                        variant="outlined"
                        size="small"
                        @click="showAddDepartmentDialog = true"
                        class="font-weight-bold"
                      >
                        <v-icon start>mdi-plus</v-icon>
                        Add Department
                      </v-btn>
                    </div>
                  </template>
                </v-autocomplete>
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
                ></v-text-field>
              </div>

              <div>
                <div class="text-grey-darken-2 mb-1">
                  <small>Country *</small>
                </div>
                <v-autocomplete
                  v-model="company.country_id"
                  placeholder="Select your country"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.country_id"
                  @keyup="
                    handleInput($event, 'country', ['name'], 'mst-country')
                  "
                  :items="models['country'].items"
                  :loading="models['country'].loading"
                  :rules="[(v) => !!v || 'Country is required']"
                  item-title="name"
                  item-value="id"
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
                ></v-autocomplete>
              </div>

              <template v-if="!company.is_outside_indo">
                <div>
                  <div class="text-grey-darken-2 mb-1">
                    <small>Region*</small>
                  </div>
                  <v-autocomplete
                    v-model="company.region_id"
                    placeholder="Insert 3 characters or more to search"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :error-messages="errors.region_id"
                    :items="regions"
                    :loading="regionLoading"
                    :search-input.sync="regionSearch"
                    item-title="name"
                    item-value="id"
                    @update:search="searchRegions"
                    :rules="[
                      (v) =>
                        company.is_outside_indo || !!v || 'Region is required',
                    ]"
                    :readonly="!canEditBusinessProfile"
                    :disabled="!canEditBusinessProfile"
                  ></v-autocomplete>
                </div>
              </template>
              <template v-else>
                <div>
                  <div class="text-grey-darken-2 mb-1">
                    <small>Region*</small>
                  </div>
                  <v-text-field
                    v-model="company.other_region"
                    variant="outlined"
                    density="comfortable"
                    placeholder="Input region"
                    :rules="[
                      (v) =>
                        !company.is_outside_indo || !!v || 'Region is required',
                    ]"
                    rounded="lg"
                    :readonly="!canEditBusinessProfile"
                    :disabled="!canEditBusinessProfile"
                  />
                </div>
              </template>

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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  placeholder="Input your website ex: www.example.com"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :error-messages="errors.website"
                  :rules="[
                    (v) =>
                      !v ||
                      /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(v) ||
                      'Please enter a valid website URL (e.g., example.com)',
                  ]"
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                  type="email"
                  :rules="[
                    (v) =>
                      !v ||
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                      'Please enter a valid email address',
                  ]"
                  :error-messages="errors.email"
                  :readonly="!canEditBusinessProfile"
                  :disabled="!canEditBusinessProfile"
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
                :disabled="me.last_wizard_state > 2"
              >
                Back
              </v-btn>
            </v-col>
            <v-col cols="4"></v-col>
            <v-col cols="4" v-if="canEditBusinessProfile">
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

    <!-- Add Department Dialog -->
    <v-dialog v-model="showAddDepartmentDialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title
          class="d-flex align-center justify-space-between pa-6 pb-4"
        >
          <span class="text-h5 font-weight-bold">Add New Department</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeAddDepartmentDialog"
          />
        </v-card-title>

        <v-card-text class="pa-6 pt-0">
          <v-form ref="addDepartmentForm" v-model="addDepartmentFormValid">
            <v-row>
              <v-col cols="12">
                <div class="text-grey-darken-2 mb-1">
                  <small>Department Name *</small>
                </div>
                <v-text-field
                  v-model="newDepartment.dept_name"
                  placeholder="e.g., Human Resources"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :rules="[(v) => !!v || 'Department name is required']"
                />
              </v-col>

              <v-col cols="12" style="display: none">
                <div class="text-grey-darken-2 mb-1">
                  <small>Department Code</small>
                </div>
                <v-text-field
                  v-model="newDepartment.dept_code"
                  placeholder="e.g., HR"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            @click="closeAddDepartmentDialog"
            class="mr-3"
          >
            CANCEL
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="saveNewDepartment"
            :loading="loadingAddDepartment"
          >
            ADD DEPARTMENT
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Help Text -->
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "wizard-employer", middleware: ["auth"] });

import { debounce } from "~/utils/debounce";

const { $apiFetch } = useApi();
const router = useRouter();
const { me, fetchMe } = useUser();
const valid = ref(false);
const form = ref(null);
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

// Permission checks
const isOwnerHq = computed(() => {
  return me.value.roles.some(
    (role) =>
      role.assignment.company_role == "owner_hq" ||
      (me.value.user_role == "company" && role.assignment.company_id == null)
  );
});
const { canAccessProfileSection } = usePermissions();
const canEditBusinessProfile = computed(
  () =>
    canAccessProfileSection("business_profile", "edit") ||
    me.value.company_role == "owner_hq" ||
    me.value.company_role == "owner" ||
    isOwnerHq.value || me.value.roles.length == 0
);
const canViewBusinessProfile = computed(
  () =>
    canAccessProfileSection("business_profile", "view") ||
    me.value.company_role == "owner_hq" ||
    me.value.company_role == "owner"
);
// States
const company = ref({
  brand_name: null,
  is_branch: false,
  parent_id: null,
  company_name: null,
  company_description: null,
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
  is_outside_indo: false,
  other_country: null,
  country_id: null,
  region_id: null,
  other_region: null,
  location: null,
  legal_type: null,
  number_of_employees: null,
  business_license: null,
  tax_identification_number: null,
  tax_identification_url: null,
  other_region: null,
  is_verified: false,
  is_premium: false,
  status: "ACTIVE",
  department_ids: [],
});

const errors = ref({});
const loading = ref(false);
const uploadingLogo = ref(false);
const uploadingTaxFile = ref(false);
const companyNameError = ref("");
const companyNameValidating = ref(false);
const skipCompanyNameValidation = ref(false);

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

// Add departments
const availableDepartments = ref([]);
const departmentsLoading = ref(false);
const departmentSearch = ref("");
const showAddDepartmentDialog = ref(false);
const newDepartment = ref({
  dept_name: "",
  dept_code: "",
});
const loadingAddDepartment = ref(false);
const addDepartmentFormValid = ref(false);
const addDepartmentForm = ref(null);

const fetchAvailableDepartments = async (companyId, searchTerm = "") => {
  if (!companyId) return;

  departmentsLoading.value = true;
  try {
    const response = await $apiFetch(
      `/mst-companies/available-departments/${companyId}`,
      {
        params: {
          search: searchTerm,
        },
      }
    );
    availableDepartments.value = [
      ...new Map(
        [...availableDepartments.value, ...(response.items || [])].map(
          (item) => [item.id, item]
        )
      ).values(),
    ];
  } catch (error) {
    console.error("Error fetching available departments:", error);
    availableDepartments.value = [];
  } finally {
    departmentsLoading.value = false;
  }
};

const fetchAllGlobalDepartments = async (searchTerm = "") => {
  departmentsLoading.value = true;
  try {
    const response = await $apiFetch("/mst-departments/search", {
      params: {
        filters: {
          flag: "GLOBAL",
          dept_name: searchTerm,
        },
      },
    });
    availableDepartments.value = [
      ...new Map(
        [...availableDepartments.value, ...(response.items || [])].map(
          (item) => [item.id, item]
        )
      ).values(),
    ];
  } catch (error) {
    console.error("Error fetching global departments:", error);
    availableDepartments.value = [];
  } finally {
    departmentsLoading.value = false;
  }
};

// Debounced search function
const debouncedDepartmentSearch = debounce(async (searchTerm) => {
  if (me.value.roles[0]?.assignment?.company_id) {
    await fetchAvailableDepartments(
      me.value.roles[0].assignment.company_id,
      searchTerm
    );
  } else {
    await fetchAllGlobalDepartments(searchTerm);
  }
}, 500);

const handleDepartmentSearch = (searchTerm) => {
  debouncedDepartmentSearch(searchTerm.target.value);
};

// Company name validation
const checkCompanyNameExists = async (companyName) => {
  if (!companyName || companyName.trim().length < 3) {
    companyNameError.value = "";
    return;
  }

  companyNameValidating.value = true;
  companyNameError.value = "";

  try {
    const response = await $apiFetch("/mst-companies/search", {
      params: {
        filters: {
          company_name: companyName.trim(),
        },
        limit: 100, // Get more results to check case-insensitive
      },
    });

    // Check for case-insensitive match (backend uses LOWER for duplicate check)
    const found = response.items?.find((item) => {
      // Exclude current company if editing
      if (company.value.id && item.id === company.value.id) {
        return false;
      }
      // Case-insensitive comparison
      return (
        item.company_name?.toLowerCase() === companyName.trim().toLowerCase()
      );
    });

    if (found) {
      companyNameError.value = "Company name already exists";
    } else {
      companyNameError.value = "";
    }
  } catch (error) {
    console.error("Error checking company name:", error);
    companyNameError.value = "";
  } finally {
    companyNameValidating.value = false;
  }
};

const debouncedCheckCompanyName = debounce(checkCompanyNameExists, 500);

// Add Department Dialog Methods
const closeAddDepartmentDialog = () => {
  showAddDepartmentDialog.value = false;
  resetNewDepartmentForm();
};

const resetNewDepartmentForm = () => {
  newDepartment.value = {
    dept_name: "",
    dept_code: "",
  };
  if (addDepartmentForm.value) {
    addDepartmentForm.value.reset();
  }
};

const saveNewDepartment = async () => {
  const { valid, errors } = await addDepartmentForm.value.validate();
  if (!valid) {
    let messages = "";
    errors.forEach((error) => {
      messages += JSON.stringify(error.errorMessages) + "\n";
    });
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: messages,
      color: "error",
    });
    return;
  }

  loadingAddDepartment.value = true;
  try {
    // Prepare department data for API call
    const departmentData = {
      ...newDepartment.value,
      companyHqId: me.value.roles[0]?.assignment?.company_hq_id,
      flag: me.value.roles[0]?.assignment?.company_hq_id ? "PRIVATE" : "GLOBAL", // Company-specific department
    };

    // API call to create department
    const response = await $apiFetch("/mst-departments", {
      method: "POST",
      body: departmentData,
    });

    // Add the new department to the available departments list
    availableDepartments.value = [...availableDepartments.value, response];

    // Automatically select the new department
    company.value.department_ids = [
      ...(company.value.department_ids || []),
      response.id,
    ];

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Department added successfully",
      color: "success",
    });

    closeAddDepartmentDialog();
  } catch (error) {
    console.error("Error creating department:", error);
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Failed to add department",
      color: "error",
    });
  } finally {
    loadingAddDepartment.value = false;
  }
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
      const authRoutes = ["/login", "/signup", "/signup-verify-otp", "/"];
      const previousPath = router.options.history.state.back;

      if (me.value.last_wizard_state > 2) {
        router.replace("/login");
      } else if (
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

    if (response && response.id) {
      company.value.id = response.id;
      me.value.company_id = response.id;
    }

    if (me.value.wizard_state) {
      const index = me.value.wizard_state.findIndex((item) => item.id == 1);
      if (index !== -1) {
        me.value.wizard_state[index].state = response.id ? 1 : 0;
      }

      // Di line 942-962, ganti dengan kode ini:

      const assignments = me.value.roles[0]?.assignment
        ? [me.value.roles[0].assignment]
        : [
            {
              user_id: me.value.id,
              company_hq_id: response.id,
              company_id: response.id,
              company_role: "owner_hq",
              role: "employer",
              status: "active",
              start_date: new Date(),
              end_date: null,
              employment_type: "Full-time",
              profession_id: null,
              dept_id: null,
            },
          ];

      // Clean assignments - hanya ambil field yang diperlukan
      const cleanedAssignments = assignments.map((assignment) => ({
        role_assignment_history_id:
          assignment.role_assignment_history_id || assignment.id,
        role_assignment_id: assignment.id,
        user_id: assignment.user_id || me.value.id,
        company_hq_id: assignment.company_hq_id || response.id,
        company_id: response.id,
        company_role: "owner_hq",
        role: "employer",
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        status: assignment.status || "active",
        employment_type: assignment.employment_type,
        profession_id: assignment.profession_id,
        dept_id: assignment.dept_id,
      }));

      // Clean body - hanya ambil field yang diperlukan untuk upsert-member
      const body = {
        id: me.value.id,
        company_id: response.id,
        company_role: me.value.company_role || "owner_hq",
        email: me.value.email,
        last_wizard_state:
          me.value.last_wizard_state > 1 ? me.value.last_wizard_state : 2,
        wizard_state: me.value.wizard_state,
        assignments: cleanedAssignments,
      };

      await $apiFetch(`/users/${me.value.id}`, {
        method: "PATCH",
        body: body,
      });

      /*await $apiFetch(`/mst-companies/upsert-member`, {
        method: "POST",
        body: body,
      });*/
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
const fetchCompanyData = async (id) => {
  loadingInitial.value = true;
  skipCompanyNameValidation.value = true; // Skip validation during initial load
  try {
    const response = await $apiFetch("/mst-companies/search", {
      params: {
        filters: {
          id,
        },
      },
    });

    if (response.items.length > 0) {
      company.value = response.items[0];
      // Set department_ids from existing departments
      if (company.value.departments && company.value.departments.length > 0) {
        company.value.department_ids = company.value.departments.map(
          (dept) => dept.id
        );
      }
    }

    if (company.value.industry_id) {
      fetch("industry", company.value.industry_id, "id", "mst-industries");
    }
    if (company.value.parent_id) {
      fetch("company", company.value.parent_id, "id", "mst-companies");
      company.value.is_branch = true;
    }
    if (company.value.country_id) {
      await fetch("country", company.value.country_id, "id", "mst-country");
      // Set is_outside_indo based on existing country_id after country data is loaded
      const selectedCountry = models.value["country"].items.find(
        (country) => country.id === company.value.country_id
      );
      if (selectedCountry) {
        const isIndonesia =
          selectedCountry.name.toLowerCase().includes("indonesia") ||
          selectedCountry.code === "ID";
        company.value.is_outside_indo = !isIndonesia;
      }
    }
    if (company.value.region_id && !company.value.is_outside_indo) {
      fetchRegions(company.value.region_id, "id");
    }
  } catch (error) {
    console.error("Error fetching company data:", error);
  } finally {
    loadingInitial.value = false;
    // Enable validation after initial load is complete
    setTimeout(() => {
      skipCompanyNameValidation.value = false;
    }, 100);
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

// Watch for country changes to set is_outside_indo and other_region
watch(
  () => company.value.country_id,
  (newCountryId) => {
    if (newCountryId) {
      // Find the selected country from the models
      const selectedCountry = models.value["country"].items.find(
        (country) => country.id === newCountryId
      );

      if (selectedCountry) {
        // Check if the country is Indonesia
        const isIndonesia =
          selectedCountry.name.toLowerCase().includes("indonesia") ||
          selectedCountry.code === "ID";

        company.value.is_outside_indo = !isIndonesia;

        if (!isIndonesia) {
          // Set other_region to the country name for non-Indonesia countries
          //company.value.other_country = selectedCountry.name;
          // Clear region_id when outside Indonesia
          company.value.region_id = null;
        } else {
          // Clear other_region when Indonesia is selected
          company.value.other_region = null;
        }
      }
    }
  }
);

// Watch for company name changes to validate uniqueness
watch(
  () => company.value.company_name,
  (newCompanyName) => {
    // Skip validation during initial load
    if (skipCompanyNameValidation.value) return;
    //if (!canEditBusinessProfile.value) return;

    // Clear previous error
    companyNameError.value = "";

    // Only validate if company name is not empty and has at least 3 characters
    if (newCompanyName && newCompanyName.trim().length >= 3) {
      debouncedCheckCompanyName(newCompanyName);
    }
  }
);

onMounted(async () => {
  if (!me.value.company_id) {
    await fetchMe();
  }

  if (me.value.roles[0]?.assignment?.company_id) {
    await fetchCompanyData(me.value.roles[0]?.assignment?.company_id);
    // Fetch available departments for the company
    await fetchAvailableDepartments(me.value.roles[0]?.assignment?.company_id);
  } else if (me.value.company_id) {
    await fetchCompanyData(me.value.company_id);
    // Fetch available departments for the company
    await fetchAvailableDepartments(me.value.company_id);
  } else {
    skipCompanyNameValidation.value = false; // Enable validation for new company
    await fetchAllGlobalDepartments();
  }
  loadingInitial.value = false;
  fetchOrganizationTypes();
  fetchOrganizationSizes();

  // Load initial country list
  try {
    const countryData = await $apiFetch(`/mst-country/search`, {
      params: {
        filters: {},
        limit: 50,
      },
    });
    models.value["country"].items = countryData.items || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
  }
});

const { models, debouncedFetch, fetch } = useDynamicSearch([
  "industry",
  "company",
  "country",
]);

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const regionSearch = ref("");

const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};

const searchRegions = (search) => {
  debouncedFetchRegions(search);
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
