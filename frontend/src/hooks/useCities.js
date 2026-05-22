import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { CITIES as FALLBACK } from "../constants/cities";

// Cities are a super-admin-managed DB resource. We fetch them once (cached by
// React Query under the "cities" key) and fall back to the static catalogue
// while loading / offline so dropdowns are never empty. Mutations in the
// admin UI invalidate the "cities" key to refresh every consumer.
const normalize = (rows) =>
  rows.map((c) => ({ value: c.slug, label: c.nameRu, img: c.imageUrl || null }));

export function useCities({ includeAll = false } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const res = await apiClient.get("/cities");
      return normalize(res.data.items || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const cities = data && data.length ? data : FALLBACK;
  const labels = Object.fromEntries(cities.map((c) => [c.value, c.label]));
  const cityLabel = (value) => labels[value] || value;
  const cityOptions = includeAll
    ? [
        { label: "Все города", value: "" },
        ...cities.map(({ value, label }) => ({ value, label })),
      ]
    : cities.map(({ value, label }) => ({ value, label }));

  return { cities, cityOptions, cityLabel, isLoading };
}
