import type {
  LayoutEntry,
  SphereConnection,
  SphereModel,
  SphereView,
} from "@spherescan/model";
import { resolveEntityKind } from "@spherescan/rules";

export type AutoLayoutOptions = {
  /** Top-left origin for the whole board. */
  originX?: number;
  originY?: number;
  /** Horizontal gap between layered columns (room for edge labels). */
  gapX?: number;
  /** Vertical gap between stacked nodes. */
  gapY?: number;
  /** Padding inside boundary boxes around members. */
  boundaryPad?: number;
  /** Gap between clusters (boundaries / free groups). */
  clusterGapX?: number;
  clusterGapY?: number;
};

type Side = NonNullable<SphereConnection["fromSide"]>;

type SizedBox = LayoutEntry & { w: number; h: number };

type ClusterPlan = {
  id: string;
  /** Boundary id, or null for the free-floating cluster. */
  boundaryId: string | null;
  memberIds: string[];
  /** Local layout relative to cluster origin (0,0). */
  local: Record<string, SizedBox>;
  width: number;
  height: number;
};

const DEFAULTS = {
  originX: 48,
  originY: 40,
  gapX: 56,
  gapY: 48,
  boundaryPad: 28,
  clusterGapX: 36,
  clusterGapY: 36,
} as const;

/** Prefer splitting a layer into another column when stacked height exceeds this. */
const MAX_LAYER_STACK_H = 640;

const ATTACH_TYPES = new Set(["database-access", "event-publication"]);

function ensureView(model: SphereModel, viewId?: string): SphereView {
  const view =
    (viewId ? model.views.find((v) => v.id === viewId) : undefined) ?? model.views[0];
  if (!view) throw new Error("Model has no views");
  return view;
}

function boxOf(entry: LayoutEntry | undefined, kind?: string): SizedBox {
  // Always pack with kind-standard sizes so agent-emitted tiny w/h cannot
  // collapse boxes or undersize fitted boundaries.
  const defaults =
    kind === "database"
      ? { w: 220, h: 160 }
      : kind === "external"
        ? { w: 220, h: 150 }
        : kind === "repo"
          ? { w: 260, h: 180 }
          : { w: 260, h: 190 };
  return {
    x: entry?.x ?? 0,
    y: entry?.y ?? 0,
    w: defaults.w,
    h: defaults.h,
  };
}

function center(b: { x: number; y: number; w: number; h: number }) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

function pickSide(from: { x: number; y: number }, to: { x: number; y: number }): {
  fromSide: Side;
  toSide: Side;
} {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromSide: "r", toSide: "l" }
      : { fromSide: "l", toSide: "r" };
  }
  return dy >= 0
    ? { fromSide: "b", toSide: "t" }
    : { fromSide: "t", toSide: "b" };
}

/** Fan overlapping parallel edges between the same pair onto alternate sides. */
function fanSides(
  base: { fromSide: Side; toSide: Side },
  index: number,
): { fromSide: Side; toSide: Side } {
  if (index === 0) return base;
  const horiz = base.fromSide === "l" || base.fromSide === "r";
  const fromCycle: Side[] = horiz
    ? [base.fromSide, "t", "b"]
    : [base.fromSide, "l", "r"];
  const toCycle: Side[] = horiz
    ? [base.toSide, "b", "t"]
    : [base.toSide, "r", "l"];
  return {
    fromSide: fromCycle[index % fromCycle.length],
    toSide: toCycle[index % toCycle.length],
  };
}

/**
 * When a layer's stacked height (nodes + attachments) exceeds the cap,
 * bump trailing nodes into a new column inserted after this layer.
 */
