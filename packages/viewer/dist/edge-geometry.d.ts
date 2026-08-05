/** Shared edge path + label placement for board canvas and SVG export. */
export type Point = {
    x: number;
    y: number;
};
export type Side = "l" | "r" | "t" | "b";
export type Box = {
    x: number;
    y: number;
    w: number;
    h: number;
};
export type EdgeRouteMode = "bezier" | "orthogonal";
/** Hide connection label text below this world zoom (hover/selection still shows). */
export declare const LABEL_LOD_ZOOM = 0.7;
/** Pixel gap between parallel orthogonal mid-lanes (vertical/horizontal trunks). */
export declare const ORTHO_LANE_GAP = 20;
export declare function anchorPoint(n: {
    x: number;
    y: number;
    w: number;
    h: number;
}, side: Side, 
/** Position along the side in [0,1] (0.5 = midpoint). */
along?: number): Point;
/**
 * Choose exit/enter sides from box geometry so the wire leaves toward the
 * target and arrives from the direction it travels (facing edges preferred).
 * Used for both curved and orthogonal rendering.
 */
export declare function pickEdgeSides(from: Box, to: Box): {
    fromSide: Side;
    toSide: Side;
};
/** @deprecated Use pickEdgeSides — same behavior for curved and orthogonal. */
export declare const pickOrthogonalSides: typeof pickEdgeSides;
/** Spread multiple wires that share a face along that edge (0.2…0.8). */
export declare function fanAlongSide(index: number, count: number): number;
/** Centered lane offset so parallel orthogonal trunks do not share the same mid X/Y. */
export declare function orthoLaneOffset(index: number, count: number, gap?: number): number;
/**
 * Resolve edge anchors on box sides from travel direction (+ optional fan).
 * Shared by curved Bezier and orthogonal routing.
 */
export declare function resolveEdgeAnchors(from: Box, to: Box, fanIndex?: number, fanCount?: number): {
    a: Point;
    b: Point;
    fromSide: Side;
    toSide: Side;
};
/** @deprecated Use resolveEdgeAnchors — same behavior for curved and orthogonal. */
export declare const resolveOrthogonalAnchors: typeof resolveEdgeAnchors;
export declare function edgeControls(a: Point, b: Point, aSide: string): {
    c1: Point;
    c2: Point;
};
export declare function edgePath(a: Point, b: Point, aSide: string, bSide?: string, mode?: EdgeRouteMode, lane?: number): string;
/** Project a point onto a box side (attachment slides along that face). */
export declare function projectOntoSide(box: Box, p: Point, side: Side): Point;
/**
 * Side of `box` that best faces `p` so a stub to `p` can stay axis-aligned.
 * Prefers an outside face; uses `hint` when several faces are plausible.
 */
export declare function sideFacingPoint(box: Box, p: Point, hint?: Side): Side;
/**
 * Anchors for a stored orthogonal route: slide attachments so the first/last
 * stubs stay horizontal or vertical (no diagonal into the node).
 */
export declare function resolveAnchorsFromWaypoints(from: Box, to: Box, waypoints: Point[], hintFrom?: Side, hintTo?: Side): {
    a: Point;
    b: Point;
    fromSide: Side;
    toSide: Side;
};
/**
 * Force every step to be purely horizontal or vertical by inserting elbows
 * when a diagonal would otherwise appear.
 */
export declare function normalizeOrthogonalPolyline(points: Point[]): Point[];
/**
 * Keep route endpoints glued to node faces and matching the adjacent waypoint
 * so stub segments stay axis-aligned while dragging segment handles.
 */
export declare function clampOrthogonalRouteEnds(points: Point[], from: Box, to: Box, hintFrom?: Side, hintTo?: Side): Point[];
/** Manhattan waypoints: exit stubs + elbows, 90° only. */
export declare function orthogonalWaypoints(a: Point, b: Point, aSide: string, bSide?: string, stub?: number, 
/** Shift mid corridor so parallel wires stay readable (pixels). */
lane?: number): Point[];
export declare function polylineToPath(points: Point[]): string;
type Seg = {
    a: Point;
    b: Point;
    horizontal: boolean;
};
/**
 * Build an SVG path for an orthogonal polyline, inserting semicircle hop arcs
 * where this edge crosses earlier edges (schematic-style jump-overs).
 */
export declare function orthogonalPathWithHops(points: Point[], earlierSegments: Seg[], hopRadius?: number): string;
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
    /** Persisted intermediate orthogonal points from the active view. */
    waypoints?: Point[];
};
/**
 * Assign mid-corridor lane offsets so parallel orthogonal wires stay spaced.
 * Same gap is used by `routeOrthogonalEdges` and label placement.
 */
export declare function assignOrthogonalLanes(edges: RoutedEdgeInput[]): Map<string, number>;
/**
 * Route all edges orthogonally and add hop arcs where later edges cross earlier ones.
 * Returns a map of edge id → SVG path `d`.
 */
export declare function routeOrthogonalEdges(edges: RoutedEdgeInput[], hopRadius?: number): Map<string, string>;
/** Same routing as `routeOrthogonalEdges`, but returns polylines (for handles / labels). */
export declare function routeOrthogonalPolylines(edges: RoutedEdgeInput[]): Map<string, Point[]>;
/** Sample a point along a polyline by normalized length t ∈ [0,1]. */
export declare function pointOnPolyline(points: Point[], t: number): Point;
/** Cubic Bezier point at parameter t ∈ [0,1]. */
export declare function pointOnCubic(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point;
/** Approximate tangent (derivative) of cubic Bezier at t. */
export declare function tangentOnCubic(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point;
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
    /** Orthogonal mid-corridor lane (from assignOrthogonalLanes). */
    laneOffset?: number;
};
/**
 * Place a label near the path midpoint, sliding along the path and/or
 * nudging along the normal to clear node AABBs.
 */
export declare function placeEdgeLabel(opts: PlaceEdgeLabelOpts): Point;
/**
 * Assign stagger indices for labels whose midpoints are nearly coincident.
 * Prefer `resolveLabelOverlaps` for real chip sizes — this remains for light nudges.
 * Returns a map of edgeId -> stagger offset (-2...2).
 */
export declare function computeLabelStagger(placements: Array<{
    id: string;
    x: number;
    y: number;
}>, threshold?: number): Map<string, number>;
export type LabelPlacement = {
    id: string;
    x: number;
    y: number;
    /** Chip width (centered on x). */
    w?: number;
    /** Chip height (centered on y). */
    h?: number;
};
/** Rough chip size for edge labels (icon + text + optional contract line). */
export declare function estimateEdgeLabelSize(label: string, contract?: string | null): {
    w: number;
    h: number;
};
/**
 * Push overlapping edge-label chips apart until they no longer collide.
 * Prefers stacking along the axis of greater penetration (usually Y for
 * parallel vertical wires).
 */
export declare function resolveLabelOverlaps(placements: LabelPlacement[], opts?: {
    gap?: number;
    defaultW?: number;
    defaultH?: number;
    passes?: number;
}): Map<string, Point>;
export {};
