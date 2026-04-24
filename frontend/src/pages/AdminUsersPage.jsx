import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";
import ConfirmModal from "../components/common/ConfirmModal";

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [pendingBanUser, setPendingBanUser] = useState(null);

  const load = async () => {
    try {
      const { data } = await apiClient.get("/admin/users");
      setItems(data.items || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось загрузить пользователей");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const applyBan = async () => {
    if (!pendingBanUser) return;
    try {
      await apiClient.patch(`/admin/users/${pendingBanUser.id}/ban`, {
        isBanned: !pendingBanUser.isBanned
      });
      toast.success("Статус бана обновлен");
      setPendingBanUser(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось обновить бан");
    }
  };

  const setRole = async (userId, role) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role });
      toast.success("Роль обновлена");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось обновить роль");
    }
  };

  return (
    <main className="page">
      <h1>Admin Users</h1>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Role</th>
              <th>Ban</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isBanned ? "Banned" : "Active"}</td>
                <td>
                  <div className="row">
                    <select
                      value={user.role}
                      onChange={(e) => setRole(user.id, e.target.value)}
                    >
                      <option value="seeker">seeker</option>
                      <option value="host">host</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      className={user.isBanned ? "btn btn-secondary" : "btn btn-danger"}
                      type="button"
                      onClick={() => setPendingBanUser(user)}
                    >
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={Boolean(pendingBanUser)}
        title={pendingBanUser?.isBanned ? "Unban this user?" : "Ban this user?"}
        description="This changes account access status immediately."
        confirmText={pendingBanUser?.isBanned ? "Unban" : "Ban"}
        cancelText="Cancel"
        onCancel={() => setPendingBanUser(null)}
        onConfirm={applyBan}
      />
    </main>
  );
}
