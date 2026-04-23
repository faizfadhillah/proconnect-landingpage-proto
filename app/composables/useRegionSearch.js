// composables/useRegionSearch.js
import { debounce } from "~/utils/debounce";

export function useRegionSearch() {
  const { $apiFetch } = useApi();
  const regions = ref([]);
  const regionLoading = ref(false);

  const fetchRegions = async (query, field = "name") => {
    if (!query) {
      regions.value = [];
      return;
    }
    regionLoading.value = true;
    try {
      const data = await $apiFetch(`/mst-regions/search`, {
        params: { filters: { [field]: query, and: true, type: "kota" } },
      });
      regions.value = Array.from(
        new Map(
          [...regions.value, ...(data.items || [])].map((item) => [
            item.id,
            item,
          ])
        ).values()
      );
    } catch (error) {
      console.error(error);
      regions.value = [];
    } finally {
      regionLoading.value = false;
    }
  };

  const debouncedFetchRegions = debounce(fetchRegions, 300);

  return { regions, regionLoading, debouncedFetchRegions, fetchRegions };
}