function splitTallLayers(
  byLayer: string[][],
  sizes: Record<string, SizedBox>,
  childrenOf: Map<string, string[]>,
  memberSet: Set<string>,
  gapY: number,
  maxH: number,
): string[][] {
  const out: string[][] = [];
  for (const layer of byLayer) {
    if (!layer.length) {
      out.push(layer);
      continue;
    }
    let stack = 0;
    let chunk: string[] = [];
    for (const id of layer) {
      const size = sizes[id] ?? boxOf(undefined);
      const kids = (childrenOf.get(id) ?? []).filter((k) => memberSet.has(k));
      let blockH = size.h;
      if (kids.length <= 2 && kids.length > 0) {
        const kidH = Math.max(...kids.map((k) => sizes[k]?.h ?? 160));
        blockH += gapY * 0.75 + kidH;
      } else if (kids.length > 2) {
        // Side pocket - height ~= parent or kids stack, not stacked under.
        const kidStack =
          kids.reduce((h, k) => h + (sizes[k]?.h ?? 160) + gapY * 0.5, 0) -
          gapY * 0.5;
        blockH = Math.max(blockH, kidStack);
      }
      if (chunk.length && stack + blockH + gapY > maxH) {
        out.push(chunk);
        chunk = [id];
        stack = blockH;
      } else {
        if (chunk.length) stack += gapY;
        chunk.push(id);
        stack += blockH;
      }
    }
    if (chunk.length) out.push(chunk);
  }
  return out;
}

/** Stable assignment of each layout id to at most one boundary (prefer smaller membership). */
function assignClusters(
  ids: string[],
  boundaries: SphereView["boundaries"],
): Map<string, string | null> {
  const ranked = [...boundaries].sort(
    (a, b) => (a.members?.length ?? 0) - (b.members?.length ?? 0),
  );
  const out = new Map<string, string | null>();
  for (const id of ids) {
    const hit = ranked.find((b) => (b.members ?? []).includes(id));
    out.set(id, hit?.id ?? null);
  }
  return out;
}

function kindRank(model: SphereModel, id: string): number {
  switch (resolveEntityKind(model, id)) {
    case "external":
      return 0;
    case "service":
      return 1;
    case "event":
      return 2;
    case "search":
      return 3;
    case "database":
      return 4;
    case "agent":
      return 5;
    case "repo":
      return 6;
    default:
      return 3;
  }
}

/**
 * Longest-path layering on a DAG (back-edges ignored).
 * Lower layer index = further left.
 */
