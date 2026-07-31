// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { Loader2, RefreshCw, Sparkles } from "lucide-react";

export const DEFAULT_ASK_SPHERE_CHIPS = [
  "Add resilience policies",
  "Split into read/write",
  "Add missing tests",
  "Rename service",
] as const;

/** Shared Ask Sphere body — used on-canvas and in the inspector. */
export function AskSphereBody({
  chips,
  loading,
  chatBusy,
  onRequestSuggestions,
  onPick,
  showTitle = true,
}: {
  chips: string[];
  loading?: boolean;
  chatBusy?: boolean;
  onRequestSuggestions?: () => void;
  onPick: (chip: string) => void;
  /** When false, title/refresh row is omitted (inspector Section owns the header). */
  showTitle?: boolean;
}) {
  const hasChips = chips.length > 0;
  const canRequest = Boolean(onRequestSuggestions);

  return (
    <div className="space-y-2">
      {showTitle && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ask Sphere
          </div>
          {canRequest && hasChips && !loading && (
            <button
              type="button"
              title="Refresh suggestions"
              aria-label="Refresh suggestions"
              disabled={chatBusy}
              onClick={onRequestSuggestions}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      {loading ? (
        <div className="flex items-center gap-2 py-1 text-[11px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
          Loading suggestions…
        </div>
      ) : hasChips ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={chatBusy}
              onClick={() => onPick(chip)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground hover:bg-muted disabled:opacity-50"
            >
              <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
              {chip}
            </button>
          ))}
        </div>
      ) : canRequest ? (
        <button
          type="button"
          disabled={chatBusy}
          onClick={onRequestSuggestions}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-[11px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Ask Sphere for suggestions?
        </button>
      ) : null}
    </div>
  );
}

export function NodeAskSphere({
  x,
  y,
  w,
  chips,
  loading,
  chatBusy,
  onRequestSuggestions,
  onPick,
}: {
  /** World-space top-left of the selected node. */
  x: number;
  y: number;
  w: number;
  chips: string[];
  loading?: boolean;
  chatBusy?: boolean;
  onRequestSuggestions: () => void;
  onPick: (chip: string) => void;
}) {
  return (
    <div
      data-canvas-chrome
      className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-full"
      style={{
        left: x + w / 2,
        top: y - 10,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="min-w-[200px] max-w-[280px] rounded-2xl border border-border bg-surface px-3 py-2.5 node-shadow-lg">
        <AskSphereBody
          chips={chips}
          loading={loading}
          chatBusy={chatBusy}
          onRequestSuggestions={onRequestSuggestions}
          onPick={onPick}
          showTitle
        />
      </div>
    </div>
  );
}
