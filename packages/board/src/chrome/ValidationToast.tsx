// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { ArchitectureWarning } from "../board-types";

export function ValidationToast({
  warnings,
  validating = false,
  renderAction,
  onSelect,
}: {
  warnings: ArchitectureWarning[];
  /** True while host architecture re-check is in flight. */
  validating?: boolean;
  renderAction?: (warning: ArchitectureWarning) => ReactNode;
  onSelect?: (warning: ArchitectureWarning) => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const warningKey = warnings.map((w) => `${w.id}:${w.message}`).join("|");

  useEffect(() => {
    setDismissed(false);
  }, [warningKey]);

  if (dismissed || warnings.length === 0) return null;

  const active =
    warnings.find((w) => w.id === focusId) ?? warnings[0] ?? null;
  if (!active) return null;

  const count = warnings.length;
  const label = validating
    ? "Re-validating architecture…"
    : count === 1
      ? "1 architecture warning"
      : `${count} architecture warnings`;

  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex max-w-[min(560px,calc(100%-2rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-warn/40 bg-surface px-4 py-2.5 node-shadow-lg">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-warn-soft">
        {validating ? (
          <Loader2 className="h-4 w-4 animate-spin text-warn" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-warn" />
        )}
      </div>
      <button
        type="button"
        className="min-w-0 flex-1 text-left text-[11px]"
        onClick={() => {
          setFocusId(active.id);
          onSelect?.(active);
        }}
      >
        <div className="font-semibold text-foreground">{label}</div>
        <div className="truncate text-muted-foreground">
          {validating
            ? "Waiting for updated validation"
            : `${active.title}: ${active.message}`}
        </div>
      </button>
      {renderAction?.(active)}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 hover:bg-muted"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
