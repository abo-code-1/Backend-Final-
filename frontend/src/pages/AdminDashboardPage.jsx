import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get("/admin/stats");
        setStats(data.item);
      } catch (error) {
        toast.error(error.response?.data?.message || "Не удалось загрузить статистику");
      }
    };
    load();
  }, []);

  return (
    <main className="page">
      <h1>Admin Dashboard</h1>
      {!stats ? (
        <p>Загрузка...</p>
      ) : (
        <div className="listings-grid">
          <article className="card"><h3>Users</h3><p className="price">{stats.users}</p></article>
          <article className="card"><h3>Listings</h3><p className="price">{stats.listings}</p></article>
          <article className="card"><h3>Applications</h3><p className="price">{stats.applications}</p></article>
          <article className="card"><h3>Pending listings</h3><p className="price">{stats.pendingListings}</p></article>
          <article className="card"><h3>Pending verifications</h3><p className="price">{stats.pendingVerifications}</p></article>
        </div>
      )}
      <div className="row">
        <Link className="btn" to="/admin/users">Users</Link>
        <Link className="btn" to="/admin/listings">Listings</Link>
        <Link className="btn" to="/admin/verifications">Verifications</Link>
      </div>
    </main>
  );
}
