import { defineStore } from "pinia";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    lastUpdated: null,
  }),

  getters: {
    getUnreadNotifications: (state) => {
      return state.notifications.filter((notification) => !notification.read);
    },
    hasUnreadNotifications: (state) => {
      return state.unreadCount > 0;
    },
  },

  actions: {
    setNotifications(notifications) {
      this.notifications = notifications;
      this.updateUnreadCount();
      this.lastUpdated = new Date();
    },

    updateUnreadCount() {
      this.unreadCount = this.notifications.filter((n) => !n.read).length;
    },

    markAsRead(notificationId) {
      const notification = this.notifications.find(
        (n) => n.id === notificationId
      );
      if (notification) {
        notification.read = true;
        this.updateUnreadCount();
      }
    },

    setLoading(loading) {
      this.isLoading = loading;
    },

    // Action untuk trigger refresh notifikasi dari komponen lain
    triggerRefresh() {
      this.lastUpdated = new Date();
    },

    // Action untuk add notifikasi baru (untuk real-time updates)
    addNewNotification(notification) {
      this.notifications.unshift(notification);
      this.updateUnreadCount();
      this.lastUpdated = new Date();
    },
  },
});
