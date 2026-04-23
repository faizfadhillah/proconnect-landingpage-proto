<template>
  <v-container class="pa-2 mt-2">
    <v-card rounded="xl" elevation="0" class="pa-2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8" lg="9">
            <h2 class="mb-2">Headquarters and Branch Information</h2>
            <p class="text-grey mb-2">
              Please enter the details of your company’s headquarters and
              branches. Ensure all fields are accurate for an updated company
              profile. Headquarters are automatically filled based on Business
              Profile data, just add the department.
            </p>
          </v-col>
          <v-col cols="12" md="4" lg="3" class="d-flex justify-end">
            <v-btn
              v-if="canAddBranch"
              color="primary"
              variant="outlined"
              class="font-weight-bold mt-4"
              height="46"
              rounded="lg"
              @click="handleAddSingleBranch"
            >
              ADD BRANCH
              <template v-slot:prepend>
                <v-icon>mdi-plus</v-icon>
              </template>
            </v-btn>
            <!-- Add Branch Button with Dropdown -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  variant="outlined"
                  class="font-weight-bold mt-4"
                  height="46"
                  rounded="lg"
                  v-bind="props"
                  style="display: none"
                >
                  ADD BRANCH
                  <template v-slot:prepend>
                    <v-icon>mdi-plus</v-icon>
                  </template>
                </v-btn>
              </template>
              <v-list density="compact" class="pa-2">
                <v-list-item @click="handleUploadMultipleBranches">
                  <v-list-item-title
                    >Upload Multiple Branches</v-list-item-title
                  >
                </v-list-item>
                <v-list-item @click="handleAddSingleBranch">
                  <v-list-item-title>Add a Single Branch</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>

        <!-- Search and Filter Section -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-row>
              <v-col cols="12" md="12" lg="6">
                <div class="text-grey mb-1">Search by</div>
                <v-text-field
                  v-model="searchKeyword"
                  placeholder="Type your keywords here"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  hide-details
                >
                  <template v-slot:prepend>
                    <v-select
                      v-model="searchBy"
                      :items="searchOptions"
                      item-title="label"
                      item-value="value"
                      placeholder="Branch"
                      hide-details
                      variant="outlined"
                      min-width="150"
                      rounded="lg"
                      density="comfortable"
                    >
                    </v-select>
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="12" lg="6">
                <div class="text-grey mb-1">Department</div>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="selectedDepartment"
                      :items="departments"
                      item-title="label"
                      item-value="value"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      placeholder="All"
                      hide-details
                    />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-btn
                      color="primary"
                      variant="outlined"
                      block
                      rounded="lg"
                      size="large"
                      @click="handleSearch"
                    >
                      Search
                    </v-btn>
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-btn
                      color="grey"
                      variant="text"
                      @click="handleReset"
                      size="large"
                      rounded="lg"
                      block
                    >
                      Reset
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Branch Information Table -->
        <v-row class="mt-4">
          <v-col cols="12">
            <v-data-table-server
              class="blue-lighten-5 rounded-lg border"
              v-model:items-per-page="itemsPerPage"
              v-model:page="page"
              :headers="tableHeaders"
              :items="filteredBranches"
              :items-length="totalItems"
              :loading="loadingInitial"
              :search="searchKeyword"
              :sort-by="sortBy"
              multi-sort
              @update:options="handleTableUpdate"
            >
              <template v-slot:item.display_name="{ item }">
                {{ item.display_name || "-" }}
              </template>

              <template v-slot:item.departments="{ item }">
                <template
                  v-if="item.departments && item.departments.length > 0"
                >
                  <div>
                    <template
                      v-for="(department, index) in getVisibleDepartments(item)"
                      :key="department.id"
                    >
                      {{ department.dept_name
                      }}<span
                        v-if="index < getVisibleDepartments(item).length - 1"
                        >,
                      </span>
                    </template>
                    <span
                      v-if="shouldShowLoadMore(item)"
                      class="text-primary ml-1"
                      style="cursor: pointer; text-decoration: underline"
                      @click="toggleDepartmentExpansion(item.id)"
                    >
                      <span
                        v-if="
                          !isDepartmentExpanded(item.id) &&
                          getVisibleDepartments(item).length > 0
                        "
                        >,
                      </span>
                      {{
                        isDepartmentExpanded(item.id)
                          ? " (Show less)"
                          : `+${
                              item.departments.length - maxVisibleDepartments
                            } more`
                      }}
                    </span>
                  </div>
                </template>
                <template v-else>-</template>
              </template>

              <template v-slot:item.location="{ item }">
                {{ item.location || "-" }}
              </template>

              <template v-slot:item.email="{ item }">
                {{ item.email || "-" }}
              </template>

              <template v-slot:item.phone="{ item }">
                {{ item.phone || "-" }}
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex align-center">
                  <v-btn
                    v-if="canEditBranch(item.id)"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="editBranch(item)"
                  />
                  <v-btn
                    v-if="
                      canDeleteBranch(item.id, item.branch) &&
                      item.display_name !== 'Headquarters'
                    "
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteBranch(item)"
                  />
                  <v-btn
                    v-if="!canEditBranch(item.id) && canViewHqBranchInfo"
                    icon="mdi-eye"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="viewBranch(item)"
                  />
                </div>
              </template>
            </v-data-table-server>
          </v-col>
        </v-row>

        <!-- Navigation Section -->
        <v-row class="mt-8 pa-2">
          <v-col cols="12" class="d-flex justify-space-between align-center">
            <v-btn
              color="primary"
              variant="outlined"
              class="font-weight-bold"
              rounded="lg"
              size="large"
              @click="handleBack"
              min-width="200"
              :disabled="me.last_wizard_state > 2"
            >
              Back
            </v-btn>

            <!-- Floating Profile Button -->

            <v-btn
              v-if="canEditHqBranchInfo"
              color="primary"
              variant="elevated"
              class="font-weight-bold"
              rounded="lg"
              size="large"
              @click="handleSubmit"
              :loading="loadingSubmit"
              min-width="200"
            >
              {{ route.query.edit ? "Save" : "Next" }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Add Single Branch Dialog -->
    <v-dialog
      v-model="showAddSingleBranchDialog"
      max-width="600"
      persistent
      scrollable
    >
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between px-6">
          <span class="text-h5 font-weight-bold">Add Branch</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeAddSingleBranchDialog"
          />
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="singleBranchForm" v-model="singleBranchFormValid">
            <template v-if="singleBranch.branch_type">
              <v-select
                v-model="singleBranch.branch_type"
                :items="branchTypes"
                item-title="label"
                item-value="value"
                label="Branch Type"
                placeholder="Choose branch type"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :disabled="singleBranch.branch_type == 'headquarters'"
                :rules="[(v) => !!v || 'Branch type is required']"
              />
            </template>

            <div class="text-grey-darken-2">
              <small>Branch Name *</small>
            </div>
            <v-text-field
              v-model="singleBranch.branch"
              placeholder="ex. Jakarta"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[(v) => !!v || 'Branch name is required']"
            />
            <div class="text-grey-darken-2">
              <small>Country *</small>
            </div>
            <v-autocomplete
              v-model="singleBranch.country_id"
              placeholder="Select country"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :error-messages="errors.country_id"
              @keyup="handleInput($event, 'country', ['name'], 'mst-country')"
              :items="models['country'].items"
              :loading="models['country'].loading"
              :rules="[(v) => !!v || 'Country is required']"
              item-title="name"
              item-value="id"
            ></v-autocomplete>

            <template v-if="!singleBranch.is_outside_indo">
              <div class="text-grey-darken-2">
                <small>Region*</small>
              </div>
              <v-autocomplete
                v-model="singleBranch.region_id"
                placeholder="Insert 3 characters or more to search"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :error-messages="errors.region_id"
                :items="regions"
                :loading="regionLoading"
                :search-input.sync="regionSearch"
                item-title="name"
                item-value="id"
                @update:search="searchCities"
                :rules="[
                  (v) =>
                    singleBranch.is_outside_indo || !!v || 'Region is required',
                ]"
              ></v-autocomplete>
            </template>
            <template v-else>
              <div class="text-grey-darken-2">
                <small>Region*</small>
              </div>
              <v-text-field
                v-model="singleBranch.other_region"
                variant="outlined"
                density="comfortable"
                placeholder="Input region"
                :rules="[
                  (v) =>
                    !singleBranch.is_outside_indo ||
                    !!v ||
                    'Region is required',
                ]"
                rounded="lg"
              />
            </template>

            <div class="text-grey-darken-2">
              <small>Location</small>
            </div>
            <v-textarea
              v-model="singleBranch.location"
              placeholder="Please state your address, city, and postal code (optional)"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              rows="3"
            />
            <div class="text-grey-darken-2">
              <small>NPWP / TIN Number</small>
            </div>
            <v-text-field
              v-model="singleBranch.tax_identification_number"
              placeholder="Input your NPWP / Tax ID Number (optional)"
              variant="outlined"
              density="comfortable"
              rounded="lg"
            />

            <v-switch
              v-model="singleBranch.use_hq_business_profile"
              label="Same as Business Profile"
              color="primary"
              hide-details
            />

            <div class="text-grey-darken-2">
              <small>Company Website</small>
            </div>
            <v-text-field
              v-model="singleBranch.website"
              placeholder="Branch company website"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[
                (v) =>
                  !v ||
                  /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(v) ||
                  'Please enter a valid website URL (e.g., example.com)',
              ]"
            />

            <div class="text-grey-darken-2">
              <small>Company Email</small>
            </div>
            <v-text-field
              v-model="singleBranch.email"
              placeholder="Branch company email"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[
                (v) =>
                  !v ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                  'Please enter a valid email address',
              ]"
            />

            <div class="text-grey-darken-2">
              <small>Company Phone Number</small>
            </div>
            <v-phone-field
              v-model="singleBranch.phone"
              placeholder="Company contact number"
              variant="outlined"
              density="comfortable"
              rounded="lg"
            />

            <div class="text-grey-darken-2">
              <small>List of Department *</small>
            </div>
            <v-autocomplete
              v-model="singleBranch.department_ids"
              :items="availableDepartments"
              item-title="dept_name"
              item-value="id"
              placeholder="Select the available departments"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              multiple
              chips
              closable-chips
              :rules="[
                (v) =>
                  (v && v.length > 0) || 'At least one department is required',
              ]"
            >
              <template v-slot:chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  label
                  color="primary"
                  class="text-white"
                  variant="flat"
                  closable
                >
                  {{ item.raw.dept_name }}
                </v-chip>
              </template>

              <template v-slot:no-data>
                <div class="pa-4 text-center">
                  <div class="text-grey mb-3">
                    <v-icon size="48" color="grey-lighten-1"
                      >mdi-office-building-outline</v-icon
                    >
                    <p class="text-body-2 mt-2">No departments found</p>
                    <p class="text-caption">
                      Create a new department to get started
                    </p>
                  </div>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    size="small"
                    @click="showAddDepartmentDialog = true"
                    class="font-weight-bold"
                  >
                    <v-icon start>mdi-plus</v-icon>
                    Add Department
                  </v-btn>
                </div>
              </template>
            </v-autocomplete>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            @click="closeAddSingleBranchDialog"
            class="mr-3"
          >
            CANCEL
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="saveSingleBranch"
            :loading="loadingSaveSingleBranch"
          >
            SAVE
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Multiple Branch Dialog -->
    <v-dialog v-model="showAddMultipleBranchDialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title
          class="d-flex align-center justify-space-between pa-6 pb-4"
        >
          <span class="text-h5 font-weight-bold">Add Multiple Branch</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeAddMultipleBranchDialog"
          />
        </v-card-title>

        <v-card-text class="pa-6 pt-0">
          <div class="mb-4">
            <div class="text-h6 mb-2">Upload_Branch_Template.xlsx</div>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              @click="downloadTemplate"
              class="pa-0"
            >
              Download Template
            </v-btn>
          </div>

          <v-file-input
            v-model="multipleBranchFile"
            accept=".xls,.xlsx,.csv"
            label="Choose a File"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            prepend-icon=""
            class="upload-area"
            @change="handleFileUpload"
          >
            <template v-slot:prepend>
              <v-icon color="primary" size="large">mdi-cloud-upload</v-icon>
            </template>
          </v-file-input>

          <div class="mt-4">
            <div class="d-flex align-center mb-2">
              <v-icon size="small" color="info" class="mr-2"
                >mdi-information</v-icon
              >
              <span class="text-caption"
                >Accepted file formats are .xls, .xlsx, and .csv.</span
              >
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" color="info" class="mr-2"
                >mdi-information</v-icon
              >
              <span class="text-caption">
                The file structure is correct. Don't have a template?
                <a href="#" @click="downloadTemplate" class="text-primary"
                  >Download it here</a
                >.
              </span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            @click="closeAddMultipleBranchDialog"
            class="mr-3"
          >
            CANCEL
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="saveMultipleBranches"
            :loading="loadingSaveMultipleBranches"
            :disabled="!multipleBranchFile"
          >
            SAVE
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Branch Dialog -->
    <v-dialog
      v-model="showEditBranchDialog"
      max-width="600"
      persistent
      scrollable
    >
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between px-6">
          <span class="text-h5 font-weight-bold">
            {{ isViewingBranch ? "View Branch" : "Edit Branch" }}
          </span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeEditBranchDialog"
          />
        </v-card-title>
        <v-divider />

        <v-card-text class="pa-6">
          <v-form ref="editBranchForm" v-model="editBranchFormValid">
            <v-select
              v-model="editingBranch.branch_type"
              :items="branchTypes"
              item-title="label"
              item-value="value"
              label="Branch Type"
              placeholder="Choose branch type"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              disabled
              :rules="[(v) => !!v || 'Branch type is required']"
            />
            <template v-if="editingBranch.branch_type === 'branch'">
              <div class="text-grey-darken-2">
                <small>Branch Name *</small>
              </div>
              <v-text-field
                v-model="editingBranch.branch"
                placeholder="ex. Jakarta"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :rules="[(v) => !!v || 'Branch name is required']"
                :readonly="isViewingBranch"
              />
            </template>

            <div class="text-grey-darken-2">
              <small>Country *</small>
            </div>
            <v-autocomplete
              v-model="editingBranch.country_id"
              placeholder="Select country"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :error-messages="errors.country_id"
              @keyup="handleInput($event, 'country', ['name'], 'mst-country')"
              :items="models['country'].items"
              :loading="models['country'].loading"
              :rules="[(v) => !!v || 'Country is required']"
              item-title="name"
              item-value="id"
              :readonly="isViewingBranch"
            ></v-autocomplete>

            <template v-if="!editingBranch.is_outside_indo">
              <div class="text-grey-darken-2">
                <small>Region*</small>
              </div>
              <v-autocomplete
                v-model="editingBranch.region_id"
                placeholder="Insert 3 characters or more to search"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                :error-messages="errors.region_id"
                :items="regions"
                :loading="regionLoading"
                :search-input.sync="regionSearch"
                item-title="name"
                item-value="id"
                @update:search="searchCities"
                :rules="[
                  (v) =>
                    editingBranch.is_outside_indo ||
                    !!v ||
                    'Region is required',
                ]"
                :readonly="isViewingBranch"
              ></v-autocomplete>
            </template>
            <template v-else>
              <div class="text-grey-darken-2">
                <small>Region*</small>
              </div>
              <v-text-field
                v-model="editingBranch.other_region"
                variant="outlined"
                density="comfortable"
                placeholder="Input region"
                :rules="[
                  (v) =>
                    !editingBranch.is_outside_indo ||
                    !!v ||
                    'Region is required',
                ]"
                rounded="lg"
                :readonly="isViewingBranch"
              />
            </template>
            <div class="text-grey-darken-2">
              <small>Location</small>
            </div>
            <v-textarea
              v-model="editingBranch.location"
              placeholder="Please state your address, city, and postal code (optional)"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              rows="3"
              :readonly="isViewingBranch"
            />

            <div class="text-grey-darken-2">
              <small>NPWP / TIN Number</small>
            </div>
            <v-text-field
              v-model="editingBranch.tax_identification_number"
              placeholder="Input your NPWP / Tax ID Number (optional)"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :readonly="isViewingBranch"
            />

            <v-switch
              v-model="editingBranch.use_hq_business_profile"
              label="Same as Business Profile"
              color="primary"
              hide-details
              :disabled="isViewingBranch"
            />

            <div class="text-grey-darken-2">
              <small>Company Website</small>
            </div>
            <v-text-field
              v-model="editingBranch.website"
              placeholder="Branch company website"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[
                (v) =>
                  !v ||
                  /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(v) ||
                  'Please enter a valid website URL (e.g., example.com)',
              ]"
              :readonly="isViewingBranch"
            />

            <div class="text-grey-darken-2">
              <small>Company Email</small>
            </div>
            <v-text-field
              v-model="editingBranch.email"
              placeholder="Branch company email"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :rules="[
                (v) =>
                  !v ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                  'Please enter a valid email address',
              ]"
              :readonly="isViewingBranch"
            />

            <div class="text-grey-darken-2">
              <small>Company Phone Number</small>
            </div>
            <v-phone-field
              v-model="editingBranch.phone"
              placeholder="Company contact number"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              :readonly="isViewingBranch"
            />

            <div class="text-grey-darken-2">
              <small>List of Department *</small>
            </div>
            <v-autocomplete
              v-model="editingBranch.department_ids"
              :items="availableDepartments"
              item-title="dept_name"
              item-value="id"
              placeholder="Select the available departments"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              multiple
              chips
              closable-chips
              :rules="[
                (v) =>
                  (v && v.length > 0) || 'At least one department is required',
              ]"
              :readonly="isViewingBranch"
            >
              <template v-slot:chip="{ props, item }">
                <v-chip
                  v-bind="props"
                  label
                  color="primary"
                  class="text-white"
                  variant="flat"
                  :closable="!isViewingBranch"
                >
                  {{ item.raw.dept_name }}
                </v-chip>
              </template>

              <template v-slot:no-data>
                <div class="pa-4 text-center">
                  <div class="text-grey mb-3">
                    <v-icon size="48" color="grey-lighten-1"
                      >mdi-office-building-outline</v-icon
                    >
                    <p class="text-body-2 mt-2">No departments found</p>
                    <p class="text-caption">
                      Create a new department to get started
                    </p>
                  </div>
                  <v-btn
                    v-if="!isViewingBranch"
                    color="primary"
                    variant="outlined"
                    size="small"
                    @click="showAddDepartmentDialog = true"
                    class="font-weight-bold"
                  >
                    <v-icon start>mdi-plus</v-icon>
                    Add Department
                  </v-btn>
                </div>
              </template>
            </v-autocomplete>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            @click="closeEditBranchDialog"
            class="mr-3"
          >
            {{ isViewingBranch ? "CLOSE" : "CANCEL" }}
          </v-btn>
          <v-btn
            v-if="!isViewingBranch"
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="saveEditBranch"
            :loading="loadingSaveEditBranch"
          >
            SAVE CHANGES
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteBranchDialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-4">
          <span class="text-h5 font-weight-bold">Delete Branch</span>
        </v-card-title>

        <v-card-text class="pa-6 pt-0">
          <p class="text-body-1">
            Are you sure you want to delete the branch
            <strong
              >"{{
                branchToDelete?.display_name || branchToDelete?.branch
              }}"</strong
            >?
          </p>
          <p class="text-body-2 text-grey mt-2">
            This action cannot be undone.
          </p>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            @click="closeDeleteBranchDialog"
            class="mr-3"
          >
            CANCEL
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            @click="confirmDeleteBranch"
            :loading="loadingDeleteBranch"
          >
            DELETE
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Department Dialog -->
    <v-dialog v-model="showAddDepartmentDialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title
          class="d-flex align-center justify-space-between pa-6 pb-4"
        >
          <span class="text-h5 font-weight-bold">Add New Department</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="closeAddDepartmentDialog"
          />
        </v-card-title>

        <v-card-text class="pa-6 pt-0">
          <v-form ref="addDepartmentForm" v-model="addDepartmentFormValid">
            <v-row>
              <v-col cols="12">
                <div class="text-grey-darken-2 mb-1">
                  <small>Department Name *</small>
                </div>
                <v-text-field
                  v-model="newDepartment.dept_name"
                  placeholder="e.g., Human Resources"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  :rules="[(v) => !!v || 'Department name is required']"
                />
              </v-col>

              <v-col cols="12" style="display: none">
                <div class="text-grey-darken-2 mb-1">
                  <small>Department Code *</small>
                </div>
                <v-text-field
                  v-model="newDepartment.dept_code"
                  placeholder="e.g., HR"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn
            variant="outlined"
            rounded="lg"
            @click="closeAddDepartmentDialog"
            class="mr-3"
          >
            CANCEL
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            @click="saveNewDepartment"
            :loading="loadingAddDepartment"
          >
            ADD DEPARTMENT
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { limit } from "firebase/firestore";

