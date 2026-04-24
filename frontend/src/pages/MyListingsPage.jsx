import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";
import ConfirmModal from "../components/common/ConfirmModal";

export default function MyListingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const loadMyListings = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/listings/mine");
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось загрузить объявления");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyListings();
  }, []);

  const archiveListing = async (listingId) => {
    try {
      await apiClient.patch(`/listings/${listingId}`, { status: "archived" });
      toast.success("Объявление архивировано");
      loadMyListings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось архивировать");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await apiClient.delete(`/listings/${pendingDeleteId}`);
      toast.success("Объявление удалено");
      setPendingDeleteId(null);
      loadMyListings();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось удалить объявление");
    }
  };

  return (
    <main className="page">
      <div className="details-header">
        <h1>Мои объявления</h1>
        <Link className="btn" to="/listings/new">
          Добавить объявление
        </Link>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="listings-grid">
          {items.map((item) => (
            <article key={item.id} className="card">
              <h3>{item.title}</h3>
              <p>
                {item.city}
                {item.district ? `, ${item.district}` : ""}
              </p>
              <p className="price">{Number(item.monthlyRent).toLocaleString("ru-RU")} ₸</p>
              <p>Статус: {item.status}</p>
              <div className="row">
                <Link className="btn" to={`/listings/${item.id}/edit`}>
                  Редактировать
                </Link>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => archiveListing(item.id)}
                >
                  Архивировать
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => setPendingDeleteId(item.id)}
                >
                  Удалить
                </button>
              </div>
            </article>
          ))}
          {items.length === 0 && <p>У вас пока нет объявлений.</p>}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDeleteId)}
        title="Delete this listing?"
        description="This removes the listing and all associated bills. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
