<template>
  <v-container fluid>
    <!-- Header stats + actions -->
    <v-row class="mb-4">
      <v-col cols="12" md="9">
        <h2 class="font-weight-bold mb-1">Students</h2>
        <div class="text-grey-darken-1">
          Manage student verification and accounts
        </div>
      </v-col>
      <v-col cols="12" md="3" class="d-flex flex-column flex-md-row justify-end align-stretch align-md-end gap-2">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-upload"
          @click="openUploadDialog"
          rounded="lg"
          class="button-responsive"
        >
          Upload Multiple Students
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="goToCreate"
          rounded="lg"
          class="button-responsive"
        >
          Add Student
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary cards (separate from table card) -->
    <v-row class="mb-2">
      <v-col cols="6" md="3" v-for="card in summaryCards" :key="card.label">
        <v-card rounded="lg" elevation="0" class="pa-4">
          <div class="text-caption text-grey-darken-1 mb-1">
            {{ card.label }}
          </div>
          <h2 class="font-weight-bold">
            {{ card.value ?? "-" }}
          </h2>
        </v-card>
      </v-col>
    </v-row>

    <!-- Students Directory card -->
    <v-card flat rounded="lg" style="border: 1px solid #e0e0e0">
      <v-card-text>
        <div class="font-weight-bold mb-4">Students Directory</div>

        <!-- Filters -->
        <v-row class="align-center">
          <v-col cols="12" md="4">
            <div class="d-flex align-center gap-2">
              <v-select
                v-model="searchType"
                :items="searchTypeOptions"
                item-title="label"
                item-value="value"
                density="comfortable"
                variant="outlined"
                rounded="lg"
                style="max-width: 120px"
                hide-details
              />
              <v-text-field
                v-model="searchKeyword"
                density="comfortable"
                variant="outlined"
                rounded="lg"
                clearable
                :placeholder="`Type your keywords here`"
                prepend-inner-icon="mdi-magnify"
                @keyup.enter="handleSearch"
                hide-details
                class="flex-grow-1"
              />
            </div>
          </v-col>
          <v-col cols="12" md="2">
            <v-autocomplete
              v-model="filters.school_id"
              :items="schoolFilterItems"
              :loading="schoolFilterLoading"
              item-title="name"
              item-value="id"
              density="comfortable"
              variant="outlined"
              rounded="lg"
              clearable
              hide-details
              label="School"
              placeholder="Search school"
              hide-no-data
              @update:search="handleSchoolFilterSearch"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-autocomplete
              v-model="filters.major_id"
              :items="majorFilterItems"
              :loading="majorFilterLoading"
              item-title="major_name"
              item-value="id"
              density="comfortable"
              variant="outlined"
              rounded="lg"
              clearable
              hide-details
              label="Major"
              placeholder="Search major"
              hide-no-data
              @update:search="handleMajorFilterSearch"
            />
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="filters.verification_status"
              :items="verificationStatusOptions"
              density="comfortable"
              variant="outlined"
              rounded="lg"
              clearable
              hide-details
              label="Verification"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-end">
            <v-btn
              color="primary"
              class="mr-2"
              rounded="lg"
              :loading="loading"
              height="45"
              @click="handleSearch"
            >
              Search
            </v-btn>
            <v-btn
              variant="text"
              color="grey-darken-1"
              @click="resetFilters"
              height="45"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-text class="pt-0">
        <v-data-table
          :headers="headers"
          :items="students"
          :items-per-page="params.limit"
          :page="params.page"
          :loading="loading"
          class="students-table"
          item-value="_uniqueKey"
          hide-default-footer
          show-expand
        >
          <template #item.no="{ index }">
            <span class="text-caption">
              {{ (params.page - 1) * params.limit + index + 1 }}
            </span>
          </template>

          <template #item.name="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="40" class="mr-3 bg-grey-lighten-3">
                <v-img
                  v-if="item.photo_url"
                  :src="
                    item.photo_url.includes('http')
                      ? item.photo_url
                      : BASE_URL + item.photo_url
                  "
                  cover
                />
                <v-icon v-else size="26">mdi-account</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-bold">
                  {{ item.full_name || "-" }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  {{ item.email || "-" }}
                </div>
                <div class="text-caption text-grey-darken-1">
                  {{ item.phone_num || "-" }}
                </div>
              </div>
            </div>
          </template>

          <template #item.majors="{ item }">
            <div class="d-flex flex-column gap-1">
              <div
                v-if="item.educations && item.educations.length > 0"
                class="d-flex flex-column gap-0 py-2"
              >
                <!-- Each row now represents 1 education, so show only the first one -->
                <div class="d-flex flex-column">
                  <div class="font-weight-medium" style="font-size: 14px">
                    {{ item.educations[0]?.major || "-" }}
                  </div>
                  <div class="text-grey-darken-1" style="font-size: 12px">
                    {{ formatEducationLevel(item.educations[0]) }} •
                    <span v-if="item.educations[0]?.institution_name">
                      {{ item.educations[0].institution_name }}
                    </span>
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    ID: {{ item.student_ids[0] || "-" }}
                  </div>
                </div>
              </div>
              <span v-else class="text-caption text-grey-darken-1">-</span>
            </div>
          </template>

          <template #item.licenses="{ item }">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-1" color="primary"
                >mdi-certificate</v-icon
              >
              <span class="text-caption text-grey-darken-1">
                {{ item.licenses_count ?? 0 }}
              </span>
            </div>
          </template>

          <template #item.status="{ item }">
            <span class="text-caption">
              {{ item.account_status === "JOINED" ? "Joined" : "Not Joined" }}
            </span>
          </template>

          <template #item.verification="{ item }">
            <v-chip
              v-if="item.status === 'VERIFIED'"
              color="success"
              text-color="green-darken-2"
              size="small"
              class="font-weight-medium"
            >
              Verified
            </v-chip>
            <v-chip
              v-else-if="item.status === 'NEED_VERIFICATION'"
              color="warning"
              size="small"
              class="font-weight-medium"
              text-color="black"
            >
              Need Verification
            </v-chip>
            <v-chip
              v-else-if="item.status === 'EDUCATION_NOT_REGISTERED'"
              color="grey"
              size="small"
              class="font-weight-medium"
            >
              Education Not Registered
            </v-chip>
            <v-chip
              v-else
              color="error"
              size="small"
              class="font-weight-medium"
            >
              Not Verified
            </v-chip>
          </template>

          <template #item.action="{ item }">
            <div class="d-flex align-end justify-end">
              <v-btn
                v-if="
                  item.status === 'VERIFIED' && item.account_status === 'JOINED'
                "
                variant="text"
                color="error"
                size="small"
                class="text-caption mr-2"
                :loading="
                  verifyingId ===
                  (item.educations?.[0]?.user_education_id ||
                    item.student_ids?.[0])
                "
                :disabled="verifyingId !== null"
                @click="openUnverifyAllDialog(item)"
              >
                Unverify
              </v-btn>
              <v-btn
                v-else-if="
                  item.account_status === 'JOINED' &&
                  item.status !== 'EDUCATION_NOT_REGISTERED'
                "
                variant="text"
                color="primary"
                size="small"
                class="text-caption mr-2"
                :loading="
                  verifyingId ===
                  (item.educations?.[0]?.user_education_id ||
                    item.student_ids?.[0])
                "
                :disabled="verifyingId !== null"
                @click="openVerifyAllDialog(item)"
              >
                Verify
              </v-btn>
              <v-btn
                v-else
                variant="text"
                color="grey"
                size="small"
                class="text-caption mr-2"
                disabled
                :title="
                  item.status === 'EDUCATION_NOT_REGISTERED'
                    ? 'Education not registered, cannot verify'
                    : 'Pending students will be automatically verified when they register'
                "
              >
                N/A
              </v-btn>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon variant="text" size="small">
                    <v-icon>mdi-dots-horizontal</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-if="
                      ['NEED_VERIFICATION', 'NOT_VERIFIED'].includes(
                        item.status
                      )
                    "
                    @click="handleEditStudentDetail(item)"
                  >
                    <template #prepend>
                      <v-icon>mdi-account-edit</v-icon>
                    </template>
                    <v-list-item-title>Edit Student Detail</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="item.status === 'EDUCATION_NOT_REGISTERED'"
                    @click="handleEditPendingStudent(item)"
                  >
                    <template #prepend>
                      <v-icon>mdi-account-edit</v-icon>
                    </template>
                    <v-list-item-title>Edit Pending Student</v-list-item-title>
                  </v-list-item>

                  <v-divider v-if="item.account_status === 'JOINED'" />
                  <v-list-item @click="handleDeleteStudent(item)">
                    <template #prepend>
                      <v-icon color="error">mdi-delete</v-icon>
                    </template>
                    <v-list-item-title class="text-error"
                      >Delete Student</v-list-item-title
                    >
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <template
            v-slot:item.data-table-expand="{
              internalItem,
              isExpanded,
              toggleExpand,
            }"
          >
            <v-btn
              :icon="
                isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'
              "
              class="text-none"
              color="medium-emphasis"
              size="small"
              elevation="0"
              slim
              @click="toggleExpand(internalItem)"
            ></v-btn>
          </template>

          <template #expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length + 1" class="pa-4 bg-grey-lighten-5">
                <div class="d-flex align-center mb-4">
                  <v-icon class="mr-2" color="primary">mdi-school</v-icon>
                  <span class="font-weight-medium"
                    >Education & Mapped Licenses</span
                  >
                </div>
                <v-row v-if="item.educations && item.educations.length > 0">
                  <!-- Each row now represents 1 education, so show only the first one -->
                  <v-col cols="12" md="12">
                    <v-card class="pa-4" rounded="lg" elevation="0" border>
                      <!-- Each row now represents 1 education, so use first education -->
                      <template
                        v-if="item.educations && item.educations.length > 0"
                      >
                        <div
                          class="d-flex justify-space-between align-start mb-2"
                        >
                          <div class="font-weight-bold" style="font-size: 14px">
                            {{ item.educations[0].major || "-" }}
                          </div>
                          <v-chip
                            v-if="
                              item.educations[0].approval_state ===
                              'WAITING_APPROVAL'
                            "
                            color="warning"
                            size="small"
                            class="font-weight-medium"
                          >
                            Pending
                          </v-chip>
                          <v-chip
                            v-else-if="
                              item.educations[0].approval_state === 'APPROVED'
                            "
                            color="success"
                            size="small"
                            class="font-weight-medium"
                          >
                            Verified
                          </v-chip>
                          <v-chip
                            v-else
                            color="error"
                            size="small"
                            class="font-weight-medium"
                          >
                            Not Verified
                          </v-chip>
                        </div>
                        <div class="text-caption text-grey-darken-1 mb-3">
                          {{ formatEducationLevel(item.educations[0]) }}
                          <span v-if="item.educations[0].institution_name">
                            • {{ item.educations[0].institution_name }}
                          </span>
                          <br />
                          <span v-if="item.educations[0].student_id">
                            ID : {{ item.educations[0].student_id }}
                          </span>
                        </div>

                        <div class="d-flex gap-2 mb-3 flex-wrap">
                          <v-btn
                            v-if="item.educations[0].file_url"
                            color="primary"
                            variant="outlined"
                            size="small"
                            prepend-icon="mdi-file-document"
                            @click="viewDocument(item.educations[0].file_url)"
                            rounded="lg"
                          >
                            View Doc
                          </v-btn>
                          <v-btn
                            v-if="
                              item.educations[0].approval_state === 'APPROVED'
                            "
                            color="error"
                            variant="outlined"
                            size="small"
                            @click="
                              handleUnverifyDegree(item.educations[0], item, 0)
                            "
                            :loading="
                              verifyingEducationKey ===
                              (item.educations[0]?.user_education_id
                                ? `edu-${item.educations[0].user_education_id}`
                                : `${item.student_ids?.[0]}-0`)
                            "
                            :disabled="verifyingEducationKey !== null"
                            rounded="lg"
                          >
                            Unverify Degree
                          </v-btn>
                          <v-btn
                            v-else-if="
                              item.educations[0].approval_state !==
                                'APPROVED' &&
                              item.status !== 'EDUCATION_NOT_REGISTERED'
                            "
                            color="primary"
                            size="small"
                            @click="
                              handleVerifyDegree(item.educations[0], item, 0)
                            "
                            :loading="
                              verifyingEducationKey ===
                              (item.educations[0]?.user_education_id
                                ? `edu-${item.educations[0].user_education_id}`
                                : `${item.student_ids?.[0]}-0`)
                            "
                            :disabled="verifyingEducationKey !== null"
                            rounded="lg"
                          >
                            Verify Degree
                          </v-btn>
                          <v-btn
                            v-if="
                              item.educations[0].approval_state !== 'APPROVED'
                            "
                            color="error"
                            variant="outlined"
                            size="small"
                            prepend-icon="mdi-delete"
                            @click="
                              handleDeleteEducation(item.educations[0], item, 0)
                            "
                            rounded="lg"
                          >
                            Delete
                          </v-btn>
                        </div>
                        <div
                          v-if="
                            item.educations[0].mapped_licenses &&
                            item.educations[0].mapped_licenses.length > 0
                          "
                          class="mt-3"
                        >
                          <div class="font-weight-medium text-caption mb-2">
                            MAPPED CERTIFICATIONS
                          </div>
                          <div class="d-flex flex-column gap-2">
                            <v-card
                              v-for="(license, licenseIdx) in item.educations[0]
                                .mapped_licenses"
                              :key="licenseIdx"
                              class="pa-1 px-3"
                              rounded="lg"
                              elevation="0"
                              style="background-color: white"
                              border
                            >
                              <div
                                class="d-flex justify-space-between align-start"
                              >
                                <div
                                  class="d-flex align-center gap-2 flex-grow-1"
                                >
                                  <v-icon color="primary" size="small"
                                    >mdi-certificate</v-icon
                                  >
                                  <div class="flex-grow-1">
                                    <span
                                      class="font-weight-medium text-caption"
                                    >
                                      {{ license.license_name }}
                                    </span>
                                    <span
                                      class="text-caption text-grey-darken-1"
                                    >
                                      • ID: {{ formatLicenseId(license) }}
                                    </span>
                                  </div>
                                  <v-btn
                                    v-if="
                                      license.skills &&
                                      license.skills.length > 0
                                    "
                                    icon
                                    variant="text"
                                    size="x-small"
                                    @click="toggleLicenseCard(0, licenseIdx)"
                                    class="ml-2"
                                  >
                                    <v-icon>
                                      {{
                                        isLicenseCardExpanded(0, licenseIdx)
                                          ? "mdi-chevron-up"
                                          : "mdi-chevron-down"
                                      }}
                                    </v-icon>
                                  </v-btn>
                                </div>
                                <div class="d-flex gap-1">
                                  <v-icon
                                    v-if="license.file_url"
                                    color="primary"
                                    size="small"
                                    @click="viewDocument(license.file_url)"
                                    style="cursor: pointer"
                                    title="View Document"
                                  >
                                    mdi-file-document
                                  </v-icon>
                                  <v-icon
                                    v-if="license.is_verified"
                                    color="success"
                                    size="small"
                                    title="Verified"
                                  >
                                    mdi-check-circle
                                  </v-icon>
                                </div>
                              </div>
                              <v-expand-transition>
                                <div
                                  v-if="
                                    isLicenseCardExpanded(0, licenseIdx) &&
                                    license.skills &&
                                    license.skills.length > 0
                                  "
                                  class="my-2"
                                >
                                  <div
                                    class="text-caption text-grey-darken-1 mb-1"
                                  >
                                    MAPPED SKILLS:
                                  </div>
                                  <div class="d-flex flex-wrap gap-1">
                                    <v-chip
                                      v-for="(
                                        skill, skillIdx
                                      ) in license.skills"
                                      :key="skillIdx"
                                      size="x-small"
                                      variant="outlined"
                                      class="text-caption"
                                    >
                                      {{ skill }}
                                    </v-chip>
                                  </div>
                                </div>
                              </v-expand-transition>
                              <v-expand-transition>
                                <div
                                  v-if="
                                    isLicenseCardExpanded(0, licenseIdx) &&
                                    (!license.skills ||
                                      license.skills.length === 0)
                                  "
                                  class="text-caption text-grey-darken-1 mt-2"
                                >
                                  No skills mapped
                                </div>
                              </v-expand-transition>
                            </v-card>
                          </div>
                        </div>
                        <div
                          v-else
                          class="text-caption text-grey-darken-1 mt-3"
                        >
                          No mapped certifications
                        </div>
                      </template>
                    </v-card>
                  </v-col>
                </v-row>
                <div v-else class="text-caption text-grey-darken-1">
                  No education available
                </div>
              </td>
            </tr>
          </template>

          <template #no-data>
            <div class="py-8 text-center text-grey-darken-1">
              No students found
            </div>
          </template>
        </v-data-table>

        <!-- Pagination -->
        <div class="d-flex align-center justify-space-between mt-4">
          <div class="text-caption text-grey-darken-1">
            Showing
            {{ students.length ? (params.page - 1) * params.limit + 1 : 0 }}
            to
            {{ Math.min(params.page * params.limit, meta.total || 0) }}
            of
            {{ meta.total || 0 }}
            entries
          </div>
          <div class="d-flex align-center">
            <span class="text-caption mr-2">Rows per page:</span>
            <v-select
              v-model="params.limit"
              :items="[10, 25, 50]"
              density="compact"
              variant="outlined"
              style="max-width: 90px"
              hide-details
              @update:model-value="changePage(1)"
            />
            <v-pagination
              v-model="params.page"
              :length="meta.totalPages || 1"
              density="comfortable"
              class="ml-4"
              @update:model-value="changePage"
            />
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Upload Dialog -->
    <v-dialog v-model="showUploadDialog" max-width="700" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-upload</v-icon>
          <span>Upload Multiple Students</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <!-- Download Template Section -->
          <v-alert type="info" variant="tonal" class="mb-6" rounded="lg">
            <div class="d-flex align-center justify-space-between">
              <div>
                <strong>Need a template?</strong>
                <p class="mb-0 text-caption">
                  Download our Excel template to get started. The template
                  includes all required columns with example data.
                </p>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-download"
                @click="downloadTemplate"
                :loading="templateLoading"
                rounded="lg"
                size="small"
              >
                Download Template
              </v-btn>
            </div>
          </v-alert>

          <!-- File Upload Section -->
          <div class="mb-4">
            <label class="text-body-2 font-weight-medium mb-2 d-block"
              >Upload Excel File</label
            >
            <v-file-input
              v-model="uploadFile"
              accept=".xls,.xlsx"
              label="Choose Excel file"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              prepend-icon=""
              :loading="uploading"
              :disabled="uploading"
              @update:model-value="handleFileChange"
            >
              <template #prepend>
                <v-icon color="primary" size="large">mdi-cloud-upload</v-icon>
              </template>
            </v-file-input>
            <div class="mt-2">
              <div class="d-flex align-center mb-1">
                <v-icon size="small" color="info" class="mr-2"
                  >mdi-information</v-icon
                >
                <span class="text-caption"
                  >Accepted file formats: .xls, .xlsx</span
                >
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" color="info" class="mr-2"
                  >mdi-information</v-icon
                >
                <span class="text-caption">
                  Required columns: student_id, school_name, full_name, email,
                  phone_num, major, degree
                </span>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="py-3">
          <v-spacer />
          <v-btn
            variant="outlined"
            color="grey"
            rounded="lg"
            @click="closeUploadDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            :loading="uploading"
            :disabled="!uploadFile"
            @click="handleUpload"
            variant="elevated"
          >
            Upload File
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Verify Confirmation Dialog -->
    <v-dialog v-model="showVerifyAllDialog" max-width="500" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-check-circle</v-icon>
          <span>Confirm Verify</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <p>
            Are you sure you want to verify this education for
            <strong>{{ itemToVerify?.full_name || "this student" }}</strong
            >?
          </p>
          <div v-if="itemToVerify?.educations" class="mt-3">
            <p class="text-caption text-grey-darken-1 mb-2">
              The following education will be verified:
            </p>
            <ul class="text-caption">
              <li v-if="itemToVerify.educations[0]">
                {{ itemToVerify.educations[0].major }}
                ({{ formatEducationLevel(itemToVerify.educations[0]) }})
              </li>
            </ul>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            rounded="lg"
            @click="
              showVerifyAllDialog = false;
              verifyingId = null;
            "
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="confirmVerifyAll"
            :loading="verifyingId !== null"
          >
            Verify
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Unverify Confirmation Dialog -->
    <v-dialog v-model="showUnverifyAllDialog" max-width="500" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          <span>Confirm Unverify</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <p>
            Are you sure you want to unverify this education for
            <strong>{{ itemToUnverify?.full_name || "this student" }}</strong
            >?
          </p>
          <div v-if="itemToUnverify?.educations" class="mt-3">
            <p class="text-caption text-grey-darken-1 mb-2">
              The following education will be unverified:
            </p>
            <ul class="text-caption">
              <li v-if="itemToUnverify.educations[0]">
                {{ itemToUnverify.educations[0].major }}
                ({{ formatEducationLevel(itemToUnverify.educations[0]) }})
              </li>
            </ul>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            rounded="lg"
            @click="
              showUnverifyAllDialog = false;
              verifyingId = null;
            "
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            @click="confirmUnverifyAll"
            :loading="verifyingId !== null"
          >
            Unverify
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Student Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="600" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-2">mdi-delete</v-icon>
          <span>Delete Student</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <p class="mb-4">
            Are you sure you want to delete
            <strong>{{ itemToDelete?.full_name || "this student" }}</strong
            >?
          </p>

          <div
            v-if="
              itemToDelete?.educations &&
              getUnverifiedEducations(itemToDelete).length > 1
            "
          >
            <p class="text-caption text-grey-darken-1 mb-3">
              This student has multiple unverified educations. Choose an option:
            </p>
            <v-radio-group v-model="deletingAll" class="mb-4">
              <v-radio
                :value="false"
                label="Delete specific education"
                class="mb-2"
              ></v-radio>
              <v-radio
                :value="true"
                label="Delete all unverified educations"
                class="mb-2"
              ></v-radio>
            </v-radio-group>

            <div v-if="!deletingAll" class="mb-4">
              <div class="text-caption text-grey-darken-1 mb-2">
                Select education to delete (only unverified educations):
              </div>
              <v-list density="compact" class="bg-grey-lighten-5 rounded-lg">
                <v-list-item
                  v-for="(education, idx) in getUnverifiedEducations(
                    itemToDelete
                  )"
                  :key="idx"
                  class="mb-2"
                  :class="{
                    'bg-primary-lighten-5':
                      deletingEducationId === education.user_education_id ||
                      deletingEducationId ===
                        getOriginalEducationIndex(education, itemToDelete) ||
                      (!education.user_education_id &&
                        deletingEducationId ===
                          getOriginalEducationIndex(education, itemToDelete)),
                  }"
                  @click="
                    deletingEducationId =
                      education.user_education_id ||
                      getOriginalEducationIndex(education, itemToDelete)
                  "
                  style="cursor: pointer"
                >
                  <template #prepend>
                    <v-radio
                      :model-value="
                        deletingEducationId === education.user_education_id ||
                        deletingEducationId ===
                          getOriginalEducationIndex(education, itemToDelete) ||
                        (!education.user_education_id &&
                          deletingEducationId ===
                            getOriginalEducationIndex(education, itemToDelete))
                      "
                      @click.stop="
                        deletingEducationId =
                          education.user_education_id ||
                          getOriginalEducationIndex(education, itemToDelete)
                      "
                    ></v-radio>
                  </template>
                  <v-list-item-title>
                    {{ education.major || "-" }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatEducationLevel(education) }}
                    <span v-if="education.institution_name">
                      • {{ education.institution_name }}
                    </span>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </div>

            <div v-else class="mb-4">
              <div class="text-caption text-grey-darken-1 mb-2">
                The following unverified education(s) will be deleted:
              </div>
              <v-list density="compact" class="bg-grey-lighten-5 rounded-lg">
                <v-list-item
                  v-for="(education, idx) in getUnverifiedEducations(
                    itemToDelete
                  )"
                  :key="idx"
                  class="py-2"
                >
                  <v-list-item-title class="text-caption">
                    • {{ education.major || "-" }} ({{
                      formatEducationLevel(education)
                    }})
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </div>

          <div
            v-else-if="
              itemToDelete?.educations &&
              getUnverifiedEducations(itemToDelete).length === 1
            "
          >
            <div class="text-caption text-grey-darken-1 mb-2">
              The following unverified education will be deleted:
            </div>
            <v-list density="compact" class="bg-grey-lighten-5 rounded-lg">
              <v-list-item class="py-2">
                <v-list-item-title class="text-caption">
                  •
                  {{ getUnverifiedEducations(itemToDelete)[0].major || "-" }}
                  ({{
                    formatEducationLevel(
                      getUnverifiedEducations(itemToDelete)[0]
                    )
                  }})
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>

          <div
            v-else-if="
              itemToDelete?.educations &&
              getUnverifiedEducations(itemToDelete).length === 0
            "
          >
            <v-alert type="info" variant="tonal" rounded="lg">
              All educations are already verified. Only unverified educations
              can be deleted.
            </v-alert>
          </div>

          <v-alert type="warning" variant="tonal" class="mt-4" rounded="lg">
            <strong>Warning:</strong> This action cannot be undone.
          </v-alert>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            rounded="lg"
            @click="closeDeleteDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            @click="confirmDeleteStudent"
            :loading="isDeleting"
            :disabled="
              (!deletingAll &&
                itemToDelete?.educations &&
                getUnverifiedEducations(itemToDelete).length > 1 &&
                deletingEducationId === null) ||
              (itemToDelete?.educations &&
                getUnverifiedEducations(itemToDelete).length === 0)
            "
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Upload Result Dialog -->
    <v-dialog v-model="showResultDialog" max-width="600" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon
            :color="uploadResult.error_count > 0 ? 'warning' : 'success'"
            class="mr-2"
            >{{
              uploadResult.error_count > 0 ? "mdi-alert" : "mdi-check-circle"
            }}</v-icon
          >
          Upload Result
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <div class="mb-4">
            <div class="d-flex justify-space-between mb-2">
              <span class="font-weight-medium">Success:</span>
              <span class="text-success font-weight-bold">{{
                uploadResult.success_count
              }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="font-weight-medium">Errors:</span>
              <span class="text-error font-weight-bold">{{
                uploadResult.error_count
              }}</span>
            </div>
          </div>

          <div v-if="uploadResult.errors && uploadResult.errors.length > 0">
            <div class="font-weight-medium mb-2">Error Details:</div>
            <v-list density="compact" class="bg-grey-lighten-5 rounded-lg">
              <v-list-item
                v-for="(error, idx) in uploadResult.errors"
                :key="idx"
                class="py-2"
              >
                <v-list-item-title class="text-caption">
                  Row {{ error.row }}: {{ error.message }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" rounded="lg" @click="handleCloseResult">
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { useSnackbarStore } from "~/stores/snackbar";
import { useDialogStore } from "~/stores/dialog";
import { debounce } from "~/utils/debounce";

definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const router = useRouter();
const { $apiFetch, $apiFetchRaw } = useApi();
const snackbar = useSnackbarStore();
const dialog = useDialogStore();

const loading = ref(false);
const verifyingId = ref(null);
const verifyingEducationKey = ref(null); // Store unique key for education being verified
const expandedRows = ref([]);
const expandedLicenseCards = ref(new Set()); // Track expanded license cards

// Upload dialog state
const showUploadDialog = ref(false);
const uploadFile = ref(null);
const uploading = ref(false);
const templateLoading = ref(false);
const showResultDialog = ref(false);
const uploadResult = ref({
  success_count: 0,
  error_count: 0,
  errors: [],
});

// Verify/Unverify confirmation dialogs
const showVerifyAllDialog = ref(false);
const showUnverifyAllDialog = ref(false);
const itemToVerify = ref(null);
const itemToUnverify = ref(null);

// Delete dialog state
const showDeleteDialog = ref(false);
const itemToDelete = ref(null);
const deletingEducationId = ref(null);
const deletingAll = ref(false);
const isDeleting = ref(false);

const params = reactive({
  page: 1,
  limit: 10,
});

const searchType = ref("name");
const searchKeyword = ref("");
const searchTypeOptions = [
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
];

const filters = reactive({
  school_id: null,
  major_id: null,
  verification_status: null,
});

const students = ref([]);
const meta = reactive({
  total: 0,
  totalPages: 1,
});

// Calculate verifiedCount and pendingCount from students data
const summaryCards = computed(() => {
  const verifiedCount = students.value.filter(
    (s) => s.status === "VERIFIED"
  ).length;
  const pendingCount = students.value.filter(
    (s) => s.status === "EDUCATION_NOT_REGISTERED"
  ).length;

  return [
    {
      label: "Total Members",
      value: meta.total,
    },
    {
      label: "Verified Students",
      value: verifiedCount,
    },
    {
      label: "Verification Pending",
      value: pendingCount,
    },
    {
      label: "Showing Members",
      value: students.value.length,
    },
  ];
});

const headers = [
  { title: "No", key: "no", sortable: false, width: 60 },
  { title: "Name", key: "name", sortable: false },
  { title: "Major/Degree/School", key: "majors", sortable: false, width: 400 },
  { title: "Licenses", key: "licenses", sortable: false },
  { title: "Status", key: "status", sortable: false },
  { title: "Verification", key: "verification", sortable: false },
  { title: "Action", key: "action", sortable: false, align: "end" },
  { width: 1, key: "data-table-expand", align: "end" },
];

const verificationStatusOptions = [
  { title: "Verified", value: "VERIFIED" },
  { title: "Need Verification", value: "NEED_VERIFICATION" },
  { title: "Not Verified", value: "NOT_VERIFIED" },
  { title: "Education Not Registered", value: "EDUCATION_NOT_REGISTERED" },
];

const schoolFilterItems = ref([]);
const schoolFilterLoading = ref(false);

const handleSchoolFilterSearch = debounce(async (search) => {
  if (!search || search.length < 2) {
    schoolFilterItems.value = [];
    return;
  }
  schoolFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-schools/search", {
      params: {
        filters: {
          name: search,
        },
        limit: 20,
      },
    });
    schoolFilterItems.value = response?.items || [];
  } catch (error) {
    console.error("Error searching schools:", error);
    schoolFilterItems.value = [];
  } finally {
    schoolFilterLoading.value = false;
  }
}, 300);

