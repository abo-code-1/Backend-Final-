import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Input from "../components/common/Input";
import ConfirmModal from "../components/common/ConfirmModal";
import PageHeader from "../components/common/PageHeader";
import { PageSpinner } from "../components/common/Spinner";

const emptyForm = { slug: "", nameRu: "", imageUrl: "", sortOrder: 0 };

export default function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/cities/all");
      setItems(data.items || []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить города");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh every city dropdown across the app after a change.
  const invalidatePublic = () => queryClient.invalidateQueries({ queryKey: ["cities"] });

  const setField = (patch) => setForm((f) => ({ ...f, ...patch }));

  const startEdit = (city) => {
    setEditingId(city.id);
    setForm({
      slug: city.slug,
      nameRu: city.nameRu,
      imageUrl: city.imageUrl || "",
      sortOrder: city.sortOrder ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      nameRu: form.nameRu.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
    };
    if (!payload.slug || !payload.nameRu) {
      toast.error("Укажите слаг и название");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.patch(`/cities/${editingId}`, payload);
        toast.success("Город обновлён");
      } else {
        await apiClient.post("/cities", payload);
        toast.success("Город создан");
      }
      cancelEdit();
      await load();
      invalidatePublic();
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (city) => {
    try {
      await apiClient.patch(`/cities/${city.id}`, { isActive: !city.isActive });
      await load();
      invalidatePublic();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось обновить");
    }
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      await apiClient.delete(`/cities/${pendingDelete.id}`);
      toast.success("Город удалён");
      setPendingDelete(null);
      await load();
      invalidatePublic();
    } catch (e) {
      // 409 = listings still reference this city; surface the helpful message.
      toast.error(e.response?.data?.message || "Не удалось удалить");
      setPendingDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Супер-админ"
        title="Города"
        subtitle="Добавляйте и редактируйте города. Деактивированные города скрыты из фильтров."
      />

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border p-5 bg-card grid gap-4 md:grid-cols-5 md:items-end"
      >
        <Input
          label="Слаг (латиницей)"
          placeholder="например, taraz"
          value={form.slug}
          onChange={(e) => setField({ slug: e.target.value })}
          disabled={Boolean(editingId)}
        />
        <Input
          label="Название"
          placeholder="Тараз"
          value={form.nameRu}
          onChange={(e) => setField({ nameRu: e.target.value })}
        />
        <Input
          label="URL изображения"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={(e) => setField({ imageUrl: e.target.value })}
        />
        <Input
          label="Порядок"
          type="number"
          value={form.sortOrder}
          onChange={(e) => setField({ sortOrder: e.target.value })}
        />
        <div className="flex gap-2">
          <Button type="submit" loading={saving} className="gap-1.5">
            {editingId ? <Pencil size={16} /> : <Plus size={16} />}
            {editingId ? "Сохранить" : "Добавить"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              <X size={16} />
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Название</th>
                <th className="px-4 py-3 text-left font-semibold">Слаг</th>
                <th className="px-4 py-3 text-left font-semibold">Порядок</th>
                <th className="px-4 py-3 text-left font-semibold">Статус</th>
                <th className="px-4 py-3 text-right font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.nameRu}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.sortOrder}</td>
                  <td className="px-4 py-3">
                    {c.isActive ? (
                      <Badge variant="success">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Скрыт</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                        {c.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        {c.isActive ? "Скрыть" : "Показать"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setPendingDelete(c)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Городов пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title={`Удалить город «${pendingDelete?.nameRu}»?`}
        description="Если в городе есть объявления, удаление будет заблокировано — деактивируйте его вместо этого."
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setPendingDelete(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
