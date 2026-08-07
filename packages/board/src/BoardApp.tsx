// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  Cpu,
  Locate,
  Maximize2,
  PenLine,
  Plus,
  Pointer,
  Shield,
  Square,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { SphereNode, SphereEdge } from "@spherescan/viewer";
import {
  LABEL_LOD_ZOOM,
  anchorPoint,
  edgePath,
  placeEdgeLabel,
  boundaryFillMix,
  boundaryStroke,
  resolveEdgeAnchors,
  resolveAnchorsFromWaypoints,
  clampOrthogonalRouteEnds,
  sideFacingPoint,
  routeOrthogonalEdges,
  routeOrthogonalPolylines,
  assignOrthogonalLanes,
  resolveLabelOverlaps,
  estimateEdgeLabelSize,
} from "@spherescan/viewer";
import type { CreateKind } from "@spherescan/modeler";
import {
  parseScanYaml,
  serializeSphereYaml,
  slugifyId,
} from "@spherescan/model";
import { toast } from "sonner";
import { Modal } from "./Modal";
import { useScanBoard } from "./useScanBoard";
import { ElementIcon } from "./ElementIcon";
import { TooltipProvider } from "./ui/tooltip";

import type {
  Point,
  BoardTool,
  ResizeHandle,
  BoardAppProps,
  BoardHostApi,
  BoardSelection,
  ArchitectureWarning,
  SystemIdentityChange,
} from "./board-types";
import {
  FAST_CLICK_SLOP,
  FAST_BOUNDARY_MIN_W,
  FAST_BOUNDARY_MIN_H,
  FAST_THIN_MAX_SHORT,
  classifyFastDraft,
  snap4,
  normalizeDraftRect,
  applyBoundaryResize,
} from "./board-geometry";
import { createKindHints, edgeKindTitle, edgeStyle } from "./board-style";
import { isScanFile } from "./board-files";
import { IconBtn } from "./ui/IconBtn";
import { EdgeIcon } from "./icons/EdgeIcon";
import { ToolRail } from "./tools/ToolRail";
import { FastDesignLegend } from "./tools/FastDesignLegend";
import { NodeCard } from "./nodes/NodeCard";
import { SelectionCheck } from "./nodes/SelectionCheck";
import { Inspector } from "./inspector/Inspector";
import { TopBar } from "./chrome/TopBar";
import { ViewTabs } from "./chrome/ViewTabs";
import { ValidationToast } from "./chrome/ValidationToast";
import { ContextMenu } from "./chrome/ContextMenu";
import { Legend } from "./chrome/Legend";
import { MiniMap } from "./chrome/MiniMap";

export type {
  Point,
  BoardTool,
  ResizeHandle,
  BoardAppProps,
  BoardHostApi,
  BoardSelection,
  ArchitectureWarning,
  SystemIdentityChange,
} from "./board-types";

