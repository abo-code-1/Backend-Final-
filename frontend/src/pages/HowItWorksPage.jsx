import { Link } from "react-router-dom";
import {
  Search,
  MessageCircle,
  Heart,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  Home,
  Send,
  Key,
} from "lucide-react";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";

const SEEKER_STEPS = [
  {
    icon: UserPlus,
    title: "Создайте аккаунт",
    body: "Регистрация занимает пару минут. Бесплатно, без скрытых комиссий.",
  },
  {
    icon: Search,
    title: "Найдите жильё",
    body: "Фильтруйте по городу, району, цене, количеству комнат и удобствам.",
  },
  {
    icon: MessageCircle,
    title: "Свяжитесь с хостом",
    body: "Задайте вопросы, уточните детали, договоритесь о просмотре.",
  },
  {
    icon: Send,
    title: "Отправьте заявку",
    body: "Короткое сообщение о себе — и вы в очереди на заселение.",
  },
  {
    icon: Key,
    title: "Заселяйтесь",
    body: "После одобрения — получаете ключи и знакомитесь с соседями.",
  },
];

const HOST_STEPS = [
  {
    icon: UserPlus,
    title: "Станьте хостом",
    body: "Переключите роль в профиле или зарегистрируйтесь как хост.",
  },
  {
    icon: Home,
    title: "Разместите объявление",
    body: "Фото, описание, правила, цена — мы поможем заполнить форму.",
  },
  {
    icon: ShieldCheck,
    title: "Пройдите верификацию",
    body: "Подтвердите ID и телефон — хостам с галочкой доверяют больше.",
  },
  {
    icon: Send,
    title: "Получайте заявки",
    body: "Читайте сообщения, выбирайте соседей, которые подходят именно вам.",
  },
  {
    icon: Heart,
    title: "Заселяйте",
    body: "Расскажите о правилах, подпишите договор и встречайте новых жильцов.",
  },
];

const FAQ = [
  {
    q: "Это бесплатно?",
    a: "Да. Регистрация, поиск жилья и размещение объявлений — бесплатно.",
  },
  {
    q: "Как работает верификация?",
    a: "Хосты загружают скан ID. Наша команда проверяет документ вручную в течение 24 часов.",
  },
  {
    q: "Могу ли я отозвать заявку?",
    a: "Да, в любой момент до одобрения. Раздел «Мои заявки» → кнопка «Отозвать».",
  },
  {
    q: "Какие города доступны?",
    a: "Алматы, Астана и Шымкент. Мы постепенно расширяемся.",
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Инструкция"
        title="Как работает Roomie.kz"
        subtitle="Два пути — для тех, кто ищет жильё, и для тех, кто сдаёт. Оба просты."
      />

      {/* SEEKER */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Ищете жильё
          </h2>
          <Link to="/listings">
            <Button variant="outline">
              К объявлениям <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-5 gap-4">
          {SEEKER_STEPS.map((s, i) => (
            <Step key={s.title} n={i + 1} {...s} />
          ))}
        </div>
      </section>

      {/* HOST */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Сдаёте жильё
          </h2>
          <Link to="/listings/new">
            <Button variant="outline">
              Разместить объявление <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <div className="grid md:grid-cols-5 gap-4">
          {HOST_STEPS.map((s, i) => (
            <Step key={s.title} n={i + 1} {...s} />
          ))}
        </div>
      </section>

      {/* SAFETY */}
      <section className="mt-20 grid lg:grid-cols-2 gap-8 items-center rounded-[2rem] bg-muted/50 p-8 md:p-14">
        <div>
          <span className="text-xs uppercase font-semibold tracking-[0.14em] text-primary">
            Безопасность
          </span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
            Мы защищаем обе стороны
          </h2>
          <ul className="mt-5 space-y-3">
            {[
              "Верификация ID и телефона для всех хостов",
              "Ручная модерация объявлений",
              "Встроенные сообщения без утечки контактов",
              "Чёрный список и блокировки недобросовестных пользователей",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2
                  size={18}
                  className="text-success mt-0.5 shrink-0"
                />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Link to="/safety">
              <Button>
                Узнать больше <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80"
          alt=""
          className="rounded-2xl aspect-[4/3] object-cover w-full"
        />
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
          Частые вопросы
        </h2>
        <div className="mt-8 max-w-3xl mx-auto divide-y rounded-2xl border">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold">
                {f.q}
                <span className="transition-transform group-open:rotate-45 text-primary text-xl font-light">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }) {
  return (
    <div className="rounded-2xl border p-5 hover:shadow-card transition-shadow">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon size={18} />
        </div>
        <span className="text-2xl font-bold text-muted-foreground/30">
          {String(n).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  );
}
