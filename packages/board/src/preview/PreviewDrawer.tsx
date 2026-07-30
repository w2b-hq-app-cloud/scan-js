// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useMemo } from "react";
import { Check, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { ScanYamlDiagramPreview } from "./ScanYamlDiagramPreview";
import { YamlPreviewBlock } from "./YamlPreviewBlock";
import { validatePreviewYaml } from "./preview-utils";

export function PreviewDrawer({
  title,
  reply,
  yaml,
  baseYaml,
  hasYaml,
  incomplete = false,
  durationSec,
  busy = false,
  onCancel,
  onApply,
  onRegenerate,
}: {
  title: string;
  reply: string;
  yaml: string | null;
  baseYaml: string | null;
  hasYaml: boolean;
  incomplete?: boolean;
  durationSec?: number;
  busy?: boolean;
  onCancel: () => void;
  onApply: () => void;
  onRegenerate: (validationError: string) => void;
}) {
  const previewError = useMemo(
    () => (hasYaml && yaml ? validatePreviewYaml(yaml) : null),
    [hasYaml, yaml],
  );
  const canApply = hasYaml && !previewError && !busy;
  const showRegenerate = Boolean(previewError || incomplete);
  const durationLabel =
    typeof durationSec === "number" && Number.isFinite(durationSec)
      ? `Generated in ${durationSec < 10 ? durationSec.toFixed(1) : Math.round(durationSec)}s`
      : null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-[680px] overflow-hidden rounded-2xl border border-border bg-surface node-shadow-lg">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-event/10 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-event text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground">
              {incomplete && !hasYaml
                ? "Incomplete or truncated response — regenerate for the full diagram"
                : hasYaml
                  ? previewError
                    ? "YAML has validation issues — regenerate to fix"
                    : "Preview before applying to the architecture board"
                  : "Reply only — no diagram changes proposed"}
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-md p-1 hover:bg-muted disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[560px] overflow-auto p-4">
          <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm leading-relaxed text-foreground">
            {reply || "No message."}
          </div>
          {durationLabel ? (
            <div className="mt-1.5 text-[11px] text-muted-foreground">{durationLabel}</div>
          ) : null}
          {hasYaml && yaml ? (
            <>
              <ScanYamlDiagramPreview yaml={yaml} error={previewError} />
              <YamlPreviewBlock yaml={yaml} baseYaml={baseYaml} />
            </>
          ) : (
            <div className="mt-4 rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
              {incomplete
                ? "No complete YAML was returned. Use Regenerate to retry with the same prompt and attachments."
                : "No YAML was returned. Ask Sphere to add or change architecture elements to get an applyable proposal."}
            </div>
          )}
          {hasYaml && !previewError && (
            <div className="mt-3 rounded-lg bg-ok-soft/40 border border-ok/30 p-3 text-[11px] text-muted-foreground">
              Applying will replace the current board document with the agent YAML (undo with Ctrl+Z after load via a new history root).
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[11px] text-muted-foreground">
            {busy
              ? "Regenerating…"
              : previewError
                ? "Validation failed"
                : incomplete
                  ? "Incomplete response"
                  : hasYaml
                    ? "SCAN YAML ready"
                    : "Chat only"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
            >
              Cancel
            </button>
            {showRegenerate && (
              <button
                onClick={() =>
                  onRegenerate(
                    previewError ??
                      "Previous response was truncated or incomplete — return the full SCAN document.",
                  )
                }
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {busy ? "Fixing…" : "Regenerate"}
              </button>
            )}
            <button
              onClick={onApply}
              disabled={!canApply}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" /> Apply changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- COMMAND PALETTE ------------------------- */

