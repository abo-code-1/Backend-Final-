import { useState } from "react";
import { toast } from "react-toastify";
import {
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  Send,
  Instagram,
  Twitter,
} from "lucide-react";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Textarea from "../components/common/Textarea";
import PageHeader from "../components/common/PageHeader";

const TOPICS = [
  { label: "Общий вопрос", value: "general" },
  { label: "Проблема с объявлением", value: "listing" },
  { label: "Верификация ID", value: "verification" },
  { label: "Жалоба", value: "complaint" },
  { label: "Партнёрство", value: "partnership" },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "general",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      toast.success("Сообщение отправлено! Ответим в течение 24 часов.");
      setForm({ name: "", email: "", topic: "general", message: "" });
      setSending(false);
    }, 700);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Связаться"
        title="Мы на связи"
        subtitle="Пишите — отвечаем в течение 24 часов. Срочные вопросы — по телефону."
      />

      <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
        {/* FORM */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border p-6 md:p-8 space-y-4"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Ваше имя"
              placeholder="Иван Иванов"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Select
            label="Тема"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            options={TOPICS}
          />
          <Textarea
            label="Сообщение"
            placeholder="Опишите ваш вопрос или ситуацию..."
            rows={6}
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={sending}>
              <Send size={16} /> Отправить
            </Button>
          </div>
        </form>

        {/* INFO */}
        <aside className="space-y-4">
          <div className="rounded-2xl border p-6 space-y-4">
            <InfoRow
              icon={Mail}
              label="Почта"
              value="support@roomie.kz"
              href="mailto:support@roomie.kz"
            />
            <InfoRow
              icon={Phone}
              label="Телефон"
              value="+7 (727) 123-45-67"
              href="tel:+77271234567"
            />
            <InfoRow
              icon={MessageCircle}
              label="Чат в Telegram"
              value="@roomiekz_bot"
              href="https://t.me/roomiekz_bot"
            />
            <InfoRow icon={MapPin} label="Офис" value="Алматы, пр. Абая 42" />
          </div>

          <div className="rounded-2xl border p-6">
            <p className="font-semibold mb-3">Социальные сети</p>
            <div className="flex items-center gap-2">
              <Social icon={Instagram} href="#" />
              <Social icon={Twitter} href="#" />
              <Social icon={MessageCircle} href="#" />
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 border p-6">
            <p className="font-semibold">Часы работы</p>
            <p className="text-sm text-muted-foreground mt-1">
              Пн–Пт: 9:00 – 20:00 <br />
              Сб–Вс: 10:00 – 18:00
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, href }) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
          {label}
        </p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block hover:opacity-80 transition-opacity">
      {content}
    </a>
  ) : (
    content
  );
}

function Social({ icon: Icon, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="h-10 w-10 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
    >
      <Icon size={18} />
    </a>
  );
}
