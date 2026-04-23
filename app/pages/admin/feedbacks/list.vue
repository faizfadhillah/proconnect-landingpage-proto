<template>
  <v-container fluid>
    <!-- Filters Section -->

    <v-card elevation="0" rounded="lg">
      <v-card-title class="mb-3 font-weight-bold text-primary"
        >User Feedback</v-card-title
      >
      <v-card-text class="pb-0">
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between mb-4">
              <v-text-field
                v-model="searchInput"
                placeholder="Search feedback, user or email here"
                append-inner-icon="mdi-magnify"
                clearable
                class="mr-2 bg-white"
                variant="outlined"
                elevation="0"
                density="comfortable"
                rounded="lg"
                hide-details
                @keyup.enter.prevent="debouncedLoadItems"
                @keyup.prevent="debouncedLoadItems"
                @click:clear="debouncedLoadItems"
              ></v-text-field>

              <v-btn
                variant="outlined"
                size="large"
                @click="filterDialog = true"
                color="primary"
                height="48"
                rounded="lg"
                class="bg-white"
              >
                <span class="mr-2">Filter</span>
                <v-badge
                  v-if="activeFilterCount > 0"
                  :content="activeFilterCount"
                  color="error"
                  class="mr-2"
                >
                  <v-icon color="primary" icon="mdi-tune"></v-icon>
                </v-badge>
                <template v-else>
                  <v-icon color="primary" icon="mdi-tune"></v-icon>
                </template>
              </v-btn>
              <v-dialog v-model="filterDialog" max-width="600">
                <v-card rounded="lg">
                  <v-toolbar class="bg-transparent">
                    <v-toolbar-title>Filter</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn
                      icon="mdi-close"
                      @click="filterDialog = false"
                    ></v-btn>
                  </v-toolbar>
                  <v-divider></v-divider>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12">
                        <div class="mb-2" style="font-size: 14px">Type</div>
                        <v-row>
                          <v-col
                            cols="6"
                            v-for="type in feedbackTypes"
                            :key="type.name"
                            class="px-2 py-0"
                          >
                            <v-checkbox
                              v-model="filters.types"
                              :value="type.name"
                              hide-details
                              density="compact"
                              :label="type.label"
                              class="bg-white"
                              multiple
                            ></v-checkbox>
                          </v-col>
                        </v-row>
                      </v-col>
                      <v-col cols="12">
                        <div class="mb-2" style="font-size: 14px">Status</div>
                        <v-radio-group v-model="filters.status" hide-details>
                          <v-row>
                            <v-col cols="6" class="px-1 py-0">
                              <v-radio label="OPEN" value="OPEN"></v-radio>
                            </v-col>
                            <v-col cols="6" class="px-1 py-0">
                              <v-radio label="CLOSED" value="CLOSED"></v-radio>
                            </v-col>
                          </v-row>
                        </v-radio-group>
                      </v-col>
                      <v-col cols="12">
                        <div class="mb-2" style="font-size: 14px">
                          Created At
                        </div>
                        <div class="d-flex align-center">
                          <v-text-date
                            v-model="filters.date_start"
                            density="comfortable"
                            rounded="lg"
                            variant="outlined"
                            clearable
                          ></v-text-date>
                          <div class="mx-2 pb-5">-</div>
                          <v-text-date
                            v-model="filters.date_end"
                            density="comfortable"
                            rounded="lg"
                            variant="outlined"
                            clearable
                          ></v-text-date>
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                  <v-card-actions class="px-6 pb-6">
                    <v-spacer></v-spacer>
                    <v-btn
                      variant="outlined"
                      color="primary"
                      @click="resetFilters"
                      >Reset</v-btn
                    >
                    <v-btn
                      variant="elevated"
                      color="primary"
                      @click="applyFilters"
                      >Apply Filter</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-text>
        <v-card flat border rounded="lg">
          <v-data-table-server
            class="blue-lighten-5"
            v-model:items-per-page="itemsPerPage"
            v-model:page="page"
            :headers="allHeaders"
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
                style="display: none"
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="primary"
                density="compact"
                :to="`/admin/feedbacks/form?id=${item.id}`"
                class="mr-1"
              ></v-btn>
              <div class="d-flex">
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                  class="mr-1"
                  @click="showDetail(item)"
                  >Details</v-btn
                >
                <v-btn
                  v-if="item.status == 'OPEN'"
                  color="primary"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                  @click="closeTicket(item)"
                  >Close Ticket</v-btn
                >
                <v-btn
                  v-if="item.status == 'CLOSED'"
                  color="primary"
                  variant="outlined"
                  size="small"
                  rounded="lg"
                  @click="reOpenTicket(item)"
                  >Re-Open Ticket</v-btn
                >
              </div>
            </template>

            <template v-slot:item.company_name="{ item }">
              <router-link
                :to="`/admin/companies/view?id=${item.id}`"
                style="text-decoration: none"
                >{{ item.company_name }}</router-link
              >
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
            <template v-slot:item.email="{ item }">
              {{
                item.user
                  ? item.user.full_name + " - " + item.user.email
                  : item.email
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
              {{ item.parent ? item.parent.name : item.parent_id }}
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
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.status == 'OPEN' ? 'green' : 'grey'"
                size="small"
                label
                rounded="xl"
              >
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.description="{ item }">
              {{
                item.description.length > 100
                  ? item.description.substr(0, 100) + "..."
                  : item.description
              }}
            </template>
            <template v-slot:item.created_at="{ item }">
              {{ formatDateTimeShort(item.created_at) }}
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
                item.subscription
                  ? item.subscription.name
                  : item.subscription_id
              }}
            </template>
            <template v-slot:item.photo_url="{ item }">
              <a :href="item.photo_url" target="_blank" v-if="item.photo_url">
                <v-avatar color="grey" size="40" rounded="lg">
                  <v-img :src="item.photo_url"></v-img>
                </v-avatar>
              </a>
            </template>
            <template v-slot:item.logo_url="{ item }">
              <a :href="item.logo_url" target="_blank" v-if="item.logo_url">
                <v-avatar color="grey" size="40" rounded="lg">
                  <v-img :src="item.logo_url"></v-img>
                </v-avatar>
              </a>
            </template>
            <template v-slot:item.file_url="{ item }">
              <a :href="item.file_url" target="_blank" v-if="item.file_url">
                <v-icon color="orange">mdi-file</v-icon>
              </a>
            </template>
            <template v-slot:item.attachment_url="{ item }">
              <a
                :href="BASE_URL + item.attachment_url"
                target="_blank"
                v-if="item.attachment_url"
              >
                View Attachment
              </a>
            </template>
          </v-data-table-server>
        </v-card>
      </v-card-text>
    </v-card>
    <v-dialog v-model="detailDialog" max-width="600">
      <v-card rounded="lg">
        <v-toolbar class="bg-transparent">
          <v-toolbar-title> Feedback Details </v-toolbar-title>
          <v-chip color="primary"> Code : {{ selectedItem.code }} </v-chip>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="detailDialog = false"></v-btn>
        </v-toolbar>
        <v-divider></v-divider>
        <v-card-text>
          <table style="width: 100%; line-height: 2">
            <tbody>
              <tr>
                <td>Code</td>
                <td>:</td>
                <td>{{ selectedItem.code }}</td>
              </tr>
              <tr>
                <td>Created At</td>
                <td>:</td>
                <td>{{ formatDateTime(selectedItem.created_at) }}</td>
              </tr>
              <tr>
                <td>User</td>
                <td>:</td>
                <td>{{ selectedItem.user?.full_name }}</td>
              </tr>
              <tr>
                <td>Email</td>
                <td>:</td>
                <td>
                  <a
                    :href="`mailto:${
                      selectedItem.user?.email || selectedItem.email
                    }`"
                    >{{ selectedItem.user?.email || selectedItem.email }}</a
                  >
                </td>
              </tr>
              <tr>
                <td>Phone Number</td>
                <td>:</td>
                <td>
                  <a :href="`tel:${selectedItem.phone_number}`">{{
                    selectedItem.phone_number
                  }}</a>
                </td>
              </tr>
              <tr>
                <td>Type</td>
                <td>:</td>
                <td>{{ selectedItem.type }}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>:</td>
                <td style="white-space: pre-wrap">
                  {{ selectedItem.description }}
                </td>
              </tr>
              <tr>
                <td>Attachment</td>
                <td>:</td>
                <td>
                  <a
                    v-if="selectedItem.attachment_url"
                    :href="BASE_URL + selectedItem.attachment_url"
                    target="_blank"
                    >View Attachment</a
                  >
                  <span v-else>-</span>
                </td>
              </tr>
              <tr>
                <td>Status</td>
                <td>:</td>
                <td>{{ selectedItem.status }}</td>
              </tr>
            </tbody>
          </table>
        </v-card-text>
        <v-card-actions class="px-6 pb-6">
          <v-btn
            v-if="selectedItem.status == 'OPEN'"
            color="primary"
            @click="closeTicket(selectedItem)"
            variant="elevated"
            >Close Ticket</v-btn
          >
          <v-btn
            v-if="selectedItem.status == 'CLOSED'"
            color="primary"
            @click="reOpenTicket(selectedItem)"
            variant="elevated"
            >Re-Open Ticket</v-btn
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

import { ref, computed, onMounted } from "vue";
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
const entity = ref("feedbacks");
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

const feedbackTypes = ref([]);
const fetchFeedbackTypes = async () => {
  const response = await $apiFetch(`/configs/key/feedback_types`);
  feedbackTypes.value = response.value;
};
// Filters
const fields = useState(`${entity.value}fields`, () => []);
const filterEnum = ref({});
const filterDialog = ref(false);
const searchInput = ref("");
const filters = ref({
  types: [],
  status: null,
  date_start: null,
  date_end: null,
});
const filterFields = ref([]);
const filterLoading = ref(true);
const activeFilterCount = computed(() => {
  return Object.values(filters.value).filter((value) =>
    Array.isArray(value) ? value.length > 0 : !!value
  ).length;
});
const resetFilters = () => {
  filters.value = {
    types: [],
    status: null,
    date_start: null,
    date_end: null,
  };
  filterDialog.value = false;
  loadItems();
};
const applyFilters = () => {
  filterDialog.value = false;
  loadItems();
};

const detailDialog = ref(false);
const showDetail = (item) => {
  detailDialog.value = true;
  selectedItem.value = item;
};
const selectedItem = ref({});

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

let allHeaders = ref([
  {
    title: "No",
    key: "no",
    sortable: false,
  },
  {
    title: "Code",
    key: "code",
    sortable: true,
  },

  {
    title: "Created At",
    key: "created_at",
    sortable: true,
  },
  {
    title: "Type",
    key: "type",
    sortable: true,
  },
  {
    title: "User - Email",
    key: "email",
    sortable: true,
  },
  {
    title: "Phone Number",
    key: "phone_number",
    sortable: true,
  },
  {
    title: "Description",
    key: "description",
    sortable: true,
    minWidth: "300px",
  },
  {
    title: "Attachment",
    key: "attachment_url",
    sortable: true,
  },
  {
    title: "Status",
    key: "status",
    sortable: true,
  },
  { title: "Actions", key: "actions", sortable: false, align: "center" },
]);

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
    let orWhere = [];
    if (searchInput.value) {
      filterFields.value.forEach((key) => {
        filters.value[key] = searchInput.value;
        if (filters.value[key]) {
          orWhere.push(key);
        }
      });
    }
    if (orWhere.length) {
      filters.value.orWhere = orWhere;
    }
    const relations = ["user"];

    sortBy.value = options.sortBy;

    const params = {
      page: options?.page || page.value,
      limit: options?.itemsPerPage || itemsPerPage.value,
      sortBy: options?.sortBy || sortBy.value,
      filters: {
        description: searchInput.value,
        code: searchInput.value,
        "user.email": searchInput.value,
        "user.full_name": searchInput.value,
        email: searchInput.value,
        type: filters.value.types,
        status: filters.value.status,
        created_at_start: filters.value.date_start,
        created_at_end: filters.value.date_end,
        orWhere: [
          "description",
          "code",
          "user.email",
          "user.full_name",
          "email",
        ],
      },
      expands: "user",
      isExcel: options?.isExcel,
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
      const userIds = [...new Set(data.items.map((item) => item.user_id))];
      const userEncrypted = await $apiFetch(`/encrypted-user-data/search`, {
        params: {
          filters: {
            user_id: userIds,
          },
          limit: options?.itemsPerPage || itemsPerPage.value,
        },
      });

      items.value = data.items.map((item, index) => {
        const user = userEncrypted.items.find(
          (user) => user.user_id === item.user_id
        );
        return {
          ...item,
          no: (page.value - 1) * itemsPerPage.value + index + 1,
          phone_number: user?.encrypted_phone,
        };
      });
    }
  } catch (error) {
    console.error("Error loading items:", error);
  } finally {
    loading.value = false;
    first.value = false;
  }
};

const dialog = useDialogStore();
const closeTicket = async (item) => {
  try {
    await dialog.openDialog({
      title: "Close Feedback",
      message: "Are you sure you want to close this feedback?",
      confirmButtonText: "Close",
      confirmButtonColor: "error",
      autoClose: false,
    });
    dialog.loading = true;
    const id = item.id;
    $apiFetch(`/${entity.value}/${id}`, {
      method: "PATCH",
      body: {
        status: "CLOSED",
      },
    }).then(() => {
      debouncedLoadItems({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value,
      });
      dialog.closeDialog();
      detailDialog.value = false;
    });
  } catch {
    console.log("Delete cancelled");
  }
};
const reOpenTicket = async (item) => {
  try {
    await dialog.openDialog({
      title: "Re-Open Feedback",
      message: "Are you sure you want to re-open this feedback?",
      confirmButtonText: "Re-Open",
      confirmButtonColor: "primary",
      autoClose: false,
    });
    dialog.loading = true;
    const id = item.id;
    $apiFetch(`/${entity.value}/${id}`, {
      method: "PATCH",
      body: {
        status: "OPEN",
      },
    }).then(() => {
      debouncedLoadItems({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value,
      });
      dialog.closeDialog();
      detailDialog.value = false;
    });
  } catch {
    console.log("Delete cancelled");
  }
};

const debouncedLoadItems = debounce(loadItems, 500);

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

const exportData = () => {
  console.log("Exporting data...");
};

onMounted(async () => {
  filterLoading.value = false;
  loadItems({
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    sortBy: sortBy.value,
  });
  fetchFeedbackTypes();
});

onBeforeUnmount(() => {
  //debouncedSearch.cancel();
});
</script>
<style></style>
