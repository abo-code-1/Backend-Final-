import { cn } from "../../utils/cn";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-border bg-muted/30",
        className
      )}
    >
      {Icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-background border border-border">
          <Icon size={24} className="text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