definePageMeta({ ssr: false, layout: "wizard-employer", middleware: ["auth"] });

const { $apiFetch } = useApi();
const router = useRouter();
const { me, fetchMe } = useUser();
// Permission checks
const { canAccessProfileSection, hasPermission } = usePermissions();
const canEditHqBranchInfo = computed(() =>
  canAccessProfileSection("hq_branch_info", "edit")
);
const canViewHqBranchInfo = computed(() =>
  canAccessProfileSection("hq_branch_info", "view")
);

// Check if user can edit specific branch
const canEditBranch = (branchId) => {
  if (!canEditHqBranchInfo.value) return false;

  // Get user's role assignment
  const userRole = me.value?.roles?.[0]?.assignment;
  if (!userRole) return false;

  // If user is HQ level (owner_hq, hrd_hq, dept_head_hq), they can edit all branches
  const hqRoles = ["owner_hq", "hrd_hq", "dept_head_hq"];
  if (hqRoles.includes(userRole.company_role)) {
    return true;
  }

  // If user is branch level (pic_branch, hrd_branch, dept_head_branch),
  // they can only edit their assigned branch
  const branchRoles = ["pic_branch", "hrd_branch", "dept_head_branch"];
  if (branchRoles.includes(userRole.company_role)) {
    // Check if the branch ID matches user's assigned company_id
    return userRole.company_id === branchId;
  }

  return false;
};

