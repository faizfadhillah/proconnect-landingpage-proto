<template>
  <v-container class="pa-4">
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-row>
          <v-col cols="12" v-if="!isFillment">
            <h2>Right to Work</h2>
            <p class="text-grey mb-5">
              Please provide your right to work information
            </p>
          </v-col>
          <v-col cols="12">
            <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
              <v-row>
                <template
                  v-for="(rtw, index) in userRightToWork.items"
                  :key="index"
                >
                  <v-divider v-if="index > 0"></v-divider>
                  <v-col
                    cols="12"
                    :class="index % 2 == 0 ? '' : 'bg-grey-lighten-5'"
                  >
                    <v-row>
                      <v-col cols="12" v-if="index > 0">
                        <h3>Right to Work {{ index + 1 }}</h3>
                      </v-col>
                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Country (Optional)</small>
                        </div>
                        <v-select
                          v-model="rtw.salary_country_id"
                          :items="models.salary_country.items"
                          item-title="country_name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Choose from one below"
                          :error-messages="errors.salary_country_id"
                          @update:model-value="handleRightToWork($event, index)"
                          rounded="lg"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <div class="text-grey-darken-2 mb-1">
                          <small>
                            Type of working rights
                            {{ rtw.salary_country_id ? "" : "(Optional)" }}
                          </small>
                        </div>
                        <v-select
                          v-model="rtw.right_to_work_id"
                          :items="
                            models.right_to_work.items.filter(
                              (item) =>
                                item.salary_country_id == rtw.salary_country_id
                            )
                          "
                          item-title="name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Choose from one below"
                          :error-messages="errors.right_to_work_id"
                          :rules="[
                            (v) => {
                              if (rtw.salary_country_id) {
                                return (
                                  !!v ||
                                  'Right to work status is required when country is selected'
                                );
                              }
                              return true;
                            },
                          ]"
                          :loading="models.right_to_work.loading"
                          rounded="lg"
                        >
                          <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props">
                              <template v-slot:title>
                                {{ item.raw.name }}
                                <v-tooltip location="bottom" max-width="300">
                                  <template v-slot:activator="{ props }">
                                    <v-icon
                                      v-bind="props"
                                      size="small"
                                      class="ms-1"
                                      >mdi-information</v-icon
                                    >
                                  </template>
                                  {{ item.raw.description }}
                                </v-tooltip>
                              </template>
                            </v-list-item>
                          </template>
                        </v-select>
                      </v-col>
                      <v-col cols="12" class="d-flex justify-end mb-3">
                        <v-btn
                          variant="outlined"
                          color="error"
                          size="small"
                          class="font-weight-bold"
                          @click="removeRightToWork(index)"
                          >DELETE</v-btn
                        >
                      </v-col>
                    </v-row>
                  </v-col>
                </template>
              </v-row>

              <v-row>
                <v-col cols="12" class="my-5">
                  <v-btn
                    block
                    variant="outlined"
                    color="primary"
                    height="48"
                    size="large"
                    rounded="lg"
                    prepend-icon="mdi-plus"
                    @click="addRightToWork"
                    class="font-weight-bold"
                    >ADD RIGHT TO WORK</v-btn
                  >
                </v-col>
                <v-col cols="12" class="mt-5 d-flex justify-space-between">
                  <v-row>
                    <v-col cols="4">
                      <v-btn
                        v-if="!isFillment"
                        block
                        color="primary"
                        class="mb-4"
                        size="large"
                        rounded="lg"
                        variant="outlined"
                        @click="handleBack"
                      >
                        Back
                      </v-btn>
                    </v-col>
                    <v-col cols="4"></v-col>
                    <v-col cols="4">
                      <v-btn
                        block
                        color="primary"
                        size="large"
                        rounded="lg"
                        type="submit"
                        :loading="loading"
                      >
                        {{ route.query.edit || isFillment ? "Save" : "Next" }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-dialog v-model="loadingInitial" persistent width="auto" max-width="200">
      <v-card
        height="130"
        class="d-flex flex-column align-center justify-center text-center mx-auto pa-3"
        rounded="xl"
        style="background-color: rgba(255, 255, 255, 0.9)"
      >
        <v-img :src="`/logo-double.svg`" width="100" class="mb-3" />
        <div class="d-flex align-center justify-center mb-2">
          <v-progress-circular
            size="25"
            width="3"
            indeterminate
            color="primary"
            class="mr-2"
          >
          </v-progress-circular>
          <strong style="font-size: 16px" class="text-primary">
            Loading...
          </strong>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "wizard-candidate",
  middleware: ["auth"],
});

const props = defineProps({
  isFillment: {
    type: Boolean,
    default: false,
  },
});

const { $apiFetch } = useApi();
const router = useRouter();
const form = ref(null);
const valid = ref(false);
const loading = ref(false);
const loadingInitial = ref(true);
const errorMessage = ref("");
const { me, fetchMe } = useUser();

const userRightToWork = ref({ items: [] });

const currentUserRightToWork = ref({
  user_id: me.value.id,
  salary_country_id: null,
  right_to_work_id: null,
});

const errors = ref({
  salary_country_id: "",
  right_to_work_id: "",
});

