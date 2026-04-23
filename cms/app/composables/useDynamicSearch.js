// composables/useRegionSearch.js
import { debounce } from "~/utils/debounce";

export function useDynamicSearch(entities = []) {
  const { $apiFetch } = useApi();
  const models = ref({});
  entities.forEach((entiti) => {
    models.value[entiti] = { items: [], loading: false };
  });

  const capitalize = (string) => {
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const fetch = async (entity, query, fields = ["name"], endpoint, limit = 20) => {
    if (!query || (Array.isArray(query) && query.length == 0)) {
      return;
    }

    models.value[entity].loading = true;
    endpoint = endpoint.replace(/_/g, "-");

    try {
      const filters = [];
      if (Array.isArray(fields)) {
        fields.forEach((field) => {
          filters.push({ [field]: query == "-1" ? "" : query });
        });
      } else {
        filters.push({ [fields]: query == "-1" ? "" : query });
      }

      const data = await $apiFetch(`/${endpoint || entity}/search`, {
        params: { filters: filters, limit: limit },
      });
      // Create unique items by combining existing and new items

      let combinedItems = [...models.value[entity].items, ...data.items];
      combinedItems = combinedItems.map((item) => {
        if (item.name) {
          item.name = capitalize(item.name);
        }
        return item;
      });
      models.value[entity].items = Array.from(
        new Map(combinedItems.map((item) => [item.id, item])).values()
      );
    } catch (error) {
      console.error(error);
      models.value[entity].items = [];
    } finally {
      models.value[entity].loading = false;
    }
  };

  const debouncedFetch = debounce(fetch, 400);

  return { models, debouncedFetch, fetch };
}
