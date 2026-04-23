<template>
  <v-container style="max-width: 900px">
    <v-row>
      <v-col cols="12">
        <v-card elevation="0" rounded="lg">
          <!-- Gradient Background -->
          <div class="gradient-bg"></div>

          <!-- Profile Content -->
          <v-container>
            <!-- Profile Avatar -->
            <v-avatar
              size="150"
              class="profile-avatar"
              style="border: 4px solid white"
            >
              <v-img
                v-if="user.photo_url"
                :src="
                  user.photo_url.includes('http')
                    ? user.photo_url
                    : BASE_URL + user.photo_url
                "
                alt="Profile"
                cover
              />
              <div
                v-else
                class="d-flex align-center justify-center"
                style="height: 100%"
              >
                <span class="text-h3">{{ getInitials(user.full_name) }}</span>
              </div>
            </v-avatar>

            <!-- Profile Info -->
            <div class="mt-2 mb-2 pl-1">
              <!-- Badges -->
              <div class="d-flex gap-2 mb-2">
                <h2 class="font-weight-bold">
                  {{ user.full_name || "(not set)" }}
                </h2>
                <div class="d-flex gap-2" style="margin-top: 2px">
                  <v-img
                    v-if="user.is_skill_passport_verified"
                    src="/images/asp-badge.svg"
                    width="24"
                    height="24"
                  ></v-img>
                  <v-avatar
                    color="brown"
                    size="24"
                    v-if="user.is_school_verified"
                  >
                    <v-icon size="20">mdi-school-outline</v-icon>
                  </v-avatar>
                </div>
              </div>

              <!-- Contact Info -->
              <div class="d-flex gap-4 text-subtitle-2 text-grey-darken-1">
                <div class="d-flex align-center">
                  <a
                    :href="`tel:${user.phone}`"
                    target="_blank"
                    class="text-grey-darken-1"
                  >
                    <v-icon color="primary" class="mr-2"
                      >mdi-phone-outline</v-icon
                    >
                    {{ user.phone }}
                  </a>
                </div>
                <div class="d-flex align-center">
                  <a
                    :href="`mailto:${user.email}`"
                    target="_blank"
                    class="text-grey-darken-1"
                  >
                    <v-icon color="primary" class="mr-2"
                      >mdi-email-outline</v-icon
                    >
                    {{ user.email }}
                  </a>
                </div>
              </div>
            </div>
          </v-container>
        </v-card>
      </v-col>
      <v-col cols="12" class="pt-1">
        <v-expansion-panels
          theme="dark"
          v-model="panel"
          multiple
          rounded="lg"
          elevation="0"
          color="white"
          bg-color="white"
          style="font-size: 13px"
        >
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Job Applied</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row class="pb-4">
                <v-col
                  cols="12"
                  v-for="(job, index) in userJobs"
                  :key="job.id"
                  class="py-0"
                >
                  <router-link
                    class="text-decoration-none"
                    :to="`/admin/jobs/employer/${job.job.id}/${user.id}/review`"
                  >
                    <div class="d-flex align-center" style="cursor: pointer">
                      <div>
                        <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                          <h4 class="text-black font-weight-bold mb-0">
                            {{ job.job.title }}
                            &nbsp;
                            <template v-if="job.lastApplicantJobStep">
                              <template
                                v-if="
                                  job.lastApplicantJobStep.jobStep.type ==
                                    'SYS_HIRED' &&
                                  job.lastApplicantJobStep.status == 'ACCEPTED'
                                "
                              >
                                <v-chip
                                  size="small"
                                  :color="
                                    colorAjsStatus(
                                      job.lastApplicantJobStep.status,
                                      'employer'
                                    )
                                  "
                                  variant="flat"
                                >
                                  Hired
                                </v-chip>
                              </template>
                              <template v-else>
                                <v-chip
                                  size="small"
                                  variant="tonal"
                                  class="mr-2 my-1"
                                >
                                  {{
                                    job.lastApplicantJobStep.jobStep.step_name
                                  }}
                                </v-chip>
                                <v-chip
                                  size="small"
                                  :color="
                                    colorAjsStatus(
                                      job.lastApplicantJobStep.status,
                                      'employer'
                                    )
                                  "
                                  variant="flat"
                                >
                                  {{
                                    labelAjsStatus(
                                      job.lastApplicantJobStep.status,
                                      "employer"
                                    )
                                  }}
                                </v-chip>
                              </template>
                            </template>
                          </h4>
                          <SkillMatchBadge
                            v-if="
                              job.skill_match !== undefined &&
                              job.skill_match !== null
                            "
                            :skill-match="job.skill_match"
                            :clickable="true"
                            :job-id="job.job.id"
                            :user-id="user.id"
                            @click="openSkillMatchDialog"
                            container-class="mb-0"
                          />
                        </div>
                        <p
                          class="text-grey-darken-1"
                          style="font-size: 12px; line-height: 1.6"
                        >
                          Applied on
                          {{ formatDateWithoutWeekday(job.created_at) }}
                        </p>
                      </div>
                      <v-spacer />
                      <div class="text-right">
                        <template v-if="job.last_applicant_job_step_id">
                          <router-link
                            :to="`/admin/jobs/employer/${job.job.id}/${user.id}/review`"
                          >
                            <v-icon>mdi-chevron-right</v-icon>
                          </router-link>
                        </template>
                        <v-chip
                          v-else
                          size="small"
                          :color="getColorStatus(job.status, 'candidate')"
                          variant="tonal"
                        >
                          {{ capitalizeWords(job.status) }}
                        </v-chip>
                      </div>
                    </div>
                  </router-link>
                  <div
                    v-if="index < userJobs.length - 1"
                    style="border-bottom: 1px dashed #aaa"
                    class="my-2"
                  ></div>
                </v-col>
                <v-col cols="12" class="pa-0" v-if="userJobLoading">
                  <v-skeleton-loader
                    theme="light"
                    type="list-item-two-line"
                  ></v-skeleton-loader>
                </v-col>
                <v-col cols="12" v-else-if="!userJobs?.length">
                  Not specified
                </v-col>
                <v-dialog
                  theme="light"
                  v-model="dialogChangeStatus"
                  indeterminate
                  width="350"
                  persistent
                >
                  <v-card rounded="lg">
                    <v-toolbar class="bg-transparent">
                      <v-toolbar-title>Change Status</v-toolbar-title>
                      <v-btn
                        icon="mdi-close"
                        @click="dialogChangeStatus = false"
                      ></v-btn>
                    </v-toolbar>
                    <v-card-text>
                      <v-radio-group v-model="currentApplicant.status">
                        <v-radio
                          v-for="item in statuses"
                          :key="item.name"
                          :label="item.label"
                          :value="item.name"
                        ></v-radio>
                      </v-radio-group>
                    </v-card-text>
                    <v-card-text>
                      <v-row>
                        <v-col cols="6">
                          <v-btn
                            variant="outlined"
                            color="primary"
                            block
                            rounded="lg"
                            @click="dialogChangeStatus = false"
                            >Cancel</v-btn
                          >
                        </v-col>
                        <v-col cols="6">
                          <v-btn
                            variant="elevated"
                            color="primary"
                            block
                            rounded="lg"
                            :loading="loadingChangeStatus"
                            @click="changeStatusApplicant"
                            >Save</v-btn
                          >
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-dialog>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Personal Detail</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <table style="width: 100%">
                <tbody>
                  <template
                    v-for="field in [
                      {
                        name: 'date_of_birth',
                        label: 'Date of Birth',
                      },
                      {
                        name: 'gender',
                        label: 'Gender',
                      },
                      {
                        name: 'address',
                        label: 'Address',
                      },
                      {
                        name: 'region_id',
                        label: 'City',
                      },
                      {
                        name: 'other_country',
                        label: 'Country',
                      },
                      {
                        name: 'other_region',
                        label: 'Region',
                      },
                      {
                        name: 'postal_code',
                        label: 'Postal Code',
                      },
                    ]"
                  >
                    <template
                      v-if="
                        [
                          'date_of_birth',
                          'gender',
                          'address',
                          'postal_code',
                        ].includes(field.name) ||
                        (['region_id'].includes(field.name) &&
                          user.is_outside_indo === false) ||
                        (['other_country', 'other_region'].includes(
                          field.name
                        ) &&
                          user.is_outside_indo === true)
                      "
                    >
                      <tr>
                        <td valign="top" class="py-1 pr-2" style="width: 20%">
                          {{
                            field.label
                              .replace("Encrypted", "")
                              .replace("Region Id", "City")
                          }}
                        </td>
                        <td valign="top" class="pa-1">:</td>
                        <td valign="top" class="py-1 pl-2">
                          <template v-if="field.name == 'logo_url'">
                            <v-avatar
                              rounded="lg"
                              size="70"
                              class="bg-grey-lighten-3"
                            >
                              <v-img
                                v-if="user[field.name]"
                                :src="user[field.name]"
                              />
                              <v-icon color="grey-darken-1" v-else size="50"
                                >mdi-domain</v-icon
                              >
                            </v-avatar>
                          </template>
                          <template v-else-if="field.name == 'region_id'">
                            {{
                              user.region ? user.region.name : user[field.name]
                            }}
                          </template>
                          <template v-else-if="field.name == 'gender'">
                            {{
                              genders.find((g) => g.name == user[field.name])
                                ? genders.find(
                                    (g) => g.name == user[field.name]
                                  ).label
                                : user[field.name]
                            }}
                          </template>
                          <template v-else>
                            {{ user[field.name] }}
                          </template>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="4">
                          <div style="border-bottom: 1px dotted #aaa"></div>
                        </td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Resume</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <table style="width: 100%">
                <tbody>
                  <tr>
                    <td>
                      <template v-if="userFiles.length > 0">
                        <p>{{ userFiles[0].file_name }}</p>
                      </template>
                      <template v-else>
                        <p>No resume found</p>
                      </template>
                    </td>
                    <td class="text-right">
                      <v-btn
                        v-if="userFiles.length > 0"
                        variant="text"
                        color="primary"
                        size="small"
                        class="font-weight-bold"
                        :href="BASE_URL + userFiles[0].file_url"
                        target="_blank"
                        >Download</v-btn
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Career History</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row>
                <v-col
                  cols="12"
                  v-for="(item, index) in form['user-career-history']"
                  :key="index"
                  class="pt-0"
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
                    <p
                      style="font-size: 12px; text-align: justify"
                      class="text-grey-darken-3"
                    >
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
                <v-col
                  cols="12"
                  v-else-if="!form['user-career-history']?.length"
                >
                  Not specified
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Education History</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row class="mt-0">
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
                        )
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
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Licence / Certificates</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row class="mt-0">
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
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Skills & Languages</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <p class="mb-2">Skill List</p>
                  <v-chip
                    v-if="form['user-skills']?.length"
                    class="mr-1 mb-1"
                    :color="item.is_verified ? '#e8a034' : 'primary'"
                    v-for="item in form['user-skills']"
                    :key="item.id"
                    size="large"
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
                    size="large"
                  >
                    {{ item.language.name }}
                  </v-chip>
                  <p v-else>Not Specified</p>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Work Preferences</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="12">
                  <p class="mb-2">Availability</p>
                  <p class="font-weight-bold" v-if="user.availability">
                    {{ user.availability }}
                  </p>
                  <p v-else>Not Specified</p>
                </v-col>
                <v-col cols="12">
                  <p class="mb-2">Employment Types</p>
                  <v-chip
                    v-if="user.employment_status"
                    class="mr-1"
                    color="primary"
                    size="large"
                    v-for="item in user.employment_status.split(',')"
                    :key="item"
                  >
                    {{ capitalizeWords(item) }}
                  </v-chip>
                  <p v-else>Not Specified</p>
                </v-col>
                <v-col cols="12">
                  <p class="mb-2">Working Arrangement Preference</p>
                  <v-chip
                    v-if="user.domicile_status"
                    class="mr-1"
                    color="primary"
                    v-for="item in user.domicile_status.split(',')"
                    :key="item"
                  >
                    {{ capitalizeWords(item) }}
                  </v-chip>
                  <p v-else>Not Specified</p>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Right to Work</v-expansion-panel-title
            >
            <v-expansion-panel-text>
              <v-row>
                <v-col
                  cols="12"
                  class="pt-0"
                  v-for="(item, index) in form['user-right-to-works']"
                  :key="item.id"
                >
                  <p class="mb-2">
                    {{ item.salary_country.country_name }}
                  </p>
                  <p class="mb-2 text-grey-darken-1">
                    {{ item.right_to_work.code }}
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
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Interests</v-expansion-panel-title
            >
            <v-expansion-panel-text>
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
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Salary Expectation</v-expansion-panel-title
            >
            <v-expansion-panel-text>
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
            </v-expansion-panel-text>
          </v-expansion-panel>

          <v-expansion-panel>
            <v-expansion-panel-title class="font-weight-bold"
              >Skill Passport (MRA-TP Standard)</v-expansion-panel-title
            >
            <v-expansion-panel-text>
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
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

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

    <SkillMatchDialog
      v-model="skillMatchDialog"
      :job-id="selectedSkillMatchJobId"
      :user-id="selectedSkillMatchUserId"
      :is-candidate="true"
    />
  </v-container>
