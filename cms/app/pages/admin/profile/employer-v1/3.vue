<template>
  <v-container class="pa-2">
    <v-card rounded="xl" elevation="0" class="pa-2">
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <h2 class="mb-2">Add Your Teams</h2>
            <p class="text-grey mb-2">
              Invite teammates to help manage your company account. You can edit
              roles anytime.
            </p>
          </v-col>
          <v-col cols="12">
            <!-- Add New Member Button -->

            <v-window v-model="currentView">
              <!-- Country Selection View -->
              <v-window-item value="list-member">
                <v-btn
                  block
                  color="primary"
                  variant="outlined"
                  class="mb-12 font-weight-bold"
                  height="46"
                  rounded="lg"
                  @click="
                    currentView = 'add-member';
                    resetForm();
                  "
                >
                  INVITE NEW MEMBER
                  <template v-slot:prepend>
                    <v-icon>mdi-plus</v-icon>
                  </template>
                </v-btn>
                <!-- Member List -->
                <div
                  v-for="member in members"
                  :key="member.id"
                  class="member-item"
                >
                  <div class="d-flex justify-space-between align-center py-2">
                    <div class="align-center">
                      <div style="font-size: 14px">
                        <span class="font-weight-bold">{{
                          member.full_name
                        }}</span>
                        ({{ member.email }})
                      </div>
                      <div class="text-grey" style="font-size: 13px">
                        {{ capitalizeFirstLetter(member.company_role) }}
                      </div>
                    </div>
                    <div
                      class="d-flex align-center"
                      v-if="member.company_role !== 'owner'"
                    >
                      <v-btn
                        color="#F57C00"
                        variant="text"
                        size="small"
                        class="text-none font-weight-bold mr-1"
                        @click="editMember(member)"
                      >
                        Edit
                      </v-btn>
                      <v-btn
                        color="#DC3545"
                        variant="text"
                        size="small"
                        class="text-none font-weight-bold"
                        @click="
                          () => {
                            showDeleteDialog = true;
                            selectedMember = member;
                          }
                        "
                      >
                        Delete
                      </v-btn>
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-icon
                            v-bind="props"
                            icon="mdi-dots-vertical"
                            class="ml-2"
                          ></v-icon>
                        </template>
                        <v-list density="compact">
                          <v-list-item @click="transferOwnership(member)">
                            <v-list-item-title
                              >Transfer To Owner</v-list-item-title
                            >
                          </v-list-item>
                        </v-list>
                      </v-menu>

                      <v-dialog v-model="showDeleteDialog" max-width="400">
                        <v-card rounded="xl" elevation="0">
                          <v-card-text class="text-center pt-4">
                            <h3>Delete Confirmation</h3>
                            <p class="mt-2 mb-3">
                              Are you sure you want to delete this member from
                              your team?
                            </p>
                          </v-card-text>
                          <v-card-actions class="justify-center pb-4">
                            <v-btn
                              variant="outlined"
                              color="primary"
                              class="mr-2"
                              rounded="lg"
                              @click="showDeleteDialog = false"
                            >
                              Cancel
                            </v-btn>
                            <v-btn
                              color="primary"
                              variant="elevated"
                              rounded="lg"
                              class="px-3"
                              @click="removeMember(selectedMember.id)"
                              :loading="loadingDelete === selectedMember?.id"
                            >
                              Yes, I'm Sure
                            </v-btn>
                          </v-card-actions>
                        </v-card>
                      </v-dialog>
                    </div>
                  </div>
                  <v-divider></v-divider>
                </div>
              </v-window-item>

              <!-- Right to Work Details View -->
              <v-window-item value="add-member">
                <v-form @submit.prevent="handleAddMember" ref="form">
                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Full Name *</small>
                    </div>
                    <v-text-field
                      v-model="newMember.full_name"
                      placeholder="Input full name here"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      :error-messages="errors.full_name"
                      :rules="[(v) => !!v || 'Full name is required']"
                    ></v-text-field>
                  </div>

                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Email *</small>
                    </div>
                    <v-text-field
                      v-model="newMember.email"
                      placeholder="Input your email address here"
                      variant="outlined"
                      density="comfortable"
                      :error-messages="errors.email"
                      rounded="lg"
                      :rules="[
                        (v) => !!v || 'Email is required',
                        (v) => /.+@.+\..+/.test(v) || 'Email must be valid',
                      ]"
                    ></v-text-field>
                  </div>

                  <div class="pl-1 mb-3">
                    <v-switch
                      v-model="newMember.is_outside_indo"
                      label="Outside Indonesia?"
                      color="primary"
                      hide-details
                      rounded="lg"
                    />
                  </div>

                  <template v-if="!newMember.is_outside_indo">
                    <div>
                      <div class="mb-1 text-grey-darken-2">
                        <small>City *</small>
                      </div>
                      <v-autocomplete
                        v-model="newMember.region_id"
                        variant="outlined"
                        density="comfortable"
                        placeholder="Insert 3 characters or more to search"
                        :items="regions"
                        item-title="name"
                        item-value="id"
                        :loading="regionLoading"
                        :search-input.sync="citySearch"
                        @update:search="searchCities"
                        rounded="lg"
                        :rules="[(v) => !!v || 'City is required']"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div>
                      <div class="mb-1 text-grey-darken-2">
                        <small>Country *</small>
                      </div>
                      <v-text-field
                        v-model="newMember.other_country"
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
                        v-model="newMember.other_region"
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
                      <small>Postal Code</small>
                    </div>
                    <v-text-field
                      v-model="newMember.postal_code"
                      placeholder="Input your postal code"
                      variant="outlined"
                      density="comfortable"
                      :error-messages="errors.postal_code"
                      rounded="lg"
                    ></v-text-field>
                  </div>

                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Address *</small>
                    </div>
                    <v-textarea
                      v-model="newMember.encrypted_address"
                      placeholder="Please state your address (optional)"
                      variant="outlined"
                      density="comfortable"
                      rows="3"
                      :error-messages="errors.address"
                      rounded="lg"
                      :rules="[(v) => !!v || 'Address is required']"
                      auto-grow
                      style="white-space: pre-wrap !important; resize: vertical"
                    ></v-textarea>
                  </div>

                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Gender *</small>
                    </div>
                    <v-select
                      v-model="newMember.gender"
                      :items="genders"
                      placeholder="Choose your gender"
                      item-title="label"
                      item-value="name"
                      variant="outlined"
                      density="comfortable"
                      :error-messages="errors.gender"
                      rounded="lg"
                      :rules="[(v) => !!v || 'Gender is required']"
                    ></v-select>
                  </div>

                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Date of Birth *</small>
                    </div>
                    <v-text-date
                      v-model="newMember.encrypted_date_of_birth"
                      placeholder="Click to show calendar"
                      variant="outlined"
                      density="comfortable"
                      :error-messages="errors.birth_date"
                      rounded="lg"
                      :rules="[(v) => !!v || 'Date of birth is required']"
                    ></v-text-date>
                  </div>

                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Phone Number *</small>
                    </div>
                    <v-phone-field
                      v-model="newMember.encrypted_phone"
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

                  <div>
                    <div class="mb-1 text-grey-darken-2">
                      <small>Role *</small>
                    </div>
                    <v-select
                      v-model="newMember.company_role"
                      :items="roles"
                      item-title="label"
                      item-value="name"
                      placeholder="Select role"
                      variant="outlined"
                      density="comfortable"
                      :error-messages="errors.role"
                      rounded="lg"
                      :rules="[(v) => !!v || 'Role is required']"
                    ></v-select>
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

                  <!-- Copy other fields from PIC Registration -->
                  <v-row class="mt-4">
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
                        :loading="loadingAdd"
                        rounded="lg"
                      >
                        Invite
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-form>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
        <v-row v-if="currentView === 'list-member'">
          <v-col cols="4">
            <v-btn
              block
              color="primary"
              size="large"
              rounded="lg"
              variant="outlined"
              @click="handleBack"
            >
              BACK
            </v-btn>
          </v-col>
          <v-col cols="4"></v-col>
          <v-col cols="4">
            <v-btn
              block
              color="primary"
              size="large"
              @click="handleSubmit"
              :loading="loadingSubmit"
              rounded="lg"
            >
              SUBMIT
            </v-btn>
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
import { limit } from "firebase/firestore";

