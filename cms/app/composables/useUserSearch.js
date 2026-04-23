// composables/useRegionSearch.js
import { debounce } from "~/utils/debounce";

export function useUserSearch() {
  const { $apiFetch } = useApi();
  const models = ref([]);
  const modelLoading = ref(false);

  const fetchModels = async (query, fields = ["full_name", "email"]) => {
    if (!query) {
      return;
    }
    modelLoading.value = true;
    try {
      const filters = {};
      fields.forEach((field) => {
        filters[field] = query;
      });
      filters.orWhere = fields;
      const data = await $apiFetch(`/users/search`, {
        params: { filters: filters },
      });
      data.items = data.items.map((event) => {
        return {
          ...event,
          ...{ displayText: event.full_name + " " + event.email },
        };
      });
      const combined = [...models.value, ...data.items];
      const uniqueModels = Array.from(
        new Map(combined.map((item) => [item.id, item])).values()
      );
      models.value = uniqueModels;
    } catch (error) {
      console.error(error);
      models.value = [];
    } finally {
      modelLoading.value = false;
    }
  };

  const users = models;
  const debouncedFetchUsers = debounce(fetchModels, 500);
  const fetchUsers = fetchModels;
  const userLoading = modelLoading;

  return { users, userLoading, debouncedFetchUsers, fetchUsers };
}
