// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { CreateKind } from "@spherescan/modeler";
import { kindMeta } from "../kinds";
import { createKindHints } from "../board-style";

const KIND_ITEMS = (Object.keys(createKindHints) as CreateKind[]).map((kind) => ({
  kind,
  label: createKindHints[kind].label,
  nodeKind: createKindHints[kind].nodeKind,
}));

/** Shared kind rows — same icons/colors/type as the left-rail Add Component menu. */
export function KindPickerList({
  value,
  onChange,
  framed = true,
  className = "",
}: {
  value?: CreateKind;
  onChange: (kind: CreateKind) => void;
  /** When false, render plain rows (parent supplies chrome). */
  framed?: boolean;
  className?: string;
}) {
  const rows = KIND_ITEMS.map((it) => {
    const meta = kindMeta[it.nodeKind];
    const selected = value === it.kind;
    return (
      <button
        key={it.kind}
        type="button"
        onClick={() => onChange(it.kind)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs ${
          selected ? `bg-muted ring-inset ring-1 ${meta.ring}` : "hover:bg-muted"
        }`}
      >
        <div className={`grid h-6 w-6 place-items-center rounded ${meta.soft}`}>
          <meta.Icon className={`h-3.5 w-3.5 ${meta.color}`} />
        </div>
        {it.label}
      </button>
    );
  });

  if (!framed) {
    return <div className={className}>{rows}</div>;
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-popover ${className}`}
    >
      {rows}
    </div>
  );
}