definePageMeta({ ssr: false, layout: "wizard-employer", middleware: ["auth"] });

const { $apiFetch } = useApi();
const router = useRouter();
const { me, fetchMe } = useUser();
const showDeleteDialog = ref(false);
const selectedMember = ref(null);
const currentView = ref("list-member");

// States
const members = ref([]);
const newMember = ref({
  full_name: "",
  email: "",
  is_outside_indo: false,
  city_id: null,
  postal_code: "",
  encrypted_address: "",
  gender: null,
  encrypted_date_of_birth: "",
  encrypted_phone: null,
  company_role: null,
});

const errors = ref({});
const loading = ref(false);
const loadingAdd = ref(false);
const loadingDelete = ref(null);
const dialog = ref(false);
const selectedCountryCode = ref({
  name: "Indonesia",
  dial_code: "+62",
  code: "ID",
  flag: "🇮🇩",
});

const phoneNumber = ref("");
watch(
  [() => phoneNumber.value, selectedCountryCode],
  ([newPhone, newCountryCode]) => {
    if (newPhone && !newPhone.startsWith("+")) {
      newMember.value.encrypted_phone = `${newCountryCode.dial_code}${newPhone}`;
    }
  },
  { deep: true }
);

const resetForm = () => {
  newMember.value = {
    full_name: "",
    email: "",
    is_outside_indo: false,
    city_id: null,
    postal_code: "",
    address: "",
    gender: null,
    encrypted_date_of_birth: "",
    encrypted_nik: "",
    encrypted_address: "",
    encrypted_phone: null,
    company_role: null,
  };
};

