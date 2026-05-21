import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus,
  X,
  Users,
  Receipt,
  Scale,
  Equal,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { cn } from "../utils/cn";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/common/Card";

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Math.random().toString(36).slice(2)}`);

const formatKzt = (n) => `${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₸`;

/**
 * Split an integer total across weights so the parts are whole tenge and sum
 * back to the exact total (largest-remainder method). Falls back to an even
 * split when all weights are zero/empty.
 */
function splitAmount(total, weights) {
  const n = weights.length;
  if (n === 0) return [];
  let w = weights.map((x) => (Number.isFinite(x) && x > 0 ? x : 0));
  let sum = w.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    w = w.map(() => 1);
    sum = n;
  }
  const raw = w.map((x) => (total * x) / sum);
  const floors = raw.map(Math.floor);
  let remainder = total - floors.reduce((a, b) => a + b, 0);
  const byFrac = raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const result = floors.slice();
  for (let k = 0; k < remainder; k += 1) result[byFrac[k % n].i] += 1;
  return result;
}

const DEFAULT_PEOPLE = () => [
  { id: uid(), name: "Сосед 1", share: 1 },
  { id: uid(), name: "Сосед 2", share: 1 },
];

const DEFAULT_EXPENSES = () => [
  { id: uid(), name: "Аренда", amount: "" },
  { id: uid(), name: "Коммунальные услуги", amount: "" },
];

export default function BillSplitPage() {
  const reduceMotion = useReducedMotion();
  const [people, setPeople] = useState(DEFAULT_PEOPLE);
  const [expenses, setExpenses] = useState(DEFAULT_EXPENSES);
  const [mode, setMode] = useState("even"); // "even" | "shares"

  const { total, perPerson } = useMemo(() => {
    const sum = expenses.reduce(
      (acc, e) => acc + (parseFloat(e.amount) || 0),
      0
    );
    const weights =
      mode === "shares"
        ? people.map((p) => Number(p.share) || 0)
        : people.map(() => 1);
    const amounts = splitAmount(Math.round(sum), weights);
    return {
      total: sum,
      perPerson: people.map((p, i) => ({ ...p, amount: amounts[i] || 0 })),
    };
  }, [expenses, people, mode]);

  const addPerson = () =>
    setPeople((prev) => [
      ...prev,
      { id: uid(), name: `Сосед ${prev.length + 1}`, share: 1 },
    ]);

  const removePerson = (id) =>
    setPeople((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));

  const updatePerson = (id, patch) =>
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const addExpense = () =>
    setExpenses((prev) => [...prev, { id: uid(), name: "", amount: "" }]);

  const removeExpense = (id) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));

  const updateExpense = (id, patch) =>
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const reset = () => {
    setPeople(DEFAULT_PEOPLE());
    setExpenses(DEFAULT_EXPENSES());
    setMode("even");
  };

  const shareSum = people.reduce((s, p) => s + (Number(p.share) || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Инструменты"
        title="Калькулятор аренды и счетов"
        subtitle="Честно разделите аренду и коммунальные платежи между соседями — поровну или по долям комнат."
        actions={
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Сбросить
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expenses */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                Расходы
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={addExpense}>
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-end gap-2">
                  <Input
                    className="flex-1"
                    label="Статья"
                    value={e.name}
                    placeholder="Например, Интернет"
                    onChange={(ev) => updateExpense(e.id, { name: ev.target.value })}
                  />
                  <Input
                    className="w-36"
                    label="Сумма, ₸"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={e.amount}
                    placeholder="0"
                    onChange={(ev) =>
                      updateExpense(e.id, { amount: ev.target.value })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить статью ${e.name || ""}`}
                    onClick={() => removeExpense(e.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Добавьте хотя бы одну статью расходов.
                </p>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Соседи
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={addPerson}>
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Split mode */}
              <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
                <SplitTab
                  active={mode === "even"}
                  onClick={() => setMode("even")}
                  icon={Equal}
                  label="Поровну"
                />
                <SplitTab
                  active={mode === "shares"}
                  onClick={() => setMode("shares")}
                  icon={Scale}
                  label="По долям"
                />
              </div>

              {people.map((p) => (
                <div key={p.id} className="flex items-end gap-2">
                  <Input
                    className="flex-1"
                    label="Имя"
                    value={p.name}
                    onChange={(ev) => updatePerson(p.id, { name: ev.target.value })}
                  />
                  {mode === "shares" && (
                    <Input
                      className="w-28"
                      label="Доля"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="0.5"
                      value={p.share}
                      hint={
                        shareSum > 0
                          ? `${Math.round(((Number(p.share) || 0) / shareSum) * 100)}%`
                          : undefined
                      }
                      onChange={(ev) =>
                        updatePerson(p.id, { share: ev.target.value })
                      }
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить соседа ${p.name || ""}`}
                    onClick={() => removePerson(p.id)}
                    disabled={people.length <= 1}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {mode === "shares" && (
                <p className="text-xs text-muted-foreground">
                  Доля — относительный вес (например, у кого комната больше). Платежи
                  считаются пропорционально.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:sticky lg:top-24"
        >
          <Card className="bg-primary text-primary-foreground border-transparent shadow-card overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
                <Wallet className="h-4 w-4" />
                Итого в месяц
              </div>
              <div className="mt-1 text-4xl font-bold tracking-tight">
                {formatKzt(total)}
              </div>
              <p className="mt-1 text-sm text-primary-foreground/70">
                {people.length}{" "}
                {pluralRu(people.length, "сосед", "соседа", "соседей")} ·{" "}
                {mode === "even" ? "поровну" : "по долям"}
              </p>

              <div className="my-5 h-px bg-primary-foreground/20" />

              <ul className="space-y-2.5">
                {perPerson.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-sm text-primary-foreground/90">
                      {p.name || "Без имени"}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatKzt(p.amount)}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-xs text-primary-foreground/60">
                Суммы округлены до тенге; остаток распределяется так, чтобы итог
                совпадал точно.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function SplitTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 h-8 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-soft"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function pluralRu(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
