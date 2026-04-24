import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Trash2, ChevronLeft, Save, ImagePlus } from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Checkbox from "../components/common/Checkbox";
import Textarea from "../components/common/Textarea";
import PageHeader from "../components/common/PageHeader";
import { PageSpinner } from "../components/common/Spinner";

const emptyBill = {
  category: "utilities",
  label: "",
  amountKzt: "",
  isIncludedInRent: false,
  notes: "",
};

const CITY_OPTIONS = [
  { label: "Алматы", value: "almaty" },
  { label: "Астана", value: "astana" },
  { label: "Шымкент", value: "shymkent" },
];

const STATUS_OPTIONS = [
  { label: "Черновик", value: "draft" },
  { label: "Активно", value: "active" },
  { label: "В архиве", value: "archived" },
];

const BILL_CATEGORIES = [
  { label: "Аренда", value: "rent" },
  { label: "Коммунальные", value: "utilities" },
  { label: "Интернет", value: "internet" },
  { label: "Уборка", value: "cleaning" },
  { label: "Другое", value: "other" },
];

export default function ListingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "almaty",
    district: "",
    address: "",
    monthlyRent: "",
    deposit: "",
    totalRooms: 1,
    availableRooms: 1,
    maxOccupants: 1,
    currentOccupants: 0,
    furnished: false,
    internetIncluded: false,
    petsAllowed: false,
    status: "draft",
    photosText: "",
    houseRulesText: "",
    bills: [{ ...emptyBill }],
  });

  const title = useMemo(
    () => (isEdit ? "Редактирование объявления" : "Новое объявление"),
    [isEdit]
  );

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        const { data } = await apiClient.get(`/listings/${id}`);
        const item = data.item;
        setForm({
          title: item.title || "",
          description: item.description || "",
          city: item.city || "almaty",
          district: item.district || "",
          address: item.address || "",
          monthlyRent: item.monthlyRent || "",
          deposit: item.deposit || "",
          totalRooms: item.totalRooms || 1,
          availableRooms: item.availableRooms || 1,
          maxOccupants: item.maxOccupants || 1,
          currentOccupants: item.currentOccupants || 0,
          furnished: Boolean(item.furnished),
          internetIncluded: Boolean(item.internetIncluded),
          petsAllowed: Boolean(item.petsAllowed),
          status: item.status || "draft",
          photosText: (item.photos || []).join("\n"),
          houseRulesText: (item.houseRules || [])
            .map((r) => r.ruleText)
            .join("\n"),
          bills:
            item.bills && item.bills.length
              ? item.bills.map((b) => ({
                  id: b.id,
                  category: b.category,
                  label: b.label,
                  amountKzt: b.amountKzt,
                  isIncludedInRent: Boolean(b.isIncludedInRent),
                  notes: b.notes || "",
                }))
              : [{ ...emptyBill }],
        });
      } catch (e) {
        toast.error(e.response?.data?.message || "Не удалось загрузить");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const setField = (patch) => setForm((p) => ({ ...p, ...patch }));
  const updateBill = (i, patch) =>
    setForm((p) => {
      const bills = [...p.bills];
      bills[i] = { ...bills[i], ...patch };
      return { ...p, bills };
    });
  const addBill = () =>
    setForm((p) => ({ ...p, bills: [...p.bills, { ...emptyBill }] }));
  const removeBill = (i) =>
    setForm((p) => ({ ...p, bills: p.bills.filter((_, idx) => idx !== i) }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      title: form.title,
      description: form.description,
      city: form.city,
      district: form.district,
      address: form.address,
      monthlyRent: Number(form.monthlyRent),
      deposit: form.deposit ? Number(form.deposit) : undefined,
      totalRooms: Number(form.totalRooms),
      availableRooms: Number(form.availableRooms),
      maxOccupants: Number(form.maxOccupants),
      currentOccupants: Number(form.currentOccupants),
      furnished: form.furnished,
      internetIncluded: form.internetIncluded,
      petsAllowed: form.petsAllowed,
      status: form.status,
      photos: form.photosText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      houseRules: form.houseRulesText
        .split("\n")
        .map((s, i) => ({ ruleText: s.trim(), orderIndex: i }))
        .filter((r) => r.ruleText),
      bills: form.bills
        .filter((b) => b.label && b.amountKzt !== "")
        .map((b) => ({
          category: b.category,
          label: b.label,
          amountKzt: Number(b.amountKzt),
          isIncludedInRent: b.isIncludedInRent,
          notes: b.notes,
        })),
    };

    try {
      if (isEdit) {
        await apiClient.patch(`/listings/${id}`, payload);
        toast.success("Объявление обновлено");
      } else {
        await apiClient.post("/listings", payload);
        toast.success("Объявление создано");
      }
      navigate("/my-listings");
    } catch (e) {
      toast.error(e.response?.data?.message || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/my-listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ChevronLeft size={16} /> Мои объявления
      </Link>
      <PageHeader
        eyebrow={isEdit ? "Редактирование" : "Новое объявление"}
        title={title}
        subtitle="Расскажите о жилье — чем подробнее, тем больше откликов."
      />

      <form onSubmit={onSubmit} className="space-y-10 mt-8">
        <Section title="Основное">
          <Input
            label="Заголовок"
            required
            placeholder="Светлая комната в Медеу"
            value={form.title}
            onChange={(e) => setField({ title: e.target.value })}
          />
          <Textarea
            label="Описание"
            required
            rows={5}
            placeholder="Расскажите о квартире, атмосфере, соседях..."
            value={form.description}
            onChange={(e) => setField({ description: e.target.value })}
          />
          <div className="grid md:grid-cols-3 gap-4">
            <Select
              label="Город"
              value={form.city}
              onChange={(e) => setField({ city: e.target.value })}
              options={CITY_OPTIONS}
            />
            <Input
              label="Район"
              value={form.district}
              onChange={(e) => setField({ district: e.target.value })}
            />
            <Input
              label="Адрес"
              value={form.address}
              onChange={(e) => setField({ address: e.target.value })}
            />
          </div>
        </Section>

        <Section title="Цена и условия">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Аренда в месяц, ₸"
              type="number"
              required
              value={form.monthlyRent}
              onChange={(e) => setField({ monthlyRent: e.target.value })}
            />
            <Input
              label="Залог, ₸"
              type="number"
              value={form.deposit}
              onChange={(e) => setField({ deposit: e.target.value })}
            />
            <Input
              label="Всего комнат"
              type="number"
              min={1}
              value={form.totalRooms}
              onChange={(e) => setField({ totalRooms: e.target.value })}
            />
            <Input
              label="Свободно комнат"
              type="number"
              min={0}
              value={form.availableRooms}
              onChange={(e) => setField({ availableRooms: e.target.value })}
            />
            <Input
              label="Макс. жильцов"
              type="number"
              min={1}
              value={form.maxOccupants}
              onChange={(e) => setField({ maxOccupants: e.target.value })}
            />
            <Input
              label="Сейчас жильцов"
              type="number"
              min={0}
              value={form.currentOccupants}
              onChange={(e) => setField({ currentOccupants: e.target.value })}
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <Checkbox
              id="furn"
              label="С мебелью"
              checked={form.furnished}
              onChange={(e) => setField({ furnished: e.target.checked })}
            />
            <Checkbox
              id="wifi"
              label="Интернет включён"
              checked={form.internetIncluded}
              onChange={(e) =>
                setField({ internetIncluded: e.target.checked })
              }
            />
            <Checkbox
              id="pets"
              label="Можно с питомцем"
              checked={form.petsAllowed}
              onChange={(e) => setField({ petsAllowed: e.target.checked })}
            />
          </div>
          <Select
            label="Статус"
            value={form.status}
            onChange={(e) => setField({ status: e.target.value })}
            options={STATUS_OPTIONS}
          />
        </Section>

        <Section
          title="Фото"
          description="По одной ссылке на строку. Добавьте 3–5 качественных фото."
        >
          <Textarea
            icon={ImagePlus}
            placeholder="https://..."
            rows={4}
            value={form.photosText}
            onChange={(e) => setField({ photosText: e.target.value })}
          />
        </Section>

        <Section
          title="Правила дома"
          description="По одному правилу на строку. Например: «Не курить в квартире»."
        >
          <Textarea
            rows={4}
            value={form.houseRulesText}
            onChange={(e) => setField({ houseRulesText: e.target.value })}
          />
        </Section>

        <Section
          title="Ежемесячные платежи"
          description="Добавьте коммуналку, интернет и прочие обязательные расходы."
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBill}
            >
              <Plus size={14} /> Добавить
            </Button>
          }
        >
          <div className="space-y-3">
            {form.bills.map((bill, i) => (
              <div
                key={bill.id || i}
                className="grid grid-cols-1 md:grid-cols-[160px_1fr_140px_auto_auto] gap-3 items-end p-4 rounded-xl border bg-muted/20"
              >
                <Select
                  label="Тип"
                  value={bill.category}
                  onChange={(e) =>
                    updateBill(i, { category: e.target.value })
                  }
                  options={BILL_CATEGORIES}
                />
                <Input
                  label="Название"
                  value={bill.label}
                  onChange={(e) => updateBill(i, { label: e.target.value })}
                />
                <Input
                  label="Сумма, ₸"
                  type="number"
                  value={bill.amountKzt}
                  onChange={(e) =>
                    updateBill(i, { amountKzt: e.target.value })
                  }
                />
                <Checkbox
                  id={`bill-incl-${i}`}
                  label="Включено"
                  checked={bill.isIncludedInRent}
                  onChange={(e) =>
                    updateBill(i, { isIncludedInRent: e.target.checked })
                  }
                />
                <button
                  type="button"
                  onClick={() => removeBill(i)}
                  className="h-11 w-11 rounded-lg border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 flex items-center justify-center"
                  aria-label="Удалить платёж"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/my-listings")}
          >
            Отмена
          </Button>
          <Button type="submit" loading={saving}>
            <Save size={16} />
            {isEdit ? "Сохранить изменения" : "Создать объявление"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, description, actions, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