// Check if user can delete specific branch
const canDeleteBranch = (branchId, hasBranchName) => {
  // Only HQ level can delete branches
  // And can't delete headquarters (branches without branch name)
  if (!hasBranchName) return false;

  const userRole = me.value?.roles?.[0]?.assignment;
  if (!userRole) return false;

  const hqRoles = ["owner_hq", "hrd_hq", "dept_head_hq"];
  return hqRoles.includes(userRole.company_role);
};

// Check if user can add new branch (only HQ level)
const canAddBranch = computed(() => {
  if (!canEditHqBranchInfo.value) return false;

  const userRole = me.value?.roles?.[0]?.assignment;
  if (!userRole) return false;

  const hqRoles = ["owner_hq", "hrd_hq", "dept_head_hq"];
  return hqRoles.includes(userRole.company_role);
});

const showDeleteDialog = ref(false);
const selectedMember = ref(null);
const currentView = ref("list-branch");

// Single branch form data
const singleBranch = ref({
  branch_type: null,
  company_name: null,
  branch: null,
  parent_id: null,
  country_id: null,
  is_outside_indo: false,
  other_country: null,
  region_id: null,
  other_region: null,
  location: null,
  tax_identification_number: null,
  use_hq_business_profile: false,
  website: null,
  phone: null,
  department_ids: [],
});

