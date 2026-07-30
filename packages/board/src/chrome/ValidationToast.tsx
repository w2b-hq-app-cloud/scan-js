// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ValidationToast({ productAi = false }: { productAi?: boolean }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-warn/40 bg-surface px-4 py-2.5 node-shadow-lg">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-warn-soft">
        <AlertTriangle className="h-4 w-4 text-warn" />
      </div>
      <div className="text-[11px]">
        <div className="font-semibold">1 architecture warning</div>
        <div className="text-muted-foreground">
          Inventory Service is missing an async contract for OrderCreated
        </div>
      </div>
      {productAi && (
        <button className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
          Ask Sphere to fix
        </button>
      )}
      <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------- CONTEXT MENU ------------------------- */

