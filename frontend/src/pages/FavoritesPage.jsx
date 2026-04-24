import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Heart } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ListingCard from "../components/listings/ListingCard";
import ListingSkeleton from "../components/listings/ListingSkeleton";

export default function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemove, setPendingRemove] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/favorites");
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

  const doRemove = async () => {
    if (!pendingRemove) return;
    try {
      await apiClient.delete(`/favorites/${pendingRemove}`);
      toast.success("Удалено из избранного");
      setPendingRemove(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось удалить");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Профиль"
        title="Избранное"
        subtitle="Объявления, которые вам понравились. Храним без ограничений."
      />

      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Пока нет избранного"
            description="Откройте поиск и сохраните интересные варианты, нажав на сердечко."
            action={
              <Link to="/listings">
                <Button>К объявлениям</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10">
            {items.map((fav) => (
              <div key={fav.id} className="group relative">
                <ListingCard
                  listing={fav.listing}
                  isFavorite
                  onToggleFavorite={() => setPendingRemove(fav.listing.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingRemove)}
        title="Убрать из избранного?"
        description="Объявление можно будет вернуть снова в любой момент."
        confirmText="Убрать"
        cancelText="Отмена"
        onCancel={() => setPendingRemove(null)}
        onConfirm={doRemove}
      />
    </div>
  );
}