// Multiple branch file upload
const multipleBranchFile = ref(null);

// Edit branch data
const editingBranch = ref({
  id: null,
  branch_type: null,
  company_name: null,
  branch: null,
  parent_id: null,
  country_id: null,
  is_outside_indo: false,
  other_country: null,
  region_id: null,
  other_region: null,
  location: null,
  tax_identification_number: null,
  use_hq_business_profile: false,
  website: null,
  phone: null,
  department_ids: [],
});

// Delete branch data
const branchToDelete = ref(null);

// Branch-related states
const branches = ref([]);
const fetchBranches = async (companyHqID = null) => {
  companyHqID = companyHqID || companyHq.value.id;
  if (!companyHqID) return;

  loadingInitial.value = true;
  try {
    // Get HQ company first to know company_name
    const hqRes = await $apiFetch("/mst-companies/search", {
      params: {
        filters: { id: companyHqID },
        limit: 1,
      },
    });

    if (!hqRes.items || hqRes.items.length === 0) {
      branches.value = [];
      totalItems.value = 0;
      loadingInitial.value = false;
      return;
    }

    const hqCompany = hqRes.items[0];
    companyHq.value = hqCompany;

    // Build filters for /mst-companies/search
    const filters = {
      company_name: hqCompany.company_name, // Get all branches with same company_name
    };

    // Add search filters if they exist (backend filtering)
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.trim();
      if (keyword) {
        switch (searchBy.value) {
          case "branch":
            filters.branch = keyword;
            break;
          case "location":
            filters.location = keyword;
            break;
          case "email":
            filters.email = keyword;
            break;
          case "phone":
            filters.phone = keyword;
            break;
        }
      }
    }

    // Add department filter if selected (backend filtering)
    if (selectedDepartment.value && selectedDepartment.value !== "All") {
      filters.dept_id = selectedDepartment.value;
    }

    // Build sortBy object from sortBy array
    let sortByParam = {};
    if (sortBy.value && sortBy.value.length > 0) {
      // Take the first sort option (Vuetify supports multi-sort but we'll use first one)
      const firstSort = sortBy.value[0];
      sortByParam[firstSort.key] = firstSort.order === "desc" ? "DESC" : "ASC";
    } else {
      // Default sort by branch DESC if no sorting specified
      //sortByParam = { branch: "ASC" };
    }

    // Fetch branches with filtering and pagination using /mst-companies/search
    const response = await $apiFetch("/mst-companies/search", {
      params: {
        filters,
        page: page.value,
        limit: itemsPerPage.value,
        sortBy: sortByParam,
      },
    });

    // Fetch departments for each branch in parallel
    const departmentsRes = await Promise.all(
      response.items.map((branch) =>
        $apiFetch(`/mst-companies/departments/${branch.id}`).catch((error) => {
          console.error(
            `Error fetching departments for branch ${branch.id}:`,
            error
          );
          return { items: [] };
        })
      )
    );

    // Map branches with departments
    branches.value = response.items.map((branch, index) => ({
      ...branch,
      departments: departmentsRes[index]?.items || [],
      display_name: branch.branch || "Headquarters",
    }));

    totalItems.value = response.meta?.total || 0;

    // Populate departments dropdown
    populateDepartments();

    // Don't copy company data to branch form - branches should start blank
    resetSingleBranchForm();
  } catch (error) {
    console.error("Error fetching branches:", error);
    branches.value = [];
    totalItems.value = 0;
  } finally {
    loadingInitial.value = false;
  }
};