export default function BoardApp({
  fill = "viewport",
  topBarBrand,
  topBarBeforeTitle,
  topBarAfterStatus,
  topBarAfterBrand,
  onDirtyChange,
  warnOnUnload = true,
  onSaveDocument,
  onLocalSave,
  onDocumentChange,
  onSystemIdentityChange,
  initialYaml,
  pendingMergeYaml,
  onMergeApplied,
  startEmpty = false,
  applyYaml = null,
  applyYamlNonce = 0,
  readOnly = false,
  onBoardReady,
  onYamlLoadError,
  renderNodeOverlay,
  renderInspectorExtras,
  renderBottomChrome,
  renderLeftPanel,
  renderViewTabsEnd,
  renderCanvasOverlay,
  architectureWarnings: architectureWarningsProp,
  renderValidationAction,
  architectureValidating = false,
}: BoardAppProps) {
  void readOnly;
  const board = useScanBoard({
    startEmpty: startEmpty && !initialYaml,
  });
  const {
    nodes,
    edges,
    groups,
    canUndo,
    canRedo,
    dirty,
    historyStep,
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
    createElement,
    connect,
    autoLayout,
    createBoundary,
    renameBoundary,
    updateBoundary,
    deleteBoundary,
    bringBoundaryForward,
    sendBoundaryBackward,
    downloadYaml,
    importYamlFile,
    exportSvg,
    exportPng,
    newBoard,
    renameElement,
    updateElementIcon,
    updateElementDescription,
    updateElementMeta,
    setElementRepository,
    addElementLink,
    removeElementLink,
    addPort,
    updatePort,
    deletePort,
    renameSystem,
    model,
    loadYamlText,
    mergeYamlText,
    modeler,
    ready,
  } = board;

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedBoundary, setSelectedBoundary] = useState<string | null>(null);
  /** Additional node ids when Ctrl/Cmd+click multi-selecting (primary is `selected`). */
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  /** Additional boundary ids for multi-select (primary is `selectedBoundary`). */
  const [selectedBoundaryExtras, setSelectedBoundaryExtras] = useState<string[]>([]);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState<Point>({ x: 40, y: 20 });
  const [tool, setTool] = useState<BoardTool>("select");
  const [createKind, setCreateKind] = useState<CreateKind>("service");
  const [boundaryKind, setBoundaryKind] = useState<"trust" | "runtime">("trust");
  const [fastDraft, setFastDraft] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  /** Orthogonal (90°) edges with hop arcs at crossings. */
  const [orthogonalEdges, setOrthogonalEdges] = useState(true);
  const [view, setView] = useState<"all" | "external" | "contracts" | "agents">("all");
  /** Dim non-neighbors when a node/edge is selected - reading aid for dense boards. */
  const [focusMode, setFocusMode] = useState(true);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const selectionListenersRef = useRef(new Set<(selection: BoardSelection) => void>());
  const documentListenersRef = useRef(new Set<(yaml: string) => void>());
  const selectionRef = useRef<BoardSelection>({
    nodeIds: [],
    edgeId: null,
    boundaryId: null,
  });
  const onBoardReadyCalledRef = useRef(false);
  const loadYamlTextRef = useRef(loadYamlText);
  const [connectFrom, setConnectFrom] = useState<{
    nodeId: string;
    portId?: string;
  } | null>(null);
  /** World-space cursor while a connect draft is active (rubber-band preview). */
  const [connectCursor, setConnectCursor] = useState<Point | null>(null);
  const boardClipboard = useRef<
    | { kind: "element"; id: string }
    | { kind: "boundary"; id: string }
    | null
  >(null);
  const [yamlDragDepth, setYamlDragDepth] = useState(0);
  const [renameModal, setRenameModal] = useState<{ nodeId: string; value: string } | null>(null);
  const [boundaryRenameModal, setBoundaryRenameModal] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ nodeId: string } | null>(null);
  const [diagramNameModal, setDiagramNameModal] = useState<{ value: string } | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{ value: string } | null>(null);
  const [newBoardModal, setNewBoardModal] = useState<"confirm" | "name" | null>(null);
  const [newBoardName, setNewBoardName] = useState("Untitled System");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1200, h: 800 });
  /** Last pointer over diagram content (not chrome overlays). Used by +/- zoom. */
  const lastPointerOnCanvas = useRef<Point | null>(null);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);

  const applyViewport = useCallback((nextZoom: number, nextPan: Point) => {
    zoomRef.current = nextZoom;
    panRef.current = nextPan;
    setZoom(nextZoom);
    setPan(nextPan);
  }, []);

  const loadYamlFromFile = useCallback(
    async (file: File) => {
      if (!isScanFile(file)) {
        toast.error("Drop a .scan, .yaml, or .yml architecture file");
        return;
      }
      try {
        await importYamlFile(file);
        setSelected(null);
        setSelectedEdge(null);
        setConnectFrom(null);
        toast.success(`Loaded ${file.name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid SCAN YAML";
        toast.error("Could not import YAML", { description: message });
      }
    },
    [importYamlFile],
  );
  const dragging = useRef<{
    id: string;
    ids: string[];
    ox: number;
    oy: number;
    starts: Record<string, { x: number; y: number }>;
  } | null>(null);
  const resizingBoundary = useRef<{
    id: string;
    handle: ResizeHandle;
    start: { x: number; y: number; w: number; h: number };
    origin: Point;
  } | null>(null);
  const movingBoundary = useRef<{
    id: string;
    ids: string[];
    ox: number;
    oy: number;
    starts: Record<string, { x: number; y: number }>;
  } | null>(null);
  const panning = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null);

  const saveYaml = useCallback(async () => {
    if (onSaveDocument) {
      try {
        // Serialize without clearing dirty state. The board is marked saved
        // only when the host confirms that persistence succeeded.
        const saved = await onSaveDocument(modeler.peekYAML());
        if (saved) modeler.saveYAML();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Save failed";
        toast.error("Could not save", { description: message });
      }
      return;
    }

    try {
      const result = await downloadYaml();
      if (!result) return;
      onLocalSave?.(result);
      toast.success("Board saved", {
        description: result.connected
          ? `Saved to disk as ${result.filename}`
          : `Downloaded ${result.filename}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error("Could not save YAML", { description: message });
    }
  }, [downloadYaml, onLocalSave, onSaveDocument, modeler]);

  // Always writes a local .scan.yaml file, regardless of host persistence —
  // distinct from Save, which goes to the host (cloud/local-store) when configured.
  const downloadYamlCopy = useCallback(async () => {
    try {
      const result = await downloadYaml();
      if (!result) return;
      toast.success(
        result.connected ? `Saved to disk as ${result.filename}` : `Downloaded ${result.filename}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      toast.error("Could not download YAML", { description: message });
    }
  }, [downloadYaml]);

  // Keyboard: undo/redo, save, delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveYaml();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (!selected && !selectedBoundary) return;
        e.preventDefault();
        try {
          if (selectedBoundary) {
            const id = duplicateBoundary(selectedBoundary);
            setSelectedBoundary(id);
            setSelected(null);
            setSelectedEdge(null);
            toast.success("Boundary duplicated");
          } else if (selected) {
            const id = duplicateElement(selected);
            setSelected(id);
            setSelectedEdge(null);
            setSelectedBoundary(null);
            toast.success("Duplicated");
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Duplicate failed";
          toast.error("Could not duplicate", { description: message });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedBoundary) {
          e.preventDefault();
          boardClipboard.current = { kind: "boundary", id: selectedBoundary };
          toast.message("Boundary copied", { description: "Ctrl/⌘+V to paste" });
        } else if (selected) {
          e.preventDefault();
          boardClipboard.current = { kind: "element", id: selected };
          toast.message("Copied", { description: "Ctrl/⌘+V to paste" });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        const clip = boardClipboard.current;
        if (!clip) return;
        e.preventDefault();
        try {
          if (clip.kind === "boundary") {
            const id = duplicateBoundary(clip.id);
            setSelectedBoundary(id);
            setSelected(null);
            setSelectedEdge(null);
            toast.success("Boundary pasted");
          } else {
            const id = duplicateElement(clip.id);
            setSelected(id);
            setSelectedBoundary(null);
            setSelectedEdge(null);
            toast.success("Pasted");
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Paste failed";
          toast.error("Could not paste", { description: message });
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") ||
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        const nodeIds = [
          ...new Set([
            ...(selected ? [selected] : []),
            ...selectedExtras,
          ]),
        ];
        const boundaryIds = [
          ...new Set([
            ...(selectedBoundary ? [selectedBoundary] : []),
            ...selectedBoundaryExtras,
          ]),
        ];
        if (nodeIds.length) {
          e.preventDefault();
          for (const id of nodeIds) {
            try {
              deleteElement(id);
            } catch {
              /* continue */
            }
          }
          setSelected(null);
          setSelectedExtras([]);
        } else if (boundaryIds.length) {
          e.preventDefault();
          try {
            for (const id of boundaryIds) {
              deleteBoundary(id);
            }
            setSelectedBoundary(null);
            setSelectedBoundaryExtras([]);
            toast.success(
              boundaryIds.length === 1
                ? "Boundary deleted"
                : `${boundaryIds.length} boundaries deleted`,
            );
          } catch (err) {
            const message = err instanceof Error ? err.message : "Delete failed";
            toast.error("Could not delete boundary", { description: message });
          }
        } else if (selectedEdge) {
          e.preventDefault();
          board.deleteConnection(selectedEdge);
          setSelectedEdge(null);
        }
      }
      if (e.key === "F2") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (selectedBoundary) {
          e.preventDefault();
          const g = groups.find((x) => x.id === selectedBoundary);
          if (g) setBoundaryRenameModal({ id: g.id, value: g.title });
        } else if (selected) {
          e.preventDefault();
          const current = nodes.find((n) => n.id === selected)?.title ?? "";
          setRenameModal({ nodeId: selected, value: current });
        }
      }
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "f"
      ) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setTool((current) => {
          if (current === "fast") {
            setFastDraft(null);
            setConnectFrom(null);
            setConnectCursor(null);
            toast.message("Fast design off");
            return "select";
          }
          toast.message("Fast design on — see legend (left)");
          return "fast";
        });
      }
      if (e.key === "Escape") {
        setCtxMenu(null);
        if (tool === "connect") {
          setConnectFrom(null);
          setConnectCursor(null);
          setTool("select");
          toast.message(connectFrom ? "Connect cancelled" : "Connect mode off");
        } else if (tool === "fast") {
          if (fastDraft) {
            setFastDraft(null);
            toast.message("Draw cancelled");
          } else if (connectFrom) {
            setConnectFrom(null);
            setConnectCursor(null);
            toast.message("Connect cancelled");
          } else {
            setTool("select");
            toast.message("Fast design off");
          }
        } else if (tool === "create" || tool === "boundary") {
          setTool("select");
          toast.message("Place cancelled");
        } else {
          setConnectFrom(null);
          setConnectCursor(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    undo,
    redo,
    selected,
    selectedExtras,
    selectedEdge,
    selectedBoundary,
    selectedBoundaryExtras,
    deleteElement,
    deleteBoundary,
    duplicateElement,
    duplicateBoundary,
    board,
    connectFrom,
    saveYaml,
    tool,
    fastDraft,
    groups,
    nodes,
  ]);

  useEffect(() => {
    if (tool !== "connect" && tool !== "fast") {
      setConnectFrom(null);
      setConnectCursor(null);
    }
    if (tool !== "fast") {
      setFastDraft(null);
    }
  }, [tool]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // The modeler mutates its model in place, so `model` retains the same object
  // identity across commands. `historyStep` changes for each command and makes
  // this notification fire reliably without inventing another event channel.
  // Do not depend on `onDocumentChange` identity — hosts often recreate that
  // callback each render; notifying listeners on identity churn caused update loops.
  const onDocumentChangeRef = useRef(onDocumentChange);
  onDocumentChangeRef.current = onDocumentChange;
  const onSystemIdentityChangeRef = useRef(onSystemIdentityChange);
  onSystemIdentityChangeRef.current = onSystemIdentityChange;

  const emitSystemIdentityChange = useCallback((change: SystemIdentityChange) => {
    onSystemIdentityChangeRef.current?.(change);
  }, []);

  const commitRenameDiagram = useCallback(
    (name: string) => {
      const fromSystemId = modeler.getModel()?.system.id ?? null;
      renameSystem(name);
      const yaml = modeler.peekYAML();
      const toSystemId = modeler.getModel()?.system.id ?? "";
      emitSystemIdentityChange({
        reason: "rename",
        fromSystemId,
        toSystemId,
        yaml,
      });
    },
    [emitSystemIdentityChange, modeler, renameSystem],
  );

  const commitDuplicateDiagram = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("System name cannot be empty");
      const fromSystemId = modeler.getModel()?.system.id ?? null;
      const model = parseScanYaml(modeler.peekYAML());
      let toSystemId = slugifyId(trimmed);
      if (fromSystemId && toSystemId === fromSystemId) {
        toSystemId = `${toSystemId}-copy`;
      }
      model.system.name = trimmed;
      model.system.id = toSystemId;
      const yaml = serializeSphereYaml(model);
      await loadYamlText(yaml);
      emitSystemIdentityChange({
        reason: "duplicate",
        fromSystemId,
        toSystemId,
        yaml,
      });
    },
    [emitSystemIdentityChange, loadYamlText, modeler],
  );

  useEffect(() => {
    if (!model || !ready) return;
    const yaml = modeler.peekYAML();
    // Always notify the host (Sphere draft / autosave), including clean imports —
    // gating on `dirty` left localStorage on the previous document after Import YAML.
    onDocumentChangeRef.current?.(yaml);
    for (const listener of documentListenersRef.current) listener(yaml);
  }, [historyStep, model, dirty, ready, modeler]);

  const onYamlLoadErrorRef = useRef(onYamlLoadError);
  onYamlLoadErrorRef.current = onYamlLoadError;

  const safeLoadYamlText = useCallback(
    async (yaml: string) => {
      try {
        await loadYamlText(yaml);
      } catch (cause) {
        const err = cause instanceof Error ? cause : new Error(String(cause));
        onYamlLoadErrorRef.current?.(err, yaml);
        // Do not rethrow — host surfaces Fix UI; avoid unhandled rejection in Vite.
      }
    },
    [loadYamlText],
  );
  loadYamlTextRef.current = safeLoadYamlText;

  const loadedYamlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !initialYaml) return;
    if (loadedYamlRef.current === initialYaml) return;
    loadedYamlRef.current = initialYaml;
    void safeLoadYamlText(initialYaml);
  }, [ready, initialYaml, safeLoadYamlText]);

  const appliedYamlNonceRef = useRef(0);
  useEffect(() => {
    if (!ready || !applyYaml?.trim()) return;
    if (applyYamlNonce === appliedYamlNonceRef.current) return;
    appliedYamlNonceRef.current = applyYamlNonce;
    void safeLoadYamlText(applyYaml);
  }, [ready, applyYaml, applyYamlNonce, safeLoadYamlText]);

  const mergedYamlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !pendingMergeYaml) return;
    if (mergedYamlRef.current === pendingMergeYaml) return;
    mergedYamlRef.current = pendingMergeYaml;
    void mergeYamlText(pendingMergeYaml).then(() => onMergeApplied?.());
  }, [ready, pendingMergeYaml, mergeYamlText, onMergeApplied]);

  useEffect(() => {
    if (!warnOnUnload) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, warnOnUnload]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setCanvasSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displayNodes = useMemo(() => {
    if (architectureWarningsProp === undefined) return nodes;
    const msgById = new Map(
      architectureWarningsProp.map((w) => [w.id, w.message] as const),
    );
    return nodes.map((n) => {
      const msg = msgById.get(n.id);
      if (msg) {
        return { ...n, status: "warn" as const, warn: msg };
      }
      if (n.status === "warn" || n.warn) {
        return { ...n, status: undefined, warn: undefined };
      }
      return n;
    });
  }, [nodes, architectureWarningsProp]);

  const nodeById = useMemo(
    () => Object.fromEntries(displayNodes.map((n) => [n.id, n])),
    [displayNodes],
  );

  const architectureWarnings = useMemo((): ArchitectureWarning[] => {
    if (architectureWarningsProp !== undefined) return architectureWarningsProp;
    const byId = new Map<string, ArchitectureWarning>();
    for (const n of displayNodes) {
      if (n.status === "warn" || n.warn) {
        byId.set(n.id, {
          id: n.id,
          title: n.title,
          message: n.warn ?? "Validation warning",
        });
      }
    }
    return [...byId.values()];
  }, [architectureWarningsProp, displayNodes]);

  const selectedNodeIds = useMemo(() => {
    const ids = new Set(selectedExtras);
    if (selected) ids.add(selected);
    return [...ids];
  }, [selected, selectedExtras]);

  const selectedBoundaryIds = useMemo(() => {
    const ids = new Set(selectedBoundaryExtras);
    if (selectedBoundary) ids.add(selectedBoundary);
    return [...ids];
  }, [selectedBoundary, selectedBoundaryExtras]);

  const selectionCount = selectedNodeIds.length + selectedBoundaryIds.length;

  useEffect(() => {
    const next: BoardSelection = {
      nodeIds: selectedNodeIds,
      edgeId: selectedEdge,
      boundaryId: selectedBoundary,
    };
    selectionRef.current = next;
    for (const listener of selectionListenersRef.current) listener(next);
  }, [selectedNodeIds, selectedEdge, selectedBoundary]);

  useEffect(() => {
    if (!ready || onBoardReadyCalledRef.current) return;
    onBoardReadyCalledRef.current = true;
    const api: BoardHostApi = {
      peekYaml: () => modeler.peekYAML(),
      // Always call through the latest loadYamlText (avoids stale closures after HMR / modeler swap).
      loadYaml: (yaml) => loadYamlTextRef.current(yaml),
      getSelection: () => selectionRef.current,
      subscribeSelection: (listener) => {
        selectionListenersRef.current.add(listener);
        listener(selectionRef.current);
        return () => {
          selectionListenersRef.current.delete(listener);
        };
      },
      subscribeDocument: (listener) => {
        documentListenersRef.current.add(listener);
        return () => {
          documentListenersRef.current.delete(listener);
        };
      },
    };
    onBoardReady?.(api);
  }, [ready, onBoardReady, modeler, loadYamlText]);

  const focusIds = useMemo(() => {
    if (!focusMode) return null;
    // While wiring, keep every component fully visible — focus dimming hides valid targets.
    if (tool === "connect" || tool === "fast" || connectFrom) return null;
    const seed = new Set<string>();
    for (const id of selectedNodeIds) seed.add(id);
    if (selectedEdge) {
      const e = edges.find((x) => x.id === selectedEdge);
      if (e) {
        seed.add(e.from);
        seed.add(e.to);
      }
    }
    if (hoverEdge) {
      const e = edges.find((x) => x.id === hoverEdge);
      if (e) {
        seed.add(e.from);
        seed.add(e.to);
      }
    }
    if (!seed.size) return null;
    const hop = new Set(seed);
    for (const e of edges) {
      if (seed.has(e.from) || seed.has(e.to)) {
        hop.add(e.from);
        hop.add(e.to);
      }
    }
    return hop;
  }, [focusMode, selectedNodeIds, selectedEdge, hoverEdge, edges, tool, connectFrom]);

  const edgeFanById = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of edges) {
      const key = `${e.from}->${e.to}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const seen = new Map<string, number>();
    const out = new Map<string, { index: number; count: number }>();
    for (const e of edges) {
      const key = `${e.from}->${e.to}`;
      const index = seen.get(key) ?? 0;
      seen.set(key, index + 1);
      out.set(e.id, { index, count: counts.get(key) ?? 1 });
    }
    return out;
  }, [edges]);

  /** Direction-based edge anchors (shared by curved + orthogonal). */
  const edgeAnchorsById = useMemo(() => {
    const out = new Map<
      string,
      { a: Point; b: Point; fromSide: "l" | "r" | "t" | "b"; toSide: "l" | "r" | "t" | "b" }
    >();
    for (const e of edges) {
      const from = nodeById[e.from];
      const to = nodeById[e.to];
      if (!from || !to) continue;
      const fromBox = { x: from.x, y: from.y, w: from.w, h: from.h };
      const toBox = { x: to.x, y: to.y, w: to.w, h: to.h };
      if (orthogonalEdges && e.waypoints?.length) {
        const resolved = resolveAnchorsFromWaypoints(
          fromBox,
          toBox,
          e.waypoints,
          e.fromSide,
          e.toSide,
        );
        out.set(e.id, {
          a: resolved.a,
          b: resolved.b,
          fromSide: resolved.fromSide,
          toSide: resolved.toSide,
        });
        continue;
      }
      const fan = edgeFanById.get(e.id);
      out.set(
        e.id,
        resolveEdgeAnchors(fromBox, toBox, fan?.index ?? 0, fan?.count ?? 1),
      );
    }
    return out;
  }, [edges, nodeById, edgeFanById, orthogonalEdges]);

  const edgeLabelPositions = useMemo(() => {
    const boxes = nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h }));
    const routeMode = orthogonalEdges ? "orthogonal" : "bezier";
    const routed = edges
      .map((e) => {
        const from = nodeById[e.from];
        const to = nodeById[e.to];
        if (!from || !to) return null;
        const fan = edgeFanById.get(e.id);
        return {
          id: e.id,
          from: { x: from.x, y: from.y, w: from.w, h: from.h },
          to: { x: to.x, y: to.y, w: to.w, h: to.h },
          fanIndex: fan?.index ?? 0,
          fanCount: fan?.count ?? 1,
        };
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
    const lanes = orthogonalEdges ? assignOrthogonalLanes(routed) : new Map<string, number>();
    const rough: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
    for (const e of edges) {
      if (!e.label) continue;
      const anchors = edgeAnchorsById.get(e.id);
      const from = nodeById[e.from];
      const to = nodeById[e.to];
      if (!anchors || !from || !to) continue;
      const size = estimateEdgeLabelSize(e.label, e.contract);
      const p = placeEdgeLabel({
        a: anchors.a,
        b: anchors.b,
        aSide: anchors.fromSide,
        bSide: anchors.toSide,
        nodes: boxes,
        mode: routeMode,
        fromBox: from,
        toBox: to,
        fanIndex: edgeFanById.get(e.id)?.index,
        fanCount: edgeFanById.get(e.id)?.count,
        laneOffset: lanes.get(e.id),
        labelW: size.w,
        labelH: size.h,
      });
      rough.push({ id: e.id, x: p.x, y: p.y, w: size.w, h: size.h });
    }
    // AABB deconfliction so chips (Stream/AsyncAPI, etc.) never sit on top of each other.
    return resolveLabelOverlaps(rough, { gap: 10 });
  }, [edges, nodes, nodeById, orthogonalEdges, edgeAnchorsById, edgeFanById]);

  const orthogonalEdgePaths = useMemo(() => {
    if (!orthogonalEdges) return null;
    const routed = edges
      .map((e) => {
        const from = nodeById[e.from];
        const to = nodeById[e.to];
        if (!from || !to) return null;
        const fan = edgeFanById.get(e.id);
        return {
          id: e.id,
          from: { x: from.x, y: from.y, w: from.w, h: from.h },
          to: { x: to.x, y: to.y, w: to.w, h: to.h },
          fanIndex: fan?.index ?? 0,
          fanCount: fan?.count ?? 1,
          waypoints: e.waypoints,
          aSide: e.fromSide,
          bSide: e.toSide,
        };
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
    return routeOrthogonalEdges(routed);
  }, [orthogonalEdges, edges, nodeById, edgeFanById]);

  const orthogonalPolylines = useMemo(() => {
    if (!orthogonalEdges) return null;
    const routed = edges
      .map((e) => {
        const from = nodeById[e.from];
        const to = nodeById[e.to];
        if (!from || !to) return null;
        const fan = edgeFanById.get(e.id);
        return {
          id: e.id,
          from: { x: from.x, y: from.y, w: from.w, h: from.h },
          to: { x: to.x, y: to.y, w: to.w, h: to.h },
          fanIndex: fan?.index ?? 0,
          fanCount: fan?.count ?? 1,
          waypoints: e.waypoints,
          aSide: e.fromSide,
          bSide: e.toSide,
        };
      })
      .filter((e): e is NonNullable<typeof e> => Boolean(e));
    return routeOrthogonalPolylines(routed);
  }, [orthogonalEdges, edges, nodeById, edgeFanById]);

  const [routeDrag, setRouteDrag] = useState<{
    edgeId: string;
    /** Segment start index: handle sits on points[i]→points[i+1]. */
    segmentIndex: number;
    /** `x` = vertical segment (drag left/right); `y` = horizontal (drag up/down). */
    axis: "x" | "y";
    points: Array<{ x: number; y: number }>;
    fromBox: { x: number; y: number; w: number; h: number };
    toBox: { x: number; y: number; w: number; h: number };
    fromSide?: "l" | "r" | "t" | "b";
    toSide?: "l" | "r" | "t" | "b";
  } | null>(null);
  const dimmed = useCallback(
    (n: SphereNode) => {
      if (view === "external" && n.kind !== "external" && n.kind !== "service") return true;
      if (view === "contracts" && !(n.consumes?.length || n.exposes?.length)) return true;
      if (view === "agents" && n.kind !== "agent" && n.kind !== "repo") return true;
      if (focusIds && !focusIds.has(n.id)) return true;
      return false;
    },
    [view, focusIds],
  );

  const edgeDimmed = useCallback(
    (e: SphereEdge) => {
      if (!focusIds) return false;
      return !(focusIds.has(e.from) && focusIds.has(e.to));
    },
    [focusIds],
  );

  const clientToWorld = (cx: number, cy: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const rx = rect?.left ?? 0;
    const ry = rect?.top ?? 0;
    const z = zoomRef.current;
    const p = panRef.current;
    return { x: (cx - rx - p.x) / z, y: (cy - ry - p.y) / z };
  };

  const startDrag = (e: PointerEvent, id: string) => {
    if (tool === "connect" || tool === "fast") {
      e.stopPropagation();
      // Node body: port-less / fallback node->node wire
      if (!connectFrom) {
        setConnectFrom({ nodeId: id });
        setConnectCursor(clientToWorld(e.clientX, e.clientY));
        setSelected(id);
        setSelectedExtras([]);
        setSelectedBoundaryExtras([]);
        setSelectedEdge(null);
        setSelectedBoundary(null);
      } else if (connectFrom.nodeId !== id) {
        try {
          connect(connectFrom.nodeId, id, {
            fromPort: connectFrom.portId,
          });
          toast.success(
            connectFrom.portId ? "Port connection created" : "Connection created",
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connection not allowed";
          toast.error("Cannot connect", { description: message });
        }
        setConnectFrom(null);
        setConnectCursor(null);
        if (tool === "connect") setTool("select");
      }
      return;
    }
    if (tool !== "select") return;
    e.stopPropagation();

    const additive = e.ctrlKey || e.metaKey;
    if (additive) {
      e.preventDefault();
      setSelectedEdge(null);
      setSelectedBoundary(null);
      setSelectedBoundaryExtras([]);
      const current = new Set(selectedExtras);
      if (selected) current.add(selected);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      const next = [...current];
      setSelected(next.length ? next[next.length - 1]! : null);
      setSelectedExtras(next.length > 1 ? next.slice(0, -1) : []);
      return;
    }

    const alreadyMulti =
      selectedNodeIds.includes(id) && selectedNodeIds.length > 1;
    if (!alreadyMulti) {
      setSelected(id);
      setSelectedExtras([]);
      setSelectedBoundaryExtras([]);
      setSelectedBoundary(null);
      setSelectedEdge(null);
    } else {
      setSelectedBoundary(null);
      setSelectedBoundaryExtras([]);
      setSelectedEdge(null);
    }

    const moveIds = alreadyMulti ? selectedNodeIds : [id];
    const n = nodeById[id];
    if (!n) return;
    const w = clientToWorld(e.clientX, e.clientY);
    const starts: Record<string, { x: number; y: number }> = {};
    for (const moveId of moveIds) {
      const node = nodeById[moveId];
      if (node) starts[moveId] = { x: node.x, y: node.y };
    }
    dragging.current = {
      id,
      ids: moveIds,
      ox: w.x - n.x,
      oy: w.y - n.y,
      starts,
    };
    beginDrag(moveIds);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPortConnect = (nodeId: string, portId: string, role: "expose" | "consume") => {
    // Ports are always interactive: start/finish wiring without requiring the Connect tool first.
    if (!connectFrom) {
      if (role === "expose") {
        if (tool !== "fast") setTool("connect");
        setConnectFrom({ nodeId, portId });
        setConnectCursor(null);
        setSelected(nodeId);
        setSelectedEdge(null);
        setSelectedBoundary(null);
        return;
      }
      // Consume click with no source: select an existing wire into this port, if any.
      const hits = edges.filter((e) => e.to === nodeId && e.toPort === portId);
      if (hits.length) {
        setSelectedEdge(hits[0].id);
        setSelected(null);
        setSelectedBoundary(null);
        return;
      }
      toast.message("Start from an expose port", {
        description: "Click a filled Exposes port, then a Consumes port to wire them.",
      });
      return;
    }
    if (role !== "consume") {
      // Allow re-picking the source expose port
      if (role === "expose") {
        setConnectFrom({ nodeId, portId });
        setSelected(nodeId);
        setSelectedEdge(null);
        toast.message("Source updated", { description: "Now click a consume port to finish" });
        return;
      }
      toast.error("Finish on a consume port", {
        description: "Target should be an open (consume) port on another node.",
      });
      return;
    }
    if (connectFrom.nodeId === nodeId) {
      toast.error("Cannot connect a node to itself");
      return;
    }
    if (!connectFrom.portId) {
      try {
        connect(connectFrom.nodeId, nodeId, { toPort: portId });
        toast.success("Port connection created");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Connection not allowed";
        toast.error("Cannot connect", { description: message });
      }
      setConnectFrom(null);
      setConnectCursor(null);
      if (tool !== "fast") setTool("select");
      return;
    }
    try {
      connect(connectFrom.nodeId, nodeId, {
        fromPort: connectFrom.portId,
        toPort: portId,
      });
      toast.success("Port connection created");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection not allowed";
      toast.error("Cannot connect", { description: message });
    }
    setConnectFrom(null);
    setConnectCursor(null);
    if (tool !== "fast") setTool("select");
  };

  const startBoundaryResize = (
    e: PointerEvent,
    id: string,
    handle: ResizeHandle,
  ) => {
    if (tool !== "select") return;
    e.stopPropagation();
    e.preventDefault();
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    setSelectedBoundary(id);
    setSelected(null);
    setSelectedEdge(null);
    movingBoundary.current = null;
    const origin = clientToWorld(e.clientX, e.clientY);
    resizingBoundary.current = {
      id,
      handle,
      start: { x: g.x, y: g.y, w: g.w, h: g.h },
      origin,
    };
    beginBoundaryResize(id);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const startBoundaryMove = (e: PointerEvent, id: string) => {
    if (tool !== "select" || e.button !== 0) return;
    e.stopPropagation();
    const g = groups.find((x) => x.id === id);
    if (!g) return;

    const additive = e.ctrlKey || e.metaKey;
    if (additive) {
      e.preventDefault();
      setSelectedEdge(null);
      setSelected(null);
      setSelectedExtras([]);
      const current = new Set(selectedBoundaryExtras);
      if (selectedBoundary) current.add(selectedBoundary);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      const next = [...current];
      setSelectedBoundary(next.length ? next[next.length - 1]! : null);
      setSelectedBoundaryExtras(next.length > 1 ? next.slice(0, -1) : []);
      return;
    }

    const alreadyMulti =
      selectedBoundaryIds.includes(id) && selectedBoundaryIds.length > 1;
    if (!alreadyMulti) {
      setSelectedBoundary(id);
      setSelectedBoundaryExtras([]);
      setSelected(null);
      setSelectedExtras([]);
      setSelectedEdge(null);
    } else {
      setSelected(null);
      setSelectedExtras([]);
      setSelectedEdge(null);
    }

    const moveIds = alreadyMulti ? selectedBoundaryIds : [id];
    const w = clientToWorld(e.clientX, e.clientY);
    const starts: Record<string, { x: number; y: number }> = {};
    for (const moveId of moveIds) {
      const group = groups.find((x) => x.id === moveId);
      if (group) starts[moveId] = { x: group.x, y: group.y };
    }
    movingBoundary.current = {
      id,
      ids: moveIds,
      ox: w.x - g.x,
      oy: w.y - g.y,
      starts,
    };
    beginBoundaryMove(moveIds);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const overChrome = (e.target as Element | null)?.closest?.("[data-canvas-chrome]");
    if (rect && !overChrome) {
      lastPointerOnCanvas.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    if (fastDraft) {
      const w = clientToWorld(e.clientX, e.clientY);
      setFastDraft((d) => (d ? { ...d, x1: w.x, y1: w.y } : d));
      return;
    }
    if (connectFrom) {
      setConnectCursor(clientToWorld(e.clientX, e.clientY));
    }
    if (resizingBoundary.current) {
      const r = resizingBoundary.current;
      const w = clientToWorld(e.clientX, e.clientY);
      const dx = w.x - r.origin.x;
      const dy = w.y - r.origin.y;
      previewBoundaryResize(r.id, applyBoundaryResize(r.start, r.handle, dx, dy));
      return;
    }
    if (movingBoundary.current) {
      const m = movingBoundary.current;
      const w = clientToWorld(e.clientX, e.clientY);
      const anchorStart = m.starts[m.id];
      if (!anchorStart) return;
      const nx = Math.round((w.x - m.ox) / 4) * 4;
      const ny = Math.round((w.y - m.oy) / 4) * 4;
      const dx = nx - anchorStart.x;
      const dy = ny - anchorStart.y;
      previewBoundaryMove(
        m.ids.map((bid) => {
          const s = m.starts[bid] ?? anchorStart;
          return { id: bid, x: s.x + dx, y: s.y + dy };
        }),
      );
      return;
    }
    if (routeDrag) {
      const w = clientToWorld(e.clientX, e.clientY);
      setRouteDrag((prev) => {
        if (!prev) return null;
        const points = prev.points.map((p) => ({ x: p.x, y: p.y }));
        const i = prev.segmentIndex;
        if (i < 0 || i >= points.length - 1) return prev;
        if (prev.axis === "x") {
          const x = Math.round(w.x / 4) * 4;
          points[i] = { ...points[i]!, x };
          points[i + 1] = { ...points[i + 1]!, x };
        } else {
          const y = Math.round(w.y / 4) * 4;
          points[i] = { ...points[i]!, y };
          points[i + 1] = { ...points[i + 1]!, y };
        }
        // Slide node attachments so stubs stay horizontal/vertical only.
        const clamped = clampOrthogonalRouteEnds(
          points,
          prev.fromBox,
          prev.toBox,
          prev.fromSide,
          prev.toSide,
        );
        return { ...prev, points: clamped };
      });
      return;
    }
    if (dragging.current) {
      const d = dragging.current;
      const w = clientToWorld(e.clientX, e.clientY);
      const anchorStart = d.starts[d.id];
      if (!anchorStart) return;
      const nx = Math.round((w.x - d.ox) / 4) * 4;
      const ny = Math.round((w.y - d.oy) / 4) * 4;
      const dx = nx - anchorStart.x;
      const dy = ny - anchorStart.y;
      setNodesPreview((prev) =>
        prev.map((n) => {
          const s = d.starts[n.id];
          if (!s) return n;
          return { ...n, x: s.x + dx, y: s.y + dy };
        }),
      );
    }
    if (panning.current) {
      const p = panning.current;
      const next = { x: p.px + (e.clientX - p.sx), y: p.py + (e.clientY - p.sy) };
      panRef.current = next;
      setPan(next);
    }
  };

  const commitFastDraft = useCallback(
    (draft: { x0: number; y0: number; x1: number; y1: number }) => {
      const { x, y, w, h } = normalizeDraftRect(draft);
      const kind = classifyFastDraft(w, h);

      if (kind === "click" || kind === "component") {
        const id = createElement(
          createKind,
          kind === "click" ? snap4(draft.x0) : snap4(x),
          kind === "click" ? snap4(draft.y0) : snap4(y),
        );
        setSelected(id);
        setSelectedEdge(null);
        setSelectedBoundary(null);
        toast.success(`${createKindHints[createKind].label} added`, {
          description:
            kind === "click"
              ? "Click another component to connect · thin box → Datastore · large box → boundary"
              : `Thin (short ≤${FAST_THIN_MAX_SHORT}px) → Datastore · ≥${FAST_BOUNDARY_MIN_W}×${FAST_BOUNDARY_MIN_H} → boundary`,
        });
        return;
      }

      if (kind === "datastore") {
        const id = createElement("datastore", snap4(x), snap4(y));
        setSelected(id);
        setSelectedEdge(null);
        setSelectedBoundary(null);
        toast.success("Datastore added", {
          description: "Thin box gesture · click components to connect",
        });
        return;
      }

      try {
        const id = createBoundary(boundaryKind, {
          x: snap4(x),
          y: snap4(y),
          w: snap4(w),
          h: snap4(h),
        });
        setSelectedBoundary(id);
        setSelected(null);
        setSelectedEdge(null);
        toast.success(
          boundaryKind === "trust" ? "Trust boundary added" : "Runtime boundary added",
          { description: "Drag another box or click components to connect" },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create boundary";
        toast.error("Boundary failed", { description: message });
      }
    },
    [boundaryKind, createBoundary, createElement, createKind],
  );

  const onPointerUp = (e: PointerEvent) => {
    if (fastDraft) {
      const w = clientToWorld(e.clientX, e.clientY);
      const draft = { ...fastDraft, x1: w.x, y1: w.y };
      setFastDraft(null);
      commitFastDraft(draft);
    }
    if (resizingBoundary.current) {
      endBoundaryResize();
      resizingBoundary.current = null;
    }
    if (movingBoundary.current) {
      endBoundaryMove();
      movingBoundary.current = null;
    }
    if (routeDrag) {
      const pts = routeDrag.points;
      const waypoints = pts.slice(1, -1).map((p) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      }));
      const fromSide = sideFacingPoint(routeDrag.fromBox, pts[1] ?? pts[0]!, routeDrag.fromSide);
      const toSide = sideFacingPoint(
        routeDrag.toBox,
        pts[pts.length - 2] ?? pts[pts.length - 1]!,
        routeDrag.toSide,
      );
      try {
        board.updateConnectionRoute(
          routeDrag.edgeId,
          waypoints.length ? waypoints : null,
          { fromSide, toSide },
        );
      } catch (err) {
        toast.error("Could not update route", {
          description: err instanceof Error ? err.message : "Update failed",
        });
      }
      setRouteDrag(null);
    }
    if (dragging.current) {
      endDrag();
    }
    dragging.current = null;
    panning.current = null;
  };

  const onCanvasPointerDown = (e: PointerEvent) => {
    if (tool === "fast" && e.button === 0) {
      // Empty-canvas sketch: click → component, drag box → boundary.
      // Node clicks are handled in startDrag / ports and stopPropagation.
      const w = clientToWorld(e.clientX, e.clientY);
      setSelected(null);
      setSelectedExtras([]);
      setSelectedBoundary(null);
      setSelectedBoundaryExtras([]);
      setSelectedEdge(null);
      setCtxMenu(null);
      if (connectFrom) {
        setConnectFrom(null);
        setConnectCursor(null);
      }
      setFastDraft({ x0: w.x, y0: w.y, x1: w.x, y1: w.y });
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      return;
    }
    if (tool === "create" && e.button === 0) {
      const w = clientToWorld(e.clientX, e.clientY);
      const id = createElement(createKind, snap4(w.x), snap4(w.y));
      setSelected(id);
      setSelectedEdge(null);
      setSelectedBoundary(null);
      setTool("select");
      toast.success(`${createKindHints[createKind].label} added`, {
        description: "Inspect details on the right - connect via ports or Connect tool",
      });
      return;
    }
    if (tool === "boundary" && e.button === 0) {
      const w = clientToWorld(e.clientX, e.clientY);
      const bw = 480;
      const bh = 320;
      const x = snap4(w.x - bw / 2);
      const y = snap4(w.y - bh / 2);
      try {
        const id = createBoundary(boundaryKind, { x, y, w: bw, h: bh });
        setSelectedBoundary(id);
        setSelected(null);
        setSelectedEdge(null);
        setTool("select");
        toast.success(
          boundaryKind === "trust" ? "Trust boundary added" : "Runtime boundary added",
          { description: "Drag edges to resize - rename in the inspector (F2)" },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create boundary";
        toast.error("Boundary failed", { description: message });
      }
      return;
    }
    if (e.button === 1 || tool === "pan" || e.altKey || e.button === 2) {
      panning.current = {
        sx: e.clientX,
        sy: e.clientY,
        px: panRef.current.x,
        py: panRef.current.y,
      };
    } else {
      setSelected(null);
      setSelectedExtras([]);
      setSelectedBoundary(null);
      setSelectedBoundaryExtras([]);
      setSelectedEdge(null);
      setCtxMenu(null);
      if (connectFrom || tool === "connect") {
        setConnectFrom(null);
        setConnectCursor(null);
        setTool("select");
      }
    }
  };

  /** Keep the world point under `anchor` (canvas-local px) fixed while changing zoom. */
  const zoomAround = useCallback(
    (anchor: Point, nextZoom: number) => {
      const z0 = zoomRef.current;
      const p0 = panRef.current;
      const z = Math.min(2, Math.max(0.3, nextZoom));
      if (z === z0) return;
      if (z0 === 0) {
        applyViewport(z, p0);
        return;
      }
      // screen = world * zoom + pan  (transform: translate(pan) scale(zoom), origin 0 0)
      const worldX = (anchor.x - p0.x) / z0;
      const worldY = (anchor.y - p0.y) / z0;
      applyViewport(z, {
        x: anchor.x - worldX * z,
        y: anchor.y - worldY * z,
      });
    },
    [applyViewport],
  );

  const zoomAt = useCallback(
    (nz: number, anchor?: Point | null) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const cx = anchor?.x ?? (rect?.width ?? 0) / 2;
      const cy = anchor?.y ?? (rect?.height ?? 0) / 2;
      zoomAround({ x: cx, y: cy }, nz);
    },
    [zoomAround],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const overChrome = (e.target as Element | null)?.closest?.("[data-canvas-chrome]");
      if (!overChrome) {
        lastPointerOnCanvas.current = { x: cx, y: cy };
      }

      // Trackpad pinch / ctrl+wheel: zoom toward cursor. Plain wheel pans.
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0015);
        zoomAround({ x: cx, y: cy }, zoomRef.current * factor);
        return;
      }
      const next = {
        x: panRef.current.x - e.deltaX,
        y: panRef.current.y - e.deltaY,
      };
      panRef.current = next;
      setPan(next);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomAround]);

  const zoomReset = () => {
    applyViewport(0.85, { x: 40, y: 20 });
  };

  const fitContent = useCallback(() => {
    const el = canvasRef.current;
    if (!el) {
      zoomReset();
      return;
    }
    const rect = el.getBoundingClientRect();
    const model = board.modeler.getModel();
    const view = model?.views[0];
    const layoutEntries = view ? Object.values(view.layout) : [];
    const boundaryBoxes = view?.boundaries ?? [];
    if (!layoutEntries.length && !boundaryBoxes.length) {
      zoomReset();
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of layoutEntries) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.w ?? 260));
      maxY = Math.max(maxY, n.y + (n.h ?? 180));
    }
    for (const g of boundaryBoxes) {
      minX = Math.min(minX, g.x);
      minY = Math.min(minY, g.y);
      maxX = Math.max(maxX, g.x + g.w);
      maxY = Math.max(maxY, g.y + g.h);
    }
    const pad = 64;
    const contentW = Math.max(1, maxX - minX + pad * 2);
    const contentH = Math.max(1, maxY - minY + pad * 2);
    const nextZoom = Math.max(
      0.35,
      Math.min(1, (rect.width - 24) / contentW, (rect.height - 24) / contentH),
    );
    const nextPan = {
      x: (rect.width - contentW * nextZoom) / 2 - (minX - pad) * nextZoom,
      y: (rect.height - contentH * nextZoom) / 2 - (minY - pad) * nextZoom,
    };
    applyViewport(nextZoom, nextPan);
  }, [applyViewport, board.modeler]);

  const runAutoLayout = useCallback(() => {
    try {
      autoLayout();
      requestAnimationFrame(() => fitContent());
      toast.success("Auto-layout applied", {
        description: "Components and boundaries rearranged - undo with Ctrl+Z",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Layout failed";
      toast.error("Auto-layout failed", { description: message });
    }
  }, [autoLayout, fitContent]);

  const zoomIn = () => zoomAt(zoomRef.current + 0.15, lastPointerOnCanvas.current);
  const zoomOut = () => zoomAt(zoomRef.current - 0.15, lastPointerOnCanvas.current);


  const openContextMenu = (e: MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(id);
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: id });
  };

  const handleNewBoard = useCallback(() => {
    if (dirty) {
      setNewBoardModal("confirm");
      return;
    }
    setNewBoardName("Untitled System");
    setNewBoardModal("name");
  }, [dirty]);

  const completeNewBoard = useCallback(
    async (name: string) => {
      try {
        await newBoard(name.trim() || "Untitled System");
        setSelected(null);
        setSelectedEdge(null);
        setConnectFrom(null);
        setCtxMenu(null);
        applyViewport(0.85, { x: 40, y: 20 });
        setNewBoardModal(null);
        toast.success("New board ready");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create board";
        toast.error("New board failed", { description: message });
      }
    },
    [newBoard, applyViewport],
  );

  const selNode = selected ? nodeById[selected] : null;
  const selEdge = selectedEdge ? edges.find((e) => e.id === selectedEdge) : null;
  const selBoundary = selectedBoundary
    ? groups.find((g) => g.id === selectedBoundary) ?? null
    : null;
  const systemName = board.model?.system.name ?? "Untitled System";

  return (
    <TooltipProvider delayDuration={250}>
    <div
      className={`relative flex flex-col overflow-hidden bg-background text-foreground ${
        fill === "parent" ? "h-full w-full min-h-0" : "h-screen w-screen"
      }`}
    >
      {/* TOP BAR */}
      <TopBar
        systemName={systemName}
        topBarBrand={topBarBrand}
        topBarBeforeTitle={topBarBeforeTitle}
        topBarAfterStatus={topBarAfterStatus}
        topBarAfterBrand={topBarAfterBrand}
        canUndo={canUndo}
        canRedo={canRedo}
        dirty={dirty}
        onUndo={undo}
        onRedo={redo}
        onNewBoard={() => handleNewBoard()}
        onRenameDiagram={() => setDiagramNameModal({ value: systemName })}
        onDuplicateDiagram={() =>
          setDuplicateModal({ value: `${systemName.replace(/\s+copy$/i, "").trim() || systemName} copy` })
        }
        onDownloadYaml={() => void saveYaml()}
        onDownloadCopy={() => void downloadYamlCopy()}
        onImportYaml={() => fileInputRef.current?.click()}
        onExportSvg={() => {
          const mode = orthogonalEdges ? "orthogonal" : "bezier";
          void exportSvg({ mode })
            .then((r) => toast.success("Exported SVG", { description: r.filename }))
            .catch((err) =>
              toast.error("SVG export failed", {
                description: err instanceof Error ? err.message : "Export failed",
              }),
            );
        }}
        onExportPng={() => {
          const mode = orthogonalEdges ? "orthogonal" : "bezier";
          void exportPng({ mode })
            .then((r) => toast.success("Exported PNG", { description: r.filename }))
            .catch((err) =>
              toast.error("PNG export failed", {
                description: err instanceof Error ? err.message : "Export failed",
              }),
            );
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".scan,.yaml,.yml,.scan.yaml,text/yaml,application/x-yaml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void loadYamlFromFile(file);
          e.target.value = "";
        }}
      />

      {renderBottomChrome?.()}

      {/* VIEW TABS - shared SCAN board chrome */}
      <ViewTabs
        view={view}
        setView={setView}
        onAutoLayout={() => runAutoLayout()}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((v) => !v)}
        nodes={displayNodes}
        groups={groups}
        endSlot={renderViewTabsEnd?.()}
      />

      <div className="flex min-h-0 flex-1">
      {renderLeftPanel?.()}

      {/* MAIN CANVAS */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {renderCanvasOverlay?.()}
        <div
          ref={canvasRef}
          className={`absolute inset-0 ${showGrid ? "dot-grid" : "bg-canvas"} ${
            tool === "pan"
              ? "cursor-grab"
              : tool === "connect" || tool === "fast"
                ? "cursor-crosshair"
                : "cursor-default"
          }`}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDragEnter={(e) => {
            if (![...e.dataTransfer.types].includes("Files")) return;
            e.preventDefault();
            e.stopPropagation();
            setYamlDragDepth((d) => d + 1);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setYamlDragDepth((d) => Math.max(0, d - 1));
          }}
          onDragOver={(e) => {
            if (![...e.dataTransfer.types].includes("Files")) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setYamlDragDepth(0);
            const file = [...e.dataTransfer.files].find(isScanFile) ?? e.dataTransfer.files[0];
            if (file) void loadYamlFromFile(file);
          }}
        >
          {yamlDragDepth > 0 && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-surface/95 px-8 py-6 shadow-lg">
                <Upload className="h-8 w-8 text-primary" />
                <p className="text-sm font-semibold text-foreground">Drop SCAN file to load board</p>
                <p className="text-xs text-muted-foreground">.scan / .yaml / .yml / .scan.yaml</p>
              </div>
            </div>
          )}

          <div
            className="absolute left-0 top-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              width: 2000,
              height: 1200,
            }}
          >
            {/* GROUPS */}
            {groups.map((g) => {
              const selectedGroup = selectedBoundaryIds.includes(g.id);
              const handles: ResizeHandle[] = [
                "nw",
                "n",
                "ne",
                "e",
                "se",
                "s",
                "sw",
                "w",
              ];
              const handleStyle = (h: ResizeHandle): CSSProperties => {
                const base: CSSProperties = {
                  position: "absolute",
                  width: 10,
                  height: 10,
                  background: "var(--surface, #fff)",
                  border: `2px solid ${boundaryStroke(g.color)}`,
                  borderRadius: 2,
                  zIndex: 6,
                  pointerEvents: "auto",
                };
                if (h.includes("n")) base.top = -5;
                if (h.includes("s")) base.bottom = -5;
                if (h.includes("w")) base.left = -5;
                if (h.includes("e")) base.right = -5;
                if (h === "n" || h === "s") {
                  base.left = "50%";
                  base.marginLeft = -5;
                  base.cursor = "ns-resize";
                } else if (h === "e" || h === "w") {
                  base.top = "50%";
                  base.marginTop = -5;
                  base.cursor = "ew-resize";
                } else if (h === "nw" || h === "se") {
                  base.cursor = "nwse-resize";
                } else {
                  base.cursor = "nesw-resize";
                }
                return base;
              };
              return (
                <div
                  key={g.id}
                  className={`absolute rounded-2xl border-2 border-dashed ${
                    selectedGroup ? "ring-2 ring-primary/30" : ""
                  }`}
                  style={{
                    left: g.x,
                    top: g.y,
                    width: g.w,
                    height: g.h,
                    borderColor: boundaryStroke(g.color),
                    background: boundaryFillMix(g.color),
                    pointerEvents: tool === "select" ? "auto" : "none",
                    cursor: tool === "select" ? "move" : undefined,
                  }}
                  onPointerDown={(e) => startBoundaryMove(e, g.id)}
                >
                  {selectedGroup && <SelectionCheck />}
                  <div className="absolute -top-3 left-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-xs font-semibold hairline hover:ring-2 hover:ring-primary/20"
                      style={{ color: boundaryStroke(g.color) }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setBoundaryRenameModal({ id: g.id, value: g.title });
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.ctrlKey || e.metaKey) {
                          setSelectedEdge(null);
                          setSelected(null);
                          setSelectedExtras([]);
                          const current = new Set(selectedBoundaryExtras);
                          if (selectedBoundary) current.add(selectedBoundary);
                          if (current.has(g.id)) current.delete(g.id);
                          else current.add(g.id);
                          const next = [...current];
                          setSelectedBoundary(next.length ? next[next.length - 1]! : null);
                          setSelectedBoundaryExtras(next.length > 1 ? next.slice(0, -1) : []);
                          return;
                        }
                        setSelectedBoundary(g.id);
                        setSelectedBoundaryExtras([]);
                        setSelected(null);
                        setSelectedExtras([]);
                        setSelectedEdge(null);
                      }}
                    >
                      <ElementIcon
                        icon={g.icon}
                        Fallback={g.kind === "runtime" ? Cpu : Shield}
                        className="h-3.5 w-3.5"
                      />
                      {g.title}
                    </button>
                    {g.tag && (
                      <span className="pointer-events-none rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground hairline">
                        {g.tag}
                      </span>
                    )}
                  </div>
                  {selectedGroup &&
                    handles.map((h) => (
                      <div
                        key={h}
                        data-resize-handle={h}
                        style={handleStyle(h)}
                        onPointerDown={(e) => startBoundaryResize(e, g.id, h)}
                      />
                    ))}
                </div>
              );
            })}

            {/* EDGES */}
            <svg
              className="pointer-events-none absolute inset-0"
              width={2000}
              height={1200}
              style={{ overflow: "visible" }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="oklch(0.35 0.03 260)" />
                </marker>
                <marker
                  id="arrow-agent"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--agent)" />
                </marker>
                <marker
                  id="arrow-event"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--event)" />
                </marker>
              </defs>
              {edges.map((e) => {
                const from = nodeById[e.from];
                const to = nodeById[e.to];
                if (!from || !to) return null;
                const anchors = edgeAnchorsById.get(e.id);
                const a = anchors?.a ?? anchorPoint(from, e.fromSide ?? "r");
                const b = anchors?.b ?? anchorPoint(to, e.toSide ?? "l");
                const fromSide = anchors?.fromSide ?? e.fromSide ?? "r";
                const toSide = anchors?.toSide ?? e.toSide ?? "l";
                const s = edgeStyle(e.kind);
                const active = hoverEdge === e.id || selectedEdge === e.id;
                const faded = edgeDimmed(e) && !active;
                const marker =
                  e.kind === "flow" || e.kind === "db"
                    ? "url(#arrow-agent)"
                    : e.kind === "async" || e.kind === "stream"
                      ? "url(#arrow-event)"
                      : "url(#arrow)";
                const d =
                  routeDrag?.edgeId === e.id
                    ? routeDrag.points
                        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                        .join(" ")
                    : orthogonalEdgePaths?.get(e.id) ??
                      edgePath(a, b, fromSide, toSide);
                return (
                  <g key={e.id} className="pointer-events-auto">
                    <path
                      d={d}
                      stroke={s.stroke}
                      strokeWidth={active ? s.width + 1.5 : s.width}
                      strokeDasharray={s.dash}
                      fill="none"
                      markerEnd={marker}
                      opacity={faded ? 0.18 : active ? 1 : 0.9}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoverEdge(e.id)}
                      onMouseLeave={() => setHoverEdge(null)}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelectedEdge(e.id);
                        setSelected(null);
                        setSelectedBoundary(null);
                      }}
                    />
                  </g>
                );
              })}
              {connectFrom &&
                connectCursor &&
                (() => {
                  const from = nodeById[connectFrom.nodeId];
                  if (!from) return null;
                  const a = connectFrom.portId
                    ? anchorPoint(from, "r")
                    : { x: from.x + from.w / 2, y: from.y + from.h / 2 };
                  return (
                    <path
                      d={`M ${a.x} ${a.y} L ${connectCursor.x} ${connectCursor.y}`}
                      stroke="var(--primary)"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      fill="none"
                      opacity={0.85}
                      markerEnd="url(#arrow)"
                      pointerEvents="none"
                    />
                  );
                })()}
            </svg>

            {/* Orthogonal route handles: mid-segment (incl. stubs — slides attachment). */}
            {orthogonalEdges &&
              selectedEdge &&
              (() => {
                const edge = edges.find((x) => x.id === selectedEdge);
                const fromNode = edge ? nodeById[edge.from] : undefined;
                const toNode = edge ? nodeById[edge.to] : undefined;
                const pts =
                  routeDrag?.edgeId === selectedEdge
                    ? routeDrag.points
                    : orthogonalPolylines?.get(selectedEdge);
                if (!pts || pts.length < 2 || !fromNode || !toNode) return null;
                const handles: Array<{
                  key: string;
                  x: number;
                  y: number;
                  segmentIndex: number;
                  axis: "x" | "y";
                  cursor: string;
                }> = [];
                for (let i = 0; i < pts.length - 1; i++) {
                  const a = pts[i]!;
                  const b = pts[i + 1]!;
                  const dx = Math.abs(b.x - a.x);
                  const dy = Math.abs(b.y - a.y);
                  if (dx < 1 && dy < 1) continue;
                  const horizontal = dy <= dx;
                  const axis: "x" | "y" = horizontal ? "y" : "x";
                  handles.push({
                    key: `seg-${selectedEdge}-${i}`,
                    x: (a.x + b.x) / 2,
                    y: (a.y + b.y) / 2,
                    segmentIndex: i,
                    axis,
                    cursor: horizontal ? "ns-resize" : "ew-resize",
                  });
                }
                return handles.map((h) => (
                  <div
                    key={h.key}
                    className="absolute z-[1] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-primary bg-background shadow active:cursor-grabbing"
                    style={{ left: h.x, top: h.y, cursor: h.cursor }}
                    title={
                      h.axis === "y"
                        ? "Drag up/down to move this segment"
                        : "Drag left/right to move this segment"
                    }
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      ev.preventDefault();
                      (ev.currentTarget as Element).setPointerCapture(ev.pointerId);
                      setRouteDrag({
                        edgeId: selectedEdge,
                        segmentIndex: h.segmentIndex,
                        axis: h.axis,
                        points: pts.map((q: { x: number; y: number }) => ({
                          x: q.x,
                          y: q.y,
                        })),
                        fromBox: {
                          x: fromNode.x,
                          y: fromNode.y,
                          w: fromNode.w,
                          h: fromNode.h,
                        },
                        toBox: {
                          x: toNode.x,
                          y: toNode.y,
                          w: toNode.w,
                          h: toNode.h,
                        },
                        fromSide: edge?.fromSide,
                        toSide: edge?.toSide,
                      });
                    }}
                  />
                ));
              })()}

            {/* EDGE LABELS */}
            {edges.map((e) => {
              const from = nodeById[e.from];
              const to = nodeById[e.to];
              if (!from || !to || !e.label) return null;
              const m = edgeLabelPositions.get(e.id);
              if (!m) return null;
              const active = hoverEdge === e.id || selectedEdge === e.id;
              const showOps = hoverEdge === e.id && (e.operations?.length ?? 0) > 0;
              const faded = edgeDimmed(e) && !active;
              const showText = active || zoom >= LABEL_LOD_ZOOM;
              if (!showText && !active) {
                // Thin hit target at low zoom so edges stay selectable via path;
                // skip the opaque chip to reduce clutter.
                return null;
              }
              return (
                <div
                  key={`lbl-${e.id}`}
                  className={`absolute z-[4] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-stretch gap-1 ${
                    showOps ? "z-[5]" : ""
                  } ${faded ? "opacity-25" : ""}`}
                  style={{ left: m.x, top: m.y }}
                  onMouseEnter={() => setHoverEdge(e.id)}
                  onMouseLeave={() => setHoverEdge(null)}
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setSelectedEdge(e.id);
                    setSelected(null);
                    setSelectedBoundary(null);
                  }}
                >
                  <div
                    className={`flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-[10px] font-medium text-foreground hairline node-shadow ${
                      active ? "ring-2 ring-primary/40" : "hover:ring-2 hover:ring-primary/25"
                    }`}
                  >
                    <EdgeIcon kind={e.kind} />
                    <div className="leading-tight">
                      <div>{e.label}</div>
                      {e.contract && (
                        <div className="text-[9px] text-muted-foreground">{e.contract}</div>
                      )}
                    </div>
                    {(e.operations?.length ?? 0) > 0 && (
                      <span className="ml-0.5 rounded bg-muted px-1 py-0.5 text-[8px] font-semibold tabular-nums text-muted-foreground">
                        {e.operations!.length}
                      </span>
                    )}
                  </div>
                  {showOps && (
                    <div className="min-w-[180px] max-w-[240px] rounded-lg border border-border bg-popover px-2.5 py-2 text-left node-shadow-lg">
                      <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {edgeKindTitle(e.kind)} endpoints
                      </div>
                      <ul className="space-y-1">
                        {e.operations!.map((op) => (
                          <li
                            key={op}
                            className="truncate font-mono text-[10px] text-foreground"
                            title={op}
                          >
                            {op}
                          </li>
                        ))}
                      </ul>
                      {(e.fromPort || e.toPort) && (
                        <div className="mt-2 border-t border-border pt-1.5 text-[9px] text-muted-foreground">
                          {[e.fromPort, e.toPort].filter(Boolean).join(" -> ")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* EDGE HOVER (edges without labels still show ops) */}
            {hoverEdge &&
              (() => {
                const e = edges.find((x) => x.id === hoverEdge);
                if (!e || e.label || !e.operations?.length) return null;
                const from = nodeById[e.from];
                const to = nodeById[e.to];
                if (!from || !to) return null;
                const a = anchorPoint(from, e.fromSide ?? "r");
                const b = anchorPoint(to, e.toSide ?? "l");
                const m = placeEdgeLabel({
                  a,
                  b,
                  aSide: e.fromSide ?? "r",
                  bSide: e.toSide ?? "l",
                  nodes: nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })),
                });
                return (
                  <div
                    className="pointer-events-none absolute z-[5] min-w-[180px] max-w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover px-2.5 py-2 node-shadow-lg"
                    style={{ left: m.x, top: m.y }}
                  >
                    <div className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {edgeKindTitle(e.kind)} endpoints
                    </div>
                    <ul className="space-y-1">
                      {e.operations.map((op) => (
                        <li key={op} className="truncate font-mono text-[10px]" title={op}>
                          {op}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}

            {/* NODES */}
            {displayNodes.map((n) => (
              <NodeCard
                key={n.id}
                node={n}
                selected={selectedNodeIds.includes(n.id)}
                connectSource={connectFrom?.nodeId === n.id}
                connectSourcePortId={
                  connectFrom?.nodeId === n.id ? connectFrom.portId : undefined
                }
                connectMode={
                  tool === "connect" || tool === "fast" || Boolean(connectFrom)
                }
                dim={dimmed(n)}
                highlight={
                  view === "contracts" && n.status === "warn"
                }
                onPointerDown={(e) => startDrag(e, n.id)}
                onContextMenu={(e) => openContextMenu(e, n.id)}
                onPortPointerDown={(e, portId, role) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onPortConnect(n.id, portId, role);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tool === "connect" || tool === "fast") return;
                  if (e.ctrlKey || e.metaKey) return;
                  if (selectedNodeIds.includes(n.id) && selectedNodeIds.length > 1) return;
                  setSelected(n.id);
                  setSelectedExtras([]);
                  setSelectedBoundary(null);
                  setSelectedBoundaryExtras([]);
                  setSelectedEdge(null);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (tool === "connect" || tool === "fast") return;
                  setSelected(n.id);
                  setSelectedExtras([]);
                  setSelectedEdge(null);
                  setSelectedBoundary(null);
                  setSelectedBoundaryExtras([]);
                  setRenameModal({ nodeId: n.id, value: n.title });
                }}
              />
            ))}
            {selected &&
              selNode &&
              tool === "select" &&
              selectedNodeIds.length === 1 &&
              renderNodeOverlay?.({
                node: selNode,
                x: selNode.x,
                y: selNode.y,
                w: selNode.w,
                h: selNode.h,
              })}
            {/* Fast design rubber-band preview */}
            {fastDraft && (() => {
              const r = normalizeDraftRect(fastDraft);
              const draftKind = classifyFastDraft(r.w, r.h);
              const ring =
                draftKind === "boundary"
                  ? "border-primary bg-primary/5"
                  : draftKind === "datastore"
                    ? "border-data bg-data-soft/60"
                    : "border-muted-foreground/50 bg-muted/20";
              const label =
                draftKind === "boundary"
                  ? boundaryKind === "trust"
                    ? "Trust boundary"
                    : "Runtime"
                  : draftKind === "datastore"
                    ? "Datastore"
                    : null;
              return (
                <div
                  className={`pointer-events-none absolute rounded-2xl border-2 border-dashed ${ring}`}
                  style={{
                    left: r.x,
                    top: r.y,
                    width: Math.max(r.w, 2),
                    height: Math.max(r.h, 2),
                    zIndex: 40,
                  }}
                >
                  {label && (
                    <span className="absolute left-2 top-1.5 rounded-md bg-surface/90 px-1.5 py-0.5 text-[10px] font-semibold text-foreground hairline">
                      {label}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {(tool === "connect" || tool === "fast" || connectFrom) && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-surface/95 px-4 py-2 text-xs shadow-lg backdrop-blur">
            {tool === "fast" && !connectFrom ? (
              <>
                <PenLine className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">
                  Fast design on — see legend (left)
                </span>
                <span className="text-muted-foreground">Esc to exit</span>
              </>
            ) : (
              <>
                <Pointer className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-foreground">
                  {connectFrom
                    ? `Source: ${nodeById[connectFrom.nodeId]?.title ?? connectFrom.nodeId}${
                        connectFrom.portId ? ` · ${connectFrom.portId}` : ""
                      } - click a consume port (or node)`
                    : "Click an expose port (or node) to start"}
                </span>
                <span className="text-muted-foreground">Esc to cancel</span>
              </>
            )}
          </div>
        )}

        {tool === "create" && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-surface/95 px-4 py-2 text-xs shadow-lg backdrop-blur">
            <Plus className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              Click canvas to place {createKindHints[createKind].label}
            </span>
            <span className="hidden text-muted-foreground sm:inline">
              {createKindHints[createKind].hint}
            </span>
            <span className="text-muted-foreground">Esc to cancel</span>
          </div>
        )}

        {tool === "boundary" && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-surface/95 px-4 py-2 text-xs shadow-lg backdrop-blur">
            <Square className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              Click canvas to place{" "}
              {boundaryKind === "trust" ? "Trust Boundary" : "Runtime"}
            </span>
            <span className="text-muted-foreground">Esc to cancel</span>
          </div>
        )}

        {/* LEFT TOOL RAIL */}
        <div data-canvas-chrome>
          <ToolRail
            tool={tool}
            setTool={setTool}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            orthogonalEdges={orthogonalEdges}
            setOrthogonalEdges={setOrthogonalEdges}
            onPickCreate={(kind) => {
              setCreateKind(kind);
              if (tool === "fast") {
                toast.message(`Fast design places ${createKindHints[kind].label}`);
                return;
              }
              setTool("create");
            }}
            onPickBoundary={(kind) => {
              setBoundaryKind(kind);
              if (tool === "fast") {
                toast.message(
                  kind === "trust"
                    ? "Fast design boxes create Trust boundaries"
                    : "Fast design boxes create Runtime boundaries",
                );
                return;
              }
              setTool("boundary");
            }}
          />
          {tool === "fast" && (
            <FastDesignLegend
              createLabel={createKindHints[createKind].label}
              boundaryLabel={boundaryKind === "trust" ? "Trust boundary" : "Runtime"}
            />
          )}
        </div>

        {/* ZOOM CONTROLS */}
        <div
          data-canvas-chrome
          className="absolute bottom-6 left-6 flex items-center gap-1 rounded-xl bg-surface p-1 node-shadow hairline"
        >
          <IconBtn label="Zoom out" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </IconBtn>
          <button
            onClick={zoomReset}
            className="min-w-[52px] rounded-md px-2 py-1 text-xs font-medium tabular-nums hover:bg-muted"
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconBtn label="Zoom in" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </IconBtn>
          <div className="mx-1 h-5 w-px bg-border" />
          <IconBtn label="Fit to screen" onClick={fitContent}>
            <Maximize2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Locate selection">
            <Locate className="h-4 w-4" />
          </IconBtn>
          {selectionCount > 1 && (
            <>
              <div className="mx-1 h-5 w-px bg-border" />
              <span
                className="px-2 text-[11px] font-medium tabular-nums text-muted-foreground"
                title="Ctrl/Cmd+click to add or remove from selection"
              >
                {selectionCount} selected
              </span>
            </>
          )}
        </div>

        {/* MINIMAP + LEGEND */}
        <div
          data-canvas-chrome
          className="absolute bottom-6 right-6 flex flex-col items-end gap-3"
        >
          <Legend />
          <MiniMap
            nodes={nodes}
            groups={groups}
            edges={edges}
            pan={pan}
            zoom={zoom}
            canvasSize={canvasSize}
            systemName={systemName}
            onNavigate={(worldX, worldY) => {
              const next = {
                x: canvasSize.w / 2 - worldX * zoomRef.current,
                y: canvasSize.h / 2 - worldY * zoomRef.current,
              };
              panRef.current = next;
              setPan(next);
            }}
            onPanDelta={(dxWorld, dyWorld) => {
              const z = zoomRef.current;
              const next = {
                x: panRef.current.x - dxWorld * z,
                y: panRef.current.y - dyWorld * z,
              };
              panRef.current = next;
              setPan(next);
            }}
          />
        </div>

        {/* VALIDATION TOAST */}
        <ValidationToast
          warnings={architectureWarnings}
          validating={architectureValidating}
          renderAction={renderValidationAction}
          onSelect={(w) => {
            setSelected(w.id);
            setSelectedEdge(null);
            setSelectedBoundary(null);
          }}
        />

        {/* INSPECTOR */}
        {(selNode || selEdge || selBoundary) && (
          <Inspector
            node={selNode ?? null}
            edge={selEdge ?? null}
            group={selBoundary}
            nodes={displayNodes}
            edges={edges}
            renderInspectorExtras={renderInspectorExtras}
            onClose={() => {
              setSelected(null);
              setSelectedEdge(null);
              setSelectedBoundary(null);
            }}
            onUpdateConnection={(id, patch) => {
              try {
                board.updateConnection(id, patch);
                toast.success("Connection updated");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Update failed";
                toast.error("Could not update connection", { description: message });
              }
            }}
            onUpdateBoundary={(id, patch) => {
              try {
                updateBoundary(id, patch);
                toast.success("Boundary updated");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Update failed";
                toast.error("Could not update boundary", { description: message });
              }
            }}
            onUpdateElementIcon={(id, icon) => {
              try {
                updateElementIcon(id, icon);
                toast.success(icon ? "Icon updated" : "Icon reset");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Update failed";
                toast.error("Could not update icon", { description: message });
              }
            }}
            onUpdateElementDescription={(id, description) => {
              try {
                updateElementDescription(id, description);
              } catch (err) {
                const message = err instanceof Error ? err.message : "Update failed";
                toast.error("Could not update description", { description: message });
              }
            }}
            onUpdateElementMeta={(id, patch) => {
              try {
                updateElementMeta(id, patch);
              } catch (err) {
                toast.error("Could not update metadata", {
                  description: err instanceof Error ? err.message : "Update failed",
                });
              }
            }}
            onSetElementRepository={(id, repository) => {
              try {
                setElementRepository(id, repository);
              } catch (err) {
                toast.error("Could not set repository", {
                  description: err instanceof Error ? err.message : "Update failed",
                });
              }
            }}
            onAddElementLink={(id, link) => {
              try {
                addElementLink(id, link);
              } catch (err) {
                toast.error("Could not add link", {
                  description: err instanceof Error ? err.message : "Update failed",
                });
              }
            }}
            onRemoveElementLink={(id, index) => {
              try {
                removeElementLink(id, index);
              } catch (err) {
                toast.error("Could not remove link", {
                  description: err instanceof Error ? err.message : "Update failed",
                });
              }
            }}
            onAddPort={(id, role) => {
              try {
                addPort(id, role);
                toast.success(role === "consume" ? "Consume port added" : "Expose port added");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Could not add port";
                toast.error("Port failed", { description: message });
              }
            }}
            onUpdatePort={(id, portId, patch) => {
              try {
                updatePort(id, portId, patch);
              } catch (err) {
                const message = err instanceof Error ? err.message : "Could not update port";
                toast.error("Port update failed", { description: message });
              }
            }}
            onDeletePort={(id, portId) => {
              try {
                deletePort(id, portId);
                toast.success("Port removed");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Could not delete port";
                toast.error("Port delete failed", { description: message });
              }
            }}
            onDeleteBoundary={(id) => {
              try {
                deleteBoundary(id);
                setSelectedBoundary(null);
                toast.success("Boundary deleted");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Delete failed";
                toast.error("Could not delete boundary", { description: message });
              }
            }}
            onRenameBoundary={(id) => {
              const g = groups.find((x) => x.id === id);
              if (g) setBoundaryRenameModal({ id: g.id, value: g.title });
            }}
            onBringBoundaryForward={bringBoundaryForward}
            onSendBoundaryBackward={sendBoundaryBackward}
            onSelectEdge={(id) => {
              setSelectedEdge(id);
              setSelected(null);
              setSelectedBoundary(null);
            }}
            onSelectNode={(id) => {
              setSelected(id);
              setSelectedEdge(null);
              setSelectedBoundary(null);
            }}
          />
        )}

        {/* CONTEXT MENU */}
        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            onClose={() => setCtxMenu(null)}
            nodeTitle={nodeById[ctxMenu.nodeId]?.title ?? ""}
            onDelete={() => {
              setDeleteModal({ nodeId: ctxMenu.nodeId });
              setCtxMenu(null);
            }}
            onDuplicate={() => {
              try {
                const id = duplicateElement(ctxMenu.nodeId);
                setSelected(id);
                setSelectedEdge(null);
                setSelectedBoundary(null);
                setCtxMenu(null);
                toast.success("Duplicated");
              } catch (err) {
                const message = err instanceof Error ? err.message : "Duplicate failed";
                toast.error("Could not duplicate", { description: message });
                setCtxMenu(null);
              }
            }}
            onRename={() => {
              const current = nodeById[ctxMenu.nodeId]?.title ?? "";
              setRenameModal({ nodeId: ctxMenu.nodeId, value: current });
              setCtxMenu(null);
            }}
            onConnect={() => {
              setTool("connect");
              setConnectFrom({ nodeId: ctxMenu.nodeId });
              setSelected(ctxMenu.nodeId);
              setSelectedEdge(null);
              setSelectedBoundary(null);
              setCtxMenu(null);
              toast.message("Connect from this component", {
                description: "Click a consume port or another node to finish",
              });
            }}
            onGroupBoundary={() => {
              const n = nodeById[ctxMenu.nodeId];
              setCtxMenu(null);
              if (!n) return;
              const pad = 48;
              try {
                const id = createBoundary(
                  "trust",
                  {
                    x: Math.round((n.x - pad) / 4) * 4,
                    y: Math.round((n.y - pad) / 4) * 4,
                    w: Math.round((n.w + pad * 2) / 4) * 4,
                    h: Math.round((n.h + pad * 2) / 4) * 4,
                  },
                  `${n.title} Boundary`,
                );
                setSelectedBoundary(id);
                setSelected(null);
                setSelectedEdge(null);
                toast.success("Trust boundary created", {
                  description: "Resize to include more components - edit name in the inspector",
                });
              } catch (err) {
                const message = err instanceof Error ? err.message : "Could not create boundary";
                toast.error("Boundary failed", { description: message });
              }
            }}
            onAttachRepository={() => {
              setSelected(ctxMenu.nodeId);
              setSelectedEdge(null);
              setSelectedBoundary(null);
              setCtxMenu(null);
            }}
          />
        )}

        <Modal
          open={!!renameModal}
          onClose={() => setRenameModal(null)}
          title="Rename component"
          description="Give this component a clearer name. This updates the SCAN model."
          tone="info"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setRenameModal(null) },
            {
              label: "Save",
              variant: "primary",
              autoFocus: true,
              disabled: !renameModal?.value.trim(),
              onClick: () => {
                if (!renameModal?.value.trim()) return;
                renameElement(renameModal.nodeId, renameModal.value.trim());
                setRenameModal(null);
              },
            },
          ]}
        >
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </label>
          <input
            autoFocus
            value={renameModal?.value ?? ""}
            onChange={(e) =>
              setRenameModal((r) => (r ? { ...r, value: e.target.value } : r))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameModal?.value.trim()) {
                renameElement(renameModal.nodeId, renameModal.value.trim());
                setRenameModal(null);
              }
            }}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Order API"
          />
        </Modal>

        <Modal
          open={!!boundaryRenameModal}
          onClose={() => setBoundaryRenameModal(null)}
          title="Rename boundary"
          description="This label is stored on the SCAN view boundary."
          tone="info"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setBoundaryRenameModal(null) },
            {
              label: "Save",
              variant: "primary",
              autoFocus: true,
              disabled: !boundaryRenameModal?.value.trim(),
              onClick: () => {
                if (!boundaryRenameModal?.value.trim()) return;
                try {
                  renameBoundary(boundaryRenameModal.id, boundaryRenameModal.value.trim());
                  setBoundaryRenameModal(null);
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Rename failed";
                  toast.error("Could not rename", { description: message });
                }
              },
            },
          ]}
        >
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </label>
          <input
            autoFocus
            value={boundaryRenameModal?.value ?? ""}
            onChange={(e) =>
              setBoundaryRenameModal((r) => (r ? { ...r, value: e.target.value } : r))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && boundaryRenameModal?.value.trim()) {
                try {
                  renameBoundary(boundaryRenameModal.id, boundaryRenameModal.value.trim());
                  setBoundaryRenameModal(null);
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Rename failed";
                  toast.error("Could not rename", { description: message });
                }
              }
            }}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Order Platform"
          />
        </Modal>

        <Modal
          open={!!deleteModal}
          onClose={() => setDeleteModal(null)}
          title="Delete component?"
          description={
            deleteModal
              ? `"${nodeById[deleteModal.nodeId]?.title}" and its connections will be removed from the board. This can be undone from history.`
              : ""
          }
          tone="danger"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setDeleteModal(null) },
            {
              label: "Delete",
              variant: "danger",
              onClick: () => {
                if (!deleteModal) return;
                deleteElement(deleteModal.nodeId);
                setSelected(null);
                setDeleteModal(null);
              },
            },
          ]}
        />

        <Modal
          open={!!diagramNameModal}
          onClose={() => setDiagramNameModal(null)}
          title="Diagram name"
          description="This name is stored on the system and used for SCAN / SVG / PNG exports. Renaming also updates system.id."
          tone="info"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setDiagramNameModal(null) },
            {
              label: "Save",
              variant: "primary",
              disabled: !diagramNameModal?.value.trim(),
              onClick: () => {
                if (!diagramNameModal?.value.trim()) return;
                try {
                  commitRenameDiagram(diagramNameModal.value.trim());
                  setDiagramNameModal(null);
                  toast.success("Diagram renamed");
                } catch (err) {
                  toast.error("Could not rename", {
                    description: err instanceof Error ? err.message : "Rename failed",
                  });
                }
              },
            },
          ]}
        >
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Name
          </label>
          <input
            autoFocus
            value={diagramNameModal?.value ?? ""}
            onChange={(e) => setDiagramNameModal({ value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && diagramNameModal?.value.trim()) {
                try {
                  commitRenameDiagram(diagramNameModal.value.trim());
                  setDiagramNameModal(null);
                  toast.success("Diagram renamed");
                } catch (err) {
                  toast.error("Could not rename", {
                    description: err instanceof Error ? err.message : "Rename failed",
                  });
                }
              }
            }}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Order Platform"
          />
        </Modal>

        <Modal
          open={!!duplicateModal}
          onClose={() => setDuplicateModal(null)}
          title="Duplicate diagram"
          description="Copies this architecture under a new system name. Plans and builds on disk stay with the original."
          tone="info"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setDuplicateModal(null) },
            {
              label: "Duplicate",
              variant: "primary",
              disabled: !duplicateModal?.value.trim(),
              onClick: () => {
                if (!duplicateModal?.value.trim()) return;
                void (async () => {
                  try {
                    await commitDuplicateDiagram(duplicateModal.value.trim());
                    setDuplicateModal(null);
                    toast.success("Diagram duplicated");
                  } catch (err) {
                    toast.error("Could not duplicate", {
                      description: err instanceof Error ? err.message : "Duplicate failed",
                    });
                  }
                })();
              },
            },
          ]}
        >
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            New name
          </label>
          <input
            autoFocus
            value={duplicateModal?.value ?? ""}
            onChange={(e) => setDuplicateModal({ value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && duplicateModal?.value.trim()) {
                void (async () => {
                  try {
                    await commitDuplicateDiagram(duplicateModal.value.trim());
                    setDuplicateModal(null);
                    toast.success("Diagram duplicated");
                  } catch (err) {
                    toast.error("Could not duplicate", {
                      description: err instanceof Error ? err.message : "Duplicate failed",
                    });
                  }
                })();
              }
            }}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="e.g. Order Platform copy"
          />
        </Modal>

        <Modal
          open={newBoardModal === "confirm"}
          onClose={() => setNewBoardModal(null)}
          title="Discard unsaved changes?"
          description="Starting a new board will discard your current unsaved edits."
          tone="danger"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setNewBoardModal(null) },
            {
              label: "Discard & continue",
              variant: "danger",
              onClick: () => {
                setNewBoardName("Untitled System");
                setNewBoardModal("name");
              },
            },
          ]}
        />

        <Modal
          open={newBoardModal === "name"}
          onClose={() => setNewBoardModal(null)}
          title="New board"
          description="Name the system/diagram. Exports will use this name on disk."
          tone="info"
          actions={[
            { label: "Cancel", variant: "ghost", onClick: () => setNewBoardModal(null) },
            {
              label: "Create",
              variant: "primary",
              onClick: () => void completeNewBoard(newBoardName),
            },
          ]}
        >
          <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Diagram name
          </label>
          <input
            autoFocus
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void completeNewBoard(newBoardName);
            }}
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Untitled System"
          />
        </Modal>

      </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

