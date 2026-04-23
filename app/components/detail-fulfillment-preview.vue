<template>
  <v-container style="max-width: 900px">
    <v-card elevation="0" rounded="lg" class="mb-4">
      <v-card-text v-if="Array.isArray(attributes)">
        <v-row>
          <v-col cols="12" v-if="attributes[0].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[0].label || "Personal Details" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[0].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[0].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <div class="d-flex mb-5">
              <v-avatar rounded="lg" size="60" color="grey-lighten-2">
                <v-img
                  v-if="me.photo_url"
                  :src="`${me.photo_url.includes('http') ? '' : BASE_URL}${
                    me.photo_url
                  }`"
                ></v-img>
                <v-icon v-else size="70">mdi-account</v-icon>
              </v-avatar>
              <div class="ml-4">
                <h3 class="font-weight-bold">{{ me.full_name }}</h3>
                <p class="text-grey-darken-1" style="font-size: 12px">
                  <template v-if="me.is_outside_indo">
                    {{ me.other_region }}, {{ me.other_country }}
                  </template>
                  <template v-else>
                    {{ me.region?.full_name }}
                  </template>
                </p>
              </div>
            </div>

            <template
              v-for="field in [
                {
                  name: 'gender',
                  label: 'Gender',
                },
                {
                  name: 'date_of_birth',
                  label: 'Date of Birth',
                },
                {
                  name: 'email',
                  label: 'Email',
                },
                {
                  name: 'phone',
                  label: 'Phone Number',
                },
                {
                  name: 'address',
                  label: 'Address',
                },
                {
                  name: 'resume',
                  label: 'Resume',
                },
              ]"
            >
              <div>
                <div style="font-size: 12px" class="mb-1 text-grey-darken-1">
                  {{ field.label }}
                </div>
                <template v-if="field.name == 'resume'">
                  <v-card
                    v-if="userFiles.length > 0"
                    class="d-flex align-center justify-space-between pa-2"
                    variant="outlined"
                    rounded="lg"
                    style="border: 1px dashed #ccc"
                    max-width="400"
                    :href="BASE_URL + userFiles[0].file_url"
                    target="_blank"
                  >
                    <div>
                      <div class="d-flex align-center mb-1">
                        <v-icon size="20" class="mr-2">mdi-file-outline</v-icon>
                        <span style="font-size: 14px">{{
                          userFiles[0].file_name
                        }}</span>
                      </div>
                      <div style="font-size: 12px" class="text-grey-darken-1">
                        last updated:
                        {{ formatDateTime(userFiles[0].updated_at) }}
                      </div>
                    </div>
                    <v-icon size="16" color="grey">mdi-close</v-icon>
                  </v-card>
                  <template v-else>
                    <p class="text-grey-darken-1">No resume found</p>
                  </template>
                </template>
                <div v-else style="font-size: 14px" class="mb-4">
                  {{ me[field.name] }}
                </div>
              </div>
            </template>
          </v-col>
          <v-divider class="my-4" v-if="attributes[1].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[1].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[1].label || "Career History" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[1].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[1].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col
                cols="12"
                v-for="(item, index) in form['user-career-history']"
                :key="index"
              >
                <div>
                  <h4 class="mb-1">
                    {{
                      item.profession
                        ? capitalizeWords(item.profession.name)
                        : item.job_title
                    }}
                  </h4>
                  <p
                    class="text-grey-darken-1 mb-2"
                    style="font-size: 12px; line-height: 1.6"
                  >
                    <v-icon class="mr-2" size="16">mdi-domain</v-icon
                    ><span>{{ item.company_name }}</span
                    ><br />
                    <v-icon class="mr-2" size="16">mdi-clock-time-four</v-icon
                    ><span>{{
                      calculateDuration(
                        item.start_date,
                        item.end_date,
                        item.is_current
                      )
                    }}</span
                    ><br />
                    <v-icon class="mr-2" size="16">mdi-trophy</v-icon
                    ><span
                      >{{
                        item.achievement_history?.length || 0
                      }}
                      achievements</span
                    >
                  </p>
                  <p style="font-size: 12px" class="text-grey-darken-3">
                    {{
                      item.showFullDescription
                        ? item.job_description
                        : item.job_description?.length > 300
                        ? item.job_description.slice(0, 300) + "..."
                        : item.job_description
                    }}
                  </p>
                  <a
                    v-if="item.job_description?.length > 300"
                    class="text-primary"
                    style="cursor: pointer"
                    @click="
                      item.showFullDescription = !item.showFullDescription
                    "
                  >
                    {{ item.showFullDescription ? "" : "view detail" }}
                  </a>
                </div>
                <div
                  v-if="index < form['user-career-history'].length - 1"
                  class="mt-3"
                  style="border-bottom: 1px dotted #aaa"
                ></div>
              </v-col>
              <v-col
                cols="12"
                class="pa-0"
                v-if="itemLoading['user-career-history']"
              >
                <v-skeleton-loader
                  theme="light"
                  type="article"
                ></v-skeleton-loader>
              </v-col>
              <v-col cols="12" v-else-if="!form['user-career-history']?.length">
                Not specified
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[2].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[2].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[2].label || "Education History" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[2].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[2].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row class="mb-6">
              <v-col
                cols="12"
                v-for="(item, index) in form['user-educations']"
                :key="index"
                class="pt-0"
              >
                <div>
                  <div class="d-flex align-center gap-2 mb-1">
                    <h4 class="mb-0">
                      {{
                        item.education_degree
                          ? capitalizeWords(
                              item.education_degree + " " + item.major
                            )
                          : item.education_degree_id
                      }}
                    </h4>
                    <VerifiedBadge :is-verified="item.is_verified" />
                  </div>
                  <p
                    class="text-grey-darken-1 mb-2"
                    style="font-size: 12px; line-height: 1.6"
                  >
                    <v-icon class="mr-2" size="16">mdi-domain</v-icon
                    ><span>{{ item.institution_name }}</span
                    ><br />
                    <v-icon class="mr-2" size="16">mdi-clock-time-four</v-icon
                    ><span>{{
                      calculateDuration(
                        item.start_date,
                        item.end_date,
                        item.is_current
                      ) || "Not Specified"
                    }}</span>
                  </p>
                </div>
                <div
                  v-if="index < form['user-educations'].length - 1"
                  class="mt-3"
                  style="border-bottom: 1px dotted #aaa"
                ></div>
              </v-col>
              <v-col
                cols="12"
                class="pa-0"
                v-if="itemLoading['user-educations']"
              >
                <v-skeleton-loader
                  theme="light"
                  type="article"
                ></v-skeleton-loader>
              </v-col>
              <v-col cols="12" v-else-if="!form['user-educations']?.length">
                Not specified
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[3].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[3].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[3].label || "Licenses / Certifications" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[3].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[3].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col
                cols="12"
                v-for="(item, index) in form['user-certificates']"
                :key="index"
                class="pt-0"
              >
                <div>
                  <div class="d-flex align-center gap-2 mb-1">
                    <h4 class="mb-0">
                      {{ capitalizeWords(item.license_name) }}
                    </h4>
                    <VerifiedBadge :is-verified="item.is_verified" />
                  </div>
                  <p
                    class="text-grey-darken-1 mb-2"
                    style="font-size: 12px; line-height: 1.6"
                  >
                    <v-icon class="mr-2" size="16">mdi-domain</v-icon
                    ><span>{{ item.issuing_organization }}</span
                    ><br />
                    <v-icon class="mr-2" size="16">mdi-clock-time-four</v-icon
                    ><span>{{
                      calculateDuration(item.issue_date, item.expiry_date)
                    }}</span>
                  </p>
                  <p
                    style="font-size: 12px; text-align: justify"
                    class="text-grey-darken-3"
                  >
                    {{
                      item.showFullDescription
                        ? item.description
                        : item.description?.length > 300
                        ? item.description.slice(0, 300) + "..."
                        : item.description
                    }}
                  </p>
                  <a
                    v-if="item.description?.length > 300"
                    class="text-primary"
                    style="cursor: pointer"
                    @click="
                      item.showFullDescription = !item.showFullDescription
                    "
                  >
                    {{ item.showFullDescription ? "" : "view detail" }}
                  </a>
                </div>
                <div
                  v-if="index < form['user-certificates'].length - 1"
                  class="mt-3"
                  style="border-bottom: 1px dotted #aaa"
                ></div>
              </v-col>
              <v-col
                cols="12"
                class="pa-0"
                v-if="itemLoading['user-certificates']"
              >
                <v-skeleton-loader
                  theme="light"
                  type="article"
                ></v-skeleton-loader>
              </v-col>
              <v-col cols="12" v-else-if="!form['user-certificates']?.length">
                Not specified
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[4].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[4].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[4].label || "Skills & Languages" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[4].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[4].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col cols="12">
                <p class="mb-2">Skill List</p>
                <v-chip
                  v-if="form['user-skills']?.length"
                  class="mr-1 mb-1"
                  :color="item.is_verified ? '#e8a034' : 'primary'"
                  v-for="item in form['user-skills']"
                  :key="item.id"
                  size="x-large"
                >
                  <div class="d-flex align-center gap-1">
                    <span>{{ item.skill.name }}</span>
                    <VerifiedBadge
                      v-if="item.is_verified"
                      :is-verified="true"
                      :light="false"
                      :just-icon="true"
                    />
                  </div>
                </v-chip>
                <p v-else>Not Specified</p>
              </v-col>
              <v-col cols="12">
                <p class="mb-2">Mastered Language</p>
                <v-chip
                  v-if="form['user-languages']?.length"
                  class="mr-1"
                  color="primary"
                  v-for="item in form['user-languages']"
                  :key="item.id"
                  size="x-large"
                >
                  {{ item.language.name }}
                </v-chip>
                <p v-else>Not Specified</p>
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[5].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[5].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[5].label || "Work Preferences" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[5].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[5].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col cols="12">
                <p class="mb-2">Availability</p>
                <p class="font-weight-bold" v-if="me.availability">
                  {{ me.availability }}
                </p>
                <p v-else>Not Specified</p>
              </v-col>
              <v-col cols="12">
                <p class="mb-2">Employment Types</p>
                <v-chip
                  v-if="me.employment_status"
                  class="mr-1"
                  color="primary"
                  size="large"
                  v-for="item in me.employment_status.split(',')"
                  :key="item"
                >
                  {{ capitalizeWords(item) }}
                </v-chip>
                <p v-else>Not Specified</p>
              </v-col>
              <v-col cols="12">
                <p class="mb-2">Working Arrangement Preference</p>
                <v-chip
                  v-if="me.domicile_status"
                  class="mr-1"
                  color="primary"
                  v-for="item in me.domicile_status.split(',')"
                  :key="item"
                >
                  {{ capitalizeWords(item) }}
                </v-chip>
                <p v-else>Not Specified</p>
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[6].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[6].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[6].label || "Right to Work" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[6].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[6].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col
                cols="12"
                v-for="(item, index) in form['user-right-to-works']"
                :key="item.id"
              >
                <p class="mb-2">
                  {{ item.salary_country.country_name }}
                </p>
                <p class="mb-2 text-grey-darken-1">
                  {{ item.right_to_work.name }}
                  <v-tooltip
                    location="bottom"
                    content-class="bg-black"
                    max-width="300"
                  >
                    <template v-slot:activator="{ props }">
                      <v-icon v-bind="props" size="small"
                        >mdi-information</v-icon
                      >
                    </template>
                    <p style="font-size: 13px" class="text-white">
                      {{ item.right_to_work.description }}
                    </p>
                  </v-tooltip>
                </p>
                <div
                  v-if="index < form['user-right-to-works'].length - 1"
                  style="border-bottom: 1px dotted #aaa"
                  class="mt-3"
                ></div>
              </v-col>
              <v-col cols="12" v-if="!form['user-right-to-works']?.length">
                Not specified
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[7].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[7].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[7].label || "Interests" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[7].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[7].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col cols="12">
                <v-chip
                  v-if="form['user-interests']?.length"
                  class="mr-1"
                  color="primary"
                  v-for="item in form['user-interests']"
                  :key="item.id"
                  size="large"
                >
                  {{ item.interest.name }}
                </v-chip>
                <p v-else>Not Specified</p>
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[8].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[8].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ attributes[8].label || "Salary Expectation" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[8].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[8].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col
                cols="12"
                class="pt-0"
                v-for="(item, index) in form['user-salary-country']"
                :key="item.id"
              >
                <p class="mb-2">
                  {{ item.salary_country.country_name }}
                </p>
                <p class="mb-2 text-grey-darken-1">
                  {{ item.salary_country.currency_symbol
                  }}{{ formatNumber(item.min_salary) }} -
                  {{ item.salary_country.currency_symbol
                  }}{{ formatNumber(item.max_salary) }}
                </p>
                <div
                  v-if="index < form['user-salary-country'].length - 1"
                  style="border-bottom: 1px dotted #aaa"
                  class="mt-3"
                ></div>
              </v-col>
              <v-col cols="12" v-if="!form['user-salary-country']?.length">
                Not specified
              </v-col>
            </v-row>
          </v-col>
          <v-divider class="my-4" v-if="attributes[9].state == 1"></v-divider>
          <v-col cols="12" v-if="attributes[9].state == 1">
            <div class="mb-4 d-flex align-center justify-space-between">
              <div>
                <h3 class="font-weight-bold">
                  {{ "Skill Passport (MRA-TP Standard)" }}
                </h3>
                <p style="font-size: 12px" class="text-grey-darken-1">
                  {{ attributes[9].notes }}
                </p>
              </div>
              <v-btn
                v-if="isFillment"
                @click="router.push({ hash: '#' + attributes[9].id })"
                variant="text"
                color="primary"
                class="font-weight-bold"
              >
                Edit
              </v-btn>
            </div>
            <v-row>
              <v-col
                cols="12"
                class="pt-0"
                v-for="(item, index) in form['user-skill-passports']"
                :key="item.id"
              >
                <p style="font-size: 14px">
                  <span>NO. {{ item.number }}</span>
                </p>
                <p
                  class="text-grey-darken-1"
                  style="font-size: 12px; line-height: 1.8"
                >
                  <a
                    :href="BASE_URL + item.file_url"
                    target="_blank"
                    class="text-blue-darken-1"
                    style="text-decoration: none"
                  >
                    <v-icon class="mr-1" size="16">mdi-file</v-icon>
                    {{ item.file_url }}
                  </a>
                  <br />
                  <v-icon
                    class="mr-2"
                    size="16"
                    :color="item.status == 'verified' ? 'green' : ''"
                    >mdi-check-circle</v-icon
                  >
                  <span
                    :class="item.status == 'verified' ? 'text-green' : ''"
                    >{{ item.status }}</span
                  >
                </p>
                <div
                  v-if="index < form['user-skill-passports'].length - 1"
                  style="border-bottom: 1px dotted #aaa"
                  class="mt-3"
                ></div>
              </v-col>
              <v-col cols="12" v-if="!form['user-skill-passports']?.length">
                Not specified
              </v-col>
            </v-row>
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
import { formatNumber } from "~/utils/format";

const props = defineProps({
  attributes: {
    type: Array,
    required: true,
  },
  isFillment: {
    type: Boolean,
    required: true,
  },
  user_id: {
    type: String,
    required: false,
  },
});
const router = useRouter();

const { $apiFetch } = useApi();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const loadingInitial = ref(true);
const entity = ref("users");
const me = ref({});
const fetchMe = async () => {
  const response = await $apiFetch(`/users/${props.user_id}`);
  me.value = response;
};
const encryptedUser = useState("encryptedUser", () => {
  return {
    id: null,
    encrypted_phone: null,
    encrypted_address: null,
    encrypted_date_of_birth: null,
  };
});
const fetchEncryptedUser = async () => {
  const response = await $apiFetch(`/encrypted-user-data/search`, {
    params: {
      filters: {
        user_id: me.value.id,
      },
    },
  });
  if (response.items && response.items[0]) {
    Object.assign(encryptedUser.value, response.items[0]);
    me.value.phone = encryptedUser.value.encrypted_phone;
    me.value.address = encryptedUser.value.encrypted_address;
    me.value.date_of_birth = encryptedUser.value.encrypted_date_of_birth;
  }
};
const panel = ref([]);

const form = ref({}); // Form data object
const isShowFields = ref(false);
const loading = ref(true);

const fields = useState(`${entity.value}fields`, () => []);
const genders = useState("genders", () => []);
const fetchGenders = async () => {
  const response = await $apiFetch(`/configs/key/gender`);
  genders.value = response.value;
};

const userFiles = ref([]);
const fetchUserFiles = async () => {
  const response = await $apiFetch(`/user-files/search`, {
    params: {
      filters: { user_id: me.value.id, file_url: "resume" },
    },
  });
  userFiles.value = response.items;
};

const errors = ref({});

const itemLoading = ref({
  "user-career-history": true,
  "user-educations": true,
  "user-certificates": true,
  "user-skills": true,
  "user-skill-passports": true,
  "user-languages": true,
  "user-right-to-works": true,
  "user-interests": true,
  "user-salary-country": true,
});
// Initialize form based on mode
onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
    fetchEncryptedUser();
  }
  loadingInitial.value = false;
  panel.value = [0];
  fetchGenders();
  await fetchUserFiles();
  $apiFetch("/users/search", {
    params: {
      filters: {
        id: me.value.id,
      },
      expands: "region",
    },
  }).then((data) => {
    Object.assign(me.value, data.items[0]);
  });
  Object.keys(itemLoading.value).forEach((key) => {
    let expands = "";
    switch (key) {
      case "user-career-history":
        expands = "profession,company";
        break;
      case "user-skills":
        expands = "skill";
        break;
      case "user-languages":
        expands = "language";
        break;
      case "user-right-to-works":
        expands = "right_to_work,salary_country";
        break;
      case "user-interests":
        expands = "interest";
        break;
      case "user-salary-country":
        expands = "salary_country";
        break;
    }
    $apiFetch(`/${key}/search`, {
      params: {
        filters: {
          user_id: me.value.id,
        },
        expands: expands,
        sortBy: { created_at: "desc" },
      },
    }).then((data) => {
      if (["user-career-history", "user-certificates"].includes(key)) {
        data.items.map((item) => {
          item.showFullDescription = false;
          return item;
        });
      }
      if (key == "user-skill-passports" && data.items.length > 0) {
        data.items = [data.items[0]];
      }
      form.value[key] = data.items;
      itemLoading.value[key] = false;
    });
  });
});

const projects = ref([
  {
    id: 1,
    name: "E-commerce Platform",
    description: "Online shopping platform",
    role: "Lead Developer",
    status: "Active",
    image: "https://picsum.photos/64",
  },
  {
    id: 2,
    name: "CRM System",
    description: "Customer management system",
    role: "Frontend Developer",
    status: "Completed",
    image: "https://picsum.photos/64",
  },
  {
    id: 3,
    name: "Mobile App",
    description: "iOS and Android application",
    role: "Technical Lead",
    status: "In Progress",
    image: "https://picsum.photos/64",
  },
]);

const getStatusColor = (status) => {
  switch (status) {
    case "Active":
      return "success";
    case "Completed":
      return "info";
    case "In Progress":
      return "warning";
    default:
      return "grey";
  }
};

const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const calculateDuration = (startDate, endDate, isCurrent = false) => {
  if (!startDate) return "";

  const start = new Date(startDate);
  const end = isCurrent || !endDate ? new Date() : new Date(endDate);

  const diffYears = end.getFullYear() - start.getFullYear();
  const diffMonths = end.getMonth() - start.getMonth();
  const totalMonths = diffYears * 12 + diffMonths;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return (
    `${years + (years > 1 ? " years" : " year")} ${
      months + (months > 1 ? " months" : " month")
    }`.trim() + " ago"
  );
};
</script>

<style scoped>
.border-4 {
  border: 4px solid white;
}

.bg-gradient-to-t {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
}

.profile-header {
  position: relative;
  padding-top: 0px;
  padding-bottom: 40px;
  margin-bottom: 24px;
}

.gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 90px;
  background: linear-gradient(90deg, #0090c3 0%, #5d4da8 100%);
}

.profile-content {
  position: relative;
  z-index: 1;
}

.profile-avatar {
  margin-left: 0px;
  background: #f5f5f5;
}

.gap-2 {
  gap: 8px;
}

.gap-4 {
  gap: 16px;
}

:deep(.v-chip) {
  font-size: 12px !important;
  height: 30px !important;
  margin-bottom: 4px;
}

:deep(.v-chip .v-icon) {
  gap: 4px;
}
</style>
