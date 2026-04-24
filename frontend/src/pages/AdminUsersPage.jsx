import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Ban, ShieldCheck } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import { PageSpinner } from "../components/common/Spinner";

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingBan, setPendingBan] = useState(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/users");
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

  const doBan = async () => {
    if (!pendingBan) return;
    try {
      await apiClient.patch(`/admin/users/${pendingBan.id}/ban`, {
        isBanned: !pendingBan.isBanned,
      });
      toast.success("Готово");
      setPendingBan(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось");
    }
  };

  const setRole = async (id, role) => {
    try {
      await apiClient.patch(`/admin/users/${id}/role`, { role });
      toast.success("Роль обновлена");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось");
    }
  };

  const filtered = items.filter((u) => {
    const term = q.toLowerCase().trim();
    if (!term) return true;
    return (
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <PageHeader
        eyebrow="Админ"
        title="Пользователи"
        subtitle="Управляйте ролями и блокировками."
      />

      <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <Input
          placeholder="Поиск по имени или email..."
          className="md:w-80"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Всего: <span className="font-semibold">{items.length}</span>
        </p>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Имя</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Роль</th>
                <th className="px-4 py-3 text-left font-semibold">Статус</th>
                <th className="px-4 py-3 text-right font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">#{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value)}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                    >
                      <option value="seeker">seeker</option>
                      <option value="host">host</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBanned ? (
                      <Badge variant="destructive">
                        <Ban size={12} /> Заблокирован
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <ShieldCheck size={12} /> Активен
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant={u.isBanned ? "primary" : "outline"}
                      className={!u.isBanned ? "text-destructive" : ""}
                      onClick={() => setPendingBan(u)}
                    >
                      {u.isBanned ? "Разблокировать" : "Заблокировать"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Никого не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingBan)}
        title={
          pendingBan?.isBanned
            ? "Разблокировать пользователя?"
            : "Заблокировать пользователя?"
        }
        description="Статус изменится немедленно."
        confirmText={pendingBan?.isBanned ? "Разблокировать" : "Заблокировать"}
        cancelText="Отмена"
        onCancel={() => setPendingBan(null)}
        onConfirm={doBan}
      />
    </div>
  );
}
