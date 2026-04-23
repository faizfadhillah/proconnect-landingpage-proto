import { defineStore } from "pinia";

export const useDialogStore = defineStore("dialog", {
  state: () => ({
    show: false,
    title: "Confirm",
    message: "Are you sure you want to proceed?",
    confirmButtonText: "Confirm",
    cancelButtonText: "Cancel",
    confirmButtonColor: "error",
    cancelButtonColor: "grey-darken-1",
    resolvePromise: null,
    rejectPromise: null,
    autoClose: true,
    loading: false,
  }),

  actions: {
    openDialog({
      title = "Confirm",
      message = "Are you sure you want to proceed?",
      confirmButtonText = "Confirm",
      cancelButtonText = "Cancel",
      confirmButtonColor = "error",
      cancelButtonColor = "grey-darken-1",
      autoClose = true,
    } = {}) {
      this.title = title;
      this.message = message;
      this.confirmButtonText = confirmButtonText;
      this.cancelButtonText = cancelButtonText;
      this.confirmButtonColor = confirmButtonColor;
      this.cancelButtonColor = cancelButtonColor;
      this.autoClose = autoClose;
      this.show = true;

      return new Promise((resolve, reject) => {
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
      });
    },

    confirm() {
      if (this.resolvePromise) {
        this.resolvePromise(true);
      }
      if (this.autoClose) {
        this.show = false;
      }
      this.clearPromises();
    },

    cancel() {
      if (this.rejectPromise) {
        this.rejectPromise(false);
      }

      this.show = false;
      this.clearPromises();
    },

    closeDialog() {
      this.show = false;
      this.loading = false;
      this.clearPromises();
    },

    close() {
      this.show = false;
      this.loading = false;
      this.clearPromises();
    },

    clearPromises() {
      this.resolvePromise = null;
      this.rejectPromise = null;
    },
  },
});
