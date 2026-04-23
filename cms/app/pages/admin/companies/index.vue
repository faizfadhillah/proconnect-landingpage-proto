<template>
  <v-container fluid>
    <!-- Filters Section -->

    <v-card elevation="0" rounded="lg">
      <v-card-title class="mb-3 font-weight-bold"> COMPANIES </v-card-title>
      <v-card-text>
        <v-row class="pr-1">
          <v-col cols="12" md="6">
            <v-row>
              <v-col cols="12" sm="6" md="6" v-if="!filterLoading">
                <v-select
                  v-model="filterField"
                  :items="allHeaders"
                  label="Search By"
                  hide-details
                  variant="outlined"
                  density="comfortable"
                  item-title="title"
                  item-value="key"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6" md="6">
                <v-text-field
                  v-model="searchInput"
                  label="Search"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  hide-details
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <template v-if="showFilter">
                <v-col
                  cols="6"
                  sm="4"
                  md="4"
                  v-for="key in Object.keys(filterEnum)"
                >
                  <v-select
                    v-model="filters[key]"
                    :items="filterEnum[key]"
                    :label="key"
                    item-title="key"
                    item-value="value"
                    clearable
                    hide-details
                    variant="outlined"
                    density="comfortable"
                    multiple=""
                  ></v-select>
                </v-col>
                <template v-for="field in allFields">
                  <v-col cols="6" md="4" v-if="field.name == 'region_id'">
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      color="primary"
                      @keyup="handleInputRegion"
                      :items="regions"
                      :loading="regionLoading"
                      item-title="full_name"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="6" md="4" v-if="field.name == 'company_id'">
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      @keyup="
                        handleInput(
                          $event,
                          'company',
                          ['company_name'],
                          'mst-companies'
                        )
                      "
                      :items="models['company'].items"
                      :loading="models['company'].loading"
                      item-title="company_name"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col
                    cols="6"
                    sm="4"
                    md="4"
                    v-if="field.name == 'industry_id'"
                  >
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      @keyup="
                        handleInput(
                          $event,
                          'industry',
                          ['name'],
                          'mst-industries'
                        )
                      "
                      :items="models['industry'].items"
                      :loading="models['industry'].loading"
                      item-title="name"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col cols="6" md="4" v-if="field.name == 'invoice_id'">
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      @keyup="
                        handleInput(
                          $event,
                          'invoice',
                          ['invoice_number'],
                          'mst-invoices'
                        )
                      "
                      :items="models['invoice'].items"
                      :loading="models['invoice'].loading"
                      item-title="invoice_number"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col
                    cols="6"
                    md="4"
                    v-if="
                      field.name == 'parent_id' && entity == 'mst-professions'
                    "
                  >
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      @keyup="
                        handleInput(
                          $event,
                          'profession_parent',
                          ['name'],
                          'mst-professions'
                        )
                      "
                      :items="models['profession_parent'].items"
                      :loading="models['profession_parent'].loading"
                      item-title="name"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col
                    cols="6"
                    md="4"
                    v-else-if="field.name == 'salary_country_id'"
                  >
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      color="primary"
                      @keyup="
                        handleInput(
                          $event,
                          'salary_country',
                          ['country_name'],
                          'mst-salary-country'
                        )
                      "
                      :items="models['salary_country'].items"
                      :loading="models['salary_country'].loading"
                      item-title="country_name"
                      item-value="id"
                      hide-details
                      hide-no-data
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col
                    cols="6"
                    md="4"
                    v-else-if="['user_id', 'following_id'].includes(field.name)"
                  >
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      color="primary"
                      @keyup="handleInputUser"
                      :items="users"
                      :loading="userLoading"
                      item-value="id"
                      item-title="full_name"
                      hide-details
                    >
                      <template v-slot:item="{ props, item }">
                        <v-list-item
                          v-bind="props"
                          :subtitle="item.raw.email"
                          :title="item.raw.full_name"
                        ></v-list-item>
                      </template>

                      <!-- Custom Selection Display -->
                      <template v-slot:selection="{ item, props }">
                        <v-chip
                          v-if="item.raw.full_name"
                          v-bind="props"
                          color="primary"
                          class="px-1"
                          label
                          small
                        >
                          {{ item.raw.full_name }} - {{ item.raw.email }}
                        </v-chip>
                      </template>
                    </v-autocomplete>
                  </v-col>
                  <v-col
                    cols="6"
                    md="4"
                    v-if="
                      [
                        'skill_id',
                        'group_id',
                        'paket_id',
                        'school_id',
                        'interest_id',
                        'language_id',
                        'profession_id',
                        'right_to_work_id',
                        'subscription_id',
                      ].includes(field.name)
                    "
                  >
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      @keyup="
                        handleInput(
                          $event,
                          `${field.name.slice(0, -3)}`,
                          ['name'],
                          `${
                            field.name == 'paket_id'
                              ? 'event'
                              : field.name != 'group_id'
                              ? 'mst'
                              : ''
                          }-${field.name.slice(0, -3)}s`
                        )
                      "
                      :items="models[`${field.name.slice(0, -3)}`].items"
                      :loading="models[`${field.name.slice(0, -3)}`].loading"
                      item-title="name"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                  <v-col
                    cols="6"
                    md="4"
                    v-if="['job_id', 'event_id'].includes(field.name)"
                  >
                    <v-autocomplete
                      v-model="filters[field.name]"
                      :label="field.label"
                      :type="field.inputType || 'text'"
                      :placeholder="field.placeholder || ''"
                      :clearable="true"
                      variant="outlined"
                      density="comfortable"
                      @keyup="
                        handleInput(
                          $event,
                          `${field.name.slice(0, -3)}`,
                          ['title'],
                          `${field.name.slice(0, -3)}s`
                        )
                      "
                      :items="models[`${field.name.slice(0, -3)}`].items"
                      :loading="models[`${field.name.slice(0, -3)}`].loading"
                      item-title="title"
                      item-value="id"
                      hide-no-data
                      hide-details
                    >
                    </v-autocomplete>
                  </v-col>
                </template>
              </template>
            </v-row>
          </v-col>

          <v-col cols="12" md="6" style="overflow-x: auto">
            <v-card-actions class="px-0 pt-0">
              <v-btn
                color="primary"
                prepend-icon="mdi-filter"
                :append-icon="showFilter ? 'mdi-menu-up' : 'mdi-menu-down'"
                class="mr-2 px-3"
                variant="elevated"
                height="47"
                rounded="lg"
                @click="showFilter = !showFilter"
              >
                Filter
              </v-btn>
              <v-spacer></v-spacer>

              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" v-bind="props"></v-btn>
                </template>

                <v-list>
                  <v-list-item @click="handleExportData">
                    <v-list-item-title>Export to Excel</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="importDialog.attributes.dialog = true">
                    <v-list-item-title>Import from Excel</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>

              <VImportXlsDialog
                @export-data="handleExportData"
                @import-data="handleImportData"
                ref="importDialog"
              />

              <v-btn
                color="primary"
                prepend-icon="mdi-table-column-plus-after"
                class="px-3"
                variant="elevated"
                height="47"
                rounded="lg"
                @click="columnSelectionDialog = true"
              >
                Columns
              </v-btn>

              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                variant="elevated"
                height="47"
                rounded="lg"
                :to="`/admin/companies/form`"
              >
                Add {{ entity }}
              </v-btn>
            </v-card-actions>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-data-table-server
          class="blue-lighten-5 rounded-lg border"
          v-model:items-per-page="itemsPerPage"
          v-model:page="page"
          :headers="visibleHeaders"
          :items="items"
          :items-length="totalitems"
          :loading="loading || first"
          :search="filters.search"
          :sort-by="sortBy"
          multi-sort
          @update:options="debouncedLoadItems"
        >
          <!-- Custom column rendering -->
          <template v-slot:item.index="{ index }">
            {{ (page - 1) * itemsPerPage + index + 1 }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-pencil"
              variant="text"
              size="small"
              color="primary"
              density="compact"
              :to="`/admin/companies/form?id=${item.id}`"
              class="mr-1"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              size="small"
              density="compact"
              color="error"
              @click="confirmDeleteUser(item)"
            ></v-btn>
          </template>

          <template v-slot:item.brand_name="{ item }">
            <router-link
              :to="`/admin/companies/view?id=${item.id}`"
              style="text-decoration: none"
            >
              {{ item.brand_name }}
            </router-link>
          </template>
          <template v-slot:item.company_name="{ item }">
            {{ item.company_name }}
          </template>
          <template v-slot:item.website="{ item }">
            <a v-if="item.website" target="_blank" :href="item.website">{{
              item.website
            }}</a>
          </template>
          <template v-slot:item.user_role="{ item }">
            <v-chip
              :color="getUserRoleColor(item.user_role)"
              size="small"
              label
            >
              {{ item.user_role }}
            </v-chip>
          </template>

          <template v-slot:item.company_role="{ item }">
            <v-chip
              :color="getCompanyRoleColor(item.company_role)"
              size="small"
              label
            >
              {{ item.company_role }}
            </v-chip>
          </template>
          <template v-slot:item.region_id="{ item }">
            {{ item.region ? item.region.name : item.region_id }}
          </template>
          <template v-slot:item.user_id="{ item }">
            {{
              item.user
                ? item.user.full_name + " - " + item.user.email
                : item.user_id
            }}
          </template>
          <template v-slot:item.salary_country_id="{ item }">
            {{
              item.salary_country
                ? item.salary_country.country_name +
                  ` (${item.salary_country.currency_code})`
                : item.salary_country_id
            }}
          </template>

          <template v-slot:item.applicant_id="{ item }">
            {{
              item.applicant
                ? item.applicant.name || item.applicant_id
                : item.applicant_id
            }}
          </template>
          <template v-slot:item.job_id="{ item }">
            {{ item.job ? item.job.title : item.job_id }}
          </template>
          <template v-slot:item.company_id="{ item }">
            {{ item.company ? item.company.company_name : item.company_id }}
          </template>
          <template v-slot:item.industry_id="{ item }">
            {{ item.industry ? item.industry.name : item.industry_id }}
          </template>
          <template v-slot:item.event_id="{ item }">
            {{ item.event ? item.event.title : item.event_id }}
          </template>
          <template v-slot:item.invoice_id="{ item }">
            {{ item.invoice ? item.invoice.invoice_number : item.invoice_id }}
          </template>
          <template v-slot:item.parent_id="{ item }">
            <template v-if="entity == 'mst-companies'">
              <router-link
                :to="`/admin/companies/view?id=${item.parent_id}`"
                style="text-decoration: none"
                >{{
                  item.parent ? item.parent.company_name : item.parent_id
                }}</router-link
              >
            </template>
            <template v-else>
              {{ item.parent ? item.parent.name : item.parent_id }}
            </template>
          </template>

          <template v-slot:item.skill_id="{ item }">
            {{ item.skill ? item.skill.name : item.skill_id }}
          </template>
          <template v-slot:item.group_id="{ item }">
            {{ item.group ? item.group.name : item.group_id }}
          </template>
          <template v-slot:item.paket_id="{ item }">
            {{ item.paket ? item.paket.name : item.paket_id }}
          </template>
          <template v-slot:item.school_id="{ item }">
            {{ item.school ? item.school.name : item.school_id }}
          </template>
          <template v-slot:item.interest_id="{ item }">
            {{ item.interest ? item.interest.name : item.interest_id }}
          </template>
          <template v-slot:item.language_id="{ item }">
            {{ item.language ? item.language.name : item.language_id }}
          </template>
          <template v-slot:item.job_description="{ item }">
            {{
              item.job_description.length > 100
                ? item.job_description.substr(0, 100) + "..."
                : item.job_description
            }}
          </template>
          <template v-slot:item.profession_id="{ item }">
            {{ item.profession ? item.profession.name : item.profession_id }}
          </template>
          <template v-slot:item.right_to_work_id="{ item }">
            {{
              item.right_to_work
                ? item.right_to_work.name
                : item.right_to_work_id
            }}
          </template>
          <template v-slot:item.subscription_id="{ item }">
            {{
              item.subscription ? item.subscription.name : item.subscription_id
            }}
          </template>
          <template v-slot:item.photo_url="{ item }">
            <a
              :href="
                item.photo_url.includes('http')
                  ? item.photo_url
                  : BASE_URL + item.photo_url
              "
              target="_blank"
              v-if="item.photo_url"
            >
              <v-avatar color="grey" size="40" rounded="lg">
                <v-img
                  :src="
                    item.photo_url.includes('http')
                      ? item.photo_url
                      : BASE_URL + item.photo_url
                  "
                ></v-img>
              </v-avatar>
            </a>
          </template>
          <template v-slot:item.logo_url="{ item }">
            <a
              :href="
                item.logo_url.includes('http')
                  ? item.logo_url
                  : BASE_URL + item.logo_url
              "
              target="_blank"
              v-if="item.logo_url"
            >
              <v-avatar color="grey-lighten-2" size="40" rounded="lg">
                <v-img
                  :src="
                    item.logo_url.includes('http')
                      ? item.logo_url
                      : BASE_URL + item.logo_url
                  "
                >
                  <template v-slot:placeholder>
                    <v-icon color="grey-darken-1 mt-3">mdi-domain</v-icon>
                  </template>
                </v-img>
              </v-avatar>
            </a>
            <v-avatar v-else color="grey-lighten-2" size="40" rounded="lg">
              <v-icon color="grey-darken-1">mdi-domain</v-icon>
            </v-avatar>
          </template>
          <template v-slot:item.file_url="{ item }">
            <a :href="item.file_url" target="_blank" v-if="item.file_url">
              <v-icon color="orange">mdi-file</v-icon>
            </a>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="columnSelectionDialog" scrollable max-width="500">
      <v-card>
        <v-card-title>Manage Columns</v-card-title>
        <v-card-text class="py-0 px-3">
          <v-row class="px-3">
            <v-col
              cols="6"
              class="pa-0"
              v-for="header in allHeaders"
              :key="header.key"
            >
              <v-checkbox
                v-model="selectedColumns"
                column
                multiple
                :value="header.key"
                :label="header.title"
                hide-details
                density="compact"
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="elevated"
            color="primary"
            @click="columnSelectionDialog = false"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete {{ selectedUser?.full_name }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red" text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            text
            @click="deleteUser"
            :loading="deleteUserLoading"
            >Confirm</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

import { debounce } from "~/utils/debounce";
// Define state
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();
const items = ref([]);
const loading = ref(false);
const first = ref(true);
const totalitems = ref(0);
const page = ref(1);
const columnSelectionDialog = ref(false);
const deleteDialog = ref(false);
const showFilter = ref(false);
const selectedUser = ref(null);
const entity = ref("mst-companies");
const sortBy = useState(`${entity.value}sortBy`, () => []);
const itemsPerPage = useState(`itemsPerPage`, () => 10);
const { $apiFetch, $apiFetchRaw } = useApi();
const importDialog = ref(null);
const handleExportData = () => {
  loadItems({
    isExcel: true,
  });
  console.log("Exporting data...");
};
const handleImportData = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  importDialog.value.attributes.loading = true;
  $apiFetch(`/${entity.value}/import-xls`, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      alert("File uploaded successfully.");
      debouncedLoadItems({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value,
      });
      importDialog.value.attributes.dialog = false;
      importDialog.value.attributes.file = false;
    })
    .catch((error) => {
      alert("Failed to upload file. " + error);
    })
    .finally(() => {
      importDialog.value.attributes.loading = false;
    });
};

