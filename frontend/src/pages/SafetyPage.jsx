import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  AlertTriangle,
  Users,
  FileCheck,
  Headphones,
  Flag,
} from "lucide-react";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";

const PILLARS = [
  {
    icon: FileCheck,
    title: "Верификация ID",
    body: "Каждый хост подтверждает личность сканом паспорта. Верификация занимает до 24 часов.",
  },
  {
    icon: ShieldCheck,
    title: "Модерация объявлений",
    body: "Наша команда проверяет фотографии, описания и цены перед публикацией.",
  },
  {
    icon: Lock,
    title: "Защита данных",
    body: "Пароли хешируются, токены шифруются. Мы не передаём ваши данные третьим лицам.",
  },
  {
    icon: Eye,
    title: "Встроенная переписка",
    body: "Общайтесь с хостами через Roomie — без утечки телефонов и email.",
  },
];

const TIPS = [
  "Никогда не переводите деньги до личного осмотра жилья.",
  "Не передавайте сканы документов в мессенджерах — используйте встроенную верификацию.",
  "Проверьте наличие значка «Проверено» у хоста перед заявкой.",
  "Заключайте письменный договор аренды при заселении.",
  "Если объявление выглядит слишком хорошо — скорее всего, это обман.",
  "Сообщайте о подозрительных хостах через кнопку «Пожаловаться».",
];

export default function SafetyPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Безопасность"
        title="Мы заботимся о вашей защите"
        subtitle="Набор инструментов и правил, чтобы аренда через Roomie была спокойной."
      />

      {/* PILLARS */}
      <section className="mt-10 grid md:grid-cols-2 gap-4">
        {PILLARS.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border p-6 flex gap-4 hover:shadow-card transition-shadow"
          >
            <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <p.icon size={22} />
            </div>
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {p.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* TIPS */}
      <section className="mt-16 rounded-[2rem] p-10 bg-foreground text-background">
        <div className="flex items-center gap-3">
          <AlertTriangle size={22} className="text-primary" />
          <h2 className="text-2xl font-bold tracking-tight">
            Правила безопасности
          </h2>
        </div>
        <p className="mt-2 text-background/70 max-w-2xl">
          Несколько базовых советов, которые уберегут от 99% неприятностей.
        </p>
        <ol className="mt-6 grid md:grid-cols-2 gap-3">
          {TIPS.map((t, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl bg-background/5 p-4 border border-white/10"
            >
              <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* REPORT */}
      <section className="mt-16 grid md:grid-cols-3 gap-4">
        <Action icon={Flag} title="Сообщить о нарушении" to="/contact" />
        <Action icon={Users} title="Служба доверия" to="/contact" />
        <Action icon={Headphones} title="Поддержка 24/7" to="/help" />
      </section>

      {/* CTA */}
      <section className="mt-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Есть подозрения?
        </h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Наша служба доверия ответит в течение 2 часов.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/contact">
            <Button>Написать в поддержку</Button>
          </Link>
          <Link to="/faq">
            <Button variant="outline">Открыть FAQ</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Action({ icon: Icon, title, to }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border p-6 flex items-center gap-4 hover:shadow-card hover:border-foreground transition-all"
    >
      <Icon size={24} className="text-primary" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">Открыть</p>
      </div>
    </Link>
  );
}
