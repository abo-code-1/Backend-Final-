import { Link } from "react-router-dom";
import {
  Heart,
  Target,
  Users,
  Globe,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Button from "../components/common/Button";

const TEAM = [
  {
    name: "Абрoр Бекбоев",
    role: "Основатель, CEO",
    avatar: "https://i.pravatar.cc/200?img=68",
  },
  {
    name: "Айдана К.",
    role: "Продукт",
    avatar: "https://i.pravatar.cc/200?img=48",
  },
  {
    name: "Данияр С.",
    role: "Дизайн",
    avatar: "https://i.pravatar.cc/200?img=11",
  },
  {
    name: "Мадина А.",
    role: "Команда поддержки",
    avatar: "https://i.pravatar.cc/200?img=45",
  },
];

const VALUES = [
  {
    icon: Heart,
    title: "Люди — в центре",
    body: "Мы строим сообщество, где соседство приносит радость, а не стресс.",
  },
  {
    icon: Target,
    title: "Прозрачность",
    body: "Чёткие цены, честные описания, никаких скрытых комиссий.",
  },
  {
    icon: Users,
    title: "Верификация",
    body: "Каждый хост проходит проверку. Мы боремся с мошенниками.",
  },
  {
    icon: Globe,
    title: "Локально",
    body: "Мы из Казахстана и знаем контекст — Алматы, Астана, Шымкент.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FFF5F7] to-white p-10 md:p-20 border">
        <div className="absolute -top-24 -right-10 h-80 w-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-semibold">
            <Sparkles size={12} className="text-primary" /> О нас
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Делаем совместную аренду в Казахстане{" "}
            <span className="text-primary">человечной</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Roomie.kz родился из простой идеи: найти комнату должно быть так же
            легко, как заказать такси. А найти хороших соседей — так же
            приятно, как встретить друзей.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { n: "5 000+", l: "пользователей" },
          { n: "2 000+", l: "объявлений" },
          { n: "3", l: "города" },
          { n: "4.9", l: "средний рейтинг" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl border p-6 text-center hover:shadow-card transition"
          >
            <p className="text-3xl md:text-4xl font-bold">{s.n}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.l}</p>
          </div>
        ))}
      </section>

      {/* MISSION */}
      <section className="mt-20 grid lg:grid-cols-2 gap-10 items-center">
        <img
          src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="rounded-2xl aspect-[4/3] object-cover w-full"
        />
        <div>
          <span className="text-xs uppercase font-semibold tracking-[0.14em] text-primary">
            Миссия
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Сделать так, чтобы каждый нашёл свой дом
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Рынок аренды в Казахстане запутан: серые объявления, мошенники,
            бесконечные переписки в мессенджерах. Мы меняем это, создавая
            понятную, безопасную и красивую платформу для совместного жилья.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/listings">
              <Button>
                Смотреть жильё <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Написать нам</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="mt-24">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-10 text-center">
          Наши ценности
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border p-6 hover:shadow-card transition-shadow"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <v.icon size={20} />
              </div>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM */}
      <section className="mt-24">
        <div className="text-center mb-10">
          <span className="text-xs uppercase font-semibold tracking-[0.14em] text-primary">
            Команда
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Люди за Roomie
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {TEAM.map((m) => (
            <div key={m.name} className="text-center">
              <img
                src={m.avatar}
                alt={m.name}
                className="aspect-square w-full object-cover rounded-2xl"
              />
              <p className="mt-3 font-semibold">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-24 rounded-[2rem] bg-foreground text-background p-10 md:p-16 text-center">
        <TrendingUp size={32} className="mx-auto text-primary" />
        <h2 className="mt-4 text-3xl md:text-4xl font-bold">
          Расти вместе с нами
        </h2>
        <p className="mt-3 text-background/70 max-w-xl mx-auto">
          Мы на ранней стадии, и каждое ваше объявление, каждая заявка делает
          платформу лучше.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/register">
            <Button variant="primary" size="lg">
              Присоединиться
            </Button>
          </Link>
          <Link to="/blog">
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-background/30 text-background hover:bg-background/10"
            >
              Читать блог
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