const editMember = async (member) => {
  Object.assign(newMember.value, member);
  currentView.value = "add-member";
  if (newMember.value.region_id) {
    fetchRegions(newMember.value.region_id, "id");
  }
  const userEncrypted = await $apiFetch("/encrypted-user-data/search", {
    params: {
      filters: { user_id: member.id },
    },
  });
  if (userEncrypted.items.length > 0 && userEncrypted.items[0]) {
    newMember.value.encrypted_phone = userEncrypted.items[0].encrypted_phone;
    newMember.value.encrypted_date_of_birth =
      userEncrypted.items[0].encrypted_date_of_birth;
    newMember.value.encrypted_nik = userEncrypted.items[0].encrypted_nik;
    newMember.value.encrypted_address =
      userEncrypted.items[0].encrypted_address;
  }
};

const roles = ref([
  { label: "HRD", name: "hrd" },
  { label: "Member", name: "member" },
]);

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

watch(
  () => newMember.value.is_outside_indo,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
    if (newVal === true && oldVal === false) {
      newMember.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      newMember.value.other_country = null;
      newMember.value.other_region = null;
    }
  }
);

// Methods
const showAddMemberDialog = () => {
  dialog.value = true;
  errors.value = {};
  newMember.value = {
    full_name: "",
    email: "",
    is_outside_indo: false,
    city_id: null,
    postal_code: "",
    address: "",
    gender: "",
    birth_date: "",
    phone: "",
    company_role: "",
  };
};

const form = ref(null);
const handleAddMember = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    return;
  }

  loadingAdd.value = true;
  errors.value = {};

  try {
    if (newMember.value.id) {
      await $apiFetch(`/users/${newMember.value.id}`, {
        method: "PATCH",
        body: {
          ...newMember.value,
          company_id: me.value.company_id,
        },
      });

      await $apiFetch(`/encrypted-user-data/${newMember.value.id}`, {
        method: "PATCH",
        body: {
          encrypted_date_of_birth: newMember.value.encrypted_date_of_birth,
          //encrypted_nik: newMember.value.encrypted_nik,
          encrypted_address: newMember.value.encrypted_address,
          encrypted_phone: newMember.value.encrypted_phone,
        },
      });
    } else {
      const response = await $apiFetch("/mst-companies/add-member", {
        method: "POST",
        body: {
          ...newMember.value,
          company_id: me.value.company_id,
        },
      });
    }

    const index = me.value.wizard_state.findIndex((item) => item.id == 3);
    if (index !== -1) {
      me.value.wizard_state[index].state = members.value.length > 0 ? 1 : 0;
    }
    me.value.last_wizard_state = 3;

    $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: me.value,
    });
    await fetchMembers();
    currentView.value = "list-member";
  } catch (error) {
    console.error("Error adding member:", error);
    if (error.response?._data?.message) {
      errors.value = error.response._data.message;
    }
  } finally {
    loadingAdd.value = false;
  }
};

