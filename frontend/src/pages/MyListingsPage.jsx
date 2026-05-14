import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Plus,
  Edit3,
  Archive,
  Trash2,
  Home as HomeIcon,
  Eye,
  Users,
} from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import { PageSpinner } from "../components/common/Spinner";

const STATUS_STYLE = {
  active: { label: "Активно", variant: "success" },
  draft: { label: "Черновик", variant: "warning" },
  archived: { label: "В архиве", variant: "secondary" },
  pending: { label: "На модерации", variant: "warning" },
};

export default function MyListingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/listings/mine");
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

  const archive = async (id) => {
    try {
      await apiClient.patch(`/listings/${id}`, { status: "archived" });
      toast.success("Объявление в архиве");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось архивировать");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await apiClient.delete(`/listings/${pendingDelete}`);
      toast.success("Объявление удалено");
      setPendingDelete(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось удалить");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Хост"
        title="Мои объявления"
        subtitle="Управляйте своими комнатами, заявками и статусом."
        actions={
          <Link to="/listings/new">
            <Button>
              <Plus size={16} /> Новое объявление
            </Button>
          </Link>
        }
      />

      <div className="mt-8">
        {loading ? (
          <PageSpinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={HomeIcon}
            title="У вас пока нет объявлений"
            description="Разместите первую комнату — это бесплатно и занимает пару минут."
            action={
              <Link to="/listings/new">
                <Button>
                  <Plus size={16} /> Разместить
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const status = STATUS_STYLE[item.status] || {
                label: item.status,
                variant: "secondary",
              };
              return (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row md:items-center gap-5 rounded-2xl border p-4 hover:shadow-card transition-shadow"
                >
                  <div className="h-28 md:h-24 md:w-32 rounded-xl overflow-hidden bg-muted shrink-0">
                    <img
                      src={
                        item.photos?.[0] ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600"
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.city}
                      {item.district ? `, ${item.district}` : ""}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">
                        {Number(item.monthlyRent).toLocaleString("ru-RU")} ₸
                      </span>
                      <span className="text-muted-foreground"> / мес</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Link to={`/listings/${item.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye size={14} /> Просмотр
                      </Button>
                    </Link>
                    <Link to={`/listings/${item.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit3 size={14} /> Изменить
                      </Button>
                    </Link>
                    <Link to={`/listings/${item.id}/applicants`}>
                      <Button variant="outline" size="sm">
                        <Users size={14} /> Заявки
                      </Button>
                    </Link>
                    {item.status !== "archived" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archive(item.id)}
                      >
                        <Archive size={14} /> В архив
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingDelete(item.id)}
                      className="text-destructive hover:bg-destructive/5"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title="Удалить объявление?"
        description="Это действие необратимо. Все связанные платежи будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
