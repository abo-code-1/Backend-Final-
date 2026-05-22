import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Inbox, ChevronRight, Clock, XCircle, CheckCircle2 } from "lucide-react";
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

export default function ApplicationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingWithdraw, setPendingWithdraw] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/applications/me", {
        params: { page, limit: pageSize },
      });
      const meta = data.pagination || { page: 1, totalPages: 1, total: 0 };
      // Stepped past the last page (e.g. after withdrawing the only item) — clamp.
      if (meta.totalPages > 0 && page > meta.totalPages) {
        setPage(meta.totalPages);
        return;
      }
      setItems(data.items || []);
      setPagination(meta);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const changePageSize = (n) => {
    setPageSize(n);
    setPage(1);
  };

  const withdraw = async () => {
    if (!pendingWithdraw) return;
    try {
      await apiClient.patch(`/applications/${pendingWithdraw}/withdraw`);
      toast.success("Заявка отозвана");
      setPendingWithdraw(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось отозвать");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Активность"
        title="Мои заявки"
        subtitle="Все ваши отклики на объявления в одном месте."
      />

      <div className="mt-8">
        {loading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Пока нет заявок"
            description="Откройте интересное объявление и нажмите «Отправить заявку»."
            action={
              <Link to="/listings">
                <Button>К объявлениям</Button>
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
              return (
                <div
                  key={app.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-20 w-28 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={
                        app.listing.photos?.[0] ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold truncate">
                        {app.listing.title}
                      </h3>
                      <Badge variant={s.variant}>
                        <Icon size={12} /> {s.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {app.listing.city}
                      {app.listing.district ? `, ${app.listing.district}` : ""}
                    </p>
                    {app.message && (
                      <p className="mt-2 text-sm line-clamp-2 italic text-foreground/80">
                        “{app.message}”
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 md:flex-col md:items-end">
                    <Link to={`/listings/${app.listing.id}`}>
                      <Button variant="outline" size="sm">
                        Открыть <ChevronRight size={14} />
                      </Button>
                    </Link>
                    {app.status !== "withdrawn" &&
                      app.status !== "rejected" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingWithdraw(app.id)}
                          className="text-destructive"
                        >
                          Отозвать
                        </Button>
                      )}
                  </div>
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
        isOpen={Boolean(pendingWithdraw)}
        title="Отозвать заявку?"
        description="Вы сможете отправить её повторно позже."
        confirmText="Отозвать"
        cancelText="Отмена"
        onCancel={() => setPendingWithdraw(null)}
        onConfirm={withdraw}
      />
    </div>
  );
}
