import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Ban, ShieldCheck } from "lucide-react";
import { apiClient } from "../api/client";
import { isSuperAdmin } from "../utils/roles";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import { PageSpinner } from "../components/common/Spinner";
import Pagination from "../components/common/Pagination";

export default function AdminUsersPage() {
  const myRole = useSelector((s) => s.auth.role);
  const canManageAdmins = isSuperAdmin(myRole);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingBan, setPendingBan] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/admin/users", {
        params: { page, limit: pageSize, search: q || undefined },
      });
      const meta = data.pagination || { page: 1, totalPages: 1, total: 0 };
      if (meta.totalPages > 0 && page > meta.totalPages) {
        setPage(meta.totalPages);
        return;
      }
      setItems(data.items || []);
      setPagination(meta);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, q]);

  // Debounce search so we don't fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const changePageSize = (n) => {
    setPageSize(n);
    setPage(1);
  };

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
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <p className="text-sm text-muted-foreground">
          Всего: <span className="font-semibold">{pagination.total}</span>
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
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">#{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value)}
                      // Only a super admin may grant/revoke elevated roles or
                      // touch an account that already holds one.
                      disabled={
                        !canManageAdmins &&
                        ["admin", "super_admin"].includes(u.role)
                      }
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm disabled:opacity-60"
                    >
                      <option value="seeker">seeker</option>
                      <option value="host">host</option>
                      {(canManageAdmins || u.role === "admin") && (
                        <option value="admin">admin</option>
                      )}
                      {(canManageAdmins || u.role === "super_admin") && (
                        <option value="super_admin">super_admin</option>
                      )}
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
              {items.length === 0 && (
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

      {!loading && items.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={changePageSize}
        />
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
