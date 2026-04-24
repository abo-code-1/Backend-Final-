import { cn } from "../../utils/cn";

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
  eyebrow,
}) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b",
        className
      )}
    >
      <div>
        {eyebrow && (
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-muted-foreground max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
