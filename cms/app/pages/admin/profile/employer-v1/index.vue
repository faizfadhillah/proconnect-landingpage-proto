<template>
  <v-container fluid grid-list-md>
    <v-card-actions class="pl-0 pr-1 py-0">
      <v-icon @click="$router.back()" color="primary">mdi-chevron-left</v-icon
      >COMPANY PROFILE
      <v-spacer />
      <v-btn
        v-if="['owner', 'hrd'].includes(me.company_role)"
        :to="{
          path: '/admin/profile/employer/1',
          query: { edit: 1 },
        }"
        color="primary"
        variant="elevated"
        rounded="lg"
      >
        <v-icon>mdi-pencil</v-icon>
        Edit Company
      </v-btn>
      <v-btn
        v-else
        :to="{
          path: '/admin/profile/employer/2',
          query: { edit: 1 },
        }"
        color="primary"
        variant="elevated"
        rounded="lg"
      >
        <v-icon start>mdi-pencil</v-icon>
        Edit Profile
      </v-btn>
    </v-card-actions>
  </v-container>
  <v-container fluid grid-list-lg class="mt-0 pt-0">
    <form @submit.prevent="onSubmit">
      <v-card-text class="px-1 pt-0">
        <v-row grid-list-lg dense>
          <v-col cols="12" md="6" class="pt-0">
            <v-card elevation="0" rounded="lg" class="mb-2">
              <v-card-title>
                Profile Info
                {{ me.company_role == "owner" ? "(PIC)" : "" }}
              </v-card-title>
              <v-card-text>
                <table style="width: 100%">
                  <tbody>
                    <template
                      v-for="field in [
                        {
                          name: 'photo_url',
                          label: 'Photo',
                        },
                        {
                          name: 'full_name',
                          label: 'Full Name',
                        },
                        {
                          name: 'encrypted_date_of_birth',
                          label: 'Date of Birth',
                        },
                        {
                          name: 'encrypted_phone',
                          label: 'Phone',
                        },
                        {
                          name: 'email',
                          label: 'Email',
                        },
                        {
                          name: 'gender',
                          label: 'Gender',
                        },
                        {
                          name: 'encrypted_address',
                          label: 'Address',
                        },
                        {
                          name: 'region_id',
                          label: 'City',
                        },
                        {
                          name: 'other_country',
                          label: 'Country',
                        },
                        {
                          name: 'other_region',
                          label: 'Region',
                        },
                        {
                          name: 'postal_code',
                          label: 'Postal Code',
                        },
                      ]"
                    >
                      <template
                        v-if="
                          [
                            'photo_url',
                            'full_name',
                            'encrypted_date_of_birth',
                            'encrypted_phone',
                            'email',
                            'gender',
                            'encrypted_address',
                            'postal_code',
                          ].includes(field.name) ||
                          (['region_id'].includes(field.name) &&
                            formPIC.is_outside_indo === false) ||
                          (['other_country', 'other_region'].includes(
                            field.name
                          ) &&
                            formPIC.is_outside_indo === true)
                        "
                      >
                        <tr>
                          <td valign="top" class="py-1 pr-2" style="width: 25%">
                            {{
                              field.label
                                .replace("Encrypted", "")
                                .replace("Region Id", "City")
                            }}
                          </td>
                          <td valign="top" class="pa-1">:</td>
                          <td valign="top" class="py-1 pl-2">
                            <template v-if="field.name == 'photo_url'">
                              <v-avatar
                                rounded="lg"
                                size="70"
                                class="bg-grey-lighten-3"
                              >
                                <v-img
                                  v-if="formPIC[field.name]"
                                  :src="
                                    formPIC[field.name].includes('http')
                                      ? formPIC[field.name]
                                      : BASE_URL + formPIC[field.name]
                                  "
                                />
                                <v-icon color="grey-darken-1" v-else size="50"
                                  >mdi-domain</v-icon
                                >
                              </v-avatar>
                            </template>
                            <template v-else-if="field.name == 'region_id'">
                              {{
                                formPIC["region"]
                                  ? formPIC["region"].name
                                  : formPIC[field.name]
                              }}
                            </template>
                            <template v-else-if="field.name == 'gender'">
                              {{
                                genders.find(
                                  (g) => g.name == formPIC[field.name]
                                )
                                  ? genders.find(
                                      (g) => g.name == formPIC[field.name]
                                    ).label
                                  : formPIC[field.name]
                              }}
                            </template>
                            <template v-else>
                              {{ formPIC[field.name] }}
                            </template>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="4">
                            <div style="border-bottom: 1px dotted #aaa"></div>
                          </td>
                        </tr>
                      </template>
                    </template>
                  </tbody>
                </table>
              </v-card-text>
            </v-card>

            <v-card
              elevation="0"
              rounded="lg"
              v-if="['owner', 'hrd'].includes(me.company_role)"
            >
              <v-toolbar class="bg-transparent">
                <v-toolbar-title>Member Info</v-toolbar-title>
                <v-spacer />
                <v-btn
                  v-if="me.company_role == 'owner'"
                  :to="{
                    path: '/admin/profile/employer/3',
                    query: { edit: 1 },
                  }"
                  color="primary"
                  size="small"
                  icon="mdi-pencil"
                />
              </v-toolbar>
              <v-divider></v-divider>
              <v-card-text class="px-0">
                <div
                  v-for="member in members"
                  :key="member.id"
                  class="member-item px-4"
                >
                  <div class="d-flex justify-space-between align-center py-4">
                    <!-- Member Info -->
                    <div class="d-flex align-center">
                      <v-avatar size="43" color="grey-lighten-3" class="mr-4">
                        <v-img
                          v-if="member.photo_url"
                          :src="BASE_URL + member.photo_url"
                          cover
                        ></v-img>
                        <span v-else class="text-title">{{
                          getInitials(member.full_name)
                        }}</span>
                      </v-avatar>

                      <div>
                        <div class="d-flex align-center">
                          <div class="font-weight-regular">
                            {{ member.full_name }}
                          </div>
                          <v-chip
                            v-if="member.company_role"
                            size="x-small"
                            :color="
                              member.company_role == 'owner'
                                ? 'warning'
                                : 'primary'
                            "
                            variant="flat"
                            class="ml-2"
                          >
                            {{ capitalizeFirstLetter(member.company_role) }}
                          </v-chip>
                        </div>

                        <div
                          class="d-flex align-center text-grey"
                          style="font-size: 12px"
                        >
                          <div
                            v-if="member.email"
                            class="d-flex align-center mr-4"
                          >
                            <v-icon size="16" class="mr-1"
                              >mdi-email-outline</v-icon
                            >
                            {{ member.email }}
                          </div>
                          <div v-if="member.phone" class="d-flex align-center">
                            <v-icon size="16" class="mr-1"
                              >mdi-phone-outline</v-icon
                            >
                            {{ member.phone }}
                          </div>
                        </div>

                        <div class="d-flex align-center mt-1 text-body-2">
                          <div
                            v-if="member.region?.name"
                            class="d-flex align-center mr-4"
                          >
                            <v-icon size="16" class="mr-1"
                              >mdi-map-marker-outline</v-icon
                            >
                            {{ member.region.name }}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Member Status -->
                    <div class="text-right">
                      <div
                        v-if="member.created_at"
                        class="text-grey"
                        style="font-size: 12px"
                      >
                        <v-icon size="16" class="mr-1"
                          >mdi-clock-outline</v-icon
                        >
                        Joined <br />{{ formatDate(member.created_at) }}
                      </div>
                    </div>
                  </div>
                  <v-divider></v-divider>
                </div>
                <div v-if="members.length === 0" class="text-center py-8">
                  <v-icon size="64" color="grey-lighten-1" class="mb-4">
                    mdi-account-group-outline
                  </v-icon>
                  <div class="text-h6 text-grey-darken-1">No Members Found</div>
                  <div class="text-body-2 text-grey">
                    There are no members in this company yet
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6" class="pt-0 mb-3">
            <v-card elevation="0" rounded="lg" style="min-height: 650px">
              <v-card-title>Company Info</v-card-title>
              <v-card-text>
                <table style="width: 100%">
                  <tbody>
                    <template v-for="field in fields" :key="field.name">
                      <template
                        v-if="
                          ![
                            'is_premium',
                            'industry_id',
                            'unique_url',
                            'photo_url',
                            'legal_type',
                            'number_of_employees',
                            'business_license',
                          ].includes(field.name)
                        "
                      >
                        <tr>
                          <td valign="top" class="py-1 pr-2">
                            {{ field.label }}
                          </td>
                          <td valign="top" class="pa-1">:</td>
                          <td valign="top" class="py-1 pl-2">
                            <template v-if="field.name == 'logo_url'">
                              <v-avatar
                                rounded="lg"
                                size="70"
                                class="bg-grey-lighten-3"
                              >
                                <v-img
                                  v-if="form[field.name]"
                                  :src="BASE_URL + form[field.name]"
                                />
                                <v-icon color="grey-darken-1" v-else size="50"
                                  >mdi-domain</v-icon
                                >
                              </v-avatar>
                            </template>
                            <template v-else-if="field.name == 'region_id'">
                              {{
                                form["region"]
                                  ? form["region"].name
                                  : form[field.name]
                              }}
                            </template>
                            <template v-else-if="field.name == 'industry'">
                              {{
                                form["industri"]
                                  ? form["industri"].name
                                  : form[field.name]
                              }}
                            </template>
                            <template v-else-if="field.name == 'is_verified'">
                              {{ form[field.name] ? "Verified" : "Unverified" }}
                            </template>
                            <template v-else>
                              {{ form[field.name] }}
                            </template>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="4">
                            <div style="border-bottom: 1px dotted #aaa"></div>
                          </td>
                        </tr>
                      </template>
                    </template>
                  </tbody>
                </table>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Loop through fields and conditionally render based on field type -->
        </v-row>
      </v-card-text>
    </form>
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
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();

