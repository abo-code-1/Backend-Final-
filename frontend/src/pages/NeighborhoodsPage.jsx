import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Search } from "lucide-react";
import Input from "../components/common/Input";
import PageHeader from "../components/common/PageHeader";
import { cn } from "../utils/cn";
import { useCities } from "../hooks/useCities";
import { useNeighborhoods } from "../hooks/useNeighborhoods";

const DEFAULT_NEIGHBORHOOD_IMAGE =
  "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&q=60";

const handleImageError = (event) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_NEIGHBORHOOD_IMAGE;
};

export default function NeighborhoodsPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const { cities, cityLabel } = useCities();
  const { neighborhoods } = useNeighborhoods();
  const cityImages = Object.fromEntries(cities.map((c) => [c.value, c.img]));
  const cityTabs = [
    { key: "all", label: "Все" },
    ...cities.map((c) => ({ key: c.value, label: c.label })),
  ];

  const filtered = neighborhoods.filter(
    (n) =>
      (tab === "all" || n.citySlug === tab) &&
      (!q || n.name.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <PageHeader
        eyebrow="Районы"
        title="Изучайте районы перед переездом"
        subtitle="Цены, атмосфера, плюсы и минусы — все в одном месте."
      />

      <div className="mt-8 flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {cityTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 h-10 rounded-full text-sm font-semibold border transition-all shrink-0",
                tab === t.key
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Поиск района..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((n) => (
          <Link
            key={`${n.citySlug}-${n.id || n.name}`}
            to={`/listings?city=${n.citySlug}&district=${encodeURIComponent(n.name)}`}
            className="group rounded-2xl border overflow-hidden hover:shadow-card transition-shadow"
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={n.imageUrl || cityImages[n.citySlug] || DEFAULT_NEIGHBORHOOD_IMAGE}
                alt={n.name}
                onError={handleImageError}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                  {n.cityName || cityLabel(n.citySlug)}
                </p>
              </div>
              <h3 className="mt-1 text-xl font-bold">{n.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {n.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {(n.tags || []).map((t) => (
                  <span
                    key={t}
                    className="text-[11px] bg-muted px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="font-semibold">{n.priceLabel || "Смотреть жильё"}</p>
                {n.trendLabel && (
                  <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                    <TrendingUp size={12} /> {n.trendLabel}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Ничего не найдено.
          </div>
        )}
      </div>
    </div>
  );
}
