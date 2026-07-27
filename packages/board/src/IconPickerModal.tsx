import { useEffect, useRef, useState } from "react";
import { Link2, Upload } from "lucide-react";
import { Modal } from "./Modal";
import { ElementIcon } from "./ElementIcon";
import { ICON_CATALOG, isIconUrl, type CatalogIcon } from "./icon-catalog";
import type { LucideIcon } from "lucide-react";

const MAX_UPLOAD_BYTES = 256 * 1024;

export function IconPickerModal({
  open,
  onClose,
  title,
  currentIcon,
  fallbackIcon,
  softClass,
  colorClass,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  currentIcon?: string | null;
  fallbackIcon: LucideIcon;
  softClass: string;
  colorClass: string;
  onSave: (icon: string | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(currentIcon ?? null);
  const [urlInput, setUrlInput] = useState(
    currentIcon && isIconUrl(currentIcon) ? currentIcon : "",
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(currentIcon ?? null);
    setUrlInput(currentIcon && isIconUrl(currentIcon) ? currentIcon : "");
    setError(null);
  }, [open, currentIcon]);

  const applyUrl = () => {
    const next = urlInput.trim();
    if (!next) {
      setError("Enter an image URL");
      return;
    }
    if (!isIconUrl(next) || next.startsWith("blob:")) {
      setError("Use an https:// or data: image URL");
      return;
    }
    setDraft(next);
    setError(null);
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (PNG, SVG, JPEG, …)");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image must be under 256 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        setError("Could not read file");
        return;
      }
      setDraft(result);
      setUrlInput("");
      setError(null);
    };
    reader.onerror = () => setError("Could not read file");
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Pick a Lucide icon, paste an image URL, or upload a small image."
      size="lg"
      hideIcon
      actions={[
        {
          label: "Reset to default",
          variant: "ghost",
          onClick: () => {
            setDraft(null);
            setUrlInput("");
            setError(null);
          },
        },
        { label: "Cancel", variant: "secondary", onClick: onClose },
        {
          label: "Save icon",
          variant: "primary",
          onClick: () => {
            onSave(draft);
            onClose();
          },
        },
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-lg ${softClass}`}>
            <ElementIcon
              icon={draft}
              Fallback={fallbackIcon}
              className={`h-6 w-6 ${colorClass}`}
              alt=""
            />
          </div>
          <div className="min-w-0 text-xs text-muted-foreground">
            {draft == null
              ? "Using the default icon for this kind"
              : isIconUrl(draft)
                ? "Custom image"
                : `Lucide: ${draft}`}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Library
          </div>
          <div className="grid max-h-52 grid-cols-6 gap-1.5 overflow-auto rounded-lg border border-border p-2 sm:grid-cols-8">
            {ICON_CATALOG.map((item: CatalogIcon) => {
              const selected = draft === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    setDraft(item.id);
                    setUrlInput("");
                    setError(null);
                  }}
                  className={`grid aspect-square place-items-center rounded-md border transition-colors ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent hover:bg-muted"
                  }`}
                >
                  <item.Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Image URL
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyUrl();
                  }
                }}
                placeholder="https://… or data:image/…"
                className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-2.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <button
              type="button"
              onClick={applyUrl}
              className="rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              Use
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Upload
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.svg"
            className="hidden"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground hover:bg-muted"
          >
            <Upload className="h-4 w-4" />
            Upload image (max 256 KB)
          </button>
        </div>

        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}
