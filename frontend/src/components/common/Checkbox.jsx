import { cn } from "../../utils/cn";

export default function Checkbox({ className, label, id, ...props }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer select-none group"
    >
      <input
        type="checkbox"
        id={id}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded-md border-2 border-border bg-background accent-primary",
          "checked:bg-foreground checked:border-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {label && (
        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}
