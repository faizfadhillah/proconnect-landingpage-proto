<template>
  <v-snackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    :timeout="snackbar.timeout"
    @timeout="hideSnackbar"
    rounded="pill"
    class="mb-12"
  >
    {{ snackbar.message }}
    <template #actions>
      <v-btn text @click="snackbar.show = false" icon="mdi-close"></v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { useSnackbarStore } from "~/stores/snackbar";

export default {
  name: "Snackbar",
  setup() {
    const snackbar = useSnackbarStore();

    // Method untuk menyembunyikan snackbar
    const hideSnackbar = () => {
      snackbar.hideSnackbar();
    };

    return { snackbar, hideSnackbar };
  },
};
</script>
