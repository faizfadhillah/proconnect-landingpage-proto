<template>
  <v-container class="pa-4">
    <v-card elevation="0" rounded="xl">
      <v-card-text>
        <v-form v-model="valid" ref="form" @submit.prevent="handleSubmit">
          <v-row>
            <v-col cols="12" v-if="!isFillment">
              <h2 class="mb-2">Skills & Languages</h2>
              <p class="text-grey mb-5">
                Highlight your key skills and languages that support your
                professional profile
              </p>
            </v-col>
            <v-col cols="12">
              <div class="mb-2">
                <h4 class="font-weight-medium">Skills (optional)</h4>
                <small class="text-grey">
                  List the key skills that showcase your strengths and expertise
                </small>
              </div>
              <!-- Skill Search -->
              <v-autocomplete
                placeholder="You may select more than one skill"
                v-model="current.skills"
                :items="models.skill.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                v-model:search="searchSkill"
                :loading="models.skill.loading"
                @update:search="
                  handleInput($event, 'skill', ['name'], 'mst-skills')
                "
                :error-messages="errors.skill_id"
                rounded="lg"
                multiple
                hide-no-data
              >
                <template v-slot:chip="{ props, item }">
                  <v-chip
                    v-bind="props"
                    label
                    :color="
                      getSkillVerifiedStatus(item.raw.id)
                        ? '#e8a034'
                        : 'primary'
                    "
                    class="text-white"
                    variant="flat"
                    :closable="!getSkillVerifiedStatus(item.raw.id)"
                  >
                    <div class="d-flex align-center gap-1">
                      <span>{{ item.raw.name }}</span>
                      <VerifiedBadge
                        v-if="getSkillVerifiedStatus(item.raw.id)"
                        :is-verified="true"
                        :light="true"
                        :just-icon="true"
                      />
                    </div>
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12">
              <div class="mb-2">
                <h4 class="font-weight-medium">
                  Mastered Languages (optional)
                </h4>
                <small class="text-grey">
                  List the languages you can use proficiently
                </small>
              </div>
              <!-- Skill Search -->
              <v-autocomplete
                placeholder="You may select more than one language"
                v-model="current.languages"
                :items="models.language.items"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="comfortable"
                v-model:search="searchLanguage"
                :loading="models.language.loading"
                @update:search="
                  handleInput($event, 'language', ['name'], 'mst-languages')
                "
                :error-messages="errors.language_id"
                rounded="lg"
                multiple
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

              <!-- Selected Skills -->
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
const { models, debouncedFetch, fetch } = useDynamicSearch([
  "skill",
  "language",
]);
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event, fields, endpoint);
};
// Date picker menus
const current = ref({
  skills: [],
  skills_verified: [],
  languages: [],
});

const userSkills = ref({
  items: [],
  loading: false,
});

const userLanguages = ref({
  items: [],
  loading: false,
});
const loadingInitial = ref(true);
const isUpdatingSkills = ref(false);
const fetchUserSkills = async () => {
  loadingInitial.value = true;
  userSkills.value.loading = true;
  try {
    const response = await $apiFetch("/user-skills/search", {
      params: {
        filters: {
          user_id: me.value.id,
          skill_id: current.value.skills,
        },
        limit: 100
      },
      
    });
    userSkills.value.items = response.items;
    isUpdatingSkills.value = true;
    current.value.skills = userSkills.value.items.map((item) => item.skill_id);
    isUpdatingSkills.value = false;
    current.value.skills_verified = userSkills.value.items.filter((item) => {
      if (!item.is_verified) {
        return item.skill_id;
      }
    });
    fetch("skill", current.value.skills, "id", "mst-skills", 100);
  } catch (error) {
    console.error("Error fetching skills:", error);
  } finally {
    userSkills.value.loading = false;
    loadingInitial.value = false;
  }
};

const fetchUserLanguages = async () => {
  userLanguages.value.loading = true;
  try {
    const response = await $apiFetch("/user-languages/search", {
      params: {
        filters: {
          user_id: me.value.id,
        },
      },
    });
    userLanguages.value.items = response.items;
    current.value.languages = userLanguages.value.items.map(
      (item) => item.language_id
    );
    fetch("language", current.value.languages, "id", "mst-languages");
  } catch (error) {
    console.error("Error fetching skills:", error);
  } finally {
    userLanguages.value.loading = false;
  }
};
// Fetch existing skills

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  fetchUserSkills();
  fetchUserLanguages();
  debouncedFetch("language", "-1", ["name"], "mst-languages");
});

const errors = ref({
  user_id: null,
  skill_id: null,
  language_id: null,
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
    const newSkills = current.value.skills.filter(
      (skill) => !userSkills.value.items.some((item) => item.skill_id === skill)
    );
    const newLanguages = current.value.languages.filter(
      (language) =>
        !userLanguages.value.items.some((item) => item.language_id === language)
    );
    // Filter out verified skills from deletion
    const deleteSkills = userSkills.value.items.filter(
      (skill) =>
        !current.value.skills.includes(skill.skill_id) && !skill.is_verified
    );
    const deleteLanguages = userLanguages.value.items.filter(
      (language) => !current.value.languages.includes(language.language_id)
    );

    for (const skill of newSkills) {
      await $apiFetch("/user-skills", {
        method: "POST",
        body: {
          user_id: me.value.id,
          skill_id: skill,
        },
      });
    }

    for (const language of newLanguages) {
      await $apiFetch("/user-languages", {
        method: "POST",
        body: {
          user_id: me.value.id,
          language_id: language,
          language_name: models.value.language.items.find(
            (item) => item.id === language
          )?.name,
        },
      });
    }
    for (const skill of deleteSkills) {
      await $apiFetch(`/user-skills/${skill.id}`, {
        method: "DELETE",
      });
    }
    for (const language of deleteLanguages) {
      await $apiFetch(`/user-languages/${language.id}`, {
        method: "DELETE",
      });
    }

    const index = me.value.wizard_state.findIndex((item) => item.id == 5);
    if (current.value.skills.length > 0 || current.value.languages.length > 0) {
      me.value.wizard_state[index].state = 1;
    } else {
      me.value.wizard_state[index].state = 0;
    }

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        last_wizard_state:
          me.value.last_wizard_state > 5 ? me.value.last_wizard_state : 6,
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
    message: "Skills & Languages updated successfully",
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
      path: "/admin/profile/candidate/6",
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
      path: "/admin/profile/candidate/4",
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
      if (msg.includes("skill")) {
        errors.value.skill_id = msg;
      }
      if (msg.includes("language")) {
        errors.value.language_id = msg;
      }
    });
  }
};

const getSkillVerifiedStatus = (skillId) => {
  const userSkill = userSkills.value.items.find(
    (item) => item.skill_id === skillId
  );
  return userSkill?.is_verified || false;
};

// Prevent verified skills from being removed
watch(
  () => current.value.skills,
  (newSkills) => {
    if (isUpdatingSkills.value) return;

    // Get all verified skill IDs
    const verifiedSkillIds = userSkills.value.items
      .filter((item) => item.is_verified)
      .map((item) => item.skill_id);

    // Check if any verified skills were removed
    const missingVerifiedSkills = verifiedSkillIds.filter(
      (skillId) => !newSkills.includes(skillId)
    );

    // If verified skills were removed, add them back
    if (missingVerifiedSkills.length > 0) {
      isUpdatingSkills.value = true;
      current.value.skills = [
        ...new Set([...newSkills, ...missingVerifiedSkills]),
      ];
      nextTick(() => {
        isUpdatingSkills.value = false;
      });
    }
  },
  { deep: true }
);
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
