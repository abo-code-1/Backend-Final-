import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Check, X, ExternalLink } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { PageSpinner } from "../components/common/Spinner";

export default function AdminListingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/listings/pending");
      setItems(data.items || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id, approved) => {
    try {
      await apiClient.patch(`/admin/listings/${id}/moderate`, { approved });
      toast.success(approved ? "Одобрено" : "Отклонено");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось обновить");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Админ"
        title="Модерация объявлений"
        subtitle="Одобряйте или отклоняйте новые объявления от хостов."
      />

      <div className="mt-8">
        {loading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Всё чисто!"
            description="Нет объявлений, ожидающих модерации."
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border overflow-hidden hover:shadow-card transition-shadow"
              >
                <div className="aspect-[16/9] bg-muted">
                  <img
                    src={
                      item.photos?.[0] ||
                      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.city}
                    {item.district ? `, ${item.district}` : ""} · Хост:{" "}
                    {item.host?.fullName}
                  </p>
                  <p className="mt-2 font-semibold">
                    {Number(item.monthlyRent).toLocaleString("ru-RU")} ₸
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => moderate(item.id, true)}
                    >
                      <Check size={14} /> Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => moderate(item.id, false)}
                    >
                      <X size={14} /> Отклонить
                    </Button>
                    <Link to={`/listings/${item.id}`}>
                      <Button size="sm" variant="ghost">
                        <ExternalLink size={14} /> Открыть
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
