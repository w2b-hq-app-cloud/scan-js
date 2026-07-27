import { parseSphereYaml, serializeSphereYaml, } from "@spherescan/model";
import { graphToSvg, svgToPngBlob } from "./export.js";
import { projectToGraph } from "./projectToGraph.js";
/**
 * Embeddable SCAN diagram viewer.
 * Renders an SVG snapshot into a host container. Interactive editing lives in @spherescan/modeler + apps/whiteboard.
 */
export class ScanViewer {
    container;
    model = null;
    viewId;
    listeners = new Set();
    constructor(options) {
        this.container =
            typeof options.container === "string"
                ? document.querySelector(options.container)
                : options.container;
        if (!this.container) {
            throw new Error("ScanViewer: container not found");
        }
        this.viewId = options.viewId;
    }
    async importYAML(yaml) {
        this.model = parseSphereYaml(yaml);
        this.render();
    }
    async importYAMLUrl(url) {
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`Failed to fetch YAML: ${res.status}`);
        await this.importYAML(await res.text());
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
        return serializeSphereYaml(this.model);
    }
    async saveSVG() {
        const graph = this.getGraph();
        if (!graph)
            throw new Error("No model loaded");
        return { svg: graphToSvg(graph) };
    }
    async savePNG(scale = 2) {
        const { svg } = await this.saveSVG();
        const blob = await svgToPngBlob(svg, scale);
        return { blob };
    }
    fitViewport() {
        // Snapshot SVG already uses diagram bounds; no-op for static embed.
    }
    onChange(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    destroy() {
        this.container.innerHTML = "";
        this.listeners.clear();
        this.model = null;
    }
    render() {
        const graph = this.getGraph();
        if (!graph)
            return;
        const { svg } = { svg: graphToSvg(graph) };
        this.container.innerHTML = svg;
        for (const l of this.listeners)
            l(graph);
    }
}
/** @deprecated Use ScanViewer */
export const SphereViewer = ScanViewer;
export default ScanViewer;
