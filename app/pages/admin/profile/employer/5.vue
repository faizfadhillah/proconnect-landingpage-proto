<template>
  <v-container class="pa-2">
    <v-card elevation="0" rounded="xl" class="pa-2">
      <v-card-text>
        <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12">
              <h2 class="mb-1">Employee Personal Detail</h2>
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
                <div class="ml-4">
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

          <!-- Team Roles Section (Read-Only) -->
          <v-row v-if="teamRoles.length > 0">
            <v-col cols="12">
              <h2 class="mb-1">Team Roles</h2>
              <p class="text-grey mb-3">
                Your current role assignments in the company
              </p>
            </v-col>
            <v-col cols="12">
              <div v-if="loadingCompanyBranches">
                <v-skeleton-loader type="card"></v-skeleton-loader>
              </div>
              <div
                v-else
                v-for="(role, index) in teamRoles"
                :key="index"
                class="mb-4 pa-4 rounded-lg"
                style="border: 1px solid #e0e0e0; background: #f8f9fa"
              >
                <div class="d-flex justify-space-between align-center mb-3">
                  <h5 class="font-weight-medium">Role {{ index + 1 }}</h5>
                </div>

                <v-row>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Placement Branch</small>
                    </div>
                    <v-select
                      :model-value="getBranchDisplayName(role.company_id)"
                      :items="[]"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Role</small>
                    </div>
                    <v-select
                      :model-value="getRoleLabel(role.company_role)"
                      :items="[]"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Department</small>
                    </div>
                    <v-select
                      :model-value="
                        getDepartmentName(role.company_id, role.dept_id)
                      "
                      :items="[]"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Job Title</small>
                    </div>
                    <v-text-field
                      :model-value="getProfessionName(role.profession_id)"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Employment Type</small>
                    </div>
                    <v-select
                      :model-value="
                        getEmploymentTypeLabel(role.employment_type)
                      "
                      :items="[]"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Start Date</small>
                    </div>
                    <v-text-field
                      :model-value="formatDateToDisplay(role.start_date)"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>End Date</small>
                    </div>
                    <v-text-field
                      :model-value="formatDateToDisplay(role.end_date)"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      :disabled="role.currently_here"
                      readonly
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="d-flex align-center">
                      <v-switch
                        :model-value="role.currently_here"
                        label="Currently Here"
                        color="primary"
                        hide-details
                        rounded="lg"
                        class="mr-4"
                        disabled
                      />
                    </div>
                  </v-col>
                  <v-col cols="12" md="6" class="py-0">
                    <div class="mb-1 text-grey-darken-2">
                      <small>Status</small>
                    </div>
                    <v-select
                      :model-value="getStatusLabel(role.status)"
                      :items="[]"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      readonly
                    ></v-select>
                  </v-col>
                </v-row>
              </div>
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
                {{ route.query.edit ? "Save" : "Submit" }}
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
const fetchUser = async () => {
  loadingInitial.value = true;
  const user = await fetchMe(true);
  Object.assign(pic.value, user);

  if (user.region_id) {
    fetchRegions(user.region_id, "id");
  }
  if (user.encrypted_phone) {
    const phone = user.encrypted_phone;
    if (phone) {
      // Find country code from phone number
      const foundCode = countryCodes.find((code) =>
        phone.startsWith(code.dial_code)
      );
      if (foundCode) {
        selectedCountryCode.value = foundCode;
        phoneNumber.value = phone
          .replace(foundCode.dial_code, "")
          .replace(/\s/g, "");
      } else {
        phoneNumber.value = phone;
      }
    }
  }

  // Fetch member detail to get assignments
  if (me.value.roles?.[0]?.assignment?.company_hq_id || me.value.company_id) {
    const companyHqId =
      me.value.roles?.[0]?.assignment?.company_hq_id || me.value.company_id;
    try {
      const memberDetail = await $apiFetch(`/mst-companies/member-detail`, {
        params: {
          user_id: me.value.id,
          company_hq_id: companyHqId,
        },
      });
      if (memberDetail && memberDetail.assignments) {
        // Set up team roles from assignments
        teamRoles.value = memberDetail.assignments.map((assignment) => ({
          ...assignment,
          currently_here: !assignment.end_date || assignment.end_date === null,
        }));

        const rolesCompanyIds = teamRoles.value.map((role) => role.company_id);

        loadingInitial.value = false;
        // Fetch branch options and departments
        await fetchCompanyBranches(companyHqId, rolesCompanyIds);

        // Fetch profession data for each role
        teamRoles.value.forEach((role) => {
          if (role.profession_id) {
            fetch("profession", role.profession_id, ["id"], "mst-professions");
          }
        });
      }
    } catch (error) {
      console.error("Error fetching member detail:", error);
    }
  }

  loadingInitial.value = false;
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

// Max date for date of birth (today)
const maxDate = computed(() => new Date().toISOString().slice(0, 10));

const loadingSubmit = ref(false);
const handleSubmit = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  loadingSubmit.value = true;
  try {
    const index = pic.value.wizard_state.findIndex((item) => item.id == 5);
    if (index !== -1) {
      pic.value.wizard_state[index].state = 1;
    }
    pic.value.last_wizard_state =
      pic.value.last_wizard_state > 5 ? pic.value.last_wizard_state : 6;

    const body = pic.value;
    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body,
    });
    await $apiFetch(`/encrypted-user-data/${me.value.id}`, {
      method: "PATCH",
      body: {
        encrypted_phone: pic.value.encrypted_phone,
        encrypted_address: pic.value.encrypted_address,
        encrypted_date_of_birth: pic.value.encrypted_date_of_birth,
        encrypted_nik: pic.value.encrypted_nik,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to update profile";
  } finally {
    loadingSubmit.value = false;
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
      path: "/admin/profile",
    });
  }
};

