<template>
  <v-container class="pa-2">
    <v-card rounded="xl" elevation="0" class="pa-2">
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <div class="d-flex justify-space-between align-start mb-4">
              <div>
                <h2 class="mb-2">Team Management</h2>
                <p class="text-grey mb-0">
                  Add, edit, and manage your team members information and roles.
                  You can invite new staff and update existing member details
                  anytime.
                </p>
              </div>
              <v-btn
                v-if="canInviteMember"
                color="primary"
                variant="outlined"
                class="font-weight-bold mt-4"
                height="40"
                rounded="lg"
                @click="openAddMemberDialog"
              >
                INVITE NEW MEMBER
                <template v-slot:prepend>
                  <v-icon>mdi-plus</v-icon>
                </template>
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12">
            <!-- Team Management View -->
            <!-- Search and Filter Section -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-row>
                  <v-col cols="12" md="12" lg="5">
                    <div class="text-grey mb-1">Search by</div>
                    <v-text-field
                      v-model="searchKeyword"
                      placeholder="Type your keywords here"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                    >
                      <template v-slot:prepend>
                        <v-select
                          v-model="searchBy"
                          :items="searchOptions"
                          item-title="label"
                          item-value="value"
                          placeholder="Name"
                          hide-details
                          variant="outlined"
                          min-width="120"
                          rounded="lg"
                          density="comfortable"
                        >
                        </v-select>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" md="12" lg="7">
                    <v-row>
                      <v-col cols="12" md="4">
                        <div class="text-grey mb-1">Branch</div>

                        <v-select
                          v-model="selectedBranch"
                          :items="branchFilterOptions"
                          item-title="label"
                          item-value="value"
                          variant="outlined"
                          density="comfortable"
                          rounded="lg"
                          placeholder="Branch"
                          clearable
                        />
                      </v-col>
                      <v-col cols="12" md="4">
                        <div class="text-grey mb-1">Role</div>
                        <v-select
                          v-model="selectedRole"
                          :items="roleFilterOptions"
                          item-title="label"
                          item-value="value"
                          variant="outlined"
                          density="comfortable"
                          rounded="lg"
                          placeholder="Role"
                          clearable
                        />
                      </v-col>
                      <v-col cols="6" md="2">
                        <v-btn
                          color="primary"
                          variant="outlined"
                          block
                          rounded="lg"
                          size="large"
                          class="mt-6"
                          @click="handleSearch"
                        >
                          Search
                        </v-btn>
                      </v-col>
                      <v-col cols="6" md="2">
                        <v-btn
                          color="grey-darken-2"
                          variant="text"
                          @click="handleReset"
                          size="large"
                          rounded="lg"
                          block
                          class="mt-6"
                        >
                          Reset
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <!-- Team Members Table -->
            <v-row class="mt-4">
              <v-col cols="12">
                <v-data-table-server
                  class="blue-lighten-5 rounded-lg border"
                  v-model:items-per-page="itemsPerPage"
                  v-model:page="page"
                  :headers="tableHeaders"
                  :items="filteredMembers"
                  :items-length="totalItems"
                  :loading="loadingInitial"
                  :search="searchKeyword"
                  :sort-by="sortBy"
                  multi-sort
                  @update:options="handleTableUpdate"
                >
                  <template v-slot:item.full_name="{ item }">
                    <div class="d-flex align-center">
                      <v-avatar size="32" class="mr-3" color="primary">
                        <v-img
                          v-if="item.photo_url"
                          :src="`${
                            item.photo_url.includes('http') ? '' : BASE_URL
                          }${item.photo_url}`"
                          :alt="item.full_name"
                        ></v-img>
                        <span v-else class="text-white">
                          {{ getInitials(item.full_name || "-") }}
                        </span>
                      </v-avatar>
                      <div>
                        <span class="font-weight-bold">{{
                          item.full_name || "-"
                        }}</span
                        ><br />
                        <span style="font-size: 12px">{{
                          item.email || "-"
                        }}</span>
                      </div>
                    </div>
                  </template>

                  <template v-slot:item.branch="{ item }">
                    {{ capitalizeWords(item.branch || "Headquarters") }}
                  </template>

                  <template v-slot:item.department="{ item }">
                    {{ capitalizeWords(item.department || "-") }}
                  </template>

                  <template v-slot:item.profession_name="{ item }">
                    {{ capitalizeWords(item.profession_name || "-") }}
                  </template>

                  <template v-slot:item.company_role="{ item }">
                    <div>
                      <span class="font-weight-medium">{{
                        item.company_role
                          ? capitalizeWords(item.company_role)
                          : "-"
                      }}</span>
                      <div
                        v-if="
                          item.company_role === 'owner_hq' &&
                          canEditTeamMgmt &&
                          isOwnerHq
                        "
                        class="d-flex align-center mt-1"
                      >
                        <v-icon size="22" class="mr-1" color="primary"
                          >mdi-account-switch</v-icon
                        >
                        <a
                          href="#"
                          @click.prevent="openTransferOwnershipDialog(item)"
                          class="text-primary text-decoration-none text-caption"
                          style="line-height: 13px"
                        >
                          Transfer Ownership
                        </a>
                      </div>
                    </div>
                  </template>

                  <template v-slot:item.status="{ item }">
                    <v-chip
                      :color="item.status === 'active' ? 'primary' : 'error'"
                      :text="capitalizeFirstLetter(item.status || 'inactive')"
                      size="small"
                      variant="flat"
                    ></v-chip>
                  </template>

                  <template v-slot:item.actions="{ item }">
                    <div class="d-flex align-center">
                      <v-btn
                        v-if="
                          canEditMember(item.company_id) &&
                          (item.company_role !== 'owner_hq' ||
                            (item.company_role === 'owner_hq' &&
                              me.id === item.user_id))
                        "
                        icon="mdi-pencil"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="editMember(item)"
                      />
                      <v-btn
                        v-if="
                          canEditMember(item.company_id) &&
                          item.company_role !== 'owner_hq' &&
                          item.user_id !== me.id
                        "
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="
                          () => {
                            showDeleteDialog = true;
                            selectedMember = item;
                          }
                        "
                      />
                      <v-btn
                        v-if="
                          !canEditMember(item.company_id) && canViewTeamMgmt
                        "
                        icon="mdi-eye"
                        size="small"
                        variant="text"
                        color="primary"
                        @click="viewTeamMgmt(item)"
                      />
                    </div>
                  </template>
                </v-data-table-server>
              </v-col>
            </v-row>

            <!-- Delete Confirmation Dialog -->
            <v-dialog v-model="showDeleteDialog" max-width="400">
              <v-card rounded="xl" elevation="0">
                <v-card-text class="text-center pt-4">
                  <h3>Delete Confirmation</h3>
                  <p class="mt-2 mb-3">
                    Are you sure you want to delete this member from your team?
                  </p>
                </v-card-text>
                <v-card-actions class="justify-center pb-4">
                  <v-btn
                    variant="outlined"
                    color="primary"
                    class="mr-2"
                    rounded="lg"
                    @click="showDeleteDialog = false"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    rounded="lg"
                    class="px-3"
                    @click="removeMember(selectedMember)"
                    :loading="loadingDelete === selectedMember?.id"
                  >
                    Yes, I'm Sure
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Transfer Ownership Dialog - Step 1: Select New Owner -->
            <v-dialog
              v-model="showTransferOwnershipDialog"
              max-width="700"
              persistent
            >
              <v-card rounded="xl" elevation="0">
                <v-card-title
                  class="d-flex justify-space-between align-center pa-6"
                >
                  <h3 class="font-weight-bold">Transfer Ownership</h3>
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    @click="closeTransferOwnershipDialog"
                  ></v-btn>
                </v-card-title>

                <v-card-text class="pa-6 pt-0">
                  <p class="text-grey-darken-2 mb-2">
                    By transferring ownership, new owner is granted full owner
                    permissions while the previous owner is demoted to a
                    standard member role.
                  </p>
                  <p class="text-grey-darken-2 mb-8">
                    This action is permanent and cannot be undone.
                  </p>

                  <div class="mb-4">
                    <div class="text-grey-darken-2 text-caption mb-1">
                      Select a New Owner
                    </div>
                    <v-autocomplete
                      v-model="selectedNewOwner"
                      :items="availableNewOwners"
                      item-title="label"
                      item-value="user_id"
                      placeholder="Search by name or email"
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      :loading="loadingNewOwners"
                      hide-details
                      @update:search="handleNewOwnerSearch"
                      return-object
                    >
                      <template v-slot:prepend-inner>
                        <v-icon>mdi-magnify</v-icon>
                      </template>
                      <template v-slot:item="{ props, item }">
                        <v-list-item
                          v-bind="props"
                          :title="item.raw.full_name"
                          :subtitle="item.raw.email"
                        >
                          <template v-slot:prepend>
                            <v-avatar size="32" color="primary">
                              <v-img
                                v-if="item.raw.photo_url"
                                :src="`${
                                  item.raw.photo_url.includes('http')
                                    ? ''
                                    : BASE_URL
                                }${item.raw.photo_url}`"
                                :alt="item.raw.full_name"
                              ></v-img>
                              <span v-else class="text-white">
                                {{ getInitials(item.raw.full_name) }}
                              </span>
                            </v-avatar>
                          </template>
                        </v-list-item>
                      </template>
                      <template v-slot:no-data>
                        <v-list-item>
                          <v-list-item-title class="text-grey">
                            {{
                              newOwnerSearchTerm
                                ? "No members found"
                                : "Type to search members"
                            }}
                          </v-list-item-title>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                  </div>
                </v-card-text>

                <v-card-actions class="pa-6 pt-0">
                  <v-spacer />
                  <v-btn
                    variant="outlined"
                    color="primary"
                    rounded="lg"
                    @click="closeTransferOwnershipDialog"
                    class="mr-3"
                    min-width="150"
                    height="40"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    rounded="lg"
                    @click="proceedToConfirmation"
                    :disabled="!selectedNewOwner"
                    min-width="200"
                    height="40"
                  >
                    Transfer Ownership
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Transfer Ownership Dialog - Step 2: Confirmation & Placement Update -->
            <v-dialog
              v-model="showTransferConfirmationDialog"
              max-width="600"
              persistent
              scrollable
            >
              <v-card rounded="xl" elevation="0">
                <v-card-title
                  class="d-flex justify-space-between align-center pa-6"
                >
                  <h4 class="font-weight-bold">
                    Are you sure you want to transfer ownership?
                  </h4>
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    @click="closeTransferConfirmationDialog"
                  ></v-btn>
                </v-card-title>

                <v-card-text
                  class="pa-6 pt-0"
                  style="max-height: 600px; font-size: 14px"
                >
                  <!-- Warning Message -->

                  <p class="text-grey-darken-1 mb-4">
                    Moving ownership means you will give full access of your
                    company profile and your account will become a member.
                  </p>
                  <p class="text-grey-darken-1 mb-5">
                    This action is permanent and cannot be undone.
                  </p>

                  <!-- New Owner Info -->
                  <div class="mb-6">
                    <h4 class="mb-3">Transferring ownership to</h4>
                    <div class="d-flex align-center">
                      <v-avatar
                        size="60"
                        rounded="lg"
                        class="mr-4"
                        color="primary"
                      >
                        <v-img
                          v-if="selectedNewOwnerData?.photo_url"
                          :src="`${
                            selectedNewOwnerData.photo_url.includes('http')
                              ? ''
                              : BASE_URL
                          }${selectedNewOwnerData.photo_url}`"
                          :alt="selectedNewOwnerData.full_name"
                        ></v-img>
                        <span v-else class="text-white text-h5">
                          {{ getInitials(selectedNewOwnerData?.full_name) }}
                        </span>
                      </v-avatar>
                      <div>
                        <h4 class="mb-1">
                          {{ selectedNewOwnerData?.full_name }}
                        </h4>
                        <div
                          class="d-flex align-center text-caption text-grey-darken-1 mb-1"
                        >
                          <v-icon size="14" class="mr-1">mdi-phone</v-icon>
                          {{ selectedNewOwnerData?.encrypted_phone || "-" }}
                        </div>
                        <div
                          class="d-flex align-center text-caption text-grey-darken-1"
                        >
                          <v-icon size="14" class="mr-1">mdi-email</v-icon>
                          {{ selectedNewOwnerData?.email }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Placement Update Form -->
                  <div class="mb-4">
                    <h4 class="mb-3">Input your updated placement</h4>
                    <v-form ref="placementForm">
                      <v-row>
                        <v-col cols="12">
                          <div class="text-grey-darken-2 text-caption mb-1">
                            Placement Branch *
                          </div>
                          <v-select
                            v-model="currentOwnerPlacement.company_id"
                            :items="branchOptions"
                            item-title="display_name"
                            item-value="id"
                            placeholder="Choose branch"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :rules="[
                              (v) => !!v || 'Placement branch is required',
                            ]"
                          ></v-select>

                          <div class="text-grey-darken-2 text-caption mb-1">
                            Role *
                          </div>
                          <v-select
                            v-model="currentOwnerPlacement.company_role"
                            :items="
                              getFilteredNonOwnerRoles(
                                currentOwnerPlacement.company_id
                              )
                            "
                            item-title="label"
                            item-value="name"
                            placeholder="Member"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :rules="[(v) => !!v || 'Role is required']"
                          ></v-select>

                          <div class="text-grey-darken-2 text-caption mb-1">
                            Employment Type *
                          </div>
                          <v-select
                            v-model="currentOwnerPlacement.employment_type"
                            :items="employmentTypeOptions"
                            item-title="label"
                            item-value="value"
                            placeholder="Choose employment type"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :rules="[
                              (v) => !!v || 'Employment type is required',
                            ]"
                          ></v-select>

                          <div class="text-grey-darken-2 text-caption mb-1">
                            Department *
                          </div>
                          <v-select
                            v-model="currentOwnerPlacement.dept_id"
                            :items="
                              getDepartmentsForBranch(
                                currentOwnerPlacement.company_id
                              )
                            "
                            item-title="dept_name"
                            item-value="id"
                            placeholder="Choose department"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :rules="[(v) => !!v || 'Department is required']"
                          ></v-select>

                          <div class="text-grey-darken-2 text-caption mb-1">
                            Job Title *
                          </div>
                          <v-autocomplete
                            v-model="currentOwnerPlacement.profession_id"
                            :items="models.profession.items"
                            item-title="name"
                            item-value="id"
                            placeholder="Insert 3 characters or more to show options"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :rules="[(v) => !!v || 'Job title is required']"
                            @update:search="handlePlacementProfessionInput"
                            :loading="models.profession.loading"
                            hide-no-data
                          ></v-autocomplete>
                        </v-col>
                      </v-row>
                    </v-form>
                  </div>
                </v-card-text>

                <v-card-actions class="pa-6 pt-0">
                  <v-spacer />
                  <v-btn
                    variant="outlined"
                    color="primary"
                    rounded="lg"
                    @click="closeTransferConfirmationDialog"
                    class="mr-3"
                    min-width="150"
                    height="40"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    color="primary"
                    variant="elevated"
                    rounded="lg"
                    @click="confirmFinalTransfer"
                    :loading="loadingTransfer"
                    min-width="200"
                    height="40"
                  >
                    Confirm Transfer
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- Add/Edit Team Member Modal -->
            <v-dialog
              v-model="showAddMemberDialog"
              max-width="800"
              persistent
              scrollable
            >
              <v-card rounded="xl" elevation="0">
                <v-card-title
                  class="d-flex justify-space-between align-center pa-6 pb-4"
                >
                  <h3 class="font-weight-bold">
                    {{
                      isViewing
                        ? "View Team Member"
                        : isEditing
                        ? "Edit Team Member"
                        : "Add Team Member"
                    }}
                  </h3>
                  <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    @click="closeAddMemberDialog"
                  ></v-btn>
                </v-card-title>

                <v-card-text class="pa-6 pt-0">
                  <v-form @submit.prevent="handleAddMember" ref="form">
                    <!-- Personal Details Section -->
                    <div class="mb-6">
                      <h4 class="font-weight-bold mb-4">Personal Detail</h4>

                      <!-- Avatar Upload -->
                      <div class="d-flex align-center mb-4">
                        <v-avatar
                          size="80"
                          class="mr-4 bg-grey-darken-2"
                          rounded="lg"
                        >
                          <v-img
                            v-if="newMember.photo_url"
                            :src="`${
                              newMember.photo_url.includes('http')
                                ? ''
                                : BASE_URL
                            }${newMember.photo_url}`"
                            :alt="newMember.full_name"
                          ></v-img>
                          <v-icon v-else size="60" color="white"
                            >mdi-account</v-icon
                          >
                          <v-progress-circular
                            v-if="loadingAvatar"
                            indeterminate
                            color="blue"
                            style="
                              position: absolute;
                              top: 50%;
                              left: 50%;
                              transform: translate(-50%, -50%);
                            "
                          ></v-progress-circular>
                        </v-avatar>
                        <div>
                          <v-btn
                            v-if="!isViewing"
                            color="primary"
                            variant="outlined"
                            size="small"
                            rounded="lg"
                            @click="triggerAvatarUpload"
                            :loading="loadingAvatar"
                          >
                            Upload Photo
                          </v-btn>
                          <input
                            type="file"
                            ref="avatarInput"
                            accept="image/*"
                            style="display: none"
                            @change="handleAvatarUpload"
                          />
                          <div class="text-caption text-grey mt-1">
                            Size recommendation: 400 x 400px
                          </div>
                          <div class="text-caption text-grey">
                            Last Update
                            {{
                              new Date().toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            }},
                            {{
                              new Date().toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            }}
                          </div>
                        </div>
                      </div>

                      <v-row>
                        <v-col cols="12" md="6" class="py-0">
                          <div class="mb-1 text-grey-darken-2">
                            <small>Full Name *</small>
                          </div>
                          <v-text-field
                            v-model="newMember.full_name"
                            placeholder="Input your full name"
                            variant="outlined"
                            density="comfortable"
                            rounded="lg"
                            :error-messages="errors.full_name"
                            :rules="[(v) => !!v || 'Full name is required']"
                            :readonly="isViewing"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6" class="py-0">
                          <div class="mb-1 text-grey-darken-2">
                            <small>Gender</small>
                          </div>
                          <v-select
                            v-model="newMember.gender"
                            :items="genders"
                            placeholder="Choose gender"
                            item-title="label"
                            item-value="name"
                            variant="outlined"
                            density="comfortable"
                            :error-messages="errors.gender"
                            rounded="lg"
                            :readonly="isViewing"
                          ></v-select>
                        </v-col>
                        <v-col cols="12" md="6" class="py-0">
                          <div class="mb-1 text-grey-darken-2">
                            <small>Date of Birth</small>
                          </div>
                          <v-text-date
                            v-model="newMember.encrypted_date_of_birth"
                            placeholder="Click to show calendar"
                            variant="outlined"
                            density="comfortable"
                            :error-messages="errors.birth_date"
                            rounded="lg"
                            :max="maxDate"
                            :rules="[
                              (v) => {
                                if (!v) return true;
                                return (
                                  v <= maxDate ||
                                  'Date of birth cannot be in the future'
                                );
                              },
                            ]"
                            :readonly="isViewing"
                          ></v-text-date>
                        </v-col>
                        <v-col cols="12" md="6" class="py-0">
                          <div class="mb-1 text-grey-darken-2">
                            <small>Email *</small>
                          </div>
                          <v-text-field
                            v-model="newMember.email"
                            placeholder="me@useremail.com"
                            variant="outlined"
                            density="comfortable"
                            :error-messages="errors.email"
                            rounded="lg"
                            :rules="[
                              (v) => !!v || 'Email is required',
                              (v) =>
                                /.+@.+\..+/.test(v) || 'Email must be valid',
                            ]"
                            :disabled="isEditing || isViewing"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6" class="py-0">
                          <div class="mb-1 text-grey-darken-2">
                            <small>Phone Number *</small>
                          </div>
                          <v-phone-field
                            v-model="newMember.encrypted_phone"
                            :error-messages="errors.phone"
                            default-country="ID"
                            type="tel"
                            variant="outlined"
                            density="comfortable"
                            placeholder="Input phone number"
                            :rules="[
                              (v) => !!v || 'Phone number is required',
                              (v) =>
                                /^[0-9]{1,}$/.test(v) ||
                                'Phone must be numbers only',
                            ]"
                            :isSignup="false"
                            :readonly="isViewing"
                          />
                        </v-col>
                      </v-row>

                      <!-- Location and Address Section -->
                      <div class="mb-6">
                        <!-- Outside Indonesia Toggle -->
                        <div class="mb-4">
                          <v-switch
                            v-model="newMember.is_outside_indo"
                            label="Outside Indonesia?"
                            color="primary"
                            density="comfortable"
                            rounded="lg"
                            hide-details
                            :readonly="isViewing"
                          />
                        </div>

                        <!-- Indonesia Location Fields -->
                        <template v-if="!newMember.is_outside_indo">
                          <v-row>
                            <v-col cols="12" md="6" class="py-0">
                              <div class="mb-1 text-grey-darken-2">
                                <small>City *</small>
                              </div>
                              <v-autocomplete
                                v-model="newMember.region_id"
                                variant="outlined"
                                density="comfortable"
                                placeholder="Insert 3 characters or more to search"
                                :items="regions"
                                item-title="name"
                                item-value="id"
                                :loading="regionLoading"
                                :search-input.sync="citySearch"
                                @update:search="searchCities"
                                :rules="[(v) => !!v || 'City is required']"
                                rounded="lg"
                                :readonly="isViewing"
                              />
                            </v-col>
                            <v-col cols="12" md="6" class="py-0">
                              <div class="mb-1 text-grey-darken-2">
                                <small>Postal Code</small>
                              </div>
                              <v-text-field
                                v-model="newMember.postal_code"
                                placeholder="Input your postal code"
                                variant="outlined"
                                density="comfortable"
                                rounded="lg"
                                :readonly="isViewing"
                              />
                            </v-col>
                          </v-row>
                        </template>

                        <!-- Outside Indonesia Location Fields -->
                        <template v-else>
                          <v-row>
                            <v-col cols="12" md="6" class="py-0">
                              <div class="mb-1 text-grey-darken-2">
                                <small>Country *</small>
                              </div>
                              <v-text-field
                                v-model="newMember.other_country"
                                variant="outlined"
                                density="comfortable"
                                placeholder="Input country"
                                rounded="lg"
                                :rules="[(v) => !!v || 'Country is required']"
                                :readonly="isViewing"
                              />
                            </v-col>
                            <v-col cols="12" md="6" class="py-0">
                              <div class="mb-1 text-grey-darken-2">
                                <small>City *</small>
                              </div>
                              <v-text-field
                                v-model="newMember.other_region"
                                variant="outlined"
                                density="comfortable"
                                placeholder="Input city"
                                rounded="lg"
                                :rules="[(v) => !!v || 'City is required']"
                                :readonly="isViewing"
                              />
                            </v-col>
                          </v-row>
                        </template>

                        <!-- Address Field -->
                        <v-row>
                          <v-col cols="12" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Address</small>
                            </div>
                            <v-textarea
                              v-model="newMember.encrypted_address"
                              placeholder="Please state your address (optional)"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              rows="3"
                              :readonly="isViewing"
                            />
                          </v-col>
                        </v-row>
                      </div>
                    </div>

                    <!-- Team Role Section -->
                    <div class="mb-6">
                      <h4 class="font-weight-bold mb-4">Team Role</h4>

                      <!-- Dynamic Role Entries -->
                      <div
                        v-for="(role, index) in teamRoles"
                        :key="index"
                        class="mb-4 pa-4 rounded-lg"
                        style="border: 1px solid #aaa"
                      >
                        <div
                          class="d-flex justify-space-between align-center mb-3"
                        >
                          <h5 class="font-weight-medium">
                            Role {{ index + 1 }}
                          </h5>
                        </div>

                        <v-row>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Placement Branch *</small>
                            </div>
                            <v-select
                              v-model="role.company_id"
                              :items="getFilteredBranchOptions()"
                              placeholder="Choose branch"
                              item-title="display_name"
                              item-value="id"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :rules="[
                                (v) => !!v || 'Placement branch is required',
                              ]"
                              :readonly="isViewing || isBranchDisabled()"
                              :disabled="
                                isBranchDisabled() ||
                                (isEditing && me.id == newMember.user_id)
                              "
                            ></v-select>
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Role *</small>
                            </div>
                            <v-select
                              v-model="role.company_role"
                              :items="getFilteredRoles(role.company_id)"
                              placeholder="Choose role"
                              item-title="label"
                              item-value="name"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :rules="[(v) => !!v || 'Role is required']"
                              :readonly="isViewing || isEditingSelf"
                              :disabled="isEditingSelf"
                            ></v-select>
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Department *</small>
                            </div>
                            <v-select
                              v-model="role.dept_id"
                              :items="getDepartmentsForBranch(role.company_id)"
                              placeholder="Choose department"
                              item-title="dept_name"
                              item-value="id"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :rules="[(v) => !!v || 'Department is required']"
                              :readonly="isViewing || isDepartmentDisabled()"
                              :disabled="isDepartmentDisabled()"
                            ></v-select>
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Job Title *</small>
                            </div>
                            <v-autocomplete
                              v-model="role.profession_id"
                              :items="models.profession.items"
                              item-title="name"
                              item-value="id"
                              variant="outlined"
                              density="comfortable"
                              placeholder="Insert 3 characters or more to show options"
                              :rules="[(v) => !!v || 'Job title is required']"
                              @update:search="
                                handleProfessionInput($event, role)
                              "
                              rounded="lg"
                              hide-no-data
                              :loading="models.profession.loading"
                              @update:model-value="
                                handleProfessionChange($event, role)
                              "
                              :readonly="isViewing"
                            />
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Employment Type *</small>
                            </div>
                            <v-select
                              v-model="role.employment_type"
                              :items="employmentTypeOptions"
                              placeholder="Choose employment type"
                              item-title="label"
                              item-value="value"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :rules="[
                                (v) => !!v || 'Employment type is required',
                              ]"
                              :readonly="isViewing"
                            ></v-select>
                          </v-col>

                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Start Date</small>
                            </div>
                            <v-text-date
                              v-model="role.start_date"
                              placeholder="Start of employment"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              @update:model-value="() => validateDates(role)"
                              :readonly="isViewing"
                            ></v-text-date>
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>End Date</small>
                            </div>
                            <v-text-date
                              v-model="role.end_date"
                              placeholder="End of employment"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :disabled="role.currently_here || isViewing"
                              :rules="[
                                (v) =>
                                  validateEndDate(
                                    v,
                                    role.start_date,
                                    role.currently_here
                                  ),
                              ]"
                            ></v-text-date>
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="d-flex align-center">
                              <v-switch
                                v-model="role.currently_here"
                                label="Currently Here"
                                color="primary"
                                hide-details
                                rounded="lg"
                                class="mr-4"
                                @update:model-value="
                                  (value) =>
                                    handleCurrentlyHereChange(value, role)
                                "
                                :readonly="isViewing"
                              />
                            </div>
                          </v-col>
                          <v-col cols="12" md="6" class="py-0">
                            <div class="mb-1 text-grey-darken-2">
                              <small>Status *</small>
                            </div>
                            <v-select
                              v-model="role.status"
                              :items="statusOptions"
                              placeholder="Active / Inactive"
                              item-title="label"
                              item-value="value"
                              variant="outlined"
                              density="comfortable"
                              rounded="lg"
                              :rules="[(v) => !!v || 'Status is required']"
                              :readonly="isViewing"
                            ></v-select>
                          </v-col>
                          <v-col
                            cols="12"
                            v-if="teamRoles.length > 1 && !isViewing"
                          >
                            <v-btn
                              icon="mdi-trash-can-outline"
                              variant="text"
                              color="error"
                              @click="removeRole(index)"
                            ></v-btn>
                          </v-col>
                        </v-row>
                      </div>

                      <!-- Add Role Button -->
                      <v-btn
                        v-if="!isViewing"
                        color="primary"
                        variant="text"
                        rounded="lg"
                        @click="addRole"
                        class="mb-4"
                      >
                        <v-icon class="mr-2">mdi-plus</v-icon>
                        Add Role
                      </v-btn>
                    </div>

                    <v-alert
                      v-if="errorMessage"
                      v-model="errorMessage"
                      color="error"
                      density="compact"
                      class="mb-4"
                    >
                      {{ errorMessage }}
                    </v-alert>
                  </v-form>
                </v-card-text>

                <v-card-actions class="pa-6 pt-0">
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    variant="outlined"
                    rounded="lg"
                    @click="closeAddMemberDialog"
                    class="mr-3"
                  >
                    {{ isViewing ? "CLOSE" : "CANCEL" }}
                  </v-btn>
                  <v-btn
                    v-if="!isViewing"
                    color="primary"
                    variant="elevated"
                    rounded="lg"
                    @click="handleAddMember"
                    :loading="loadingAdd"
                  >
                    SAVE
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
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
            >
              Back
            </v-btn>

            <v-btn
              color="primary"
              variant="elevated"
              class="font-weight-bold"
              rounded="lg"
              size="large"
              @click="handleSubmit"
              :loading="loadingSubmit"
              min-width="200"
            >
              {{
                route.query.edit
                  ? "Save"
                  : me.wizard_state.find((x) => x.id == 5)
                  ? "Next"
                  : "Submit"
              }}
            </v-btn>
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

    <!-- Confirm Dialog -->
    <ConfirmDialog />
  </v-container>
</template>

<script setup>
import { limit } from "firebase/firestore";
import { useDialogStore } from "~/stores/dialog";

definePageMeta({ ssr: false, layout: "wizard-employer", middleware: ["auth"] });

const { $apiFetch } = useApi();
const router = useRouter();

// Base URL for media files
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const { me, fetchMe } = useUser();

// Permission checks
const { hasPermission, canEdit, canView } = usePermissions();
const canEditTeamMgmt = computed(() => hasPermission("perm:team_mgmt:edit"));
const canViewTeamMgmt = computed(() => hasPermission("perm:team_mgmt:view"));

// Check if logged-in user has owner_hq assignment
const isOwnerHq = computed(() => {
  if (!me.value?.roles) return false;

  // Loop through all roles to find owner_hq
  for (const role of me.value.roles) {
    if (role?.assignment?.company_role === "owner_hq") {
      return true;
    }
  }

  return false;
});

// Check if user can edit specific member
const canEditMember = (memberCompanyId) => {
  if (!canEditTeamMgmt.value) return false;

  // Get user's role assignment
  const userRole = me.value?.roles?.[0]?.assignment;
  if (!userRole) return false;

  // Member role cannot edit any member
  if (userRole.company_role === "member") {
    return false;
  }

  // If user is HQ level (owner_hq, hrd_hq, dept_head_hq), they can edit all members
  const hqRoles = ["owner_hq", "hrd_hq", "dept_head_hq"];
  if (hqRoles.includes(userRole.company_role)) {
    return true;
  }

  // If user is branch level (pic_branch, hrd_branch, dept_head_branch),
  // they can only edit members in their assigned branch
  const branchRoles = ["pic_branch", "hrd_branch", "dept_head_branch"];
  if (branchRoles.includes(userRole.company_role)) {
    // Check if the member's company_id matches user's assigned company_id
    return userRole.company_id === memberCompanyId;
  }

  return false;
};

// Check if user can delete specific member
const canDeleteMember = (memberCompanyId, memberRole) => {
  if (!canEditTeamMgmt.value) return false;

  // Can't delete owner_hq
  if (memberRole === "owner_hq") return false;

  // Get user's role assignment
  const userRole = me.value?.roles?.[0]?.assignment;
  if (!userRole) return false;

  // If user is HQ level (owner_hq, hrd_hq, dept_head_hq), they can delete members
  const hqRoles = ["owner_hq", "hrd_hq", "dept_head_hq"];
  if (hqRoles.includes(userRole.company_role)) {
    return true;
  }

  // If user is branch level, they can only delete members in their branch
  const branchRoles = ["pic_branch", "hrd_branch", "dept_head_branch"];
  if (branchRoles.includes(userRole.company_role)) {
    return userRole.company_id === memberCompanyId;
  }

  return false;
};

// Check if user can invite new member (show invite button)
const canInviteMember = computed(() => {
  if (!canEditTeamMgmt.value) return false;

  // Get user's role assignment
  const userRole = me.value?.roles?.[0]?.assignment;
  if (!userRole) return false;

  // Member role cannot invite new members
  if (userRole.company_role === "member") {
    return false;
  }

  return true;
});

const showDeleteDialog = ref(false);
const selectedMember = ref(null);
const currentView = ref("list-member");

// Transfer Ownership Dialog States
const showTransferOwnershipDialog = ref(false);
const showTransferConfirmationDialog = ref(false);
const selectedNewOwner = ref(null);
const selectedNewOwnerData = ref(null);
const loadingTransfer = ref(false);
const currentOwner = ref(null);
const loadingNewOwners = ref(false);
const placementForm = ref(null);
const newOwnerSearchTerm = ref("");
const availableNewOwners = ref([]);
let newOwnerSearchTimeout = null;

// Current Owner Placement Data (after transfer)
const currentOwnerPlacement = ref({
  company_id: null,
  company_role: null,
  employment_type: null,
  dept_id: null,
  profession_id: null,
});

// Modal dialog states
const showAddMemberDialog = ref(false);
const isEditing = ref(false);
const isViewing = ref(false);

// Search and Filter States
const searchBy = ref("name");
const searchKeyword = ref("");
const selectedBranch = ref("all");
const selectedRole = ref("all");

// Table pagination and sorting
const page = ref(1);
const itemsPerPage = ref(25);
const totalItems = ref(0);
const totalPages = ref(0);
const sortBy = ref([]);

// Search Options
const searchOptions = ref([
  { label: "Name", value: "name" },
  { label: "Email", value: "email" },
]);

// branchOptions is now dynamically loaded from API (used for form dropdown)
// branchFilterOptions is for the filter dropdown (computed from branchOptions)
const branchFilterOptions = computed(() => {
  if (branchOptions.value.length === 0) {
    return [{ label: "All", value: "all" }];
  }

  const branchSet = new Set();
  branchOptions.value.forEach((branch) => {
    const branchName = branch.branch || "Headquarters";
    if (branchName && branch.id) {
      branchSet.add(JSON.stringify({ label: branchName, value: branch.id }));
    }
  });

  return [
    { label: "All", value: "all" },
    ...Array.from(branchSet).map((item) => JSON.parse(item)),
  ];
});

const roleFilterOptions = ref([
  { label: "All", value: "all" },
  { label: "Owner HQ", value: "owner_hq" },
  { label: "HRD HQ", value: "hrd_hq" },
  { label: "Dept Head HQ", value: "dept_head_hq" },
  { label: "PIC Branch", value: "pic_branch" },
  { label: "HRD Branch", value: "hrd_branch" },
  { label: "Dept Head Branch", value: "dept_head_branch" },
  { label: "Member", value: "member" },
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
  job_title: "",
  avatar: null,
  assignments: [],
});

// Team roles array for dynamic role management
const teamRoles = ref([
  {
    user_id: null,
    company_hq_id: null,
    company_id: null,
    dept_id: null,
    company_role: null,
    start_date: null,
    end_date: null,
    status: null,
    employment_type: null,
    profession_id: null,
    job_title: "",
    currently_here: true,
  },
]);

// Additional options for the form
const departmentOptions = ref([]);
const branchOptions = ref([]);

// Location data
const citySearch = ref("");

// Profession data
const { models, debouncedFetch, fetch } = useDynamicSearch(["profession"]);

// Function to fetch available departments
const fetchAvailableDepartments = async (companyId) => {
  try {
    const response = await $apiFetch(
      `/mst-companies/available-departments/${companyId}`
    );
    departmentOptions.value = response.items || [];
  } catch (error) {
    console.error("Error fetching available departments:", error);
    departmentOptions.value = [];
  }
};

// Function to fetch company branches for placement
const fetchCompanyBranches = async (companyHqID) => {
  try {
    $apiFetch(`/mst-companies/available-branches/${companyHqID}`)
      .then(async (res) => {
        const companiesHqRes = await $apiFetch("/mst-companies/search", {
          params: {
            filters: {
              id: companyHqID,
            },
            limit: 1,
          },
        });
        const companiesBranchRes = await $apiFetch("/mst-companies/search", {
          params: {
            filters: {
              parent_id: companyHqID,
            },
            limit: res.items.length,
          },
        });
        const companiesRes = {
          items: [...companiesHqRes.items, ...companiesBranchRes.items],
        };

        branchOptions.value = res.items.map((item, index) => {
          const company = companiesRes.items.find(
            (company) => company.id === item.id
          );
          return {
            ...item,
            ...company,
            phone: company?.phone,
            email: company?.email,
            location: company?.location,
            departments: company?.departments,
            display_name: item.display_name || item.branch || "Headquarters",
          };
        });

        // Sort branches so that null branch fields appear at the top
        branchOptions.value.sort((a, b) => {
          // If a.branch is null/undefined and b.branch is not, a should come first
          if (!a.branch && b.branch) return -1;
          // If b.branch is null/undefined and a.branch is not, b should come first
          if (a.branch && !b.branch) return 1;
          // If both are null or both have values, maintain original order
          return 0;
        });

        // Don't copy company data to branch form - branches should start blank
      })
      .finally(() => {
        loadingInitial.value = false;
      });
  } catch (error) {
    console.error("Error fetching company branches:", error);
    branchOptions.value = [];
  }
};

// Job title is now a free text field

const employmentTypeOptions = ref([
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
]);

const statusOptions = ref([
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
]);

// Get user's current assignment
const getUserAssignment = () => {
  return me.value?.roles?.[0]?.assignment || null;
};

// Get filtered branch options based on user's role
const getFilteredBranchOptions = () => {
  const userAssignment = getUserAssignment();
  if (!userAssignment) return branchOptions.value;

  const userRole = userAssignment.company_role;

  // owner_hq and hrd_hq: can select all branches
  if (userRole === "owner_hq" || userRole === "hrd_hq") {
    return branchOptions.value;
  }

  // pic_branch and hrd_branch: can only select their assigned branch
  if (userRole === "pic_branch" || userRole === "hrd_branch") {
    return branchOptions.value.filter(
      (branch) => branch.id === userAssignment.company_id
    );
  }

  // dept_head_hq and dept_head_branch: locked to their assignment
  if (userRole === "dept_head_hq" || userRole === "dept_head_branch") {
    return branchOptions.value.filter(
      (branch) => branch.id === userAssignment.company_id
    );
  }

  // member: should not reach here (blocked by canInviteMember), but return empty for safety
  if (userRole === "member") {
    return [];
  }

  return branchOptions.value;
};

// Get filtered department options based on user's role and selected branch
const getFilteredDepartmentsForBranch = (branchId) => {
  if (!branchId) return [];

  const userAssignment = getUserAssignment();
  if (!userAssignment) {
    // Fallback to original logic if no assignment
    const branch = branchOptions.value.find((b) => b.id === branchId);
    return branch ? branch.departments : [];
  }

  const userRole = userAssignment.company_role;

  // owner_hq and hrd_hq: can select all departments in the selected branch
  if (userRole === "owner_hq" || userRole === "hrd_hq") {
    const branch = branchOptions.value.find((b) => b.id === branchId);
    return branch ? branch.departments : [];
  }

  // pic_branch and hrd_branch: can select all departments in their branch
  if (userRole === "pic_branch" || userRole === "hrd_branch") {
    // Only allow if the branch matches their assignment
    if (branchId !== userAssignment.company_id) {
      return [];
    }
    const branch = branchOptions.value.find((b) => b.id === branchId);
    return branch ? branch.departments : [];
  }

  // dept_head_hq and dept_head_branch: locked to their assigned department
  if (userRole === "dept_head_hq" || userRole === "dept_head_branch") {
    // Only allow if the branch matches their assignment
    if (branchId !== userAssignment.company_id) {
      return [];
    }
    // Return only their assigned department
    const branch = branchOptions.value.find((b) => b.id === branchId);
    if (!branch || !branch.departments) return [];
    return branch.departments.filter(
      (dept) => dept.id === userAssignment.dept_id
    );
  }

  // Fallback
  const branch = branchOptions.value.find((b) => b.id === branchId);
  return branch ? branch.departments : [];
};

// Check if branch selection should be disabled
const isBranchDisabled = () => {
  const userAssignment = getUserAssignment();
  if (!userAssignment) return false;

  const userRole = userAssignment.company_role;

  // dept_head_hq and dept_head_branch: branch is locked
  if (
    userRole === "hrd_hq" ||
    userRole === "owner_hq" ||
    userRole === "dept_head_hq"
  ) {
    return false;
  }

  // pic_branch and hrd_branch: branch is locked to their assignment
  if (userRole === "pic_branch" || userRole === "hrd_branch") {
    return true;
  }

  return false;
};

// Check if department selection should be disabled
const isDepartmentDisabled = () => {
  const userAssignment = getUserAssignment();
  if (!userAssignment) return false;

  const userRole = userAssignment.company_role;

  // dept_head_hq and dept_head_branch: department is locked
  if (userRole === "dept_head_hq" || userRole === "dept_head_branch") {
    return true;
  }

  return false;
};

// Computed property to get departments for selected branch (kept for backward compatibility)
const getDepartmentsForBranch = (branchId) => {
  return getFilteredDepartmentsForBranch(branchId);
};

// Function to check if branch is HQ or Branch
const isBranchHQ = (branchId) => {
  if (!branchId) return false;
  const branch = branchOptions.value.find((b) => b.id === branchId);
  // HQ has no parent_id or branch field is null/empty
  return branch && (!branch.parent_id || !branch.branch);
};

// Role hierarchy mapping (order determines hierarchy level)
const roleHierarchy = {
  owner_hq: 1,
  hrd_hq: 2,
  dept_head_hq: 3,
  pic_branch: 4,
  hrd_branch: 5,
  dept_head_branch: 6,
  member: 7,
};

// Check if user is editing themselves
const isEditingSelf = computed(() => {
  if (!isEditing.value) return false;
  if (!me.value?.id) return false;
  // Check both user_id and id fields
  return (
    newMember.value?.user_id === me.value.id ||
    newMember.value?.id === me.value.id
  );
});

// Function to get filtered roles based on branch type and user hierarchy
const getFilteredRoles = (branchId) => {
  if (!branchId) {
    // If no branch selected, filter only by hierarchy
    const userAssignment = getUserAssignment();
    if (!userAssignment) return roles.value;

    const userRole = userAssignment.company_role;
    const userOrder = roleHierarchy[userRole] || 999;

    // If editing self, return roles with order <= user's role
    if (isEditingSelf.value) {
      return roles.value.filter((role) => {
        const roleOrder = roleHierarchy[role.name] || 999;
        return roleOrder <= userOrder;
      });
    }

    // Return only roles with order higher than user's role
    return roles.value.filter((role) => {
      const roleOrder = roleHierarchy[role.name] || 999;
      return roleOrder > userOrder;
    });
  }

  const isHQ = isBranchHQ(branchId);
  const userAssignment = getUserAssignment();

  // Filter roles by type and hierarchy
  return roles.value.filter((role) => {
    // First filter by branch type
    const matchesBranchType = isHQ
      ? role.type.includes("hq") || role.type.includes("branch,hq")
      : role.type.includes("branch") || role.type.includes("branch,hq");

    if (!matchesBranchType) return false;

    // If no user assignment, return all matching branch type roles
    if (!userAssignment) return true;

    // Filter by hierarchy
    const userRole = userAssignment.company_role;
    const userOrder = roleHierarchy[userRole] || 999;
    const roleOrder = roleHierarchy[role.name] || 999;

    // If editing self, return roles with order <= user's role
    if (isEditingSelf.value) {
      return roleOrder <= userOrder;
    }

    // Otherwise, only roles with order higher than user's role
    return roleOrder > userOrder;
  });
};

// Function to get filtered non-owner roles based on branch type and user hierarchy
const getFilteredNonOwnerRoles = (branchId) => {
  if (!branchId) {
    // If no branch selected, filter only by hierarchy
    const userAssignment = getUserAssignment();
    if (!userAssignment) return nonOwnerRoles.value;

    const userRole = userAssignment.company_role;
    const userOrder = roleHierarchy[userRole] || 999;

    // Return only roles with order higher than user's role
    return nonOwnerRoles.value.filter((role) => {
      const roleOrder = roleHierarchy[role.name] || 999;
      return roleOrder > userOrder;
    });
  }

  const isHQ = isBranchHQ(branchId);
  const userAssignment = getUserAssignment();

  // Filter non-owner roles by type and hierarchy
  return nonOwnerRoles.value.filter((role) => {
    // First filter by branch type
    const matchesBranchType = isHQ
      ? role.type.includes("hq") || role.type.includes("branch,hq")
      : role.type.includes("branch") || role.type.includes("branch,hq");

    if (!matchesBranchType) return false;

    // If no user assignment, return all matching branch type roles
    if (!userAssignment) return true;

    // Filter by hierarchy - only roles with order higher than user's role
    const userRole = userAssignment.company_role;
    const userOrder = roleHierarchy[userRole] || 999;
    const roleOrder = roleHierarchy[role.name] || 999;

    return roleOrder > userOrder;
  });
};

// Table headers for v-data-table
const tableHeaders = ref([
  { title: "No", key: "no", sortable: false },
  { title: "Name", key: "full_name", sortable: true },
  //{ title: "Email", key: "email", sortable: false },
  { title: "Branch", key: "branch", sortable: true },
  { title: "Department", key: "dept_name", sortable: true },
  { title: "Job Title", key: "profession_name", sortable: true },
  { title: "Role", key: "company_role", sortable: true },
  { title: "Role Status", key: "status", sortable: true },
  { title: "Actions", key: "actions", sortable: false },
]);

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

const resetForm = () => {
  newMember.value = {
    full_name: null,
    email: null,
    is_outside_indo: false,
    region_id: null,
    postal_code: null,
    encrypted_address: null,
    gender: null,
    encrypted_date_of_birth: null,
    encrypted_nik: null,
    encrypted_address: null,
    encrypted_phone: null,
    company_role: null,
    photo_url: null,
  };

  // Get user's assignment to set default values
  const userAssignment = getUserAssignment();

  // Reset team roles to default single role
  const defaultRole = {
    user_id: null,
    company_hq_id: null,
    company_id: null,
    dept_id: null,
    company_role: null,
    start_date: null,
    end_date: null,
    status: null,
    employment_type: null,
    profession_id: null,
    job_title: "",
    currently_here: true,
  };

  // Set default values based on user's role
  if (userAssignment) {
    const userRole = userAssignment.company_role;

    // For pic_branch, hrd_branch, dept_head_hq, dept_head_branch: set default branch
    if (
      userRole === "pic_branch" ||
      userRole === "hrd_branch" ||
      userRole === "dept_head_hq" ||
      userRole === "dept_head_branch"
    ) {
      defaultRole.company_id = userAssignment.company_id;
    }

    // For dept_head_hq and dept_head_branch: also set default department
    if (userRole === "dept_head_hq" || userRole === "dept_head_branch") {
      defaultRole.dept_id = userAssignment.dept_id;
    }
  }

  teamRoles.value = [defaultRole];
};

// Modal dialog methods
const openAddMemberDialog = () => {
  isEditing.value = false;
  isViewing.value = false;
  resetForm();
  showAddMemberDialog.value = true;
};

const closeAddMemberDialog = () => {
  showAddMemberDialog.value = false;
  isEditing.value = false;
  isViewing.value = false;
  errors.value = {};
  errorMessage.value = "";
};

// Role management methods
const addRole = () => {
  // Get user's assignment to set default values
  const userAssignment = getUserAssignment();

  const newRole = {
    user_id: null,
    company_hq_id: null,
    company_id: null,
    dept_id: null,
    company_role: null,
    start_date: null,
    end_date: null,
    status: null,
    employment_type: null,
    profession_id: null,
    job_title: "",
    currently_here: true,
  };

  // Set default values based on user's role
  if (userAssignment) {
    const userRole = userAssignment.company_role;

    // For pic_branch, hrd_branch, dept_head_hq, dept_head_branch: set default branch
    if (
      userRole === "pic_branch" ||
      userRole === "hrd_branch" ||
      userRole === "dept_head_hq" ||
      userRole === "dept_head_branch"
    ) {
      newRole.company_id = userAssignment.company_id;
    }

    // For dept_head_hq and dept_head_branch: also set default department
    if (userRole === "dept_head_hq" || userRole === "dept_head_branch") {
      newRole.dept_id = userAssignment.dept_id;
    }
  }

  teamRoles.value.push(newRole);
};

const removeRole = (index) => {
  if (teamRoles.value.length > 1) {
    teamRoles.value.splice(index, 1);
  }
};

// Handle currently here checkbox change
const handleCurrentlyHereChange = (value, role) => {
  if (value) {
    // If currently here is checked, clear the end_date
    role.end_date = null;
  }

  // Trigger validation to show/hide required error
  nextTick(() => {
    if (form.value) {
      form.value.validate();
    }
  });
};

// Validate end date is after start date
const validateEndDate = (endDate, startDate, currentlyHere) => {
  // If currently here is not checked, end date is required
  if (!currentlyHere && !endDate) {
    return "End date is required when 'Currently Here' is not checked";
  }

  // If currently here is checked, end date validation passes
  if (currentlyHere) return true;

  // If no end date but currently here is false, already handled above
  if (!endDate) return true;

  // If no start date, validation passes
  if (!startDate) return true;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return "End date must be after start date";
  }

  return true;
};

// Get error message for end date
const getEndDateError = (role) => {
  // If currently here is not checked and no end date, show error
  if (!role.currently_here && !role.end_date) {
    return "End date is required when 'Currently Here' is not checked";
  }

  // If currently here is checked, no error
  if (role.currently_here) return "";

  if (!role.end_date || !role.start_date) return "";

  const start = new Date(role.start_date);
  const end = new Date(role.end_date);

  if (end <= start) {
    return "End date must be after start date";
  }

  return "";
};

// Validate dates when start date changes
const validateDates = (role) => {
  // Force re-validation by updating the role object
  if (role.end_date && role.start_date) {
    const start = new Date(role.start_date);
    const end = new Date(role.end_date);

    // This will trigger the error-messages computed property
    if (end <= start) {
      // Trigger form validation
      nextTick(() => {
        if (form.value) {
          form.value.validate();
        }
      });
    }
  }
};

// Handle profession change
const handleProfessionChange = (newProfessionId, role) => {
  if (newProfessionId) {
    // Find the selected profession from models
    const selectedProfession = models.value.profession.items.find(
      (item) => item.id === newProfessionId
    );

    if (selectedProfession) {
      // Set the job_title to the profession name
      role.job_title = selectedProfession.name;
    }
  }
};

// Handle profession input search
const handleProfessionInput = (event, role) => {
  debouncedFetch("profession", event, ["name"], "mst-professions");
};

// Avatar upload method
const uploadAvatar = () => {
  // This would typically open a file picker
  // For now, we'll just show a placeholder
  console.log("Avatar upload clicked");
};

const editMember = async (member) => {
  // Check if user can edit this specific member
  if (!canEditMember(member.company_id)) {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "You don't have permission to edit this member",
      color: "error",
    });
    return;
  }

  resetForm();
  loadingInitial.value = true;
  isEditing.value = true;
  isViewing.value = false;
  Object.assign(newMember.value, member);

  showAddMemberDialog.value = true;
  const user = await $apiFetch(`/mst-companies/member-detail`, {
    params: {
      user_id: member.user_id,
      company_hq_id: me.value.company_id,
    },
  });
  if (user) {
    Object.assign(newMember.value, user);
  }

  if (newMember.value.region_id) {
    fetchRegions(newMember.value.region_id, "id");
  }

  // Set up team roles for editing from assignments
  if (
    Array.isArray(newMember.value.assignments) &&
    newMember.value.assignments.length > 0
  ) {
    teamRoles.value = newMember.value.assignments.map((assignment) => ({
      ...assignment,
      // Set currently_here to true if end_date is null
      currently_here: !assignment.end_date || assignment.end_date === null,
    }));
  } else {
    // Default single role if no assignments
    teamRoles.value = [
      {
        id: newMember.value.role_assignment_id || null,
        user_id: newMember.value.user_id || null,
        company_id: newMember.value.company_id || null,
        dept_id: newMember.value.dept_id || null,
        company_role: newMember.value.company_role || null,
        start_date: formatDateToYYYYMMDD(newMember.value.start_date),
        end_date: formatDateToYYYYMMDD(newMember.value.end_date),
        status: newMember.value.status || null,
        employment_type: newMember.value.employment_type || null,
        profession_id: newMember.value.profession_id || null,
        currently_here:
          !newMember.value.end_date || newMember.value.end_date === null,
        role_assignment_history_id:
          newMember.value.role_assignment_history_id || null,
      },
    ];
  }

  // Fetch profession data for each role that has a profession_id
  teamRoles.value.forEach((role) => {
    if (role.profession_id) {
      fetch("profession", role.profession_id, ["id"], "mst-professions");
    }
  });

  loadingInitial.value = false;
};

const viewTeamMgmt = async (member) => {
  resetForm();
  loadingInitial.value = true;
  isEditing.value = false;
  isViewing.value = true;
  Object.assign(newMember.value, member);

  showAddMemberDialog.value = true;
  const user = await $apiFetch(`/mst-companies/member-detail`, {
    params: {
      user_id: member.user_id,
      company_hq_id: me.value.company_id,
    },
  });
  if (user) {
    Object.assign(newMember.value, user);
  }

  if (newMember.value.region_id) {
    fetchRegions(newMember.value.region_id, "id");
  }

  // Set up team roles for viewing from assignments
  if (
    Array.isArray(newMember.value.assignments) &&
    newMember.value.assignments.length > 0
  ) {
    teamRoles.value = newMember.value.assignments.map((assignment) => ({
      ...assignment,
      // Set currently_here to true if end_date is null
      currently_here: !assignment.end_date || assignment.end_date === null,
    }));
  } else {
    // Default single role if no assignments
    teamRoles.value = [
      {
        id: newMember.value.role_assignment_id || null,
        user_id: newMember.value.user_id || null,
        company_id: newMember.value.company_id || null,
        dept_id: newMember.value.dept_id || null,
        company_role: newMember.value.company_role || null,
        start_date: formatDateToYYYYMMDD(newMember.value.start_date),
        end_date: formatDateToYYYYMMDD(newMember.value.end_date),
        status: newMember.value.status || null,
        employment_type: newMember.value.employment_type || null,
        profession_id: newMember.value.profession_id || null,
        currently_here:
          !newMember.value.end_date || newMember.value.end_date === null,
        role_assignment_history_id:
          newMember.value.role_assignment_history_id || null,
      },
    ];
  }

  // Fetch profession data for each role that has a profession_id
  teamRoles.value.forEach((role) => {
    if (role.profession_id) {
      fetch("profession", role.profession_id, ["id"], "mst-professions");
    }
  });

  loadingInitial.value = false;
};

const { roles, nonOwnerRoles } = useUser();

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const searchCities = (search) => {
  debouncedFetchRegions(search);
};

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

// Watch for branch changes to clear department and role
watch(
  () => teamRoles.value,
  (newRoles) => {
    newRoles.forEach((role, index) => {
      // Watch for company_id changes in each role
      watch(
        () => role.company_id,
        (newBranch, oldBranch) => {
          if (newBranch !== oldBranch) {
            // Clear department when branch changes
            role.dept_id = null;

            // Check if current role is valid for the new branch type
            if (role.company_role) {
              const filteredRoles = getFilteredRoles(newBranch);
              const isRoleValid = filteredRoles.some(
                (r) => r.name === role.company_role
              );

              // Clear role if it's not valid for the new branch type
              if (!isRoleValid) {
                role.company_role = null;
              }
            }
          }
        }
      );
    });
  },
  { deep: true }
);

// Watch for outside Indonesia toggle
watch(
  () => newMember.value.is_outside_indo,
  (newVal, oldVal) => {
    if (newVal === true && oldVal === false) {
      // If switching to outside Indonesia, clear Indonesia fields
      newMember.value.region_id = null;
    } else if (oldVal === true && newVal === false) {
      // If switching to inside Indonesia, clear outside Indonesia fields
      newMember.value.other_country = null;
      newMember.value.other_region = null;
    }
  }
);

// Watch for placement branch change to clear department and role
watch(
  () => currentOwnerPlacement.value.company_id,
  (newBranch, oldBranch) => {
    if (newBranch !== oldBranch) {
      currentOwnerPlacement.value.dept_id = null;

      // Check if current role is valid for the new branch type
      if (currentOwnerPlacement.value.company_role) {
        const filteredRoles = getFilteredNonOwnerRoles(newBranch);
        const isRoleValid = filteredRoles.some(
          (r) => r.name === currentOwnerPlacement.value.company_role
        );

        // Clear role if it's not valid for the new branch type
        if (!isRoleValid) {
          currentOwnerPlacement.value.company_role = null;
        }
      }
    }
  }
);

// Methods

const form = ref(null);

// Avatar upload functionality
const avatarInput = ref(null);
const loadingAvatar = ref(false);

const triggerAvatarUpload = () => {
  avatarInput.value.click();
};

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    loadingAvatar.value = true;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "profileImage");

      const postMediaResponse = await $apiFetch("/media", {
        method: "POST",
        body: formData,
      });

      newMember.value.photo_url = postMediaResponse.path;
    } catch (error) {
      errorMessage.value =
        error.message || "An error occurred while uploading the file";
      if (avatarInput.value) {
        avatarInput.value.value = "";
      }
    } finally {
      loadingAvatar.value = false;
    }
  }
};

const handleAddMember = async () => {
  const validation = await form.value.validate();
  if (!validation.valid) {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Please check the form. Some fields are invalid or required.",
      color: "error",
    });
    return;
  }

  loadingAdd.value = true;
  errors.value = {};

  try {
    // Prepare the member data with assignments
    teamRoles.value.forEach((role) => {
      role.user_id = newMember.value.id;
      role.role = "employer";
    });
    const memberData = {
      ...newMember.value,
      company_id: me.value.company_id,
      assignments: teamRoles.value,
    };

    if (
      Array.isArray(memberData.assignments) &&
      memberData.assignments.length > 0
    ) {
      memberData.assignments = memberData.assignments.map((assignment) => {
        return {
          ...assignment,
          company_hq_id: me.value.company_id,
        };
      });
    }

    if (newMember.value.id) {
      // Update existing member
      await $apiFetch(`/mst-companies/upsert-member`, {
        method: "POST",
        body: memberData,
      });
    } else {
      // Add new member
      const response = await $apiFetch("/mst-companies/upsert-member", {
        method: "POST",
        body: memberData,
      });
    }

    await fetchMembers();
    closeAddMemberDialog();

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: isEditing.value
        ? "Team member updated successfully"
        : "Team member added successfully",
      color: "success",
    });
  } catch (error) {
    console.error("Error adding member:", error);
    if (error.response?._data?.message) {
      errors.value = error.response._data.message;
    }
    errorMessage.value =
      error.response?._data?.message ||
      "An error occurred while saving the team member";
  } finally {
    loadingAdd.value = false;
  }
};

const removeMember = async (member) => {
  // Check if user can delete this specific member
  if (!canDeleteMember(member.company_id, member.company_role)) {
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "You don't have permission to delete this member",
      color: "error",
    });
    showDeleteDialog.value = false;
    return;
  }

  loadingDelete.value = member.id;
  try {
    await $apiFetch(`/mst-companies/members`, {
      params: {
        user_id: member.user_id,
        company_id: member.company_id,
        company_hq_id: member.company_hq_id,
      },
      method: "DELETE",
    });
    showDeleteDialog.value = false;
    await fetchMembers();
  } catch (error) {
    console.error("Error removing member:", error);
  } finally {
    loadingDelete.value = null;
  }
};

// Transfer Ownership Functions
const openTransferOwnershipDialog = (member) => {
  currentOwner.value = member;
  selectedNewOwner.value = null;
  selectedNewOwnerData.value = null;
  availableNewOwners.value = [];
  newOwnerSearchTerm.value = "";

  // Reset placement form
  currentOwnerPlacement.value = {
    company_id: null,
    company_role: null,
    employment_type: null,
    dept_id: null,
    profession_id: null,
  };

  showTransferOwnershipDialog.value = true;

  // Load initial members for the autocomplete
  fetchAvailableNewOwners("");
};

const closeTransferOwnershipDialog = () => {
  showTransferOwnershipDialog.value = false;
  selectedNewOwner.value = null;
  selectedNewOwnerData.value = null;
  currentOwner.value = null;
};

const closeTransferConfirmationDialog = () => {
  showTransferConfirmationDialog.value = false;
  // Reset to first dialog
  showTransferOwnershipDialog.value = true;
};

// Proceed to confirmation dialog with placement form
const proceedToConfirmation = () => {
  if (!selectedNewOwner.value) {
    return;
  }

  // Since we're using return-object, selectedNewOwner already contains the full member data
  selectedNewOwnerData.value = selectedNewOwner.value;

  // Close first dialog and open confirmation dialog
  showTransferOwnershipDialog.value = false;
  showTransferConfirmationDialog.value = true;
};

// Final transfer confirmation
const confirmFinalTransfer = async () => {
  // Validate placement form
  const validation = await placementForm.value.validate();
  if (!validation.valid) {
    return;
  }

  if (!selectedNewOwner.value || !currentOwner.value) {
    return;
  }

  // Show confirmation dialog before proceeding
  const dialog = useDialogStore();
  try {
    const confirmed = await dialog.openDialog({
      title: "Confirm Transfer Ownership",
      message: `Are you sure you want to transfer ownership to <strong>${selectedNewOwner.value.full_name}</strong>?<br/><br/>This action is permanent and cannot be undone. You will lose all owner permissions.`,
      confirmButtonText: "Yes, Transfer Ownership",
      cancelButtonText: "Cancel",
      confirmButtonColor: "error",
      cancelButtonColor: "grey-darken-1",
    });

    if (!confirmed) {
      return;
    }
  } catch (error) {
    // User cancelled
    return;
  }

  loadingTransfer.value = true;

  try {
    // Prepare updated_placement body
    const updatedPlacement = {
      user_id: currentOwner.value.user_id,
      company_hq_id: me.value.company_id,
      company_id: currentOwnerPlacement.value.company_id,
      dept_id: currentOwnerPlacement.value.dept_id,
      company_role: currentOwnerPlacement.value.company_role,
      role: "employer",
      start_date: new Date().toISOString().split("T")[0], // Current date
      end_date: null,
      status: "active",
      employment_type: currentOwnerPlacement.value.employment_type,
      profession_id: currentOwnerPlacement.value.profession_id,
    };

    // Transfer ownership via API
    await $apiFetch(`/mst-companies/transfer-ownership`, {
      method: "POST",
      body: {
        new_owner_user_id: selectedNewOwner.value.user_id,
        company_hq_id: me.value.company_id,
        updated_placement: updatedPlacement,
      },
    });

    // Show success message
    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: "Ownership transferred successfully",
      color: "success",
    });

    // Close all dialogs
    showTransferConfirmationDialog.value = false;
    closeTransferOwnershipDialog();

    // Reload page to refresh all data
    setTimeout(() => {
      window.location.reload();
    }, 1000); // Give user time to see the success message
  } catch (error) {
    console.error("Error transferring ownership:", error);

    const snackbar = useSnackbarStore();
    snackbar.showSnackbar({
      message: error.response?._data?.message || "Failed to transfer ownership",
      color: "error",
    });
  } finally {
    loadingTransfer.value = false;
  }
};

// Handle profession input for placement form
const handlePlacementProfessionInput = (event) => {
  debouncedFetch("profession", event, ["name"], "mst-professions");
};

// Search function for available new owners with backend pagination
const fetchAvailableNewOwners = async (searchTerm = "") => {
  if (!me.value.company_id || !currentOwner.value) return;

  loadingNewOwners.value = true;
  try {
    const baseParams = {
      company_hq_id: me.value.company_id,
      limit: 50, // Get top 50 results
      status: "active", // Only active members
    };

    let allResults = [];

    // Search by both name and email if search term exists
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim();

      // If it looks like an email, prioritize email search
      const userResponse = await $apiFetch("/mst-companies/members", {
        params: { ...baseParams, full_name: term, email: term },
      });

      // Merge results and remove duplicates based on user_id

      const uniqueResults = new Map();
      userResponse.items.forEach((member) => {
        if (!uniqueResults.has(member.user_id)) {
          uniqueResults.set(member.user_id, member);
        }
      });

      allResults = Array.from(uniqueResults.values());
    } else {
      // No search term - get all active members
      const userResponse = await $apiFetch("/mst-companies/members", {
        params: baseParams,
      });

      const uniqueResults = new Map();
      userResponse.items.forEach((member) => {
        if (!uniqueResults.has(member.user_id)) {
          uniqueResults.set(member.user_id, member);
        }
      });
      allResults = Array.from(uniqueResults.values());
    }

    // Filter out current owner from results
    allResults = allResults.map((member) => {
      return {
        ...member,
        label: `${member.full_name} (${member.email})`,
        value: member.user_id,
      };
    });
    availableNewOwners.value = allResults.filter(
      (member) => member.user_id !== currentOwner.value.user_id
    );
  } catch (error) {
    console.error("Error fetching available new owners:", error);
    availableNewOwners.value = [];
  } finally {
    loadingNewOwners.value = false;
  }
};

// Debounced search handler for new owner autocomplete
const handleNewOwnerSearch = (searchTerm) => {
  newOwnerSearchTerm.value = searchTerm;

  // Clear existing timeout
  if (newOwnerSearchTimeout) {
    clearTimeout(newOwnerSearchTimeout);
  }

  // Set new timeout for debounced search
  newOwnerSearchTimeout = setTimeout(() => {
    fetchAvailableNewOwners(searchTerm);
  }, 300); // 300ms debounce delay
};

const genders = ref([]);

const fetchGenders = async () => {
  const response = await $apiFetch("/configs/key/gender");
  genders.value = response.value;
};

const errorMessage = ref("");

// Max date for date of birth (today)
const maxDate = computed(() => new Date().toISOString().slice(0, 10));

const loadingSubmit = ref(false);
const handleSubmit = async () => {
  loadingSubmit.value = true;
  try {
    const index = me.value.wizard_state.findIndex((item) => item.id == 4);
    if (index !== -1) {
      me.value.wizard_state[index].state = 1;
    }
    me.value.last_wizard_state =
      me.value.last_wizard_state > 4 ? me.value.last_wizard_state : 5;

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
    const index = me.value.wizard_state.findIndex((item) => item.id == 5);
    if (index !== -1) {
      router.push({
        path: "/admin/profile/employer/5",
        query: route.query,
      });
    } else {
      router.push({
        path: "/admin/profile",
      });
    }
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
      path: "/admin/profile/employer/2",
      query: route.query,
    });
  }
};

// Fetch members data
const loadingInitial = ref(true);
const fetchMembers = async () => {
  if (!me.value.company_id) return;

  console.log("fetch members", me.value);
  loadingInitial.value = true;
  try {
    const params = {
      company_hq_id: me.value.company_hq_id,
      page: page.value,
      limit: itemsPerPage.value,
    };

    /*if (me.value.company_id != me.value.company_hq_id) {
      params.company_id = me.value.company_id;
    }*/

    // Add filters if they exist
    if (searchKeyword.value) {
      if (searchBy.value === "name") {
        params.full_name = searchKeyword.value;
      } else if (searchBy.value === "email") {
        params.email = searchKeyword.value;
      }
    }

    if (selectedRole.value && selectedRole.value !== "all") {
      params.company_role = selectedRole.value;
    }

    // For branch filter, we need to use company_id
    if (selectedBranch.value && selectedBranch.value !== "all") {
      params.company_id = selectedBranch.value;
    }

    // Add sorting if specified
    if (sortBy.value && sortBy.value.length > 0) {
      // Take the first sort option (Vuetify supports multi-sort but we'll use first one)
      const firstSort = sortBy.value[0];
      params.sortBy = firstSort.key;
      params.sortOrder = firstSort.order === "desc" ? "DESC" : "ASC";
    }

    const response = await $apiFetch("/mst-companies/members", { params });

    members.value = response.items || [];
    totalItems.value = response.meta?.total || 0;
    totalPages.value = response.meta?.totalPages || 0;
  } catch (error) {
    console.error("Error fetching members:", error);
    members.value = [];
    totalItems.value = 0;
    totalPages.value = 0;
  } finally {
    loadingInitial.value = false;
  }
};

// Add these helper functions
const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const formatDateToYYYYMMDD = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Computed properties for filtering and pagination - now just adds row numbers and maps fields
const filteredMembers = computed(() => {
  return members.value.map((item, index) => ({
    ...item,
    no: (page.value - 1) * itemsPerPage.value + index + 1,
    name: item.full_name,
    role: item.company_role,
    branch_name: item.branch || item.company_name,
    placement_branch: item.branch || item.company_name,
    department: item.dept_name,
    job_title: item.profession_name,
  }));
});

// Helper methods
const getBranchName = (member) => {
  // Find the branch name from the branchOptions
  const branch = branchOptions.value.find((b) => b.value === member.company_id);
  return branch ? branch.label : "Unknown Branch";
};

const getDepartmentName = (member) => {
  // Find the department name from the departmentOptions
  const department = departmentOptions.value.find(
    (d) => d.id === member.dept_id
  );
  return department ? department.dept_name : member.dept_id || null;
};

const getJobTitle = (member) => {
  // Return the job title from member data, or fallback to role
  return member.job_title || capitalizeFirstLetter(member.company_role);
};

// Search and filter methods
const handleSearch = () => {
  page.value = 1; // Reset to first page when searching
  fetchMembers();
};

const handleReset = () => {
  searchBy.value = "name";
  searchKeyword.value = "";
  selectedBranch.value = "all";
  selectedRole.value = "all";
  page.value = 1;
  fetchMembers();
};

// Table update handler
const handleTableUpdate = (options) => {
  page.value = options.page;
  itemsPerPage.value = options.itemsPerPage;
  sortBy.value = options.sortBy;
  // The filteredMembers computed property will automatically update
};

// Watch for pagination and sorting changes
watch(
  [page, itemsPerPage, sortBy],
  () => {
    fetchMembers();
  },
  { deep: true }
);

const assignment = ref({
  dept_id: null,
  company_role: null,
  company_id: null,
  company_hq_id: null,
});

onMounted(async () => {
  if (!me.value.id) {
    await fetchMe();
  }
  await fetchGenders();
  if (me.value.roles[0]?.assignment?.company_hq_id || me.value.company_hq_id) {
    // Fetch available departments and branches for the company first
    Object.assign(assignment.value, me.value.roles[0]?.assignment);
    await fetchAvailableDepartments(me.value.company_hq_id);
    await fetchCompanyBranches(me.value.company_hq_id);
    // Then fetch members (this will populate branchFilterOptions)
    await fetchMembers();
  } else {
    loadingInitial.value = false;
  }
});
</script>

<style scoped>
/* Table styles */
.v-table {
  border-radius: 8px;
}

.v-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.v-table td {
  border-bottom: 1px solid #dee2e6;
  padding: 12px 16px;
}

.v-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Avatar styles */
.v-avatar {
  font-size: 12px;
  font-weight: 600;
}

/* Action button styles */
.v-btn--icon {
  width: 32px;
  height: 32px;
}

/* Search and filter section */
.gap-2 {
  gap: 8px;
}

/* Pagination styles */
.v-card-actions .v-btn {
  margin: 0 4px;
}

/* Transfer ownership link */
.text-decoration-none {
  text-decoration: none;
}

.text-decoration-none:hover {
  text-decoration: underline;
}
</style>