const form = ref({}); // Form data object
const formPIC = ref({}); // Form data object
const isFormValid = ref(false); // Track form validation status
const mode = ref("update"); // Mode for the form, can be "create" or "update"
const entity = ref("mst-companies");
const isShowFields = ref(false);
const loading = ref(true);

// Define fields with configuration
const fieldsOld = ref([
  {
    name: "firebase_uid",
    label: "Firebase UID",
    type: "text",
    rules: [(v) => !!v || "Firebase UID is required"],
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    inputType: "email",
    rules: [
      (v) => !!v || "Email is required",
      (v) => /.+@.+\..+/.test(v) || "Must be a valid email",
    ],
    required: true,
  },
  {
    name: "user_role",
    label: "User Role",
    type: "select",
    options: ["user", "admin", "manager"],
    rules: [(v) => !!v || "User role is required"],
    required: true,
  },
  {
    name: "company_id",
    label: "Company ID",
    type: "text",
    rules: [
      (v) =>
        v ? /^[0-9a-fA-F-]{36}$/.test(v) || "Must be a valid UUID" : true,
    ],
  },
  {
    name: "company_role",
    label: "Company Role",
    type: "select",
    options: ["owner", "member", "admin"],
  },
  {
    name: "full_name",
    label: "Full Name",
    type: "text",
    rules: [(v) => !!v || "Full name is required"],
    required: true,
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["male", "female", "other"],
  },
  {
    name: "personal_summary",
    label: "Personal Summary",
    type: "textarea",
  },
  {
    name: "availability",
    label: "Availability",
    type: "select",
    options: ["full-time", "part-time", "contract"],
  },
]);

