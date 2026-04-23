<template>
  <v-container fluid grid-list-md>
    <v-row>
      <v-breadcrumbs
        class="text-caption"
        :items="[
          {
            title: 'dashboard',
            disabled: false,
            to: '/admin/dashboard',
          },
          {
            title: 'companies',
            disabled: false,
            to: '/admin/companies',
          },
          {
            title: 'view',
            disabled: false,
            to: `/admin/companies/view?id=${route.query.id}`,
          },
          {
            title: 'edit',
            disabled: true,
            to: `/admin/companies/edit?id=${route.query.id}`,
          },
        ]"
        divider="/"
      ></v-breadcrumbs>
    </v-row>
    <v-card-actions class="pl-0 pr-1 py-0">
      <v-icon @click="$router.back()" color="primary">mdi-arrow-left</v-icon
      >Edit : {{ form.company_name }}
      <v-spacer />
    </v-card-actions>
  </v-container>
  <v-container fluid grid-list-lg class="mt-0 pt-0">
    <form @submit.prevent="onSubmit">
      <!-- Tab Navigation -->
      <div class="px-0 mb-6">
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="company" class="text-capitalize">Company Info</v-tab>
          <v-tab value="pic" class="text-capitalize">PIC</v-tab>
        </v-tabs>
        <v-divider />
      </div>
      <v-card-text class="px-1 pt-0">
        <v-row grid-list-lg dense>
          <v-col v-if="loading" cols="12" class="mx-auto">
            <v-card elevation="0" rounded="lg">
              <v-skeleton-loader
                cols="12"
                v-for="n in 8"
                type="list-item-two-line"
              ></v-skeleton-loader>
            </v-card>
          </v-col>
          <template v-else>
            <v-col cols="12" class="pt-0">
              <v-window v-model="activeTab">
                <v-window-item value="company">
                  <v-row align="center">
                    <v-col cols="12" sm="12" class="mx-auto">
                      <v-card elevation="0" rounded="lg">
                        <v-card-title>Company Info</v-card-title>
                        <v-card-text>
                          <v-row>
                            <template v-for="field in fields" :key="field.name">
                              <template
                                v-if="!['is_premium'].includes(field.name)"
                              >
                                <template
                                  v-if="
                                    (form.parent_id &&
                                      field.name == 'branch') ||
                                    (!form.parent_id &&
                                      field.name == 'company_name') ||
                                    !['company_name', 'branch'].includes(
                                      field.name
                                    )
                                  "
                                >
                                  <v-col cols="12" md="4">
                                    <label
                                      class="text-caption text-grey-darken-1 mb-1 d-block"
                                    >
                                      {{ field.label }}
                                      <span
                                        v-if="field.required"
                                        class="text-error"
                                        >*</span
                                      >
                                    </label>
                                    <template v-if="field.name == 'logo_url'">
                                      <v-avatar
                                        rounded="lg"
                                        size="70"
                                        class="bg-grey-lighten-3 mb-4"
                                      >
                                        <v-img
                                          v-if="form[field.name]"
                                          :src="
                                            form[field.name].includes('http')
                                              ? form[field.name]
                                              : BASE_URL + form[field.name]
                                          "
                                        />
                                        <v-icon
                                          color="grey-darken-1"
                                          v-else
                                          size="50"
                                          >mdi-domain</v-icon
                                        >
                                      </v-avatar>
                                    </template>
                                    <template v-else>
                                      <v-list-item
                                        class="bg-blue-lighten-5 mb-8"
                                        rounded="md"
                                        v-if="
                                          ['id'].includes(field.name) &&
                                          !field.options.length
                                        "
                                      >
                                        <v-list-item-subtitle
                                          style="
                                            min-height: 40px;
                                            padding-top: 5px;
                                          "
                                        >
                                          ID :
                                          {{ form[field.name] || "(auto)" }}
                                        </v-list-item-subtitle>
                                      </v-list-item>

                                      <v-autocomplete
                                        v-else-if="field.name == 'region_id'"
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        @keyup="handleInputRegion"
                                        :items="regions"
                                        :loading="regionLoading"
                                        item-title="full_name"
                                        item-value="id"
                                        hide-no-data
                                        :error-messages="errors[field.name]"
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          field.name == 'salary_country_id'
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'salary_country',
                                            ['country_name'],
                                            'mst-salary-country'
                                          )
                                        "
                                        :items="models['salary_country'].items"
                                        :loading="
                                          models['salary_country'].loading
                                        "
                                        item-title="country_name"
                                        item-value="id"
                                        hide-no-data
                                        :error-messages="errors[field.name]"
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          ['user_id', 'following_id'].includes(
                                            field.name
                                          )
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        @keyup="handleInputUser"
                                        :items="users"
                                        :loading="userLoading"
                                        item-value="id"
                                        item-title="full_name"
                                        :error-messages="errors[field.name]"
                                      >
                                        <template v-slot:item="{ props, item }">
                                          <v-list-item
                                            v-bind="props"
                                            :subtitle="item.raw.email"
                                            :title="item.raw.full_name"
                                          ></v-list-item>
                                        </template>

                                        <!-- Custom Selection Display -->
                                        <template
                                          v-slot:selection="{ item, props }"
                                        >
                                          <v-chip
                                            v-if="item.raw.full_name"
                                            v-bind="props"
                                            color="primary"
                                            class="px-1"
                                            label
                                            small
                                          >
                                            {{ item.raw.full_name }} -
                                            {{ item.raw.email }}
                                          </v-chip>
                                        </template>
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="field.name == 'company_id'"
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'company',
                                            ['company_name'],
                                            'mst-companies'
                                          )
                                        "
                                        :items="models['company'].items"
                                        :loading="models['company'].loading"
                                        item-title="company_name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="field.name == 'industry_id'"
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'industry',
                                            ['name'],
                                            'mst-industries'
                                          )
                                        "
                                        :items="models['industry'].items"
                                        :loading="models['industry'].loading"
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          field.name == 'parent_id' &&
                                          entity == 'mst-companies'
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        clearable
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'company',
                                            ['company_name'],
                                            'mst-companies'
                                          )
                                        "
                                        :items="
                                          models['company'].items.filter(
                                            (item) =>
                                              item.id !== route.query.id &&
                                              !item.branch
                                          )
                                        "
                                        :loading="models['company'].loading"
                                        item-title="company_name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                        <template v-slot:item="{ props, item }">
                                          <v-list-item
                                            v-bind="props"
                                            :subtitle="item.raw.branch"
                                            :title="item.raw.company_name"
                                          ></v-list-item>
                                        </template>
                                        <template
                                          v-slot:selection="{ item, props }"
                                        >
                                          {{ item.raw.company_name }}
                                          <template v-if="item.raw.branch">
                                            - {{ item.raw.branch }}
                                          </template>
                                        </template>
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="field.name == 'invoice_id'"
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'invoice',
                                            ['invoice_number'],
                                            'mst-invoices'
                                          )
                                        "
                                        :items="models['invoice'].items"
                                        :loading="models['invoice'].loading"
                                        item-title="invoice_number"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          field.name == 'parent_id' &&
                                          entity == 'mst-professions'
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'profession_parent',
                                            ['name'],
                                            'mst-professions'
                                          )
                                        "
                                        :items="
                                          models['profession_parent'].items
                                        "
                                        :loading="
                                          models['profession_parent'].loading
                                        "
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          [
                                            'skill_id',
                                            'group_id',
                                            'paket_id',
                                            'school_id',
                                            'interest_id',
                                            'language_id',
                                            'profession_id',
                                            'right_to_work_id',
                                            'subscription_id',
                                          ].includes(field.name)
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            `${field.name.slice(0, -3)}`,
                                            ['name'],
                                            `${
                                              field.name == 'paket_id'
                                                ? 'event'
                                                : field.name != 'group_id'
                                                ? 'mst'
                                                : ''
                                            }-${field.name.slice(0, -3)}s`
                                          )
                                        "
                                        :items="
                                          models[`${field.name.slice(0, -3)}`]
                                            .items
                                        "
                                        :loading="
                                          models[`${field.name.slice(0, -3)}`]
                                            .loading
                                        "
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          [
                                            'interest_ids',
                                            'profession_ids',
                                            'right_to_work_ids',
                                          ].includes(field.name)
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        multiple
                                        @keyup="
                                          handleInput(
                                            $event,
                                            `${field.name.slice(0, -4)}`,
                                            ['name'],
                                            `mst-${field.name.slice(0, -4)}s`
                                          )
                                        "
                                        :items="
                                          models[`${field.name.slice(0, -4)}`]
                                            .items
                                        "
                                        :loading="
                                          models[`${field.name.slice(0, -4)}`]
                                            .loading
                                        "
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          ['job_id', 'event_id'].includes(
                                            field.name
                                          )
                                        "
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            `${field.name.slice(0, -3)}`,
                                            ['title'],
                                            `${field.name.slice(0, -3)}s`
                                          )
                                        "
                                        :items="
                                          models[`${field.name.slice(0, -3)}`]
                                            .items
                                        "
                                        :loading="
                                          models[`${field.name.slice(0, -3)}`]
                                            .loading
                                        "
                                        item-title="title"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>

                                      <!--BERDASARKAN TYPE DATA-->
                                      <v-checkbox
                                        v-else-if="
                                          field.name.includes('is_') ||
                                          field.name.includes('use_') ||
                                          field.options.type == 'boolean'
                                        "
                                        v-model="form[field.name]"
                                        density="compact"
                                        color="success"
                                        rounded="lg"
                                        :true-value="true"
                                        :false-value="false"
                                        :error-messages="errors[field.name]"
                                      ></v-checkbox>
                                      <v-text-field
                                        v-else-if="
                                          field.options.type == 'decimal' ||
                                          field.options.type == 'int'
                                        "
                                        v-model="form[field.name]"
                                        type="number"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :step="
                                          field.options.type == 'int'
                                            ? '0'
                                            : '0.0000'
                                        "
                                        @keyup="
                                          form[field.name] = parseFloat(
                                            form[field.name]
                                          )
                                        "
                                        :error-messages="errors[field.name]"
                                      ></v-text-field>
                                      <v-text-field
                                        v-else-if="field.name.includes('date')"
                                        v-model="form[field.name]"
                                        type="date"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errors[field.name]"
                                      ></v-text-field>

                                      <v-json-field
                                        v-else-if="
                                          field.options &&
                                          field.options.type === 'jsonb'
                                        "
                                        v-model="form[field.name]"
                                        class="mb-8"
                                      />

                                      <template
                                        v-else-if="
                                          ['branch', 'company_name'].includes(
                                            field.name
                                          )
                                        "
                                      >
                                        <v-text-field
                                          v-if="
                                            (!form.parent_id &&
                                              field.name == 'company_name') ||
                                            (form.parent_id &&
                                              field.name == 'branch')
                                          "
                                          v-model="form[field.name]"
                                          :type="field.inputType || 'text'"
                                          :rules="field.rules"
                                          :clearable="field.clearable || false"
                                          :required="field.required || false"
                                          :placeholder="field.label || ''"
                                          variant="outlined"
                                          density="compact"
                                          rounded="lg"
                                          color="primary"
                                          :error-messages="errors[field.name]"
                                        ></v-text-field>
                                      </template>

                                      <v-text-field
                                        v-else-if="field.inputType === 'text'"
                                        v-model="form[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errors[field.name]"
                                      ></v-text-field>

                                      <v-textarea
                                        v-else-if="
                                          field.inputType === 'textarea'
                                        "
                                        v-model="form[field.name]"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        rows="1"
                                        :error-messages="errors[field.name]"
                                        auto-grow
                                        style="
                                          white-space: pre-wrap !important;
                                          resize: vertical;
                                        "
                                      ></v-textarea>

                                      <v-select
                                        v-else-if="field.inputType === 'select'"
                                        v-model="form[field.name]"
                                        :items="field.enums"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        item-title="key"
                                        item-value="value"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errors[field.name]"
                                      ></v-select>

                                      <template v-else>
                                        <v-text-field
                                          v-model="form[field.name]"
                                          :type="field.inputType || 'text'"
                                          :rules="field.rules"
                                          :clearable="field.clearable || false"
                                          :required="field.required || false"
                                          :placeholder="field.label || ''"
                                          variant="outlined"
                                          density="compact"
                                          rounded="lg"
                                          color="primary"
                                          :error-messages="errors[field.name]"
                                        ></v-text-field>
                                      </template>
                                    </template>
                                  </v-col>
                                </template>
                              </template>
                            </template>
                          </v-row>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-window-item>

                <v-window-item value="pic">
                  <v-row align="center">
                    <v-col cols="12" sm="12" class="mx-auto">
                      <v-card elevation="0" rounded="lg">
                        <v-card-title>PIC Info</v-card-title>
                        <v-card-text>
                          <!-- Loading State -->
                          <div v-if="loadingPIC" class="text-center py-12">
                            <v-progress-circular
                              indeterminate
                              color="primary"
                              size="48"
                            ></v-progress-circular>
                            <p class="text-grey-darken-1 mt-4">
                              Loading PIC information...
                            </p>
                          </div>

                          <!-- No PIC Placeholder -->
                          <div v-else-if="!hasPIC" class="text-center py-12">
                            <v-icon
                              color="grey-lighten-1"
                              size="80"
                              class="mb-4"
                            >
                              mdi-account-off
                            </v-icon>
                            <h3
                              class="text-grey-darken-2 mb-2 font-weight-medium"
                            >
                              PIC Not Found
                            </h3>
                            <p class="text-grey-darken-1">
                              This company does not have a Person In Charge
                              (PIC) assigned yet.
                            </p>
                          </div>

                          <!-- PIC Data -->
                          <template v-else>
                            <v-row>
                              <template
                                v-for="field in fieldsPIC"
                                :key="field.name"
                              >
                                <template
                                  v-if="
                                    [
                                      'photo_url',
                                      'full_name',
                                      'email',
                                      'company_role',
                                      'gender',
                                      'region_id',
                                      'other_country',
                                      'postal_code',
                                      'encrypted_date_of_birth',
                                      'encrypted_phone',
                                      'encrypted_address',
                                    ].includes(field.name)
                                  "
                                >
                                  <v-col cols="12" md="4">
                                    <label
                                      class="text-caption text-grey-darken-1 mb-1 d-block"
                                    >
                                      {{
                                        field.label.replace("Encrypted ", "")
                                      }}
                                      <span
                                        v-if="field.required"
                                        class="text-error"
                                        >*</span
                                      >
                                    </label>
                                    <template
                                      v-if="
                                        ['photo_url', 'logo_url'].includes(
                                          field.name
                                        )
                                      "
                                    >
                                      <v-avatar
                                        rounded="lg"
                                        size="70"
                                        class="bg-grey-lighten-3 mb-4"
                                      >
                                        <v-img
                                          v-if="formPIC[field.name]"
                                          :src="
                                            formPIC[field.name].includes('http')
                                              ? formPIC[field.name]
                                              : BASE_URL + formPIC[field.name]
                                          "
                                        />
                                        <v-icon
                                          color="grey-darken-1"
                                          v-else
                                          size="50"
                                          >{{
                                            field.name == "photo_url"
                                              ? "mdi-account"
                                              : "mdi-domain"
                                          }}</v-icon
                                        >
                                      </v-avatar>
                                    </template>
                                    <template v-else>
                                      <v-list-item
                                        class="bg-blue-lighten-5 mb-8"
                                        rounded="md"
                                        v-if="
                                          ['id'].includes(field.name) &&
                                          !field.options.length
                                        "
                                      >
                                        <v-list-item-subtitle
                                          style="
                                            min-height: 40px;
                                            padding-top: 5px;
                                          "
                                        >
                                          ID :
                                          {{ formPIC[field.name] || "(auto)" }}
                                        </v-list-item-subtitle>
                                      </v-list-item>

                                      <v-autocomplete
                                        v-else-if="field.name == 'region_id'"
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        @keyup="handleInputRegion"
                                        :items="regions"
                                        :loading="regionLoading"
                                        item-title="full_name"
                                        item-value="id"
                                        hide-no-data
                                        :error-messages="errorsPIC[field.name]"
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          field.name == 'salary_country_id'
                                        "
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'salary_country',
                                            ['country_name'],
                                            'mst-salary-country'
                                          )
                                        "
                                        :items="models['salary_country'].items"
                                        :loading="
                                          models['salary_country'].loading
                                        "
                                        item-title="country_name"
                                        item-value="id"
                                        hide-no-data
                                        :error-messages="errorsPIC[field.name]"
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          ['user_id', 'following_id'].includes(
                                            field.name
                                          )
                                        "
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        @keyup="handleInputUser"
                                        :items="users"
                                        :loading="userLoading"
                                        item-value="id"
                                        item-title="full_name"
                                        :error-messages="errorsPIC[field.name]"
                                      >
                                        <template v-slot:item="{ props, item }">
                                          <v-list-item
                                            v-bind="props"
                                            :subtitle="item.raw.email"
                                            :title="item.raw.full_name"
                                          ></v-list-item>
                                        </template>

                                        <!-- Custom Selection Display -->
                                        <template
                                          v-slot:selection="{ item, props }"
                                        >
                                          <v-chip
                                            v-if="item.raw.full_name"
                                            v-bind="props"
                                            color="primary"
                                            class="px-1"
                                            label
                                            small
                                          >
                                            {{ item.raw.full_name }} -
                                            {{ item.raw.email }}
                                          </v-chip>
                                        </template>
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="field.name == 'company_id'"
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'company',
                                            ['company_name'],
                                            'mst-companies'
                                          )
                                        "
                                        :items="models['company'].items"
                                        :loading="models['company'].loading"
                                        item-title="company_name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="field.name == 'industry_id'"
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'industry',
                                            ['name'],
                                            'mst-industries'
                                          )
                                        "
                                        :items="models['industry'].items"
                                        :loading="models['industry'].loading"
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="field.name == 'invoice_id'"
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'invoice',
                                            ['invoice_number'],
                                            'mst-invoices'
                                          )
                                        "
                                        :items="models['invoice'].items"
                                        :loading="models['invoice'].loading"
                                        item-title="invoice_number"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          field.name == 'parent_id' &&
                                          entity == 'mst-professions'
                                        "
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            'profession_parent',
                                            ['name'],
                                            'mst-professions'
                                          )
                                        "
                                        :items="
                                          models['profession_parent'].items
                                        "
                                        :loading="
                                          models['profession_parent'].loading
                                        "
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          [
                                            'skill_id',
                                            'group_id',
                                            'paket_id',
                                            'school_id',
                                            'interest_id',
                                            'language_id',
                                            'profession_id',
                                            'right_to_work_id',
                                            'subscription_id',
                                          ].includes(field.name)
                                        "
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            `${field.name.slice(0, -3)}`,
                                            ['name'],
                                            `${
                                              field.name == 'paket_id'
                                                ? 'event'
                                                : field.name != 'group_id'
                                                ? 'mst'
                                                : ''
                                            }-${field.name.slice(0, -3)}s`
                                          )
                                        "
                                        :items="
                                          models[`${field.name.slice(0, -3)}`]
                                            .items
                                        "
                                        :loading="
                                          models[`${field.name.slice(0, -3)}`]
                                            .loading
                                        "
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          [
                                            'interest_ids',
                                            'profession_ids',
                                            'right_to_work_ids',
                                          ].includes(field.name)
                                        "
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        multiple
                                        @keyup="
                                          handleInput(
                                            $event,
                                            `${field.name.slice(0, -4)}`,
                                            ['name'],
                                            `mst-${field.name.slice(0, -4)}s`
                                          )
                                        "
                                        :items="
                                          models[`${field.name.slice(0, -4)}`]
                                            .items
                                        "
                                        :loading="
                                          models[`${field.name.slice(0, -4)}`]
                                            .loading
                                        "
                                        item-title="name"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>
                                      <v-autocomplete
                                        v-else-if="
                                          ['job_id', 'event_id'].includes(
                                            field.name
                                          )
                                        "
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :placeholder="field.label || ''"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        @keyup="
                                          handleInput(
                                            $event,
                                            `${field.name.slice(0, -3)}`,
                                            ['title'],
                                            `${field.name.slice(0, -3)}s`
                                          )
                                        "
                                        :items="
                                          models[`${field.name.slice(0, -3)}`]
                                            .items
                                        "
                                        :loading="
                                          models[`${field.name.slice(0, -3)}`]
                                            .loading
                                        "
                                        item-title="title"
                                        item-value="id"
                                        hide-no-data
                                      >
                                      </v-autocomplete>

                                      <!--BERDASARKAN TYPE DATA-->
                                      <v-checkbox
                                        v-else-if="
                                          field.name.includes('is_') ||
                                          field.options.type == 'boolean'
                                        "
                                        v-model="formPIC[field.name]"
                                        density="compact"
                                        color="success"
                                        rounded="lg"
                                        :true-value="true"
                                        :false-value="false"
                                        :error-messages="errorsPIC[field.name]"
                                      ></v-checkbox>
                                      <v-text-field
                                        v-else-if="
                                          field.options.type == 'decimal' ||
                                          field.options.type == 'int'
                                        "
                                        v-model="formPIC[field.name]"
                                        type="number"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :step="
                                          field.options.type == 'int'
                                            ? '0'
                                            : '0.0000'
                                        "
                                        @keyup="
                                          formPIC[field.name] = parseFloat(
                                            formPIC[field.name]
                                          )
                                        "
                                        :error-messages="errorsPIC[field.name]"
                                      ></v-text-field>
                                      <v-text-field
                                        v-else-if="field.name.includes('date')"
                                        v-model="formPIC[field.name]"
                                        type="date"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errorsPIC[field.name]"
                                      ></v-text-field>

                                      <v-json-field
                                        v-else-if="
                                          field.options &&
                                          field.options.type === 'jsonb'
                                        "
                                        v-model="formPIC[field.name]"
                                        class="mb-8"
                                      />

                                      <v-text-field
                                        v-else-if="field.inputType === 'text'"
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errorsPIC[field.name]"
                                      ></v-text-field>

                                      <v-textarea
                                        v-else-if="
                                          field.inputType === 'textarea'
                                        "
                                        v-model="formPIC[field.name]"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        rows="1"
                                        :error-messages="errorsPIC[field.name]"
                                        auto-grow
                                        style="
                                          white-space: pre-wrap !important;
                                          resize: vertical;
                                        "
                                      ></v-textarea>

                                      <v-select
                                        v-else-if="field.inputType === 'select'"
                                        v-model="formPIC[field.name]"
                                        :items="field.enums"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        item-title="key"
                                        item-value="value"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errorsPIC[field.name]"
                                      ></v-select>

                                      <v-text-field
                                        v-else
                                        v-model="formPIC[field.name]"
                                        :type="field.inputType || 'text'"
                                        :rules="field.rules"
                                        :clearable="field.clearable || false"
                                        :required="field.required || false"
                                        :placeholder="field.label || ''"
                                        variant="outlined"
                                        density="compact"
                                        rounded="lg"
                                        color="primary"
                                        :error-messages="errorsPIC[field.name]"
                                      ></v-text-field>
                                    </template>
                                  </v-col>
                                </template>
                              </template>
                            </v-row>
                          </template>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-window-item>
              </v-window>
            </v-col>
          </template>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn
          type="submit"
          color="primary"
          size="large"
          variant="elevated"
          :loading="submitLoading"
          class="px-2"
          min-width="150px"
        >
          Save
        </v-btn>

        <v-btn
          color="primary"
          size="large"
          variant="outlined"
          min-width="150px"
          @click="$router.back()"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </form>
  </v-container>
