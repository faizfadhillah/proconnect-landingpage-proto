<template>
  <v-container fluid grid-list-md>
    <v-row>
      <v-breadcrumbs
        class="mb-3"
        :items="[
          {
            title: 'dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'candidates',
            disabled: false,
            to: '/admin/candidates',
          },
          {
            title: 'view',
            disabled: true,
            to: `/admin/candidates/view`,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <v-card-actions class="pl-0 pr-1 py-0">
      <v-icon @click="$router.back()" color="primary">mdi-chevron-left</v-icon
      >CANDIDATE INFORMATION
      <v-spacer />
    </v-card-actions>
  </v-container>
  <v-container fluid grid-list-md class="mt-0 pt-0">
    <form @submit.prevent="onSubmit">
      <v-card-text class="px-1 pt-0">
        <v-row grid-list-lg dense>
          <v-col v-if="loading">
            <v-card elevation="0" rounded="xl">
              <v-skeleton-loader
                cols="12"
                v-for="n in 8"
                type="list-item-two-line"
              ></v-skeleton-loader>
            </v-card>
          </v-col>
          <template v-else>
            <v-col cols="12" class="mb-3">
              <v-avatar rounded="lg" size="150" class="bg-grey">
                <v-img v-if="form['photo_url']" :src="form['photo_url']" />
                <v-icon color="grey-darken-1" v-else size="50"
                  >mdi-account</v-icon
                >
              </v-avatar>
            </v-col>
            <v-col cols="12" class="pt-0">
              <h3 class="mb-2">Personal Detail</h3>
              <v-card elevation="0" rounded="xl">
                <v-card-text>
                  <table style="width: 100%">
                    <tbody>
                      <template v-for="field in fields" :key="field.name">
                        <template
                          v-if="
                            [
                              'full_name',
                              'email',
                              'region_id',
                              'other_country',
                              'other_region',
                              'postal_code',
                              'gender',
                              'encrypted_date_of_birth',
                              'encrypted_phone',
                              'encrypted_address',
                            ].includes(field.name)
                          "
                        >
                          <tr>
                            <td valign="top" class="py-1 pr-2">
                              {{
                                field.label
                                  .replace("Encrypted", "")
                                  .replace("Region Id", "City")
                              }}
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
                                    :src="form[field.name]"
                                  />
                                  <v-icon color="grey-darken-1" v-else size="50"
                                    >mdi-domain</v-icon
                                  >
                                </v-avatar>
                              </template>
                              <template v-else-if="field.name == 'region_id'">
                                {{
                                  form.region
                                    ? form.region.name
                                    : form[field.name]
                                }}
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
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Career History</h3>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="n in 3"
                  v-if="itemLoading['user-career-history']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col
                  cols="12"
                  v-else-if="!form['user-career-history'].length"
                >
                  Not specified
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="item in form['user-career-history']"
                >
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <h4 class="mb- ml-1">
                        {{
                          item.profession
                            ? item.profession.name
                            : item.profession_id
                        }}
                      </h4>
                      <table>
                        <tbody>
                          <tr>
                            <td><v-icon color="grey">mdi-domain</v-icon></td>
                            <td class="pl-2">
                              {{ item.company_name }}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <v-icon color="grey">mdi-clock-time-four</v-icon>
                            </td>
                            <td class="pl-2">
                              {{ item.start_date }} =>
                              {{ item.is_current ? "current" : item.end_date }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Education History</h3>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="n in 3"
                  v-if="itemLoading['user-educations']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col cols="12" v-else-if="!form['user-educations'].length">
                  Not specified
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="item in form['user-educations']"
                >
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <h4 class="mb-1 ml-1">
                        {{ item.education_degree }} - {{ item.major }}
                      </h4>
                      <table>
                        <tbody>
                          <tr>
                            <td><v-icon color="grey">mdi-town-hall</v-icon></td>
                            <td class="pl-2">
                              {{ item.institution_name }}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <v-icon color="grey">mdi-clock-time-four</v-icon>
                            </td>
                            <td class="pl-2">
                              {{ item.start_date }} =>
                              {{ item.is_current ? "current" : item.end_date }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Licence / Certificates</h3>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="n in 3"
                  v-if="itemLoading['user-certificates']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col cols="12" v-else-if="!form['user-certificates'].length">
                  Not specified
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  v-for="item in form['user-certificates']"
                >
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <h4 class="mb-1 ml-1">
                        {{ item.license_name }}
                      </h4>
                      <table>
                        <tbody>
                          <tr>
                            <td><v-icon color="grey">mdi-town-hall</v-icon></td>
                            <td class="pl-2">
                              {{ item.issuing_organization }}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <v-icon color="grey">mdi-clock-time-four</v-icon>
                            </td>
                            <td class="pl-2">
                              {{ item.issue_date }} =>
                              {{
                                item.no_expiry ? item.expiry_date : "unlimited"
                              }}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <v-icon color="grey">mdi-file</v-icon>
                            </td>
                            <td class="pl-2">{{ item.file_url }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Skill List</h3>

              <v-skeleton-loader
                v-if="itemLoading['user-skills']"
                class="pa-0"
                type="button, button, button, button, button"
              ></v-skeleton-loader>
              <p v-else-if="!form['user-skills'].length">Not specified</p>
              <v-chip-group
                selected-class="text-primary"
                class="py-0 v-chip-profile"
                column
              >
                <v-chip
                  label
                  v-for="item in form['user-skills']"
                  style="background: #fff"
                  :key="item.id"
                >
                  {{ item.skill.name }}
                </v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Mastered Language</h3>

              <v-skeleton-loader
                v-if="itemLoading['user-languages']"
                class="pa-0"
                type="button, button, button, button, button"
              ></v-skeleton-loader>
              <p v-else-if="!form['user-languages'].length">Not specified</p>
              <v-chip-group
                selected-class="text-primary"
                class="py-0 v-chip-profile"
                column
              >
                <v-chip
                  label
                  v-for="item in form['user-languages']"
                  style="background: #fff"
                  :key="item.id"
                >
                  {{ item.language.name }}
                </v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Right To Works</h3>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="n in 3"
                  v-if="itemLoading['user-right-to-works']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col
                  cols="12"
                  v-else-if="!form['user-right-to-works'].length"
                >
                  Not specified
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  v-for="item in form['user-right-to-works']"
                >
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <h4 class="mb-1">
                        {{ item.salary_country.country_name }}
                      </h4>
                      <p>{{ item.right_to_work.name }}</p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Employment Status</h3>
              <p v-if="!form['employment_status'].split(',').length">
                Not specified
              </p>
              <v-chip-group
                selected-class="text-primary"
                class="py-0 v-chip-profile"
                column
              >
                <v-chip
                  label
                  v-for="item in form['employment_status'].split(',')"
                  style="background: #fff"
                  :key="item"
                >
                  {{ item }}
                </v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Domicile Status</h3>
              <p v-if="!form['domicile_status'].split(',').length">
                Not specified
              </p>
              <v-chip-group
                selected-class="text-primary"
                class="py-0 v-chip-profile"
                column
              >
                <v-chip
                  label
                  v-for="item in form['domicile_status'].split(',')"
                  style="background: #fff"
                  :key="item"
                >
                  {{ item }}
                </v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Salary Expetation</h3>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="n in 3"
                  v-if="itemLoading['user-salary-country']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col
                  cols="12"
                  v-else-if="!form['user-salary-country'].length"
                >
                  Not specified
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  v-for="item in form['user-salary-country']"
                >
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <h4 class="mb-1">
                        {{ item.salary_country.country_name }}
                      </h4>
                      <p>
                        {{ item.salary_country.currency_code }}
                        {{ formatNumber(item.min_salary) }} -
                        {{ item.salary_country.currency_code }}
                        {{ formatNumber(item.max_salary) }}
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Availibility</h3>
              <p v-if="!form['availability'].split(',').length">
                Not specified
              </p>
              <v-chip-group
                selected-class="text-primary"
                class="py-0 v-chip-profile"
                column
              >
                <v-chip
                  label
                  v-for="item in form['availability'].split(',')"
                  style="background: #fff"
                  :key="item"
                >
                  {{ item }}
                </v-chip>
              </v-chip-group>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Interests</h3>
              <v-row>
                <v-col
                  cols="12"
                  v-for="n in 1"
                  v-if="itemLoading['user-interests']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col cols="12" v-else-if="!form['user-interests'].length">
                  Not specified
                </v-col>
                <v-col cols="12" v-else>
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <ul class="ml-3">
                        <li v-for="item in form['user-interests']">
                          {{ item.interest.name }}
                        </li>
                      </ul>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h3 class="mb-2 mt-3">Skill Passports - MRA-TP Standard</h3>
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                  md="4"
                  v-for="n in 3"
                  v-if="itemLoading['user-skill-passports']"
                >
                  <v-skeleton-loader
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col
                  cols="12"
                  v-else-if="!form['user-skill-passports'].length"
                >
                  Not specified
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  v-for="item in form['user-skill-passports']"
                >
                  <v-card elevation="0" rounded="lg">
                    <v-card-text>
                      <h4 class="mb-1 ml-1">NO. {{ item.number }}</h4>
                      <table>
                        <tbody>
                          <tr>
                            <td>
                              <v-icon color="grey">mdi-file</v-icon>
                            </td>
                            <td class="pl-2">{{ item.file_url }}</td>
                          </tr>
                          <tr>
                            <td>
                              <v-icon
                                color="green"
                                v-if="item.status == 'VERIFIED'"
                                >mdi-check-circle</v-icon
                              >
                              <v-icon color="grey" v-else
                                >mdi-clock-time-four</v-icon
                              >
                            </td>
                            <td class="pl-2">
                              {{ item.status }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12" style="display: none">
              <v-card elevation="0" rounded="xl">
                <v-card-title>PIC Info</v-card-title>
                <v-card-text>
                  <table>
                    <tbody>
                      <template v-for="field in fields" :key="field.name">
                        <tr
                          v-if="
                            !['is_verified', 'is_premium'].includes(field.name)
                          "
                        >
                          <td>{{ field.label }}</td>
                          <td>:</td>
                          <td>{{ form[field.name] }}</td>
                          <td></td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </v-card-text>
              </v-card>
            </v-col>
          </template>

          <!-- Loop through fields and conditionally render based on field type -->
        </v-row>
      </v-card-text>
    </form>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});
// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();

const form = ref({}); // Form data object
const isFormValid = ref(false); // Track form validation status
const mode = ref(route.query.id ? "update" : "create"); // Mode for the form, can be "create" or "update"
const entity = ref("users");
const isShowFields = ref(false);
const loading = ref(true);

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-US").format(value);
};
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
const errors = ref({});

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

const loadFieldsEncrypted = async () => {
  let items = fields.value;
  if (!items.find((x) => x.name == "encrypted_phone")) {
    items = await $apiFetch(`/fields/encrypted-user-data`);
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
  loading.value = false;
};

const initializeFormEncrypted = (data = null) => {
  //Object.assign(form.value, data);
  fields.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    form.value[field.name] =
      data && data[field.name] ? data[field.name] : form.value[field.name]; // Set existing data or empty

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
  loading.value = false;
};

const itemLoading = ref({
  "user-career-history": true,
  "user-educations": true,
  "user-certificates": true,
  "user-skills": true,
  "user-skill-passports": true,
  "user-languages": true,
  "user-right-to-works": true,
  "user-interests": true,
  "user-salary-country": true,
});
// Initialize form based on mode
onMounted(async () => {
  await loadFields();
  await loadFieldsEncrypted();
  if (mode.value === "update") {
    setTimeout(async () => {
      $apiFetch(`/${entity.value}/search`, {
        params: { id: route.query.id, expands: "region" },
      }).then((data) => {
        if (data.items && data.items[0]) {
          initializeForm(data.items[0]); // Load existing data if in update mode
          form.value["region"] = data.items[0]["region"];
          $apiFetch(`/encrypted-user-data/search`, {
            params: {
              filters: {
                user_id: data.items[0].id,
              },
            },
          }).then((data) => {
            if (data.items && data.items[0]) {
              initializeFormEncrypted(data.items[0]);
            }
          });
        }

        Object.keys(itemLoading.value).forEach((key) => {
          let expands = "";
          switch (key) {
            case "user-career-history":
              expands = "profession,company";
              break;
            case "user-skills":
              expands = "skill";
              break;
            case "user-languages":
              expands = "language";
              break;
            case "user-right-to-works":
              expands = "right_to_work,salary_country";
              break;
            case "user-interests":
              expands = "interest";
              break;
            case "user-salary-country":
              expands = "salary_country";
              break;
          }
          $apiFetch(`/${key}/search`, {
            params: {
              filters: {
                user_id: route.query.id,
              },
              expands: expands,
              sortBy: { created_at: "desc" },
            },
          }).then((data) => {
            form.value[key] = data.items;
            itemLoading.value[key] = false;
          });
        });
      });
    }, 100);
  } else {
    initializeForm(); // Start with empty form for create mode
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
</script>