</template>

<script setup>
import { formatNumber, colorAjsStatus, labelAjsStatus } from "~/utils/format";
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
const { $apiFetch } = useApi();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const loadingInitial = ref(true);
const route = useRoute();
const entity = ref("users");
const { me, fetchMe } = useUser();
const user = ref({
  full_name: null,
  email: null,
  date_of_birth: null,
  phone: null,
  address: null,
});
const encryptedUser = useState("encryptedUser", () => {
  return {
    id: null,
    encrypted_phone: null,
    encrypted_address: null,
    encrypted_date_of_birth: null,
  };
});
const fetchUser = async (id) => {
  const response = await $apiFetch(`/users/search`, {
    params: {
      filters: {
        id: id,
      },
      expands: "region",
    },
  });
  Object.assign(user.value, response.items[0]);
};
const fetchEncryptedUser = async () => {
  const response = await $apiFetch(`/encrypted-user-data/search`, {
    params: {
      filters: {
        user_id: user.value.id,
      },
    },
  });
  if (response.items && response.items[0]) {
    Object.assign(encryptedUser.value, response.items[0]);
    user.value.phone = encryptedUser.value.encrypted_phone;
    user.value.address = encryptedUser.value.encrypted_address;
    user.value.date_of_birth = encryptedUser.value.encrypted_date_of_birth;
  }
};

