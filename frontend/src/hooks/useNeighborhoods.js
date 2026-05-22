import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { NEIGHBORHOODS as FALLBACK } from "../constants/neighborhoods";

const normalize = (rows) =>
  rows.map((n) => ({
    id: n.id,
    cityId: n.cityId,
    citySlug: n.citySlug,
    cityName: n.cityName,
    name: n.name,
    description: n.description || "",
    imageUrl: n.imageUrl || "",
    priceLabel: n.priceLabel || "",
    trendLabel: n.trendLabel || "",
    tags: n.tags || [],
    isActive: n.isActive,
    sortOrder: n.sortOrder ?? 0,
  }));

export function useNeighborhoods({ city = "" } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["neighborhoods", city],
    queryFn: async () => {
      const res = await apiClient.get("/neighborhoods", {
        params: city ? { city } : undefined,
      });
      return normalize(res.data.items || []);
    },
    staleTime: 5 * 60 * 1000,
  });

  const fallback = city
    ? FALLBACK.filter((item) => item.citySlug === city)
    : FALLBACK;
  const neighborhoods = data ?? fallback;

  return { neighborhoods, isLoading };
}
