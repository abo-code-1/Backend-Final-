import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Check, X, ShieldCheck, ExternalLink } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { PageSpinner } from "../components/common/Spinner";
import Pagination from "../components/common/Pagination";

export default function AdminVerificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/verifications/pending", {
        params: { page, limit: pageSize },
      });
      const meta = data.pagination || { page: 1, totalPages: 1, total: 0 };
      if (meta.totalPages > 0 && page > meta.totalPages) {
        setPage(meta.totalPages);
        return;
      }
      setItems(data.items || []);
      setPagination(meta);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить");
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

  const review = async (id, status) => {
    try {
      await apiClient.patch(`/admin/verifications/${id}/review`, { status });
      toast.success(status === "approved" ? "ID подтверждён" : "ID отклонён");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Админ"
        title="Верификации ID"
        subtitle="Подтвердите личности пользователей."
      />

      <div className="mt-8">
        {loading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Нет ожидающих верификаций"
            description="Все заявки на проверку обработаны."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border overflow-hidden">
                <div className="aspect-[16/9] bg-muted flex items-center justify-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Нет изображения
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{item.user?.fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.user?.email}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => review(item.id, "approved")}>
                      <Check size={14} /> Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => review(item.id, "rejected")}
                    >
                      <X size={14} /> Отклонить
                    </Button>
                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="ghost">
                          <ExternalLink size={14} />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
}