const statuses = ref([]);
const dialogChangeStatus = ref(false);
const currentApplicant = ref({
  id: null,
  status: null,
});
const fetchStatuses = async () => {
  const response = await $apiFetch(`/configs/key/applicant_status`);
  statuses.value = response.value.filter((item) => item.name != "SAVED");
};
const loadingChangeStatus = ref(false);
const changeStatusApplicant = async () => {
  loadingChangeStatus.value = true;
  $apiFetch(`/applicants/${currentApplicant.value.id}`, {
    method: "PATCH",
    body: { status: currentApplicant.value.status },
  })
    .then((response) => {
      fetchUserJobs();
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      dialogChangeStatus.value = false;
      loadingChangeStatus.value = false;
    });
};

const userJobs = ref([]);
const userJobLoading = ref(true);
const fetchUserJobs = async () => {
  userJobs.value = [];
  userJobLoading.value = true;
  let filters = {
    user_id: user.value.id,
    status: [
      "CONNECT",
      "NEED_REVIEW",
      "PROCESS",
      "SCHEDULE_INTERVIEW",
      "ACCEPTED",
      "REJECTED",
    ],
  };
  if (me.value.user_role == "admin") {
  } else {
    filters["job.company_id"] = me.value.company_id;
  }
  const response = await $apiFetch(`/applicants/search`, {
    params: {
      filters: filters,
      expands: "job,lastApplicantJobStep.jobStep",
    },
  });
  userJobs.value = response.items;
  userJobLoading.value = false;
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
      filters: { user_id: user.value.id, file_url: "resume" },
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
  if (me.value.company_id) {
    await fetchMe();
  }
  await fetchUser(route.params.id);
  fetchEncryptedUser();
  fetchUserJobs();
  fetchStatuses();

  loadingInitial.value = false;
  panel.value = [0, 1];
  fetchGenders();
  await fetchUserFiles();
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
          user_id: user.value.id,
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
  console.log(startDate, endDate, isCurrent);
  if (!startDate) return "";

  const start = new Date(startDate);
  const end = isCurrent || !endDate ? new Date() : new Date(endDate);

  const diffYears = end.getFullYear() - start.getFullYear();
  const diffMonths = end.getMonth() - start.getMonth();
  const totalMonths = diffYears * 12 + diffMonths;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  console.log(years, months);

  return `${years + (years > 1 ? " years" : " year")} ${
    months + (months > 1 ? " months" : " month")
  }`.trim();
};

const getColorStatus = (status) => {
  if (!status) return "grey";
  const statusColors = {
    CONNECT: "primary", // Biru - Initial connection
    NEED_REVIEW: "warning", // Orange - Perlu review
    PROCESS: "light-blue", // Light blue - Sedang diproses
    SCHEDULE_INTERVIEW: "yellow-darken-3", // Orange - Jadwal interview
    ACCEPTED: "success", // Hijau - Diterima
    REJECTED: "error", // Merah - Ditolak
  };
  return statusColors[status.toUpperCase()] || "grey";
};

const skillMatchDialog = ref(false);
const selectedSkillMatchJobId = ref(null);
const selectedSkillMatchUserId = ref(null);

const openSkillMatchDialog = (data) => {
  selectedSkillMatchJobId.value = data.jobId;
  selectedSkillMatchUserId.value = data.userId;
  skillMatchDialog.value = true;
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
  height: 24px !important;
}

:deep(.v-chip .v-icon) {
  margin-right: 4px;
}
</style>
