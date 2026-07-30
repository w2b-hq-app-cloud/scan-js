/** Shared edge path + label placement for board canvas and SVG export. */

export type Point = { x: number; y: number };
export type Side = "l" | "r" | "t" | "b";
export type Box = { x: number; y: number; w: number; h: number };
export type EdgeRouteMode = "bezier" | "orthogonal";

/** Hide connection label text below this world zoom (hover/selection still shows). */
export const LABEL_LOD_ZOOM = 0.7;

const ORTHO_STUB = 28;
const HOP_RADIUS = 7;
const EPS = 0.5;

export function anchorPoint(
  n: { x: number; y: number; w: number; h: number },
  side: Side,
  /** Position along the side in [0,1] (0.5 = midpoint). */
  along = 0.5,
): Point {
  const t = Math.min(1, Math.max(0, along));
  switch (side) {
    case "l":
      return { x: n.x, y: n.y + n.h * t };
    case "r":
      return { x: n.x + n.w, y: n.y + n.h * t };
    case "t":
      return { x: n.x + n.w * t, y: n.y };
    case "b":
      return { x: n.x + n.w * t, y: n.y + n.h };
  }
}

/**
 * Choose exit/enter sides from box geometry so the wire leaves toward the
 * target and arrives from the direction it travels (facing edges preferred).
 * Used for both curved and orthogonal rendering.
 */
export function pickEdgeSides(
  from: Box,
  to: Box,
): { fromSide: Side; toSide: Side } {
  const fromRight = from.x + from.w;
  const fromBottom = from.y + from.h;
  const toRight = to.x + to.w;
  const toBottom = to.y + to.h;

  const gapR = to.x - fromRight;
  const gapL = from.x - toRight;
  const gapB = to.y - fromBottom;
  const gapT = from.y - toBottom;

  const candidates: Array<{ fromSide: Side; toSide: Side; gap: number }> = [
    { fromSide: "r", toSide: "l", gap: gapR },
    { fromSide: "l", toSide: "r", gap: gapL },
    { fromSide: "b", toSide: "t", gap: gapB },
    { fromSide: "t", toSide: "b", gap: gapT },
  ];
  candidates.sort((a, b) => {
    const aClear = a.gap >= -EPS ? 1 : 0;
    const bClear = b.gap >= -EPS ? 1 : 0;
    if (aClear !== bClear) return bClear - aClear;
    return b.gap - a.gap;
  });

  if (candidates[0].gap >= -EPS) {
    return { fromSide: candidates[0].fromSide, toSide: candidates[0].toSide };
  }

  const dx = to.x + to.w / 2 - (from.x + from.w / 2);
  const dy = to.y + to.h / 2 - (from.y + from.h / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromSide: "r", toSide: "l" }
      : { fromSide: "l", toSide: "r" };
  }
  return dy >= 0
    ? { fromSide: "b", toSide: "t" }
    : { fromSide: "t", toSide: "b" };
}

/** @deprecated Use pickEdgeSides — same behavior for curved and orthogonal. */
export const pickOrthogonalSides = pickEdgeSides;

/** Spread multiple wires that share a face along that edge (0.28…0.72). */
export function fanAlongSide(index: number, count: number): number {
  if (count <= 1) return 0.5;
  const i = Math.max(0, Math.min(count - 1, index));
  return 0.28 + (0.44 * i) / (count - 1);
}

/**
 * Resolve edge anchors on box sides from travel direction (+ optional fan).
 * Shared by curved Bezier and orthogonal routing.
 */
export function resolveEdgeAnchors(
  from: Box,
  to: Box,
  fanIndex = 0,
  fanCount = 1,
): { a: Point; b: Point; fromSide: Side; toSide: Side } {
  const { fromSide, toSide } = pickEdgeSides(from, to);
  const along = fanAlongSide(fanIndex, fanCount);
  // Mirror fan on the target so parallel wires stay roughly aligned.
  const toAlong =
    toSide === "l" || toSide === "r"
      ? along
      : fanAlongSide(fanCount - 1 - fanIndex, fanCount);
  return {
    fromSide,
    toSide,
    a: anchorPoint(from, fromSide, along),
    b: anchorPoint(to, toSide, toAlong),
  };
}

