// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { ArrowLeft, ArrowRight, FileCode2 } from "lucide-react";
import type { NodeKind } from "@spherescan/viewer";
import { kindMeta } from "../kinds";
import { kindColorVar } from "../board-style";

export function Legend() {
  const items: { kind: NodeKind }[] = [
    { kind: "external" },
    { kind: "service" },
    { kind: "database" },
    { kind: "event" },
    { kind: "search" },
    { kind: "agent" },
    { kind: "repo" },
  ];
  return (
    <div className="w-[220px] overflow-hidden rounded-xl border border-border bg-surface node-shadow">
      <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Legend
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 text-[10px]">
        {items.map((it) => {
          const m = kindMeta[it.kind];
          return (
            <div key={it.kind} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{
                  background: `color-mix(in oklab, ${kindColorVar[it.kind]} 15%, transparent)`,
                  border: `1px solid ${kindColorVar[it.kind]}`,
                }}
              />
              {m.label}
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-2 text-[10px] text-muted-foreground">
        <div className="mb-1 flex items-center gap-1.5">
          <FileCode2 className="h-3 w-3" /> Contract / Schema
        </div>
        <div className="mb-1 flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Consumes (In)
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-3 w-3" /> Exposes (Out)
        </div>
      </div>
    </div>
  );
}

