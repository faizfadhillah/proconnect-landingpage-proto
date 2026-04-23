<template>
  <v-dialog v-model="dialog.show" max-width="530">
    <v-card rounded="xl">
      <v-toolbar class="bg-transparent">
        <v-card-title
          style="font-size: 1.2rem; text-align: center; width: 100%"
          class="font-weight-bold text-center"
        >
          {{ dialog.title }}
          <v-icon
            icon="mdi-close"
            size="small"
            style="float: right"
            @click="dialog.cancel()"
          ></v-icon>
        </v-card-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="dialog.cancel()"></v-btn>
      </v-toolbar>
      <v-card-text
        class="text-grey-darken-2 text-center"
        v-html="dialog.message"
      ></v-card-text>
      <v-card-text>
        <v-row>
          <v-col cols="6" lg="6">
            <v-btn
              variant="outlined"
              :color="dialog.cancelButtonColor"
              @click="dialog.cancel()"
              block
              rounded="lg"
            >
              {{ dialog.cancelButtonText }}
            </v-btn>
          </v-col>
          <v-col cols="6" lg="6">
            <v-btn
              :color="dialog.confirmButtonColor"
              variant="elevated"
              rounded="lg"
              block
              :loading="dialog.loading"
              @click="dialog.confirm()"
            >
              {{ dialog.confirmButtonText }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useDialogStore } from "~/stores/dialog";

const dialog = useDialogStore();
</script>
