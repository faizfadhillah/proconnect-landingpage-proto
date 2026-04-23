<template>
  <v-app class="bg-grey-lighten-4">
    <v-app-bar
      density="comfortable"
      class="px-2"
      elevation="0"
      style="border-bottom: 1px solid #ddd"
    >
      <v-row class="align-center px-3" style="min-width: 220px">
        <v-btn
          icon
          size="small"
          @click="toggleDrawer"
          elevation="0"
          color="primary"
          class="mr-2"
          style="background: rgba(255, 255, 255, 0.1)"
        >
          <v-icon size="20">{{
            drawer ? /*"mdi-backburger"*/ "mdi-menu" : "mdi-menu"
          }}</v-icon>
        </v-btn>
        <v-img src="/logo.svg" height="24"></v-img>
      </v-row>
      <v-spacer style="width: 90%"></v-spacer>
      <Notification></Notification>
    </v-app-bar>
    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" app hide-overlay :width="295">
      <div class="px-4 pt-4">
        <v-card v-if="loading" rounded="lg" class="mb-3" elevation="0">
          <v-skeleton-loader type="image"></v-skeleton-loader>
        </v-card>
        <v-card
          v-else
          elevation="0"
          rounded="lg"
          style="
            background: url('/images/bg-profile-employer.jpg') no-repeat center
              center;
            background-size: cover;
            border: 1px solid #ddd;
            overflow-x: auto;
          "
          class="mb-3"
        >
          <div>
            <v-list class="text-black">
              <v-list-item v-if="me.user_role == 'candidate'">
                <template v-slot:prepend>
                  <v-avatar color="grey" size="45" rounded="lg">
                    <v-img
                      v-if="me.photo_url"
                      :src="
                        me.photo_url.includes('http')
                          ? me.photo_url
                          : BASE_URL + me.photo_url
                      "
                    />
                    <v-icon v-else size="50">mdi-account</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">{{
                  me.full_name || me.email
                }}</v-list-item-title>
                <v-list-item-title class="d-flex gap-2">
                  <v-img
                    v-if="me.is_skill_passport_verified"
                    src="/images/asp-badge.svg"
                    max-width="20"
                    height="20"
                  ></v-img>
                  <v-avatar
                    color="brown"
                    size="20"
                    v-if="me.is_school_verified"
                  >
                    <v-icon size="18">mdi-school-outline</v-icon>
                  </v-avatar>
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-else style="font-size: 14px">
                <template v-slot:prepend>
                  <v-avatar color="grey-darken-2" size="57" rounded="lg">
                    <v-img
                      v-if="me.photo_url"
                      :src="
                        me.photo_url.includes('http')
                          ? me.photo_url
                          : BASE_URL + me.photo_url
                      "
                    />
                    <v-icon v-else size="50">mdi-account</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">{{
                  me.full_name || me.email
                }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ me.user_role }}
                </v-list-item-subtitle>
                <v-list-item-title>
                  {{ me.company?.brand_name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
            <v-card-text class="pt-0" style="font-size: 12px">
              <table>
                <tbody>
                  <tr v-if="me.user_role !== 'candidate'">
                    <td class="pr-2">
                      <v-icon size="small">mdi-web</v-icon>
                    </td>
                    <td>
                      {{ me.company?.website || "N/A" }}
                    </td>
                  </tr>
                  <tr>
                    <td class="pr-2">
                      <v-icon size="small">mdi-email</v-icon>
                    </td>
                    <td>
                      <template v-if="me.user_role !== 'candidate'">
                        {{ me.company?.email || me.email || "N/A" }}
                      </template>
                      <template v-else>
                        {{ me.email || "N/A" }}
                      </template>
                    </td>
                  </tr>
                  <tr>
                    <td class="pr-2">
                      <v-icon size="small">mdi-phone</v-icon>
                    </td>
                    <td>
                      <template v-if="me.user_role !== 'candidate'">
                        {{ me.company?.phone || me.phone || "N/A" }}
                      </template>
                      <template v-else>
                        {{ me.phone || "N/A" }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-card-text>
          </div>
        </v-card>

        <v-row>
          <v-col cols="12">
            <v-btn
              to="/admin/profile"
              density="comfortable"
              block
              variant="outlined"
              color="blue-darken-4"
              ><small>PROFILE</small></v-btn
            >
          </v-col>
        </v-row>
      </div>
      <div class="px-4">
        <v-list>
          <template
            v-for="(item, itemIndex) in displayMenus"
            :key="getMenuItemKey(item, itemIndex, 'menu')"
          >
            <v-list-group
              :prepend-icon="item.icon"
              v-if="item.children && item.children.length"
            >
              <template v-slot:activator="{ props }">
                <v-list-item
                  rounded="lg"
                  v-bind="props"
                  :prepend-icon="item.icon"
                  :value="getMenuItemValue(item, `activator-${itemIndex}`)"
                >
                  <v-list-item-title
                    style="font-size: 14px; font-weight: 600; min-width: 200px"
                  >
                    {{ item.title }}
                  </v-list-item-title>
                </v-list-item>
              </template>

              <template
                v-for="(child, childIndex) in item.children"
                :key="
                  getMenuItemKey(
                    child,
                    childIndex,
                    `child-${getMenuItemKey(item, itemIndex)}`
                  )
                "
              >
                <v-list-item
                  :to="child.to"
                  :value="getMenuItemValue(child, `item-${childIndex}`)"
                  v-if="!child.children"
                  rounded="lg"
                  color="primary"
                >
                  <template v-slot:prepend>
                    <v-icon :icon="child.icon"></v-icon>
                  </template>
                  <v-list-item-title
                    v-text="child.title"
                    style="font-size: 14px; font-weight: 600"
                  ></v-list-item-title>
                </v-list-item>

                <v-list-group
                  :prepend-icon="child.icon"
                  v-if="child.children && child.children.length"
                >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      rounded="lg"
                      v-bind="props"
                      :prepend-icon="child.icon"
                      :title="child.title"
                      :value="
                        getMenuItemValue(child, `activator-child-${childIndex}`)
                      "
                      style="font-size: 14px; font-weight: 600"
                    ></v-list-item>
                  </template>

                  <v-list-item
                    rounded="lg"
                    color="primary"
                    v-for="(subChild, subChildIndex) in child.children"
                    :key="
                      getMenuItemKey(
                        subChild,
                        subChildIndex,
                        `subchild-${getMenuItemKey(child, childIndex)}`
                      )
                    "
                    :value="
                      getMenuItemValue(subChild, `subitem-${subChildIndex}`)
                    "
                    :to="subChild.to"
                  >
                    <template v-slot:prepend>
                      <v-icon :icon="subChild.icon"></v-icon>
                    </template>
                    <v-list-item-title
                      v-text="subChild.title"
                      style="font-size: 14px; font-weight: 600"
                    ></v-list-item-title>
                  </v-list-item>
                </v-list-group>
              </template>
            </v-list-group>
            <div
              class="text-caption text-grey px-4 py-2"
              v-else-if="item.group"
            >
              {{ item.group }}
            </div>
            <!-- Fallback for items without children -->
            <v-list-item
              :to="item.to"
              :value="getMenuItemValue(item, `item-${itemIndex}`)"
              v-else-if="
                !item.children || (item.children && !item.children.length)
              "
              color="primary"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              <v-list-item-title
                v-text="item.title"
                style="font-size: 14px; font-weight: 600"
              ></v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
        <v-divider></v-divider>

        <p style="font-size: 12px; line-height: 1.8" class="text-center pa-2">
          <span>ProConnect &copy; {{ new Date().getFullYear() }}</span
          ><br />
          Supported by
          <br />
          <img
            class="mt-1"
            src="/images/logo-aseanta.jpg"
            alt="Aseanta"
            style="width: 140px"
          />
        </p>
      </div>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <NuxtPage />
    </v-main>

    <ConfirmDialog />
    <!-- Footer -->
    <Snackbar />
  </v-app>
</template>

<script setup>
import Notification from "~/components/notification.vue";
import { useScreenSize } from "~/composables/useScreenSize";

const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { isMobile, isDesktop } = useScreenSize();
const { $apiFetch } = useApi();

// Determine if the drawer should be permanent
const drawer = ref(false); // Start with the drawer closed by default
const { me, fetchMe } = useUser();

// Methods
const dialog = useDialogStore();
const handleLogout = async () => {
  try {
    await dialog.openDialog({
      title: "Logout",
      message: "Are you sure you want to logout?",
      confirmButtonText: "Logout",
      confirmButtonColor: "error",
    });

    authStore.clearToken();
    router.push("/login");
  } catch (error) {
    console.log("Logout error:", error);
  }
};

// Toggle drawer state for mobile view
const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

const loading = ref(true);

// Helper function to ensure value is always a valid string
const getMenuItemValue = (item, fallback = "") => {
  if (!item) return String(fallback || "");
  const value = item.id || item.title || fallback;
  // Ensure we never return undefined, null, or Symbol
  if (value === undefined || value === null || typeof value === "symbol") {
    return String(fallback || "");
  }
  return String(value);
};

// Helper function to ensure key is always a valid string
const getMenuItemKey = (item, index, prefix = "") => {
  if (!item) return String(`${prefix}-${index}`);
  const value = item.id || item.title || `${prefix}-${index}`;
  if (value === undefined || value === null || typeof value === "symbol") {
    return String(`${prefix}-${index}`);
  }
  return String(value);
};

// Computed property to combine API menus with hardcoded menus for sys_admin
const displayMenus = computed(() => {
  const apiMenus = me.value.menus || [];

  // Check if user is sys_admin
  const isSysAdmin =
    me.value.roles?.some((role) => role.assignment?.role === "sys_admin") ||
    me.value.user_role === "sys_admin";

  return apiMenus;

  // For sys_admin, inject skill match menus into "admin-settings" menu and other masters menu into "admin-master-data" menu
});

const getProfile = async () => {
  loading.value = true;
  // Ensure token is loaded from cookie before making API call
  // This is important when token comes from query parameter
  authStore.loadToken();
  await fetchMe(true);
  loading.value = false;
  if (!me.value.user_role) {
    router.replace("/admin/profile/choose-role");
    return;
  }

  if (
    me.value.user_role == "candidate" &&
    (me.value.wizard_state == null ||
      (Array.isArray(me.value.wizard_state) &&
        me.value.last_wizard_state < me.value.wizard_state.length))
  ) {
    if(me.value.wizard_state == null){
      router.replace(`/admin/profile/candidate/1`);
    } else {
      router.replace(`/admin/profile/candidate/${me.value.last_wizard_state || 1}`);
    }    
    return;
  } else if (["employer", "company"].includes(me.value.user_role)) {
    const isOwnerHq =
      me.value.roles?.some(
        (role) => role.assignment.company_role === "owner_hq"
      ) || me.value.company_role === "owner_hq";

    if (
      isOwnerHq &&
      me.value.last_wizard_state < me.value.wizard_state.length
    ) {
      const min_state =
        me.value.wizard_state.find((item) => item.state == 0)?.id || 1;
      router.replace(`/admin/profile/employer/${min_state || 1}`);
      return;
    } else if(Array.isArray(me.value.roles) && me.value.roles.length == 0) {
      loading.value = false;
      router.replace("/admin/profile/choose-role");    
      return;      
    }
  }
  loading.value = false;
};

onMounted(() => {
  drawer.value = isDesktop.value;
  getProfile();
});
</script>

<style></style>