</template>

<script setup>
definePageMeta({
  ssr: false,
  layout: "admin",
  middleware: ["auth"],
});

// Router for navigation after submission (optional)
const router = useRouter();
const route = useRoute();
const { $apiFetch } = useApi();
const BASE_URL = useRuntimeConfig().public.apiBase + "/";
const form = ref({}); // Form data object
const formPIC = ref({}); // Form data object
const isFormValid = ref(false); // Track form validation status
const mode = ref(route.query.id ? "update" : "create"); // Mode for the form, can be "create" or "update"
const entity = ref("mst-companies");
const isShowFields = ref(false);
const loading = ref(true);
const activeTab = ref("company"); // Active tab for form
const hasPIC = ref(false); // Track if PIC exists
const loadingPIC = ref(true); // Track PIC loading state

// Define fields with configuration
const fieldsOld = ref([
  {
    name: "firebase_uid",
    label: "Firebase UID",
    type: "text",
    rules: [(v) => !!v || "Firebase UID is required"],
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "text",
    inputType: "email",
    rules: [
      (v) => !!v || "Email is required",
      (v) => /.+@.+\..+/.test(v) || "Must be a valid email",
    ],
    required: true,
  },
  {
    name: "user_role",
    label: "User Role",
    type: "select",
    options: ["user", "admin", "manager"],
    rules: [(v) => !!v || "User role is required"],
    required: true,
  },
  {
    name: "company_id",
    label: "Company ID",
    type: "text",
    rules: [
      (v) =>
        v ? /^[0-9a-fA-F-]{36}$/.test(v) || "Must be a valid UUID" : true,
    ],
  },
  {
    name: "company_role",
    label: "Company Role",
    type: "select",
    options: ["owner", "member", "admin"],
  },
  {
    name: "full_name",
    label: "Full Name",
    type: "text",
    rules: [(v) => !!v || "Full name is required"],
    required: true,
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["male", "female", "other"],
  },
  {
    name: "personal_summary",
    label: "Personal Summary",
    type: "textarea",
  },
  {
    name: "availability",
    label: "Availability",
    type: "select",
    options: ["full-time", "part-time", "contract"],
  },
]);

