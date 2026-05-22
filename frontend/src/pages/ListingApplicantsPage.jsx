import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { PageSpinner } from "../components/common/Spinner";
import Pagination from "../components/common/Pagination";

const STATUS = {
  pending: { label: "На рассмотрении", variant: "warning", icon: Clock },
  accepted: { label: "Принята", variant: "success", icon: CheckCircle2 },
  rejected: { label: "Отклонена", variant: "destructive", icon: XCircle },
  withdrawn: { label: "Отозвана", variant: "secondary", icon: XCircle },
};

export default function ListingApplicantsPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [pendingReject, setPendingReject] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/listings/${id}/applications`, {
        params: { page, limit: pageSize },
      });
      const meta = data.pagination || { page: 1, totalPages: 1, total: 0 };
      if (meta.totalPages > 0 && page > meta.totalPages) {
        setPage(meta.totalPages);
        return;
      }
      setListing(data.listing || null);
      setItems(data.items || []);
      setPagination(meta);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, [id, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const changePageSize = (n) => {
    setPageSize(n);
    setPage(1);
  };

  const accept = async (applicationId) => {
    setActingId(applicationId);
    try {
      await apiClient.patch(`/applications/${applicationId}/accept`);
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
    const applicationId = pendingReject;
    setPendingReject(null);
    setActingId(applicationId);
    try {
      await apiClient.patch(`/applications/${applicationId}/reject`);
      toast.success("Заявка отклонена");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось отклонить заявку");
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = items.filter((a) => a.status === "pending").length;

  return (
    <div>
      <PageHeader
        eyebrow="Хост"
        title="Заявки на объявление"
        subtitle={
          listing
            ? `${listing.title} — ${pendingCount} на рассмотрении`
            : "Кандидаты, откликнувшиеся на вашу комнату."
        }
        actions={
          <Link to="/my-listings">
            <Button variant="outline">
              <ArrowLeft size={15} /> К моим объявлениям
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        {loading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Пока нет заявок"
            description="Как только кто-то откликнется на это объявление, заявка появится здесь."
            action={
              <Link to={`/listings/${id}`}>
                <Button variant="outline">Открыть объявление</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y rounded-2xl border">
            {items.map((app) => {
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
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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

        {!loading && items.length > 0 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={changePageSize}
          />
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
