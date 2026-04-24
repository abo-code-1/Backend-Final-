import { cn } from "../../utils/cn";
import { Loader2 } from "lucide-react";

export default function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary-dark active:scale-[0.98] shadow-soft",
    secondary:
      "bg-foreground text-background hover:bg-foreground/90 active:scale-[0.98]",
    outline:
      "border border-foreground/20 bg-background text-foreground hover:border-foreground hover:shadow-soft",
    ghost: "text-foreground hover:bg-muted",
    link: "text-foreground underline underline-offset-4 hover:text-primary",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
    gradient:
      "text-white shadow-card active:scale-[0.98] bg-gradient-to-r from-[#FF385C] via-[#E61E4D] to-[#D70466]",
  };

  const sizes = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-14 px-7 text-base",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
