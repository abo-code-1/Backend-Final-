import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { useSelector } from "react-redux";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Checkbox from "../components/common/Checkbox";
import ListingCard from "../components/listings/ListingCard";
import ListingSkeleton from "../components/listings/ListingSkeleton";
import EmptyState from "../components/common/EmptyState";
import Pagination from "../components/common/Pagination";
import { useCities } from "../hooks/useCities";
import { useNeighborhoods } from "../hooks/useNeighborhoods";

const SORT_OPTIONS = [
  { label: "Сначала новые", value: "newest" },
  { label: "Сначала дешевле", value: "price_asc" },
  { label: "Сначала дороже", value: "price_desc" },
];

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { token } = useSelector((s) => s.auth);
  const queryClient = useQueryClient();

  const filters = useMemo(
    () => ({
      city: searchParams.get("city") || "",
      district: searchParams.get("district") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sort: searchParams.get("sort") || "newest",
      page: searchParams.get("page") || "1",
      furnished: searchParams.get("furnished") || "",
      internetIncluded: searchParams.get("internetIncluded") || "",
      verifiedHostsOnly: searchParams.get("verifiedHostsOnly") || "",
      hasPhotos: searchParams.get("hasPhotos") || "",
    }),
    [searchParams]
  );

  const activeFilterCount = [
    filters.city,
    filters.district,
    filters.minPrice,
    filters.maxPrice,
    filters.furnished,
    filters.internetIncluded,
    filters.verifiedHostsOnly,
    filters.hasPhotos,
  ].filter(Boolean).length;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/listings", { params: filters });
      return data;
    },
    keepPreviousData: true,
  });

  const { data: favoriteMap = {} } = useQuery({
    queryKey: ["favorites-map"],
    queryFn: async () => {
      if (!token) return {};
      const { data } = await apiClient.get("/favorites");
      const map = {};
      (data.items || []).forEach((f) => {
        map[f.listing.id] = true;
      });
      return map;
    },
    enabled: !!token,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (listing) => {
      if (!token) {
        toast.info("Войдите, чтобы добавлять в избранное");
        throw new Error("no-auth");
      }
      if (favoriteMap[listing.id]) {
        await apiClient.delete(`/favorites/${listing.id}`);
      } else {
        await apiClient.post("/favorites", { listingId: Number(listing.id) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites-map"] });
    },
  });

  const updateFilters = (patch, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (resetPage) next.set("page", "1");
    setSearchParams(next);
  };

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => setSearchParams(new URLSearchParams());

  const listings = data?.items || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div>
      {/* TOP BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Поиск жилья</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Загружаем..."
              : `Найдено ${pagination.total} ${pluralize(pagination.total)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            className="h-11 w-[200px]"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            options={SORT_OPTIONS}
          />
          <Button
            variant="outline"
            className="lg:hidden relative"
            onClick={() => setDrawerOpen(true)}
          >
            <SlidersHorizontal size={16} />
            Фильтры
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <FiltersPanel
              filters={filters}
              onChange={updateFilters}
              onClear={clearAll}
            />
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 240, damping: 26 }}
                className="fixed inset-y-0 right-0 z-50 w-[360px] max-w-[92vw] bg-background p-6 overflow-y-auto lg:hidden shadow-pop"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Фильтры</h2>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
                <FiltersPanel
                  filters={filters}
                  onChange={updateFilters}
                  onClear={clearAll}
                />
                <div className="mt-8 pt-6 border-t flex gap-2">
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    className="flex-1"
                  >
                    Сбросить
                  </Button>
                  <Button
                    onClick={() => setDrawerOpen(false)}
                    className="flex-1"
                  >
                    Показать {pagination.total}
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* RESULTS */}
        <section>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ListingSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={Search}
              title="Не удалось загрузить"
              description="Проверьте соединение и попробуйте обновить страницу."
              action={
                <Button onClick={() => window.location.reload()}>
                  Обновить
                </Button>
              }
            />
          ) : listings.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Ничего не найдено"
              description="Попробуйте изменить параметры поиска или сбросить фильтры."
              action={<Button onClick={clearAll}>Сбросить фильтры</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorite={!!favoriteMap[listing.id]}
                    onToggleFavorite={(l) => toggleFavorite.mutate(l)}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onChange={setPage}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function FiltersPanel({ filters, onChange, onClear }) {
  const { cityOptions } = useCities({ includeAll: true });
  const { neighborhoods } = useNeighborhoods({ city: filters.city });
  const districtOptions = [
    { label: "Все районы", value: "" },
    ...neighborhoods.map((n) => ({
      key: `${n.citySlug}-${n.id || n.name}`,
      label: filters.city ? n.name : `${n.name} · ${n.cityName}`,
      value: n.name,
    })),
  ];

  return (
    <div className="rounded-2xl border p-5 space-y-5 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Фильтры</h3>
        <button
          onClick={onClear}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Сбросить
        </button>
      </div>

      <Select
        label="Город"
        value={filters.city}
        onChange={(e) => onChange({ city: e.target.value, district: "" })}
        options={cityOptions}
      />

      <Select
        label="Район"
        value={filters.district}
        onChange={(e) => onChange({ district: e.target.value })}
        options={districtOptions}
      />

      <div>
        <label className="text-sm font-semibold">Бюджет, ₸</label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <Input
            type="number"
            placeholder="От"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <Input
            type="number"
            placeholder="До"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-1">
        <h4 className="text-sm font-semibold mb-3">Удобства</h4>
        <div className="space-y-2.5">
          <Checkbox
            id="f-furn"
            label="С мебелью"
            checked={filters.furnished === "true"}
            onChange={(e) =>
              onChange({ furnished: e.target.checked ? "true" : "" })
            }
          />
          <Checkbox
            id="f-wifi"
            label="Интернет включён"
            checked={filters.internetIncluded === "true"}
            onChange={(e) =>
              onChange({ internetIncluded: e.target.checked ? "true" : "" })
            }
          />
          <Checkbox
            id="f-pic"
            label="Только с фото"
            checked={filters.hasPhotos === "true"}
            onChange={(e) =>
              onChange({ hasPhotos: e.target.checked ? "true" : "" })
            }
          />
          <Checkbox
            id="f-ver"
            label="Проверенные хозяева"
            checked={filters.verifiedHostsOnly === "true"}
            onChange={(e) =>
              onChange({ verifiedHostsOnly: e.target.checked ? "true" : "" })
            }
          />
        </div>
      </div>
    </div>
  );
}

function pluralize(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "вариант";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "варианта";
  return "вариантов";
}
