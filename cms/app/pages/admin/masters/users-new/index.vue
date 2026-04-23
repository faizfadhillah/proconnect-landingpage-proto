<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row class="mb-6">
      <v-col cols="12" class="pt-0">
        <v-breadcrumbs
          class="px-0 text-caption"
          :items="[
            {
              title: 'Dashboard',
              disabled: false,
              to: '/admin/dashboard',
            },
            {
              title: 'Master Data',
              disabled: false,
              to: '/admin/masters',
            },
            {
              title: 'Users',
              disabled: true,
              to: `/admin/masters/users`,
            },
          ]"
          divider="/"
        ></v-breadcrumbs>

        <!-- Page Header -->
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="font-weight-bold text-grey-darken-3 mb-1">
              User Management
            </h1>
            <p class="text-grey-darken-1 mb-0">
              Manage candidates and company users across the platform
            </p>
          </div>
          <div class="d-flex align-center gap-3">
            <v-chip
              :color="activeTab === 'candidates' ? 'primary' : 'grey-lighten-2'"
              :variant="activeTab === 'candidates' ? 'flat' : 'outlined'"
              size="large"
              class="px-4"
            >
              <v-icon start>mdi-account-multiple</v-icon>
              {{ candidateCount }} Candidates
            </v-chip>
            <v-chip
              :color="activeTab === 'companies' ? 'primary' : 'grey-lighten-2'"
              :variant="activeTab === 'companies' ? 'flat' : 'outlined'"
              size="large"
              class="px-4"
            >
              <v-icon start>mdi-domain</v-icon>
              {{ companyCount }} Company Users
            </v-chip>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Main Content Card -->
    <v-card elevation="2" rounded="xl" class="overflow-hidden">
      <!-- Tab Navigation -->
      <v-tabs
        v-model="activeTab"
        color="primary"
        align-tabs="start"
        class="border-b"
        height="64"
      >
        <v-tab value="candidates" class="px-6">
          <v-icon start>mdi-account-multiple</v-icon>
          Candidates
        </v-tab>
        <v-tab value="companies" class="px-6">
          <v-icon start>mdi-domain</v-icon>
          Company Users
        </v-tab>
        <v-tab value="batches" class="px-6">
          <v-icon start>mdi-upload-multiple</v-icon>
          Upload Batches
        </v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-window v-model="activeTab">
        <!-- Candidates Tab -->
        <v-window-item value="candidates">
          <div class="pa-6">
            <!-- Filters Section for Candidates -->
            <v-card rounded="lg" elevation="0" class="mb-6">
              <v-card-text class="pa-4">
                <!-- Search and Filter Row -->
                <v-row class="mb-4">
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    v-if="!filterLoading && allHeaders.length > 0"
                  >
                    <v-select
                      multiple
                      v-model="filterFields"
                      :items="allHeaders"
                      label="Search By"
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      item-title="title"
                      item-value="key"
                      prepend-inner-icon="mdi-filter"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="searchInput"
                      label="Search candidates"
                      prepend-inner-icon="mdi-magnify"
                      clearable
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      placeholder="Search by name, email, or skills..."
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="12"
                    md="4"
                    class="d-flex align-center justify-end"
                  >
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-filter"
                      :append-icon="
                        showFilter ? 'mdi-menu-up' : 'mdi-menu-down'
                      "
                      variant="outlined"
                      rounded="lg"
                      @click="showFilter = !showFilter"
                    >
                      Advanced Filters
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Action Buttons Row -->
                <v-row>
                  <v-col
                    cols="12"
                    class="d-flex align-center justify-end gap-3 flex-wrap"
                  >
                    <v-btn
                      color="success"
                      prepend-icon="mdi-upload"
                      variant="outlined"
                      rounded="lg"
                      @click="showBulkUploadDialog = true"
                    >
                      Bulk Upload
                    </v-btn>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-table-column-plus-after"
                      variant="outlined"
                      rounded="lg"
                      @click="columnSelectionDialog = true"
                    >
                      Columns
                    </v-btn>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      variant="elevated"
                      rounded="lg"
                      to="/admin/masters/users/form"
                    >
                      Add Candidate
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Advanced Filters for Candidates -->
            <v-expand-transition>
              <v-card
                v-show="showFilter"
                variant="outlined"
                rounded="lg"
                class="mb-6"
              >
                <v-card-text class="pa-4">
                  <v-row>
                    <template v-for="key in Object.keys(filterEnum)" :key="key">
                      <v-col cols="6" md="4">
                        <v-select
                          v-model="filters[key]"
                          :items="filterEnum[key]"
                          :label="key"
                          item-title="key"
                          item-value="value"
                          clearable
                          hide-details
                          variant="outlined"
                          density="comfortable"
                          multiple
                        ></v-select>
                      </v-col>
                    </template>
                    <template v-for="field in allFields">
                      <v-col
                        cols="6"
                        md="4"
                        v-if="field.name == 'region_id'"
                        :key="field.name"
                      >
                        <v-autocomplete
                          v-model="filters[field.name]"
                          :label="field.label"
                          :type="field.inputType || 'text'"
                          :placeholder="field.placeholder || ''"
                          :clearable="true"
                          variant="outlined"
                          density="comfortable"
                          color="primary"
                          @keyup="handleInputRegion"
                          :items="regions"
                          :loading="regionLoading"
                          item-title="full_name"
                          item-value="id"
                          hide-no-data
                          hide-details
                        ></v-autocomplete>
                      </v-col>
                      <v-col
                        cols="6"
                        md="4"
                        v-if="['user_id', 'following_id'].includes(field.name)"
                        :key="field.name"
                      >
                        <v-autocomplete
                          v-model="filters[field.name]"
                          :label="field.label"
                          :type="field.inputType || 'text'"
                          :placeholder="field.placeholder || ''"
                          :clearable="true"
                          variant="outlined"
                          density="comfortable"
                          color="primary"
                          @keyup="handleInputUser"
                          :items="users"
                          :loading="userLoading"
                          item-value="id"
                          item-title="displayText"
                          hide-details
                        >
                          <template v-slot:item="{ props, item }">
                            <v-list-item
                              v-bind="props"
                              :subtitle="item.raw.email"
                              :title="item.raw.full_name"
                            ></v-list-item>
                          </template>
                          <template v-slot:selection="{ item, props }">
                            <v-chip
                              v-if="item.raw.full_name"
                              v-bind="props"
                              color="primary"
                              class="px-1"
                              label
                              small
                            >
                              {{ item.raw.full_name }} - {{ item.raw.email }}
                            </v-chip>
                          </template>
                        </v-autocomplete>
                      </v-col>
                    </template>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-expand-transition>

            <!-- Data Table for Candidates -->
            <v-data-table-server
              class="elevation-0 border"
              v-model:items-per-page="itemsPerPage"
              v-model:page="page"
              :headers="visibleHeaders"
              :items="candidateItems"
              :items-length="candidateTotal"
              :loading="loading"
              :search="filters.search"
              :sort-by="sortBy"
              multi-sort
              @update:options="debouncedLoadItems"
            >
              <!-- Custom column rendering for candidates -->
              <template v-slot:item.index="{ index }">
                <v-chip color="primary" size="small" variant="outlined">
                  {{ (page - 1) * itemsPerPage + index + 1 }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex align-center gap-2">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="primary"
                    density="compact"
                    :to="`/admin/masters/users/form?id=${item.id}`"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    density="compact"
                    color="error"
                    @click="confirmDeleteUser(item)"
                  ></v-btn>
                </div>
              </template>

              <template v-slot:item.user_role="{ item }">
                <v-chip
                  :color="getUserRoleColor(item.user_role)"
                  size="small"
                  label
                  variant="flat"
                >
                  {{ item.user_role }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                  label
                  variant="flat"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.photo_url="{ item }">
                <v-avatar color="grey-lighten-2" size="40" rounded="lg">
                  <v-img
                    v-if="item.photo_url"
                    :src="
                      item.photo_url.includes('http')
                        ? item.photo_url
                        : BASE_URL + item.photo_url
                    "
                  ></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </template>
            </v-data-table-server>
          </div>
        </v-window-item>

        <!-- Company Users Tab -->
        <v-window-item value="companies">
          <div class="pa-6">
            <!-- Filters Section for Company Users -->
            <v-card rounded="lg" elevation="0" class="mb-6">
              <v-card-text class="pa-4">
                <!-- Search and Filter Row -->
                <v-row class="mb-4">
                  <v-col
                    cols="12"
                    sm="6"
                    md="4"
                    v-if="!filterLoading && companyHeaders.length > 0"
                  >
                    <v-select
                      multiple
                      v-model="companyFilterFields"
                      :items="companyHeaders"
                      label="Search By"
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      item-title="title"
                      item-value="key"
                      prepend-inner-icon="mdi-filter"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="companySearchInput"
                      label="Search company users"
                      prepend-inner-icon="mdi-magnify"
                      clearable
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      placeholder="Search by name, email, or company..."
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="12"
                    md="4"
                    class="d-flex align-center justify-end"
                  >
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-filter"
                      :append-icon="
                        showCompanyFilter ? 'mdi-menu-up' : 'mdi-menu-down'
                      "
                      variant="outlined"
                      rounded="lg"
                      @click="showCompanyFilter = !showCompanyFilter"
                    >
                      Advanced Filters
                    </v-btn>
                  </v-col>
                </v-row>

                <!-- Action Buttons Row -->
                <v-row>
                  <v-col
                    cols="12"
                    class="d-flex align-center justify-end gap-3 flex-wrap"
                  >
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-table-column-plus-after"
                      variant="outlined"
                      rounded="lg"
                      @click="companyColumnSelectionDialog = true"
                    >
                      Columns
                    </v-btn>
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      variant="elevated"
                      rounded="lg"
                      to="/admin/masters/users/form"
                    >
                      Add Company User
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Advanced Filters for Company Users -->
            <v-expand-transition>
              <v-card
                v-show="showCompanyFilter"
                variant="outlined"
                rounded="lg"
                class="mb-6"
              >
                <v-card-text class="pa-4">
                  <v-row>
                    <v-col cols="6" md="4">
                      <v-select
                        v-model="companyFilters.company_role"
                        :items="companyRoleOptions"
                        label="Company Role"
                        clearable
                        hide-details
                        variant="outlined"
                        density="comfortable"
                        multiple
                      ></v-select>
                    </v-col>
                    <v-col cols="6" md="4">
                      <v-autocomplete
                        v-model="companyFilters.company_id"
                        label="Company"
                        clearable
                        variant="outlined"
                        density="comfortable"
                        @keyup="handleInputCompany"
                        :items="companies"
                        :loading="models['company'].loading"
                        item-title="company_name"
                        item-value="id"
                        hide-no-data
                        hide-details
                      ></v-autocomplete>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-expand-transition>

            <!-- Data Table for Company Users -->
            <v-data-table-server
              class="border"
              v-model:items-per-page="companyItemsPerPage"
              v-model:page="companyPage"
              :headers="companyVisibleHeaders"
              :items="companyItems"
              :items-length="companyTotal"
              :loading="companyLoading"
              :search="companyFilters.search"
              :sort-by="companySortBy"
              multi-sort
              @update:options="debouncedLoadCompanyItems"
            >
              <!-- Custom column rendering for company users -->
              <template v-slot:item.index="{ index }">
                <v-chip color="success" size="small" variant="outlined">
                  {{ (companyPage - 1) * companyItemsPerPage + index + 1 }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex align-center gap-2">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="primary"
                    density="compact"
                    :to="`/admin/masters/users/form?id=${item.id}`"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    density="compact"
                    color="error"
                    @click="confirmDeleteUser(item)"
                  ></v-btn>
                </div>
              </template>

              <template v-slot:item.company_role="{ item }">
                <v-chip
                  :color="getCompanyRoleColor(item.company_role)"
                  size="small"
                  label
                  variant="flat"
                >
                  {{ item.company_role }}
                </v-chip>
              </template>

              <template v-slot:item.company_id="{ item }">
                <div class="d-flex align-center gap-2">
                  <v-avatar color="primary" size="32" rounded="lg">
                    <v-img
                      v-if="item.company?.logo_url"
                      :src="
                        item.company.logo_url.includes('http')
                          ? item.company.logo_url
                          : BASE_URL + item.company.logo_url
                      "
                    ></v-img>
                    <v-icon v-else>mdi-domain</v-icon>
                  </v-avatar>
                  <span class="font-weight-medium">{{
                    item.company?.company_name || item.company_id
                  }}</span>
                </div>
              </template>

              <template v-slot:item.photo_url="{ item }">
                <v-avatar color="grey-lighten-2" size="40" rounded="lg">
                  <v-img
                    v-if="item.photo_url"
                    :src="
                      item.photo_url.includes('http')
                        ? item.photo_url
                        : BASE_URL + item.photo_url
                    "
                  ></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
              </template>
            </v-data-table-server>
          </div>
        </v-window-item>

        <!-- Upload Batches Tab -->
        <v-window-item value="batches">
          <div class="pa-6">
            <!-- Batch Actions -->
            <v-card rounded="lg" elevation="0" class="mb-6">
              <v-card-text class="pa-4">
                <!-- Search and Filter Row -->
                <v-row class="mb-4">
                  <v-col cols="12" sm="6" md="4">
                    <v-select
                      v-model="batchStatusFilter"
                      :items="batchStatusOptions"
                      label="Filter by Status"
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      prepend-inner-icon="mdi-filter"
                      @update:model-value="loadBatches"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="4">
                    <v-text-field
                      v-model="batchSearchInput"
                      label="Search batches"
                      prepend-inner-icon="mdi-magnify"
                      clearable
                      hide-details
                      variant="outlined"
                      density="comfortable"
                      placeholder="Search by batch ID or uploader..."
                      @input="debouncedSearchBatches"
                    ></v-text-field>
                  </v-col>
                  <v-col
                    cols="12"
                    sm="12"
                    md="4"
                    class="d-flex align-center justify-end"
                  >
                    <!-- Empty space for alignment -->
                  </v-col>
                </v-row>

                <!-- Action Buttons Row -->
                <v-row>
                  <v-col
                    cols="12"
                    class="d-flex align-center justify-end gap-3 flex-wrap"
                  >
                    <v-btn
                      color="warning"
                      prepend-icon="mdi-email-sync"
                      variant="outlined"
                      rounded="lg"
                      @click="retryAllFailedEmails"
                      :loading="retryEmailsLoading"
                    >
                      Retry All Failed Emails
                    </v-btn>
                    <v-btn
                      color="success"
                      prepend-icon="mdi-upload"
                      variant="elevated"
                      rounded="lg"
                      @click="showBulkUploadDialog = true"
                    >
                      New Upload
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Batches Table -->
            <v-data-table-server
              class="elevation-0 border"
              v-model:items-per-page="batchItemsPerPage"
              v-model:page="batchPage"
              :headers="batchHeaders"
              :items="batches"
              :items-length="batchTotal"
              :loading="batchLoading"
              :search="batchSearchInput"
              :sort-by="batchSortBy"
              multi-sort
              @update:options="debouncedLoadBatches"
            >
              <!-- Custom column rendering for batches -->
              <template v-slot:item.index="{ index }">
                <v-chip color="info" size="small" variant="outlined">
                  {{ (batchPage - 1) * batchItemsPerPage + index + 1 }}
                </v-chip>
              </template>

              <template v-slot:item.id="{ item }">
                <v-btn
                  variant="text"
                  color="primary"
                  :to="`/admin/masters/users/batch/${item.id}`"
                  class="text-none"
                >
                  {{ item.id }}
                </v-btn>
              </template>

              <template v-slot:item.progress_percentage="{ item }">
                <div class="d-flex align-center gap-2">
                  <v-progress-linear
                    :model-value="item.progress_percentage"
                    color="primary"
                    height="8"
                    rounded
                    class="flex-grow-1"
                  ></v-progress-linear>
                  <span class="text-caption"
                    >{{ item.progress_percentage }}%</span
                  >
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getBatchStatusColor(item.status)"
                  size="small"
                  label
                  variant="flat"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex align-center gap-2">
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    size="small"
                    color="primary"
                    density="compact"
                    :to="`/admin/masters/users/batch/${item.id}`"
                  ></v-btn>
                  <v-btn
                    v-if="item.invalid_rows > 0"
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    density="compact"
                    color="error"
                    @click="deleteFailedRows(item.id)"
                  ></v-btn>
                </div>
              </template>
            </v-data-table-server>
          </div>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Bulk Upload Dialog -->
    <v-dialog v-model="showBulkUploadDialog" max-width="600" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="success" size="48">
              <v-icon color="white">mdi-upload</v-icon>
            </v-avatar>
            <div>
              <h3 class="font-weight-bold">Bulk Upload Candidates</h3>
              <p class="text-caption text-grey mb-0">
                Upload Excel/CSV file with candidate data
              </p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <v-form ref="uploadForm" v-model="uploadFormValid">
            <!-- Download Template -->
            <v-alert type="info" variant="tonal" class="mb-4" rounded="lg">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <strong>Need a template?</strong>
                  <p class="mb-0 text-caption">
                    Download our Excel template to get started
                  </p>
                </div>
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-download"
                  @click="downloadTemplate"
                  :loading="downloadingTemplate"
                >
                  Download Template
                </v-btn>
              </div>
            </v-alert>

            <!-- File Upload -->
            <v-file-input
              v-model="uploadFile"
              :label="
                fileUploaded
                  ? 'File uploaded successfully - Select new file to upload again'
                  : 'Select Excel/CSV file'
              "
              accept=".xlsx,.xls,.csv"
              :prepend-icon="
                fileUploaded ? 'mdi-check-circle' : 'mdi-file-excel'
              "
              :color="fileUploaded ? 'success' : 'primary'"
              variant="outlined"
              density="comfortable"
              :rules="fileUploadRules"
              :loading="uploading"
              @change="handleFileSelect"
            ></v-file-input>

            <!-- Upload Status Indicator -->
            <div
              v-if="fileUploaded && !uploading"
              class="d-flex align-center mt-2"
            >
              <v-icon color="success" size="small" class="mr-2"
                >mdi-check-circle</v-icon
              >
              <span class="text-success text-caption"
                >File has been uploaded successfully</span
              >
            </div>

            <!-- Upload Progress -->
            <v-progress-linear
              v-if="uploading"
              :model-value="uploadProgress"
              color="success"
              height="8"
              rounded
              class="mb-4"
            ></v-progress-linear>

            <!-- Upload Status -->
            <v-alert
              v-if="uploadStatus"
              :type="uploadStatus.type"
              variant="tonal"
              class="mb-4"
              rounded="lg"
            >
              {{ uploadStatus.message }}
            </v-alert>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            rounded="lg"
            @click="closeUploadDialog"
            :disabled="uploading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            rounded="lg"
            @click="handleUpload"
            :loading="uploading"
            :disabled="!uploadFile || fileUploaded"
          >
            {{ fileUploaded ? "File Uploaded" : "Upload File" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Column Selection Dialog for Candidates -->
    <v-dialog v-model="columnSelectionDialog" scrollable max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="48">
              <v-icon color="white">mdi-table-column-plus-after</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Manage Columns</h3>
              <p class="text-body-2 text-grey mb-0">
                Select which columns to display
              </p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <v-row>
            <v-col
              cols="6"
              v-for="header in allHeaders"
              :key="header.key"
              class="pa-0"
            >
              <v-checkbox
                v-model="selectedColumns"
                column
                multiple
                :value="header.key"
                :label="header.title"
                hide-details
                density="compact"
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="columnSelectionDialog = false"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Column Selection Dialog for Company Users -->
    <v-dialog v-model="companyColumnSelectionDialog" scrollable max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="primary" size="48">
              <v-icon color="white">mdi-table-column-plus-after</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Manage Columns</h3>
              <p class="text-body-2 text-grey mb-0">
                Select which columns to display
              </p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <v-row>
            <v-col
              cols="6"
              v-for="header in companyHeaders"
              :key="header.key"
              class="pa-0"
            >
              <v-checkbox
                v-model="companySelectedColumns"
                column
                multiple
                :value="header.key"
                :label="header.title"
                hide-details
                density="compact"
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="companyColumnSelectionDialog = false"
          >
            Done
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar color="error" size="48">
              <v-icon color="white">mdi-delete</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold">Confirm Deletion</h3>
              <p class="text-body-2 text-grey mb-0">
                This action cannot be undone
              </p>
            </div>
          </div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <p>
            Are you sure you want to delete
            <strong class="text-primary">{{ selectedUser?.full_name }}</strong
            >?
          </p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            rounded="lg"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            @click="deleteUser"
            :loading="deleteUserLoading"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
definePageMeta({ ssr: false, layout: "admin", middleware: ["auth"] });

import { debounce } from "~/utils/debounce";

// Define state
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const route = useRoute();

// Tab management with hash navigation
// This enables URL hash-based tab navigation:
// - Clicking tabs updates the URL hash (#candidates, #companies, #batches)
// - Browser back/forward buttons work with tabs
// - Direct URL access with hash opens the correct tab
// - Page refresh maintains the selected tab
const {
  activeTab,
  initializeFromHash,
  setupHashListener,
  cleanupHashListener,
} = useHashTabs("candidates", ["candidates", "companies", "batches"]);

// Candidate data
const candidateItems = ref([]);
const candidateTotal = ref(0);
const candidateCount = ref(0);

// Company user data
const companyItems = ref([]);
const companyTotal = ref(0);
const companyCount = ref(0);

// Loading states
const loading = ref(false);
const companyLoading = ref(false);
const first = ref(true);
const companyFirst = ref(true);

// Pagination for candidates
const page = ref(1);
const itemsPerPage = ref(10);
const sortBy = useState("candidateSortBy", () => []);

// Pagination for company users
const companyPage = ref(1);
const companyItemsPerPage = ref(10);
const companySortBy = useState("companySortBy", () => []);

// Dialog states
const deleteDialog = ref(false);
const selectedUser = ref(null);
const deleteUserLoading = ref(false);
const columnSelectionDialog = ref(false);
const companyColumnSelectionDialog = ref(false);

// Bulk upload states
const showBulkUploadDialog = ref(false);
const uploadFile = ref(null);
const uploadFormValid = ref(false);
const uploadForm = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref(null);
const downloadingTemplate = ref(false);
const fileUploaded = ref(false); // Track if file has been uploaded

// Batch states
const batches = ref([]);
const batchTotal = ref(0);
const batchLoading = ref(false);
const batchPage = ref(1);
const batchItemsPerPage = ref(10);
const batchSortBy = useState("batchSortBy", () => []);
const batchStatusFilter = ref("all");
const batchSearchInput = ref("");
const retryEmailsLoading = ref(false);

// Filter states
const showFilter = ref(false);
const showCompanyFilter = ref(false);
const filterLoading = ref(true);

// Search inputs
const searchInput = ref("");
const companySearchInput = ref("");

// Entity
const entity = ref("users");
const { $apiFetch, $apiFetchRaw } = useApi();

// Import dialog
const importDialog = ref(null);
const importEntities = ref(["users", "user-skill-passports"]);

// Filters for candidates
const filters = ref({});
const filterFields = ref(["full_name", "email"]);
const filterEnum = ref({});

// Filters for company users
const companyFilters = ref({});
const companyFilterFields = ref(["full_name", "email"]);

// Headers
const allHeaders = useState("candidateHeaders", () => []);
const companyHeaders = useState("companyHeaders", () => []);
const allFields = ref([]);

// Selected columns
const selectedColumns = useState("candidateSelectedColumns", () => ["index"]);
const companySelectedColumns = useState("companySelectedColumns", () => [
  "index",
]);

// Default search fields
const defaultSearchFields = ref(["full_name", "email"]);

// Company role options
const companyRoleOptions = ref([
  { title: "Owner", value: "owner" },
  { title: "HRD", value: "hrd" },
  { title: "Member", value: "member" },
  { title: "Admin", value: "admin" },
]);

// Batch status options
const batchStatusOptions = ref([
  { title: "All", value: "all" },
  { title: "Processing", value: "processing" },
  { title: "Completed", value: "completed" },
  { title: "Failed", value: "failed" },
]);

// Batch headers
const batchHeaders = ref([
  { title: "No", key: "index", sortable: false },
  { title: "Batch ID", key: "id", sortable: true },
  { title: "Upload Date", key: "created_at", sortable: true },
  { title: "Total Rows", key: "total_rows", sortable: true },
  { title: "Valid Rows", key: "valid_rows", sortable: true },
  { title: "Invalid Rows", key: "invalid_rows", sortable: true },
  { title: "Progress", key: "progress_percentage", sortable: true },
  { title: "Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
]);

// File upload rules
const fileUploadRules = ref([
  (v) => !!v || "File is required",
  (v) => {
    if (!v) return true;
    const validTypes = [".xlsx", ".xls", ".csv"];
    const fileExtension = "." + v.name.split(".").pop().toLowerCase();
    return (
      validTypes.includes(fileExtension) || "File must be Excel or CSV format"
    );
  },
  (v) => {
    if (!v) return true;
    const maxSize = 10 * 1024 * 1024; // 10MB
    return v.size <= maxSize || "File size must be less than 10MB";
  },
]);

// Search composables
const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const { users, debouncedFetchUsers, userLoading, fetchitems } = useUserSearch();
const { models, debouncedFetch } = useDynamicSearch([
  "salary_country",
  "industry",
  "company",
  "profession_parent",
  "invoice",
  "skill",
  "group",
  "paket",
  "school",
  "interest",
  "language",
  "profession",
  "right_to_work",
  "subscription",
  "event",
  "job",
]);

// Companies for company user filter
const companies = ref([]);

// Computed properties
const visibleHeaders = computed(() => {
  if (!allHeaders.value || allHeaders.value.length === 0) {
    return [
      { title: "No", key: "index", sortable: false },
      { title: "Name", key: "full_name", sortable: true },
      { title: "Email", key: "email", sortable: true },
      { title: "Role", key: "user_role", sortable: true },
      { title: "Status", key: "status", sortable: true },
      { title: "Actions", key: "actions", sortable: false },
    ];
  }
  return allHeaders.value.filter((header) =>
    selectedColumns.value.includes(header.key)
  );
});

const companyVisibleHeaders = computed(() => {
  if (!companyHeaders.value || companyHeaders.value.length === 0) {
    return [
      { title: "No", key: "index", sortable: false },
      { title: "Name", key: "full_name", sortable: true },
      { title: "Email", key: "email", sortable: true },
      { title: "Company Role", key: "company_role", sortable: true },
      { title: "Company", key: "company_id", sortable: true },
      { title: "Status", key: "status", sortable: true },
      { title: "Actions", key: "actions", sortable: false },
    ];
  }
  return companyHeaders.value.filter((header) =>
    companySelectedColumns.value.includes(header.key)
  );
});

// Methods
const handleInputRegion = (event) => {
  debouncedFetchRegions(event.target.value);
};

const handleInputUser = (event) => {
  debouncedFetchUsers(event.target.value);
};

const handleInputCompany = (event) => {
  debouncedFetch(
    "company",
    event.target.value,
    ["company_name"],
    "mst-companies"
  );
  companies.value = models.value["company"].items;
};

const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};

// Load candidate items
const loadCandidateItems = async (options) => {
  if (loading.value) return;

  loading.value = true;
  try {
    // Build search filters
    const searchFilters = { ...filters.value };

    // Add search input to selected filter fields
    if (searchInput.value && filterFields.value.length > 0) {
      const orWhere = [];
      filterFields.value.forEach((field) => {
        if (field) {
          searchFilters[field] = searchInput.value;
          orWhere.push(field);
        }
      });
      if (orWhere.length > 0) {
        searchFilters.orWhere = orWhere;
      }
    }

    const params = {
      page: options.page,
      limit: options.itemsPerPage,
      sortBy: options.sortBy,
      filters: {
        ...searchFilters,
        user_role: "candidate",
      },
      expands: "company,region,industry",
    };

    const data = await $apiFetch("/users/search", { params });

    candidateItems.value = data.items;
    candidateTotal.value = data.meta.total;
    candidateCount.value = data.meta.total;
  } catch (error) {
    console.error("Error loading candidate items:", error);
  } finally {
    loading.value = false;
    first.value = false;
  }
};

// Load company user items
const loadCompanyItems = async (options) => {
  if (companyLoading.value) return;

  companyLoading.value = true;
  try {
    // Build search filters
    const searchFilters = { ...companyFilters.value };

    // Add search input to selected filter fields
    if (companySearchInput.value && companyFilterFields.value.length > 0) {
      const orWhere = [];
      companyFilterFields.value.forEach((field) => {
        if (field) {
          searchFilters[field] = companySearchInput.value;
          orWhere.push(field);
        }
      });
      if (orWhere.length > 0) {
        searchFilters.orWhere = orWhere;
      }
    }

    const params = {
      page: options.page,
      limit: options.itemsPerPage,
      sortBy: options.sortBy,
      filters: {
        ...searchFilters,
        user_role: "company",
      },
      expands: "company,region,industry",
    };

    const data = await $apiFetch("/users/search", { params });
    companyItems.value = data.items;
    companyTotal.value = data.meta.total;
    companyCount.value = data.meta.total;
  } catch (error) {
    console.error("Error loading company items:", error);
  } finally {
    companyLoading.value = false;
    companyFirst.value = false;
  }
};

// Delete user
const confirmDeleteUser = (user) => {
  selectedUser.value = user;
  deleteDialog.value = true;
};

const deleteUser = async () => {
  if (selectedUser.value) {
    deleteUserLoading.value = true;
    try {
      await $apiFetch(`/users/${selectedUser.value.id}`, {
        method: "DELETE",
      });

      deleteDialog.value = false;

      // Reload current tab data
      if (activeTab.value === "candidates") {
        debouncedLoadItems({
          page: page.value,
          itemsPerPage: itemsPerPage.value,
          sortBy: sortBy.value,
        });
      } else {
        debouncedLoadCompanyItems({
          page: companyPage.value,
          itemsPerPage: companyItemsPerPage.value,
          sortBy: companySortBy.value,
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      deleteUserLoading.value = false;
    }
  }
};

// Bulk Upload Functions
const downloadTemplate = async () => {
  downloadingTemplate.value = true;
  try {
    const response = await $apiFetch("/bulk-upload/users/candidate/template", {
      method: "GET",
      params: { type: "CANDIDATE_REGISTRATION" },
      responseType: "blob",
    });

    // Create download link
    const blob = new Blob([response], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "candidate_upload_template.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading template:", error);
    uploadStatus.value = {
      type: "error",
      message: "Failed to download template",
    };
  } finally {
    downloadingTemplate.value = false;
  }
};

const handleFileSelect = (file) => {
  if (file) {
    uploadStatus.value = null;
    fileUploaded.value = false; // Reset upload state when new file is selected
  }
};

const handleUpload = async () => {
  if (!uploadFile.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadStatus.value = null;

  try {
    const formData = new FormData();
    formData.append("file", uploadFile.value);

    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);

    const response = await $apiFetch("/bulk-upload/users/candidate/import", {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    uploadStatus.value = {
      type: "success",
      message: `File uploaded successfully! ${response.totalRows} rows processed. Batch ID: ${response.batch.id}`,
    };

    // Mark file as uploaded
    fileUploaded.value = true;

    // Close dialog after 2 seconds and refresh batches
    setTimeout(() => {
      closeUploadDialog();
      if (activeTab.value === "batches") {
        loadBatches();
      } else {
        activeTab.value = "batches";
      }
    }, 2000);
  } catch (error) {
    console.error("Error uploading file:", error);
    uploadStatus.value = {
      type: "error",
      message: error.message || "Failed to upload file",
    };
  } finally {
    uploading.value = false;
  }
};

const closeUploadDialog = () => {
  showBulkUploadDialog.value = false;
  uploadFile.value = null;
  uploadProgress.value = 0;
  uploadStatus.value = null;
  fileUploaded.value = false; // Reset upload state when dialog is closed
  if (uploadForm.value) {
    uploadForm.value.reset();
  }
};

// Batch Management Functions
const loadBatches = async (options = {}) => {
  if (batchLoading.value) return;

  batchLoading.value = true;
  try {
    const params = {
      page: options.page || batchPage.value,
      limit: options.itemsPerPage || batchItemsPerPage.value,
      sortBy: options.sortBy || batchSortBy.value,
    };

    // Add filters
    if (batchStatusFilter.value !== "all") {
      params.status = batchStatusFilter.value;
    }
    if (batchSearchInput.value) {
      params.search = batchSearchInput.value;
    }

    const data = await $apiFetch("/bulk-upload/users/candidate/batches", {
      params,
    });

    // Add computed fields to each batch item
    batches.value = data.items.map((item) => ({
      ...item,
      progress_percentage:
        item.total_rows > 0
          ? Math.round((item.valid_rows / item.total_rows) * 100)
          : 0,
      status:
        item.invalid_rows === 0
          ? "completed"
          : item.valid_rows > 0
          ? "partial"
          : "failed",
    }));

    batchTotal.value = data.meta.total;
  } catch (error) {
    console.error("Error loading batches:", error);
  } finally {
    batchLoading.value = false;
  }
};

// Debounced load functions
const debouncedLoadItems = debounce(loadCandidateItems, 200);
const debouncedLoadCompanyItems = debounce(loadCompanyItems, 200);
const debouncedLoadBatches = debounce(loadBatches, 200);
const debouncedSearchBatches = debounce(() => {
  loadBatches();
}, 500);

const viewBatchDetail = (batchId) => {
  // Navigate to batch detail page or open dialog
  navigateTo(`/admin/masters/users/batch/${batchId}`);
};

const retryAllFailedEmails = async () => {
  retryEmailsLoading.value = true;
  try {
    await $apiFetch("/bulk-upload/users/candidate/retry-email-all", {
      method: "POST",
      body: {
        type: "user_candidate_bulk_direct_registration",
      },
    });

    // Show success message
    uploadStatus.value = {
      type: "success",
      message: "Email retry initiated for all failed batches",
    };

    // Refresh batches
    loadBatches();
  } catch (error) {
    console.error("Error retrying emails:", error);
    uploadStatus.value = {
      type: "error",
      message: "Failed to retry emails",
    };
  } finally {
    retryEmailsLoading.value = false;
  }
};

const deleteFailedRows = async (batchId) => {
  try {
    await $apiFetch("/bulk-upload/users/candidate/delete-failed", {
      method: "DELETE",
      body: { batchId },
    });

    // Show success message
    uploadStatus.value = {
      type: "success",
      message: "Failed rows deleted successfully",
    };

    // Refresh batches
    loadBatches();
  } catch (error) {
    console.error("Error deleting failed rows:", error);
    uploadStatus.value = {
      type: "error",
      message: "Failed to delete failed rows",
    };
  }
};

const getBatchStatusColor = (status) => {
  const colors = {
    processing: "orange",
    completed: "green",
    failed: "red",
    pending: "blue",
  };
  return colors[status?.toLowerCase()] || "grey";
};

// Color functions
const getUserRoleColor = (role) => {
  const colors = {
    admin: "red",
    candidate: "blue",
    company: "green",
  };
  return colors[role] || "grey";
};

const getCompanyRoleColor = (role) => {
  const colors = {
    owner: "purple",
    member: "cyan",
    admin: "orange",
    hrd: "teal",
  };
  return colors[role] || "grey";
};

const getStatusColor = (role) => {
  role = role !== null && role !== undefined ? String(role).toLowerCase() : "";
  const colors = {
    verified: "green",
    unverified: "red",
    true: "green",
    false: "red",
    open: "blue",
    draft: "grey",
    publish: "green",
    close: "red",
  };
  return colors[role] || "grey";
};

// Load fields
const loadFields = async () => {
  try {
    const fields = await $apiFetch("/fields/users");
    allFields.value = fields;

    // Set up headers
    const headers = [{ title: "No", key: "index", sortable: false }];
    fields.forEach((field) => {
      headers.push({ title: field.label, key: field.name, sortable: true });
    });
    headers.push({ title: "Actions", key: "actions", sortable: false });

    allHeaders.value = headers;
    companyHeaders.value = headers;

    // Set default selected columns
    if (selectedColumns.value.length <= 1) {
      selectedColumns.value = [
        "index",
        "full_name",
        "email",
        "user_role",
        "status",
        "actions",
      ];
    }
    if (companySelectedColumns.value.length <= 1) {
      companySelectedColumns.value = [
        "index",
        "full_name",
        "email",
        "company_role",
        "company_id",
        "status",
        "actions",
      ];
    }
  } catch (error) {
    console.error("Error loading fields:", error);
  } finally {
    filterLoading.value = false;
  }
};

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === "candidates") {
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  } else if (newTab === "companies") {
    debouncedLoadCompanyItems({
      page: companyPage.value,
      itemsPerPage: companyItemsPerPage.value,
      sortBy: companySortBy.value,
    });
  } else if (newTab === "batches") {
    debouncedLoadBatches({
      page: batchPage.value,
      itemsPerPage: batchItemsPerPage.value,
      sortBy: batchSortBy.value,
    });
  }
});

// Watch for search input changes
watch(searchInput, (newValue) => {
  if (activeTab.value === "candidates") {
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }
});

watch(companySearchInput, (newValue) => {
  if (activeTab.value === "companies") {
    debouncedLoadCompanyItems({
      page: companyPage.value,
      itemsPerPage: companyItemsPerPage.value,
      sortBy: companySortBy.value,
    });
  }
});

// Watch for filter fields changes
watch(
  filterFields,
  (newValue) => {
    if (activeTab.value === "candidates" && searchInput.value) {
      debouncedLoadItems({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value,
      });
    }
  },
  { deep: true }
);

watch(
  companyFilterFields,
  (newValue) => {
    if (activeTab.value === "companies" && companySearchInput.value) {
      debouncedLoadCompanyItems({
        page: companyPage.value,
        itemsPerPage: companyItemsPerPage.value,
        sortBy: companySortBy.value,
      });
    }
  },
  { deep: true }
);

// Watch for filters changes
watch(
  () => filters.value,
  () => {
    if (!loading.value && activeTab.value === "candidates") {
      page.value = 1;
      debouncedLoadItems({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value,
      });
    }
  },
  { deep: true }
);

watch(
  () => companyFilters.value,
  () => {
    if (!companyLoading.value && activeTab.value === "companies") {
      companyPage.value = 1;
      debouncedLoadCompanyItems({
        page: companyPage.value,
        itemsPerPage: companyItemsPerPage.value,
        sortBy: companySortBy.value,
      });
    }
  },
  { deep: true }
);

// Export and import functions
const handleExportData = () => {
  const currentTab = activeTab.value;
  const params = {
    filters:
      currentTab === "candidates"
        ? { ...filters.value, user_role: "candidate" }
        : { ...companyFilters.value, user_role: "company" },
    isExcel: true,
  };

  // Implementation for export
  console.log("Exporting data for:", currentTab);
};

const handleImportData = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  importDialog.value.attributes.loading = true;

  $apiFetch("/users/import-xls", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      alert("File uploaded successfully.");
      // Reload current tab
      if (activeTab.value === "candidates") {
        debouncedLoadItems({
          page: page.value,
          itemsPerPage: itemsPerPage.value,
          sortBy: sortBy.value,
        });
      } else {
        debouncedLoadCompanyItems({
          page: companyPage.value,
          itemsPerPage: companyItemsPerPage.value,
          sortBy: companySortBy.value,
        });
      }
      importDialog.value.attributes.dialog = false;
      importDialog.value.attributes.file = false;
    })
    .catch((error) => {
      alert("Failed to upload file. " + error);
    })
    .finally(() => {
      importDialog.value.attributes.loading = false;
    });
};

onMounted(async () => {
  try {
    await loadFields();
  } catch (error) {
    console.error("Error loading fields:", error);
    filterLoading.value = false; // Ensure filterLoading is reset even on error
  }

  // Initialize hash-based tab navigation
  initializeFromHash();
  setupHashListener();

  // Load initial data for candidates tab after fields are loaded
  setTimeout(() => {
    debouncedLoadItems({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value,
    });
  }, 100); // Small delay to ensure everything is ready
});

onBeforeUnmount(() => {
  // Clean up hash listener
  cleanupHashListener();
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

.border-b {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Custom tab styling */
:deep(.v-tabs) {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

:deep(.v-tab) {
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
}

:deep(.v-tab--selected) {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

/* Enhanced card styling */
:deep(.v-card) {
  transition: all 0.3s ease;
}

:deep(.v-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Custom chip styling */
:deep(.v-chip) {
  font-weight: 500;
}

/* Enhanced table styling */
:deep(.v-data-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.v-data-table__wrapper) {
  border-radius: 12px;
}

/* Button enhancements */
:deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Search field enhancements */
:deep(.v-text-field .v-field) {
  border-radius: 12px;
}

/* Filter card animations */
.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: all 0.3s ease;
}

.v-expand-transition-enter-from,
.v-expand-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
