import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScanModeler,
  type CreateKind,
} from "@spherescan/modeler";
import type { BoardGraph, SphereNode } from "@spherescan/viewer";
import {
  createEmptyModel,
  serializeSphereYaml,
  type SphereModel,
} from "@spherescan/model";
import orderPlatformYaml from "./samples/order-platform";

export type UseScanBoardOptions = {
  /** Initial document YAML. Defaults to the Order Platform sample. */
  initialYaml?: string;
  /** Boot an empty Untitled board instead of the sample (clean until edited). */
  startEmpty?: boolean;
};

function emptyBoardYaml(systemName = "Untitled System"): string {
  return serializeSphereYaml(
    createEmptyModel(systemName, { viewId: "architecture-board" }),
  );
}

const EMPTY_BOARD_YAML = emptyBoardYaml();

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Filename stem from diagram / system name (e.g. "Order Platform" -> "order-platform"). */
export function diagramBasename(name: string | undefined | null): string {
  const slug = (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "architecture";
}

type SaveFilePickerOptions = {
  suggestedName?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
};

type FilePickerWindow = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
};

async function writeTextToHandle(handle: FileSystemFileHandle, text: string) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

async function saveTextConnected(
  filename: string,
  text: string,
  mime: string,
  existing?: FileSystemFileHandle | null,
): Promise<{ handle: FileSystemFileHandle | null; wrote: boolean; mode: "disk" | "download" | "cancelled" }> {
  const w = window as FilePickerWindow;
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle =
        existing ??
        (await w.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "SCAN / YAML",
              accept: {
                "text/yaml": [".scan", ".yaml", ".yml", ".scan.yaml"],
                "application/x-yaml": [".scan", ".yaml", ".yml", ".scan.yaml"],
              },
            },
          ],
        }));
      await writeTextToHandle(handle, text);
      return { handle, wrote: true, mode: "disk" };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { handle: existing ?? null, wrote: false, mode: "cancelled" };
      }
      throw err;
    }
  }
  downloadText(filename, text, mime);
  return { handle: null, wrote: true, mode: "download" };
}