function assignLayers(
  nodeIds: string[],
  edges: Array<{ from: string; to: string }>,
  model: SphereModel,
): Map<string, number> {
  const set = new Set(nodeIds);
  const preds = new Map<string, string[]>();
  const succs = new Map<string, string[]>();
  for (const id of nodeIds) {
    preds.set(id, []);
    succs.set(id, []);
  }
  for (const e of edges) {
    if (!set.has(e.from) || !set.has(e.to) || e.from === e.to) continue;
    preds.get(e.to)!.push(e.from);
    succs.get(e.from)!.push(e.to);
  }

  const layer = new Map<string, number>();
  const visiting = new Set<string>();
  const done = new Set<string>();

  const dfs = (id: string) => {
    if (done.has(id)) return;
    if (visiting.has(id)) return; // cycle
    visiting.add(id);
    let best = 0;
    for (const p of preds.get(id) ?? []) {
      dfs(p);
      best = Math.max(best, (layer.get(p) ?? 0) + 1);
    }
    layer.set(id, best);
    visiting.delete(id);
    done.add(id);
  };

  // Sources first by kind for stability.
  const ordered = [...nodeIds].sort(
    (a, b) => kindRank(model, a) - kindRank(model, b) || a.localeCompare(b),
  );
  for (const id of ordered) dfs(id);

  // Re-run longest path now that all nodes seeded - simple relaxation.
  for (let pass = 0; pass < nodeIds.length; pass++) {
    let changed = false;
    for (const id of nodeIds) {
      let best = layer.get(id) ?? 0;
      for (const p of preds.get(id) ?? []) {
        best = Math.max(best, (layer.get(p) ?? 0) + 1);
      }
      if (best !== (layer.get(id) ?? 0)) {
        layer.set(id, best);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Normalize so minimum layer is 0.
  let min = Infinity;
  for (const v of layer.values()) min = Math.min(min, v);
  if (Number.isFinite(min) && min !== 0) {
    for (const [id, v] of layer) layer.set(id, v - min);
  }

  return layer;
}

function orderLayer(
  layerIds: string[],
  prevOrder: string[],
  edges: Array<{ from: string; to: string }>,
  model: SphereModel,
): string[] {
  if (layerIds.length <= 1) return [...layerIds];
  const index = new Map(prevOrder.map((id, i) => [id, i]));
  const score = (id: string) => {
    const neighbors = edges
      .filter((e) => e.to === id && index.has(e.from))
      .map((e) => index.get(e.from)!);
    if (!neighbors.length) return kindRank(model, id) * 1000;
    return neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
  };
  return [...layerIds].sort(
    (a, b) => score(a) - score(b) || kindRank(model, a) - kindRank(model, b) || a.localeCompare(b),
  );
}

function layoutClusterMembers(
  memberIds: string[],
  model: SphereModel,
  sizes: Record<string, SizedBox>,
  connections: SphereConnection[],
  gapX: number,
  gapY: number,
): { local: Record<string, SizedBox>; width: number; height: number } {
  if (!memberIds.length) {
    return { local: {}, width: 0, height: 0 };
  }

  const memberSet = new Set(memberIds);
  const internal = connections.filter(
    (c) => memberSet.has(c.from) && memberSet.has(c.to),
  );

  // Attachments sit under their producer (DB / published events).
  const parentOf = new Map<string, string>();
  const childrenOf = new Map<string, string[]>();
  for (const c of internal) {
    if (!ATTACH_TYPES.has(c.type)) continue;
    if (parentOf.has(c.to)) continue;
    parentOf.set(c.to, c.from);
    const list = childrenOf.get(c.from) ?? [];
    list.push(c.to);
    childrenOf.set(c.from, list);
  }

  const primary = memberIds.filter((id) => !parentOf.has(id));
  const primarySet = new Set(primary);
  const primaryEdges = internal
    .filter((c) => primarySet.has(c.from) && primarySet.has(c.to))
    .map((c) => ({ from: c.from, to: c.to }));

  const layers = assignLayers(primary, primaryEdges, model);
  const maxLayer = Math.max(0, ...[...layers.values()]);
  const byLayer: string[][] = Array.from({ length: maxLayer + 1 }, () => []);
  for (const id of primary) {
    byLayer[layers.get(id) ?? 0].push(id);
  }

  let prev: string[] = [];
  for (let i = 0; i < byLayer.length; i++) {
    byLayer[i] = orderLayer(byLayer[i], prev, primaryEdges, model);
    prev = byLayer[i];
  }

  byLayer.splice(
    0,
    byLayer.length,
    ...splitTallLayers(byLayer, sizes, childrenOf, memberSet, gapY, MAX_LAYER_STACK_H),
  );

  const colWidths = byLayer.map((ids) => {
    if (!ids.length) return 0;
    let w = Math.max(...ids.map((id) => sizes[id]?.w ?? 260));
    for (const id of ids) {
      const kids = (childrenOf.get(id) ?? []).filter((k) => memberSet.has(k));
      if (kids.length > 2) {
        const kidW = Math.max(...kids.map((k) => sizes[k]?.w ?? 220));
        w = Math.max(w, (sizes[id]?.w ?? 260) + Math.max(48, gapX * 0.4) + kidW);
      }
    }
    return w;
  });
  const colXs: number[] = [];
  let xCursor = 0;
  for (let i = 0; i < byLayer.length; i++) {
    colXs.push(xCursor);
    xCursor += colWidths[i] + (i < byLayer.length - 1 ? gapX : 0);
  }

  const local: Record<string, SizedBox> = {};

  for (let li = 0; li < byLayer.length; li++) {
    let y = 0;
    for (const id of byLayer[li]) {
      const size = sizes[id] ?? boxOf(undefined);
      const kids = (childrenOf.get(id) ?? []).filter((k) => memberSet.has(k));
      const nodeX = colXs[li] + Math.max(0, (colWidths[li] - size.w) / 2);
      // Leave room on the right for side-pocket kids within the column width.
      const pocketKids = kids.length > 2;
      const placeX = pocketKids
        ? colXs[li]
        : nodeX;
      local[id] = { x: placeX, y, w: size.w, h: size.h };

      let attachBottom = y + size.h;
      if (kids.length && !pocketKids) {
        const kidGap = Math.max(48, gapX * 0.45);
        const kidWidths = kids.map((k) => sizes[k]?.w ?? 220);
        const rowW =
          kidWidths.reduce((a, b) => a + b, 0) + kidGap * Math.max(0, kids.length - 1);
        let kidX = placeX + size.w / 2 - rowW / 2;
        const kidY = y + size.h + gapY * 0.75;
        for (let ki = 0; ki < kids.length; ki++) {
          const kid = kids[ki];
          const ks = sizes[kid] ?? boxOf(undefined);
          local[kid] = { x: kidX, y: kidY, w: ks.w, h: ks.h };
          kidX += ks.w + kidGap;
          attachBottom = Math.max(attachBottom, kidY + ks.h);
        }
      } else if (pocketKids) {
        const kidGap = Math.max(40, gapY * 0.45);
        const kidX = placeX + size.w + Math.max(48, gapX * 0.35);
        let kidY = y;
        for (const kid of kids) {
          const ks = sizes[kid] ?? boxOf(undefined);
          local[kid] = { x: kidX, y: kidY, w: ks.w, h: ks.h };
          kidY += ks.h + kidGap;
          attachBottom = Math.max(attachBottom, kidY - kidGap + ks.h);
        }
        attachBottom = Math.max(attachBottom, y + size.h);
      }
      y = attachBottom + gapY;
    }
  }

  // Any member not placed (edge cases) - stack at bottom.
  let orphanY = 0;
  for (const id of memberIds) {
    if (local[id]) continue;
    const size = sizes[id] ?? boxOf(undefined);
    local[id] = { x: 0, y: orphanY, w: size.w, h: size.h };
    orphanY += size.h + gapY;
  }

  // Attachments centered under a parent can go negative - shift into quadrant I.
  let minX = 0;
  let minY = 0;
  for (const b of Object.values(local)) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
  }
  if (minX < 0 || minY < 0) {
    const dx = minX < 0 ? -minX : 0;
    const dy = minY < 0 ? -minY : 0;
    for (const b of Object.values(local)) {
      b.x += dx;
      b.y += dy;
    }
  }

  let width = 0;
  let height = 0;
  for (const b of Object.values(local)) {
    width = Math.max(width, b.x + b.w);
    height = Math.max(height, b.y + b.h);
  }
  return { local, width, height };
}

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  gapX: number,
  gapY: number,
): boolean {
  return (
    a.x < b.x + b.w + gapX &&
    a.x + a.w + gapX > b.x &&
    a.y < b.y + b.h + gapY &&
    a.y + a.h + gapY > b.y
  );
}

/**
 * Pack clusters like Tetris / skyline: keep meta-layer left→right flow, then
 * place each box in the lowest-then-leftmost free slot (no large column gutters).
 */
function layoutClusterRow(
  clusters: ClusterPlan[],
  model: SphereModel,
  connections: SphereConnection[],
  originX: number,
  originY: number,
  clusterGapX: number,
  clusterGapY: number,
  hintLayout?: Record<string, LayoutEntry>,
): { origin: Record<string, { x: number; y: number }> } {
  if (!clusters.length) return { origin: {} };

  const ids = clusters.map((c) => c.id);
  const idSet = new Set(ids);
  const metaEdges: Array<{ from: string; to: string }> = [];
  const clusterOfNode = new Map<string, string>();
  for (const c of clusters) {
    for (const m of c.memberIds) clusterOfNode.set(m, c.id);
  }
  for (const conn of connections) {
    const a = clusterOfNode.get(conn.from);
    const b = clusterOfNode.get(conn.to);
    if (!a || !b || a === b) continue;
    if (idSet.has(a) && idSet.has(b)) metaEdges.push({ from: a, to: b });
  }

  const layer = assignLayers(ids, metaEdges, model);

  const hintX = (c: ClusterPlan): number => {
    if (!hintLayout) return 0;
    const xs = c.memberIds
      .map((id) => hintLayout[id]?.x)
      .filter((v): v is number => typeof v === "number");
    if (!xs.length) return Number.POSITIVE_INFINITY;
    return xs.reduce((sum, v) => sum + v, 0) / xs.length;
  };

  const rankCluster = (c: ClusterPlan) => {
    if (!c.boundaryId) return 2;
    const b = model.views[0]?.boundaries.find((x) => x.id === c.boundaryId);
    if (b?.kind === "trust") return 0;
    if (b?.kind === "runtime") return 1;
    return 1;
  };

  const ordered = [...clusters].sort(
    (a, b) =>
      (layer.get(a.id) ?? 0) - (layer.get(b.id) ?? 0) ||
      hintX(a) - hintX(b) ||
      rankCluster(a) - rankCluster(b) ||
      a.id.localeCompare(b.id),
  );

  const placed: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  const origin: Record<string, { x: number; y: number }> = {};

  for (const c of ordered) {
    const w = Math.max(1, c.width);
    const h = Math.max(1, c.height);
    const candidates: Array<{ x: number; y: number }> = [{ x: originX, y: originY }];
    for (const p of placed) {
      candidates.push({ x: p.x + p.w + clusterGapX, y: p.y });
      candidates.push({ x: p.x, y: p.y + p.h + clusterGapY });
    }

    let best: { x: number; y: number } | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const cand of candidates) {
      const trial = { x: cand.x, y: cand.y, w, h };
      if (placed.some((p) => rectsOverlap(trial, p, clusterGapX, clusterGapY))) continue;
      // Prefer low Y (pack up), then low X (pack left) — Tetris skyline.
      const score = trial.y * 100_000 + trial.x;
      if (score < bestScore) {
        bestScore = score;
        best = { x: trial.x, y: trial.y };
      }
    }
    if (!best) {
      // Fallback: append to the right of the current AABB.
      let maxX = originX;
      let maxY = originY;
      for (const p of placed) {
        maxX = Math.max(maxX, p.x + p.w + clusterGapX);
        maxY = Math.max(maxY, p.y);
      }
      best = { x: maxX, y: originY };
    }

    origin[c.id] = best;
    placed.push({ id: c.id, x: best.x, y: best.y, w, h });
  }

  return { origin };
}