const { models, debouncedFetch, fetch } = useDynamicSearch([
  "salary_country",
  "right_to_work",
]);
const handleRightToWork = (salary_country_id, index) => {
  fetch(
    "right_to_work",
    salary_country_id,
    ["salary_country_id"],
    "mst-right-to-works"
  );
  if (userRightToWork.value.items[index].right_to_work_id) {
    const isExist = models.value.right_to_work.items
      .filter((item) => item.salary_country_id == salary_country_id)
      .find(
        (item) => item.id == userRightToWork.value.items[index].right_to_work_id
      );
    if (!isExist) {
      userRightToWork.value.items[index].right_to_work_id = null;
    }
  }
};
// Fetch user's existing right to work data
const fetchUserRightToWork = async () => {
  loadingInitial.value = true;
  try {
    const response = await $apiFetch("/user-right-to-works/search", {
      params: {
        filters: {
          user_id: me.value.id,
        },
      },
    });
    userRightToWork.value.items = response.items;
    userRightToWork.value.items.forEach((rtw) => {
      fetch(
        "right_to_work",
        rtw.salary_country_id,
        ["salary_country_id"],
        "mst-right-to-works"
      );
    });
    if (userRightToWork.value.items.length <= 0) {
      addRightToWork();
    }
  } catch (error) {
    console.error("Error fetching user right to work:", error);
  } finally {
    loadingInitial.value = false;
  }
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  await Promise.all([
    fetchUserRightToWork(),
    debouncedFetch(
      "salary_country",
      -1,
      ["country_name"],
      "mst-salary-country"
    ),
  ]);
});

const addRightToWork = () => {
  userRightToWork.value.items.push({
    user_id: me.value.id,
    salary_country_id: null,
    right_to_work_id: null,
  });
};

const removeRightToWorkIds = ref([]);
const removeRightToWorks = async () => {
  removeRightToWorkIds.value.forEach(async (id) => {
    await $apiFetch(`/user-right-to-works/${id}`, {
      method: "DELETE",
    });
  });
};

const dialog = useDialogStore();
const removeRightToWork = async (index) => {
  try {
    await dialog.openDialog({
      title: "Delete Right to Work",
      message: "Are you sure you want to delete this right to work?",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
    });

    const id = userRightToWork.value.items[index].id;
    if (id) {
      removeRightToWorkIds.value.push(id);
    }
    userRightToWork.value.items.splice(index, 1);
  } catch {
    console.log("Delete cancelled");
  }
};

const handleSubmit = async () => {
  const { valid, errors } = await form.value.validate();
  console.log(errors);
  if (!valid) {
    return;
  }

  loading.value = true;
  errors.value = {
    salary_country_id: "",
    right_to_work_id: "",
  };

  try {
    // Save user right to work data
    userRightToWork.value.items = userRightToWork.value.items.filter(
      (rtw) => rtw.salary_country_id && rtw.right_to_work_id
    );

    for (const rtw of userRightToWork.value.items) {
      const rtwData = {
        ...rtw,
        user_id: me.value.id,
      };

      if (rtw.id) {
        await $apiFetch(`/user-right-to-works/${rtw.id}`, {
          method: "PATCH",
          body: rtwData,
        });
      } else {
        await $apiFetch("/user-right-to-works", {
          method: "POST",
          body: rtwData,
        });
      }
    }

    if (removeRightToWorkIds.value.length > 0) {
      await removeRightToWorks();
    }

    // Update wizard state if at least one right to work is added
    const index = me.value.wizard_state.findIndex((item) => item.id == 7);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        userRightToWork.value.items.length > 0 ? 1 : 0;
    }

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 7 ? me.value.last_wizard_state : 8,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to save right to work data";
    showErrorField(error.response?._data?.message);
  } finally {
    loading.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Right to work updated successfully",
    color: "success",
  });
  if (props.isFillment) {
    router.back();
    return;
  }
  if (route.query.edit) {
    const authRoutes = ["/admin/dashboard"];
    const previousPath = router.options.history.state.back;

    if (previousPath && authRoutes.includes(previousPath)) {
      router.back();
    } else {
      router.replace("/admin/profile");
    }
  } else {
    router.push({
      path: "/admin/profile/candidate/8",
      query: route.query,
    });
  }
};

const handleBack = () => {
  if (route.query.edit) {
    router.back();
  } else {
    const authRoutes = ["/login", "/signup", "/signup-verify-otp"];
    const previousPath = router.options.history.state.back;

    if (previousPath && !authRoutes.includes(previousPath)) {
      router.back();
    }
    router.replace({
      path: "/admin/profile/candidate/6",
      query: route.query,
    });
  }
};

const showErrorField = (message) => {
  if (Array.isArray(message)) {
    message.forEach((msg) => {
      if (msg.includes("salary_country_id")) {
        errors.value.salary_country_id = "Salary country is required";
      }
      if (msg.includes("right_to_work_id")) {
        errors.value.right_to_work_id = "Right to work status is required";
      }
    });
  }
};
</script>

<style scoped>
.v-slide-group__content {
  align-items: stretch;
}

.text-truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
