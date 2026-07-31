import type { BoardGraph } from "./board-types.js";
import { type EdgeRouteMode } from "./edge-geometry.js";
export declare function diagramBounds(graph: BoardGraph, pad?: number): {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** Build an SVG snapshot of the board graph matching the live whiteboard cards. */
export type GraphToSvgOptions = {
    /** Match board arrow mode. Defaults to orthogonal (straight 90°) like the live board. */
    mode?: EdgeRouteMode;
};
export declare function graphToSvg(graph: BoardGraph, options?: GraphToSvgOptions): string;
/** Rasterize SVG string to PNG blob (browser only). */
export declare function svgToPngBlob(svg: string, scale?: number): Promise<Blob>;