const searchKeyword = ref("");
const searchBy = ref("branch");
const selectedDepartment = ref("All");

// Table pagination and sorting
const page = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const sortBy = ref([]);

// Department expansion state
const expandedDepartments = ref(new Set());
const maxVisibleDepartments = ref(3);

// Department expansion functions
const getVisibleDepartments = (item) => {
  if (!item.departments || item.departments.length === 0) return [];

  if (
    isDepartmentExpanded(item.id) ||
    item.departments.length <= maxVisibleDepartments.value
  ) {
    return item.departments;
  }

  return item.departments.slice(0, maxVisibleDepartments.value);
};

const shouldShowLoadMore = (item) => {
  return (
    item.departments && item.departments.length > maxVisibleDepartments.value
  );
};

const isDepartmentExpanded = (branchId) => {
  return expandedDepartments.value.has(branchId);
};

const toggleDepartmentExpansion = (branchId) => {
  if (expandedDepartments.value.has(branchId)) {
    expandedDepartments.value.delete(branchId);
  } else {
    expandedDepartments.value.add(branchId);
  }
};

// Search options
const searchOptions = ref([
  { label: "Branch", value: "branch" },
  { label: "Location", value: "location" },
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
]);

const companyHqID = ref(null);
const companyHq = ref({});
const departments = ref([{ label: "All", value: "All" }]);

// Function to populate departments from branches
const populateDepartments = () => {
  const departmentMap = new Map();
  departmentMap.set("All", { label: "All", value: "All" });

  branches.value.forEach((branch) => {
    if (branch.departments) {
      branch.departments.forEach((dept) => {
        if (dept.id && dept.dept_name) {
          departmentMap.set(dept.id, {
            label: dept.dept_name,
            value: dept.id, // Use UUID as value
          });
        }
      });
    }
  });

  departments.value = Array.from(departmentMap.values());
};

const tableHeaders = ref([
  { title: "No", key: "no", sortable: false },
  { title: "Branch", key: "branch", sortable: true },
  { title: "Department", key: "departments", sortable: false },
  { title: "Location", key: "location", sortable: true },
  { title: "Email", key: "email", sortable: true },
  { title: "Phone Number", key: "phone", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
]);

// States
const members = ref([]);
const newMember = ref({
  full_name: "",
  email: "",
  is_outside_indo: false,
  city_id: null,
  postal_code: "",
  encrypted_address: "",
  gender: null,
  encrypted_date_of_birth: "",
  encrypted_phone: null,
  company_role: null,
});

const errors = ref({});
const loading = ref(false);
const loadingAdd = ref(false);
const loadingDelete = ref(null);
const dialog = ref(false);
const selectedCountryCode = ref({
  name: "Indonesia",
  dial_code: "+62",
  code: "ID",
  flag: "🇮🇩",
});

const phoneNumber = ref("");
watch(
  [() => phoneNumber.value, selectedCountryCode],
  ([newPhone, newCountryCode]) => {
    if (newPhone && !newPhone.startsWith("+")) {
      newMember.value.encrypted_phone = `${newCountryCode.dial_code}${newPhone}`;
    }
  },
  { deep: true }
);

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();

const { models, debouncedFetch, fetch } = useDynamicSearch(["country"]);

const regionSearch = ref("");

const searchCities = (search) => {
  debouncedFetchRegions(search);
};

const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};

// Watch for country changes in single branch
watch(
  () => singleBranch.value.country_id,
  (newCountryId) => {
    if (newCountryId) {
      const selectedCountry = models.value["country"].items.find(
        (country) => country.id === newCountryId
      );

      if (selectedCountry) {
        const isIndonesia =
          selectedCountry.name.toLowerCase().includes("indonesia") ||
          selectedCountry.code === "ID";

        singleBranch.value.is_outside_indo = !isIndonesia;

        if (!isIndonesia) {
          singleBranch.value.region_id = null;
        } else {
          singleBranch.value.other_region = null;
        }
      }
    }
  }
);

// Watch for country changes in editing branch
watch(
  () => editingBranch.value.country_id,
  (newCountryId) => {
    if (newCountryId) {
      const selectedCountry = models.value["country"].items.find(
        (country) => country.id === newCountryId
      );

      if (selectedCountry) {
        const isIndonesia =
          selectedCountry.name.toLowerCase().includes("indonesia") ||
          selectedCountry.code === "ID";

        editingBranch.value.is_outside_indo = !isIndonesia;

        if (!isIndonesia) {
          editingBranch.value.region_id = null;
        } else {
          editingBranch.value.other_region = null;
        }
      }
    }
  }
);