const fields = useState(`${entity.value}fields`, () => []);
const fieldsPIC = useState(`usersfields`, () => []);

const errors = ref({});
const errorsPIC = ref({});

const { regions, debouncedFetchRegions, regionLoading, fetchRegions } =
  useRegionSearch();
const handleInputRegion = (event) => {
  debouncedFetchRegions(event.target.value);
};

const { users, debouncedFetchUsers, userLoading, fetchUsers } = useUserSearch();
const handleInputUser = (event) => {
  debouncedFetchUsers(event.target.value, ["full_name", "email"]);
};

const { models, debouncedFetch, fetch } = useDynamicSearch([
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
const handleInput = (event, entity, fields, endpoint) => {
  debouncedFetch(entity, event.target.value, fields, endpoint);
};

const setAutoComplete = (field, dform = null) => {
  dform = dform || form;
  if (dform.value[field.name]) {
    if (field.name == "region_id") {
      fetchRegions(dform.value[field.name], "id");
    }
    if (["user_id", "following_id"].includes(field.name)) {
      fetchUsers(dform.value[field.name], ["id"]);
    }
    if (field.name == "salary_country_id") {
      fetch(
        "salary_country",
        dform.value[field.name],
        ["id"],
        "mst-salary-country"
      );
    }
    if (
      [
        "skill_id",
        "school_id",
        "interest_id",
        "language_id",
        "profession_id",
        "right_to_work_id",
        "subscription_id",
      ].includes(field.name)
    ) {
      fetch(
        `${field.name.slice(0, -3)}`,
        dform.value[field.name],
        ["id"],
        `mst-${field.name.slice(0, -3)}s`
      );
    }
    if (
      ["interest_ids", "profession_ids", "right_to_work_ids"].includes(
        field.name
      )
    ) {
      fetch(
        `${field.name.slice(0, -4)}`,
        dform.value[field.name],
        ["id"],
        `mst-${field.name.slice(0, -4)}s`
      );
    }
    if (["job_id", "event_id", "group_id", "invoice_id"].includes(field.name)) {
      fetch(
        `${field.name.slice(0, -3)}`,
        dform.value[field.name],
        ["id"],
        `${field.name.slice(0, -3)}s`
      );
    }
    if (field.name == "group_id") {
      fetch("group", dform.value[field.name], ["id"], "groups");
    }
    if (field.name == "paket_id") {
      fetch("paket", dform.value[field.name], ["id"], "event-pakets");
    }
    if (field.name == "invoice_id") {
      fetch("invoice", dform.value[field.name], ["id"], "invoices");
    }
    if (field.name == "industry_id") {
      fetch("industry", dform.value[field.name], ["id"], "mst-industries");
    }
    if (field.name == "company_id") {
      fetch("company", dform.value[field.name], ["id"], "mst-companies");
    }
    if (field.name == "parent_id" && entity == "mst-professions") {
      fetch(
        "parent_profession",
        dform.value[field.name],
        ["id"],
        "mst-professions"
      );
    } else if (field.name == "parent_id") {
      fetch("company", dform.value[field.name], ["id"], "mst-companies");
    }
  }
};

const loadFields = async () => {
  let items = fields.value;
  if (!items.length) {
    items = await $apiFetch(`/fields/${entity.value}`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fields.value.push(item);
        errors.value[item.name] = [];
      });
    }
  }

  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

const loadFieldsPIC = async () => {
  let items = fieldsPIC.value;
  console.log(items);
  if (!items.length) {
    items = await $apiFetch(`/fields/users`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fieldsPIC.value.push(item);
        errorsPIC.value[item.name] = [];
      });
    }
  }
  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