const removeMember = async (memberId) => {
  loadingDelete.value = memberId;
  try {
    await $apiFetch(`/users/${memberId}`, {
      method: "DELETE",
    });
    showDeleteDialog.value = false;
    await fetchMembers();
  } catch (error) {
    console.error("Error removing member:", error);
  } finally {
    loadingDelete.value = null;
  }
};

const dialogConfirmation = useDialogStore();
const transferOwnership = async (member) => {
  try {
    await dialogConfirmation.openDialog({
      title: "Transfer Ownership",
      message: "Are you sure you want to transfer ownership to this member?",
      confirmButtonText: "Transfer",
      confirmButtonColor: "primary",
      autoClose: false,
    });

    dialogConfirmation.loading = true;
    $apiFetch(`/users/${member.id}`, {
      method: "PATCH",
      body: {
        company_role: "owner",
      },
    }).then(async () => {
      dialogConfirmation.closeDialog();
      await fetchMembers();
    });
  } catch {
    console.log("Transfer ownership cancelled");
  }
};

const genders = ref([]);

const fetchGenders = async () => {
  const response = await $apiFetch("/configs/key/gender");
  genders.value = response.value;
};

const errorMessage = ref("");

const loadingSubmit = ref(false);
const handleSubmit = async () => {
  loadingSubmit.value = true;
  try {
    const index = me.value.wizard_state.findIndex((item) => item.id == 3);
    if (index !== -1) {
      me.value.wizard_state[index].state = members.value.length > 0 ? 1 : 0;
    }
    me.value.last_wizard_state = 3;

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        wizard_state: me.value.wizard_state,
        last_wizard_state: me.value.last_wizard_state,
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
  if (currentView.value == "add-member") {
    currentView.value = "list-member";
    return;
  }
  if (route.query.edit) {
    router.back();
  } else {
    const authRoutes = ["/login", "/signup", "/signup-verify-otp"];
    const previousPath = router.options.history.state.back;

    if (previousPath && !authRoutes.includes(previousPath)) {
      router.back();
    }
    router.replace({
      path: "/admin/profile/employer/2",
      query: route.query,
    });
  }
};

// Fetch members data
const loadingInitial = ref(true);
const fetchMembers = async () => {
  loadingInitial.value = true;
  try {
    const response = await $apiFetch("/users/search", {
      params: {
        filters: {
          company_id: me.value.company_id,
          company_role: ["hrd", "member", "owner"],
        },
        sortBy: {
          company_role: "desc",
        },
        limit: 100,
      },
    });
    members.value = response.items;
  } catch (error) {
    console.error("Error fetching members:", error);
  } finally {
    loadingInitial.value = false;
  }
};

// Add these helper functions
const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

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
  await fetchGenders();
  if (me.value.company_id) {
    fetchMembers();
  }
});
</script>

<style scoped>
.member-item:last-child .v-divider {
  display: none;
}

.member-item :deep(.v-btn) {
  text-transform: none;
  letter-spacing: normal;
  font-size: 14px;
  height: 36px;
  min-width: 50px;
  padding: 0;
}

.member-item :deep(.v-btn--variant-text) {
  opacity: 1;
}

/* Specific color for Edit button */
.member-item :deep(.v-btn--variant-text.text-orange-700) {
  color: #f57c00;
}

/* Specific color for Delete button */
.member-item :deep(.v-btn--variant-text.text-red) {
  color: #dc3545;
}
</style>
