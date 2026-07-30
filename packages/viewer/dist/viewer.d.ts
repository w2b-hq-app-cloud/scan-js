import { type SphereModel } from "@spherescan/model";
import type { BoardGraph } from "./board-types.js";
export type ViewerOptions = {
    container: string | HTMLElement;
    viewId?: string;
};
type Listener = (graph: BoardGraph) => void;
/**
 * Embeddable SCAN diagram viewer.
 * Renders an SVG snapshot into a host container. Interactive editing lives in @spherescan/modeler + apps/whiteboard.
 */
export declare class ScanViewer {
    private container;
    private model;
    private viewId?;
    private listeners;
    constructor(options: ViewerOptions);
    importYAML(yaml: string): Promise<void>;
    importYAMLUrl(url: string): Promise<void>;
    getModel(): SphereModel | null;
    getGraph(): BoardGraph | null;
    saveYAML(): string;
    saveSVG(opts?: {
        mode?: "bezier" | "orthogonal";
    }): Promise<{
        svg: string;
    }>;
    savePNG(scale?: number, opts?: {
        mode?: "bezier" | "orthogonal";
    }): Promise<{
        blob: Blob;
    }>;
    fitViewport(): void;
    onChange(listener: Listener): () => void;
    destroy(): void;
    private render;
}
/** @deprecated Use ScanViewer */
export declare const SphereViewer: typeof ScanViewer;
export default ScanViewer;
