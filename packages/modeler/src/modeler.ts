import {
  createEmptyModel,
  parseSphereYaml,
  serializeSphereYaml,
  slugifyId,
  type SphereModel,
} from "@spherescan/model";
import {
  projectToGraph,
  graphToSvg,
  svgToPngBlob,
  type BoardGraph,
  ScanViewer,
} from "@spherescan/viewer";
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
export class ScanModeler {
  private model: SphereModel | null = null;
  private savedYaml: string | null = null;
  private viewId?: string;
  readonly commandStack = new CommandStack();
  readonly modeling: Modeling;
  private listeners = new Set<ChangeListener>();
  private viewer: ScanViewer | null = null;

  constructor(options: ModelerOptions = {}) {
    this.viewId = options.viewId;
    this.modeling = new Modeling(
      () => {
        if (!this.model) throw new Error("No model loaded");
        return this.model;
      },
      (m) => {
        this.model = m;
        this.emit();
        void this.syncViewer();
      },
      this.commandStack,
      this.viewId,
    );

    this.commandStack.onChange(() => this.emit());

    if (options.container) {
      this.viewer = new ScanViewer({
        container: options.container,
        viewId: options.viewId,
      });
    }
  }

  async importYAML(yaml: string): Promise<void> {
    this.model = parseSphereYaml(yaml);
    this.savedYaml = serializeSphereYaml(this.model);
    this.commandStack.clear();
    await this.syncViewer();
    this.emit();
  }

  async importYAMLFile(file: File): Promise<void> {
    await this.importYAML(await file.text());
  }

  /**
   * Replace the board with a new empty SCAN model (clears undo history).
   * Marks the board dirty until the user saves/downloads YAML.
   */
  async newBoard(systemName = "Untitled System"): Promise<void> {
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
  async duplicateBoard(systemName: string): Promise<{
    fromSystemId: string;
    toSystemId: string;
  }> {
    if (!this.model) throw new Error("No model loaded");
    const trimmed = systemName.trim();
    if (!trimmed) throw new Error("System name cannot be empty");
    const fromSystemId = this.model.system.id;
    let toSystemId = slugifyId(trimmed);
    if (toSystemId === fromSystemId) {
      toSystemId = `${toSystemId}-copy`;
    }
    const next = structuredClone(this.model) as SphereModel;
    next.system.name = trimmed;
    next.system.id = toSystemId;
    this.model = next;
    this.savedYaml = null;
    this.commandStack.clear();
    await this.syncViewer();
    this.emit();
    return { fromSystemId, toSystemId };
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
    const yaml = serializeSphereYaml(this.model);
    this.savedYaml = yaml;
    this.emit();
    return yaml;
  }

  /** Serialize without clearing the dirty flag (for save-as / picker cancel). */
  peekYAML(): string {
    if (!this.model) throw new Error("No model loaded");
    return serializeSphereYaml(this.model);
  }

  isDirty(): boolean {
    if (!this.model) return false;
    if (this.savedYaml == null) return true;
    return serializeSphereYaml(this.model) !== this.savedYaml;
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
    return { blob: await svgToPngBlob(svg, scale) };
  }

  undo(): void {
    this.commandStack.undo();
  }

  redo(): void {
    this.commandStack.redo();
  }

  on(event: "commandStack.changed" | "changed", listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    this.viewer?.destroy();
    this.listeners.clear();
    this.model = null;
  }

  private async syncViewer() {
    if (!this.viewer || !this.model) return;
    await this.viewer.importYAML(serializeSphereYaml(this.model));
  }

  private emit() {
    if (!this.model) return;
    const state = {
      model: this.model,
      graph: projectToGraph(this.model, this.viewId),
      canUndo: this.commandStack.canUndo(),
      canRedo: this.commandStack.canRedo(),
      dirty: this.isDirty(),
    };
    for (const l of this.listeners) l(state);
  }
}

/** @deprecated Use ScanModeler */
export const SphereModeler = ScanModeler;
export default ScanModeler;
