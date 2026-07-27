import type { LayoutEntry, SphereConnection, SphereModel } from "@spherescan/model";
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
/**
 * Compute non-overlapping layout for elements and fitted boundary boxes.
 * Connection side anchors are updated so edges/labels read cleanly.
 */
export declare function computeAutoLayout(model: SphereModel, viewId?: string, options?: AutoLayoutOptions): {
    layout: Record<string, LayoutEntry>;
    boundaries: Array<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
        members: string[];
    }>;
    connectionSides: Array<{
        id: string;
        fromSide: Side;
        toSide: Side;
    }>;
};
export {};
