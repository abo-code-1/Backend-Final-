import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";

const emptyBill = {
  category: "utilities",
  label: "",
  amountKzt: "",
  isIncludedInRent: false,
  notes: ""
};

export default function ListingFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
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
    bills: [{ ...emptyBill }]
  });

  const titleText = useMemo(
    () => (isEdit ? "Редактирование объявления" : "Новое объявление"),
    [isEdit]
  );

  useEffect(() => {
    const loadEditData = async () => {
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
          houseRulesText: (item.houseRules || []).map((r) => r.ruleText).join("\n"),
          bills:
            item.bills && item.bills.length
              ? item.bills.map((b) => ({
                  id: b.id,
                  category: b.category,
                  label: b.label,
                  amountKzt: b.amountKzt,
                  isIncludedInRent: Boolean(b.isIncludedInRent),
                  notes: b.notes || ""
                }))
              : [{ ...emptyBill }]
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Не удалось загрузить объявление");
      } finally {
        setLoading(false);
      }
    };
    loadEditData();
  }, [id, isEdit]);

  const updateBill = (index, patch) => {
    setForm((prev) => {
      const bills = [...prev.bills];
      bills[index] = { ...bills[index], ...patch };
      return { ...prev, bills };
    });
  };

  const addBill = () => setForm((prev) => ({ ...prev, bills: [...prev.bills, { ...emptyBill }] }));
  const removeBill = (index) =>
    setForm((prev) => ({
      ...prev,
      bills: prev.bills.filter((_, i) => i !== index)
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        .map((x) => x.trim())
        .filter(Boolean),
      houseRules: form.houseRulesText
        .split("\n")
        .map((x, index) => ({ ruleText: x.trim(), orderIndex: index }))
        .filter((x) => x.ruleText),
      bills: form.bills
        .filter((bill) => bill.label && bill.amountKzt !== "")
        .map((bill) => ({
          category: bill.category,
          label: bill.label,
          amountKzt: Number(bill.amountKzt),
          isIncludedInRent: bill.isIncludedInRent,
          notes: bill.notes
        }))
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Не удалось сохранить объявление");
    }
  };

  if (loading) {
    return (
      <main className="page">
        <p>Загрузка...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>{titleText}</h1>
      <form className="form listing-form" onSubmit={handleSubmit}>
        <label>
          Заголовок
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </label>
        <label>
          Описание
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
        </label>
        <label>
          Город
          <select
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          >
            <option value="almaty">Almaty</option>
            <option value="astana">Astana</option>
            <option value="shymkent">Shymkent</option>
          </select>
        </label>
        <label>
          Район
          <input
            value={form.district}
            onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
          />
        </label>
        <label>
          Адрес
          <input
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        </label>
        <label>
          Цена в месяц (₸)
          <input
            type="number"
            value={form.monthlyRent}
            onChange={(e) => setForm((prev) => ({ ...prev, monthlyRent: e.target.value }))}
            required
          />
        </label>
        <label>
          Залог (₸)
          <input
            type="number"
            value={form.deposit}
            onChange={(e) => setForm((prev) => ({ ...prev, deposit: e.target.value }))}
          />
        </label>
        <div className="row">
          <label>
            Всего комнат
            <input
              type="number"
              value={form.totalRooms}
              onChange={(e) => setForm((prev) => ({ ...prev, totalRooms: e.target.value }))}
            />
          </label>
          <label>
            Доступно комнат
            <input
              type="number"
              value={form.availableRooms}
              onChange={(e) => setForm((prev) => ({ ...prev, availableRooms: e.target.value }))}
            />
          </label>
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={form.furnished}
            onChange={(e) => setForm((prev) => ({ ...prev, furnished: e.target.checked }))}
          />
          Меблировано
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.internetIncluded}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, internetIncluded: e.target.checked }))
            }
          />
          Интернет включен
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.petsAllowed}
            onChange={(e) => setForm((prev) => ({ ...prev, petsAllowed: e.target.checked }))}
          />
          Можно с питомцами
        </label>
        <label>
          Статус
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Фото (по одному URL в строке)
          <textarea
            rows={3}
            value={form.photosText}
            onChange={(e) => setForm((prev) => ({ ...prev, photosText: e.target.value }))}
          />
        </label>
        <label>
          Правила дома (по одному правилу в строке)
          <textarea
            rows={3}
            value={form.houseRulesText}
            onChange={(e) => setForm((prev) => ({ ...prev, houseRulesText: e.target.value }))}
          />
        </label>

        <section className="card">
          <h3>Bills</h3>
          {form.bills.map((bill, index) => (
            <div key={bill.id || index} className="bill-row">
              <select
                value={bill.category}
                onChange={(e) => updateBill(index, { category: e.target.value })}
              >
                <option value="rent">rent</option>
                <option value="utilities">utilities</option>
                <option value="internet">internet</option>
                <option value="cleaning">cleaning</option>
                <option value="other">other</option>
              </select>
              <input
                placeholder="Label"
                value={bill.label}
                onChange={(e) => updateBill(index, { label: e.target.value })}
              />
              <input
                type="number"
                placeholder="Amount"
                value={bill.amountKzt}
                onChange={(e) => updateBill(index, { amountKzt: e.target.value })}
              />
              <label className="check">
                <input
                  type="checkbox"
                  checked={bill.isIncludedInRent}
                  onChange={(e) =>
                    updateBill(index, { isIncludedInRent: e.target.checked })
                  }
                />
                Included
              </label>
              <button className="btn btn-danger" type="button" onClick={() => removeBill(index)}>
                Remove
              </button>
            </div>
          ))}
          <button className="btn btn-secondary" type="button" onClick={addBill}>
            Add bill
          </button>
        </section>

        <button className="btn" type="submit">
          {isEdit ? "Сохранить изменения" : "Создать объявление"}
        </button>
      </form>
    </main>
  );
}
