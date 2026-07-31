import {
  parseSphereYaml,
  type SphereModel,
  serializeSphereYaml,
} from "@spherescan/model";
import type { BoardGraph } from "./board-types.js";
import { graphToSvg, svgToPngBlob } from "./export.js";
import { projectToGraph } from "./projectToGraph.js";

export type ViewerOptions = {
  container: string | HTMLElement;
  viewId?: string;
};

type Listener = (graph: BoardGraph) => void;

/**
 * Embeddable SCAN diagram viewer.
 * Renders an SVG snapshot into a host container. Interactive editing lives in @spherescan/modeler + apps/whiteboard.
 */
export class ScanViewer {
  private container: HTMLElement;
  private model: SphereModel | null = null;
  private viewId?: string;
  private listeners = new Set<Listener>();

  constructor(options: ViewerOptions) {
    this.container =
      typeof options.container === "string"
        ? (document.querySelector(options.container) as HTMLElement)
        : options.container;
    if (!this.container) {
      throw new Error("ScanViewer: container not found");
    }
    this.viewId = options.viewId;
  }

  async importYAML(yaml: string): Promise<void> {
    this.model = parseSphereYaml(yaml);
    this.render();
  }

  async importYAMLUrl(url: string): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch YAML: ${res.status}`);
    await this.importYAML(await res.text());
  }

  getModel(): SphereModel | null {
    return this.model;
  }

  getGraph(): BoardGraph | null {
    if (!this.model) return null;
    return projectToGraph(this.model, this.viewId);
  }

  saveYAML(): string {
    if (!this.model) throw new Error("No model loaded");
    return serializeSphereYaml(this.model);
  }

  async saveSVG(opts?: { mode?: "bezier" | "orthogonal" }): Promise<{ svg: string }> {
    const graph = this.getGraph();
    if (!graph) throw new Error("No model loaded");
    return { svg: graphToSvg(graph, opts) };
  }

  async savePNG(
    scale = 2,
    opts?: { mode?: "bezier" | "orthogonal" },
  ): Promise<{ blob: Blob }> {
    const { svg } = await this.saveSVG(opts);
    const blob = await svgToPngBlob(svg, scale);
    return { blob };
  }

  fitViewport(): void {
    // Snapshot SVG already uses diagram bounds; no-op for static embed.
  }

  onChange(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.container.innerHTML = "";
    this.listeners.clear();
    this.model = null;
  }

  private render() {
    const graph = this.getGraph();
    if (!graph) return;
    const { svg } = { svg: graphToSvg(graph) };
    this.container.innerHTML = svg;
    for (const l of this.listeners) l(graph);
  }
}

/** @deprecated Use ScanViewer */
export const SphereViewer = ScanViewer;
export default ScanViewer;
