<template>
  <div>
    <v-container>
      <v-row>
        <v-col cols="12" md="8" lg="6" class="mx-auto">
          <v-card rounded="lg" elevation="0">
            <v-card-title class="font-weight-bold text-center py-4"
              >Reset Password</v-card-title
            >
            <v-card-text>
              <p class="text-body-2 mb-4">
                Change your password by entering your current password and a new
                password below.
              </p>

              <v-form ref="form" @submit.prevent="resetPassword">
                <v-text-field
                  v-model="currentPassword"
                  label="Current Password"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock-outline"
                  append-inner-icon="mdi-eye"
                  @click:append-inner="
                    showCurrentPassword = !showCurrentPassword
                  "
                  :error-messages="currentPasswordErrors"
                  density="comfortable"
                  variant="outlined"
                  rounded="lg"
                  class="mb-3"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="newPassword"
                  label="New Password"
                  :type="showNewPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock"
                  append-inner-icon="mdi-eye"
                  @click:append-inner="showNewPassword = !showNewPassword"
                  :error-messages="newPasswordErrors"
                  density="comfortable"
                  variant="outlined"
                  rounded="lg"
                  class="mb-3"
                  required
                ></v-text-field>

                <v-text-field
                  v-model="confirmPassword"
                  label="Confirm New Password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  prepend-inner-icon="mdi-lock-check"
                  append-inner-icon="mdi-eye"
                  @click:append-inner="
                    showConfirmPassword = !showConfirmPassword
                  "
                  :error-messages="confirmPasswordErrors"
                  density="comfortable"
                  variant="outlined"
                  rounded="lg"
                  class="mb-5"
                  required
                ></v-text-field>

                <v-alert
                  v-if="successMessage"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ successMessage }}
                </v-alert>

                <v-alert
                  v-if="errorMessage"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ errorMessage }}
                </v-alert>

                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
                  rounded="lg"
                  height="48"
                >
                  Change Password
                </v-btn>
              </v-form>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
              <v-btn
                variant="text"
                to="/admin/account"
                color="primary"
                rounded="lg"
              >
                Back to Account Settings
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const currentPasswordErrors = ref([]);
const newPasswordErrors = ref([]);
const confirmPasswordErrors = ref([]);
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const form = ref(null);
const validateForm = async () => {
  let isValid = true;
  currentPasswordErrors.value = [];
  newPasswordErrors.value = [];
  confirmPasswordErrors.value = [];
  errorMessage.value = "";

  if (!currentPassword.value) {
    currentPasswordErrors.value.push("Current password is required");
    isValid = false;
  }

  if (!newPassword.value) {
    newPasswordErrors.value.push("New password is required");
    isValid = false;
  } else {
    if (newPassword.value.length < 8) {
      newPasswordErrors.value.push("Password must be at least 8 characters");
      isValid = false;
    }
    if (!/[A-Z]/.test(newPassword.value)) {
      newPasswordErrors.value.push("Password must contain uppercase letter");
      isValid = false;
    }
    if (!/[0-9]/.test(newPassword.value)) {
      newPasswordErrors.value.push("Password must contain number");
      isValid = false;
    }
    if (!/[!@#$%^&*(),.?\:{}|<>]/.test(newPassword.value)) {
      newPasswordErrors.value.push("Password must contain special character");
      isValid = false;
    }
  }

  if (!confirmPassword.value) {
    confirmPasswordErrors.value.push("Confirm password is required");
    isValid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    confirmPasswordErrors.value.push("Passwords do not match");
    isValid = false;
  }

  if (currentPassword.value === newPassword.value) {
    newPasswordErrors.value.push(
      "New password must be different from current password"
    );
    isValid = false;
  }

  return isValid;
};

const resetPassword = async () => {
  if (!(await validateForm())) {
    return;
  }

  loading.value = true;
  successMessage.value = "";
  errorMessage.value = "";

  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      errorMessage.value = "You must be logged in to change your password";
      loading.value = false;
      return;
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword.value
    );

    try {
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      console.error("Re-authentication error:", error);
      currentPasswordErrors.value.push("Current password is incorrect");
      loading.value = false;
      return;
    }

    // Update the password
    await updatePassword(user, newPassword.value);

    // Clear form after successful password change
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    successMessage.value = "Your password has been successfully updated";
  } catch (error) {
    console.error("Password update error:", error);
    errorMessage.value =
      error.message || "Failed to update password. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>