// Watch for use_hq_business_profile switch in single branch
watch(
  () => singleBranch.value.use_hq_business_profile,
  (newValue) => {
    if (newValue && companyHq.value) {
      // Fill form with headquarters data
      singleBranch.value.website = companyHq.value.website;
      singleBranch.value.phone = companyHq.value.phone;
      singleBranch.value.email = companyHq.value.email;
      singleBranch.value.department_ids = companyHq.value.departments.map(
        (department) => department.id
      );
    } else if (!newValue) {
      // Clear form fields when switch is turned off
      //singleBranch.value.website = null;
      //singleBranch.value.phone = null;
      //singleBranch.value.email = null;
      //singleBranch.value.department_ids = [];
    }
  }
);

// Watch for changes in website, phone, email, or department_ids to compare with HQ
watch(
  () => [
    singleBranch.value.website,
    singleBranch.value.phone,
    singleBranch.value.email,
    singleBranch.value.department_ids,
  ],
  () => {
    if (singleBranch.value.use_hq_business_profile && companyHq.value) {
      // Helper function to compare department arrays
      const compareDepartmentIds = (ids1, ids2) => {
        const sorted1 = [...ids1].sort().join(",");
        const sorted2 = [...ids2].sort().join(",");
        return sorted1 === sorted2;
      };

      const hqDepartmentIds =
        companyHq.value.departments?.map((department) => department.id) || [];

      // Check if any value differs from HQ
      const websiteDiffers =
        singleBranch.value.website !== companyHq.value.website;
      const phoneDiffers = singleBranch.value.phone !== companyHq.value.phone;
      const emailDiffers = singleBranch.value.email !== companyHq.value.email;
      const departmentDiffers = !compareDepartmentIds(
        singleBranch.value.department_ids || [],
        hqDepartmentIds
      );

      if (websiteDiffers || phoneDiffers || emailDiffers || departmentDiffers) {
        singleBranch.value.use_hq_business_profile = false;
      }
    }
  },
  { deep: true }
);

// Watch for use_hq_business_profile switch in editing branch
watch(
  () => editingBranch.value.use_hq_business_profile,
  (newValue) => {
    if (newValue && companyHq.value) {
      // Fill form with headquarters data
      editingBranch.value.website = companyHq.value.website;
      editingBranch.value.phone = companyHq.value.phone;
      editingBranch.value.email = companyHq.value.email;
      editingBranch.value.department_ids = companyHq.value.departments.map(
        (department) => department.id
      );
    } else if (!newValue) {
    }
  }
);

// Watch for changes in website, phone, email, or department_ids to compare with HQ (editing branch)
watch(
  () => [
    editingBranch.value.website,
    editingBranch.value.phone,
    editingBranch.value.email,
    editingBranch.value.department_ids,
  ],
  () => {
    if (editingBranch.value.use_hq_business_profile && companyHq.value) {
      // Helper function to compare department arrays
      const compareDepartmentIds = (ids1, ids2) => {
        const sorted1 = [...ids1].sort().join(",");
        const sorted2 = [...ids2].sort().join(",");
        return sorted1 === sorted2;
      };

      const hqDepartmentIds =
        companyHq.value.departments?.map((department) => department.id) || [];

      // Check if any value differs from HQ
      const websiteDiffers =
        editingBranch.value.website !== companyHq.value.website;
      const phoneDiffers = editingBranch.value.phone !== companyHq.value.phone;
      const emailDiffers = editingBranch.value.email !== companyHq.value.email;
      const departmentDiffers = !compareDepartmentIds(
        editingBranch.value.department_ids || [],
        hqDepartmentIds
      );

      if (websiteDiffers || phoneDiffers || emailDiffers || departmentDiffers) {
        editingBranch.value.use_hq_business_profile = false;
      }
    }
  },
  { deep: true }
);

watch(
  () => newMember.value.is_outside_indo,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
    if (newVal === true && oldVal === false) {
      newMember.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      newMember.value.other_country = null;
      newMember.value.other_region = null;
    }
  }
);

const form = ref(null);

const dialogConfirmation = useDialogStore();

const errorMessage = ref("");

const loadingSubmit = ref(false);
const handleSubmit = async () => {
  loadingSubmit.value = true;
  try {
    const index = me.value.wizard_state.findIndex((item) => item.id == 3);
    if (index !== -1) {
      me.value.wizard_state[index].state = 1;
    }
    me.value.last_wizard_state =
      me.value.last_wizard_state > 3 ? me.value.last_wizard_state : 4;

    await $apiFetch(`/users/${me.value.id}`, {
      method: "PATCH",
      body: {
        wizard_state: me.value.wizard_state,
        last_wizard_state: me.value.last_wizard_state,
      },
    });

    handleNext();
  } catch (error) {
    errorMessage.value = error.message || "Failed to update profile";
  } finally {
    loadingSubmit.value = false;
  }
};

const route = useRoute();
const snackbar = useSnackbarStore();
const handleNext = () => {
  if (route.query.edit) {
    snackbar.showSnackbar({
      message: "Profile updated successfully",
      color: "success",
    });

    const authRoutes = ["/admin/dashboard"];
    const previousPath = router.options.history.state.back;

    if (previousPath && authRoutes.includes(previousPath)) {
      router.back();
    } else {
      router.replace("/admin/profile");
    }
  } else {
    router.push({
      path: "/admin/profile/employer/4",
      query: route.query,
    });
  }
};

const handleBack = () => {
  if (currentView.value == "add-member") {
    currentView.value = "list-member";
    return;
  }
  if (route.query.edit) {
    router.back();
  } else {
    router.replace({
      path: "/admin/profile/employer/2",
      query: route.query,
    });
  }
};

// Fetch members data
const loadingInitial = ref(true);

// Dialog states
const showAddSingleBranchDialog = ref(false);
const showAddMultipleBranchDialog = ref(false);
const showEditBranchDialog = ref(false);
const showDeleteBranchDialog = ref(false);
const singleBranchFormValid = ref(false);
const editBranchFormValid = ref(false);
const loadingSaveSingleBranch = ref(false);
const loadingSaveMultipleBranches = ref(false);
const loadingSaveEditBranch = ref(false);
const loadingDeleteBranch = ref(false);
const isViewingBranch = ref(false);