/**
 * Compute non-overlapping layout for elements and fitted boundary boxes.
 * Connection side anchors are updated so edges/labels read cleanly.
 */
export function computeAutoLayout(
  model: SphereModel,
  viewId?: string,
  options: AutoLayoutOptions = {},
): {
  layout: Record<string, LayoutEntry>;
  boundaries: Array<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    members: string[];
  }>;
  connectionSides: Array<{ id: string; fromSide: Side; toSide: Side }>;
} {
  const opts = { ...DEFAULTS, ...options };
  const view = ensureView(model, viewId);
  const ids = Object.keys(view.layout);
  if (!ids.length) {
    return { layout: {}, boundaries: [], connectionSides: [] };
  }

  const sizes: Record<string, SizedBox> = {};
  for (const id of ids) {
    sizes[id] = boxOf(view.layout[id], resolveEntityKind(model, id));
  }

  const clusterOf = assignClusters(ids, view.boundaries);
  const boundaryIds = view.boundaries.map((b) => b.id);
  const clusters: ClusterPlan[] = [];

  for (const bid of boundaryIds) {
    const members = ids.filter((id) => clusterOf.get(id) === bid);
    // Skip empty shells — they waste board space and confuse membership sync.
    if (!members.length) continue;
    const placed = layoutClusterMembers(
      members,
      model,
      sizes,
      model.connections,
      opts.gapX,
      opts.gapY,
    );
    const pad = opts.boundaryPad;
    // Local coords already member-relative; expand for padding when measuring cluster.
    clusters.push({
      id: `boundary:${bid}`,
      boundaryId: bid,
      memberIds: members,
      local: placed.local,
      width: placed.width + pad * 2,
      height: placed.height + pad * 2,
    });
  }

  const freeIds = ids.filter((id) => clusterOf.get(id) == null);
  if (freeIds.length) {
    // Split free into left externals vs right repos when possible.
    const externals = freeIds.filter((id) => resolveEntityKind(model, id) === "external");
    const repos = freeIds.filter((id) => resolveEntityKind(model, id) === "repo");
    const rest = freeIds.filter(
      (id) => resolveEntityKind(model, id) !== "external" && resolveEntityKind(model, id) !== "repo",
    );

    const pushFree = (cid: string, members: string[]) => {
      if (!members.length) return;
      const placed = layoutClusterMembers(
        members,
        model,
        sizes,
        model.connections,
        opts.gapX,
        opts.gapY,
      );
      clusters.push({
        id: cid,
        boundaryId: null,
        memberIds: members,
        local: placed.local,
        width: placed.width,
        height: placed.height,
      });
    };

    pushFree("free:external", externals);
    pushFree("free:rest", rest);
    pushFree("free:repo", repos);
  }

  // Prefer meta-layer: externals left, trust middle, runtime/repos right.
  // Inject soft meta-edges for nicer cluster order.
  const soft: SphereConnection[] = [...model.connections];
  const extCluster = clusters.find((c) => c.id === "free:external");
  const trust = clusters.find((c) => {
    if (!c.boundaryId) return false;
    return view.boundaries.find((b) => b.id === c.boundaryId)?.kind === "trust";
  });
  const runtime = clusters.find((c) => {
    if (!c.boundaryId) return false;
    return view.boundaries.find((b) => b.id === c.boundaryId)?.kind === "runtime";
  });
  const repoCluster = clusters.find((c) => c.id === "free:repo");
  if (extCluster && trust && extCluster.memberIds[0] && trust.memberIds[0]) {
    soft.push({
      id: "__soft-ext-trust",
      from: extCluster.memberIds[0],
      to: trust.memberIds[0],
      type: "synchronous-request",
    });
  }
  if (trust && runtime && trust.memberIds[0] && runtime.memberIds[0]) {
    soft.push({
      id: "__soft-trust-runtime",
      from: trust.memberIds[0],
      to: runtime.memberIds[0],
      type: "agent-delegation",
    });
  }
  if (runtime && repoCluster && runtime.memberIds[0] && repoCluster.memberIds[0]) {
    soft.push({
      id: "__soft-runtime-repo",
      from: runtime.memberIds[0],
      to: repoCluster.memberIds[0],
      type: "git-integration",
    });
  }

  const { origin } = layoutClusterRow(
    clusters,
    model,
    soft,
    opts.originX,
    opts.originY,
    opts.clusterGapX,
    opts.clusterGapY,
    view.layout,
  );

  const layout: Record<string, LayoutEntry> = {};
  const boundaries: Array<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    members: string[];
  }> = [];

  for (const c of clusters) {
    const o = origin[c.id] ?? { x: opts.originX, y: opts.originY };
    const pad = c.boundaryId ? opts.boundaryPad : 0;
    for (const id of c.memberIds) {
      const loc = c.local[id];
      if (!loc) continue;
      layout[id] = {
        x: Math.round(o.x + pad + loc.x),
        y: Math.round(o.y + pad + loc.y),
        w: loc.w,
        h: loc.h,
      };
    }
    if (c.boundaryId) {
      boundaries.push({
        id: c.boundaryId,
        x: Math.round(o.x),
        y: Math.round(o.y),
        w: Math.round(Math.max(160, c.width)),
        h: Math.round(Math.max(120, c.height)),
        members: [...c.memberIds],
      });
    }
  }

  // Preserve any layout keys we somehow missed.
  for (const id of ids) {
    if (!layout[id]) layout[id] = { ...sizes[id] };
  }

  const connectionSides: Array<{ id: string; fromSide: Side; toSide: Side }> = [];
  const pairIndex = new Map<string, number>();
  for (const conn of model.connections) {
    if (!conn.id) continue;
    const a = layout[conn.from];
    const b = layout[conn.to];
    if (!a || !b) continue;
    const base = pickSide(center(boxOf(a)), center(boxOf(b)));
    const pairKey = `${conn.from}\0${conn.to}`;
    const idx = pairIndex.get(pairKey) ?? 0;
    pairIndex.set(pairKey, idx + 1);
    connectionSides.push({ id: conn.id, ...fanSides(base, idx) });
  }

  return { layout, boundaries, connectionSides };
}