const majorFilterItems = ref([]);
const majorFilterLoading = ref(false);

const handleMajorFilterSearch = debounce(async (search) => {
  if (!search || search.length < 2) {
    majorFilterItems.value = [];
    return;
  }
  majorFilterLoading.value = true;
  try {
    const response = await $apiFetch("/mst-majors/search", {
      params: {
        filters: {
          major_name: search,
        },
        limit: 20,
      },
    });
    majorFilterItems.value = response?.items || [];
  } catch (error) {
    console.error("Error searching majors:", error);
    majorFilterItems.value = [];
  } finally {
    majorFilterLoading.value = false;
  }
}, 300);

const fetchStudents = async () => {
  loading.value = true;
  // Reset verification loading states to prevent stuck loading
  verifyingEducationKey.value = null;
  verifyingId.value = null;
  try {
    // Build query object, only include filters that have values
    const query = {
      page: params.page,
      limit: params.limit,
    };

    // Only add filters if they have values
    if (searchKeyword.value && searchKeyword.value.trim()) {
      if (searchType.value === "name") {
        query.name = searchKeyword.value.trim();
      } else if (searchType.value === "email") {
        query.email = searchKeyword.value.trim();
      }
    }
    if (filters.school_id) {
      query.school_id = filters.school_id;
    }
    if (filters.major_id) {
      query.major_id = filters.major_id;
    }
    if (filters.verification_status) {
      query.verification_status = filters.verification_status;
    }

    const data = await $apiFetch("/user-educations/students", {
      method: "GET",
      query,
    });

    students.value = (data?.items || []).map((s, index) => {
      // Create unique key using index and page - index is always unique within the array
      const uniqueKey = `student-${params.page}-${index}`;

      // Calculate licenses count from mapped_licenses of the education (not all user licenses)
      const licensesCount = s.educations?.[0]?.mapped_licenses?.length || 0;

      return {
        ...s,
        student_id: s.student_ids?.[0] || "-", // Use first student_id for display
        major: s.majors?.[0] || null, // Use first major for display
        licenses_count: licensesCount, // Count only licenses mapped to this education
        _uniqueKey: uniqueKey, // Ensure unique key for expand
      };
    });

    // Reset expanded rows when data changes
    expandedRows.value = [];

    meta.total = data?.meta?.total || 0;
    meta.totalPages = data?.meta?.totalPages || 1;
  } catch (error) {
    console.error("Failed to fetch students", error);
    snackbar.showSnackbar({
      message:
        "Failed to fetch students: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  params.page = 1;
  fetchStudents();
};

const resetFilters = () => {
  searchKeyword.value = "";
  searchType.value = "name";
  filters.school_id = null;
  filters.major_id = null;
  filters.verification_status = null;
  schoolFilterItems.value = [];
  majorFilterItems.value = [];
  params.page = 1;
  fetchStudents();
};

const changePage = (page) => {
  params.page = page;
  fetchStudents();
};

/**
 * Find user_education_id by searching user_educations with student_id
 * student_id is unique per school, so this should be sufficient
 */
const findUserEducationId = async (student_id) => {
  try {
    const data = await $apiFetch("/user-educations/search", {
      method: "GET",
      query: {
        filters: {
          student_id: student_id,
        },
        limit: 1,
      },
    });

    if (data?.items && data.items.length > 0) {
      return data.items[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error finding user education:", error);
    return null;
  }
};

const openVerifyAllDialog = (item) => {
  // Reset loading state first to prevent stuck loading
  verifyingId.value = null;

  if (item.status === "EDUCATION_NOT_REGISTERED") {
    snackbar.showSnackbar({
      message: "Education not registered, cannot verify",
      color: "warning",
    });
    return;
  }

  if (item.account_status !== "JOINED") {
    snackbar.showSnackbar({
      message:
        "Pending students will be automatically verified when they register",
      color: "info",
    });
    return;
  }

  if (!item.educations || item.educations.length === 0) {
    snackbar.showSnackbar({
      message: "No educations found to verify",
      color: "warning",
    });
    return;
  }

  // Filter educations that need verification (not already APPROVED)
  const educationsToVerify = item.educations.filter(
    (edu) => edu.approval_state !== "APPROVED"
  );

  if (educationsToVerify.length === 0) {
    snackbar.showSnackbar({
      message: "All educations are already verified",
      color: "info",
    });
    return;
  }

  itemToVerify.value = item;
  showVerifyAllDialog.value = true;
};

const confirmVerifyAll = async () => {
  const item = itemToVerify.value;
  if (!item) return;

  // Use user_education_id as unique identifier for loading state (more accurate for 1 education per row)
  // Fallback to student_id if user_education_id not available
  const loadingKey =
    item.educations?.[0]?.user_education_id || item.student_ids?.[0];
  verifyingId.value = loadingKey;

  try {
    // Filter educations that need verification (not already APPROVED)
    const educationsToVerify = item.educations.filter(
      (edu) => edu.approval_state !== "APPROVED"
    );

    // Process all educations in parallel
    const verifyPromises = educationsToVerify.map(async (education) => {
      let userEducationId = education.user_education_id;

      // Fallback: Find user_education_id if not available
      if (!userEducationId && education.student_id) {
        userEducationId = await findUserEducationIdByEducation(education);
      }

      if (!userEducationId) {
        throw new Error(
          `User education not found for ${education.major || "education"}`
        );
      }

      return $apiFetch(`/user-educations/${userEducationId}/approval`, {
        method: "PATCH",
        body: {
          approval_state: "APPROVED",
        },
      });
    });

    await Promise.all(verifyPromises);

    snackbar.showSnackbar({
      message: `Successfully verified ${educationsToVerify.length} education(s)!`,
      color: "success",
    });

    // Close dialog and reset loading state before refresh
    showVerifyAllDialog.value = false;
    itemToVerify.value = null;
    verifyingId.value = null;

    // Refresh the list
    await fetchStudents();
  } catch (error) {
    console.error("Error verifying educations:", error);
    snackbar.showSnackbar({
      message:
        "Failed to verify educations: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
    // Reset loading state on error
    verifyingId.value = null;
  } finally {
    // Ensure loading state is cleared
    verifyingId.value = null;
  }
};

const handleVerifyDegree = async (education, item, educationIndex) => {
  if (item.status === "EDUCATION_NOT_REGISTERED") {
    snackbar.showSnackbar({
      message: "Education not registered, cannot verify",
      color: "warning",
    });
    return;
  }

  if (item.account_status !== "JOINED") {
    snackbar.showSnackbar({
      message:
        "Pending students will be automatically verified when they register",
      color: "info",
    });
    return;
  }

  // Use user_education_id directly if available, otherwise find it
  let userEducationId = education.user_education_id;

  if (!userEducationId) {
    // Fallback: Find user_education_id using student_id, major, degree, and diploma_level for more accuracy
    userEducationId = await findUserEducationIdByEducation(education);
  }

  // Create unique key for this education using user_education_id for stability
  // Use user_education_id if available, otherwise fallback to student_id-index
  const educationKey = userEducationId
    ? `edu-${userEducationId}`
    : `${item.student_ids?.[0]}-${educationIndex}`;
  verifyingEducationKey.value = educationKey;
  // Prefer using user_education_id for loading indicator; fallback to first student_id if available
  verifyingId.value = userEducationId || education.student_id || null;

  if (!userEducationId) {
    snackbar.showSnackbar({
      message: "User education not found",
      color: "error",
    });
    verifyingEducationKey.value = null;
    verifyingId.value = null;
    return;
  }

  try {
    await $apiFetch(`/user-educations/${userEducationId}/approval`, {
      method: "PATCH",
      body: {
        approval_state: "APPROVED",
      },
    });

    snackbar.showSnackbar({
      message: "Degree verified successfully!",
      color: "success",
    });

    // Reset loading state before refresh to prevent stuck loading
    verifyingEducationKey.value = null;
    verifyingId.value = null;

    // Refresh the list
    await fetchStudents();
  } catch (error) {
    console.error("Error verifying degree:", error);
    snackbar.showSnackbar({
      message:
        "Failed to verify degree: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
    // Reset loading state on error
    verifyingEducationKey.value = null;
    verifyingId.value = null;
  }
};

const handleUnverifyDegree = async (education, item, educationIndex) => {
  if (item.account_status !== "JOINED") {
    snackbar.showSnackbar({
      message:
        "Pending students will be automatically verified when they register",
      color: "info",
    });
    return;
  }

  // Use user_education_id directly if available, otherwise find it
  let userEducationId = education.user_education_id;

  if (!userEducationId) {
    // Fallback: Find user_education_id using student_id, major, degree, and diploma_level for more accuracy
    userEducationId = await findUserEducationIdByEducation(education);
  }

  // Create unique key for this education using user_education_id for stability
  // Use user_education_id if available, otherwise fallback to student_id-index
  const educationKey = userEducationId
    ? `edu-${userEducationId}`
    : `${item.student_ids?.[0]}-${educationIndex}`;
  verifyingEducationKey.value = educationKey;
  // Prefer using user_education_id for loading indicator; fallback to first student_id if available
  verifyingId.value = userEducationId || education.student_id || null;

  if (!userEducationId) {
    snackbar.showSnackbar({
      message: "User education not found",
      color: "error",
    });
    verifyingEducationKey.value = null;
    verifyingId.value = null;
    return;
  }

  try {
    await $apiFetch(`/user-educations/${userEducationId}/approval`, {
      method: "PATCH",
      body: {
        approval_state: "REJECT",
      },
    });

    snackbar.showSnackbar({
      message: "Degree unverified successfully!",
      color: "success",
    });

    // Reset loading state before refresh to prevent stuck loading
    verifyingEducationKey.value = null;
    verifyingId.value = null;

    // Refresh the list
    await fetchStudents();
  } catch (error) {
    console.error("Error unverifying degree:", error);
    snackbar.showSnackbar({
      message:
        "Failed to unverify degree: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
    // Reset loading state on error
    verifyingEducationKey.value = null;
    verifyingId.value = null;
  }
};

const findUserEducationIdByEducation = async (education) => {
  try {
    const queryParams = {
      filters: {
        student_id: education.student_id,
      },
      limit: 100, // Get more results to filter
    };

    // Add additional filters if available for more accuracy
    if (education.major_id) {
      queryParams.filters.major_id = education.major_id;
    }
    if (education.degree) {
      queryParams.filters.education_degree = education.degree;
    }
    if (education.diploma_level) {
      queryParams.filters.diploma_level = education.diploma_level;
    }

    const data = await $apiFetch("/user-educations/search", {
      method: "GET",
      query: queryParams,
    });

    if (data?.items && data.items.length > 0) {
      // If multiple results, try to find exact match
      if (data.items.length === 1) {
        return data.items[0].id;
      }

      // Find best match based on available criteria
      const exactMatch = data.items.find((item) => {
        let match = true;
        if (education.major_id && item.major_id !== education.major_id) {
          match = false;
        }
        if (education.degree && item.education_degree !== education.degree) {
          match = false;
        }
        if (
          education.diploma_level &&
          item.diploma_level !== education.diploma_level
        ) {
          match = false;
        }
        return match;
      });

      return exactMatch ? exactMatch.id : data.items[0].id;
    }
    return null;
  } catch (error) {
    console.error("Error finding user education:", error);
    return null;
  }
};

const viewDocument = (fileUrl) => {
  if (!fileUrl) {
    snackbar.showSnackbar({
      message: "Document not available",
      color: "warning",
    });
    return;
  }

  const url = fileUrl.includes("http") ? fileUrl : BASE_URL + fileUrl;
  window.open(url, "_blank");
};

const openUnverifyAllDialog = (item) => {
  // Reset loading state first to prevent stuck loading
  verifyingId.value = null;

  if (item.account_status !== "JOINED") {
    snackbar.showSnackbar({
      message: "Only joined students can be unverified",
      color: "error",
    });
    return;
  }

  if (!item.educations || item.educations.length === 0) {
    snackbar.showSnackbar({
      message: "No educations found to unverify",
      color: "warning",
    });
    return;
  }

  // Filter educations that are verified (APPROVED)
  const educationsToUnverify = item.educations.filter(
    (edu) => edu.approval_state === "APPROVED"
  );

  if (educationsToUnverify.length === 0) {
    snackbar.showSnackbar({
      message: "No verified educations to unverify",
      color: "info",
    });
    return;
  }

  itemToUnverify.value = item;
  showUnverifyAllDialog.value = true;
};

const confirmUnverifyAll = async () => {
  const item = itemToUnverify.value;
  if (!item) return;

  // Use user_education_id as unique identifier for loading state (more accurate for 1 education per row)
  // Fallback to student_id if user_education_id not available
  const loadingKey =
    item.educations?.[0]?.user_education_id || item.student_ids?.[0];
  verifyingId.value = loadingKey;

  try {
    // Filter educations that are verified (APPROVED)
    const educationsToUnverify = item.educations.filter(
      (edu) => edu.approval_state === "APPROVED"
    );

    // Process all educations in parallel
    const unverifyPromises = educationsToUnverify.map(async (education) => {
      let userEducationId = education.user_education_id;

      // Fallback: Find user_education_id if not available
      if (!userEducationId && education.student_id) {
        userEducationId = await findUserEducationIdByEducation(education);
      }

      if (!userEducationId) {
        throw new Error(
          `User education not found for ${education.major || "education"}`
        );
      }

      return $apiFetch(`/user-educations/${userEducationId}/approval`, {
        method: "PATCH",
        body: {
          approval_state: "REJECT",
        },
      });
    });

    await Promise.all(unverifyPromises);

    snackbar.showSnackbar({
      message: `Successfully unverified ${educationsToUnverify.length} education(s)!`,
      color: "success",
    });

    // Close dialog and reset loading state before refresh
    showUnverifyAllDialog.value = false;
    itemToUnverify.value = null;
    verifyingId.value = null;

    // Refresh the list
    await fetchStudents();
  } catch (error) {
    console.error("Error unverifying educations:", error);
    snackbar.showSnackbar({
      message:
        "Failed to unverify educations: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
    // Reset loading state on error
    verifyingId.value = null;
  } finally {
    // Ensure loading state is cleared
    verifyingId.value = null;
  }
};

const openDetail = (item) => {
  // Can be wired later to detail page or dialog
  console.log("detail", item);
};

const openUploadDialog = () => {
  showUploadDialog.value = true;
  uploadFile.value = null;
};

const closeUploadDialog = () => {
  showUploadDialog.value = false;
  uploadFile.value = null;
};

const downloadTemplate = async () => {
  templateLoading.value = true;
  try {
    const response = await $apiFetchRaw(
      `/pending-student-verifications/template`,
      {
        method: "GET",
        responseType: "blob",
      }
    );

    const blob = new Blob([response._data], {
      type: response.headers.get("Content-Type"),
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pending_student_verifications_template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    snackbar.showSnackbar({
      message:
        "Failed to download template: " + (error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    templateLoading.value = false;
  }
};

const handleFileChange = (file) => {
  if (file && !file.name.match(/\.(xls|xlsx)$/i)) {
    snackbar.showSnackbar({
      message: "Please select an Excel file (.xls or .xlsx)",
      color: "error",
    });
    uploadFile.value = null;
  }
};

const handleUpload = async () => {
  if (!uploadFile.value) {
    snackbar.showSnackbar({
      message: "Please select a file to upload",
      color: "error",
    });
    return;
  }

  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", uploadFile.value);

    const response = await $apiFetch("/pending-student-verifications/import", {
      method: "POST",
      body: formData,
    });

    uploadResult.value = {
      success_count: response.success_count || 0,
      error_count: response.error_count || 0,
      errors: response.errors || [],
    };

    showResultDialog.value = true;
    closeUploadDialog();

    if (uploadResult.value.error_count === 0) {
      snackbar.showSnackbar({
        message: `Successfully uploaded ${uploadResult.value.success_count} student(s)!`,
        color: "success",
      });
    } else {
      snackbar.showSnackbar({
        message: `Upload completed with ${uploadResult.value.error_count} error(s)`,
        color: "warning",
      });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    snackbar.showSnackbar({
      message:
        "Failed to upload file: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    uploading.value = false;
  }
};

const handleCloseResult = () => {
  showResultDialog.value = false;
  uploadFile.value = null;
  if (uploadResult.value.error_count === 0) {
    // Refresh the list
    fetchStudents();
  }
};

const goToCreate = () => {
  router.push("/admin/approvals/students/create");
};

const handleEditStudentDetail = async (item) => {
  // If verified, cannot edit
  if (item.status === "VERIFIED") {
    snackbar.showSnackbar({
      message: "Verified educations cannot be edited",
      color: "warning",
    });
    return;
  }

  // For NEED_VERIFICATION or NOT_VERIFIED, edit user education
  if (
    item.account_status === "JOINED" &&
    (item.status === "NEED_VERIFICATION" || item.status === "NOT_VERIFIED")
  ) {
    // Use user_education_id from education data if available
    const userEducationId = item.educations?.[0]?.user_education_id || null;

    if (userEducationId) {
      // Redirect to dedicated user-education edit page
      router.push({
        path: `/admin/approvals/students/user-education/${userEducationId}/edit`,
      });
    } else {
      snackbar.showSnackbar({
        message: "User education not found",
        color: "error",
      });
    }
    return;
  }

  snackbar.showSnackbar({
    message: "Cannot edit this student",
    color: "error",
  });
};

const handleEditPendingStudent = async (item) => {
  if (item.status !== "EDUCATION_NOT_REGISTERED") {
    snackbar.showSnackbar({
      message: "This is not a pending student",
      color: "error",
    });
    return;
  }

  // Find pending student verification ID
  if (!item.educations || item.educations.length === 0) {
    snackbar.showSnackbar({
      message: "Education data not found",
      color: "error",
    });
    return;
  }

  const education = item.educations[0];
  try {
    // Search for pending student verification by student_id and education details
    const searchFilters = {
      student_id: education.student_id || item.student_ids?.[0],
    };

    if (education.school_id) {
      searchFilters.school_id = education.school_id;
    }
    if (education.major_id) {
      searchFilters.major_id = education.major_id;
    }
    if (education.degree) {
      searchFilters.degree = education.degree;
    }
    if (education.diploma_level) {
      searchFilters.diploma_level = education.diploma_level;
    }

    const pendingResponse = await $apiFetch(
      "/pending-student-verifications/search",
      {
        params: {
          filters: searchFilters,
          limit: 10,
        },
      }
    );

    let pendingId = null;
    if (pendingResponse?.items && pendingResponse.items.length > 0) {
      // Find exact match
      const exactMatch = pendingResponse.items.find((p) => {
        return (
          p.student_id === (education.student_id || item.student_ids?.[0]) &&
          (!education.school_id || p.school_id === education.school_id) &&
          (!education.major_id || p.major_id === education.major_id) &&
          (!education.degree || p.degree === education.degree) &&
          (!education.diploma_level ||
            p.diploma_level === education.diploma_level)
        );
      });

      pendingId = exactMatch ? exactMatch.id : pendingResponse.items[0].id;
    }

    if (pendingId) {
      router.push({
        path: `/admin/approvals/students/pending/${pendingId}/edit`,
      });
    } else {
      snackbar.showSnackbar({
        message: "Pending student verification not found",
        color: "error",
      });
    }
  } catch (error) {
    console.error("Error finding pending student:", error);
    snackbar.showSnackbar({
      message: "Failed to find pending student",
      color: "error",
    });
  }
};

const handleEditEducationMajor = (item) => {
  if (
    item.account_status !== "JOINED" ||
    !item.student_ids ||
    item.student_ids.length === 0
  ) {
    snackbar.showSnackbar({
      message: "Cannot edit: Student not joined or missing student ID",
      color: "error",
    });
    return;
  }
  router.push({
    path: `/admin/approvals/students/${item.student_ids[0]}/edit-education`,
  });
};

const handleEditLicenses = async (item) => {
  if (item.account_status !== "JOINED") {
    snackbar.showSnackbar({
      message: "Cannot edit: Student not joined",
      color: "error",
    });
    return;
  }

  // Find user_id from user education
  if (item.student_ids && item.student_ids.length > 0) {
    try {
      const studentId = item.student_ids[0];
      const userEducationId = await findUserEducationId(studentId);
      if (!userEducationId) {
        snackbar.showSnackbar({
          message: "User education not found",
          color: "error",
        });
        return;
      }

      // Get user education to get user_id using search endpoint
      const userEducationResponse = await $apiFetch("/user-educations/search", {
        method: "GET",
        query: {
          id: userEducationId,
          limit: 1,
        },
      });

      const userEducation = userEducationResponse?.items?.[0];
      if (userEducation?.user_id) {
        router.push({
          path: `/admin/approvals/students/${userEducation.user_id}/edit-licenses`,
          query: { student_id: studentId },
        });
      } else {
        snackbar.showSnackbar({
          message: "User ID not found",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error finding user education:", error);
      snackbar.showSnackbar({
        message: "Failed to find user education",
        color: "error",
      });
    }
  } else {
    snackbar.showSnackbar({
      message: "Missing student ID",
      color: "error",
    });
  }
};

const getUnverifiedEducations = (item) => {
  if (!item?.educations) return [];
  return item.educations.filter((edu) => edu.approval_state !== "APPROVED");
};

const getOriginalEducationIndex = (education, item) => {
  if (!item?.educations) return -1;
  return item.educations.findIndex(
    (edu) =>
      edu.user_education_id === education.user_education_id ||
      (edu.student_id === education.student_id &&
        edu.major_id === education.major_id &&
        edu.degree === education.degree &&
        edu.diploma_level === education.diploma_level)
  );
};

const handleDeleteStudent = (item) => {
  const unverifiedEducations = getUnverifiedEducations(item);

  if (unverifiedEducations.length === 0) {
    snackbar.showSnackbar({
      message:
        "All educations are already verified. Only unverified educations can be deleted.",
      color: "info",
    });
    return;
  }

  itemToDelete.value = item;
  deletingEducationId.value = null;
  deletingAll.value = false;

  // If only one unverified education, auto-select delete all
  if (unverifiedEducations.length === 1) {
    deletingAll.value = true;
  }

  showDeleteDialog.value = true;
};

const handleDeleteEducation = (education, item, educationIndex) => {
  // Only allow delete if not verified
  if (education.approval_state === "APPROVED") {
    snackbar.showSnackbar({
      message: "Verified educations cannot be deleted. Please unverify first.",
      color: "warning",
    });
    return;
  }

  itemToDelete.value = item;
  deletingEducationId.value = education.user_education_id || educationIndex;
  deletingAll.value = false;
  showDeleteDialog.value = true;
};

const closeDeleteDialog = () => {
  showDeleteDialog.value = false;
  itemToDelete.value = null;
  deletingEducationId.value = null;
  deletingAll.value = false;
  isDeleting.value = false;
};

const confirmDeleteStudent = async () => {
  const item = itemToDelete.value;
  if (!item) return;

  const unverifiedEducations = getUnverifiedEducations(item);

  if (unverifiedEducations.length === 0) {
    snackbar.showSnackbar({
      message:
        "All educations are already verified. Only unverified educations can be deleted.",
      color: "info",
    });
    closeDeleteDialog();
    return;
  }

  isDeleting.value = true;

  try {
    if (item.account_status === "JOINED" && item.status !== "EDUCATION_NOT_REGISTERED") {
      if (deletingAll.value) {
        // Delete all unverified educations
        await deleteAllEducations(item, true);
      } else {
        // Delete specific education
        // Find education by user_education_id or by index
        let educationToDelete = null;
        if (typeof deletingEducationId.value === "string") {
          // It's a user_education_id
          educationToDelete = item.educations?.find(
            (edu) =>
              edu.user_education_id === deletingEducationId.value &&
              edu.approval_state !== "APPROVED"
          );
        } else if (typeof deletingEducationId.value === "number") {
          // It's an index - get from unverified list
          const unverified = getUnverifiedEducations(item);
          if (unverified[deletingEducationId.value]) {
            educationToDelete = unverified[deletingEducationId.value];
          } else {
            // Try original index
            educationToDelete = item.educations?.[deletingEducationId.value];
            if (educationToDelete?.approval_state === "APPROVED") {
              educationToDelete = null;
            }
          }
        }

        if (
          !educationToDelete ||
          educationToDelete.approval_state === "APPROVED"
        ) {
          snackbar.showSnackbar({
            message: "Education not found or already verified",
            color: "error",
          });
          return;
        }

        await deleteSingleEducation(educationToDelete, item);
      }
    } else {
      // Delete pending student verification
      if (deletingAll.value) {
        await deleteAllPendingVerifications(item, true);
      } else {
        // For pending, we need to find by education details
        let educationToDelete = null;
        const unverified = getUnverifiedEducations(item);

        if (typeof deletingEducationId.value === "number") {
          // It's an index from unverified list
          if (unverified[deletingEducationId.value]) {
            educationToDelete = unverified[deletingEducationId.value];
          } else {
            // Try original index
            educationToDelete = item.educations?.[deletingEducationId.value];
          }
        } else if (typeof deletingEducationId.value === "string") {
          // Try to find by matching education details
          educationToDelete = item.educations?.find(
            (edu) =>
              edu.student_id === deletingEducationId.value &&
              edu.approval_state !== "APPROVED"
          );
        }

        if (educationToDelete) {
          await deleteSinglePendingVerificationByEducation(
            educationToDelete,
            item
          );
        } else {
          await deleteSinglePendingVerification(item);
        }
      }
    }

    snackbar.showSnackbar({
      message: deletingAll.value
        ? "unverified educations deleted successfully!"
        : "Education deleted successfully!",
      color: "success",
    });

    closeDeleteDialog();
    await fetchStudents();
  } catch (error) {
    console.error("Error deleting:", error);
    snackbar.showSnackbar({
      message:
        "Failed to delete: " +
        (error.data?.message || error.message || "Unknown error"),
      color: "error",
    });
  } finally {
    isDeleting.value = false;
    deletingEducationId.value = null;
    deletingAll.value = false;
  }
};

const deleteSingleEducation = async (education, item) => {
  let userEducationId = education.user_education_id;

  // If user_education_id not available, try to find it
  if (!userEducationId) {
    if (education.student_id) {
      userEducationId = await findUserEducationIdByEducation(education);
    } else if (item.student_ids && item.student_ids.length > 0) {
      userEducationId = await findUserEducationId(item.student_ids[0]);
    }
  }

  if (!userEducationId) {
    throw new Error("User education ID not found");
  }

  await $apiFetch(`/user-educations/${userEducationId}`, {
    method: "DELETE",
  });
};

const deleteAllEducations = async (item, onlyUnverified = false) => {
  const educationsToDelete = onlyUnverified
    ? getUnverifiedEducations(item)
    : item.educations || [];

  if (educationsToDelete.length === 0) {
    throw new Error("No educations found to delete");
  }

  // Delete all educations in parallel
  const deletePromises = educationsToDelete.map(async (education) => {
    // Double check - don't delete verified ones
    if (education.approval_state === "APPROVED") {
      return null;
    }

    let userEducationId = education.user_education_id;

    if (!userEducationId) {
      if (education.student_id) {
        userEducationId = await findUserEducationIdByEducation(education);
      }
    }

    if (userEducationId) {
      return $apiFetch(`/user-educations/${userEducationId}`, {
        method: "DELETE",
      });
    }
    return null;
  });

  await Promise.all(deletePromises.filter((p) => p !== null));
};

const deleteSinglePendingVerification = async (item) => {
  let pendingId = null;

  // Try to find by student_id first
  if (item.student_ids && item.student_ids.length > 0) {
    const studentId = item.student_ids[0];
    try {
      const pendingVerifications = await $apiFetch(
        "/pending-student-verifications/search",
        {
          params: {
            filters: { student_id: studentId },
            limit: 1,
          },
        }
      );

      if (
        pendingVerifications?.items &&
        pendingVerifications.items.length > 0
      ) {
        pendingId = pendingVerifications.items[0].id;
      }
    } catch (error) {
      console.error("Error finding pending verification:", error);
    }
  }

  // If not found by student_id, try to find by email or full_name
  if (!pendingId) {
    const searchFilters = {};
    if (item.email) {
      searchFilters.email = item.email;
    } else if (item.full_name) {
      searchFilters.full_name = item.full_name;
    }

    if (Object.keys(searchFilters).length > 0) {
      const pendingVerifications = await $apiFetch(
        "/pending-student-verifications/search",
        {
          params: {
            filters: searchFilters,
            limit: 10,
          },
        }
      );

      if (
        pendingVerifications?.items &&
        pendingVerifications.items.length > 0
      ) {
        if (item.full_name && pendingVerifications.items.length > 1) {
          const exactMatch = pendingVerifications.items.find(
            (p) => p.full_name === item.full_name
          );
          pendingId = exactMatch
            ? exactMatch.id
            : pendingVerifications.items[0].id;
        } else {
          pendingId = pendingVerifications.items[0].id;
        }
      }
    }
  }

  if (!pendingId) {
    throw new Error("Pending verification not found");
  }

  await $apiFetch(`/pending-student-verifications/${pendingId}`, {
    method: "DELETE",
  });
};

const deleteSinglePendingVerificationByEducation = async (education, item) => {
  let pendingId = null;

  // Try to find by student_id and education details
  if (education.student_id) {
    try {
      const searchFilters = { student_id: education.student_id };
      if (education.major_id) {
        searchFilters.major_id = education.major_id;
      }
      if (education.degree) {
        searchFilters.degree = education.degree;
      }
      if (education.diploma_level) {
        searchFilters.diploma_level = education.diploma_level;
      }

      const pendingVerifications = await $apiFetch(
        "/pending-student-verifications/search",
        {
          params: {
            filters: searchFilters,
            limit: 10,
          },
        }
      );

      if (
        pendingVerifications?.items &&
        pendingVerifications.items.length > 0
      ) {
        // Find exact match
        const exactMatch = pendingVerifications.items.find((p) => {
          return (
            p.student_id === education.student_id &&
            (!education.major_id || p.major_id === education.major_id) &&
            (!education.degree || p.degree === education.degree) &&
            (!education.diploma_level ||
              p.diploma_level === education.diploma_level)
          );
        });

        pendingId = exactMatch
          ? exactMatch.id
          : pendingVerifications.items[0].id;
      }
    } catch (error) {
      console.error("Error finding pending verification:", error);
    }
  }

  // Fallback: try to find by email or full_name
  if (!pendingId) {
    const searchFilters = {};
    if (item.email) {
      searchFilters.email = item.email;
    } else if (item.full_name) {
      searchFilters.full_name = item.full_name;
    }

    if (Object.keys(searchFilters).length > 0) {
      const pendingVerifications = await $apiFetch(
        "/pending-student-verifications/search",
        {
          params: {
            filters: searchFilters,
            limit: 10,
          },
        }
      );

      if (
        pendingVerifications?.items &&
        pendingVerifications.items.length > 0
      ) {
        // Try to match by education details
        const exactMatch = pendingVerifications.items.find((p) => {
          return (
            (!education.major_id || p.major_id === education.major_id) &&
            (!education.degree || p.degree === education.degree) &&
            (!education.diploma_level ||
              p.diploma_level === education.diploma_level)
          );
        });

        pendingId = exactMatch
          ? exactMatch.id
          : pendingVerifications.items[0].id;
      }
    }
  }

  if (!pendingId) {
    throw new Error("Pending verification not found");
  }

  await $apiFetch(`/pending-student-verifications/${pendingId}`, {
    method: "DELETE",
  });
};

const deleteAllPendingVerifications = async (item, onlyUnverified = false) => {
  const educationsToDelete = onlyUnverified
    ? getUnverifiedEducations(item)
    : item.educations || [];

  if (educationsToDelete.length === 0) {
    throw new Error("No educations found to delete");
  }

  // Delete all pending verifications for unverified educations in parallel
  const deletePromises = educationsToDelete.map(async (education) => {
    // Double check - don't delete verified ones
    if (education.approval_state === "APPROVED") {
      return null;
    }

    try {
      return await deleteSinglePendingVerificationByEducation(education, item);
    } catch (error) {
      console.error("Error deleting pending verification:", error);
      return null;
    }
  });

  await Promise.all(deletePromises.filter((p) => p !== null));
};

const formatEducationLevel = (education) => {
  if (!education) return "";

  const degreeLabel = education.degree || "";
  const diplomaLevel = education.diploma_level
    ? ` ${education.diploma_level}`
    : "";

  // Format: "Degree Level" or "Degree Level L4" if diploma_level exists
  return degreeLabel ? `${degreeLabel}${diplomaLevel}` : diplomaLevel.trim();
};

const formatLicenseId = (license) => {
  // Try to use license_number first, then format from ID
  if (license.license_number) {
    return license.license_number;
  }
  // Format UUID to short code (first 8 chars, uppercase)
  const id = license.mst_license_id || license.id || "";
  if (id.length >= 8) {
    return id.substring(0, 8).toUpperCase();
  }
  return id;
};

const toggleLicenseCard = (educationIdx, licenseIdx) => {
  const key = `${educationIdx}-${licenseIdx}`;
  if (expandedLicenseCards.value.has(key)) {
    expandedLicenseCards.value.delete(key);
  } else {
    expandedLicenseCards.value.add(key);
  }
};

const isLicenseCardExpanded = (educationIdx, licenseIdx) => {
  const key = `${educationIdx}-${licenseIdx}`;
  return expandedLicenseCards.value.has(key);
};

// Watch dialog state to reset loading when dialog closes
watch(showVerifyAllDialog, (newVal) => {
  if (!newVal) {
    verifyingId.value = null;
  }
});

watch(showUnverifyAllDialog, (newVal) => {
  if (!newVal) {
    verifyingId.value = null;
  }
});

onMounted(() => {
  fetchStudents();
});
</script>

<style scoped>
.students-table :deep(.v-data-table-header__content) {
  font-weight: 600;
  font-size: 13px;
}

.button-responsive {
  width: 100%;
  min-width: fit-content;
}

@media (min-width: 960px) {
  .button-responsive {
    width: auto;
  }
}
</style>
