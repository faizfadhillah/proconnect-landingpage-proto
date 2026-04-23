<template>
  <v-container fluid grid-list-md>
    <v-card-text class="px-1">
      <v-row grid-list-lg dense>
        <v-col cols="12" sm="6" md="4" lg="3" v-for="n in 3" v-if="loading">
          <v-skeleton-loader type="list-item-two-line"></v-skeleton-loader>
        </v-col>
        <template v-else>
          <v-col cols="12" md="8">
            <v-card title="Route Assignment">
              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-row class="pa-3">
                      <v-text-field
                        v-model="routeFrom.search"
                        label="Search"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        hide-details
                        single-line
                        class="mr-3"
                        density="compact"
                        clearable
                      ></v-text-field>
                      <v-spacer />
                      <v-btn
                        color="success"
                        :loading="routeFrom.loadingSubmit"
                        @click="assignRoutes"
                        >assign <v-icon right>mdi-arrow-right</v-icon></v-btn
                      >
                    </v-row>
                    <v-row class="pr-3">
                      <v-data-table
                        :headers="routeFrom.headers"
                        :items="routeFrom.items"
                        :loading="routeFrom.loading"
                        :search="routeFrom.search"
                        v-model="routeFrom.selected"
                        item-selectable="selectable"
                        item-value="identifier"
                        items-per-page="20"
                        show-select
                        density="compact"
                      ></v-data-table>
                    </v-row>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-row class="pa-3">
                      <v-btn
                        color="warning"
                        :loading="routeTo.loadingSubmit"
                        @click="revokeRoutes"
                        ><v-icon right>mdi-arrow-left</v-icon> revoke</v-btn
                      >
                      <v-spacer />
                      <v-text-field
                        v-model="routeTo.search"
                        label="Search"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        hide-details
                        single-line
                        class="mr-3"
                        density="compact"
                        clearable
                      ></v-text-field>
                    </v-row>
                    <v-row class="pl-3">
                      <v-data-table
                        :headers="routeTo.headers"
                        :items="routeTo.items"
                        :loading="routeTo.loading"
                        :search="routeTo.search"
                        v-model="routeTo.selected"
                        item-selectable="selectable"
                        item-value="identifier"
                        items-per-page="20"
                        show-select
                        density="compact"
                      ></v-data-table>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card title="Menu Assignment">
              <v-card-text>
                <v-list
                  v-model:selected="menuSelections"
                  select-strategy="leaf"
                >
                  <template v-for="item in menuItems" :key="item.title">
                    <v-list-group
                      :prepend-icon="item.icon"
                      v-if="item.children"
                    >
                      <template v-slot:activator="{ props }">
                        <v-list-item
                          rounded="lg"
                          v-bind="props"
                          :prepend-icon="item.icon"
                          :title="item.title"
                          :value="item.id"
                          color="primary"
                        >
                          <template v-slot:prepend="{ isSelected }">
                            <v-list-item-action start>
                              <v-checkbox-btn
                                :model-value="isItemSelected(item)"
                                @update:model-value="
                                  (isSelected) =>
                                    toggleSelection(item, isSelected)
                                "
                              ></v-checkbox-btn>
                            </v-list-item-action>
                            <v-icon :icon="item.icon"></v-icon>
                          </template>
                        </v-list-item>
                      </template>

                      <template
                        v-for="child in item.children"
                        :key="child.title"
                      >
                        <v-list-item
                          v-if="!child.children"
                          rounded="lg"
                          color="primary"
                          :value="child.id"
                        >
                          <template v-slot:prepend="{ isSelected }">
                            <v-list-item-action start>
                              <v-checkbox-btn
                                :model-value="isSelected"
                              ></v-checkbox-btn>
                            </v-list-item-action>
                            <v-icon :icon="child.icon"></v-icon>
                          </template>
                          <v-list-item-title
                            v-text="child.title"
                          ></v-list-item-title>
                        </v-list-item>

                        <v-list-group
                          :prepend-icon="child.icon"
                          v-if="child.children"
                        >
                          <template v-slot:activator="{ props }">
                            <v-list-item
                              rounded="lg"
                              v-bind="props"
                              color="primary"
                              :prepend-icon="child.icon"
                              :title="child.title"
                              :value="child.id"
                            >
                              <template v-slot:prepend="{ isSelected }">
                                <v-list-item-action start>
                                  <v-checkbox-btn
                                    :model-value="isItemSelected(child)"
                                    @update:model-value="
                                      (isSelected) =>
                                        toggleSelection(child, isSelected)
                                    "
                                  ></v-checkbox-btn>
                                </v-list-item-action>
                                <v-icon :icon="child.icon"></v-icon>
                              </template>
                            </v-list-item>
                          </template>

                          <v-list-item
                            rounded="lg"
                            color="primary"
                            v-for="subChild in child.children"
                            :key="subChild.title"
                            :value="subChild.id"
                          >
                            <template v-slot:prepend="{ isSelected }">
                              <v-list-item-action start>
                                <v-checkbox-btn
                                  :model-value="isSelected"
                                ></v-checkbox-btn>
                              </v-list-item-action>
                              <v-icon :icon="subChild.icon"></v-icon>
                            </template>
                            <v-list-item-title
                              v-text="subChild.title"
                            ></v-list-item-title>
                          </v-list-item>
                        </v-list-group>
                      </template>
                    </v-list-group>
                    <div class="text-caption px-2 py-2" v-else-if="item.group">
                      <v-checkbox-btn
                        :model-value="isItemSelected(item)"
                        @update:model-value="
                          (isSelected) => toggleSelection(item, isSelected)
                        "
                        :label="item.group"
                      ></v-checkbox-btn>
                    </div>
                    <!-- Fallback for items without children -->
                    <v-list-item
                      v-else-if="!item.children"
                      color="primary"
                      rounded="lg"
                      :value="item.id"
                    >
                      <template v-slot:prepend="{ isSelected }">
                        <v-list-item-action start>
                          <v-checkbox-btn
                            :model-value="isSelected"
                          ></v-checkbox-btn>
                        </v-list-item-action>
                        <v-icon :icon="item.icon"></v-icon>
                      </template>
                      <v-list-item-title
                        v-text="item.title"
                      ></v-list-item-title>
                    </v-list-item>
                  </template>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </template>
        <!-- Loop through fields and conditionally render based on field type -->
      </v-row>
    </v-card-text>
  </v-container>
