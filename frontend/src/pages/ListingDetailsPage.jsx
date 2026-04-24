import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiClient } from "../api/client";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Heart, 
  Share2, 
  ChevronLeft, 
  Info, 
  CheckCircle2, 
  User, 
  Calendar, 
  ShieldCheck,
  CreditCard,
  Home,
  Wifi,
  Armchair,
  Users
} from "lucide-react";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/common/Card";
import { cn } from "../utils/cn";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { token } = useSelector((state) => state.auth);
  const [applyMessage, setApplyMessage] = useState("");

  const { data: listingData, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/listings/${id}`);
      return data.item;
    }
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["favorite", id],
    queryFn: async () => {
      if (!token) return { isFavorite: false };
      const { data } = await apiClient.get("/favorites/check", {
        params: { listingId: id }
      });
      return data;
    },
    enabled: !!token
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (favoriteData?.isFavorite) {
        return apiClient.delete(`/favorites/${id}`);
      } else {
        return apiClient.post("/favorites", { listingId: Number(id) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["favorite", id]);
      toast.success(favoriteData?.isFavorite ? "Удалено из избранного" : "Добавлено в избранное");
    }
  });

  const applyMutation = useMutation({
    mutationFn: async (message) => {
      return apiClient.post(`/listings/${id}/applications`, { message });
    },
    onSuccess: () => {
      setApplyMessage("");
      toast.success("Заявка успешно отправлена!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Не удалось отправить заявку");
    }
  });

  const totalMonthlyCost = useMemo(() => {
    if (!listingData) return 0;
    const base = Number(listingData.monthlyRent || 0);
    const billsSum = (listingData.bills || []).reduce((acc, bill) => {
      if (bill.isIncludedInRent) return acc;
      return acc + Number(bill.amountKzt || 0);
    }, 0);
    return base + billsSum;
  }, [listingData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
        <div className="h-10 w-1/3 bg-muted rounded" />
        <div className="h-[400px] w-full bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-40 bg-muted rounded-xl" />
            <div className="h-60 bg-muted rounded-xl" />
          </div>
          <div className="h-80 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!listingData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Объявление не найдено</h2>
        <Link to="/listings">
          <Button>Вернуться к поиску</Button>
        </Link>
      </div>
    );
  }

  const item = listingData;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-4">
        <Link to="/listings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
          <ChevronLeft size={16} className="mr-1" />
          Назад к списку
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className="px-3">{item.city}</Badge>
              {item.district && <Badge variant="outline" className="px-3">{item.district}</Badge>}
              <Badge variant="success" className="px-3">Активно</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{item.title}</h1>
            <div className="flex items-center text-muted-foreground">
              <MapPin size={18} className="mr-2 text-primary" />
              <span>{item.address || "Адрес не указан"}, {item.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => toggleFavoriteMutation.mutate()}
              className={cn(favoriteData?.isFavorite && "text-red-500 bg-red-50 border-red-200")}
            >
              <Heart size={20} fill={favoriteData?.isFavorite ? "currentColor" : "none"} />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[500px]">
        <div className="md:col-span-3 rounded-2xl overflow-hidden border relative group">
          <img 
            src={item.photos?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80"} 
            alt="Main photo"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="hidden md:flex flex-col gap-4">
          <div className="flex-1 rounded-2xl overflow-hidden border relative group">
            <img 
              src={item.photos?.[1] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80"} 
              alt="Secondary photo"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border relative group">
            <img 
              src={item.photos?.[2] || "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80"} 
              alt="Third photo"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Смотреть все фото
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                <Home className="text-primary mb-1" size={20} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Комнаты</span>
                <span className="font-bold">{item.availableRooms} из {item.totalRooms}</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                <Armchair className="text-primary mb-1" size={20} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Мебель</span>
                <span className="font-bold">{item.furnished ? "Есть" : "Нет"}</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                <Wifi className="text-primary mb-1" size={20} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Wi-Fi</span>
                <span className="font-bold">{item.internetIncluded ? "Включен" : "Нет"}</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/30 border-none">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-1">
                <Users className="text-primary mb-1" size={20} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Максимум</span>
                <span className="font-bold">{item.maxOccupants} чел.</span>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <section className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight">Описание</h3>
            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </section>

          {/* Bills Grid */}
          <section className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight">Ежемесячные платежи</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.bills?.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <div className="font-semibold">{bill.label}</div>
                      <div className="text-xs text-muted-foreground">{bill.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{Number(bill.amountKzt).toLocaleString("ru-RU")} ₸</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">
                      {bill.isIncludedInRent ? "Включено в аренду" : "Оплачивается отдельно"}
                    </div>
                  </div>
                </div>
              ))}
              {(!item.bills || item.bills.length === 0) && (
                <p className="text-muted-foreground italic md:col-span-2">Платежи не указаны</p>
              )}
            </div>
          </section>

          {/* Rules */}
          <section className="space-y-4">
            <h3 className="text-2xl font-bold tracking-tight">Правила дома</h3>
            <div className="bg-muted/20 rounded-2xl p-6 border border-dashed">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.houseRules?.map((rule) => (
                  <li key={rule.id} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-primary mt-1 shrink-0" />
                    <span className="text-muted-foreground">{rule.ruleText}</span>
                  </li>
                ))}
                {(!item.houseRules || item.houseRules.length === 0) && (
                  <li className="text-muted-foreground italic">Особых правил не указано</li>
                )}
              </ul>
            </div>
          </section>
        </div>

        {/* Sidebar Sticky Actions */}
        <aside className="space-y-6">
          <div className="sticky top-24 space-y-6">
            <Card className="shadow-2xl border-primary/20 overflow-hidden">
              <div className="bg-primary px-6 py-4 text-primary-foreground">
                <div className="text-sm font-medium opacity-80">Итого в месяц</div>
                <div className="text-3xl font-bold">{totalMonthlyCost.toLocaleString("ru-RU")} ₸</div>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Аренда</span>
                    <span className="font-semibold">{Number(item.monthlyRent).toLocaleString("ru-RU")} ₸</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доп. услуги</span>
                    <span className="font-semibold">
                      {(totalMonthlyCost - Number(item.monthlyRent)).toLocaleString("ru-RU")} ₸
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-3 border-t">
                    <span className="text-muted-foreground">Депозит</span>
                    <span className="font-semibold text-amber-600">
                      {item.deposit ? `${Number(item.deposit).toLocaleString("ru-RU")} ₸` : "Не требуется"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <Info size={16} className="text-primary" />
                    Откликнуться
                  </h4>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!token) {
                      toast.info("Войдите, чтобы отправить заявку");
                      return;
                    }
                    applyMutation.mutate(applyMessage);
                  }} className="space-y-4">
                    <textarea 
                      className="w-full min-h-[100px] p-3 rounded-xl border bg-muted/20 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      placeholder="Расскажите немного о себе..."
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                    />
                    <Button 
                      className="w-full font-bold h-12" 
                      type="submit"
                      loading={applyMutation.isLoading}
                    >
                      Отправить заявку
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>

            {/* Host Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">О хозяине</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl overflow-hidden border">
                    {item.host?.avatarUrl ? (
                      <img src={item.host.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg leading-tight">{item.host?.fullName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      На Roomie с 2024 г.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold border",
                    item.host?.isIdVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-muted text-muted-foreground border-border"
                  )}>
                    <ShieldCheck size={14} />
                    {item.host?.isIdVerified ? "ID ПОДТВЕРЖДЕН" : "ID НЕ ПОДТВЕРЖДЕН"}
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold border",
                    item.host?.isPhoneVerified ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-muted text-muted-foreground border-border"
                  )}>
                    <ShieldCheck size={14} />
                    {item.host?.isPhoneVerified ? "ТЕЛЕФОН ПОДТВЕРЖДЕН" : "ТЕЛЕФОН НЕ ПОДТВЕРЖДЕН"}
                  </div>
                </div>

                {item.host?.bio && (
                  <p className="text-sm text-muted-foreground italic border-t pt-4">
                    "{item.host.bio}"
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
