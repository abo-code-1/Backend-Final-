import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export default function Spinner({ className, size = 24 }) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      size={size}
    />
  );
}

export function PageSpinner({ label = "Загрузка..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Spinner size={32} />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
