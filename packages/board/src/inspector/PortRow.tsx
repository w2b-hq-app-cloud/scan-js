// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useEffect, useState } from "react";
import { Circle, X } from "lucide-react";
import type { NodeKind } from "@spherescan/viewer";
import { kindColorVar } from "../board-style";

export function PortRow({
  label,
  protocol,
  kind,
  onChange,
  onDelete,
}: {
  label: string;
  protocol?: string;
  kind: NodeKind;
  onChange?: (patch: { label?: string | null; protocol?: string | null }) => void;
  onDelete?: () => void;
}) {
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftProtocol, setDraftProtocol] = useState(protocol ?? "");

  useEffect(() => {
    setDraftLabel(label);
    setDraftProtocol(protocol ?? "");
  }, [label, protocol]);

  const commit = () => {
    if (!onChange) return;
    const nextLabel = draftLabel.trim();
    if (!nextLabel) {
      setDraftLabel(label);
      return;
    }
    if (nextLabel !== label || (draftProtocol.trim() || undefined) !== (protocol || undefined)) {
      onChange({
        label: nextLabel,
        protocol: draftProtocol.trim() || null,
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
      <Circle className="h-2 w-2 shrink-0 fill-current" style={{ color: kindColorVar[kind] }} />
      <input
        value={draftLabel}
        onChange={(e) => setDraftLabel(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="min-w-0 flex-1 bg-transparent font-medium outline-none"
        aria-label="Port label"
      />
      <input
        value={draftProtocol}
        onChange={(e) => setDraftProtocol(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="protocol"
        className="w-[72px] bg-transparent text-right text-muted-foreground outline-none placeholder:text-muted-foreground/50"
        aria-label="Port protocol"
      />
      {onDelete && (
        <button
          type="button"
          title="Remove port"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ------------------------- TOOL RAIL ------------------------- */

