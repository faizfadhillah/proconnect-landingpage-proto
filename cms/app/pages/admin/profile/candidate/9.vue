<template>
  <v-container class="pa-4">
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-row>
          <v-col cols="12" v-if="!isFillment">
            <h2>Salary Expectation</h2>
            <p class="text-grey mb-5">
              Let us know your desired compensation from spesific country
            </p>
          </v-col>
          <v-col cols="12">
            <v-form ref="form" v-model="valid" @submit.prevent="handleSubmit">
              <v-row>
                <template
                  v-for="(
                    salaryExpectation, index
                  ) in userSalaryExpectation.items"
                  :key="index"
                >
                  <v-divider v-if="index > 0"></v-divider>
                  <v-col
                    cols="12"
                    :class="index % 2 == 0 ? '' : 'bg-grey-lighten-5'"
                  >
                    <v-row>
                      <v-col cols="12">
                        <div class="text-grey-darken-2 mb-1">
                          <small>Country (Optional)</small>
                        </div>
                        <v-select
                          v-model="salaryExpectation.salary_country_id"
                          :items="models.salary_country.items"
                          item-title="country_name"
                          item-value="id"
                          variant="outlined"
                          density="comfortable"
                          placeholder="Choose from one below"
                          :error-messages="errors.salary_country_id"
                          rounded="lg"
                          :rules="[
                            (v) => {
                              if (!v) return true;
                              const duplicateCount =
                                userSalaryExpectation.items.filter(
                                  (item) => item.salary_country_id === v
                                ).length;
                              return (
                                duplicateCount <= 1 ||
                                'This country has already been selected'
                              );
                            },
                          ]"
                          @update:model-value="updateCurrencyCode(index)"
                        />
                      </v-col>

                      <v-col cols="12" class="py-0">
                        <v-row>
                          <v-col cols="6" class="py-0">
                            <div class="text-grey-darken-2 mb-1">
                              <small>Minimum Salary</small>
                            </div>
                            <v-currency-field
                              v-model="salaryExpectation.min_salary"
                              placeholder="e.g. 10000"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :error-messages="errors.min_salary"
                              :prefix="currencyCode[index]"
                              :rules="[
                                (value) =>
                                  !salaryExpectation.salary_country_id ||
                                  parseFloat(
                                    value?.toString().replace(/[,.]/g, '')
                                  ) > 0 ||
                                  'Minimum salary must be greater than 0',
                              ]"
                            />
                          </v-col>
                          <v-col cols="6" class="py-0">
                            <div class="text-grey-darken-2 mb-1">
                              <small>Maximum Salary</small>
                            </div>
                            <v-currency-field
                              v-model="salaryExpectation.max_salary"
                              placeholder="e.g. 10000"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :error-messages="errors.max_salary"
                              :prefix="currencyCode[index]"
                              :rules="[
                                (value) =>
                                  !salaryExpectation.salary_country_id ||
                                  !value ||
                                  (parseFloat(
                                    value?.toString().replace(/[,.]/g, '')
                                  ) > 0 &&
                                    (!salaryExpectation.min_salary ||
                                      parseFloat(
                                        value?.toString().replace(/[,.]/g, '')
                                      ) >
                                        parseFloat(
                                          salaryExpectation.min_salary
                                            ?.toString()
                                            .replace(/[,.]/g, '')
                                        ))) ||
                                  'Maximum salary must be greater than 0 and greater than minimum salary',
                              ]"
                            />
                          </v-col>
                          <v-col cols="12" class="d-flex justify-end mb-3">
                            <v-btn
                              variant="outlined"
                              color="error"
                              size="small"
                              class="font-weight-bold"
                              @click="removeSalaryExpectation(index)"
                              >DELETE</v-btn
                            >
                          </v-col>
                        </v-row>
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
                    @click="addSalaryExpectation"
                    class="font-weight-bold"
                    >ADD SALARY EXPECTATION</v-btn
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

const userSalaryExpectation = ref({ items: [] });
const currencyCode = ref([]);

const errors = ref({
  salary_country_id: "",
  min_salary: "",
  max_salary: "",
});

