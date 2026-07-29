import type { NodeKind, SphereEdge } from "./board-types.js";
/** Lucide-compatible SVG child (path / circle / ellipse / rect). */
export type IconChild = {
    tag: "path";
    d: string;
} | {
    tag: "circle";
    cx: number;
    cy: number;
    r: number;
} | {
    tag: "ellipse";
    cx: number;
    cy: number;
    rx: number;
    ry: number;
} | {
    tag: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    rx?: number;
};
export type KindVisual = {
    color: string;
    soft: string;
    /** Lucide 24x24 icon children (stroke icons). */
    icon: IconChild[];
};
/**
 * Visual tokens aligned with whiteboard `kinds.ts` + `styles.css`.
 * Hex approximations of oklch kind colors so SVG/PNG export stays portable.
 * Icon geometry from lucide-react@0.575 (same icons as the live NodeCard).
 */
export declare const kindVisuals: Record<NodeKind, KindVisual>;
export declare const warnVisual: {
    color: string;
    soft: string;
    icon: IconChild[];
};
export declare function edgeVisual(kind: SphereEdge["kind"]): {
    color: string;
    icon: IconChild[];
};
export declare function renderLucideIcon(children: IconChild[], x: number, y: number, size: number, stroke: string, opts?: {
    fill?: string;
    strokeWidth?: number;
}): string;
