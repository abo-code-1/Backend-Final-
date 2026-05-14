import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Phone,
  Home as HomeIcon,
} from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { PageSpinner } from "../components/common/Spinner";

const STATUS = {
  pending: { label: "На рассмотрении", variant: "warning", icon: Clock },
  accepted: { label: "Принята", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Отклонена", variant: "destructive", icon: XCircle },
  withdrawn: { label: "Отозвана", variant: "secondary", icon: XCircle },
};

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "pending", label: "На рассмотрении" },
  { key: "accepted", label: "Принятые" },
  { key: "rejected", label: "Отклонённые" },
];

export default function ReceivedApplicationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [pendingReject, setPendingReject] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/applications/received");
      setItems(data.items || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (id) => {
    setActingId(id);
    try {
      await apiClient.patch(`/applications/${id}/accept`);
      toast.success("Заявка принята");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось принять заявку");
    } finally {
      setActingId(null);
    }
  };

  const reject = async () => {
    if (!pendingReject) return;
    const id = pendingReject;
    setPendingReject(null);
    setActingId(id);
    try {
      await apiClient.patch(`/applications/${id}/reject`);
      toast.success("Заявка отклонена");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось отклонить заявку");
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = items.filter((a) => a.status === "pending").length;
  const visible =
    filter === "all" ? items : items.filter((a) => a.status === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Хост"
        title="Входящие заявки"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} ${
                pendingCount === 1 ? "заявка ждёт" : "заявок ждут"
              } вашего решения.`
            : "Отклики на все ваши объявления в одном месте."
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              filter === f.key
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <PageSpinner />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={
              items.length === 0
                ? "Пока нет заявок"
                : "В этой категории пусто"
            }
            description={
              items.length === 0
                ? "Как только кто-то откликнется на ваше объявление, заявка появится здесь."
                : "Попробуйте другой фильтр."
            }
            action={
              items.length === 0 ? (
                <Link to="/my-listings">
                  <Button variant="outline">К моим объявлениям</Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="divide-y rounded-2xl border">
            {visible.map((app) => {
              const s = STATUS[app.status] || {
                label: app.status,
                variant: "secondary",
                icon: Clock,
              };
              const Icon = s.icon;
              const seeker = app.seeker || {};
              const initial = seeker.fullName?.[0]?.toUpperCase() || "U";
              const busy = actingId === app.id;
              return (
                <div
                  key={app.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-foreground text-background flex items-center justify-center text-xl font-bold shrink-0">
                    {seeker.avatarUrl ? (
                      <img
                        src={seeker.avatarUrl}
                        alt={seeker.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold truncate">
                        {seeker.fullName || "Пользователь"}
                      </h3>
                      <Badge variant={s.variant}>
                        <Icon size={12} /> {s.label}
                      </Badge>
                    </div>
                    {app.listing && (
                      <Link
                        to={`/listings/${app.listing.id}`}
                        className="mt-0.5 inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                      >
                        <HomeIcon size={12} /> {app.listing.title}
                      </Link>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {seeker.occupation && <span>{seeker.occupation}</span>}
                      {seeker.isPhoneVerified && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Phone size={12} /> Телефон подтверждён
                        </span>
                      )}
                      {seeker.isIdVerified && (
                        <span className="inline-flex items-center gap-1 text-success">
                          <ShieldCheck size={12} /> ID подтверждён
                        </span>
                      )}
                    </div>
                    {app.message && (
                      <p className="mt-2 text-sm line-clamp-3 italic text-foreground/80">
                        “{app.message}”
                      </p>
                    )}
                  </div>

                  {app.status === "pending" && (
                    <div className="flex gap-2 md:flex-col md:items-end">
                      <Button
                        size="sm"
                        loading={busy}
                        disabled={busy}
                        onClick={() => accept(app.id)}
                      >
                        <CheckCircle2 size={14} /> Принять
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => setPendingReject(app.id)}
                        className="text-destructive"
                      >
                        <XCircle size={14} /> Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingReject)}
        title="Отклонить заявку?"
        description="Кандидат увидит, что заявка отклонена. Это действие нельзя отменить."
        confirmText="Отклонить"
        cancelText="Отмена"
        onCancel={() => setPendingReject(null)}
        onConfirm={reject}
      />
    </div>
  );
}
