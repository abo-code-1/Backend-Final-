import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  BookOpen,
  CreditCard,
  Shield,
  Users,
  MessageCircle,
  Home as HomeIcon,
  HelpCircle,
} from "lucide-react";
import Input from "../components/common/Input";
import PageHeader from "../components/common/PageHeader";
import { cn } from "../utils/cn";

const TOPICS = [
  { icon: BookOpen, title: "Начало работы", count: 14 },
  { icon: HomeIcon, title: "Размещение объявлений", count: 22 },
  { icon: MessageCircle, title: "Заявки и сообщения", count: 18 },
  { icon: CreditCard, title: "Оплата и цены", count: 11 },
  { icon: Shield, title: "Безопасность", count: 9 },
  { icon: Users, title: "Аккаунт и профиль", count: 15 },
];

const ARTICLES = [
  "Как создать первое объявление?",
  "Что делать, если хост не отвечает?",
  "Как отозвать заявку?",
  "Как пройти верификацию ID?",
  "Как переключиться с seeker на host?",
  "Что такое проверенный хост?",
  "Как заблокировать пользователя?",
  "Как удалить аккаунт?",
];

export default function HelpPage() {
  const [q, setQ] = useState("");
  const filtered = q
    ? ARTICLES.filter((a) => a.toLowerCase().includes(q.toLowerCase()))
    : ARTICLES;

  return (
    <div>
      {/* HERO SEARCH */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#FFF5F7] to-white border p-10 md:p-16 text-center">
        <div className="absolute -top-24 -right-10 h-80 w-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative max-w-2xl mx-auto">
          <HelpCircle size={28} className="mx-auto text-primary" />
          <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight">
            Чем мы можем помочь?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Найдите ответ на свой вопрос или напишите нам напрямую.
          </p>
          <div className="mt-6 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-11 h-14 text-base rounded-full shadow-card"
              placeholder="Например: как отозвать заявку"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </section>

      {!q && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-5">Разделы</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TOPICS.map((t) => (
              <div
                key={t.title}
                className={cn(
                  "rounded-2xl border p-5 hover:shadow-card transition-shadow cursor-pointer"
                )}
              >
                <t.icon size={22} className="text-primary" />
                <p className="mt-4 font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.count} статей
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-5">
          {q ? `Найдено: ${filtered.length}` : "Популярные статьи"}
        </h2>
        <div className="rounded-2xl border divide-y">
          {filtered.map((a) => (
            <Link
              key={a}
              to="#"
              className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
            >
              <span className="font-medium">{a}</span>
              <span className="text-muted-foreground">→</span>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground">
              Ничего не найдено. <Link className="text-primary" to="/contact">Написать в поддержку</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
