import { cn } from "../../utils/cn";

export default function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-foreground text-background",
    secondary: "bg-muted text-foreground",
    outline: "border border-border text-foreground",
    primary: "bg-primary text-primary-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    glass: "bg-white/90 backdrop-blur text-foreground shadow-soft",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
