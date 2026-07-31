// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { Database, MousePointerClick, PenLine, Square, Waypoints } from "lucide-react";
import {
  FAST_BOUNDARY_MIN_H,
  FAST_BOUNDARY_MIN_W,
  FAST_THIN_ASPECT,
  FAST_THIN_MAX_SHORT,
} from "../board-geometry";

export function FastDesignLegend({
  createLabel,
  boundaryLabel,
}: {
  createLabel: string;
  boundaryLabel: string;
}) {
  return (
    <div
      data-canvas-chrome
      className="absolute left-16 top-4 z-10 w-[240px] overflow-hidden rounded-xl border border-border bg-surface node-shadow"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <PenLine className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Fast design</span>
      </div>
      <ul className="space-y-2 px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
        <li className="flex gap-2">
          <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
          <span>
            <span className="font-medium text-foreground">Click</span> → place {createLabel}
          </span>
        </li>
        <li className="flex gap-2">
          <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-data" />
          <span>
            <span className="font-medium text-foreground">Thin box</span> (short side ≤
            {FAST_THIN_MAX_SHORT}px, ≥{FAST_THIN_ASPECT}:1 either way) → Datastore
          </span>
        </li>
        <li className="flex gap-2">
          <Square className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>
            <span className="font-medium text-foreground">Large box</span> (≥
            {FAST_BOUNDARY_MIN_W}×{FAST_BOUNDARY_MIN_H}) → {boundaryLabel}
          </span>
        </li>
        <li className="flex gap-2">
          <Waypoints className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
          <span>
            <span className="font-medium text-foreground">Click A, then B</span> → connect
          </span>
        </li>
        <li className="pt-0.5 text-[10px] text-muted-foreground/90">
          Esc cancels a wire/draw, then exits · + / □ menus set what click / large-box create
        </li>
      </ul>
    </div>
  );
}
