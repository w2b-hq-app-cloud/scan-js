// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ResizeHandle } from "./board-types";

/** World-px drag below this is treated as a click → place a component. */
export const FAST_CLICK_SLOP = 10;
/** Minimum drag size to create a boundary instead of a component. */
export const FAST_BOUNDARY_MIN_W = 120;
export const FAST_BOUNDARY_MIN_H = 80;

export function snap4(n: number): number {
  return Math.round(n / 4) * 4;
}

export function normalizeDraftRect(d: { x0: number; y0: number; x1: number; y1: number }) {
  const x = Math.min(d.x0, d.x1);
  const y = Math.min(d.y0, d.y1);
  const w = Math.abs(d.x1 - d.x0);
  const h = Math.abs(d.y1 - d.y0);
  return { x, y, w, h };
}

export const MIN_BOUNDARY_W = 160;
export const MIN_BOUNDARY_H = 120;

export function applyBoundaryResize(
  start: { x: number; y: number; w: number; h: number },
  handle: ResizeHandle,
  dx: number,
  dy: number,
) {
  let { x, y, w, h } = start;
  if (handle.includes("e")) w = start.w + dx;
  if (handle.includes("s")) h = start.h + dy;
  if (handle.includes("w")) {
    x = start.x + dx;
    w = start.w - dx;
  }
  if (handle.includes("n")) {
    y = start.y + dy;
    h = start.h - dy;
  }
  if (w < MIN_BOUNDARY_W) {
    if (handle.includes("w")) x = start.x + start.w - MIN_BOUNDARY_W;
    w = MIN_BOUNDARY_W;
  }
  if (h < MIN_BOUNDARY_H) {
    if (handle.includes("n")) y = start.y + start.h - MIN_BOUNDARY_H;
    h = MIN_BOUNDARY_H;
  }
  return {
    x: Math.round(x / 4) * 4,
    y: Math.round(y / 4) * 4,
    w: Math.round(w / 4) * 4,
    h: Math.round(h / 4) * 4,
  };
}