// Filters
const fields = useState(`${entity.value}fields`, () => []);
const filterEnum = ref({});
const filters = ref({});
const filterField = ref("");
const filterLoading = ref(true);

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const handleInputRegion = (event) => {
  debouncedFetchRegions(event.target.value);
};

const { users, debouncedFetchUsers, userLoading, fetchitems } = useUserSearch();
const handleInputUser = (event) => {
  debouncedFetchUsers(event.target.value);
};

const { models, debouncedFetch } = useDynamicSearch([
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

let allHeaders = useState(entity.value + "allHeaders", () => {
  return [
    {
      title: "Created At",
      key: "created_at",
      sortable: true,
    },
    {
      title: "Created By",
      key: "created_by",
      sortable: true,
    },
    {
      title: "Updated At",
      key: "updated_at",
      sortable: true,
    },
    {
      title: "Updated By",
      key: "updated_by",
      sortable: true,
    },
    { title: "Actions", key: "actions", sortable: false },
  ];
});
let allFields = ref([]);

const selectedColumns = useState(entity.value + "selectedColumns", () => {
  return ["index"];
});

const loadFields = async () => {
  let is_exist_columns = selectedColumns.value.length > 3 ? true : false;
  if (!is_exist_columns) {
    fields.value = await $apiFetch(`/fields/${entity.value}`);
  }
  const headers = [{ title: "No", key: "index", sortable: false }];
  if (Array.isArray(fields.value)) {
    filterLoading.value = false;
    fields.value.forEach((field, i) => {
      if (i < 8 && !is_exist_columns) {
        selectedColumns.value.push(field.name);
      }
      if (field.options.type == "enum") {
        filterEnum.value[field.name] = [];
        filters.value[field.name] = [];
        Object.keys(field.options.enum).forEach((key) => {
          filterEnum.value[field.name].push({
            key: key,
            value: field.options.enum[key],
          });
        });
      }
      if (field.name.endsWith("_id")) {
        filters.value[field.name] = "";
      } else {
        if (
          !filterField.value &&
          !field.name.includes("_url") &&
          !field.name.includes("encrypted_") &&
          field.name != "id"
        ) {
          filterField.value = field.name;
        }
      }
      if (
        [
          "logo_url",
          "brand_name",
          "parent_id",
          "branch",
          "company_name",
          "phone",
          "email",
          "website",
        ].includes(field.name)
      ) {
        headers.push({ title: field.label, key: field.name, sortable: true });
      }
    });
    if (!is_exist_columns) {
      selectedColumns.value.push("actions");
      allHeaders.value = [...new Set([...headers, ...allHeaders.value])];
    }
    setTimeout(() => {
      allFields.value = fields.value;
    }, 200);
  }
};
// Computed
const visibleHeaders = computed(() => {
  return allHeaders.value.filter((header) =>
    selectedColumns.value.includes(header.key)
  );
});

const userRoles = ["admin", "user", "manager"];
const companyRoles = ["owner", "member", "admin"];
const availabilityOptions = ["full-time", "part-time", "contract"];

const loadItems = async (options) => {
  if (filterLoading.value || loading.value) {
    return;
  }
  loading.value = true;
  try {
    Object.keys(filters.value).forEach((key) => {
      if (!filters.value[key] || filters.value[key] == searchInput.value) {
        delete filters.value[key];
      }
    });
    if (searchInput.value && filterField.value) {
      filters.value[filterField.value] = searchInput.value;
    }
    const relations = [];
    allHeaders.value.forEach((header) => {
      if (header.key.endsWith("_id")) {
        const relation = header.key.slice(0, -3);
        relations.push(relation);
      }
    });

    sortBy.value = options.sortBy;

    const params = {
      page: options.page,
      limit: options.itemsPerPage,
      sortBy: options.sortBy,
      filters: filters.value,
      expands: relations.join(","),
      isExcel: options.isExcel,
    };

    if (options.isExcel) {
      const response = await $apiFetchRaw(`/${entity.value}/search`, {
        method: "GET",
        params: params,
        responseType: "blob", // Ensure binary data is received
      });

      const blob = new Blob([response._data], {
        type: response.headers.get("Content-Type"),
      });

      const validMimeTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!validMimeTypes.includes(blob.type)) {
        alert("Template .xls is not available. Please contact your admin.");
        return;
      } else {
        const url = window.URL.createObjectURL(blob);

        // Create a temporary link element
        const a = document.createElement("a");
        a.href = url;
        a.download = `${entity.value}.xlsx`; // The default name for the file
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
      }

      // Create a URL for the downloaded file
    } else {
      const data = await $apiFetch(`/${entity.value}/search`, {
        params: params,
      });
      items.value = data.items;
      totalitems.value = data.meta.total;
    }
  } catch (error) {
    console.error("Error loading items:", error);
  } finally {
    loading.value = false;
    first.value = false;
  }
};

const debouncedLoadItems = debounce(loadItems, 200);

const confirmDeleteUser = (user) => {
  selectedUser.value = user;
  deleteDialog.value = true;
};

const deleteUserLoading = ref(false);
const deleteUser = async () => {
  if (selectedUser.value) {
    deleteUserLoading.value = true;
    // Perform the delete operation here
    const data = await $apiFetch(`/${entity.value}/` + selectedUser.value.id, {
      method: "DELETE",
    });
    console.log("Deleting user:", selectedUser.value);
    deleteDialog.value = false;
    deleteUserLoading.value = false;
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }
};

const getUserRoleColor = (role) => {
  const colors = {
    admin: "red",
    user: "blue",
    manager: "green",
  };
  return colors[role] || "grey";
};

const getCompanyRoleColor = (role) => {
  const colors = {
    owner: "purple",
    member: "cyan",
    admin: "orange",
  };
  return colors[role] || "grey";
};

const editUser = (item) => {
  console.log("Edit user:", item);
};

const exportData = () => {
  console.log("Exporting data...");
};

watch(
  () => ({
    filters: filters.value,
    filterField: filterField.value,
  }),
  () => {
    if (!loading.value) {
      page.value = 1;
      debouncedLoadItems({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value,
      });
    }
  },
  { deep: true }
);

const searchInput = ref("");
const debouncedSearch = debounce((value) => {
  if (filterField.value) {
    filters.value[filterField.value] = value;
  }
}, 500);

watch(searchInput, (newValue) => {
  debouncedSearch(newValue);
});

onMounted(() => {
  loadFields();
  filterLoading.value = false;
  loadItems({
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
});

onBeforeUnmount(() => {
  //debouncedSearch.cancel();
});
</script>
<style></style>
