import { Link } from "react-router-dom";
import { Heart, Star, ShieldCheck, MapPin } from "lucide-react";
import { cn } from "../../utils/cn";

const CITY_LABELS = {
  almaty: "Алматы",
  astana: "Астана",
  shymkent: "Шымкент",
};

const FALLBACK =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80";

export default function ListingCard({
  listing,
  isFavorite = false,
  onToggleFavorite,
  compact = false,
  showHeart = true,
}) {
  const photo = listing.photos?.[0] || FALLBACK;
  const cityLabel = CITY_LABELS[listing.city] || listing.city;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block focus:outline-none"
    >
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <div
          className={cn(
            "relative w-full overflow-hidden",
            compact ? "aspect-[4/3]" : "aspect-square"
          )}
        >
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>

        {showHeart && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(listing);
            }}
            aria-label={isFavorite ? "Убрать из избранного" : "В избранное"}
            className="absolute top-3 right-3 rounded-full p-2 text-white hover:scale-110 transition-transform"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          >
            <Heart
              size={22}
              strokeWidth={2}
              fill={isFavorite ? "#FF385C" : "rgba(0,0,0,0.35)"}
              className={isFavorite ? "text-primary" : "text-white"}
            />
          </button>
        )}

        {listing.host?.isIdVerified && (
          <div className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold shadow-soft flex items-center gap-1">
            <ShieldCheck size={12} className="text-success" />
            Проверено
          </div>
        )}
      </div>

      <div className="pt-3 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-tight line-clamp-1">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1 shrink-0 text-sm">
            <Star size={14} className="fill-foreground text-foreground" />
            <span className="font-medium">4,8{listing.id % 3 ? "5" : "2"}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
          <MapPin size={13} />
          {listing.district ? `${listing.district}, ` : ""}
          {cityLabel}
        </p>

        <p className="text-sm text-muted-foreground">
          {listing.availableRooms} из {listing.totalRooms} комнат ·{" "}
          {listing.furnished ? "с мебелью" : "без мебели"}
        </p>

        <p className="pt-1 text-[15px]">
          <span className="font-semibold">
            {Number(listing.monthlyRent).toLocaleString("ru-RU")} ₸
          </span>
          <span className="text-muted-foreground"> в месяц</span>
        </p>
      </div>
    </Link>
  );
}
