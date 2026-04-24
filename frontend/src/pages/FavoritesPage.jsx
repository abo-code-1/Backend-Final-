import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";
import ConfirmModal from "../components/common/ConfirmModal";

export default function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRemoveId, setPendingRemoveId] = useState(null);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/favorites");
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось загрузить избранное");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async () => {
    if (!pendingRemoveId) return;
    try {
      await apiClient.delete(`/favorites/${pendingRemoveId}`);
      toast.success("Удалено из избранного");
      setPendingRemoveId(null);
      loadFavorites();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось удалить из избранного");
    }
  };

  return (
    <main className="page">
      <h1>Избранное</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="listings-grid">
          {items.map((fav) => (
            <article key={fav.id} className="card">
              <h3>{fav.listing.title}</h3>
              <p>
                {fav.listing.city}
                {fav.listing.district ? `, ${fav.listing.district}` : ""}
              </p>
              <p className="price">
                {Number(fav.listing.monthlyRent).toLocaleString("ru-RU")} ₸ / мес
              </p>
              <div className="row">
                <Link className="btn" to={`/listings/${fav.listing.id}`}>
                  Открыть
                </Link>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => setPendingRemoveId(fav.listing.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
          {items.length === 0 && <p>Пока нет избранных объявлений.</p>}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingRemoveId)}
        title="Delete this favorite?"
        description="This listing will be removed from your favorites."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={removeFavorite}
      />
    </main>
  );
}
