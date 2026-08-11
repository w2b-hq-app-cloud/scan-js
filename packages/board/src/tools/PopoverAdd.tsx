// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useState } from "react";
import { Plus } from "lucide-react";
import type { CreateKind } from "@spherescan/modeler";
import { IconBtn } from "../ui/IconBtn";
import { KindPickerList } from "./KindPickerList";

export function PopoverAdd({
  active,
  onPick,
}: {
  active?: boolean;
  onPick: (kind: CreateKind) => void;
}) {
  const [open, setOpen] = useState(false);
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
          <KindPickerList
            framed={false}
            onChange={(kind) => {
              onPick(kind);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
