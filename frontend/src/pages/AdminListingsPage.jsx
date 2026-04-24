import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";

export default function AdminListingsPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const { data } = await apiClient.get("/admin/listings/pending");
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось загрузить объявления");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id, approved) => {
    try {
      await apiClient.patch(`/admin/listings/${id}/moderate`, { approved });
      toast.success(approved ? "Объявление одобрено" : "Объявление отклонено");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось обновить модерацию");
    }
  };

  return (
    <main className="page">
      <h1>Admin Listings</h1>
      <div className="listings-grid">
        {items.map((item) => (
          <article key={item.id} className="card">
            <h3>{item.title}</h3>
            <p>{item.city}{item.district ? `, ${item.district}` : ""}</p>
            <p>Host: {item.host?.fullName}</p>
            <p className="price">{Number(item.monthlyRent).toLocaleString("ru-RU")} ₸</p>
            <div className="row">
              <button className="btn" type="button" onClick={() => moderate(item.id, true)}>
                Approve
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => moderate(item.id, false)}
              >
                Reject
              </button>
              <Link className="btn btn-secondary" to={`/listings/${item.id}`}>
                View
              </Link>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && <p>Нет объявлений, ожидающих модерации.</p>}
    </main>
  );
}
