import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { apiClient } from "../api/client";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import ConfirmModal from "../components/common/ConfirmModal";
import ImageUploadField from "../components/common/ImageUploadField";
import Input from "../components/common/Input";
import PageHeader from "../components/common/PageHeader";
import Select from "../components/common/Select";
import Textarea from "../components/common/Textarea";
import { PageSpinner } from "../components/common/Spinner";

const emptyForm = {
  cityId: "",
  name: "",
  description: "",
  imageUrl: "",
  priceLabel: "",
  trendLabel: "",
  tagsText: "",
  sortOrder: 0,
};

const tagsFromText = (value) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export default function AdminNeighborhoodsPage() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [neighborhoodsRes, citiesRes] = await Promise.all([
        apiClient.get("/neighborhoods/all"),
        apiClient.get("/cities/all"),
      ]);
      const nextCities = citiesRes.data.items || [];
      setItems(neighborhoodsRes.data.items || []);
      setCities(nextCities);
      setForm((current) => ({
        ...current,
        cityId: current.cityId || (nextCities[0] ? String(nextCities[0].id) : ""),
      }));
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось загрузить районы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cityOptions = cities.map((city) => ({
    value: String(city.id),
    label: city.nameRu,
  }));

  const invalidatePublic = () =>
    queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });

  const setField = (patch) => setForm((f) => ({ ...f, ...patch }));

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      cityId: cities[0] ? String(cities[0].id) : "",
    });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      cityId: String(item.cityId),
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      priceLabel: item.priceLabel || "",
      trendLabel: item.trendLabel || "",
      tagsText: (item.tags || []).join(", "),
      sortOrder: item.sortOrder ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      cityId: Number(form.cityId),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      priceLabel: form.priceLabel.trim() || undefined,
      trendLabel: form.trendLabel.trim() || undefined,
      tags: tagsFromText(form.tagsText),
      sortOrder: Number(form.sortOrder) || 0,
    };

    if (!payload.cityId || !payload.name) {
      toast.error("Выберите город и укажите название района");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await apiClient.patch(`/neighborhoods/${editingId}`, payload);
        toast.success("Район обновлён");
      } else {
        await apiClient.post("/neighborhoods", payload);
        toast.success("Район создан");
      }
      resetForm();
      await load();
      invalidatePublic();
    } catch (err) {
      toast.error(err.response?.data?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await apiClient.patch(`/neighborhoods/${item.id}`, {
        isActive: !item.isActive,
      });
      await load();
      invalidatePublic();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось обновить");
    }
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      await apiClient.delete(`/neighborhoods/${pendingDelete.id}`);
      toast.success("Район удалён");
      setPendingDelete(null);
      await load();
      invalidatePublic();
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось удалить");
      setPendingDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Супер-админ"
        title="Районы"
        subtitle="Добавляйте и редактируйте районы для публичного каталога и поиска жилья."
      />

      <form
        onSubmit={submit}
        className="mt-6 rounded-2xl border p-5 bg-card grid gap-4 lg:grid-cols-6 lg:items-end"
      >
        <Select
          label="Город"
          value={form.cityId}
          onChange={(e) => setField({ cityId: e.target.value })}
          options={cityOptions}
          disabled={cityOptions.length === 0}
        />
        <Input
          label="Название"
          placeholder="Медеуский"
          value={form.name}
          onChange={(e) => setField({ name: e.target.value })}
        />
        <Input
          label="Цена"
          placeholder="От 120 000 ₸"
          value={form.priceLabel}
          onChange={(e) => setField({ priceLabel: e.target.value })}
        />
        <Input
          label="Тренд"
          placeholder="+5%"
          value={form.trendLabel}
          onChange={(e) => setField({ trendLabel: e.target.value })}
        />
        <Input
          label="Порядок"
          type="number"
          value={form.sortOrder}
          onChange={(e) => setField({ sortOrder: e.target.value })}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            loading={saving}
            disabled={cityOptions.length === 0}
            className="gap-1.5"
          >
            {editingId ? <Pencil size={16} /> : <Plus size={16} />}
            {editingId ? "Сохранить" : "Добавить"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              <X size={16} />
            </Button>
          )}
        </div>

        <div className="lg:col-span-3">
          <Textarea
            label="Описание"
            rows={3}
            value={form.description}
            onChange={(e) => setField({ description: e.target.value })}
          />
        </div>
        <div className="lg:col-span-2">
          <ImageUploadField
            value={form.imageUrl}
            onChange={(imageUrl) => setField({ imageUrl })}
          />
        </div>
        <Input
          label="Теги через запятую"
          placeholder="Транспорт, Учёба, Кафе"
          value={form.tagsText}
          onChange={(e) => setField({ tagsText: e.target.value })}
        />
      </form>

      {loading ? (
        <PageSpinner />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Район</th>
                <th className="px-4 py-3 text-left font-semibold">Город</th>
                <th className="px-4 py-3 text-left font-semibold">Порядок</th>
                <th className="px-4 py-3 text-left font-semibold">Статус</th>
                <th className="px-4 py-3 text-right font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {item.description || "Без описания"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.cityName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.sortOrder}
                  </td>
                  <td className="px-4 py-3">
                    {item.isActive ? (
                      <Badge variant="success">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Скрыт</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleActive(item)}
                      >
                        {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        {item.isActive ? "Скрыть" : "Показать"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setPendingDelete(item)}
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
                    Районов пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingDelete)}
        title={`Удалить район «${pendingDelete?.name}»?`}
        description="Если в районе есть объявления, удаление будет заблокировано — скройте его вместо этого."
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setPendingDelete(null)}
        onConfirm={doDelete}
      />
    </div>
  );
}
