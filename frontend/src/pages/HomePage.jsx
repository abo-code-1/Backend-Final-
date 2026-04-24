import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  ShieldCheck,
  MessageCircle,
  Sparkles,
  MapPin,
  Star,
  ArrowRight,
  Building2,
  Users,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import ListingCard from "../components/listings/ListingCard";
import ListingSkeleton from "../components/listings/ListingSkeleton";
import { cn } from "../utils/cn";

const CITIES = [
  { value: "almaty", label: "Алматы", img: "https://images.unsplash.com/photo-1594823976738-35aefcc1c87a?auto=format&fit=crop&w=800&q=60" },
  { value: "astana", label: "Астана", img: "https://images.unsplash.com/photo-1564509370334-5b6b81f1f9cc?auto=format&fit=crop&w=800&q=60" },
  { value: "shymkent", label: "Шымкент", img: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=60" },
];

const CATEGORIES = [
  { key: "all", label: "Все", icon: "🏠" },
  { key: "private", label: "Отдельная комната", icon: "🛏️" },
  { key: "shared", label: "Совместная", icon: "👥" },
  { key: "studio", label: "Студия", icon: "🏙️" },
  { key: "family", label: "Для семьи", icon: "🧸" },
  { key: "student", label: "Для студентов", icon: "🎓" },
  { key: "pet", label: "Можно с питомцем", icon: "🐾" },
  { key: "balcony", label: "С балконом", icon: "🌿" },
];

const TESTIMONIALS = [
  {
    name: "Айгерим",
    city: "Алматы",
    quote:
      "Нашла трёх идеальных соседок за неделю! Верификация хозяев реально работает.",
    avatar: "https://i.pravatar.cc/100?img=47",
  },
  {
    name: "Ермек",
    city: "Астана",
    quote:
      "Как хозяин — очень удобно управлять заявками. Всё прозрачно, без переписки в мессенджерах.",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  {
    name: "Диана",
    city: "Шымкент",
    quote:
      "Фильтры по характеру и привычкам — это лучшее, что я видела на рынке аренды.",
    avatar: "https://i.pravatar.cc/100?img=32",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [activeCity, setActiveCity] = useState("almaty");

  const { data, isLoading } = useQuery({
    queryKey: ["home-featured", activeCity],
    queryFn: async () => {
      const { data } = await apiClient.get("/listings", {
        params: { city: activeCity, page: 1, limit: 8, sort: "newest" },
      });
      return data;
    },
  });

  const listings = data?.items || [];

  const quickSearch = (value) => navigate(`/listings?city=${value}`);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF5F7] via-background to-[#FFF0EB]" />
          <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 -left-24 h-[320px] w-[320px] rounded-full bg-[#FFDDE3] blur-3xl" />
        </div>

        <div className="container pt-14 pb-20 md:pt-24 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 backdrop-blur px-3 py-1.5 text-xs font-semibold">
                <Sparkles size={14} className="text-primary" />
                Новые объявления каждый день
              </span>
              <h1 className="mt-5 text-5xl md:text-6xl font-bold tracking-tighter leading-[1.05]">
                Найдите свою <br />
                <span className="text-primary">комнату и соседей</span>
              </h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed">
                Roomie.kz — самая удобная платформа для поиска комнат и сожителей
                в Алматы, Астане и Шымкенте. Только проверенные хозяева, честные
                цены, без посредников.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  quickSearch(activeCity);
                }}
                className="mt-8 flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-2xl bg-white shadow-card border"
              >
                <select
                  value={activeCity}
                  onChange={(e) => setActiveCity(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/60 text-sm font-medium outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="lg" className="h-12 px-6">
                  <Search size={16} />
                  Найти жильё
                </Button>
              </form>

              <div className="mt-10 flex flex-wrap gap-8">
                <Stat number="2 000+" label="объявлений" />
                <Stat number="5 000+" label="пользователей" />
                <Stat number="150+" label="успешных заселений" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-pop bg-muted">
                <img
                  src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
                  alt="Светлая комната"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 backdrop-blur p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Уютная комната · Медеу</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} /> Алматы, Казахстан
                      </p>
                    </div>
                    <span className="font-bold text-primary">120 000 ₸</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block absolute -bottom-5 -left-6 bg-white rounded-2xl shadow-pop p-4 w-60 border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Проверенный хост</p>
                    <p className="text-xs text-muted-foreground">ID + телефон</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex absolute -top-4 -right-6 bg-white rounded-2xl shadow-pop p-3 w-48 border items-center gap-2">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold">4.9 из 5</p>
                  <p className="text-xs text-muted-foreground">1 200+ отзывов</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CATEGORY CHIPS */}
      <section className="container">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
          {CATEGORIES.map((c) => (
            <Link
              to="/listings"
              key={c.key}
              className="shrink-0 inline-flex items-center gap-2 px-4 h-11 rounded-full border bg-background hover:border-foreground hover:shadow-soft transition-all text-sm font-medium"
            >
              <span>{c.icon}</span>
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CITY TABS + FEATURED LISTINGS */}
      <section className="container mt-12 md:mt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Популярные объявления
            </h2>
            <p className="text-muted-foreground mt-1">
              Свежие комнаты в городе на ваш выбор
            </p>
          </div>
          <Link
            to="/listings"
            className="text-sm font-semibold text-foreground hover:text-primary inline-flex items-center gap-1"
          >
            Смотреть все <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {CITIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setActiveCity(c.value)}
              className={cn(
                "px-4 h-10 rounded-full text-sm font-semibold transition-all border",
                activeCity === c.value
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ListingSkeleton key={i} />
              ))
            : listings.slice(0, 8).map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
          {!isLoading && listings.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              В этом городе пока нет объявлений.{" "}
              <Link to="/listings/new" className="text-primary font-semibold">
                Разместите первое!
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CITY CARDS */}
      <section className="container mt-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
          Выберите свой город
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {CITIES.map((c) => (
            <Link
              to={`/listings?city=${c.value}`}
              key={c.value}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
            >
              <img
                src={c.img}
                alt={c.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                <div>
                  <h3 className="text-2xl font-bold">{c.label}</h3>
                  <p className="text-sm opacity-90">Смотреть объявления</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-white text-foreground flex items-center justify-center">
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="container mt-24">
        <div className="grid md:grid-cols-3 gap-8">
          <Feature
            icon={ShieldCheck}
            title="Проверенные хозяева"
            body="Каждый хост проходит верификацию по ID и телефону. Мы модерируем объявления вручную."
            color="bg-success/10 text-success"
          />
          <Feature
            icon={Sparkles}
            title="Умный поиск"
            body="Фильтруйте по району, цене, комнатам, мебели, Wi-Fi и даже по характеру будущих соседей."
            color="bg-primary/10 text-primary"
          />
          <Feature
            icon={MessageCircle}
            title="Безопасная связь"
            body="Общайтесь через встроенные сообщения — без утечки номеров и навязчивой рекламы."
            color="bg-amber-100 text-amber-600"
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mt-24">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Всё просто
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Как это работает
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Step
            n={1}
            icon={Search}
            title="Ищите"
            body="Фильтруйте объявления по городу, району и бюджету."
          />
          <Step
            n={2}
            icon={MessageCircle}
            title="Общайтесь"
            body="Напишите хозяину, задайте вопросы, уточните детали."
          />
          <Step
            n={3}
            icon={Heart}
            title="Заселяйтесь"
            body="Отправьте заявку и получите ключи от новой комнаты."
          />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mt-24">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Нам доверяют жители трёх городов
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border p-6 bg-background hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm leading-relaxed">“{t.quote}”</p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA / HOST */}
      <section className="container mt-24 mb-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground text-background p-10 md:p-16">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs uppercase tracking-[0.14em] text-primary font-semibold">
                Для хостов
              </span>
              <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
                Сдайте комнату —  <br />
                найдите идеального соседа
              </h2>
              <p className="mt-4 text-background/80 max-w-md">
                Публикация объявления бесплатна. Вы управляете заявками,
                решаете с кем заселиться и получаете деньги напрямую.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/listings/new">
                  <Button size="lg" variant="primary">
                    Разместить объявление <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="bg-transparent text-background border-background/30 hover:bg-background/10">
                    Цены и тарифы
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniFact icon={Building2} label="Объявлений" value="2,1k" />
              <MiniFact icon={Users} label="Искателей" value="5,3k" />
              <MiniFact icon={CheckCircle2} label="Успешно" value="150+" />
              <MiniFact icon={Star} label="Рейтинг" value="4.9" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div>
      <div className="text-2xl font-bold">{number}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, body, color }) {
  return (
    <div className="p-6 rounded-2xl border hover:shadow-card transition-shadow">
      <div
        className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
          color
        )}
      >
        <Icon size={22} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }) {
  return (
    <div className="p-6 rounded-2xl bg-muted/40 border">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center border">
          <Icon size={18} />
        </div>
        <span className="text-3xl font-bold text-muted-foreground/40">
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function MiniFact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-background/10 backdrop-blur border border-white/10 p-4">
      <Icon size={18} className="text-primary" />
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-background/70">{label}</div>
    </div>
  );
}
