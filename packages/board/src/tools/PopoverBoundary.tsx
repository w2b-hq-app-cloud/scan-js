// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useState } from "react";
import { Cpu, Shield, Square } from "lucide-react";
import { IconBtn } from "../ui/IconBtn";

export function PopoverBoundary({
  active,
  onPick,
}: {
  active?: boolean;
  onPick: (kind: "trust" | "runtime") => void;
}) {
  const [open, setOpen] = useState(false);
  const items: { kind: "trust" | "runtime"; label: string; hint: string; Icon: typeof Shield }[] = [
    { kind: "trust", label: "Trust Boundary", hint: "Security / ownership box", Icon: Shield },
    { kind: "runtime", label: "Runtime", hint: "Execution / deploy box for any services", Icon: Cpu },
  ];
  return (
    <div className="relative">
      <IconBtn
        label="Add boundary"
        tooltipSide="right"
        onClick={() => setOpen(!open)}
        active={open || active}
      >
        <Square className="h-4 w-4" />
      </IconBtn>
      {open && (
        <div className="absolute left-full top-0 z-30 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg">
          <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Add Boundary
          </div>
          {items.map((it) => (
            <button
              key={it.kind}
              type="button"
              onClick={() => {
                onPick(it.kind);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
            >
              <div
                className={`grid h-6 w-6 place-items-center rounded ${
                  it.kind === "runtime" ? "bg-muted" : "bg-svc-soft"
                }`}
              >
                <it.Icon
                  className={`h-3.5 w-3.5 ${it.kind === "runtime" ? "text-muted-foreground" : "text-svc"}`}
                />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{it.label}</div>
                <div className="text-[10px] text-muted-foreground">{it.hint}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

