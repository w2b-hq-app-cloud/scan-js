import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, Sparkles } from "lucide-react";

export type ModalTone = "default" | "danger" | "success" | "info" | "ai";

const toneMeta: Record<
  ModalTone,
  { icon: typeof Info; iconClass: string; ringClass: string }
> = {
  default: { icon: Info, iconClass: "text-foreground", ringClass: "bg-muted" },
  danger: {
    icon: AlertTriangle,
    iconClass: "text-destructive",
    ringClass: "bg-destructive/10",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "text-ok",
    ringClass: "bg-ok-soft/60",
  },
  info: { icon: Info, iconClass: "text-primary", ringClass: "bg-primary/10" },
  ai: {
    icon: Sparkles,
    iconClass: "text-primary-foreground",
    ringClass: "bg-gradient-to-br from-primary to-event",
  },
};

export interface ModalAction {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: ModalTone;
  children?: ReactNode;
  actions?: ModalAction[];
  size?: "sm" | "md" | "lg";
  dismissOnBackdrop?: boolean;
  hideIcon?: boolean;
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "w-[400px]",
  md: "w-[480px]",
  lg: "w-[600px]",
};

const variantClass: Record<NonNullable<ModalAction["variant"]>, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
  secondary:
    "bg-background text-foreground hover:bg-muted border border-border",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent",
  ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  tone = "default",
  children,
  actions,
  size = "md",
  dismissOnBackdrop = true,
  hideIcon = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const meta = toneMeta[tone];
  const Icon = meta.icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={() => dismissOnBackdrop && onClose()}
      />
      <div
        ref={dialogRef}
        className={`relative ${sizeClass[size]} max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-surface node-shadow-lg animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          {!hideIcon && (
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.ringClass}`}
            >
              <Icon className={`h-4 w-4 ${meta.iconClass}`} />
            </div>
          )}
          <div className="flex-1 pt-0.5">
            <h2
              id="modal-title"
              className="text-sm font-semibold text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children && <div className="px-5 py-4">{children}</div>}

        {actions && actions.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-background/40 px-5 py-3">
            {actions.map((a, i) => (
              <button
                key={i}
                autoFocus={a.autoFocus}
                disabled={a.disabled}
                onClick={a.onClick}
                className={`inline-flex items-center justify-center rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[a.variant ?? "secondary"]}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