const handleBack = () => {
  if (route.query.edit) {
    router.back();
  } else {
    const authRoutes = ["/login", "/signup", "/signup-verify-otp", "/"];
    const previousPath = router.options.history.state.back;

    if (previousPath && !authRoutes.includes(previousPath)) {
      router.back();
    }
    router.replace({
      path: "/admin/profile/employer/4",
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

// Team roles for display
const teamRoles = ref([]);

// Branch and department options
const branchOptions = ref([]);
const departmentOptions = ref([]);

// Profession data
const { models, fetch } = useDynamicSearch(["profession"]);

// Employment type and status options
const employmentTypeOptions = ref([
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
]);

const statusOptions = ref([
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
]);

// Role options
const roleOptions = ref([
  { label: "Owner HQ", name: "owner_hq", type: "" },
  { label: "HRD HQ", name: "hrd_hq", type: "hq" },
  { label: "Dept Head HQ", name: "dept_head_hq", type: "hq" },
  { label: "PIC Branch", name: "pic_branch", type: "branch" },
  { label: "HRD Branch", name: "hrd_branch", type: "branch" },
  { label: "Dept Head Branch", name: "dept_head_branch", type: "branch" },
  { label: "Member", name: "member", type: "branch,hq" },
]);

// Function to fetch company branches
const loadingCompanyBranches = ref(false);
const fetchCompanyBranches = async (companyHqID, rolesCompanyIds = []) => {
  try {
    loadingCompanyBranches.value = true;
    const res = await $apiFetch(
      `/mst-companies/available-branches/${companyHqID}`
    );
    const companiesHqRes = await $apiFetch("/mst-companies/search", {
      params: {
        filters: { id: companyHqID },
        limit: 1,
      },
    });
    const companiesBranchRes = await $apiFetch("/mst-companies/search", {
      params: {
        filters: { parent_id: companyHqID },
        limit: res.items.length,
      },
    });
    const companiesRes = {
      items: [...companiesHqRes.items, ...companiesBranchRes.items],
    };

    // Fetch departments for each branch

    const departmentsRes = await Promise.all(
      rolesCompanyIds.map((id) =>
        $apiFetch(`/mst-companies/departments/${id}`).catch((error) => {
          console.error(`Error fetching departments for branch ${id}:`, error);
          return { id, items: [] };
        })
      )
    );

    branchOptions.value = res.items.map((item, index) => {
      const company = companiesRes.items.find(
        (company) => company.id === item.id
      );
      let departments = [];
      if (rolesCompanyIds.includes(item.id)) {
        departments =
          departmentsRes[rolesCompanyIds.indexOf(item.id)]?.items || [];
      }
      return {
        ...item,
        ...company,
        display_name: item.display_name || item.branch || "Headquarters",
        departments: departments,
      };
    });

    // Sort branches so that null branch fields appear at the top
    branchOptions.value.sort((a, b) => {
      if (!a.branch && b.branch) return -1;
      if (a.branch && !b.branch) return 1;
      return 0;
    });
  } catch (error) {
    console.error("Error fetching company branches:", error);
    branchOptions.value = [];
  } finally {
    loadingCompanyBranches.value = false;
  }
};

// Helper function to get branch display name
const getBranchDisplayName = (branchId) => {
  if (!branchId) return "-";
  const branch = branchOptions.value.find((b) => b.id === branchId);
  return branch ? branch.display_name : "-";
};

// Helper function to get role label
const getRoleLabel = (roleName) => {
  if (!roleName) return "-";
  const role = roleOptions.value.find((r) => r.name === roleName);
  if (role) return role.label;
  // Fallback: capitalize and format
  return roleName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to get department name
const getDepartmentName = (branchId, deptId) => {
  if (!deptId || !branchId) return "-";
  const branch = branchOptions.value.find((b) => b.id === branchId);
  if (!branch || !branch.departments) return "-";
  const department = branch.departments.find((d) => d.id === deptId);
  return department ? department.dept_name : "-";
};

// Helper function to get profession name
const getProfessionName = (professionId) => {
  if (!professionId) return "-";
  const profession = models.value.profession.items.find(
    (p) => p.id === professionId
  );
  return profession ? profession.name : "-";
};

// Helper function to get employment type label
const getEmploymentTypeLabel = (employmentType) => {
  if (!employmentType) return "-";
  const option = employmentTypeOptions.value.find(
    (opt) => opt.value === employmentType
  );
  return option ? option.label : employmentType;
};

// Helper function to get status label
const getStatusLabel = (status) => {
  if (!status) return "-";
  const option = statusOptions.value.find((opt) => opt.value === status);
  return option ? option.label : status;
};

// Helper function to format date for display
const formatDateToDisplay = (date) => {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return "-";
  }
};

onMounted(async () => {
  await fetchUser();
  fetchGenders();
});
</script>
