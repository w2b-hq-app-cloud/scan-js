import { type SphereModel } from "@spherescan/model";
import { type BoardGraph } from "@spherescan/viewer";
import { CommandStack } from "./command-stack.js";
import { Modeling } from "./modeling.js";
export type ModelerOptions = {
    container?: string | HTMLElement;
    viewId?: string;
};
type ChangeListener = (state: {
    model: SphereModel;
    graph: BoardGraph;
    canUndo: boolean;
    canRedo: boolean;
    dirty: boolean;
}) => void;
/**
 * SCAN modeler - owns the canonical model, command stack, and projection.
 * Optional container enables embeddable snapshot rendering via ScanViewer.
 */
export declare class ScanModeler {
    private model;
    private savedYaml;
    private viewId?;
    readonly commandStack: CommandStack;
    readonly modeling: Modeling;
    private listeners;
    private viewer;
    constructor(options?: ModelerOptions);
    importYAML(yaml: string): Promise<void>;
    importYAMLFile(file: File): Promise<void>;
    /**
     * Replace the board with a new empty SCAN model (clears undo history).
     * Marks the board dirty until the user saves/downloads YAML.
     */
    newBoard(systemName?: string): Promise<void>;
    getModel(): SphereModel | null;
    getGraph(): BoardGraph | null;
    saveYAML(): string;
    /** Serialize without clearing the dirty flag (for save-as / picker cancel). */
    peekYAML(): string;
    isDirty(): boolean;
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
    undo(): void;
    redo(): void;
    on(event: "commandStack.changed" | "changed", listener: ChangeListener): () => void;
    destroy(): void;
    private syncViewer;
    private emit;
}
/** @deprecated Use ScanModeler */
export declare const SphereModeler: typeof ScanModeler;
export default ScanModeler;
