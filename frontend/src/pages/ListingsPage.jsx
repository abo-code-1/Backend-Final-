import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  X
} from "lucide-react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Checkbox from "../components/common/Checkbox";
import Badge from "../components/common/Badge";
import { Card, CardContent, CardFooter } from "../components/common/Card";
import { cn } from "../utils/cn";

const cityOptions = [
  { label: "Все города", value: "" },
  { label: "Алматы", value: "almaty" },
  { label: "Астана", value: "astana" },
  { label: "Шымкент", value: "shymkent" },
];

const sortOptions = [
  { label: "Сначала новые", value: "newest" },
  { label: "Дешевле", value: "price_asc" },
  { label: "Дороже", value: "price_desc" },
];

export default function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const filters = useMemo(() => {
    return {
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
    };
  }, [searchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      const response = await apiClient.get("/listings", { params: filters });
      return response.data;
    },
    keepPreviousData: true,
  });

  const updateFilters = (newFilters) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });
    nextParams.set("page", "1"); // Reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  const setPage = (page) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(page));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const listings = data?.items || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const FilterSidebar = ({ className }) => (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <SlidersHorizontal size={18} />
          Фильтры
        </h3>
        <button 
          onClick={clearFilters}
          className="text-xs text-primary hover:underline font-medium"
        >
          Сбросить все
        </button>
      </div>

      <div className="space-y-6">
        <Select
          label="Город"
          value={filters.city}
          onChange={(e) => updateFilters({ city: e.target.value })}
          options={cityOptions}
        />

        <Input
          label="Район"
          placeholder="Например, Бостандыкский"
          value={filters.district}
          onChange={(e) => updateFilters({ district: e.target.value })}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium">Бюджет (₸)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="От"
              value={filters.minPrice}
              onChange={(e) => updateFilters({ minPrice: e.target.value })}
            />
            <Input
              type="number"
              placeholder="До"
              value={filters.maxPrice}
              onChange={(e) => updateFilters({ maxPrice: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h4 className="text-sm font-semibold">Удобства</h4>
          <Checkbox
            label="Меблировано"
            id="furnished"
            checked={filters.furnished === "true"}
            onChange={(e) => updateFilters({ furnished: e.target.checked ? "true" : "" })}
          />
          <Checkbox
            label="Интернет включен"
            id="internetIncluded"
            checked={filters.internetIncluded === "true"}
            onChange={(e) => updateFilters({ internetIncluded: e.target.checked ? "true" : "" })}
          />
          <Checkbox
            label="Только с фото"
            id="hasPhotos"
            checked={filters.hasPhotos === "true"}
            onChange={(e) => updateFilters({ hasPhotos: e.target.checked ? "true" : "" })}
          />
          <Checkbox
            label="Верифицированные"
            id="verified"
            checked={filters.verifiedHostsOnly === "true"}
            onChange={(e) => updateFilters({ verifiedHostsOnly: e.target.checked ? "true" : "" })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Top Header/Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Поиск жилья</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Загрузка..." : `Найдено ${pagination.total} вариантов`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-muted p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5 rounded-md", viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn("p-1.5 rounded-md", viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              <ListIcon size={18} />
            </button>
          </div>
          
          <Select
            className="w-[180px]"
            value={filters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            options={sortOptions}
          />
          
          <Button 
            variant="outline" 
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Filter size={18} className="mr-2" />
            Фильтры
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-24 h-fit">
          <Card>
            <CardContent className="p-6">
              <FilterSidebar />
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/40 z-50 md:hidden"
              />
              <motion.aside
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-[300px] bg-background z-50 p-6 shadow-2xl md:hidden overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">Фильтры</h2>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-accent rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <FilterSidebar />
                <div className="mt-8 pt-6 border-t">
                  <Button className="w-full" onClick={() => setIsSidebarOpen(false)}>
                    Показать результаты
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[400px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed">
              <p className="text-destructive font-semibold">Произошла ошибка при загрузке</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Попробовать снова
              </Button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed">
              <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground mb-6">Попробуйте изменить параметры поиска или сбросить фильтры.</p>
              <Button onClick={clearFilters}>Сбросить все фильтры</Button>
            </div>
          ) : (
            <motion.div 
              layout
              className={cn(
                "grid gap-6",
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                  : "grid-cols-1"
              )}
            >
              {listings.map((listing) => (
                <motion.div
                  layout
                  key={listing.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={listing.photos?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"}
                        alt={listing.title}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                        {listing.host?.isIdVerified && (
                          <Badge variant="success" className="shadow-sm">Проверено</Badge>
                        )}
                        <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-white/80">
                          {listing.city}
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md px-3 py-1 text-sm font-bold shadow-lg">
                          {Number(listing.monthlyRent).toLocaleString("ru-RU")} ₸
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center text-muted-foreground text-sm gap-1 mb-4">
                        <MapPin size={14} className="text-primary" />
                        <span className="line-clamp-1">{listing.district || "Район не указан"}, {listing.city}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{listing.availableRooms} / {listing.totalRooms}</span>
                          <span className="text-[10px] uppercase tracking-wider">Комнат</span>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">
                            {listing.furnished ? "Есть" : "Нет"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider">Мебель</span>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">
                            {listing.internetIncluded ? "Да" : "Нет"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider">Wi-Fi</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-5 pt-0">
                      <Button 
                        asChild 
                        className="w-full font-bold h-12"
                        onClick={() => window.location.href = `/listings/${listing.id}`}
                      >
                        Посмотреть детали
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {!isLoading && listings.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                <ChevronLeft size={20} />
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Only show current, first, last and 1 around current
                  if (
                    page === 1 || 
                    page === pagination.totalPages || 
                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={pagination.page === page ? "primary" : "ghost"}
                        size="sm"
                        className="w-10 h-10"
                        onClick={() => setPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (
                    page === pagination.page - 2 || 
                    page === pagination.page + 2
                  ) {
                    return <span key={page} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
