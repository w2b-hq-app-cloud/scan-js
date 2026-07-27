/** Shared edge path + label placement for board canvas and SVG export. */

export type Point = { x: number; y: number };
export type Side = "l" | "r" | "t" | "b";
export type Box = { x: number; y: number; w: number; h: number };

/** Hide connection label text below this world zoom (hover/selection still shows). */
export const LABEL_LOD_ZOOM = 0.7;

export function anchorPoint(
  n: { x: number; y: number; w: number; h: number },
  side: Side,
): Point {
  switch (side) {
    case "l":
      return { x: n.x, y: n.y + n.h / 2 };
    case "r":
      return { x: n.x + n.w, y: n.y + n.h / 2 };
    case "t":
      return { x: n.x + n.w / 2, y: n.y };
    case "b":
      return { x: n.x + n.w / 2, y: n.y + n.h };
  }
}

export function edgeControls(
  a: Point,
  b: Point,
  aSide: string,
): { c1: Point; c2: Point } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const horiz = aSide === "l" || aSide === "r";
  if (horiz) {
    const mx = a.x + dx / 2;
    return { c1: { x: mx, y: a.y }, c2: { x: mx, y: b.y } };
  }
  const my = a.y + dy / 2;
  return { c1: { x: a.x, y: my }, c2: { x: b.x, y: my } };
}

export function edgePath(a: Point, b: Point, aSide: string, _bSide?: string): string {
  const { c1, c2 } = edgeControls(a, b, aSide);
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

/** Cubic Bezier point at parameter t ∈ [0,1]. */
export function pointOnCubic(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * c1.x + 3 * u * tt * c2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * c1.y + 3 * u * tt * c2.y + ttt * p3.y,
  };
}

/** Approximate tangent (derivative) of cubic Bezier at t. */
export function tangentOnCubic(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (c1.x - p0.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (p3.x - c2.x),
    y: 3 * u * u * (c1.y - p0.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (p3.y - c2.y),
  };
}

function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  b: Box,
  pad = 4,
): boolean {
  return (
    ax - pad < b.x + b.w &&
    ax + aw + pad > b.x &&
    ay - pad < b.y + b.h &&
    ay + ah + pad > b.y
  );
}

function labelHitsNodes(
  cx: number,
  cy: number,
  labelW: number,
  labelH: number,
  nodes: Box[],
): boolean {
  const ax = cx - labelW / 2;
  const ay = cy - labelH / 2;
  return nodes.some((n) => rectsOverlap(ax, ay, labelW, labelH, n));
}

export type PlaceEdgeLabelOpts = {
  a: Point;
  b: Point;
  aSide: string;
  bSide?: string;
  /** Boxes to avoid (typically all nodes, or at least endpoints). */
  nodes: Box[];
  labelW?: number;
  labelH?: number;
  /** Extra offset along path normal for near-duplicate labels (+/-1, +/-2...). */
  stagger?: number;
};

/**
 * Place a label near the Bezier midpoint, sliding along the path and/or
 * nudging along the normal to clear node AABBs.
 */
export function placeEdgeLabel(opts: PlaceEdgeLabelOpts): Point {
  const labelW = opts.labelW ?? 96;
  const labelH = opts.labelH ?? 28;
  const { c1, c2 } = edgeControls(opts.a, opts.b, opts.aSide);

  const candidates: number[] = [0.5];
  for (let i = 1; i <= 4; i++) {
    candidates.push(0.5 + i * 0.06, 0.5 - i * 0.06);
  }

  let best: Point = pointOnCubic(opts.a, c1, c2, opts.b, 0.5);
  let bestScore = Infinity;

  for (const t of candidates) {
    const p = pointOnCubic(opts.a, c1, c2, opts.b, t);
    const tan = normalize(tangentOnCubic(opts.a, c1, c2, opts.b, t));
    const normal = { x: -tan.y, y: tan.x };

    for (const nudge of [0, 14, -14, 28, -28]) {
      const q = {
        x: p.x + normal.x * nudge,
        y: p.y + normal.y * nudge,
      };
      const hits = labelHitsNodes(q.x, q.y, labelW, labelH, opts.nodes);
      const score = (hits ? 1000 : 0) + Math.abs(t - 0.5) * 10 + Math.abs(nudge) * 0.1;
      if (score < bestScore) {
        bestScore = score;
        best = q;
        if (!hits && nudge === 0 && Math.abs(t - 0.5) < 0.01) {
          // Perfect mid - still apply stagger below.
          bestScore = score;
        }
      }
      if (!hits && Math.abs(nudge) <= 14) break;
    }
  }

  if (opts.stagger) {
    const t = 0.5;
    const tan = normalize(tangentOnCubic(opts.a, c1, c2, opts.b, t));
    const normal = { x: -tan.y, y: tan.x };
    const amount = opts.stagger * 16;
    best = {
      x: best.x + normal.x * amount,
      y: best.y + normal.y * amount,
    };
  }

  return best;
}

/**
 * Assign stagger indices for labels whose midpoints are nearly coincident.
 * Returns a map of edgeId -> stagger offset (-2...2).
 */
export function computeLabelStagger(
  placements: Array<{ id: string; x: number; y: number }>,
  threshold = 28,
): Map<string, number> {
  const stagger = new Map<string, number>();
  const used = new Set<string>();
  for (let i = 0; i < placements.length; i++) {
    const a = placements[i];
    if (used.has(a.id)) continue;
    const group = [a];
    for (let j = i + 1; j < placements.length; j++) {
      const b = placements[j];
      if (used.has(b.id)) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < threshold) {
        group.push(b);
      }
    }
    if (group.length === 1) {
      stagger.set(a.id, 0);
      used.add(a.id);
      continue;
    }
    group.sort((p, q) => p.id.localeCompare(q.id));
    const mid = (group.length - 1) / 2;
    group.forEach((p, idx) => {
      stagger.set(p.id, idx - mid);
      used.add(p.id);
    });
  }
  return stagger;
}
