import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDanger = true,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-pop border border-border/60"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={
              isDanger
                ? "shrink-0 rounded-full bg-destructive/10 p-2.5 text-destructive"
                : "shrink-0 rounded-full bg-muted p-2.5 text-foreground"
            }
          >
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold leading-snug">{title}</h3>
            {description && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDanger ? "destructive" : "primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
