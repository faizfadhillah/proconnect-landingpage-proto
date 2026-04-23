<template>
  <div>
    <v-menu
      v-model="isOpen"
      :close-on-content-click="false"
      :close-on-back="true"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props" @click="handleNotificationClick">
          <v-badge
            v-if="unreadCount > 0"
            color="error"
            size="small"
            :content="unreadCount"
            class="mr-2"
          >
            <v-icon size="24">mdi-bell-outline</v-icon>
          </v-badge>
          <v-icon v-else size="24">mdi-bell-outline</v-icon>
        </v-btn>
      </template>
      <v-list
        class="notification-list"
        three-line
        style="max-width: 400px; height: 600px; overflow-y: auto"
      >
        <v-list-item>
          <v-list-item-title>Notifications</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>

        <template v-for="(notification, i) in notifications" :key="i">
          <div style="height: 1px; border-bottom: 1px dashed #d3d3d3"></div>
          <v-list-item
            @click="markAsRead(notification)"
            :class="{ 'notification-item--unread': !notification.read }"
          >
            <template v-slot:prepend>
              <v-avatar
                v-if="notification.avatar || notification.image"
                size="50"
                rounded="lg"
              >
                <v-img
                  v-if="notification.image"
                  :src="
                    notification.image.includes('http')
                      ? notification.image
                      : BASE_URL + notification.image
                  "
                  class="bg-grey"
                />
                <v-img
                  v-else-if="notification.avatar"
                  :src="
                    notification.avatar.includes('http')
                      ? notification.avatar
                      : BASE_URL + notification.avatar
                  "
                />
              </v-avatar>
              <v-icon v-else size="55">mdi-account-circle-outline</v-icon>
            </template>
            <template v-slot:default>
              <div class="py-2">
                <p class="text-grey-darken-2" style="font-size: 12px">
                  <strong>{{ notification.title }}</strong> -
                  {{ notification.body }}
                </p>
                <p class="text-grey-darken-2" style="font-size: 13px">
                  <small>{{
                    formatTimeAgo(notification.dateAt, "en-US")
                  }}</small>
                </p>
                <template v-if="notification.data?.job">
                  <v-btn
                    color="primary"
                    size="x-small"
                    depressed
                    elevation="0"
                    @click.stop="actionNotification(notification)"
                    v-if="me.user_role == 'candidate'"
                    >view job</v-btn
                  >
                  <v-btn
                    color="primary"
                    size="x-small"
                    depressed
                    elevation="0"
                    @click.stop="actionNotification(notification)"
                    v-if="
                      ['company', 'employer'].includes(me.user_role) &&
                      notification.data?.candidate
                    "
                    >view applicant</v-btn
                  >
                </template>
                <template v-else-if="notification.data?.applicant">
                  <v-btn
                    color="primary"
                    size="x-small"
                    depressed
                    elevation="0"
                    @click.stop="actionNotification(notification)"
                    v-if="me.user_role == 'candidate'"
                    >view job</v-btn
                  >
                  <v-btn
                    color="primary"
                    size="x-small"
                    depressed
                    elevation="0"
                    @click.stop="actionNotification(notification)"
                    v-if="['company', 'employer'].includes(me.user_role)"
                    >view applicant</v-btn
                  >
                </template>
              </div>
            </template>
          </v-list-item>
        </template>
        <v-skeleton-loader
          v-if="isLoading"
          type="list-item-two-line"
          height="100"
        ></v-skeleton-loader>
        <v-list-item v-else-if="notifications.length === 0">
          <template v-slot:default>
            <div class="d-flex align-center justify-center py-8">
              <div class="text-center">
                <v-icon size="64" color="grey-lighten-1"
                  >mdi-bell-off-outline</v-icon
                >
                <div class="text-grey-darken-1 mt-2">No notifications yet</div>
              </div>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { onMessage } from "firebase/messaging";

