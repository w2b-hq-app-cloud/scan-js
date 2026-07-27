import type { BoardGraph } from "./board-types.js";
export declare function diagramBounds(graph: BoardGraph, pad?: number): {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** Build an SVG snapshot of the board graph matching the live whiteboard cards. */
export declare function graphToSvg(graph: BoardGraph): string;
/** Rasterize SVG string to PNG blob (browser only). */
export declare function svgToPngBlob(svg: string, scale?: number): Promise<Blob>;
