// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { Check } from "lucide-react";

/** Green round checkmark at the top-right corner, mostly on the host with a bit outside. */
export function SelectionCheck() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-0 top-0 z-20 flex h-5 w-5 -translate-y-[40%] translate-x-[40%] items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-700"
      title="Selected"
    >
      <Check className="h-3 w-3 stroke-[3]" />
    </div>
  );
}
