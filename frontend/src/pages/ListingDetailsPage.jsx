import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCities } from "../hooks/useCities";
import { toast } from "react-toastify";
import {
  MapPin,
  Heart,
  Share2,
  ChevronLeft,
  CheckCircle2,
  User,
  Calendar,
  ShieldCheck,
  Home as HomeIcon,
  Wifi,
  Armchair,
  Users,
  Star,
  PawPrint,
  MessageCircle,
} from "lucide-react";
import { apiClient } from "../api/client";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Textarea from "../components/common/Textarea";
import { PageSpinner } from "../components/common/Spinner";
import { cn } from "../utils/cn";

const FALLBACKS = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
];

export default function ListingDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { cityLabel } = useCities();
  const navigate = useNavigate();
  const { token } = useSelector((s) => s.auth);
  const [message, setMessage] = useState("");

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/listings/${id}`);
      return data.item;
    },
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["favorite", id],
    queryFn: async () => {
      if (!token) return { isFavorite: false };
      const { data } = await apiClient.get("/favorites/check", {
        params: { listingId: id },
      });
      return data;
    },
    enabled: !!token,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!token) {
        toast.info("Войдите, чтобы сохранять в избранное");
        throw new Error("no-auth");
      }
      if (favoriteData?.isFavorite) {
        await apiClient.delete(`/favorites/${id}`);
      } else {
        await apiClient.post("/favorites", { listingId: Number(id) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", id] });
      toast.success(
        favoriteData?.isFavorite
          ? "Удалено из избранного"
          : "Добавлено в избранное"
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (msg) =>
      apiClient.post(`/listings/${id}/applications`, { message: msg }),
    onSuccess: () => {
      setMessage("");
      toast.success("Заявка отправлена!");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Не удалось отправить"),
  });

  const totalMonthly = useMemo(() => {
    if (!listing) return 0;
    const base = Number(listing.monthlyRent || 0);
    const bills = (listing.bills || []).reduce(
      (acc, b) =>
        b.isIncludedInRent ? acc : acc + Number(b.amountKzt || 0),
      0
    );
    return base + bills;
  }, [listing]);

  if (isLoading) return <PageSpinner label="Загружаем объявление..." />;

  if (!listing) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold mb-3">Объявление не найдено</h2>
        <p className="text-muted-foreground mb-6">
          Возможно оно было удалено или скрыто.
        </p>
        <Button onClick={() => navigate("/listings")}>
          Вернуться к поиску
        </Button>
      </div>
    );
  }

  const photos = [
    listing.photos?.[0] || FALLBACKS[0],
    listing.photos?.[1] || FALLBACKS[1],
    listing.photos?.[2] || FALLBACKS[2],
    listing.photos?.[3] || FALLBACKS[3],
    listing.photos?.[4] || FALLBACKS[4],
  ];
  const isFav = favoriteData?.isFavorite;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Ссылка скопирована");
    } catch {
      toast.info("Не удалось скопировать ссылку");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        to="/listings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ChevronLeft size={16} /> Назад к поиску
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
            {listing.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Star size={14} className="fill-foreground" />
              4.87 · 42 отзыва
            </span>
            <span className="hidden md:inline">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} />
              {listing.district ? `${listing.district}, ` : ""}
              {cityLabel(listing.city)}
            </span>
            {listing.host?.isIdVerified && (
              <>
                <span className="hidden md:inline">·</span>
                <Badge variant="success">
                  <ShieldCheck size={12} /> Проверено
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={share}
            className="h-10 px-3 rounded-full border inline-flex items-center gap-2 text-sm font-semibold hover:bg-muted"
          >
            <Share2 size={15} /> Поделиться
          </button>
          <button
            onClick={() => toggleFavorite.mutate()}
            className={cn(
              "h-10 px-3 rounded-full border inline-flex items-center gap-2 text-sm font-semibold",
              isFav
                ? "text-primary border-primary/30 bg-primary/5"
                : "hover:bg-muted"
            )}
          >
            <Heart size={15} fill={isFav ? "currentColor" : "none"} />
            {isFav ? "В избранном" : "Сохранить"}
          </button>
        </div>
      </div>

      {/* GALLERY */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[280px] md:h-[480px] mb-10">
        <div className="col-span-4 md:col-span-2 row-span-2">
          <img
            src={photos[0]}
            alt=""
            className="w-full h-full object-cover hover:brightness-95 cursor-pointer"
          />
        </div>
        {photos.slice(1, 5).map((p, i) => (
          <div key={i} className="hidden md:block">
            <img
              src={p}
              alt=""
              className="w-full h-full object-cover hover:brightness-95 cursor-pointer"
            />
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-12">
        <div>
          {/* host summary */}
          <div className="pb-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Комната, хост —{" "}
                  {listing.host?.fullName?.split(" ")[0] || "хозяин"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {listing.availableRooms} из {listing.totalRooms} комнат ·
                  до {listing.maxOccupants} жильцов ·{" "}
                  {listing.furnished ? "с мебелью" : "без мебели"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-foreground text-background flex items-center justify-center text-lg font-semibold">
                {listing.host?.fullName?.[0]?.toUpperCase() || "H"}
              </div>
            </div>
          </div>

          {/* features */}
          <div className="py-6 border-b space-y-5">
            <Feature
              icon={HomeIcon}
              title={`${listing.totalRooms}-комнатная квартира`}
              body={`Вам доступно ${listing.availableRooms} свободных комнат`}
            />
            <Feature
              icon={Armchair}
              title={listing.furnished ? "С мебелью" : "Без мебели"}
              body={
                listing.furnished
                  ? "Всё необходимое уже на месте"
                  : "Можно привезти свою"
              }
            />
            <Feature
              icon={Wifi}
              title={listing.internetIncluded ? "Интернет включён" : "Без интернета"}
              body={
                listing.internetIncluded
                  ? "Стоимость Wi-Fi уже в аренде"
                  : "Оплачивается отдельно"
              }
            />
            {listing.petsAllowed && (
              <Feature
                icon={PawPrint}
                title="Можно с питомцем"
                body="Хост одобряет домашних животных"
              />
            )}
          </div>

          {/* description */}
          <section className="py-6 border-b">
            <h3 className="text-xl font-semibold mb-3">Об этом жилье</h3>
            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </section>

          {/* bills */}
          {listing.bills?.length > 0 && (
            <section className="py-6 border-b">
              <h3 className="text-xl font-semibold mb-4">Ежемесячные платежи</h3>
              <div className="divide-y rounded-2xl border">
                {listing.bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div>
                      <p className="font-medium">{bill.label}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {bill.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {Number(bill.amountKzt).toLocaleString("ru-RU")} ₸
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {bill.isIncludedInRent
                          ? "Включено в аренду"
                          : "Оплачивается отдельно"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* house rules */}
          {listing.houseRules?.length > 0 && (
            <section className="py-6 border-b">
              <h3 className="text-xl font-semibold mb-3">Правила дома</h3>
              <ul className="grid sm:grid-cols-2 gap-3">
                {listing.houseRules.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-foreground mt-0.5 shrink-0"
                    />
                    <span>{rule.ruleText}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* host card */}
          <section className="py-8">
            <h3 className="text-xl font-semibold mb-4">О хозяине</h3>
            <div className="rounded-2xl border p-6">
              <div className="flex items-start gap-5">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold overflow-hidden border">
                  {listing.host?.avatarUrl ? (
                    <img
                      src={listing.host.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {listing.host?.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar size={12} /> На Roomie с 2024 г.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={listing.host?.isIdVerified ? "success" : "outline"}>
                      <ShieldCheck size={12} />
                      {listing.host?.isIdVerified
                        ? "ID проверен"
                        : "ID не проверен"}
                    </Badge>
                    <Badge variant={listing.host?.isPhoneVerified ? "success" : "outline"}>
                      <ShieldCheck size={12} />
                      {listing.host?.isPhoneVerified
                        ? "Телефон проверен"
                        : "Телефон не проверен"}
                    </Badge>
                  </div>
                  {listing.host?.bio && (
                    <p className="mt-4 text-sm text-foreground/80 italic">
                      “{listing.host.bio}”
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1">
                  <MessageCircle size={16} /> Написать
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* STICKY APPLY */}
        <aside>
          <div className="lg:sticky lg:top-28">
            <div className="rounded-2xl border shadow-card bg-card p-6">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-3xl font-bold">
                    {Number(listing.monthlyRent).toLocaleString("ru-RU")} ₸
                  </p>
                  <p className="text-sm text-muted-foreground">в месяц</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} className="fill-foreground" />
                  <span className="font-semibold">4.87</span>
                  <span className="text-muted-foreground">· 42</span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!token) {
                    toast.info("Войдите, чтобы отправить заявку");
                    return;
                  }
                  applyMutation.mutate(message);
                }}
                className="space-y-3"
              >
                <Textarea
                  placeholder="Расскажите хозяину немного о себе, когда планируете заселение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full h-12 text-base"
                  loading={applyMutation.isLoading}
                >
                  Отправить заявку
                </Button>
              </form>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Заявка ни к чему не обязывает
              </p>

              <div className="mt-6 pt-5 border-t space-y-2.5 text-sm">
                <Row
                  label={`${Number(listing.monthlyRent).toLocaleString("ru-RU")} ₸ × 1 мес.`}
                  value={`${Number(listing.monthlyRent).toLocaleString("ru-RU")} ₸`}
                />
                <Row
                  label="Коммунальные (не включ.)"
                  value={`${(totalMonthly - Number(listing.monthlyRent)).toLocaleString("ru-RU")} ₸`}
                />
                {listing.deposit && (
                  <Row
                    label="Залог"
                    value={`${Number(listing.deposit).toLocaleString("ru-RU")} ₸`}
                    muted
                  />
                )}
                <div className="flex justify-between pt-3 border-t font-semibold">
                  <span>Итого в месяц</span>
                  <span>{totalMonthly.toLocaleString("ru-RU")} ₸</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="flex items-start gap-4">
      <Icon size={24} className="text-foreground mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Row({ label, value, muted }) {
  return (
    <div
      className={cn(
        "flex justify-between",
        muted && "text-muted-foreground"
      )}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