const loadFieldsPICEncrypted = async () => {
  let items = fieldsPIC.value;
  console.log(items);
  if (!items.find((x) => x.name == "encrypted_phone")) {
    items = await $apiFetch(`/fields/encrypted-user-data`);
    if (Array.isArray(items)) {
      items.forEach((item) => {
        fieldsPIC.value.push(item);
        errorsPIC.value[item.name] = [];
      });
    }
  }

  setTimeout(() => {
    isShowFields.value = true;
  }, 100);
  return fields;
};

// Initialize form data with either empty values (for create) or predefined values (for update)
const initializeForm = (data = null) => {
  //Object.assign(form.value, data);
  fields.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    form.value[field.name] = data && data[field.name] ? data[field.name] : null; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          form.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          form.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      form.value[field.name] = data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    setAutoComplete(field);
  });
  loading.value = false;
};

const initializeFormPIC = (data = null) => {
  //Object.assign(form.value, data);
  fieldsPIC.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    formPIC.value[field.name] =
      data && data[field.name] ? data[field.name] : null; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          formPIC.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          formPIC.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      formPIC.value[field.name] =
        data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    if (data && data["id"]) {
      formPIC.value["id"] = data["id"];
    }

    setAutoComplete(field, formPIC);
  });
  loading.value = false;
};