const fields = useState(`${entity.value}fields`, () => []);
const fieldsPIC = useState(`usersfields`, () => []);
const genders = useState("genders", () => []);
const fetchGenders = async () => {
  const response = await $apiFetch(`/configs/key/gender`);
  genders.value = response.value;
};

const errors = ref({});
const errorsPIC = ref({});

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const handleInputRegion = (event) => {
  debouncedFetchRegions(event.target.value);
};

const { users, debouncedFetchUsers, userLoading, fetchUsers } = useUserSearch();
const handleInputUser = (event) => {
  debouncedFetchUsers(event.target.value, ["full_name", "email"]);
};

const { models, debouncedFetch, fetch } = useDynamicSearch([
  "salary_country",
  "industry",
  "company",
  "profession_parent",
  "invoice",

  "skill",
  "group",
  "paket",
  "school",
  "interest",
  "language",
  "profession",
  "right_to_work",
  "subscription",

  "event",
  "job",
]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};

const setAutoComplete = (field) => {
  if (form.value[field.name]) {
    if (field.name == "region_id") {
      fetchRegions(form.value[field.name], "id");
    }
    if (["user_id", "following_id"].includes(field.name)) {
      fetchUsers(form.value[field.name], ["id"]);
    }
    if (field.name == "salary_country_id") {
      fetch(
        "salary_country",
        form.value[field.name],
        ["id"],
        "mst-salary-country"
      );
    }
    if (
      [
        "skill_id",
        "school_id",
        "interest_id",
        "language_id",
        "profession_id",
        "right_to_work_id",
        "subscription_id",
      ].includes(field.name)
    ) {
      fetch(
        `${field.name.slice(0, -3)}`,
        form.value[field.name],
        ["id"],
        `mst-${field.name.slice(0, -3)}s`
      );
    }
    if (
      ["interest_ids", "profession_ids", "right_to_work_ids"].includes(
        field.name
      )
    ) {
      fetch(
        `${field.name.slice(0, -4)}`,
        form.value[field.name],
        ["id"],
        `mst-${field.name.slice(0, -4)}s`
      );
    }
    if (["job_id", "event_id", "group_id", "invoice_id"].includes(field.name)) {
      fetch(
        `${field.name.slice(0, -3)}`,
        form.value[field.name],
        ["id"],
        `${field.name.slice(0, -3)}s`
      );
    }
    if (field.name == "group_id") {
      fetch("group", form.value[field.name], ["id"], "groups");
    }
    if (field.name == "paket_id") {
      fetch("paket", form.value[field.name], ["id"], "event-pakets");
    }
    if (field.name == "invoice_id") {
      fetch("invoice", form.value[field.name], ["id"], "invoices");
    }
    if (field.name == "company_id") {
      fetch("company", form.value[field.name], ["id"], "mst-companies");
    }
    if (field.name == "parent_id" && entity == "mst-professions") {
      fetch(
        "parent_profession",
        form.value[field.name],
        ["id"],
        "mst-professions"
      );
    }
  }
};

