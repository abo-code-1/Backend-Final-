import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Search } from "lucide-react";
import Input from "../components/common/Input";
import PageHeader from "../components/common/PageHeader";
import { cn } from "../utils/cn";

const NEIGHBORHOODS = [
  {
    city: "almaty",
    name: "Медеу",
    description: "Премиальный район у подножия гор. Чистый воздух и красивые виды.",
    price: "От 180 000 ₸",
    trend: "+8%",
    img: "https://images.unsplash.com/photo-1549893077-a3caa2f9b6c3?auto=format&fit=crop&w=800&q=60",
    tags: ["Горы", "Тишина", "Экология"],
  },
  {
    city: "almaty",
    name: "Бостандык",
    description: "Много университетов, кафе, доступно для студентов.",
    price: "От 90 000 ₸",
    trend: "+5%",
    img: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?auto=format&fit=crop&w=800&q=60",
    tags: ["Студенты", "Кафе", "Метро"],
  },
  {
    city: "almaty",
    name: "Алмалинский",
    description: "Центр города, пешком до работы в офисах и бизнес-центрах.",
    price: "От 150 000 ₸",
    trend: "+6%",
    img: "https://images.unsplash.com/photo-1519642918688-7e43b19245d8?auto=format&fit=crop&w=800&q=60",
    tags: ["Центр", "Работа", "Метро"],
  },
  {
    city: "astana",
    name: "Есильский",
    description: "Современные ЖК, небоскрёбы, деловой центр столицы.",
    price: "От 140 000 ₸",
    trend: "+10%",
    img: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=800&q=60",
    tags: ["Новостройки", "Деловой"],
  },
  {
    city: "astana",
    name: "Сарыарка",
    description: "Спокойный район рядом с парками и торговыми центрами.",
    price: "От 95 000 ₸",
    trend: "+3%",
    img: "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&q=60",
    tags: ["Парки", "Семьи"],
  },
  {
    city: "shymkent",
    name: "Аль-Фараби",
    description: "Центр Шымкента, активная жизнь, рынки и магазины.",
    price: "От 70 000 ₸",
    trend: "+4%",
    img: "https://images.unsplash.com/photo-1528901166007-3784c7dd3653?auto=format&fit=crop&w=800&q=60",
    tags: ["Центр", "Магазины"],
  },
];

const CITY_TABS = [
  { key: "all", label: "Все" },
  { key: "almaty", label: "Алматы" },
  { key: "astana", label: "Астана" },
  { key: "shymkent", label: "Шымкент" },
];

export default function NeighborhoodsPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const filtered = NEIGHBORHOODS.filter(
    (n) =>
      (tab === "all" || n.city === tab) &&
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
          {CITY_TABS.map((t) => (
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
            key={n.name}
            to={`/listings?city=${n.city}&district=${encodeURIComponent(n.name)}`}
            className="group rounded-2xl border overflow-hidden hover:shadow-card transition-shadow"
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={n.img}
                alt={n.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary" />
                <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                  {cityLabel(n.city)}
                </p>
              </div>
              <h3 className="mt-1 text-xl font-bold">{n.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {n.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {n.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] bg-muted px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <p className="font-semibold">{n.price}</p>
                <span className="inline-flex items-center gap-1 text-success text-xs font-semibold">
                  <TrendingUp size={12} /> {n.trend}
                </span>
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

function cityLabel(c) {
  return (
    { almaty: "Алматы", astana: "Астана", shymkent: "Шымкент" }[c] || c
  );
}