const { models, debouncedFetch, fetch } = useDynamicSearch(["salary_country"]);
// Fetch user's existing right to work data
const fetchUserSalaryExpectation = async () => {
  loadingInitial.value = true;
  try {
    const response = await $apiFetch("/user-salary-country/search", {
      params: {
        filters: {
          user_id: me.value.id,
        },
      },
    });
    userSalaryExpectation.value.items = response.items;
    if (userSalaryExpectation.value.items.length <= 0) {
      addSalaryExpectation();
    }
  } catch (error) {
    console.error("Error fetching user salary expectation:", error);
  } finally {
    loadingInitial.value = false;
  }
};

const updateCurrencyCode = (index) => {
  const salaryCountry = models.value.salary_country.items.find(
    (item) =>
      item.id == userSalaryExpectation.value.items[index].salary_country_id
  );
  currencyCode.value[index] = salaryCountry?.currency_code;
};

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchUserSalaryExpectation();
  debouncedFetch("salary_country", -1, ["country_name"], "mst-salary-country");
});

const addSalaryExpectation = () => {
  userSalaryExpectation.value.items.push({
    user_id: me.value.id,
    salary_country_id: null,
    min_salary: null,
    max_salary: null,
  });
  console.log(userSalaryExpectation.value.items);
};

const removeSalaryExpectationIds = ref([]);
const removeSalaryExpectations = async () => {
  removeSalaryExpectationIds.value.forEach(async (id) => {
    await $apiFetch(`/user-salary-country/${id}`, {
      method: "DELETE",
    });
  });
};

const dialog = useDialogStore();
const removeSalaryExpectation = async (index) => {
  try {
    await dialog.openDialog({
      title: "Delete Salary Expectation",
      message: "Are you sure you want to delete this salary expectation?",
      confirmButtonText: "Delete",
      confirmButtonColor: "error",
    });
    const id = userSalaryExpectation.value.items[index].id;
    if (id) {
      removeSalaryExpectationIds.value.push(id);
    }
    userSalaryExpectation.value.items.splice(index, 1);
  } catch {
    console.log("Delete cancelled");
  }
};

const handleSubmit = async () => {
  const { valid, errors } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  errors.value = {
    salary_country_id: "",
    min_salary: "",
    max_salary: "",
  };

  try {
    // Save user right to work data
    userSalaryExpectation.value.items =
      userSalaryExpectation.value.items.filter(
        (salaryExpectation) => salaryExpectation.salary_country_id
      );

    for (const salaryExpectation of userSalaryExpectation.value.items) {
      const salaryExpectationData = {
        ...salaryExpectation,
        user_id: me.value.id,
      };

      if (salaryExpectation.id) {
        await $apiFetch(`/user-salary-country/${salaryExpectation.id}`, {
          method: "PATCH",
          body: salaryExpectationData,
        });
      } else {
        await $apiFetch("/user-salary-country", {
          method: "POST",
          body: salaryExpectationData,
        });
      }
    }

    if (removeSalaryExpectationIds.value.length > 0) {
      await removeSalaryExpectations();
    }

    // Update wizard state if at least one right to work is added
    const index = me.value.wizard_state.findIndex((item) => item.id == 9);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        userSalaryExpectation.value.items.length > 0 ? 1 : 0;
    }

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 9 ? me.value.last_wizard_state : 10,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value =
      error.message || "Failed to save salary expectation data";
    showErrorField(error.response?._data?.message);
  } finally {
    loading.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Salary expectation updated successfully",
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
      path: "/admin/profile/candidate/10",
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
      path: "/admin/profile/candidate/8",
      query: route.query,
    });
  }
};
const showErrorField = (message) => {
  if (Array.isArray(message)) {
    message.forEach((msg) => {
      if (msg.includes("salary_country_id")) {
        errors.value.salary_country_id = msg;
      }
      if (msg.includes("min_salary")) {
        errors.value.min_salary = msg;
      }
      if (msg.includes("max_salary")) {
        errors.value.max_salary = msg;
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