/** @deprecated Use resolveEdgeAnchors — same behavior for curved and orthogonal. */
export const resolveOrthogonalAnchors = resolveEdgeAnchors;

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

export function edgePath(
  a: Point,
  b: Point,
  aSide: string,
  bSide?: string,
  mode: EdgeRouteMode = "bezier",
): string {
  if (mode === "orthogonal") {
    return polylineToPath(orthogonalWaypoints(a, b, aSide, bSide ?? "l"));
  }
  const { c1, c2 } = edgeControls(a, b, aSide);
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`;
}

function asSide(side: string): Side {
  if (side === "l" || side === "r" || side === "t" || side === "b") return side;
  return "r";
}

function sideNormal(side: Side): Point {
  switch (side) {
    case "r":
      return { x: 1, y: 0 };
    case "l":
      return { x: -1, y: 0 };
    case "b":
      return { x: 0, y: 1 };
    case "t":
      return { x: 0, y: -1 };
  }
}

function almostEq(a: number, b: number): boolean {
  return Math.abs(a - b) < EPS;
}

function dedupePoints(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const p of points) {
    const prev = out[out.length - 1];
    if (!prev || !almostEq(prev.x, p.x) || !almostEq(prev.y, p.y)) out.push(p);
  }
  return out;
}

/** Manhattan waypoints: exit stubs + elbows, 90° only. */
export function orthogonalWaypoints(
  a: Point,
  b: Point,
  aSide: string,
  bSide: string = "l",
  stub = ORTHO_STUB,
): Point[] {
  const fromSide = asSide(aSide);
  const toSide = asSide(bSide);
  const na = sideNormal(fromSide);
  const nb = sideNormal(toSide);
  const a1 = { x: a.x + na.x * stub, y: a.y + na.y * stub };
  const b1 = { x: b.x + nb.x * stub, y: b.y + nb.y * stub };

  const points: Point[] = [a, a1];
  if (almostEq(a1.x, b1.x) || almostEq(a1.y, b1.y)) {
    points.push(b1, b);
    return dedupePoints(points);
  }

  const aHoriz = fromSide === "l" || fromSide === "r";
  const bHoriz = toSide === "l" || toSide === "r";

  if (aHoriz && bHoriz) {
    const midX = (a1.x + b1.x) / 2;
    points.push({ x: midX, y: a1.y }, { x: midX, y: b1.y }, b1, b);
  } else if (!aHoriz && !bHoriz) {
    const midY = (a1.y + b1.y) / 2;
    points.push({ x: a1.x, y: midY }, { x: b1.x, y: midY }, b1, b);
  } else if (aHoriz) {
    points.push({ x: b1.x, y: a1.y }, b1, b);
  } else {
    points.push({ x: a1.x, y: b1.y }, b1, b);
  }
  return dedupePoints(points);
}

export function polylineToPath(points: Point[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${round(first.x)} ${round(first.y)}${rest
    .map((p) => ` L ${round(p.x)} ${round(p.y)}`)
    .join("")}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

type Seg = {
  a: Point;
  b: Point;
  horizontal: boolean;
};

function pointsToSegments(points: Point[]): Seg[] {
  const segs: Seg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (almostEq(a.x, b.x) && almostEq(a.y, b.y)) continue;
    segs.push({
      a,
      b,
      horizontal: almostEq(a.y, b.y),
    });
  }
  return segs;
}

/** Proper segment intersection for axis-aligned H×V only. */
function hvCrossing(h: Seg, v: Seg): Point | null {
  if (!h.horizontal || v.horizontal) return null;
  const y = h.a.y;
  const x = v.a.x;
  const hMinX = Math.min(h.a.x, h.b.x);
  const hMaxX = Math.max(h.a.x, h.b.x);
  const vMinY = Math.min(v.a.y, v.b.y);
  const vMaxY = Math.max(v.a.y, v.b.y);
  // Interior crossings only (not shared elbows / endpoints).
  if (x <= hMinX + EPS || x >= hMaxX - EPS) return null;
  if (y <= vMinY + EPS || y >= vMaxY - EPS) return null;
  return { x, y };
}

function crossingsOnSegment(seg: Seg, others: Seg[]): Point[] {
  const hits: Point[] = [];
  for (const other of others) {
    const hit = seg.horizontal ? hvCrossing(seg, other) : hvCrossing(other, seg);
    if (hit) hits.push(hit);
  }
  // Sort along segment direction.
  if (seg.horizontal) {
    const dir = seg.b.x >= seg.a.x ? 1 : -1;
    hits.sort((p, q) => dir * (p.x - q.x));
  } else {
    const dir = seg.b.y >= seg.a.y ? 1 : -1;
    hits.sort((p, q) => dir * (p.y - q.y));
  }
  return hits;
}

/**
 * Build an SVG path for an orthogonal polyline, inserting semicircle hop arcs
 * where this edge crosses earlier edges (schematic-style jump-overs).
 */
export function orthogonalPathWithHops(
  points: Point[],
  earlierSegments: Seg[],
  hopRadius = HOP_RADIUS,
): string {
  const segs = pointsToSegments(points);
  if (!segs.length) return polylineToPath(points);

  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (const seg of segs) {
    const hops = crossingsOnSegment(seg, earlierSegments);
    if (seg.horizontal) {
      const y = seg.a.y;
      const goingRight = seg.b.x >= seg.a.x;
      let cursorX = seg.a.x;
      for (const hop of hops) {
        const left = hop.x - hopRadius;
        const right = hop.x + hopRadius;
        if (goingRight) {
          if (left > cursorX + EPS) d += ` L ${round(left)} ${round(y)}`;
          // Sweep 1 = upper arc when traveling left→right.
          d += ` A ${hopRadius} ${hopRadius} 0 0 1 ${round(right)} ${round(y)}`;
          cursorX = right;
        } else {
          if (right < cursorX - EPS) d += ` L ${round(right)} ${round(y)}`;
          // Sweep 0 keeps the bump "above" when traveling right→left.
          d += ` A ${hopRadius} ${hopRadius} 0 0 0 ${round(left)} ${round(y)}`;
          cursorX = left;
        }
      }
      d += ` L ${round(seg.b.x)} ${round(y)}`;
    } else {
      const x = seg.a.x;
      const goingDown = seg.b.y >= seg.a.y;
      let cursorY = seg.a.y;
      for (const hop of hops) {
        const top = hop.y - hopRadius;
        const bottom = hop.y + hopRadius;
        if (goingDown) {
          if (top > cursorY + EPS) d += ` L ${round(x)} ${round(top)}`;
          // Sweep 1 = bump to the right when traveling top→bottom.
          d += ` A ${hopRadius} ${hopRadius} 0 0 1 ${round(x)} ${round(bottom)}`;
          cursorY = bottom;
        } else {
          if (bottom < cursorY - EPS) d += ` L ${round(x)} ${round(bottom)}`;
          d += ` A ${hopRadius} ${hopRadius} 0 0 0 ${round(x)} ${round(top)}`;
          cursorY = top;
        }
      }
      d += ` L ${round(x)} ${round(seg.b.y)}`;
    }
  }
  return d;
}

export type RoutedEdgeInput = {
  id: string;
  /** Preferred: boxes so sides are chosen from travel direction. */
  from?: Box;
  to?: Box;
  /** Legacy: precomputed anchors + sides. */
  a?: Point;
  b?: Point;
  aSide?: string;
  bSide?: string;
  fanIndex?: number;
  fanCount?: number;
};

/**
 * Route all edges orthogonally and add hop arcs where later edges cross earlier ones.
 * Returns a map of edge id → SVG path `d`.
 */
export function routeOrthogonalEdges(
  edges: RoutedEdgeInput[],
  hopRadius = HOP_RADIUS,
): Map<string, string> {
  const out = new Map<string, string>();
  const earlier: Seg[] = [];
  for (const e of edges) {
    let a: Point;
    let b: Point;
    let aSide: string;
    let bSide: string;
    if (e.from && e.to) {
      const resolved = resolveEdgeAnchors(
        e.from,
        e.to,
        e.fanIndex ?? 0,
        e.fanCount ?? 1,
      );
      a = resolved.a;
      b = resolved.b;
      aSide = resolved.fromSide;
      bSide = resolved.toSide;
    } else {
      a = e.a ?? { x: 0, y: 0 };
      b = e.b ?? { x: 0, y: 0 };
      aSide = e.aSide ?? "r";
      bSide = e.bSide ?? "l";
    }
    const pts = orthogonalWaypoints(a, b, aSide, bSide);
    out.set(e.id, orthogonalPathWithHops(pts, earlier, hopRadius));
    earlier.push(...pointsToSegments(pts));
  }
  return out;
}

/** Sample a point along a polyline by normalized length t ∈ [0,1]. */
export function pointOnPolyline(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    lengths.push(len);
    total += len;
  }
  if (total < EPS) return points[0];
  let remain = Math.min(1, Math.max(0, t)) * total;
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i];
    if (remain <= len || i === lengths.length - 1) {
      const u = len < EPS ? 0 : remain / len;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * u,
        y: points[i].y + (points[i + 1].y - points[i].y) * u,
      };
    }
    remain -= len;
  }
  return points[points.length - 1];
}

function tangentOnPolyline(points: Point[], t: number): Point {
  if (points.length < 2) return { x: 1, y: 0 };
  // Approximate via nearby samples.
  const p0 = pointOnPolyline(points, Math.max(0, t - 0.02));
  const p1 = pointOnPolyline(points, Math.min(1, t + 0.02));
  return { x: p1.x - p0.x, y: p1.y - p0.y };
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
  mode?: EdgeRouteMode;
  /** When set, re-resolve anchors from travel direction (curved and orthogonal). */
  fromBox?: Box;
  toBox?: Box;
  fanIndex?: number;
  fanCount?: number;
};

/**
 * Place a label near the path midpoint, sliding along the path and/or
 * nudging along the normal to clear node AABBs.
 */
export function placeEdgeLabel(opts: PlaceEdgeLabelOpts): Point {
  const labelW = opts.labelW ?? 96;
  const labelH = opts.labelH ?? 28;
  const mode = opts.mode ?? "bezier";

  let a = opts.a;
  let b = opts.b;
  let aSide = opts.aSide;
  let bSide = opts.bSide ?? "l";
  if (opts.fromBox && opts.toBox) {
    const resolved = resolveEdgeAnchors(
      opts.fromBox,
      opts.toBox,
      opts.fanIndex ?? 0,
      opts.fanCount ?? 1,
    );
    a = resolved.a;
    b = resolved.b;
    aSide = resolved.fromSide;
    bSide = resolved.toSide;
  }

  const sample = (t: number): { p: Point; tan: Point } => {
    if (mode === "orthogonal") {
      const pts = orthogonalWaypoints(a, b, aSide, bSide);
      return { p: pointOnPolyline(pts, t), tan: tangentOnPolyline(pts, t) };
    }
    const { c1, c2 } = edgeControls(a, b, aSide);
    return {
      p: pointOnCubic(a, c1, c2, b, t),
      tan: tangentOnCubic(a, c1, c2, b, t),
    };
  };

  const candidates: number[] = [0.5];
  for (let i = 1; i <= 4; i++) {
    candidates.push(0.5 + i * 0.06, 0.5 - i * 0.06);
  }

  let best: Point = sample(0.5).p;
  let bestScore = Infinity;

  for (const t of candidates) {
    const { p, tan: rawTan } = sample(t);
    const tan = normalize(rawTan);
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
      }
      if (!hits && Math.abs(nudge) <= 14) break;
    }
  }

  if (opts.stagger) {
    const { tan: rawTan } = sample(0.5);
    const tan = normalize(rawTan);
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
