import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import {
  Users,
  Home as HomeIcon,
  Inbox,
  ShieldCheck,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "../api/client";
import PageHeader from "../components/common/PageHeader";
import { PageSpinner } from "../components/common/Spinner";

const CARDS = [
  { key: "users", label: "Пользователи", icon: Users, color: "bg-primary/10 text-primary" },
  { key: "listings", label: "Объявления", icon: HomeIcon, color: "bg-success/10 text-success" },
  { key: "applications", label: "Заявки", icon: Inbox, color: "bg-amber-100 text-amber-600" },
  { key: "pendingListings", label: "На модерации", icon: Hourglass, color: "bg-blue-100 text-blue-600" },
  { key: "pendingVerifications", label: "Верификации", icon: ShieldCheck, color: "bg-violet-100 text-violet-600" },
];

const QUICK_LINKS = [
  { to: "/admin/users", label: "Управление пользователями" },
  { to: "/admin/listings", label: "Модерация объявлений" },
  { to: "/admin/verifications", label: "Верификации ID" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get("/admin/stats");
        setStats(data.item);
      } catch (e) {
        toast.error(e.response?.data?.message || "Не удалось загрузить");
      }
    })();
  }, []);

  if (!stats) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        eyebrow="Администрирование"
        title="Панель управления"
        subtitle="Ключевые метрики платформы и быстрые действия."
      />

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CARDS.map((c) => (
          <div key={c.key} className="rounded-2xl border p-5">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.color}`}
            >
              <c.icon size={18} />
            </div>
            <p className="mt-4 text-3xl font-bold">{stats[c.key] ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="group flex items-center justify-between p-5 rounded-2xl border hover:border-foreground hover:shadow-card transition-all"
          >
            <span className="font-semibold">{l.label}</span>
            <ArrowRight
              size={16}
              className="text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