const initializeFormPICEncrypted = (data = null) => {
  //Object.assign(form.value, data);
  fieldsPIC.value.forEach((field) => {
    if (field.options && field.options.enum) {
      field.enums = [];
      Object.keys(field.options.enum).forEach((key) => {
        field.enums.push({ key: key, value: field.options.enum[key] });
      });
    }
    field.rules = [];
    formPIC.value[field.name] =
      data && data[field.name]
        ? data[field.name]
        : formPIC.value[field.name] || null; // Set existing data or empty

    if (field.options) {
      switch (field.options.type) {
        case "boolean":
          formPIC.value[field.name] = form.value[field.name] || false;
          break;
        case "decimal":
          formPIC.value[field.name] = form.value[field.name]
            ? parseFloat(form.value[field.name])
            : null;
          break;
      }
    }

    if (field.name.endsWith("_ids")) {
      formPIC.value[field.name] =
        data && data[field.name] ? data[field.name] : []; // Set existing data or empty
    }

    //setAutoComplete(field);
  });
  loading.value = false;
};

// Initialize form based on mode
onMounted(async () => {
  await loadFields();
  await loadFieldsPIC();
  await loadFieldsPICEncrypted();
  if (mode.value === "update") {
    setTimeout(async () => {
      $apiFetch(`/${entity.value}/search`, {
        params: { id: route.query.id },
      }).then((data) => {
        if (data.items && data.items[0]) {
          initializeForm(data.items[0]); // Load existing data if in update mode
        }
      });
    }, 100);

    setTimeout(async () => {
      // Get PIC using user role assignments (new system)
      // Use /mst-companies/members endpoint which uses user_role_assignments
      loadingPIC.value = true;
      hasPIC.value = false;

      try {
        const membersResponse = await $apiFetch(`/mst-companies/members`, {
          params: {
            company_hq_id: route.query.id,
            company_role: "owner_hq",
            limit: 1,
          },
        });

        if (membersResponse.items && membersResponse.items[0]) {
          const picMember = membersResponse.items[0];
          // Get full user data
          const userResponse = await $apiFetch(`/users/search`, {
            params: {
              id: picMember.user_id,
            },
          });

          if (userResponse.items && userResponse.items[0]) {
            const picData = userResponse.items[0];
            initializeFormPIC(picData);
            hasPIC.value = true;

            // Get encrypted data
            $apiFetch(`/encrypted-user-data/search`, {
              params: {
                filters: {
                  user_id: picData.id,
                },
              },
            }).then((data) => {
              if (data.items && data.items[0]) {
                initializeFormPICEncrypted(data.items[0]);
              }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching PIC:", error);
      } finally {
        loadingPIC.value = false;
      }
    }, 100);
  } else {
    initializeForm();
    initializeFormPIC();
    initializeFormPICEncrypted();
    loadingPIC.value = false;
    hasPIC.value = false;
  }
});

// Submit handler
const submitLoading = ref(false);
const providerErrors = ref([]);
const onSubmit = async () => {
  Object.keys(errors.value).forEach((key) => {
    errors.value[key] = [];
  });
  console.log(form.value);
  Object.keys(form.value).forEach((key) => {
    if (
      !form.value[key] &&
      form.value[key] !== 0 &&
      form.value[key] !== false
    ) {
      delete form.value[key];
    }
  });

  let result = false;
  try {
    submitLoading.value = true;
    if (mode.value === "create") {
      $apiFetch(`/${entity.value}`, {
        method: "POST",
        body: form.value,
      });
      console.log("Creating entry:", form.value);
    } else {
      delete form.value.id;
      $apiFetch(`/${entity.value}/${route.query.id}`, {
        method: "PATCH",
        body: form.value,
      });
      console.log("Updating entry:", form.value);
    }
    result = await onSubmitPIC();
    //submitLoading.value = false;
    // Optionally, redirect after form submission
    if (result) {
      router.back();
    }
  } catch (error) {
    submitLoading.value = false;
    console.log(error.response);
    if (
      error.response &&
      error.response._data &&
      error.response._data.message
    ) {
      const errorMessages = error.response._data.message;
      if (Array.isArray(errorMessages)) {
        Object.keys(errors.value).forEach((key) => {
          errorMessages.forEach((errMsg) => {
            if (errMsg.includes(key)) {
              errors.value[key].push(errMsg);
            }
          });
        });
      } else {
        providerErrors.value.push(errorMessages);
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
    }
  }
};

const onSubmitPIC = async () => {
  Object.keys(errorsPIC.value).forEach((key) => {
    errorsPIC.value[key] = [];
  });
  Object.keys(formPIC.value).forEach((key) => {
    if (
      !formPIC.value[key] &&
      formPIC.value[key] !== 0 &&
      formPIC.value[key] !== false
    ) {
      delete form.value[key];
    }
  });

  try {
    submitLoading.value = true;
    let user = null;
    if (mode.value === "create" || !formPIC.value.id) {
      formPIC.value.company_id = route.query.id;
      user = await $apiFetch(`/${entity.value}/add-member`, {
        method: "POST",
        body: formPIC.value,
      });
    } else {
      const user_id = formPIC.value.id;
      user = await $apiFetch(`/users/${user_id}`, {
        method: "PATCH",
        body: formPIC.value,
      });
    }

    if (user && user.id) {
      const bodyEncrypted = {
        user_id: user.id,
        encrypted_phone: formPIC.value.encrypted_phone,
        encrypted_date_of_birth: formPIC.value.encrypted_date_of_birth,
        encrypted_address: formPIC.value.encrypted_address,
      };
      if (mode.value === "create" || !formPIC.value.id) {
        await $apiFetch(`/encrypted-user-data`, {
          method: "POST",
          body: bodyEncrypted,
        });
      } else {
        await $apiFetch(`/encrypted-user-data/${user.id}`, {
          method: "PATCH",
          body: bodyEncrypted,
        });
      }
    }
    submitLoading.value = false;
    return true;
    // Optionally, redirect after form submission
    //router.back();
  } catch (error) {
    submitLoading.value = false;
    console.log(error.response);
    if (
      error.response &&
      error.response._data &&
      error.response._data.message
    ) {
      const errorMessages = error.response._data.message;
      if (Array.isArray(errorMessages)) {
        Object.keys(errorsPIC.value).forEach((key) => {
          errorMessages.forEach((errMsg) => {
            if (errMsg.includes(key)) {
              errorsPIC.value[key].push(errMsg);
            }
          });
        });
      } else {
        providerErrors.value.push(errorMessages);
      }
    } else {
      providerErrors.value.push(
        "An unexpected error occurred. Please try again."
      );
    }
    return false;
  }
};
</script>
