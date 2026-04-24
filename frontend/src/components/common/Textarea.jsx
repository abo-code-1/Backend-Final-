import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Textarea = forwardRef(function Textarea(
  { className, label, error, hint, rows = 4, ...props },
  ref
) {
  return (
    <div className="grid w-full gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-foreground">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
          "focus:outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
          error && "border-destructive focus:border-destructive focus:ring-destructive/20",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
