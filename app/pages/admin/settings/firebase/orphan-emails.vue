<template>
  <v-container fluid>
    <!-- Breadcrumbs -->
    <v-row>
      <v-breadcrumbs
        class="text-caption"
        :items="[
          {
            title: 'Dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'Settings',
            disabled: false,
            to: '/admin/settings',
          },
          {
            title: 'Firebase',
            disabled: false,
            to: '/admin/settings/firebase',
          },
          {
            title: 'Orphan Emails',
            disabled: true,
          },
        ]"
        divider="/"
      />
    </v-row>

    <!-- Header Section -->
    <v-row class="px-1 pt-0">
      <v-col cols="12">
        <v-card rounded="lg" elevation="0">
          <v-card-title class="d-flex align-center">
            <v-icon
              icon="mdi-email-alert"
              class="mr-3"
              color="warning"
              size="40"
            />
            <div>
              <h3>Firebase Orphan Emails</h3>
              <p class="text-subtitle-2 text-grey-darken-1 mb-0">
                Manage emails registered in Firebase Auth but missing from the
                database
              </p>
            </div>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabs -->
    <v-row class="px-1">
      <v-col cols="12">
        <v-card rounded="lg" elevation="0">
          <v-tabs v-model="activeTab" bg-color="transparent" color="primary">
            <v-tab value="orphan-emails">
              <v-icon icon="mdi-email-alert" class="mr-2" />
              Firebase Orphan Emails Database
            </v-tab>
            <v-tab value="orphan-users">
              <v-icon icon="mdi-database-alert" class="mr-2" />
              Database Orphan Users Firebase
            </v-tab>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>

    <!-- Controls Section -->
    <v-row class="px-1">
      <v-col cols="12" md="8" v-if="activeTab === 'orphan-emails'">
        <v-text-field
          v-model="maxResults"
          type="number"
          label="Max Results to Check"
          hint="Maximum number of Firebase users to check (default: 1000)"
          variant="outlined"
          rounded="lg"
          :min="100"
          :max="10000"
          :step="100"
          density="compact"
          hide-details
        />
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-end">
        <v-btn
          @click="
            activeTab === 'orphan-emails'
              ? fetchOrphanEmails()
              : fetchOrphanUsers()
          "
          :loading="loading"
          color="primary"
          variant="elevated"
          rounded="lg"
          block
          height="40"
        >
          <v-icon icon="mdi-magnify" class="mr-2" />
          {{
            activeTab === "orphan-emails"
              ? "Check Orphan Emails"
              : "Check Orphan Users"
          }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Statistics Cards for Orphan Emails -->
    <v-row class="px-1" v-if="statistics && activeTab === 'orphan-emails'">
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="error"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-account-remove" size="40" class="mb-2" />
            <h3 class="font-weight-bold">
              {{ statistics.totalOrphans }}
            </h3>
            <p class="text-subtitle-2 mb-0">Orphan Emails</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="info"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-firebase" size="40" class="mb-2" />
            <h3 class="font-weight-bold">
              {{ statistics.totalFirebaseUsers }}
            </h3>
            <p class="text-subtitle-2 mb-0">Firebase Users</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="success"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-database-check" size="40" class="mb-2" />
            <h3 class="font-weight-bold">
              {{ statistics.totalSystemUsers }}
            </h3>
            <p class="text-subtitle-2 mb-0">System Users</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="warning"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-percent" size="40" class="mb-2" />
            <h3 class="font-weight-bold">{{ orphanPercentage }}%</h3>
            <p class="text-subtitle-2 mb-0">Orphan Rate</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Statistics Cards for Orphan Users -->
    <v-row
      class="px-1"
      v-if="orphanUsersStatistics && activeTab === 'orphan-users'"
    >
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="error"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-database-remove" size="40" class="mb-2" />
            <h3 class="font-weight-bold">
              {{ orphanUsersStatistics.totalOrphans }}
            </h3>
            <p class="text-subtitle-2 mb-0">Orphan Users</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="info"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-firebase" size="40" class="mb-2" />
            <h3 class="font-weight-bold">
              {{ orphanUsersStatistics.totalFirebaseUsers }}
            </h3>
            <p class="text-subtitle-2 mb-0">Firebase Users</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="success"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-database-check" size="40" class="mb-2" />
            <h3 class="font-weight-bold">
              {{ orphanUsersStatistics.totalSystemUsers }}
            </h3>
            <p class="text-subtitle-2 mb-0">System Users</p>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card
          :elevation="0"
          rounded="xl"
          elevation="2"
          color="warning"
          variant="tonal"
        >
          <v-card-text class="text-center">
            <v-icon icon="mdi-percent" size="40" class="mb-2" />
            <h3 class="font-weight-bold">{{ orphanUsersPercentage }}%</h3>
            <p class="text-subtitle-2 mb-0">Orphan Rate</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table for Orphan Emails -->
    <v-row
      class="px-1"
      v-if="orphanEmails.length > 0 && activeTab === 'orphan-emails'"
    >
      <v-col cols="12">
        <v-card :elevation="0" rounded="xl" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <span>Orphan Emails ({{ orphanEmails.length }})</span>
              <v-chip
                v-if="selectedItems.length > 0"
                color="warning"
                class="ml-3"
                size="small"
              >
                {{ selectedItems.length }} selected
              </v-chip>
            </div>
            <div class="d-flex ga-2">
              <v-btn
                v-if="selectedItems.length > 0"
                @click="bulkDeleteUsers"
                color="error"
                variant="outlined"
                rounded="lg"
                :loading="bulkDeleting"
              >
                <v-icon icon="mdi-delete-multiple" class="mr-2" />
                Delete Selected ({{ selectedItems.length }})
              </v-btn>
              <v-btn
                @click="selectAll"
                variant="outlined"
                rounded="lg"
                :disabled="loading"
              >
                {{
                  selectedItems.length === orphanEmails.length
                    ? "Deselect All"
                    : "Select All"
                }}
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- Search and Filter -->
            <v-row class="mb-4">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchEmail"
                  label="Search emails..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  rounded="lg"
                  hide-details
                  clearable
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="filterVerified"
                  :items="[
                    { title: 'All', value: null },
                    { title: 'Verified Only', value: true },
                    { title: 'Unverified Only', value: false },
                  ]"
                  label="Email Verification Status"
                  variant="outlined"
                  rounded="lg"
                  hide-details
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="px-0">
            <!-- Data Table -->
            <v-data-table
              v-model="selectedItems"
              :headers="headers"
              :items="filteredOrphanEmails"
              :loading="loading"
              item-value="uid"
              show-select
              :items-per-page="itemsPerPage"
              :items-per-page-options="[10, 25, 50, 100]"
              class="rounded-lg"
            >
              <!-- Email column -->
              <template v-slot:item.email="{ item }">
                <div class="d-flex align-center">
                  <v-avatar
                    :color="item.emailVerified ? 'success' : 'warning'"
                    size="small"
                    class="mr-2"
                  >
                    <v-icon
                      :icon="item.emailVerified ? 'mdi-check' : 'mdi-alert'"
                      size="16"
                      color="white"
                    />
                  </v-avatar>
                  <span>{{ item.email }}</span>
                </div>
              </template>

              <!-- UID column -->
              <template v-slot:item.uid="{ item }">
                <v-chip size="small" color="info" variant="tonal">
                  {{ item.uid.substring(0, 8) }}...
                </v-chip>
              </template>

              <!-- Creation time column -->
              <template v-slot:item.creationTime="{ item }">
                <div>
                  <div class="text-body-2">
                    {{ formatDate(item.creationTime) }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    {{ formatTimeAgo(item.creationTime) }}
                  </div>
                </div>
              </template>

              <!-- Last sign in column -->
              <template v-slot:item.lastSignInTime="{ item }">
                <div v-if="item.lastSignInTime">
                  <div class="text-body-2">
                    {{ formatDate(item.lastSignInTime) }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    {{ formatTimeAgo(item.lastSignInTime) }}
                  </div>
                </div>
                <v-chip v-else size="small" color="grey" variant="tonal">
                  Never
                </v-chip>
              </template>

              <!-- Status column -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.disabled ? 'error' : 'success'"
                  size="small"
                  variant="tonal"
                >
                  {{ item.disabled ? "Disabled" : "Active" }}
                </v-chip>
              </template>

              <!-- Actions column -->
              <template v-slot:item.actions="{ item }">
                <v-btn
                  @click="deleteSingleUser(item)"
                  color="error"
                  variant="text"
                  size="small"
                  icon="mdi-delete"
                  :loading="deletingUids.includes(item.uid)"
                />
                <v-btn
                  @click="viewUserDetails(item)"
                  color="info"
                  variant="text"
                  size="small"
                  icon="mdi-eye"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data Table for Orphan Users -->
    <v-row
      class="px-1"
      v-if="orphanUsers.length > 0 && activeTab === 'orphan-users'"
    >
      <v-col cols="12">
        <v-card :elevation="0" rounded="xl" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <span>Orphan Users ({{ orphanUsers.length }})</span>
              <v-chip
                v-if="selectedOrphanUsers.length > 0"
                color="success"
                class="ml-3"
                size="small"
              >
                {{ selectedOrphanUsers.length }} selected
              </v-chip>
            </div>
            <div class="d-flex ga-2">
              <v-btn
                v-if="selectedOrphanUsers.length > 0"
                @click="bulkCreateFirebaseUsers"
                color="success"
                variant="outlined"
                rounded="lg"
                :loading="bulkCreating"
              >
                <v-icon icon="mdi-firebase" class="mr-2" />
                Create Firebase Users ({{ selectedOrphanUsers.length }})
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- Search and Filter -->
            <v-row class="mb-4">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="searchUserEmail"
                  label="Search emails or names..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  rounded="lg"
                  hide-details
                  clearable
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-text class="px-0">
            <!-- Data Table -->
            <v-data-table
              v-model="selectedOrphanUsers"
              :headers="userHeaders"
              :items="filteredOrphanUsers"
              :loading="loading"
              item-value="id"
              show-select
              :items-per-page="itemsPerPage"
              :items-per-page-options="[10, 25, 50, 100]"
              class="rounded-lg"
            >
              <!-- Email column -->
              <template v-slot:item.email="{ item }">
                <div class="d-flex align-center">
                  <v-avatar
                    :color="item.is_email_verified ? 'success' : 'warning'"
                    size="small"
                    class="mr-2"
                  >
                    <v-icon
                      :icon="item.is_email_verified ? 'mdi-check' : 'mdi-alert'"
                      size="16"
                      color="white"
                    />
                  </v-avatar>
                  <span>{{ item.email }}</span>
                </div>
              </template>

              <!-- Full Name column -->
              <template v-slot:item.full_name="{ item }">
                <span>{{ item.full_name }}</span>
              </template>

              <!-- Firebase UID column -->
              <template v-slot:item.firebase_uid="{ item }">
                <div class="d-flex align-center">
                  <v-chip
                    size="small"
                    color="error"
                    variant="tonal"
                    class="mr-2"
                  >
                    {{ item.firebase_uid.substring(0, 8) }}...
                  </v-chip>
                  <v-btn
                    @click="copyToClipboard(item.firebase_uid)"
                    icon="mdi-content-copy"
                    size="x-small"
                    variant="text"
                    color="primary"
                  />
                </div>
              </template>

              <!-- User Role column -->
              <template v-slot:item.user_role="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.user_role }}
                </v-chip>
              </template>

              <!-- Verified column -->
              <template v-slot:item.is_email_verified="{ item }">
                <v-chip
                  :color="item.is_email_verified ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ item.is_email_verified ? "Verified" : "Unverified" }}
                </v-chip>
              </template>

              <!-- Created At column -->
              <template v-slot:item.created_at="{ item }">
                <div>
                  <div class="text-body-2">
                    {{ formatDate(item.created_at) }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    {{ formatTimeAgo(item.created_at) }}
                  </div>
                </div>
              </template>

              <!-- Actions column -->
              <template v-slot:item.actions="{ item }">
                <v-btn
                  @click="createFirebaseUserForOrphanUser(item)"
                  color="success"
                  variant="text"
                  size="small"
                  icon="mdi-firebase"
                  :loading="creatingFirebaseUsers.includes(item.id)"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State for Orphan Emails -->
    <v-row
      class="px-1"
      v-if="
        !loading &&
        orphanEmails.length === 0 &&
        hasSearched &&
        activeTab === 'orphan-emails'
      "
    >
      <v-col cols="12">
        <v-card rounded="xl" elevation="2" class="text-center py-12">
          <v-icon
            icon="mdi-check-circle"
            size="64"
            color="success"
            class="mb-4"
          />
          <h3 class="mb-2">No Orphan Emails Found!</h3>
          <p class="text-grey-darken-1">
            All Firebase Auth users have corresponding records in the database.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State for Orphan Users -->
    <v-row
      class="px-1"
      v-if="
        !loading &&
        orphanUsers.length === 0 &&
        hasSearchedUsers &&
        activeTab === 'orphan-users'
      "
    >
      <v-col cols="12">
        <v-card rounded="xl" elevation="2" class="text-center py-12">
          <v-icon
            icon="mdi-check-circle"
            size="64"
            color="success"
            class="mb-4"
          />
          <h3 class="mb-2">No Orphan Users Found!</h3>
          <p class="text-grey-darken-1">
            All database users have corresponding Firebase Auth accounts.
          </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Details Dialog -->
    <v-dialog v-model="showUserDialog" max-width="600">
      <v-card rounded="xl" v-if="selectedUser">
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-account-details" class="mr-3" />
          User Details
          <v-spacer />
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showUserDialog = false"
          />
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-title>Email</v-list-item-title>
              <v-list-item-subtitle>{{
                selectedUser.email
              }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>UID</v-list-item-title>
              <v-list-item-subtitle>{{
                selectedUser.uid
              }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Email Verified</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  :color="selectedUser.emailVerified ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedUser.emailVerified ? "Yes" : "No" }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Created</v-list-item-title>
              <v-list-item-subtitle>{{
                formatDate(selectedUser.creationTime)
              }}</v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Last Sign In</v-list-item-title>
              <v-list-item-subtitle>
                {{
                  selectedUser.lastSignInTime
                    ? formatDate(selectedUser.lastSignInTime)
                    : "Never"
                }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>Status</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  :color="selectedUser.disabled ? 'error' : 'success'"
                  size="small"
                  variant="tonal"
                >
                  {{ selectedUser.disabled ? "Disabled" : "Active" }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item
              v-if="
                selectedUser.customClaims &&
                Object.keys(selectedUser.customClaims).length > 0
              "
            >
              <v-list-item-title>Custom Claims</v-list-item-title>
              <v-list-item-subtitle>
                <pre class="text-caption">{{
                  JSON.stringify(selectedUser.customClaims, null, 2)
                }}</pre>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="showUserDialog = false"
            variant="outlined"
            rounded="lg"
          >
            Close
          </v-btn>
          <v-btn
            @click="
              deleteSingleUser(selectedUser);
              showUserDialog = false;
            "
            color="error"
            variant="elevated"
            rounded="lg"
            :loading="deletingUids.includes(selectedUser.uid)"
          >
            Delete User
          </v-btn>
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

// Imports
const { $apiFetch } = useApi();
const snackbar = useSnackbarStore();
const dialog = useDialogStore();

// Reactive data
const loading = ref(false);
const bulkDeleting = ref(false);
const deletingUids = ref([]);
const hasSearched = ref(false);
const hasSearchedUsers = ref(false);
const maxResults = ref(1000);
const orphanEmails = ref([]);
const orphanUsers = ref([]);
const statistics = ref(null);
const orphanUsersStatistics = ref(null);
const selectedItems = ref([]);
const searchEmail = ref("");
const searchUserEmail = ref("");
const filterVerified = ref(null);
const itemsPerPage = ref(25);
const showUserDialog = ref(false);
const selectedUser = ref(null);
const activeTab = ref("orphan-emails");
const selectedOrphanUsers = ref([]);
const creatingFirebaseUsers = ref([]);
const bulkCreating = ref(false);

// Table headers
const headers = [
  { title: "Email", key: "email", sortable: true },
  { title: "UID", key: "uid", sortable: false },
  { title: "Verified", key: "emailVerified", sortable: true },
  { title: "Created", key: "creationTime", sortable: true },
  { title: "Last Sign In", key: "lastSignInTime", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false, align: "center" },
];

const userHeaders = [
  { title: "Email", key: "email", sortable: true },
  { title: "Full Name", key: "full_name", sortable: true },
  { title: "Firebase UID", key: "firebase_uid", sortable: false },
  { title: "Role", key: "user_role", sortable: true },
  { title: "Verified", key: "is_email_verified", sortable: true },
  { title: "Created", key: "created_at", sortable: true },
  { title: "Actions", key: "actions", sortable: false, align: "center" },
];

// Computed properties
const filteredOrphanEmails = computed(() => {
  let filtered = orphanEmails.value;

  // Filter by email search
  if (searchEmail.value) {
    const search = searchEmail.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.email.toLowerCase().includes(search) ||
        item.uid.toLowerCase().includes(search)
    );
  }

  // Filter by verification status
  if (filterVerified.value !== null) {
    filtered = filtered.filter(
      (item) => item.emailVerified === filterVerified.value
    );
  }

  return filtered;
});

const orphanPercentage = computed(() => {
  if (!statistics.value) return 0;
  const { totalOrphans, totalFirebaseUsers } = statistics.value;
  if (totalFirebaseUsers === 0) return 0;
  return ((totalOrphans / totalFirebaseUsers) * 100).toFixed(1);
});

const orphanUsersPercentage = computed(() => {
  if (!orphanUsersStatistics.value) return 0;
  const { totalOrphans, totalSystemUsers } = orphanUsersStatistics.value;
  if (totalSystemUsers === 0) return 0;
  return ((totalOrphans / totalSystemUsers) * 100).toFixed(1);
});

const filteredOrphanUsers = computed(() => {
  let filtered = orphanUsers.value;

  // Filter by email or name search
  if (searchUserEmail.value) {
    const search = searchUserEmail.value.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.email.toLowerCase().includes(search) ||
        item.full_name.toLowerCase().includes(search) ||
        item.firebase_uid.toLowerCase().includes(search)
    );
  }

  return filtered;
});

// Methods
const fetchOrphanEmails = async () => {
  loading.value = true;
  hasSearched.value = false;

  try {
    const response = await $apiFetch(
      `/firebase/orphan-emails?maxResults=${maxResults.value}`
    );

    orphanEmails.value = response.orphanEmails || [];
    statistics.value = {
      totalOrphans: response.totalOrphans || 0,
      totalFirebaseUsers: response.totalFirebaseUsers || 0,
      totalSystemUsers: response.totalSystemUsers || 0,
    };

    hasSearched.value = true;
    selectedItems.value = [];

    snackbar.showSnackbar({
      message: `Found ${response.totalOrphans} orphan emails out of ${response.totalFirebaseUsers} Firebase users`,
      color: response.totalOrphans > 0 ? "warning" : "success",
    });
  } catch (error) {
    console.error("Error fetching orphan emails:", error);
  } finally {
    loading.value = false;
  }
};

const deleteSingleUser = async (user) => {
  try {
    const confirmed = await dialog.openDialog({
      title: "Delete User",
      message: `Are you sure you want to delete the user with email <strong>${user.email}</strong>?<br><br>This action cannot be undone.`,
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
      cancelButtonText: "Cancel",
    });

    if (confirmed) {
      deletingUids.value.push(user.uid);

      try {
        await $apiFetch(`/firebase/orphan-user/${user.uid}`, {
          method: "DELETE",
        });

        // Remove from local array
        orphanEmails.value = orphanEmails.value.filter(
          (item) => item.uid !== user.uid
        );
        selectedItems.value = selectedItems.value.filter(
          (uid) => uid !== user.uid
        );

        // Update statistics
        if (statistics.value) {
          statistics.value.totalOrphans--;
          statistics.value.totalFirebaseUsers--;
        }

        snackbar.showSnackbar({
          message: `User ${user.email} successfully deleted from Firebase Auth`,
          color: "success",
        });
      } catch (error) {
        console.error("Error deleting user:", error);
      } finally {
        deletingUids.value = deletingUids.value.filter(
          (uid) => uid !== user.uid
        );
      }
    }
  } catch (error) {
    // User cancelled the dialog
  }
};

const bulkDeleteUsers = async () => {
  if (selectedItems.value.length === 0) return;

  try {
    const confirmed = await dialog.openDialog({
      title: "Bulk Delete Users",
      message: `Are you sure you want to delete <strong>${selectedItems.value.length}</strong> users?<br><br>This action cannot be undone.`,
      confirmButtonText: `Delete ${selectedItems.value.length} Users`,
      confirmButtonColor: "error",
      cancelButtonText: "Cancel",
    });

    if (confirmed) {
      bulkDeleting.value = true;

      try {
        const response = await $apiFetch("/firebase/orphan-users/bulk", {
          method: "DELETE",
          body: {
            uids: selectedItems.value,
          },
        });

        // Remove successfully deleted users from local array
        const deletedUids = selectedItems.value.filter(
          (uid) => !response.errors?.some((error) => error.uid === uid)
        );

        orphanEmails.value = orphanEmails.value.filter(
          (item) => !deletedUids.includes(item.uid)
        );

        // Update statistics
        if (statistics.value) {
          statistics.value.totalOrphans -= response.successCount;
          statistics.value.totalFirebaseUsers -= response.successCount;
        }

        selectedItems.value = [];

        let message = `Successfully deleted ${response.successCount} users`;
        if (response.failureCount > 0) {
          message += `, ${response.failureCount} failed`;
        }

        snackbar.showSnackbar({
          message,
          color: response.failureCount > 0 ? "warning" : "success",
        });

        // Show errors if any
        if (response.errors && response.errors.length > 0) {
          console.error("Bulk delete errors:", response.errors);
        }
      } catch (error) {
        console.error("Error bulk deleting users:", error);
      } finally {
        bulkDeleting.value = false;
      }
    }
  } catch (error) {
    // User cancelled the dialog
  }
};

const selectAll = () => {
  if (selectedItems.value.length === filteredOrphanEmails.value.length) {
    selectedItems.value = [];
  } else {
    selectedItems.value = filteredOrphanEmails.value.map((item) => item.uid);
  }
};

const viewUserDetails = (user) => {
  selectedUser.value = user;
  showUserDialog.value = true;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

const fetchOrphanUsers = async () => {
  loading.value = true;
  hasSearchedUsers.value = false;

  try {
    const response = await $apiFetch(`/firebase/orphan-users`);

    orphanUsers.value = response.orphanUsers || [];
    orphanUsersStatistics.value = {
      totalOrphans: response.totalOrphans || 0,
      totalFirebaseUsers: response.totalFirebaseUsers || 0,
      totalSystemUsers: response.totalSystemUsers || 0,
    };

    hasSearchedUsers.value = true;
    selectedOrphanUsers.value = [];

    snackbar.showSnackbar({
      message: `Found ${response.totalOrphans} orphan users out of ${response.totalSystemUsers} database users`,
      color: response.totalOrphans > 0 ? "warning" : "success",
    });
  } catch (error) {
    console.error("Error fetching orphan users:", error);
  } finally {
    loading.value = false;
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    snackbar.showSnackbar({
      message: "Firebase UID copied to clipboard",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to copy:", error);
    snackbar.showSnackbar({
      message: "Failed to copy Firebase UID",
      color: "error",
    });
  }
};

const createFirebaseUserForOrphanUser = async (user) => {
  try {
    const confirmed = await dialog.openDialog({
      title: "Create Firebase User",
      message: `Are you sure you want to create a Firebase Auth user for <strong>${user.email}</strong>?<br><br>This will create a new Firebase user and update the database.`,
      confirmButtonText: "Create",
      confirmButtonColor: "success",
      cancelButtonText: "Cancel",
    });

    if (confirmed) {
      creatingFirebaseUsers.value.push(user.id);

      try {
        const response = await $apiFetch(
          `/firebase/orphan-users/${user.id}/create-firebase-user`,
          {
            method: "POST",
          }
        );

        if (response.success) {
          // Remove from orphan users list
          orphanUsers.value = orphanUsers.value.filter(
            (item) => item.id !== user.id
          );
          selectedOrphanUsers.value = selectedOrphanUsers.value.filter(
            (id) => id !== user.id
          );

          // Update statistics
          if (orphanUsersStatistics.value) {
            orphanUsersStatistics.value.totalOrphans--;
          }

          snackbar.showSnackbar({
            message: response.message,
            color: "success",
          });

          // Refresh the list
          await fetchOrphanUsers();
        } else {
          snackbar.showSnackbar({
            message: response.message,
            color: "error",
          });
        }
      } catch (error) {
        console.error("Error creating Firebase user:", error);
        snackbar.showSnackbar({
          message: "Failed to create Firebase user",
          color: "error",
        });
      } finally {
        creatingFirebaseUsers.value = creatingFirebaseUsers.value.filter(
          (id) => id !== user.id
        );
      }
    }
  } catch (error) {
    // User cancelled the dialog
  }
};

const bulkCreateFirebaseUsers = async () => {
  if (selectedOrphanUsers.value.length === 0) return;

  try {
    const confirmed = await dialog.openDialog({
      title: "Bulk Create Firebase Users",
      message: `Are you sure you want to create Firebase Auth users for <strong>${selectedOrphanUsers.value.length}</strong> users?<br><br>This will create Firebase users and update the database.`,
      confirmButtonText: `Create ${selectedOrphanUsers.value.length} Users`,
      confirmButtonColor: "success",
      cancelButtonText: "Cancel",
    });

    if (confirmed) {
      bulkCreating.value = true;

      try {
        const response = await $apiFetch(
          `/firebase/orphan-users/bulk-create-firebase-users`,
          {
            method: "POST",
            body: {
              userIds: selectedOrphanUsers.value,
            },
          }
        );

        // Remove successfully created users from local array
        const createdUserIds = selectedOrphanUsers.value.filter(
          (userId) => !response.errors?.some((error) => error.userId === userId)
        );

        orphanUsers.value = orphanUsers.value.filter(
          (item) => !createdUserIds.includes(item.id)
        );

        // Update statistics
        if (orphanUsersStatistics.value) {
          orphanUsersStatistics.value.totalOrphans -= response.successCount;
        }

        selectedOrphanUsers.value = [];

        let message = `Successfully created ${response.successCount} Firebase users`;
        if (response.failureCount > 0) {
          message += `, ${response.failureCount} failed`;
        }

        snackbar.showSnackbar({
          message,
          color: response.failureCount > 0 ? "warning" : "success",
        });

        // Show errors if any
        if (response.errors && response.errors.length > 0) {
          console.error("Bulk create errors:", response.errors);
        }

        // Refresh the list
        await fetchOrphanUsers();
      } catch (error) {
        console.error("Error bulk creating Firebase users:", error);
        snackbar.showSnackbar({
          message: "Failed to create Firebase users",
          color: "error",
        });
      } finally {
        bulkCreating.value = false;
      }
    }
  } catch (error) {
    // User cancelled the dialog
  }
};

// Auto-fetch on component mount
onMounted(() => {
  fetchOrphanEmails();
});
</script>

<style scoped>
.v-data-table {
  border-radius: 12px;
}

pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
