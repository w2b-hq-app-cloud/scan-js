// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CreateKind } from "@spherescan/modeler";
import { kindMeta } from "../kinds";
import { createKindHints } from "../board-style";
import { IconBtn } from "../ui/IconBtn";

export function PopoverAdd({
  active,
  onPick,
}: {
  active?: boolean;
  onPick: (kind: CreateKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = (
    Object.keys(createKindHints) as CreateKind[]
  ).map((kind) => ({ kind, label: createKindHints[kind].label, nodeKind: createKindHints[kind].nodeKind }));
  return (
    <div className="relative">
      <IconBtn
        label="Add component"
        tooltipSide="right"
        onClick={() => setOpen(!open)}
        active={open || active}
      >
        <Plus className="h-4 w-4" />
      </IconBtn>
      {open && (
        <div className="absolute left-full top-0 z-30 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg">
          <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Add Component
          </div>
          {items.map((it) => {
            const meta = kindMeta[it.nodeKind];
            return (
              <button
                key={it.kind}
                onClick={() => {
                  onPick(it.kind);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <div className={`grid h-6 w-6 place-items-center rounded ${meta.soft}`}>
                  <meta.Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                </div>
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

