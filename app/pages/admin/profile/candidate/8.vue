<template>
  <v-container class="pa-4">
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-form v-model="valid" ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" v-if="!isFillment">
              <h2 class="mb-2">Interests</h2>
              <p class="text-grey mb-5">
                Let us know what you are interested in professionally
              </p>
            </v-col>
            <v-col cols="12">
              <div class="mb-2">
                <h4 class="font-weight-medium">Interests (optional)</h4>
              </div>
              <!-- Skill Search -->
              <v-autocomplete
                placeholder="You may select more than one skill"
                v-model="current.interests"
                :items="models.interest.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                v-model:search="searchInterest"
                :loading="models.interest.loading"
                @update:search="
                  handleInput($event, 'interest', ['name'], 'mst-interests')
                "
                :error-messages="errors.interest_id"
                rounded="lg"
                multiple
                clearable
                hide-no-data
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    label
                    color="primary"
                    variant="flat"
                    closable
                  >
                    {{ item.raw.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" class="mt-4 d-flex justify-space-between">
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
                    :loading="loadingSubmit"
                  >
                    {{ route.query.edit || isFillment ? "Save" : "Next" }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-form>
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
const loading = ref(false);
const valid = ref(false);
const form = ref(null);
const { me, fetchMe } = useUser();
const searchSkill = ref(null);

// Dynamic search for skills
const { models, debouncedFetch, fetch } = useDynamicSearch(["interest"]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
};
// Date picker menus
const current = ref({
  skills: [],
  languages: [],
});

const userInterests = ref({
  items: [],
  loading: false,
});

const loadingInitial = ref(true);
const fetchUserInterests = async () => {
  loadingInitial.value = true;
  userInterests.value.loading = true;
  try {
    const response = await $apiFetch("/user-interests/search", {
      params: {
        filters: {
          user_id: me.value.id,
          interest_id: current.value.interests,
        },
      },
    });
    userInterests.value.items = response.items;
    current.value.interests = userInterests.value.items.map(
      (item) => item.interest_id
    );
    fetch("interest", current.value.interests, "id", "mst-interests");
  } catch (error) {
    console.error("Error fetching interests:", error);
  } finally {
    userInterests.value.loading = false;
    loadingInitial.value = false;
  }
};

// Fetch existing skills

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchUserInterests();
  debouncedFetch("interest", "-1", ["name"], "mst-interests");
});

const errors = ref({
  user_id: null,
  interest_id: null,
});

// Handle form submission
const loadingSubmit = ref(false);
const handleSubmit = async () => {
  const { valid, errors } = await form.value.validate();
  if (!valid) {
    console.log(errors);
    return;
  }
  loadingSubmit.value = true;
  try {
    const newInterests = current.value.interests.filter(
      (interest) =>
        !userInterests.value.items.some((item) => item.interest_id === interest)
    );
    const deleteInterests = userInterests.value.items.filter(
      (interest) => !current.value.interests.includes(interest.interest_id)
    );

    for (const interest of newInterests) {
      await $apiFetch("/user-interests", {
        method: "POST",
        body: {
          user_id: me.value.id,
          interest_id: interest,
        },
      });
    }
    for (const interest of deleteInterests) {
      await $apiFetch(`/user-interests/${interest.id}`, {
        method: "DELETE",
      });
    }

    const index = me.value.wizard_state.findIndex((item) => item.id == 8);
    if (index !== -1) {
      me.value.wizard_state[index].state =
        current.value.interests.length > 0 ? 1 : 0;
    }
    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 8 ? me.value.last_wizard_state : 9,
        wizard_state: me.value.wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    console.log("Error submitting skills and languages:", error);
    showErrorField(error.response._data.message);
  } finally {
    loadingSubmit.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  snackbar.showSnackbar({
    message: "Interests updated successfully",
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
      path: "/admin/profile/candidate/9",
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
      path: "/admin/profile/candidate/7",
      query: route.query,
    });
  }
};

const showErrorField = (message) => {
  if (Array.isArray(message)) {
    message.forEach((msg) => {
      if (msg.includes("user_id")) {
        errors.value.user_id = msg;
      }
      if (msg.includes("interest")) {
        errors.value.interest_id = msg;
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

.v-chip {
  margin: 4px;
}
</style>