</template>
<script setup>
const props = defineProps({
  rolePermission: {
    type: String,
    required: true,
  },
  meta: {
    type: Object,
    required: false,
  },
});

const route = useRoute();
const { $apiFetch } = useApi();

const mode = ref(route.query.id ? "update" : "create");
const loading = ref(true);
const role_permission = ref(props.rolePermission);

const routeFrom = ref({
  loading: false,
  loadingSubmit: false,
  search: "",
  headers: [
    {
      title: "Path",
      align: "start",
      key: "path",
    },
    { title: "Method", align: "start", key: "method" },
  ],
  items: [],
  selected: [],
});
const getFromRoutes = async () => {
  routeFrom.value.loading = true;
  $apiFetch("/rbac/all-routes", {
    params: { role: role_permission.value },
  }).then((data) => {
    routeFrom.value.items = data.items.map((d) => {
      d.identifier = d.path + "|" + d.method;
      return d;
    });
    routeFrom.value.loading = false;
  });
};

const routeTo = ref({
  loading: false,
  loadingSubmit: false,
  search: "",
  headers: [
    {
      title: "Path",
      align: "start",
      key: "name",
    },
    { title: "Method", align: "start", key: "method" },
  ],
  items: [],
  selected: [],
});
const getToRoutes = async () => {
  routeTo.value.loading = true;
  $apiFetch("/rbac/search", {
    params: {
      filters: {
        role_permission: role_permission.value,
      },
      limit: 1000,
    },
  }).then((data) => {
    routeTo.value.items = data.items.map((d) => {
      d.identifier = d.name + "|" + d.method;
      return d;
    });
    routeTo.value.loading = false;
  });
};

const assignRoutes = async () => {
  routeFrom.value.loadingSubmit = true;
  $apiFetch("/rbac/assign-routes", {
    method: "POST",
    body: {
      rolePermission: role_permission.value,
      routes: routeFrom.value.selected,
    },
  }).then(() => {
    routeFrom.value.loadingSubmit = false;
    routeFrom.value.selected = [];
    getFromRoutes();
    getToRoutes();
  });
};

const revokeRoutes = async () => {
  routeTo.value.loadingSubmit = true;
  $apiFetch("/rbac/revoke-routes", {
    method: "POST",
    body: {
      rolePermission: role_permission.value,
      routes: routeTo.value.selected,
    },
  }).then(() => {
    routeTo.value.loadingSubmit = false;
    routeTo.value.selected = [];
    getFromRoutes();
    getToRoutes();
  });
};

onMounted(() => {
  loading.value = false;
  getFromRoutes();
  getToRoutes();
  getAllMenus();
});

const onSubmit = () => {};

const menuSelections = ref(props.meta ? props.meta.menus || [] : []);
const menuItems = ref();
const getAllMenus = async () => {
  $apiFetch("/rbac/all-menus").then((data) => {
    menuItems.value = data;
  });
};
const emit = defineEmits(["update-menus"]);
watch(
  () => menuSelections.value,
  (nval) => {
    console.log(menuSelections.value);
    emit("update-menus", menuSelections.value);
  }
);
const isItemSelected = (item) => {
  if (item.children) {
    // A parent is selected if all its children are selected
    //return item.children.every((child) => isItemSelected(child));
  }
  return menuSelections.value.includes(item.id);
};

const toggleSelection = (item, isSelected) => {
  if (item.children) {
    // Select or deselect all children
    //item.children.forEach((child) => toggleSelection(child, isSelected));
  }
  if (isSelected) {
    if (!menuSelections.value.includes(item.id)) {
      menuSelections.value.push(item.id);
    }
  } else {
    menuSelections.value = menuSelections.value.filter((id) => id !== item.id);
  }
};
</script>
