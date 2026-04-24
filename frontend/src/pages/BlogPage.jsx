import { Link } from "react-router-dom";
import { Clock, User } from "lucide-react";
import PageHeader from "../components/common/PageHeader";

const POSTS = [
  {
    id: 1,
    title: "10 правил для счастливого соседства",
    excerpt:
      "От посуды до ночной тишины — как договариваться с соседями так, чтобы всем было комфортно.",
    img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    author: "Айдана К.",
    date: "18 апр 2026",
    minutes: 7,
    tag: "Соседство",
  },
  {
    id: 2,
    title: "Как понять, что хост — мошенник",
    excerpt:
      "Пять красных флагов, которые не стоит игнорировать при поиске жилья онлайн.",
    img: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    author: "Данияр С.",
    date: "14 апр 2026",
    minutes: 5,
    tag: "Безопасность",
  },
  {
    id: 3,
    title: "Топ-5 районов Алматы для молодых специалистов",
    excerpt:
      "Где жить, если работаете в IT, банкинге или креативной индустрии.",
    img: "https://images.unsplash.com/photo-1519121785383-3229633bb75b?auto=format&fit=crop&w=1200&q=80",
    author: "Мадина А.",
    date: "10 апр 2026",
    minutes: 6,
    tag: "Алматы",
  },
  {
    id: 4,
    title: "Как сделать хорошие фото своей комнаты",
    excerpt:
      "Советы по свету, ракурсу и композиции — чтобы ваше объявление было в топе.",
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    author: "Данияр С.",
    date: "4 апр 2026",
    minutes: 4,
    tag: "Советы хостам",
  },
  {
    id: 5,
    title: "Что включать в договор совместной аренды",
    excerpt:
      "Базовый чеклист пунктов, которые защитят обе стороны в случае спора.",
    img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    author: "Айдана К.",
    date: "28 мар 2026",
    minutes: 8,
    tag: "Право",
  },
  {
    id: 6,
    title: "Переезжаете в Астану? Вот что нужно знать",
    excerpt:
      "Холодно? Дорого? Скучно? Разбираем мифы о столице и даём практические советы.",
    img: "https://images.unsplash.com/photo-1564509370334-5b6b81f1f9cc?auto=format&fit=crop&w=1200&q=80",
    author: "Мадина А.",
    date: "20 мар 2026",
    minutes: 9,
    tag: "Астана",
  },
];

export default function BlogPage() {
  const [feature, ...rest] = POSTS;

  return (
    <div>
      <PageHeader
        eyebrow="Блог"
        title="Советы, истории и гайды"
        subtitle="Всё, что вам нужно знать о совместной аренде в Казахстане."
      />

      {/* FEATURE */}
      <Link
        to="#"
        className="mt-10 grid lg:grid-cols-2 rounded-[2rem] border overflow-hidden group"
      >
        <div className="aspect-[4/3] lg:aspect-auto overflow-hidden bg-muted">
          <img
            src={feature.img}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <span className="text-xs uppercase font-semibold tracking-[0.14em] text-primary">
            {feature.tag}
          </span>
          <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight leading-tight">
            {feature.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{feature.excerpt}</p>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User size={12} /> {feature.author}
            </span>
            <span>{feature.date}</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {feature.minutes} мин
            </span>
          </div>
        </div>
      </Link>

      {/* GRID */}
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((p) => (
          <Link
            to="#"
            key={p.id}
            className="group rounded-2xl overflow-hidden border hover:shadow-card transition-shadow"
          >
            <div className="aspect-[16/10] bg-muted overflow-hidden">
              <img
                src={p.img}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <span className="text-xs uppercase font-semibold tracking-[0.14em] text-primary">
                {p.tag}
              </span>
              <h3 className="mt-2 text-lg font-bold leading-snug line-clamp-2">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {p.excerpt}
              </p>
              <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.author}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} /> {p.minutes} мин
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