const loadFields = async () => {
  let items = fields.value;
  if (!items.length) {
    items = await $apiFetch(`/fields/${entity.value}`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fields.value.push(item);
        errors.value[item.name] = [];
      });
    }
  }

  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

const loadFieldsPIC = async () => {
  let items = fieldsPIC.value;
  if (!items.length) {
    items = await $apiFetch(`/fields/users`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fieldsPIC.value.push(item);
        errorsPIC.value[item.name] = [];
      });
    }
  }
  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

const loadFieldsPICEncrypted = async () => {
  let items = fieldsPIC.value;
  console.log(items);
  if (!items.find((x) => x.name == "encrypted_phone")) {
    items = await $apiFetch(`/fields/encrypted-user-data`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fieldsPIC.value.push(item);
        errorsPIC.value[item.name] = [];
      });
    }
  }

  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

// Initialize form data with either empty values (for create) or predefined values (for update)
const initializeForm = (data = null) => {
  //Object.assign(form.value, data);
  fields.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    form.value[field.name] = data && data[field.name] ? data[field.name] : ""; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          form.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          form.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      form.value[field.name] = data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    setAutoComplete(field);
  });

  if (data["region"]) {
    form.value["region"] = data["region"];
  }

  if (data["industri"]) {
    form.value["industry"] = data["industri"].name;
  }

  loading.value = false;
};

