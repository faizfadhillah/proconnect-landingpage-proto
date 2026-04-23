<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card rounded="lg" elevation="0">
            <v-card-text>
              <component :is="PageTermOfService" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
import PageTermOfService from "../term-of-service.vue";
</script>
