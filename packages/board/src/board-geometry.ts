// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ResizeHandle } from "./board-types";

/** World-px drag below this is treated as a click → place a component. */
export const FAST_CLICK_SLOP = 10;

/**
 * Minimum drag size for a trust/runtime boundary.
 * Must be larger than a default service card (260×190) so a “node-sized” drag
 * does not accidentally become a boundary.
 */
export const FAST_BOUNDARY_MIN_W = 300;
export const FAST_BOUNDARY_MIN_H = 220;

/** Thin rubber-band (either orientation) → datastore. */
/** Short side at or below this still counts as thin (forgiving). */
export const FAST_THIN_MAX_SHORT = 140;
/** Long side must clear this so a click isn’t a datastore. */
export const FAST_THIN_MIN_LONG = 36;
/** Long/short ratio at or above this counts as thin. */
export const FAST_THIN_ASPECT = 1.35;

export type FastDraftKind = "click" | "datastore" | "boundary" | "component";

/** Classify a Fast design rubber-band by size/aspect. */
export function classifyFastDraft(w: number, h: number): FastDraftKind {
  if (w < FAST_CLICK_SLOP && h < FAST_CLICK_SLOP) return "click";

  const long = Math.max(w, h);
  const short = Math.min(w, h);
  // Any elongated slab (horizontal or vertical) → datastore.
  if (
    short <= FAST_THIN_MAX_SHORT &&
    long >= FAST_THIN_MIN_LONG &&
    long / Math.max(short, 1) >= FAST_THIN_ASPECT
  ) {
    return "datastore";
  }

  if (w >= FAST_BOUNDARY_MIN_W && h >= FAST_BOUNDARY_MIN_H) return "boundary";
  return "component";
}

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
