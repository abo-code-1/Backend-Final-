import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Select = forwardRef(function Select(
  { className, label, error, options = [], hint, ...props },
  ref
) {
  return (
    <div className="grid w-full gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-foreground">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full appearance-none rounded-lg border border-border bg-background bg-no-repeat px-3.5 pr-9 text-sm text-foreground transition-colors",
          "focus:outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus:border-destructive focus:ring-destructive/20",
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23666'%3e%3cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3e%3c/svg%3e\")",
          backgroundPosition: "right 0.65rem center",
          backgroundSize: "1.1rem",
        }}
        {...props}
      >
        {options.map((opt, index) => (
          <option key={opt.key || `${opt.value}-${index}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