const { $firebaseRequestPermission, $firebaseMessaging } = useNuxtApp();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";

// Import notification store
const notificationStore = useNotificationStore();

// State untuk tracking permission dan token
const notificationPermission = ref(null);
const fcmTokenInitialized = ref(false);

// Function untuk handle click notification button
const handleNotificationClick = async () => {
  // Hanya request permission jika belum pernah di-request atau denied
  if (notificationPermission.value === null) {
    await initializeNotificationPermission();
  }

  // Refresh notifications ketika menu dibuka
  if (!isLoading.value) {
    //fetchNotifications();
  }
};

// Function untuk initialize notification permission (hanya sekali)
const initializeNotificationPermission = async () => {
  try {
    // Cek current permission status
    const currentPermission = Notification.permission;
    notificationPermission.value = currentPermission;

    if (currentPermission === "default") {
      // Hanya request jika belum pernah di-request
      const token = await $firebaseRequestPermission();
      if (token) {
        fcmTokenInitialized.value = true;
        notificationPermission.value = "granted";
      }
    } else if (currentPermission === "granted" && !fcmTokenInitialized.value) {
      // Jika permission sudah granted tapi token belum di-save
      const token = await $firebaseRequestPermission();
      if (token) {
        fcmTokenInitialized.value = true;
      }
    }
  } catch (error) {
    console.error("Error initializing notification permission:", error);
  }
};

// Function untuk periodic token refresh (optional, untuk kasus edge case)
const refreshTokenPeriodically = () => {
  // Refresh token setiap 24 jam sekali
  setInterval(async () => {
    if (notificationPermission.value === "granted") {
      try {
        await $firebaseRequestPermission();
        console.log("FCM token refreshed");
      } catch (error) {
        console.error("Error refreshing FCM token:", error);
      }
    }
  }, 24 * 60 * 60 * 1000); // 24 jam
};

const isOpen = ref(false);
const router = useRouter();

// Gunakan store untuk notifications dan unreadCount
const notifications = computed(() => notificationStore.notifications);
const unreadCount = computed(() => notificationStore.unreadCount);

