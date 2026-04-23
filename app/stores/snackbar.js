import { defineStore } from "pinia";

export const useSnackbarStore = defineStore("snackbar", {
  state: () => ({
    show: false,
    message: "",
    color: "",
    timeout: 3000,
  }),
  actions: {
    showSnackbar({ message, color = "success", timeout = 3000 }) {
      this.message = message;
      this.color = color;
      this.timeout = timeout;
      this.show = true;
    },
    hideSnackbar() {
      this.show = false;
    },
  },
});