// Form options
const branchTypes = ref([
  { label: "Headquarters", value: "headquarters" },
  { label: "Branch Office", value: "branch" },
]);

const countries = ref([
  { name: "Indonesia", code: "ID" },
  { name: "Singapore", code: "SG" },
  { name: "Malaysia", code: "MY" },
  { name: "Thailand", code: "TH" },
  { name: "Philippines", code: "PH" },
  { name: "Vietnam", code: "VN" },
]);

const availableDepartments = ref([]);

// Add Department Dialog variables
const showAddDepartmentDialog = ref(false);
const newDepartment = ref({
  dept_name: "",
  dept_code: "",
});
const loadingAddDepartment = ref(false);
const addDepartmentFormValid = ref(false);
const addDepartmentForm = ref(null);

// Function to fetch available departments
const fetchAvailableDepartments = async (companyId) => {
  try {
    const response = await $apiFetch(
      `/mst-companies/available-departments/${companyId}`
    );
    availableDepartments.value = response.items || [];
  } catch (error) {
    console.error("Error fetching available departments:", error);
    availableDepartments.value = [];
  }
};

// Parent companies data

// Branch-related methods
const handleUploadMultipleBranches = () => {
  showAddMultipleBranchDialog.value = true;
};

const handleAddSingleBranch = () => {
  resetSingleBranchForm();
  showAddSingleBranchDialog.value = true;
};

const closeAddSingleBranchDialog = () => {
  showAddSingleBranchDialog.value = false;
  resetSingleBranchForm();
};

const closeAddMultipleBranchDialog = () => {
  showAddMultipleBranchDialog.value = false;
  multipleBranchFile.value = null;
};

const resetSingleBranchForm = () => {
  delete singleBranch.value.id;
  Object.assign(singleBranch.value, {
    branch: null,
    parent_id: companyHqID.value,
    country_id: null,
    is_outside_indo: false,
    other_country: null,
    region_id: null,
    other_region: null,
    location: null,
    tax_identification_number: null,
    sameAsBusinessProfile: false,
    website: null,
    phone: null,
    departments: [],
  });
};

const singleBranchForm = ref(null);
const editBranchForm = ref(null);

const saveSingleBranch = async () => {
  const { valid, errors } = await singleBranchForm.value.validate();
  if (!valid) {
    let messages = "";
    errors.forEach((error) => {
      messages += JSON.stringify(error.errorMessages) + "\n";
    });
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: messages,
      color: "error",
    });
    return;
  }

  loadingSaveSingleBranch.value = true;
  try {
    // Prepare branch data for API call
    const body = singleBranch.value;

    // API call to create branch
    const response = await $apiFetch("/mst-companies", {
      method: "POST",
      body,
    });

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Branch added successfully",
      color: "success",
    });

    closeAddSingleBranchDialog();

    // Refresh branches list
    fetchBranches();
  } catch (error) {
    console.error("Error saving single branch:", error);
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Failed to add branch",
      color: "error",
    });
  } finally {
    loadingSaveSingleBranch.value = false;
  }
};

const saveMultipleBranches = async () => {
  if (!multipleBranchFile.value) return;

  loadingSaveMultipleBranches.value = true;
  try {
    // TODO: Implement API call to upload and process multiple branches
    console.log("Uploading multiple branches file:", multipleBranchFile.value);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Branches uploaded successfully",
      color: "success",
    });

    closeAddMultipleBranchDialog();

    // Refresh branches list
    if (me.value.roles[0]?.assignment?.company_id) {
      fetchBranches(me.value.roles[0]?.assignment?.company_id);
    }
  } catch (error) {
    console.error("Error uploading multiple branches:", error);
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Failed to upload branches",
      color: "error",
    });
  } finally {
    loadingSaveMultipleBranches.value = false;
  }
};

const downloadTemplate = () => {
  // TODO: Implement template download functionality
  console.log("Downloading template...");
  // For now, just show a message
  const snackbar = useSnackbarStore();
  snackbar.showSnackbar({
    message: "Template download will be implemented",
    color: "info",
  });
};

const handleFileUpload = (file) => {
  if (file && file.length > 0) {
    multipleBranchFile.value = file[0];
  }
};

const handleSearch = () => {
  page.value = 1; // Reset to first page when searching
  fetchBranches(companyHqID.value);
};

const handleReset = () => {
  searchKeyword.value = "";
  selectedDepartment.value = "All";
  searchBy.value = "branch";
  page.value = 1;
  fetchBranches(companyHqID.value);
};

// Computed property for filtered branches - filtering is now handled by backend
const filteredBranches = computed(() => {
  return branches.value.map((item, index) => ({
    ...item,
    no: (page.value - 1) * itemsPerPage.value + index + 1,
    branch: item.display_name || item.branch || "Headquarters",
  }));
});

// Table update handler
const handleTableUpdate = (options) => {
  page.value = options.page;
  itemsPerPage.value = options.itemsPerPage;
  sortBy.value = options.sortBy;
  // The filteredBranches computed property will automatically update
};

const editBranch = (branch) => {
  // Check if user can edit this specific branch
  if (!canEditBranch(branch.id)) {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "You don't have permission to edit this branch",
      color: "error",
    });
    return;
  }

  if (branch.display_name === "Headquarters") {
    router.push({
      path: "/admin/profile/employer/1",
      query: route.query,
    });
    return;
  }

  isViewingBranch.value = false;
  // Populate the editing branch form with current branch data
  Object.assign(editingBranch.value, branch, {
    branch_type:
      branch.branch && branch.branch !== "Headquarters"
        ? "branch"
        : "headquarters",
    department_ids: branch.departments.map((department) => department.id),
  });

  // Load country data if country_id exists
  if (branch.country_id) {
    fetch("country", branch.country_id, "id", "mst-country");
  }
  // Load region data if region_id exists and not outside Indonesia
  if (branch.region_id && !branch.is_outside_indo) {
    fetchRegions(branch.region_id, "id");
  }
  delete editingBranch.value.departments;
  showEditBranchDialog.value = true;
};

