import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";

// Standard page-size choices. Backend caps generic lists at 100 (listings at 50),
// so all of these are safe to request.
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40];

export default function Pagination({
  page,
  totalPages,
  onChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}) {
  const showSizer = typeof onPageSizeChange === "function";
  const showNav = totalPages > 1;

  // Nothing to render: single page and no size selector.
  if (!showSizer && !showNav) return null;

  const nums = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      nums.push(i);
    } else if (i === page - 2 || i === page + 2) {
      nums.push("…");
    }
  }
  const clean = nums.filter((n, idx, arr) => n !== arr[idx - 1]);

  return (
    <div
      className={cn(
        "mt-14 flex flex-col-reverse items-center gap-4 sm:flex-row",
        showSizer ? "sm:justify-between" : "sm:justify-center",
        className
      )}
    >
      {showSizer && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Показывать по
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:border-foreground focus:ring-2 focus:ring-foreground/10"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      {showNav && (
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className="h-10 w-10 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
          >
            <ChevronLeft size={16} />
          </button>
          {clean.map((n, i) =>
            n === "…" ? (
              <span key={`e-${i}`} className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => onChange(n)}
                className={cn(
                  "h-10 w-10 rounded-full text-sm font-semibold transition-colors",
                  n === page ? "bg-foreground text-background" : "hover:bg-muted"
                )}
              >
                {n}
              </button>
            )
          )}
          <button
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
            className="h-10 w-10 rounded-full border flex items-center justify-center disabled:opacity-40 hover:bg-muted"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