const markAsRead = async (notification) => {
  if (!notification.read) {
    try {
      await $apiFetch(`/firebase/read-notification/${notification.id}`, {
        method: "POST",
      });
      // Update store
      notificationStore.markAsRead(notification.id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }
};

const actionNotification = async (notification) => {
  if (notification.data?.job) {
    const job = notification.data.job;
    if (me.value.user_role == "candidate") {
      router.push(`/admin/jobs/applied/${job.id}`);
    } else if (
      ["company", "employer"].includes(me.value.user_role) &&
      notification.data?.candidate
    ) {
      router.push(
        `/admin/jobs/employer/${job.id}/${notification.data?.candidate?.id}/review`
      );
    }
  } else if (notification.data?.applicant) {
    const applicant = notification.data.applicant;
    if (me.value.user_role == "candidate") {
      let page = "saved";
      switch (applicant.status) {
        case "SAVED":
          page = "saved";
          break;
        default:
          page = "applied";
          break;
      }
      if (page == "applied") {
        router.push(`/admin/jobs/${page}/${applicant.job_id}`);
      } else {
        router.push(`/admin/jobs/${page}?id=${applicant.job_id}`);
      }
    } else if (["company", "employer"].includes(me.value.user_role)) {
      router.push(
        `/admin/jobs/employer/${applicant.job_id}/${applicant.user_id}/review`
      );
    }
  }
};

const { $apiFetch } = useApi();
const jobs = ref([]);
const job_ids = ref([]);

const fetchNotifications = async () => {
  notificationStore.setLoading(true);
  try {
    const response = await $apiFetch("/firebase/list-notification");
    const jobIds = [];
    response.items.forEach((notification) => {
      if (
        notification.data?.applicant?.job_id &&
        !job_ids.value.includes(notification.data?.applicant?.job_id)
      ) {
        job_ids.value.push(notification.data?.applicant?.job_id);
        jobIds.push(notification.data?.applicant?.job_id);
      }
    });

    // Update store dengan notifications baru
    notificationStore.setNotifications(response.items);
  } catch (error) {
    console.error("Error fetching notifications:", error);
  } finally {
    notificationStore.setLoading(false);
  }
};

const isLoading = computed(() => notificationStore.isLoading);
const me = useState("me", () => {
  return {
    id: null,
    user_role: null,
  };
});

// Setup Firebase messaging event listener untuk foreground notifications
const setupMessagingListener = () => {
  // Tunggu sampai messaging tersedia
  nextTick(() => {
    if (process.client && $firebaseMessaging) {
      onMessage($firebaseMessaging, (payload) => {
        console.log("Message received in foreground: ", payload);

        // Show browser notification
        if (Notification.permission === "granted") {
          new Notification(payload.notification?.title || "New Notification", {
            body: payload.notification?.body || "You have a new notification",
            icon: "/logo.png",
            tag: "notification-" + Date.now(),
          });
        }

        // Refresh notifications list
        setTimeout(() => {
          fetchNotifications();
        }, 1000);
      });
    }
  });
};

// Setup service worker listener untuk background notifications
const setupServiceWorkerListener = () => {
  if (process.client && "serviceWorker" in navigator) {
    // Tunggu sampai service worker ready
    navigator.serviceWorker.ready
      .then((registration) => {
        console.log("Service worker is ready, setting up message listener");

        // Remove existing listener jika ada untuk mencegah duplicate
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );

        // Add new listener
        navigator.serviceWorker.addEventListener(
          "message",
          handleServiceWorkerMessage
        );
      })
      .catch((error) => {
        console.error("Service worker not ready:", error);
      });
  }
};

// Separate function untuk handle service worker messages
const handleServiceWorkerMessage = (event) => {
  console.log("Service worker message received:", event.data);

  if (event.data && event.data.type === "BACKGROUND_NOTIFICATION") {
    console.log("Background notification received:", event.data);
    // Refresh notifications when background notification is received
    setTimeout(() => {
      fetchNotifications();

      // Trigger refresh di store untuk notify watchers
      notificationStore.triggerRefresh();
    }, 1000);
  }

  if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
    console.log("Notification clicked:", event.data);
    // Handle notification click jika diperlukan
  }
};

const initData = async () => {
  await fetchNotifications();
  setupMessagingListener();
  setupServiceWorkerListener();

  // Initialize permission check
  notificationPermission.value = Notification.permission;

  // Jika permission sudah granted, pastikan token sudah di-save
  if (notificationPermission.value === "granted") {
    await initializeNotificationPermission();
  }

  // Setup periodic refresh (optional)
  refreshTokenPeriodically();
};

const isPermissionGranted = ref(false);

onMounted(async () => {
  // Check permission status saat component mount
  isPermissionGranted.value = Notification.permission === "granted";
  initData();
});

// Cleanup listener saat component unmounted
onUnmounted(() => {
  if (process.client && "serviceWorker" in navigator) {
    navigator.serviceWorker.removeEventListener(
      "message",
      handleServiceWorkerMessage
    );
  }
});

watch(
  () => me.value.id,
  (newValue) => {
    if (newValue && !isLoading.value) {
      // Re-setup listeners when user changes
      setupMessagingListener();
      setupServiceWorkerListener();
    }
  }
);
</script>

<style scoped>
.notification-list {
  min-width: 350px;
  background: #f5f8fc;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 0;
}
.notification-item {
  border-bottom: 1px dashed #d3d3d3;
  background: #fff;
}
.notification-item:last-child {
  border-bottom: none;
}
.notification-item--unread {
  background: #e9f1fb;
}
.v-list-item-avatar {
  margin-right: 16px;
}
.font-weight-bold {
  font-weight: bold;
}
</style>
