import { createEmptyModel, parseSphereYaml, serializeSphereYaml, slugifyId, } from "@spherescan/model";
import { projectToGraph, graphToSvg, svgToPngBlob, ScanViewer, } from "@spherescan/viewer";
import { CommandStack } from "./command-stack.js";
import { Modeling } from "./modeling.js";
/**
 * SCAN modeler - owns the canonical model, command stack, and projection.
 * Optional container enables embeddable snapshot rendering via ScanViewer.
 */
export class ScanModeler {
    model = null;
    savedYaml = null;
    viewId;
    commandStack = new CommandStack();
    modeling;
    listeners = new Set();
    viewer = null;
    constructor(options = {}) {
        this.viewId = options.viewId;
        this.modeling = new Modeling(() => {
            if (!this.model)
                throw new Error("No model loaded");
            return this.model;
        }, (m) => {
            this.model = m;
            this.emit();
            void this.syncViewer();
        }, this.commandStack, this.viewId);
        this.commandStack.onChange(() => this.emit());
        if (options.container) {
            this.viewer = new ScanViewer({
                container: options.container,
                viewId: options.viewId,
            });
        }
    }
    async importYAML(yaml) {
        this.model = parseSphereYaml(yaml);
        this.savedYaml = serializeSphereYaml(this.model);
        this.commandStack.clear();
        await this.syncViewer();
        this.emit();
    }
    /**
     * Replace the board from a user-picked file. Marks dirty so hosts persist a
     * draft / cloud save — unlike `importYAML` used for boot/load (clean).
     */
    async importYAMLFile(file) {
        this.model = parseSphereYaml(await file.text());
        this.savedYaml = null;
        this.commandStack.clear();
        await this.syncViewer();
        this.emit();
    }
    /**
     * Replace the board with a new empty SCAN model (clears undo history).
     * Marks the board dirty until the user saves/downloads YAML.
     */
    async newBoard(systemName = "Untitled System") {
        const model = createEmptyModel(systemName, {
            viewId: this.viewId ?? "architecture-board",
        });
        this.model = model;
        this.savedYaml = null;
        this.commandStack.clear();
        await this.syncViewer();
        this.emit();
    }
    /**
     * Clone the current board under a new system name/id (clears undo history).
     * Hosts that keep per-system workspaces should treat this as a fresh tree
     * (do not relocate the previous platform folder).
     */
    async duplicateBoard(systemName) {
        if (!this.model)
            throw new Error("No model loaded");
        const trimmed = systemName.trim();
        if (!trimmed)
            throw new Error("System name cannot be empty");
        const fromSystemId = this.model.system.id;
        let toSystemId = slugifyId(trimmed);
        if (toSystemId === fromSystemId) {
            toSystemId = `${toSystemId}-copy`;
        }
        const next = structuredClone(this.model);
        next.system.name = trimmed;
        next.system.id = toSystemId;
        this.model = next;
        this.savedYaml = null;
        this.commandStack.clear();
        await this.syncViewer();
        this.emit();
        return { fromSystemId, toSystemId };
    }
    getModel() {
        return this.model;
    }
    getGraph() {
        if (!this.model)
            return null;
        return projectToGraph(this.model, this.viewId);
    }
    saveYAML() {
        if (!this.model)
            throw new Error("No model loaded");
        const yaml = serializeSphereYaml(this.model);
        this.savedYaml = yaml;
        this.emit();
        return yaml;
    }
    /** Serialize without clearing the dirty flag (for save-as / picker cancel). */
    peekYAML() {
        if (!this.model)
            throw new Error("No model loaded");
        return serializeSphereYaml(this.model);
    }
    isDirty() {
        if (!this.model)
            return false;
        if (this.savedYaml == null)
            return true;
        return serializeSphereYaml(this.model) !== this.savedYaml;
    }
    async saveSVG(opts) {
        const graph = this.getGraph();
        if (!graph)
            throw new Error("No model loaded");
        return { svg: graphToSvg(graph, opts) };
    }
    async savePNG(scale = 2, opts) {
        const { svg } = await this.saveSVG(opts);
        return { blob: await svgToPngBlob(svg, scale) };
    }
    undo() {
        this.commandStack.undo();
    }
    redo() {
        this.commandStack.redo();
    }
    on(event, listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    destroy() {
        this.viewer?.destroy();
        this.listeners.clear();
        this.model = null;
    }
    async syncViewer() {
        if (!this.viewer || !this.model)
            return;
        await this.viewer.importYAML(serializeSphereYaml(this.model));
    }
    emit() {
        if (!this.model)
            return;
        const state = {
            model: this.model,
            graph: projectToGraph(this.model, this.viewId),
            canUndo: this.commandStack.canUndo(),
            canRedo: this.commandStack.canRedo(),
            dirty: this.isDirty(),
        };
        for (const l of this.listeners)
            l(state);
    }
}
/** @deprecated Use ScanModeler */
export const SphereModeler = ScanModeler;
export default ScanModeler;