const viewBranch = (branch) => {
  isViewingBranch.value = true;
  // Populate the editing branch form with current branch data
  Object.assign(editingBranch.value, branch, {
    branch_type:
      branch.branch && branch.branch !== "Headquarters"
        ? "branch"
        : "headquarters",
    department_ids: branch.departments.map((department) => department.id),
  });

  // Load country data if country_id exists
  if (branch.country_id) {
    fetch("country", branch.country_id, "id", "mst-country");
  }
  // Load region data if region_id exists and not outside Indonesia
  if (branch.region_id && !branch.is_outside_indo) {
    fetchRegions(branch.region_id, "id");
  }
  delete editingBranch.value.departments;
  showEditBranchDialog.value = true;
};

const deleteBranch = (branch) => {
  // Check if user can delete this specific branch
  if (!canDeleteBranch(branch.id, branch.branch)) {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "You don't have permission to delete this branch",
      color: "error",
    });
    return;
  }

  branchToDelete.value = branch;
  showDeleteBranchDialog.value = true;
};

// Edit branch dialog methods
const closeEditBranchDialog = () => {
  showEditBranchDialog.value = false;
  isViewingBranch.value = false;
  resetEditBranchForm();
};

const resetEditBranchForm = () => {
  Object.assign(editingBranch.value, {
    id: null,
    branch_type: null,
    company_name: null,
    branch: null,
    parent_id: null,
    country: null,
    location: null,
    tax_identification_number: null,
    use_hq_business_profile: false,
    website: null,
    phone: null,
    department_ids: [],
  });
};

const saveEditBranch = async () => {
  const { valid, errors } = await editBranchForm.value.validate();
  if (!valid) {
    let messages = "";
    errors.forEach((error) => {
      messages += JSON.stringify(error.errorMessages) + "\n";
    });
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: messages,
      color: "error",
    });
    return;
  }

  loadingSaveEditBranch.value = true;
  try {
    // Prepare branch data for API call
    const body = {
      ...editingBranch.value,
      id: undefined, // Remove id from body as it's in the URL
    };

    // API call to update branch
    const response = await $apiFetch(
      `/mst-companies/${editingBranch.value.id}`,
      {
        method: "PATCH",
        body,
      }
    );

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Branch updated successfully",
      color: "success",
    });

    closeEditBranchDialog();

    // Refresh branches list
    fetchBranches();
  } catch (error) {
    console.error("Error updating branch:", error.response);
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message:
        "Failed to update branch. " +
        JSON.stringify(error.response?._data?.message),
      color: "error",
    });
  } finally {
    loadingSaveEditBranch.value = false;
  }
};

// Delete branch dialog methods
const closeDeleteBranchDialog = () => {
  showDeleteBranchDialog.value = false;
  branchToDelete.value = null;
};

const confirmDeleteBranch = async () => {
  if (!branchToDelete.value) return;

  loadingDeleteBranch.value = true;
  try {
    // API call to delete branch
    await $apiFetch(`/mst-companies/${branchToDelete.value.id}`, {
      method: "DELETE",
    });

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Branch deleted successfully",
      color: "success",
    });

    closeDeleteBranchDialog();

    // Refresh branches list
    if (me.value.roles[0]?.assignment?.company_id) {
      fetchBranches(me.value.roles[0]?.assignment?.company_id);
    }
  } catch (error) {
    console.error("Error deleting branch:", error);
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Failed to delete branch",
      color: "error",
    });
  } finally {
    loadingDeleteBranch.value = false;
  }
};

// Add Department Dialog Methods
const closeAddDepartmentDialog = () => {
  showAddDepartmentDialog.value = false;
  resetNewDepartmentForm();
};

const resetNewDepartmentForm = () => {
  newDepartment.value = {
    dept_name: "",
    dept_code: "",
  };
  if (addDepartmentForm.value) {
    addDepartmentForm.value.reset();
  }
};

const saveNewDepartment = async () => {
  const { valid, errors } = await addDepartmentForm.value.validate();
  if (!valid) {
    let messages = "";
    errors.forEach((error) => {
      messages += JSON.stringify(error.errorMessages) + "\n";
    });
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: messages,
      color: "error",
    });
    return;
  }

  loadingAddDepartment.value = true;
  try {
    // Prepare department data for API call
    const departmentData = {
      ...newDepartment.value,
      companyHqId: me.value.roles[0]?.assignment?.company_hq_id,
      flag: "PRIVATE", // Company-specific department
    };

    // API call to create department
    const response = await $apiFetch("/mst-departments", {
      method: "POST",
      body: departmentData,
    });

    // Add the new department to the available departments list
    availableDepartments.value = [...availableDepartments.value, response];

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Department added successfully",
      color: "success",
    });

    closeAddDepartmentDialog();
  } catch (error) {
    console.error("Error creating department:", error);
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Failed to add department",
      color: "error",
    });
  } finally {
    loadingAddDepartment.value = false;
  }
};

// Watch for pagination changes
// Watch for pagination and sorting changes
watch(
  [page, itemsPerPage, sortBy],
  () => {
    if (companyHqID.value) {
      fetchBranches(companyHqID.value);
    }
  },
  { deep: true }
);

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }

  if (me.value.roles[0]?.assignment?.company_hq_id || me.value.company_id) {
    companyHqID.value = me.value.company_hq_id || me.value.company_id;
    fetchBranches(companyHqID.value);
    await fetchAvailableDepartments(companyHqID.value);
  }

  // Load initial country list
  try {
    const countryData = await $apiFetch(`/mst-country/search`, {
      params: {
        filters: {},
        limit: 50,
      },
    });
    models.value["country"].items = countryData.items || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
  }
});
</script>

<style scoped>
.member-item:last-child .v-divider {
  display: none;
}

.member-item :deep(.v-btn) {
  text-transform: none;
  letter-spacing: normal;
  font-size: 14px;
  height: 36px;
  min-width: 50px;
  padding: 0;
}

.member-item :deep(.v-btn--variant-text) {
  opacity: 1;
}

/* Specific color for Edit button */
.member-item :deep(.v-btn--variant-text.text-orange-700) {
  color: #f57c00;
}

/* Specific color for Delete button */
.member-item :deep(.v-btn--variant-text.text-red) {
  color: #dc3545;
}

/* Upload area styling */
.upload-area :deep(.v-field) {
  border: 2px dashed #ccc;
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.upload-area :deep(.v-field:hover) {
  border-color: #1976d2;
  background-color: #f5f5f5;
}

.upload-area :deep(.v-field__input) {
  text-align: center;
  padding: 20px;
}

.upload-area :deep(.v-field__prepend-inner) {
  margin-right: 12px;
}
</style>