export function useScanBoard(options: UseScanBoardOptions | string = {}) {
  // Legacy: useScanBoard(yamlString) still works for callers that pass YAML directly.
  const opts: UseScanBoardOptions =
    typeof options === "string" ? { initialYaml: options } : options;
  const bootYaml = opts.startEmpty
    ? EMPTY_BOARD_YAML
    : (opts.initialYaml ?? orderPlatformYaml);

  const modelerRef = useRef<ScanModeler | null>(null);
  if (!modelerRef.current) {
    modelerRef.current = new ScanModeler({ viewId: "architecture-board" });
  } else if (typeof modelerRef.current.modeling.renameSystem !== "function") {
    // HMR can keep a stale ScanModeler instance after @spherescan/modeler rebuilds.
    modelerRef.current = new ScanModeler({ viewId: "architecture-board" });
  }
  const modeler = modelerRef.current;

  const [graph, setGraph] = useState<BoardGraph | null>(null);
  const [model, setModel] = useState<SphereModel | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [ready, setReady] = useState(false);
  const [historyStep, setHistoryStep] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);

  const dragOrigin = useRef<{ id: string; x: number; y: number } | null>(null);
  const boundaryResizeOrigin = useRef<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const yamlHandleRef = useRef<FileSystemFileHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    const syncHistory = () => {
      const idx = modeler.commandStack.currentIndex;
      const size = modeler.commandStack.size;
      // Position in the undo stack: 0 = original document, size = all edits applied.
      setHistoryStep(Math.max(0, idx + 1));
      setHistoryTotal(size);
    };
    const off = modeler.on("changed", (state) => {
      setGraph(state.graph);
      setModel(state.model);
      setCanUndo(state.canUndo);
      setCanRedo(state.canRedo);
      setDirty(state.dirty);
      syncHistory();
    });
    void modeler.importYAML(bootYaml).then(() => {
      if (cancelled) return;
      syncHistory();
      setReady(true);
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [modeler, bootYaml]);

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const groups = graph?.groups ?? [];

  const setNodesPreview = useCallback(
    (updater: (prev: SphereNode[]) => SphereNode[]) => {
      const current = modeler.getGraph()?.nodes ?? [];
      const next = updater(current);
      // Apply preview moves for dragged nodes
      for (const n of next) {
        const prev = current.find((c) => c.id === n.id);
        if (prev && (prev.x !== n.x || prev.y !== n.y)) {
          modeler.modeling.previewMove(n.id, n.x, n.y);
        }
      }
    },
    [modeler],
  );

  const beginDrag = useCallback((id: string) => {
    const n = modeler.getGraph()?.nodes.find((x) => x.id === id);
    if (!n) return;
    dragOrigin.current = { id, x: n.x, y: n.y };
  }, [modeler]);

  const endDrag = useCallback(() => {
    const origin = dragOrigin.current;
    dragOrigin.current = null;
    if (!origin) return;
    const n = modeler.getGraph()?.nodes.find((x) => x.id === origin.id);
    if (!n) return;
    const { x: finalX, y: finalY } = n;
    if (finalX === origin.x && finalY === origin.y) return;
    modeler.modeling.previewMove(origin.id, origin.x, origin.y);
    modeler.modeling.moveElement(origin.id, finalX, finalY);
  }, [modeler]);

  const beginBoundaryResize = useCallback(
    (id: string) => {
      const g = modeler.getGraph()?.groups.find((x) => x.id === id);
      if (!g) return;
      boundaryResizeOrigin.current = { id, x: g.x, y: g.y, w: g.w, h: g.h };
    },
    [modeler],
  );

  const previewBoundaryResize = useCallback(
    (id: string, rect: { x: number; y: number; w: number; h: number }) => {
      modeler.modeling.previewResizeBoundary(id, rect);
    },
    [modeler],
  );

  const endBoundaryResize = useCallback(() => {
    const origin = boundaryResizeOrigin.current;
    boundaryResizeOrigin.current = null;
    if (!origin) return;
    const g = modeler.getGraph()?.groups.find((x) => x.id === origin.id);
    if (!g) return;
    if (
      g.x === origin.x &&
      g.y === origin.y &&
      g.w === origin.w &&
      g.h === origin.h
    ) {
      return;
    }
    modeler.modeling.previewResizeBoundary(origin.id, {
      x: origin.x,
      y: origin.y,
      w: origin.w,
      h: origin.h,
    });
    modeler.modeling.resizeBoundary(origin.id, {
      x: g.x,
      y: g.y,
      w: g.w,
      h: g.h,
    });
  }, [modeler]);

  const boundaryMoveOrigin = useRef<{ id: string; x: number; y: number } | null>(null);

  const beginBoundaryMove = useCallback(
    (id: string) => {
      const g = modeler.getGraph()?.groups.find((x) => x.id === id);
      if (!g) return;
      boundaryMoveOrigin.current = { id, x: g.x, y: g.y };
    },
    [modeler],
  );

  const previewBoundaryMove = useCallback(
    (id: string, x: number, y: number) => {
      modeler.modeling.previewMoveBoundary(id, x, y);
    },
    [modeler],
  );

  const endBoundaryMove = useCallback(() => {
    const origin = boundaryMoveOrigin.current;
    boundaryMoveOrigin.current = null;
    if (!origin) return;
    const g = modeler.getGraph()?.groups.find((x) => x.id === origin.id);
    if (!g) return;
    if (g.x === origin.x && g.y === origin.y) return;
    modeler.modeling.previewMoveBoundary(origin.id, origin.x, origin.y);
    modeler.modeling.moveBoundary(origin.id, g.x, g.y);
  }, [modeler]);

  const undo = useCallback(() => modeler.undo(), [modeler]);
  const redo = useCallback(() => modeler.redo(), [modeler]);

  const deleteElement = useCallback(
    (id: string) => modeler.modeling.deleteElement(id),
    [modeler],
  );

  const duplicateElement = useCallback(
    (id: string) => modeler.modeling.duplicateElement(id),
    [modeler],
  );

  const duplicateBoundary = useCallback(
    (id: string) => modeler.modeling.duplicateBoundary(id),
    [modeler],
  );

  const deleteConnection = useCallback(
    (id: string) => modeler.modeling.deleteConnection(id),
    [modeler],
  );

  const updateConnection = useCallback(
    (
      id: string,
      patch: {
        label?: string | null;
        contract?: string | null;
        operations?: string[] | null;
      },
    ) => modeler.modeling.updateConnection(id, patch),
    [modeler],
  );

  const renameElement = useCallback(
    (id: string, name: string) => modeler.modeling.renameElement(id, name),
    [modeler],
  );

  const updateElementIcon = useCallback(
    (id: string, icon: string | null) => modeler.modeling.updateElementIcon(id, icon),
    [modeler],
  );

  const addPort = useCallback(
    (
      elementId: string,
      role: "consume" | "expose",
      port?: { label?: string; protocol?: string },
    ) => modeler.modeling.addPort(elementId, role, port),
    [modeler],
  );

  const updatePort = useCallback(
    (
      elementId: string,
      portId: string,
      patch: { label?: string | null; protocol?: string | null },
    ) => modeler.modeling.updatePort(elementId, portId, patch),
    [modeler],
  );

  const deletePort = useCallback(
    (elementId: string, portId: string) => modeler.modeling.deletePort(elementId, portId),
    [modeler],
  );

  const renameSystem = useCallback(
    (name: string) => modeler.modeling.renameSystem(name),
    [modeler],
  );

  const createElement = useCallback(
    (kind: CreateKind, x: number, y: number, name?: string) =>
      modeler.modeling.createElement(kind, { x, y }, name),
    [modeler],
  );

  const connect = useCallback(
    (
      fromId: string,
      toId: string,
      options?: { fromPort?: string; toPort?: string },
    ) => modeler.modeling.connect(fromId, toId, options),
    [modeler],
  );

  const autoLayout = useCallback(() => {
    modeler.modeling.autoLayout();
  }, [modeler]);

  const createBoundary = useCallback(
    (
      kind: "trust" | "runtime",
      rect: { x: number; y: number; w: number; h: number },
      label?: string,
    ) => modeler.modeling.createBoundary(kind, rect, label),
    [modeler],
  );

  const renameBoundary = useCallback(
    (id: string, label: string) => modeler.modeling.renameBoundary(id, label),
    [modeler],
  );

  const updateBoundary = useCallback(
    (
      id: string,
      patch: {
        label?: string | null;
        tag?: string | null;
        kind?: "trust" | "runtime";
        icon?: string | null;
        color?:
          | "svc"
          | "ext"
          | "data"
          | "event"
          | "search"
          | "agent"
          | "repo"
          | "warn"
          | null;
      },
    ) => modeler.modeling.updateBoundary(id, patch),
    [modeler],
  );

  const deleteBoundary = useCallback(
    (id: string) => modeler.modeling.deleteBoundary(id),
    [modeler],
  );

  const diagramFileBase = useCallback(() => {
    return diagramBasename(modeler.getModel()?.system.name);
  }, [modeler]);

  const downloadYaml = useCallback(async () => {
    const base = diagramFileBase();
    const filename = `${base}.scan.yaml`;
    const current = modeler.getModel();
    if (!current) throw new Error("No model loaded");
    const yaml = serializeSphereYaml(current);
    const result = await saveTextConnected(
      filename,
      yaml,
      "text/yaml",
      yamlHandleRef.current,
    );
    if (!result.wrote) return null;
    if (result.handle) yamlHandleRef.current = result.handle;
    modeler.saveYAML();
    return { filename, connected: result.mode === "disk" };
  }, [modeler, diagramFileBase]);

  const importYamlFile = useCallback(
    async (file: File) => {
      yamlHandleRef.current = null;
      await modeler.importYAMLFile(file);
    },
    [modeler],
  );

  const exportSvg = useCallback(async (opts?: { mode?: "bezier" | "orthogonal" }) => {
    const base = diagramFileBase();
    const filename = `${base}.svg`;
    const { svg } = await modeler.saveSVG(opts);
    downloadText(filename, svg, "image/svg+xml");
    return { filename };
  }, [modeler, diagramFileBase]);

  const exportPng = useCallback(async (opts?: { mode?: "bezier" | "orthogonal" }) => {
    const base = diagramFileBase();
    const filename = `${base}.png`;
    const { blob } = await modeler.savePNG(2, opts);
    await downloadBlob(filename, blob);
    return { filename };
  }, [modeler, diagramFileBase]);

  const loadYamlText = useCallback(
    async (yaml: string) => {
      yamlHandleRef.current = null;
      await modeler.importYAML(yaml);
    },
    [modeler],
  );

  const newBoard = useCallback(
    async (systemName?: string) => {
      yamlHandleRef.current = null;
      await modeler.newBoard(systemName);
    },
    [modeler],
  );

  return useMemo(
    () => ({
      ready,
      model,
      nodes,
      edges,
      groups,
      canUndo,
      canRedo,
      dirty,
      historyStep,
      historyTotal,
      setNodesPreview,
      beginDrag,
      endDrag,
      beginBoundaryResize,
      previewBoundaryResize,
      endBoundaryResize,
      beginBoundaryMove,
      previewBoundaryMove,
      endBoundaryMove,
      undo,
      redo,
      deleteElement,
      duplicateElement,
      duplicateBoundary,
      deleteConnection,
      updateConnection,
      renameElement,
      updateElementIcon,
      addPort,
      updatePort,
      deletePort,
      renameSystem,
      createElement,
      connect,
      autoLayout,
      createBoundary,
      renameBoundary,
      updateBoundary,
      deleteBoundary,
      downloadYaml,
      importYamlFile,
      exportSvg,
      exportPng,
      loadYamlText,
      newBoard,
      modeler,
    }),
    [
      ready,
      model,
      nodes,
      edges,
      groups,
      canUndo,
      canRedo,
      dirty,
      historyStep,
      historyTotal,
      setNodesPreview,
      beginDrag,
      endDrag,
      beginBoundaryResize,
      previewBoundaryResize,
      endBoundaryResize,
      beginBoundaryMove,
      previewBoundaryMove,
      endBoundaryMove,
      undo,
      redo,
      deleteElement,
      duplicateElement,
      duplicateBoundary,
      deleteConnection,
      updateConnection,
      renameElement,
      updateElementIcon,
      addPort,
      updatePort,
      deletePort,
      renameSystem,
      createElement,
      connect,
      autoLayout,
      createBoundary,
      renameBoundary,
      updateBoundary,
      deleteBoundary,
      downloadYaml,
      importYamlFile,
      exportSvg,
      exportPng,
      loadYamlText,
      newBoard,
      modeler,
    ],
  );
}

/** Alias kept for older app imports. */
export const useSphereBoard = useScanBoard;
