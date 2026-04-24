import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";
import ConfirmModal from "../components/common/ConfirmModal";

export default function ApplicationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingWithdrawId, setPendingWithdrawId] = useState(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/applications/me");
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const withdrawApplication = async () => {
    if (!pendingWithdrawId) return;
    try {
      await apiClient.patch(`/applications/${pendingWithdrawId}/withdraw`);
      toast.success("Заявка отозвана");
      setPendingWithdrawId(null);
      loadApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось отозвать заявку");
    }
  };

  return (
    <main className="page">
      <h1>Мои заявки</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="listings-grid">
          {items.map((application) => (
            <article key={application.id} className="card">
              <h3>{application.listing.title}</h3>
              <p>
                {application.listing.city}
                {application.listing.district ? `, ${application.listing.district}` : ""}
              </p>
              <p>Статус: {application.status}</p>
              <p>Сообщение: {application.message || "—"}</p>
              <div className="row">
                <Link className="btn" to={`/listings/${application.listing.id}`}>
                  Открыть объявление
                </Link>
                {application.status !== "withdrawn" && (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => setPendingWithdrawId(application.id)}
                  >
                    Отозвать
                  </button>
                )}
              </div>
            </article>
          ))}
          {items.length === 0 && <p>Вы пока не отправляли заявки.</p>}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingWithdrawId)}
        title="Withdraw this application?"
        description="This will mark your application as withdrawn. You can apply again later."
        confirmText="Withdraw"
        cancelText="Cancel"
        onCancel={() => setPendingWithdrawId(null)}
        onConfirm={withdrawApplication}
      />
    </main>
  );
}