const initializeFormPIC = (data = null) => {
  //Object.assign(form.value, data);
  fieldsPIC.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    formPIC.value[field.name] =
      data && data[field.name] ? data[field.name] : ""; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          formPIC.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          formPIC.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      formPIC.value[field.name] =
        data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    if (data["region"]) {
      formPIC.value["region"] = data["region"];
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

const initializeFormPICEncrypted = (data = null) => {
  //Object.assign(form.value, data);
  fieldsPIC.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    formPIC.value[field.name] =
      data && data[field.name] ? data[field.name] : formPIC.value[field.name]; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          formPIC.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          formPIC.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      formPIC.value[field.name] =
        data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

const members = ref([]);
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
        sortBy: { company_role: "DESC" },
      },
    });
    members.value = response.items;
  } catch (error) {
    console.error("Error fetching members:", error);
  } finally {
    loadingInitial.value = false;
  }
};
const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};
const { me, fetchMe } = useUser();

// Initialize form based on mode

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchGenders();
  loadFields();
  loadFieldsPIC();
  loadFieldsPICEncrypted();

  if (mode.value === "update" && me.value.company_id) {
    fetchMembers();
    $apiFetch(`/${entity.value}/search`, {
      params: {
        filters: {
          id: me.value.company_id,
        },
        expands: "region,industri",
      },
    }).then((data) => {
      if (data.items && data.items[0]) {
        initializeForm(data.items[0]); // Load existing data if in update mode
      }
    });
    $apiFetch(`/users/search`, {
      params: {
        filters: {
          id: me.value.id,
          company_id: me.value.company_id,
          //company_role: "owner",
        },
        expands: "region",
      },
    }).then((data) => {
      if (data.items && data.items[0]) {
        initializeFormPIC(data.items[0]); // Load existing data if in update mode
        $apiFetch(`/encrypted-user-data/search`, {
          params: {
            filters: {
              user_id: data.items[0].id,
            },
          },
        }).then((data) => {
          if (data.items && data.items[0]) {
            initializeFormPICEncrypted(data.items[0]); // Load existing data if in update mode
          }
        });
      }
    });
  } else {
    loadingInitial.value = false;
  }
});

// Submit handler
const submitLoading = ref(false);
const providerErrors = ref([]);
const onSubmit = async () => {
  Object.keys(errors.value).forEach((key) => {
    errors.value[key] = [];
  });
  console.log(form.value);
  Object.keys(form.value).forEach((key) => {
    if (
      !form.value[key] &&
      form.value[key] !== 0 &&
      form.value[key] !== false
    ) {
      delete form.value[key];
    }
  });

  try {
    submitLoading.value = true;
    if (mode.value === "create") {
      await $apiFetch(`/${entity.value}`, {
        method: "POST",
        body: form.value,
      });
      console.log("Creating entry:", form.value);
    } else {
      delete form.value.id;
      await $apiFetch(`/${entity.value}/${route.query.id}`, {
        method: "PATCH",
        body: form.value,
      });
      console.log("Updating entry:", form.value);
    }
    submitLoading.value = false;
    // Optionally, redirect after form submission
    router.back();
  } catch (error) {
    submitLoading.value = false;
    console.log(error.response);
    if (
      error.response &&
      error.response._data &&
      error.response._data.message
    ) {
      const errorMessages = error.response._data.message;
      if (Array.isArray(errorMessages)) {
        Object.keys(errors.value).forEach((key) => {
          errorMessages.forEach((errMsg) => {
            if (errMsg.includes(key)) {
              errors.value[key].push(errMsg);
            }
          });
        });
      } else {
        providerErrors.value.push(errorMessages);
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
    }
  }
};

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTimeAgo = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};
</script>

<style scoped>
.member-item:hover {
  background-color: rgb(245, 245, 245);
}

.member-item:last-child .v-divider {
  display: none;
}
</style>
