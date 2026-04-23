<template>
  <div>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card rounded="lg" elevation="0" class="pa-4">
            <v-card-title
              class="text-center font-weight-bold red--text text-center py-4"
            >
              Delete Account
            </v-card-title>

            <v-card-subtitle class="text-center mt-2">
              This action cannot be undone. Please be certain.
            </v-card-subtitle>

            <v-divider class="my-4"></v-divider>

            <v-card-text>
              <v-alert
                density="compact"
                type="warning"
                variant="tonal"
                border="start"
                class="mb-4"
              >
                <strong>Warning:</strong> Deleting your account will permanently
                remove all your data from our system.
              </v-alert>

              <p class="mb-4">
                To confirm deletion, please enter your email address below:
              </p>

              <v-text-field
                v-model="emailInput"
                label="Your Email Address"
                placeholder="Enter your email address"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :error-messages="emailError"
                @input="validateEmail"
              ></v-text-field>

              <div class="d-flex justify-center mt-6">
                <v-btn
                  color="red"
                  size="large"
                  rounded="lg"
                  :disabled="!isEmailValid"
                  @click="confirmDelete"
                  class="px-6"
                >
                  <v-icon start>mdi-delete</v-icon>
                  Delete My Account
                </v-btn>
              </div>
            </v-card-text>

            <v-divider class="my-4"></v-divider>

            <v-card-actions class="justify-center">
              <v-btn
                color="grey-darken-1"
                variant="text"
                to="/admin/account"
                rounded="lg"
              >
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="500px">
      <v-card rounded="lg">
        <v-card-title class="bg-red text-white py-3">
          Final Confirmation
        </v-card-title>
        <v-card-text class="pa-4 pt-6">
          <p>Are you absolutely sure you want to delete your account?</p>
          <p class="mt-2">This action <strong>cannot be reversed</strong>.</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showConfirmDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn color="red" @click="deleteAccount" :loading="loading">
            Yes, Delete My Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

const { $apiFetch } = useApi();
const router = useRouter();
const authStore = useAuthStore();
const { me, fetchMe } = useUser();

const emailInput = ref("");
const emailError = ref("");
const isEmailValid = ref(false);
const showConfirmDialog = ref(false);
const loading = ref(false);

// Fetch user data if not already available
onMounted(async () => {
  if (!me.value.id || !me.value.email) {
    try {
      await fetchMe();
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }
});

// Validate email input against user's actual email
const validateEmail = () => {
  if (!emailInput.value) {
    emailError.value = "Email is required";
    isEmailValid.value = false;
    return;
  }

  if (emailInput.value !== me.value.email) {
    emailError.value = "Email does not match your account email";
    isEmailValid.value = false;
    return;
  }

  emailError.value = "";
  isEmailValid.value = true;
};

// Show confirmation dialog
const confirmDelete = () => {
  showConfirmDialog.value = true;
};

// Delete account

const deleteAccount = async () => {
  loading.value = true;
  try {
    await $apiFetch(`/users/${me.value.id}`, {
      method: "DELETE",
    });
    // Handle successful deletion
    await authStore.clearToken();
    router.push("/login");
  } catch (error) {
    console.error("Failed to delete account:", error);
    // Handle error
  } finally {
    loading.value = false;
    showConfirmDialog.value = false;
  }
};
</script>
