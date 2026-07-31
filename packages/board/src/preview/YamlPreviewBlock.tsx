// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useMemo, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { computeYamlDiff } from "./preview-utils";

export function YamlPreviewBlock({
  yaml,
  baseYaml,
}: {
  yaml: string;
  baseYaml?: string | null;
}) {
  const TRUNCATE_LINES = 12;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const diffLines = useMemo(() => {
    if (!baseYaml?.trim()) {
      return yaml.split("\n").map((text) => ({ kind: "context" as const, text }));
    }
    return computeYamlDiff(baseYaml, yaml);
  }, [baseYaml, yaml]);

  const added = diffLines.filter((line) => line.kind === "add").length;
  const removed = diffLines.filter((line) => line.kind === "remove").length;
  const hasDiff = Boolean(baseYaml?.trim()) && (added > 0 || removed > 0);
  const isTruncated = !expanded && diffLines.length > TRUNCATE_LINES;
  const visible = isTruncated ? diffLines.slice(0, TRUNCATE_LINES) : diffLines;
  const lineDigits = Math.max(2, String(diffLines.length).length);

  const copyYaml = () => {
    void navigator.clipboard.writeText(yaml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-[hsl(var(--muted)/0.6)]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          SCAN YAML — {yaml.split("\n").length} lines
        </span>
        <div className="flex items-center gap-2">
          {hasDiff && (
            <span className="font-mono text-[10px] tabular-nums">
              <span className="text-ok">+{added}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-destructive">-{removed}</span>
            </span>
          )}
          <button
            onClick={copyYaml}
            title="Copy YAML"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ClipboardCopy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="max-h-[320px] overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {visible.map((line, idx) => {
          const lineNo = idx + 1;
          const prefix = line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " ";
          const cls =
            line.kind === "add"
              ? "bg-ok-soft/50 text-ok"
              : line.kind === "remove"
                ? "bg-destructive/10 text-destructive"
                : "text-foreground";
          return (
            <div key={`${idx}-${line.kind}-${line.text}`} className={`flex whitespace-pre-wrap px-1 ${cls}`}>
              <span
                className="select-none pr-2 text-muted-foreground/80"
                style={{ minWidth: `${lineDigits}ch`, textAlign: "right" }}
                aria-hidden="true"
              >
                {lineNo}
              </span>
              <span>
                {prefix}
                {line.text}
              </span>
            </div>
          );
        })}
        {isTruncated && <div className="px-1 text-muted-foreground">…</div>}
      </pre>
      {diffLines.length > TRUNCATE_LINES && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-border px-3 py-1.5 text-center text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {expanded
            ? "Show less"
            : hasDiff
              ? `Show full diff (${diffLines.length} lines)`
              : `Show all ${diffLines.length} lines`}
        </button>
      )}
    </div>
  );
}

