import { debounce } from "~/utils/debounce";

export function useInterviewerSearch() {
  const { $apiFetch } = useApi();
  const interviewers = ref([]);
  const interviewerLoading = ref(false);

  const fetchInterviewers = async (
    query,
    company_id,
    company_hq_id,
    fields = ["full_name", "email"]
  ) => {
    if (!query && !company_id) {
      return;
    }

    interviewerLoading.value = true;
    try {
      const filters = {};

      // Add company_id filter if provided
      filters.company_hq_id = company_hq_id || company_id;
      filters.company_id = company_id;

      // Add search query if provided
      if (query) {
        fields.forEach((field) => {
          filters[field] = query;
        });
        //filters.orWhere = fields;
      }

      const data = await $apiFetch(`/mst-companies/members`, {
        params: { ...filters, limit: 20 },
      });

      /*ata.items = data.items.map((user) => {
        return {
          ...user,
          displayText: `${user.full_name} (${user.company_role})`,
        };
      });*/
      // Fetch encrypted data for all users to get phone numbers

      data.items = data.items.map((user) => {
        return {
          ...user,
          displayText: `${user.full_name} (${capitalizeWords(
            user.company_role
          )})`,
          phone: user.encrypted_phone || null,
          date_of_birth: user.encrypted_date_of_birth || null,
          nik: user.encrypted_nik || null,
          address: user.encrypted_address || null,
        };
      });

      const combined = [...interviewers.value, ...data.items];
      const uniqueInterviewers = Array.from(
        new Map(combined.map((item) => [item.user_id, item])).values()
      );
      interviewers.value = uniqueInterviewers;

      console.log(interviewers.value);
    } catch (error) {
      console.error(error);
      interviewers.value = [];
    } finally {
      interviewerLoading.value = false;
    }
  };

  const debouncedFetchInterviewers = debounce(fetchInterviewers, 500);

  return {
    interviewers,
    interviewerLoading,
    debouncedFetchInterviewers,
    fetchInterviewers,
  };
}
