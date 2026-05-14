import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import PageHeader from "../components/common/PageHeader";

const PLANS = [
  {
    name: "Базовый",
    price: "0 ₸",
    period: "навсегда",
    description: "Всё необходимое, чтобы найти соседа или сдать комнату.",
    features: [
      "Неограниченное число объявлений",
      "Заявки от жильцов",
      "Базовые фильтры поиска",
      "Подтверждение телефона",
    ],
    cta: "Начать бесплатно",
    to: "/register",
    highlighted: false,
  },
  {
    name: "Продвижение",
    price: "2 990 ₸",
    period: "за объявление / 14 дней",
    description: "Поднимите объявление в топ выдачи и получите больше откликов.",
    features: [
      "Закрепление в топе поиска",
      "Пометка «Рекомендуем»",
      "Статистика просмотров",
      "Приоритетная поддержка",
    ],
    cta: "Продвинуть объявление",
    to: "/my-listings",
    highlighted: true,
  },
  {
    name: "Бизнес",
    price: "По запросу",
    period: "для агентств и УК",
    description: "Массовое размещение и инструменты для профессионалов рынка.",
    features: [
      "Пакетная загрузка объявлений",
      "Единый кабинет для команды",
      "Брендирование профиля",
      "Персональный менеджер",
    ],
    cta: "Связаться с нами",
    to: "/contact",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Тарифы"
        title="Цены и тарифы"
        subtitle="Размещение и поиск жилья на Roomie.kz бесплатны. Платные опции — только для продвижения объявлений."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-7 transition-shadow hover:shadow-card ${
              plan.highlighted
                ? "border-primary ring-1 ring-primary/30"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              {plan.highlighted && <Badge variant="primary">Популярный</Badge>}
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="ml-2 text-sm text-muted-foreground">
                {plan.period}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {plan.description}
            </p>
            <ul className="mt-6 space-y-3 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to={plan.to} className="mt-7">
              <Button
                className="w-full"
                variant={plan.highlighted ? "primary" : "outline"}
              >
                {plan.cta} <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <section className="mt-16 rounded-2xl border bg-muted/30 p-8">
        <h2 className="text-lg font-semibold">Частые вопросы по оплате</h2>
        <dl className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-sm">
              Нужно ли платить, чтобы откликнуться на объявление?
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Нет. Поиск жилья и отправка заявок полностью бесплатны.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-sm">
              Можно ли отключить продвижение досрочно?
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Да, в любой момент в разделе «Мои объявления». Остаток средств не
              сгорает.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-sm">Какие способы оплаты есть?</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Банковские карты Visa и Mastercard, выпущенные в Казахстане.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-sm">Выдаёте ли вы документы?</dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              Да, после оплаты на email приходит чек. Для бизнес-тарифа доступен
              договор.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
