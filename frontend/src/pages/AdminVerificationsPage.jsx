import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";

export default function AdminVerificationsPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const { data } = await apiClient.get("/admin/verifications/pending");
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось загрузить верификации");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const review = async (id, status) => {
    try {
      await apiClient.patch(`/admin/verifications/${id}/review`, { status });
      toast.success(status === "approved" ? "ID подтвержден" : "ID отклонен");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось обновить верификацию");
    }
  };

  return (
    <main className="page">
      <h1>Admin Verifications</h1>
      <div className="listings-grid">
        {items.map((item) => (
          <article key={item.id} className="card">
            <h3>{item.user?.fullName}</h3>
            <p>{item.user?.email}</p>
            <p>ID image: {item.imageUrl}</p>
            <div className="row">
              <button className="btn" type="button" onClick={() => review(item.id, "approved")}>
                Approve
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={() => review(item.id, "rejected")}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && <p>Нет pending ID-верификаций.</p>}
    </main>
  );
}
