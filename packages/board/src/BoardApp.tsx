import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Boxes,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCopy,
  Command as CommandIcon,
  Download,
  Filter,
  Github,
  Grid3x3,
  Hand,
  Layers,
  Locate,
  Maximize2,
  Mic,
  MousePointer2,
  Paperclip,
  Plus,
  Pointer,
  Redo2,
  Search,
  Send,
  Shield,
  Sparkles,
  Square,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  History as HistoryIcon,
  AlertTriangle,
  Check,
  FileCode2,
  Radio,
  Database as DbIcon,
  Leaf,
  Image as ImageIcon,
  FilePlus2,
  ExternalLink,
  Link2,
  Menu,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  commandSuggestions,
  recentPrompts as seedRecentPrompts,
  previewChanges,
} from "./chrome-data";
import type { SphereNode, SphereEdge, SphereGroup, NodeKind, BoundaryColor } from "@spherescan/viewer";
import {
  LABEL_LOD_ZOOM,
  anchorPoint,
  computeLabelStagger,
  edgePath,
  placeEdgeLabel,
  projectToGraph,
  graphToSvg,
  BOUNDARY_COLORS,
  boundaryColorMeta,
  boundaryFillMix,
  boundaryStroke,
} from "@spherescan/viewer";
import { parseScanYaml } from "@spherescan/model";
import type { CreateKind } from "@spherescan/modeler";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { kindMeta } from "./kinds";
import { Modal } from "./Modal";
import { useScanBoard } from "./useScanBoard";
import { ElementIcon } from "./ElementIcon";
import { IconPickerModal } from "./IconPickerModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const RECENT_PROMPTS_KEY = "sphere.board.recentPrompts";
const MAX_RECENT_PROMPTS = 8;

function readStoredRecentPrompts(): string[] {
  if (typeof window === "undefined") return [...seedRecentPrompts];
  try {
    const raw = window.localStorage.getItem(RECENT_PROMPTS_KEY);
    if (!raw) return [...seedRecentPrompts];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...seedRecentPrompts];
    const cleaned = parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_RECENT_PROMPTS);
    return cleaned.length ? cleaned : [...seedRecentPrompts];
  } catch {
    return [...seedRecentPrompts];
  }
}

function rememberRecentPrompt(previous: string[], message: string): string[] {
  const trimmed = message.trim();
  if (!trimmed) return previous;
  const next = [trimmed, ...previous.filter((item) => item !== trimmed)].slice(
    0,
    MAX_RECENT_PROMPTS,
  );
  try {
    window.localStorage.setItem(RECENT_PROMPTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}

type Point = { x: number; y: number };

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const createKindHints: Record<
  CreateKind,
  { nodeKind: NodeKind; label: string; hint: string }
> = {
  service: {
    nodeKind: "service",
    label: "Service",
    hint: "Runnable API with REST ports",
  },
  "external-system": {
    nodeKind: "external",
    label: "External System",
    hint: "Third-party or shared platform",
  },
  datastore: {
    nodeKind: "database",
    label: "Datastore",
    hint: "Database or persistent store",
  },
  "event-stream": {
    nodeKind: "event",
    label: "Event / Stream",
    hint: "Topic, queue, or event channel",
  },
  search: {
    nodeKind: "search",
    label: "Search",
    hint: "Search / index component",
  },
  agent: {
    nodeKind: "agent",
    label: "Agent",
    hint: "Autonomous or assisted runtime",
  },
  repository: {
    nodeKind: "repo",
    label: "Repository",
    hint: "Source or contract repo",
  },
};

function edgeKindTitle(kind: SphereEdge["kind"]): string {
  switch (kind) {
    case "rest":
      return "REST";
    case "grpc":
      return "gRPC";
    case "async":
      return "Async";
    case "db":
      return "Database";
    case "stream":
      return "Stream";
    case "git":
      return "Git";
    case "flow":
      return "Flow";
    default:
      return "Connection";
  }
}

function isScanFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".scan") ||
    name.endsWith(".yaml") ||
    name.endsWith(".yml") ||
    file.type === "application/x-yaml" ||
    file.type === "text/yaml"
  );
}

function isAiAttachmentFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

const kindColorVar: Record<NodeKind, string> = {
  service: "var(--svc)",
  external: "var(--ext)",
  database: "var(--data)",
  event: "var(--event)",
  search: "var(--search)",
  agent: "var(--agent)",
  repo: "var(--repo)",
};

const edgeStyle = (kind: SphereEdge["kind"]) => {
  switch (kind) {
    case "rest":
      return { stroke: "oklch(0.35 0.03 260)", dash: "", width: 1.5 };
    case "grpc":
      return { stroke: "oklch(0.4 0.03 260)", dash: "", width: 1.5 };
    case "db":
      return { stroke: "var(--agent)", dash: "6 4", width: 1.5 };
    case "async":
      return { stroke: "var(--event)", dash: "6 4", width: 1.5 };
    case "stream":
      return { stroke: "var(--event)", dash: "6 4", width: 1.5 };
    case "git":
      return { stroke: "oklch(0.5 0.02 260)", dash: "5 4", width: 1.5 };
    case "flow":
      return { stroke: "var(--agent)", dash: "5 4", width: 1.5 };
  }
};

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const MIN_BOUNDARY_W = 160;
const MIN_BOUNDARY_H = 120;

function applyBoundaryResize(
  start: { x: number; y: number; w: number; h: number },
  handle: ResizeHandle,
  dx: number,
  dy: number,
) {
  let { x, y, w, h } = start;
  if (handle.includes("e")) w = start.w + dx;
  if (handle.includes("s")) h = start.h + dy;
  if (handle.includes("w")) {
    x = start.x + dx;
    w = start.w - dx;
  }
  if (handle.includes("n")) {
    y = start.y + dy;
    h = start.h - dy;
  }
  if (w < MIN_BOUNDARY_W) {
    if (handle.includes("w")) x = start.x + start.w - MIN_BOUNDARY_W;
    w = MIN_BOUNDARY_W;
  }
  if (h < MIN_BOUNDARY_H) {
    if (handle.includes("n")) y = start.y + start.h - MIN_BOUNDARY_H;
    h = MIN_BOUNDARY_H;
  }
  return {
    x: Math.round(x / 4) * 4,
    y: Math.round(y / 4) * 4,
    w: Math.round(w / 4) * 4,
    h: Math.round(h / 4) * 4,
  };
}

export type BoardShell = "scan" | "sphere";

export type BoardAppProps = {
  /** `scan` = OSS reference chrome; `sphere` = product AI / Share / collab chrome. Board canvas is identical. */
  shell?: BoardShell;
  /**
   * Layout sizing. `viewport` (default) = full browser window; `parent` = fill the host container
   * (use for embeds inside a page that already has chrome).
   */
  fill?: "viewport" | "parent";
  /** Sphere product chrome: inserted before the diagram title (e.g. organization picker). */
  topBarBeforeTitle?: ReactNode;
  /** Sphere product chrome: after save status (e.g. visibility + Library link). */
  topBarAfterStatus?: ReactNode;
  /** Sphere product chrome: between brand and diagram title (e.g. account menu). */
  topBarAfterBrand?: ReactNode;
  /** Fired when dirty (unsaved) state changes - hosts can show leave confirmations. */
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * Browser `beforeunload` warning ("Reload site?"). Default true.
   * Sphere product should set false and use a native Modal + router blocker instead.
   */
  warnOnUnload?: boolean;
  /**
   * Optional host persistence hook. When supplied, Cmd/Ctrl+S passes the
   * current YAML document to the host instead of writing a local file.
   * Return true only after the host has persisted the document successfully.
   */
  onSaveDocument?: (yaml: string) => Promise<boolean>;
  /** Called after a model command changes the document, for host-driven autosave. */
  onDocumentChange?: (yaml: string) => void;
  /** YAML supplied by a host to replace the built-in sample document. */
  initialYaml?: string | null;
  /**
   * Start from an empty Untitled board instead of the Order Platform sample.
   * Ignored when `initialYaml` is supplied (e.g. opening a saved diagram).
   * Sphere should set this for signed-in users on `/`.
   */
  startEmpty?: boolean;
  /**
   * Optional host AI adapter (Sphere product). When set, chat / suggestions /
   * auto-layout call the host instead of mock chrome-data.
   */
  aiAdapter?: BoardAiAdapter | null;
};

export type BoardAiChatResult = {
  reply: string;
  yaml?: string | null;
  suggestions?: string[];
  sessionId?: string | null;
};

export type BoardAiAttachment = {
  name: string;
  mimeType: string;
  kind: "text" | "image";
  content: string;
};

export type BoardAiAdapter = {
  chat: (input: {
    message: string;
    yaml: string;
    selection?: string[];
    sessionId?: string | null;
    attachments?: BoardAiAttachment[];
  }) => Promise<BoardAiChatResult>;
  suggest?: (input: {
    message?: string;
    yaml: string;
  }) => Promise<string[]>;
  layout?: (input: { yaml: string }) => Promise<{
    reply?: string;
    yaml: string;
  }>;
};

export default function BoardApp({
  shell = "scan",
  fill = "viewport",
  topBarBeforeTitle,
  topBarAfterStatus,
  topBarAfterBrand,
  onDirtyChange,
  warnOnUnload = true,
  onSaveDocument,
  onDocumentChange,
  initialYaml,
  startEmpty = false,
  aiAdapter = null,
}: BoardAppProps) {
  const isSphere = shell === "sphere";
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
    newBoard,
    renameElement,
    updateElementIcon,
    addPort,
    updatePort,
    deletePort,
    renameSystem,
    model,
    loadYamlText,
    modeler,
    ready,
  } = board;

  const [selected, setSelected] = useState<string | null>(null);
  const [selectedBoundary, setSelectedBoundary] = useState<string | null>(null);
  const [hoverEdge, setHoverEdge] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState<Point>({ x: 40, y: 20 });
  const [tool, setTool] = useState<"select" | "pan" | "connect" | "create" | "boundary">("select");
  const [createKind, setCreateKind] = useState<CreateKind>("service");
  const [boundaryKind, setBoundaryKind] = useState<"trust" | "runtime">("trust");
  const [showGrid, setShowGrid] = useState(true);
  const [view, setView] = useState<"all" | "external" | "contracts" | "agents">("all");
  /** Dim non-neighbors when a node/edge is selected - reading aid for dense boards. */
  const [focusMode, setFocusMode] = useState(true);
  const [preview, setPreview] = useState(false);
  const [palette, setPalette] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aiAttachments, setAiAttachments] = useState<BoardAiAttachment[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(commandSuggestions);
  const [aiRecentPrompts, setAiRecentPrompts] = useState<string[]>(seedRecentPrompts);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [pendingAi, setPendingAi] = useState<{
    title: string;
    reply: string;
    yaml: string | null;
    baseYaml: string | null;
    /** Original user prompt (for regenerate after truncation/stub). */
    userMessage?: string;
    attachments?: BoardAiAttachment[];
    incomplete?: boolean;
  } | null>(null);
  const [connectFrom, setConnectFrom] = useState<{
    nodeId: string;
    portId?: string;
  } | null>(null);
  const [yamlDragDepth, setYamlDragDepth] = useState(0);
  const [renameModal, setRenameModal] = useState<{ nodeId: string; value: string } | null>(null);
  const [boundaryRenameModal, setBoundaryRenameModal] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ nodeId: string } | null>(null);
  const [diagramNameModal, setDiagramNameModal] = useState<{ value: string } | null>(null);
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
  const dragging = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const resizingBoundary = useRef<{
    id: string;
    handle: ResizeHandle;
    start: { x: number; y: number; w: number; h: number };
    origin: Point;
  } | null>(null);
  const movingBoundary = useRef<{ id: string; ox: number; oy: number } | null>(null);
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
      toast.success("Board saved", {
        description: result.connected
          ? `Saved to disk as ${result.filename}`
          : `Downloaded ${result.filename}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed";
      toast.error("Could not save YAML", { description: message });
    }
  }, [downloadYaml, onSaveDocument, modeler]);

  useEffect(() => {
    setAiRecentPrompts(readStoredRecentPrompts());
  }, []);

  // Keyboard: Cmd+K palette, undo/redo, save, delete
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isSphere && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveYaml();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (!selected) return;
        e.preventDefault();
        try {
          const id = duplicateElement(selected);
          setSelected(id);
          setSelectedEdge(null);
          setSelectedBoundary(null);
          toast.success("Duplicated");
        } catch (err) {
          const message = err instanceof Error ? err.message : "Duplicate failed";
          toast.error("Could not duplicate", { description: message });
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
        if (selected) {
          e.preventDefault();
          deleteElement(selected);
          setSelected(null);
        } else if (selectedBoundary) {
          e.preventDefault();
          try {
            deleteBoundary(selectedBoundary);
            setSelectedBoundary(null);
            toast.success("Boundary deleted");
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
      if (e.key === "Escape") {
        setPalette(false);
        setCtxMenu(null);
        if (tool === "connect") {
          setConnectFrom(null);
          setTool("select");
          toast.message(connectFrom ? "Connect cancelled" : "Connect mode off");
        } else if (tool === "create" || tool === "boundary") {
          setTool("select");
          toast.message("Place cancelled");
        } else {
          setConnectFrom(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    undo,
    redo,
    selected,
    selectedEdge,
    selectedBoundary,
    deleteElement,
    deleteBoundary,
    duplicateElement,
    board,
    connectFrom,
    saveYaml,
    tool,
    groups,
    nodes,
    isSphere,
  ]);

  useEffect(() => {
    if (tool !== "connect") setConnectFrom(null);
  }, [tool]);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  // The modeler mutates its model in place, so `model` retains the same object
  // identity across commands. `historyStep` changes for each command and makes
  // this notification fire reliably without inventing another event channel.
  useEffect(() => {
    if (!onDocumentChange || !model || !dirty) return;
    onDocumentChange(modeler.peekYAML());
  }, [historyStep, model, dirty, onDocumentChange, modeler]);

  const loadedYamlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!ready || !initialYaml) return;
    if (loadedYamlRef.current === initialYaml) return;
    loadedYamlRef.current = initialYaml;
    void loadYamlText(initialYaml);
  }, [ready, initialYaml, loadYamlText]);

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

  const nodeById = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const focusIds = useMemo(() => {
    if (!focusMode) return null;
    const seed = new Set<string>();
    if (selected) seed.add(selected);
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
  }, [focusMode, selected, selectedEdge, hoverEdge, edges]);

  const edgeLabelPositions = useMemo(() => {
    const boxes = nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h }));
    const rough: Array<{ id: string; x: number; y: number }> = [];
    for (const e of edges) {
      if (!e.label) continue;
      const from = nodeById[e.from];
      const to = nodeById[e.to];
      if (!from || !to) continue;
      const a = anchorPoint(from, e.fromSide ?? "r");
      const b = anchorPoint(to, e.toSide ?? "l");
      const p = placeEdgeLabel({
        a,
        b,
        aSide: e.fromSide ?? "r",
        bSide: e.toSide ?? "l",
        nodes: boxes,
      });
      rough.push({ id: e.id, x: p.x, y: p.y });
    }
    const stagger = computeLabelStagger(rough);
    const out = new Map<string, Point>();
    for (const e of edges) {
      if (!e.label) continue;
      const from = nodeById[e.from];
      const to = nodeById[e.to];
      if (!from || !to) continue;
      const a = anchorPoint(from, e.fromSide ?? "r");
      const b = anchorPoint(to, e.toSide ?? "l");
      out.set(
        e.id,
        placeEdgeLabel({
          a,
          b,
          aSide: e.fromSide ?? "r",
          bSide: e.toSide ?? "l",
          nodes: boxes,
          stagger: stagger.get(e.id) ?? 0,
        }),
      );
    }
    return out;
  }, [edges, nodes, nodeById]);

  // Filter based on view + optional focus neighborhood
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

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (tool === "connect") {
      e.stopPropagation();
      // Node body: port-less / fallback node->node wire
      if (!connectFrom) {
        setConnectFrom({ nodeId: id });
        setSelected(id);
        setSelectedEdge(null);
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
      }
      return;
    }
    if (tool !== "select") return;
    e.stopPropagation();
    setSelected(id);
    setSelectedBoundary(null);
    setSelectedEdge(null);
    const n = nodeById[id];
    const w = clientToWorld(e.clientX, e.clientY);
    dragging.current = { id, ox: w.x - n.x, oy: w.y - n.y };
    beginDrag(id);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPortConnect = (nodeId: string, portId: string, role: "expose" | "consume") => {
    // Ports are always interactive: start/finish wiring without requiring the Connect tool first.
    if (!connectFrom) {
      if (role === "expose") {
        setTool("connect");
        setConnectFrom({ nodeId, portId });
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
      setTool("select");
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
    setTool("select");
  };

  const startBoundaryResize = (
    e: React.PointerEvent,
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

  const startBoundaryMove = (e: React.PointerEvent, id: string) => {
    if (tool !== "select" || e.button !== 0) return;
    e.stopPropagation();
    const g = groups.find((x) => x.id === id);
    if (!g) return;
    setSelectedBoundary(id);
    setSelected(null);
    setSelectedEdge(null);
    const w = clientToWorld(e.clientX, e.clientY);
    movingBoundary.current = { id, ox: w.x - g.x, oy: w.y - g.y };
    beginBoundaryMove(id);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const overChrome = (e.target as Element | null)?.closest?.("[data-canvas-chrome]");
    if (rect && !overChrome) {
      lastPointerOnCanvas.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
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
      previewBoundaryMove(
        m.id,
        Math.round((w.x - m.ox) / 4) * 4,
        Math.round((w.y - m.oy) / 4) * 4,
      );
      return;
    }
    if (dragging.current) {
      const d = dragging.current;
      const w = clientToWorld(e.clientX, e.clientY);
      setNodesPreview((prev) =>
        prev.map((n) =>
          n.id === d.id
            ? {
                ...n,
                x: Math.round((w.x - d.ox) / 4) * 4,
                y: Math.round((w.y - d.oy) / 4) * 4,
              }
            : n,
        ),
      );
    }
    if (panning.current) {
      const p = panning.current;
      const next = { x: p.px + (e.clientX - p.sx), y: p.py + (e.clientY - p.sy) };
      panRef.current = next;
      setPan(next);
    }
  };

  const onPointerUp = () => {
    if (resizingBoundary.current) {
      endBoundaryResize();
      resizingBoundary.current = null;
    }
    if (movingBoundary.current) {
      endBoundaryMove();
      movingBoundary.current = null;
    }
    if (dragging.current) {
      endDrag();
    }
    dragging.current = null;
    panning.current = null;
  };

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    if (tool === "create" && e.button === 0) {
      const w = clientToWorld(e.clientX, e.clientY);
      const id = createElement(createKind, Math.round(w.x / 4) * 4, Math.round(w.y / 4) * 4);
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
      const x = Math.round((w.x - bw / 2) / 4) * 4;
      const y = Math.round((w.y - bh / 2) / 4) * 4;
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
      setSelectedBoundary(null);
      setSelectedEdge(null);
      setCtxMenu(null);
      setConnectFrom(null);
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

  const runAutoLayout = useCallback(async () => {
    if (aiAdapter?.layout) {
      setAiBusy(true);
      try {
        const yaml = modeler.peekYAML();
        const result = await aiAdapter.layout({ yaml });
        if (!result.yaml?.trim()) {
          toast.error("Layout agent returned no YAML");
          return;
        }
        setPendingAi({
          title: "Sphere layout proposal",
          reply: result.reply || "Repositioned diagram elements for readability.",
          yaml: result.yaml,
          baseYaml: yaml,
        });
        setAiMenuOpen(false);
        setPreview(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Layout agent failed";
        toast.error("Auto-layout failed", {
          description: message.slice(0, 200),
          action: {
            label: "Copy error",
            onClick: () => void navigator.clipboard.writeText(message),
          },
        });
      } finally {
        setAiBusy(false);
      }
      return;
    }
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
  }, [aiAdapter, autoLayout, fitContent, modeler]);

  const attachAiFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    const unsupported = selected.filter((file) => !isAiAttachmentFile(file));
    if (unsupported.length) {
      toast.error("Unsupported attachment type", {
        description: "Supported: .txt, .md, .jpg, .jpeg, .png",
      });
    }
    const accepted = selected.filter(isAiAttachmentFile).slice(0, 6);
    if (!accepted.length) return;
    const nextAttachments: BoardAiAttachment[] = [];
    for (const file of accepted) {
      const textLike =
        file.type === "text/plain" || file.type === "text/markdown" || /\.(txt|md)$/i.test(file.name);
      const imageLike =
        file.type === "image/png" || file.type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name);
      if (!textLike && !imageLike) continue;
      if (textLike) {
        const text = (await readFileAsText(file)).slice(0, 40000);
        nextAttachments.push({
          name: file.name,
          mimeType: file.type || (file.name.toLowerCase().endsWith(".md") ? "text/markdown" : "text/plain"),
          kind: "text",
          content: text,
        });
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : "";
      if (!base64) continue;
      nextAttachments.push({
        name: file.name,
        mimeType: file.type || "image/png",
        kind: "image",
        content: base64,
      });
    }
    if (!nextAttachments.length) return;
    setAiAttachments((prev) => {
      const merged = [...prev];
      for (const attachment of nextAttachments) {
        const already = merged.some((item) => item.name === attachment.name && item.content === attachment.content);
        if (!already) merged.push(attachment);
      }
      return merged.slice(0, 6);
    });
  }, []);

  const removeAiAttachment = useCallback((name: string) => {
    setAiAttachments((prev) => prev.filter((item) => item.name !== name));
  }, []);

  const submitAiChat = useCallback(async () => {
    const message = prompt.trim();
    if (!message || aiBusy) return;
    setAiRecentPrompts((prev) => rememberRecentPrompt(prev, message));
    if (!aiAdapter?.chat) {
      setPendingAi({
        title: previewChanges.title,
        reply: "Mock preview (no AI adapter). Wire Sphere agents to apply real changes.",
        yaml: null,
        baseYaml: modeler.peekYAML(),
      });
      setPreview(true);
      return;
    }
    setAiBusy(true);
    try {
      const yaml = modeler.peekYAML();
      const selection = selected ? [selected] : undefined;
      const result = await aiAdapter.chat({
        message,
        yaml,
        selection,
        sessionId: aiSessionId,
        attachments: aiAttachments,
      });
      if (result.sessionId) setAiSessionId(result.sessionId);
      // Stick to the latest turn's chips until the next user prompt.
      if (result.suggestions?.length) setAiSuggestions(result.suggestions);
      const incomplete =
        !result.yaml &&
        /truncated|incomplete stub|incomplete SCAN|starting point|Regenerate/i.test(
          result.reply || "",
        );
      setPendingAi({
        title: result.yaml
          ? "Sphere proposes diagram changes"
          : incomplete
            ? "Incomplete agent response"
            : "Sphere reply",
        reply: result.reply || "Done.",
        yaml: result.yaml ?? null,
        baseYaml: yaml,
        userMessage: message,
        attachments: [...aiAttachments],
        incomplete,
      });
      // Keep attachments when incomplete so Regenerate can resend the image.
      if (!incomplete) setAiAttachments([]);
      setPrompt("");
      setAiMenuOpen(false);
      setPreview(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Agent request failed";
      toast.error("Sphere AI failed", {
        description: msg.slice(0, 200),
        action: {
          label: "Copy error",
          onClick: () => void navigator.clipboard.writeText(msg),
        },
      });
    } finally {
      setAiBusy(false);
    }
  }, [aiAdapter, aiAttachments, aiBusy, aiSessionId, modeler, prompt, selected]);

  const applyPendingAi = useCallback(async () => {
    const yaml = pendingAi?.yaml;
    if (!yaml?.trim()) {
      setPreview(false);
      setPendingAi(null);
      setAiMenuOpen(false);
      return;
    }
    try {
      // Fail fast with the same checks as the diagram preview.
      parseScanYaml(yaml);
      await loadYamlText(yaml);
      requestAnimationFrame(() => fitContent());
      setPreview(false);
      setPendingAi(null);
      setPrompt("");
      setAiMenuOpen(false);
      toast.success("Applied Sphere changes");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load YAML";
      toast.error("Apply failed", {
        description: message,
        action: {
          label: "Copy error",
          onClick: () => void navigator.clipboard.writeText(message),
        },
      });
    }
  }, [fitContent, loadYamlText, pendingAi]);

  const regenerateAiFix = useCallback(
    async (validationError: string) => {
      if (aiBusy) return;
      if (!aiAdapter?.chat) {
        toast.error("AI adapter unavailable");
        return;
      }
      const baseYaml = pendingAi?.baseYaml ?? modeler.peekYAML();
      const brokenYaml = pendingAi?.yaml?.trim() ?? "";
      const prior = (pendingAi?.userMessage ?? "").trim();
      const attachments = pendingAi?.attachments?.length
        ? pendingAi.attachments
        : aiAttachments;
      const message = brokenYaml
        ? [
            "The SCAN YAML you proposed failed validation and cannot be previewed or applied.",
            `Validation errors: ${validationError}`,
            "",
            "Return a corrected **complete** document. Prefer JSON with `yaml: null` plus a separate ```yaml fence.",
            "Fix schema issues; preserve intended architecture and ids when possible.",
            "Every component/external_system/channel/agent/repository needs a string `name`.",
            "",
            "Invalid YAML to fix:",
            "```yaml",
            brokenYaml.slice(0, 14000),
            "```",
          ].join("\n")
        : [
            "Your previous response was incomplete or truncated. Return the **full** SCAN diagram now.",
            prior ? `Original user request:\n${prior}` : "",
            validationError ? `Context: ${validationError}` : "",
            "Prefer JSON metadata (`yaml: null`) plus a separate ```yaml fence with the complete document.",
            "Include all boundaries, components, and main connections from any attached image. No stubs.",
          ]
            .filter(Boolean)
            .join("\n\n");

      setAiBusy(true);
      try {
        const result = await aiAdapter.chat({
          message,
          yaml: baseYaml,
          sessionId: aiSessionId,
          attachments,
        });
        if (result.sessionId) setAiSessionId(result.sessionId);
        if (result.suggestions?.length) setAiSuggestions(result.suggestions);
        const incomplete =
          !result.yaml &&
          /truncated|incomplete stub|incomplete SCAN|starting point|Regenerate/i.test(
            result.reply || "",
          );
        setPendingAi({
          title: result.yaml
            ? "Sphere proposes diagram changes"
            : incomplete
              ? "Incomplete agent response"
              : "Sphere reply",
          reply: result.reply || "Regenerated.",
          yaml: result.yaml ?? null,
          baseYaml,
          userMessage: prior || pendingAi?.userMessage,
          attachments,
          incomplete,
        });
        if (!incomplete) setAiAttachments([]);
        setPreview(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Agent request failed";
        toast.error("Regenerate failed", {
          description: msg.slice(0, 200),
          action: {
            label: "Copy error",
            onClick: () => void navigator.clipboard.writeText(msg),
          },
        });
      } finally {
        setAiBusy(false);
      }
    },
    [aiAdapter, aiAttachments, aiBusy, aiSessionId, modeler, pendingAi],
  );

  const zoomIn = () => zoomAt(zoomRef.current + 0.15, lastPointerOnCanvas.current);
  const zoomOut = () => zoomAt(zoomRef.current - 0.15, lastPointerOnCanvas.current);


  const openContextMenu = (e: React.MouseEvent, id: string) => {
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
        shell={shell}
        systemName={systemName}
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
        onPalette={() => setPalette(true)}
        onDownloadYaml={() => void saveYaml()}
        onImportYaml={() => fileInputRef.current?.click()}
        onExportSvg={() => {
          void exportSvg()
            .then((r) => toast.success("Exported SVG", { description: r.filename }))
            .catch((err) =>
              toast.error("SVG export failed", {
                description: err instanceof Error ? err.message : "Export failed",
              }),
            );
        }}
        onExportPng={() => {
          void exportPng()
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

      {isSphere && (
        <AIBar
          prompt={prompt}
          setPrompt={setPrompt}
          busy={aiBusy}
          suggestions={aiSuggestions}
          recent={aiRecentPrompts}
          attachments={aiAttachments}
          menuOpen={aiMenuOpen}
          onMenuOpenChange={setAiMenuOpen}
          onSubmit={() => void submitAiChat()}
          onAttachFiles={(files) => void attachAiFiles(files)}
          onRemoveAttachment={removeAiAttachment}
        />
      )}

      {/* VIEW TABS - shared SCAN board chrome */}
      <ViewTabs
        view={view}
        setView={setView}
        onAutoLayout={() => void runAutoLayout()}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((v) => !v)}
        nodes={nodes}
        groups={groups}
      />

      {/* MAIN CANVAS */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={canvasRef}
          className={`absolute inset-0 ${showGrid ? "dot-grid" : "bg-canvas"} ${
            tool === "pan"
              ? "cursor-grab"
              : tool === "connect"
                ? "cursor-pointer"
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
              const selectedGroup = selectedBoundary === g.id;
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
                        setSelectedBoundary(g.id);
                        setSelected(null);
                        setSelectedEdge(null);
                      }}
                    >
                      <ElementIcon
                        icon={g.icon}
                        Fallback={g.kind === "runtime" ? Bot : Shield}
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
                const a = anchorPoint(from, e.fromSide ?? "r");
                const b = anchorPoint(to, e.toSide ?? "l");
                const s = edgeStyle(e.kind);
                const active = hoverEdge === e.id || selectedEdge === e.id;
                const faded = edgeDimmed(e) && !active;
                const marker =
                  e.kind === "flow" || e.kind === "db"
                    ? "url(#arrow-agent)"
                    : e.kind === "async" || e.kind === "stream"
                      ? "url(#arrow-event)"
                      : "url(#arrow)";
                return (
                  <g key={e.id} className="pointer-events-auto">
                    <path
                      d={edgePath(a, b, e.fromSide ?? "r", e.toSide ?? "l")}
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
            </svg>

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
                  className={`absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-stretch gap-1 ${
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
            {nodes.map((n) => (
              <NodeCard
                key={n.id}
                node={n}
                selected={selected === n.id}
                connectSource={connectFrom?.nodeId === n.id}
                connectSourcePortId={
                  connectFrom?.nodeId === n.id ? connectFrom.portId : undefined
                }
                connectMode={tool === "connect" || Boolean(connectFrom)}
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
                  if (tool === "connect") return;
                  setSelected(n.id);
                  setSelectedEdge(null);
                }}
              />
            ))}
          </div>
        </div>

        {(tool === "connect" || connectFrom) && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-surface/95 px-4 py-2 text-xs shadow-lg backdrop-blur">
            <Pointer className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">
              {connectFrom
                ? `Source: ${nodeById[connectFrom.nodeId]?.title ?? connectFrom.nodeId}${
                    connectFrom.portId ? ` · ${connectFrom.portId}` : ""
                  } - click a consume port (or node)`
                : "Click an expose port (or node) to start"}
            </span>
            <span className="text-muted-foreground">Esc to cancel</span>
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
              {boundaryKind === "trust" ? "Trust Boundary" : "Agent Runtime"}
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
            onPickCreate={(kind) => {
              setCreateKind(kind);
              setTool("create");
            }}
            onPickBoundary={(kind) => {
              setBoundaryKind(kind);
              setTool("boundary");
            }}
          />
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
        <ValidationToast productAi={isSphere} />

        {/* INSPECTOR */}
        {(selNode || selEdge || selBoundary) && (
          <Inspector
            shell={shell}
            node={selNode ?? null}
            edge={selEdge ?? null}
            group={selBoundary}
            nodes={nodes}
            edges={edges}
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
          description="This name is stored on the system and used for SCAN / SVG / PNG exports."
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
                  renameSystem(diagramNameModal.value.trim());
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
                  renameSystem(diagramNameModal.value.trim());
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

        {/* PREVIEW DRAWER / COMMAND PALETTE - Sphere product chrome */}
        {isSphere && preview && (
          <PreviewDrawer
            title={pendingAi?.title ?? previewChanges.title}
            reply={pendingAi?.reply ?? ""}
            yaml={pendingAi?.yaml ?? null}
            baseYaml={pendingAi?.baseYaml ?? null}
            hasYaml={Boolean(pendingAi?.yaml)}
            incomplete={Boolean(pendingAi?.incomplete)}
            busy={aiBusy}
            onCancel={() => {
              if (aiBusy) return;
              setPreview(false);
              setPendingAi(null);
              setAiMenuOpen(false);
            }}
            onApply={() => void applyPendingAi()}
            onRegenerate={(error) => void regenerateAiFix(error)}
          />
        )}
        {isSphere && palette && (
          <CommandPalette
            onClose={() => setPalette(false)}
            onCreateComponent={(kind) => {
              try {
                const worldCenter = {
                  x: (canvasSize.w / 2 - panRef.current.x) / zoomRef.current,
                  y: (canvasSize.h / 2 - panRef.current.y) / zoomRef.current,
                };
                const id = createElement(
                  kind,
                  Math.round(worldCenter.x / 4) * 4,
                  Math.round(worldCenter.y / 4) * 4,
                );
                setSelected(id);
                setSelectedEdge(null);
                setSelectedBoundary(null);
                setPalette(false);
                toast.success(`${createKindHints[kind].label} added`, {
                  description: "Placed at canvas center. Drag to reposition.",
                });
              } catch (err) {
                const message = err instanceof Error ? err.message : "Could not add component";
                toast.error("Create failed", { description: message });
              }
            }}
          />
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

/* ------------------------- TOP BAR ------------------------- */

function TopBar({
  shell,
  systemName,
  topBarBeforeTitle,
  topBarAfterStatus,
  topBarAfterBrand,
  canUndo,
  canRedo,
  dirty,
  onUndo,
  onRedo,
  onNewBoard,
  onRenameDiagram,
  onPalette,
  onDownloadYaml,
  onImportYaml,
  onExportSvg,
  onExportPng,
}: {
  shell: BoardShell;
  systemName: string;
  topBarBeforeTitle?: ReactNode;
  topBarAfterStatus?: ReactNode;
  topBarAfterBrand?: ReactNode;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewBoard: () => void;
  onRenameDiagram: () => void;
  onPalette: () => void;
  onDownloadYaml: () => void;
  onImportYaml: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}) {
  const isSphere = shell === "sphere";
  const [coworkOpen, setCoworkOpen] = useState(false);
  return (
    <div
      className={`flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 ${
        isSphere ? "h-14" : "h-12"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isSphere && <AiOrb />}
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              {isSphere ? "Sphere" : "SCAN"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isSphere ? "Architecture Whiteboard" : "Notation modeler"}
            </div>
          </div>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        {topBarAfterBrand ? (
          <>
            {topBarAfterBrand}
            <div className="mx-2 h-6 w-px bg-border" />
          </>
        ) : null}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {topBarBeforeTitle}
          <button
            type="button"
            onClick={onRenameDiagram}
            title="Rename diagram"
            className="rounded-md px-2 py-1 font-medium text-foreground hover:bg-muted"
          >
            {systemName}
          </button>
          {!isSphere && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 ${
                dirty ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"
              }`}
              title={dirty ? "Unsaved local changes" : "All changes saved"}
            >
              {dirty ? (
                <>
                  <Circle className="h-2.5 w-2.5 fill-current" /> Unsaved
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" /> Saved
                </>
              )}
            </span>
          )}
          {topBarAfterStatus}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          <IconBtn label="Undo" onClick={onUndo} variant="ghost" disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Redo" onClick={onRedo} variant="ghost" disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </IconBtn>
          <div className="mx-1 h-5 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Board & export"
                aria-label="Board & export"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem onSelect={onNewBoard}>
                <FilePlus2 className="h-4 w-4" />
                New board
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onImportYaml}>
                <Upload className="h-4 w-4" />
                Import YAML
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDownloadYaml}>
                <Download className="h-4 w-4" />
                Save YAML
                <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onExportSvg}>
                <FileCode2 className="h-4 w-4" />
                Export SVG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportPng}>
                <ImageIcon className="h-4 w-4" />
                Export PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isSphere && (
          <>
            <button
              onClick={onPalette}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <Search className="h-3.5 w-3.5" /> Search components, contracts...
              <span className="ml-2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                <CommandIcon className="h-3 w-3" /> K
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCoworkOpen(true)}
              title="Collaboration coming soon"
              className="flex -space-x-2 rounded-md p-0.5 hover:bg-muted"
            >
              {["EM", "JR", "AN"].map((i, idx) => (
                <div
                  key={i}
                  className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-surface"
                  style={{
                    background: ["var(--svc)", "var(--agent)", "var(--event)"][idx],
                  }}
                >
                  {i}
                </div>
              ))}
            </button>
            <button
              type="button"
              onClick={() => setCoworkOpen(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              title="Collaboration coming soon"
            >
              Share
            </button>
          </>
        )}
      </div>

      <Modal
        open={coworkOpen}
        onClose={() => setCoworkOpen(false)}
        title="Co-work coming soon"
        description="Realtime sharing and editing with teammates is on the way. For now, save diagrams to your organization and open them from the Library."
        tone="info"
        size="sm"
        actions={[
          {
            label: "Got it",
            variant: "primary",
            onClick: () => setCoworkOpen(false),
            autoFocus: true,
          },
        ]}
      />
    </div>
  );
}

/* ------------------------- AI BAR ------------------------- */

function AiOrb() {
  return <div className="ai-orb-minimal h-7 w-7 rounded-full" />;
}

function AIBar({
  prompt,
  setPrompt,
  onSubmit,
  busy = false,
  suggestions,
  recent,
  attachments,
  onAttachFiles,
  onRemoveAttachment,
  menuOpen,
  onMenuOpenChange,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  suggestions: string[];
  recent: string[];
  attachments: BoardAiAttachment[];
  onAttachFiles: (files: FileList | null) => void;
  onRemoveAttachment: (name: string) => void;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}) {
  const attachInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className={`mx-auto flex w-full max-w-5xl items-center gap-2 px-4 ${attachments.length ? "pb-10 pt-3" : "py-3"}`}>
        <div className="relative flex flex-1 items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 node-shadow focus-within:ring-2 focus-within:ring-primary/30">
          <Sparkles className="h-4 w-4 text-primary" />

          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => onMenuOpenChange(true)}
            onBlur={() => setTimeout(() => onMenuOpenChange(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && prompt.trim() && !busy) {
                onMenuOpenChange(false);
                inputRef.current?.blur();
                onSubmit();
              }
              if (e.key === "Escape") {
                onMenuOpenChange(false);
                inputRef.current?.blur();
              }
            }}
            disabled={busy}
            placeholder="Ask Sphere to design or modify this architecture..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <IconBtn label="Attach reference" onClick={() => attachInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </IconBtn>
          <input
            ref={attachInputRef}
            type="file"
            accept=".txt,.md,.png,.jpg,.jpeg,text/plain,text/markdown,image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => {
              onAttachFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <IconBtn label="Voice input">
            <Mic className="h-4 w-4" />
          </IconBtn>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-[10px] font-medium">
            <input type="checkbox" defaultChecked className="h-3 w-3 accent-primary" />
            Preview changes
          </label>
          <button
            onClick={() => {
              if (!prompt.trim() || busy) return;
              onMenuOpenChange(false);
              inputRef.current?.blur();
              onSubmit();
            }}
            disabled={busy || !prompt.trim()}
            className="ml-1 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {busy ? "Thinking…" : "Send"}
          </button>

          {attachments.length > 0 && (
            <div className="absolute -bottom-9 left-2 right-2 flex flex-wrap gap-1">
              {attachments.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => onRemoveAttachment(file.name)}
                  className="max-w-[220px] truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  title={`Remove ${file.name}`}
                >
                  {file.kind === "image" ? "img" : "doc"}: {file.name} ×
                </button>
              ))}
            </div>
          )}

          {menuOpen && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg">
              <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Suggested commands
              </div>
              <div className="max-h-60 overflow-auto py-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => setPrompt(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </div>
              <div className="pb-2">
                {recent.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No recent prompts yet</div>
                ) : (
                  recent.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => setPrompt(s)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
                    >
                      <HistoryIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{s}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- VIEW TABS ------------------------- */

function ViewTabs({
  view,
  setView,
  onAutoLayout,
  focusMode,
  onToggleFocusMode,
  nodes,
  groups,
}: {
  view: "all" | "external" | "contracts" | "agents";
  setView: (v: "all" | "external" | "contracts" | "agents") => void;
  onAutoLayout: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  nodes: SphereNode[];
  groups: SphereGroup[];
}) {
  const externalCount = nodes.filter((n) => n.kind === "external").length;
  const agentCount = nodes.filter((n) => n.kind === "agent").length;
  const contractWarn = nodes.filter((n) => n.status === "warn").length;
  const allCount = nodes.length + groups.length;

  const tabs = [
    { id: "all" as const, label: "All Systems", icon: Layers, count: allCount },
    {
      id: "external" as const,
      label: "External Integrations",
      icon: Building2Icon,
      count: externalCount,
    },
    {
      id: "contracts" as const,
      label: "Contracts",
      icon: FileCode2,
      count: nodes.length,
      warn: contractWarn,
    },
    {
      id: "agents" as const,
      label: "Agent Runtime",
      icon: Bot,
      count: agentCount,
    },
  ];
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-1.5">
      <div className="flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === t.id
                ? "bg-surface text-foreground hairline"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
              {t.count}
            </span>
            {"warn" in t && t.warn ? (
              <span className="flex items-center gap-1 rounded-full bg-warn-soft px-1.5 py-0.5 text-[10px] text-warn">
                <AlertTriangle className="h-2.5 w-2.5" />
                {t.warn}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
          <Filter className="h-3.5 w-3.5" /> Filters
        </button>
        <button
          type="button"
          onClick={onToggleFocusMode}
          title="Dim nodes and edges outside the selection neighborhood"
          className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-muted ${
            focusMode
              ? "bg-surface text-foreground hairline"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Locate className="h-3.5 w-3.5" /> Focus
        </button>
        <button
          type="button"
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Grid3x3 className="h-3.5 w-3.5" /> Auto-layout
        </button>
      </div>
    </div>
  );
}

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return <Boxes {...props} />;
}

/* ------------------------- NODE ------------------------- */

/** Thin iOS-style overlay scrollbar (native bar hidden; pill fades after idle). */
function SoftScrollArea({
  className,
  children,
  onPointerDown,
  onWheel,
}: {
  className?: string;
  children: ReactNode;
  onPointerDown?: (e: React.PointerEvent) => void;
  onWheel?: (e: React.WheelEvent) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, height: 0, show: false, needed: false });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncThumb = useCallback((flash: boolean) => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const needed = scrollHeight > clientHeight + 1;
    if (!needed) {
      setThumb({ top: 0, height: 0, show: false, needed: false });
      return;
    }
    const height = Math.max(18, (clientHeight / scrollHeight) * clientHeight);
    const maxTop = Math.max(0, clientHeight - height);
    const top =
      maxTop === 0 ? 0 : (scrollTop / (scrollHeight - clientHeight)) * maxTop;
    setThumb((t) => ({
      top,
      height,
      needed: true,
      show: flash ? true : t.show,
    }));
    if (flash) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setThumb((t) => ({ ...t, show: false }));
      }, 900);
    }
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const run = () => syncThumb(false);
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    const content = el.firstElementChild;
    if (content) ro.observe(content);
    return () => {
      ro.disconnect();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [syncThumb, children]);

  return (
    <div
      className={`relative min-h-0 overflow-hidden ${className ?? ""}`}
      onMouseEnter={() => syncThumb(true)}
    >
      <div
        ref={scrollerRef}
        tabIndex={-1}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none focus:outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={onPointerDown}
        onWheel={onWheel}
        onScroll={() => syncThumb(true)}
      >
        {children}
      </div>
      {thumb.needed && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-1 right-0.5 z-[2] w-[3px]"
        >
          <div
            className="absolute left-0 w-full rounded-full bg-foreground/35 transition-opacity duration-300 ease-out"
            style={{
              height: thumb.height,
              transform: `translateY(${thumb.top}px)`,
              opacity: thumb.show ? 1 : 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

function NodePortsColumns({
  node,
  connectSourcePortId,
  onPortPointerDown,
}: {
  node: SphereNode;
  connectSourcePortId?: string;
  onPortPointerDown?: (
    e: React.PointerEvent,
    portId: string,
    role: "expose" | "consume",
  ) => void;
}) {
  const consumes = node.consumes ?? [];
  const exposes = node.exposes ?? [];
  const isDb = node.kind === "database";

  if (!consumes.length && !exposes.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-1 text-[10px]">
      <div className="min-w-0">
        {consumes.length > 0 && (
          <>
            <div
              className={`sticky top-0 z-[1] mb-1 pb-0.5 font-semibold uppercase tracking-wider text-muted-foreground ${
                isDb ? "bg-transparent" : "bg-surface/95 backdrop-blur-[2px]"
              }`}
            >
              Consumes
            </div>
            {consumes.map((p) => (
              <button
                key={p.id}
                type="button"
                title={`${p.label}${p.protocol ? ` (${p.protocol})` : ""} - click to select wire or finish connect`}
                className="flex w-full cursor-pointer items-center gap-1.5 rounded py-0.5 text-left outline-none hover:bg-muted focus:outline-none focus-visible:outline-none"
                onPointerDown={(e) => onPortPointerDown?.(e, p.id, "consume")}
              >
                <Circle
                  className="h-2 w-2 shrink-0 fill-none"
                  style={{ color: kindColorVar[node.kind] }}
                />
                <span className="truncate font-medium">{p.label}</span>
                {p.protocol && (
                  <span className="truncate text-muted-foreground">({p.protocol})</span>
                )}
              </button>
            ))}
          </>
        )}
      </div>
      <div className="min-w-0 text-right">
        {exposes.length > 0 && (
          <>
            <div
              className={`sticky top-0 z-[1] mb-1 pb-0.5 font-semibold uppercase tracking-wider text-muted-foreground ${
                isDb ? "bg-transparent" : "bg-surface/95 backdrop-blur-[2px]"
              }`}
            >
              Exposes
            </div>
            {exposes.map((p) => (
              <button
                key={p.id}
                type="button"
                title={`${p.label}${p.protocol ? ` (${p.protocol})` : ""} - click to start a connection`}
                className={`flex w-full cursor-pointer items-center justify-end gap-1.5 rounded py-0.5 outline-none hover:bg-muted focus:outline-none focus-visible:outline-none ${
                  connectSourcePortId === p.id
                    ? "bg-primary/15 ring-1 ring-primary/40"
                    : ""
                }`}
                onPointerDown={(e) => onPortPointerDown?.(e, p.id, "expose")}
              >
                <span className="truncate font-medium">{p.label}</span>
                {p.protocol && (
                  <span className="truncate text-muted-foreground">({p.protocol})</span>
                )}
                <Circle
                  className="h-2 w-2 shrink-0 fill-current"
                  style={{ color: kindColorVar[node.kind] }}
                />
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function NodeCard({
  node,
  selected,
  connectSource,
  connectSourcePortId,
  dim,
  highlight,
  onPointerDown,
  onContextMenu,
  onPortPointerDown,
  onClick,
}: {
  node: SphereNode;
  selected: boolean;
  connectSource?: boolean;
  connectSourcePortId?: string;
  connectMode?: boolean;
  dim: boolean;
  highlight: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onPortPointerDown?: (
    e: React.PointerEvent,
    portId: string,
    role: "expose" | "consume",
  ) => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const meta = kindMeta[node.kind];
  const isDb = node.kind === "database";
  const emphasized = Boolean(connectSource || selected);
  const consumes = node.consumes ?? [];
  const exposes = node.exposes ?? [];
  const hasPorts = consumes.length > 0 || exposes.length > 0;

  return (
    <div
      className={`absolute z-[1] select-none transition-opacity ${dim ? "opacity-30" : ""}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      {isDb && (
        <DbCylinder
          width={node.w}
          height={node.h}
          color={kindColorVar[node.kind]}
          selected={emphasized}
        />
      )}
      <div
        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl ${
          isDb
            ? `bg-transparent ${
                connectSource
                  ? "outline outline-2 outline-offset-2 outline-primary"
                  : highlight
                    ? "outline outline-2 outline-offset-2 outline-[var(--warn)]"
                    : ""
              }`
            : `border-2 bg-surface node-shadow ${
                connectSource
                  ? "ring-4 ring-primary/40 node-shadow-lg outline outline-2 outline-offset-2 outline-primary"
                  : selected
                    ? "ring-4 ring-primary/25 node-shadow-lg"
                    : ""
              } ${highlight && !connectSource ? "ring-2 ring-warn" : ""}`
        }`}
        style={
          isDb
            ? undefined
            : {
                borderColor: emphasized
                  ? kindColorVar[node.kind]
                  : `color-mix(in oklab, ${kindColorVar[node.kind]} 45%, transparent)`,
              }
        }
      >
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pt-3">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${meta.soft}`}
            >
              <ElementIcon
                icon={node.icon}
                Fallback={meta.Icon}
                className={`h-4 w-4 ${meta.color}`}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{node.title}</div>
              {node.subtitle && (
                <div className="truncate text-[11px] text-muted-foreground">{node.subtitle}</div>
              )}
            </div>
          </div>
          <button
            type="button"
            title={node.repoUrl ? `Open ${node.repo}` : node.repo ? node.repo : "No repository"}
            className={`shrink-0 rounded p-0.5 outline-none focus:outline-none ${
              node.repoUrl
                ? "cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-muted"
                : "pointer-events-none opacity-0"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (node.repoUrl) openExternal(node.repoUrl);
            }}
          >
            <Github className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {hasPorts ? (
          <SoftScrollArea
            className="mt-2 flex-1"
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            <NodePortsColumns
              node={node}
              connectSourcePortId={connectSourcePortId}
              onPortPointerDown={onPortPointerDown}
            />
          </SoftScrollArea>
        ) : (
          <div className="min-h-0 flex-1" />
        )}

        {node.tech && (
          <div className="mt-auto flex shrink-0 items-center justify-between px-3 pb-2.5 pt-1.5">
            {node.status === "warn" ? (
              <span className="flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn">
                <AlertTriangle className="h-2.5 w-2.5" /> Missing contract
              </span>
            ) : (
              <span />
            )}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `color-mix(in oklab, ${kindColorVar[node.kind]} 10%, transparent)`,
                color: kindColorVar[node.kind],
              }}
            >
              {node.tech}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function DbCylinder({
  width,
  height,
  color,
  selected,
}: {
  width: number;
  height: number;
  color: string;
  selected: boolean;
}) {
  const rx = Math.max(8, width / 2 - 10);
  const ry = Math.min(14, height * 0.12);
  const cx = width / 2;
  const topY = ry + 2;
  const bottomY = height - ry - 2;
  const stroke = selected ? color : `color-mix(in oklab, ${color} 55%, transparent)`;

  return (
    <svg
      className="absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      style={{ pointerEvents: "none" }}
    >
      <path
        d={`M ${cx - rx} ${topY} L ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY} L ${cx + rx} ${topY} A ${rx} ${ry} 0 0 1 ${cx - rx} ${topY}`}
        fill="white"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      {[0.28, 0.52, 0.76].map((t) => {
        const y = topY + (bottomY - topY) * t;
        return (
          <path
            key={t}
            d={`M ${cx - rx} ${y} A ${rx} ${ry} 0 0 0 ${cx + rx} ${y}`}
            stroke={`color-mix(in oklab, ${color} 30%, transparent)`}
            strokeWidth={1}
            fill="none"
          />
        );
      })}
      <ellipse
        cx={cx}
        cy={bottomY}
        rx={rx}
        ry={ry}
        fill="white"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        fill="white"
        stroke={stroke}
        strokeWidth={selected ? 2.5 : 1.5}
      />
    </svg>
  );
}

/* ------------------------- INSPECTOR ------------------------- */

function Inspector({
  shell,
  node,
  edge,
  group,
  nodes,
  edges,
  onClose,
  onUpdateConnection,
  onUpdateBoundary,
  onUpdateElementIcon,
  onAddPort,
  onUpdatePort,
  onDeletePort,
  onDeleteBoundary,
  onRenameBoundary,
  onSelectEdge,
  onSelectNode,
}: {
  shell: BoardShell;
  node: SphereNode | null;
  edge: SphereEdge | null;
  group: SphereGroup | null;
  nodes: SphereNode[];
  edges: SphereEdge[];
  onClose: () => void;
  onUpdateConnection: (
    id: string,
    patch: {
      label?: string | null;
      contract?: string | null;
      operations?: string[] | null;
    },
  ) => void;
  onUpdateBoundary: (
    id: string,
    patch: {
      label?: string | null;
      tag?: string | null;
      kind?: "trust" | "runtime";
      icon?: string | null;
      color?: BoundaryColor | null;
    },
  ) => void;
  onUpdateElementIcon: (id: string, icon: string | null) => void;
  onAddPort: (id: string, role: "consume" | "expose") => void;
  onUpdatePort: (
    id: string,
    portId: string,
    patch: { label?: string | null; protocol?: string | null },
  ) => void;
  onDeletePort: (id: string, portId: string) => void;
  onDeleteBoundary: (id: string) => void;
  onRenameBoundary: (id: string) => void;
  onSelectEdge: (id: string) => void;
  onSelectNode: (id: string) => void;
}) {
  const nodeById = useMemo(() => {
    const map: Record<string, SphereNode> = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  return (
    <div className="absolute right-4 top-4 z-20 flex h-[calc(100%-2rem)] w-[340px] flex-col overflow-hidden rounded-2xl border border-border bg-surface node-shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Inspector
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>

      {group && !node && !edge && (
        <BoundaryInspector
          group={group}
          nodes={nodes}
          onUpdate={onUpdateBoundary}
          onDelete={onDeleteBoundary}
          onRename={onRenameBoundary}
          onSelectNode={onSelectNode}
        />
      )}
      {node && (
        <NodeInspector
          productAi={shell === "sphere"}
          node={node}
          edges={edges}
          nodeById={nodeById}
          onSelectEdge={onSelectEdge}
          onUpdateIcon={onUpdateElementIcon}
          onAddPort={onAddPort}
          onUpdatePort={onUpdatePort}
          onDeletePort={onDeletePort}
        />
      )}
      {edge && !node && !group && (
        <EdgeInspector
          edge={edge}
          nodeById={nodeById}
          onUpdate={onUpdateConnection}
        />
      )}
    </div>
  );
}

function BoundaryInspector({
  group,
  nodes,
  onUpdate,
  onDelete,
  onRename,
  onSelectNode,
}: {
  group: SphereGroup;
  nodes: SphereNode[];
  onUpdate: (
    id: string,
    patch: {
      label?: string | null;
      tag?: string | null;
      kind?: "trust" | "runtime";
      icon?: string | null;
      color?: BoundaryColor | null;
    },
  ) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onSelectNode: (id: string) => void;
}) {
  const [label, setLabel] = useState(group.title);
  const [tag, setTag] = useState(group.tag ?? "");
  const [kind, setKind] = useState<"trust" | "runtime">(group.kind ?? "trust");
  const [iconOpen, setIconOpen] = useState(false);

  useEffect(() => {
    setLabel(group.title);
    setTag(group.tag ?? "");
    setKind(group.kind ?? "trust");
  }, [group.id, group.title, group.tag, group.kind]);

  const members = (group.members ?? [])
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is SphereNode => Boolean(n));

  const dirty =
    label.trim() !== group.title ||
    (tag.trim() || undefined) !== (group.tag || undefined) ||
    kind !== (group.kind ?? "trust");

  const Fallback = kind === "runtime" ? Bot : Shield;
  const softClass = kind === "runtime" ? "bg-agent-soft" : "bg-svc-soft";
  const colorClass = kind === "runtime" ? "text-agent" : "text-svc";

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            title="Change icon"
            onClick={() => setIconOpen(true)}
            className={`grid h-10 w-10 place-items-center rounded-lg ring-offset-2 transition hover:ring-2 hover:ring-primary/30 ${softClass}`}
          >
            <ElementIcon
              icon={group.icon}
              Fallback={Fallback}
              className={`h-5 w-5 ${colorClass}`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{group.title}</div>
            <div className="text-[11px] text-muted-foreground">
              {kind === "runtime" ? "Runtime boundary" : "Trust boundary"}
              <span className="text-muted-foreground/80"> · click icon to change</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRename(group.id)}
            className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            F2
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <Section title="Name">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            placeholder="Boundary name"
          />
        </Section>

        <Section title="Kind">
          <div className="flex gap-2">
            {(["trust", "runtime"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium capitalize ${
                  kind === k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Color">
          <div className="flex flex-wrap gap-2">
            {BOUNDARY_COLORS.map((token) => {
              const meta = boundaryColorMeta[token];
              const selected = group.color === token;
              return (
                <button
                  key={token}
                  type="button"
                  title={meta.label}
                  aria-label={meta.label}
                  aria-pressed={selected}
                  onClick={() => onUpdate(group.id, { color: token })}
                  className={`h-7 w-7 rounded-full transition ${
                    selected
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: meta.hex }}
                />
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {boundaryColorMeta[group.color].label}
          </p>
        </Section>

        <Section title="Tag">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            placeholder="e.g. Trust Boundary"
          />
        </Section>

        <Section title={`Members (${members.length})`}>
          {members.length ? (
            <div className="space-y-1">
              {members.map((n) => {
                const meta = kindMeta[n.kind];
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onSelectNode(n.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <ElementIcon
                      icon={n.icon}
                      Fallback={meta.Icon}
                      className={`h-3.5 w-3.5 ${meta.color}`}
                    />
                    <span className="truncate">{n.title}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No members yet. Resize so component centers fall inside the box.
            </p>
          )}
        </Section>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty || !label.trim()}
            onClick={() =>
              onUpdate(group.id, {
                label: label.trim(),
                tag: tag.trim() || null,
                kind,
              })
            }
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => onDelete(group.id)}
            className="rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      </div>

      <IconPickerModal
        open={iconOpen}
        onClose={() => setIconOpen(false)}
        title="Boundary icon"
        currentIcon={group.icon}
        fallbackIcon={Fallback}
        softClass={softClass}
        colorClass={colorClass}
        onSave={(icon) => onUpdate(group.id, { icon })}
      />
    </div>
  );
}

function NodeInspector({
  productAi = false,
  node,
  edges,
  nodeById,
  onSelectEdge,
  onUpdateIcon,
  onAddPort,
  onUpdatePort,
  onDeletePort,
}: {
  productAi?: boolean;
  node: SphereNode;
  edges: SphereEdge[];
  nodeById: Record<string, SphereNode>;
  onSelectEdge: (id: string) => void;
  onUpdateIcon: (id: string, icon: string | null) => void;
  onAddPort: (id: string, role: "consume" | "expose") => void;
  onUpdatePort: (
    id: string,
    portId: string,
    patch: { label?: string | null; protocol?: string | null },
  ) => void;
  onDeletePort: (id: string, portId: string) => void;
}) {
  const meta = kindMeta[node.kind];
  const [iconOpen, setIconOpen] = useState(false);
  const related = edges.filter((e) => e.from === node.id || e.to === node.id);
  const protocols = Array.from(
    new Set(
      [...(node.consumes ?? []), ...(node.exposes ?? [])]
        .map((p) => p.protocol)
        .filter((p): p is string => Boolean(p)),
    ),
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            title="Change icon"
            onClick={() => setIconOpen(true)}
            className={`grid h-10 w-10 place-items-center rounded-lg ring-offset-2 transition hover:ring-2 hover:ring-primary/30 ${meta.soft}`}
          >
            <ElementIcon
              icon={node.icon}
              Fallback={meta.Icon}
              className={`h-5 w-5 ${meta.color}`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">{node.title}</div>
            <div className="text-xs text-muted-foreground">
              {meta.label}
              {node.subtitle ? ` · ${node.subtitle}` : ""}
            </div>
            <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
              {node.id}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">Click icon to change</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {node.status === "warn" && (
            <span className="flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn">
              <AlertTriangle className="h-2.5 w-2.5" /> Validation warning
            </span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{meta.label}</span>
          {node.tech && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{node.tech}</span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
            {related.length} connection{related.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {node.warn && (
        <div className="mx-4 mt-4 rounded-lg border border-warn/40 bg-warn-soft p-3 text-[11px] text-warn">
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" /> Validation
          </div>
          {node.warn}
          {productAi && (
            <button className="mt-2 text-[11px] font-medium underline">Ask Sphere to fix</button>
          )}
        </div>
      )}

      <Section title="API Surface">
        <div className="mb-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => onAddPort(node.id, "consume")}
            className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
          >
            + Consume
          </button>
          <button
            type="button"
            onClick={() => onAddPort(node.id, "expose")}
            className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
          >
            + Expose
          </button>
        </div>
        {node.consumes?.length ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Consumes
            </div>
            {node.consumes.map((p) => (
              <PortRow
                key={p.id}
                label={p.label}
                protocol={p.protocol}
                kind={node.kind}
                onChange={(patch) => onUpdatePort(node.id, p.id, patch)}
                onDelete={() => onDeletePort(node.id, p.id)}
              />
            ))}
          </div>
        ) : null}
        {node.exposes?.length ? (
          <div className={`space-y-1.5 ${node.consumes?.length ? "mt-3" : ""}`}>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowRight className="h-3 w-3" /> Exposes
            </div>
            {node.exposes.map((p) => (
              <PortRow
                key={p.id}
                label={p.label}
                protocol={p.protocol}
                kind={node.kind}
                onChange={(patch) => onUpdatePort(node.id, p.id, patch)}
                onDelete={() => onDeletePort(node.id, p.id)}
              />
            ))}
          </div>
        ) : null}
        {!node.consumes?.length && !node.exposes?.length && (
          <div className="text-[11px] text-muted-foreground">
            No ports yet. Add Consume / Expose above, then wire on the canvas: Expose {"->"} Consume.
          </div>
        )}
      </Section>

      <Section title="Connections">
        {related.length ? (
          <div className="space-y-1.5">
            {related.map((e) => {
              const otherId = e.from === node.id ? e.to : e.from;
              const other = nodeById[otherId];
              const outbound = e.from === node.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelectEdge(e.id)}
                  className="flex w-full items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:bg-muted"
                >
                  <EdgeIcon kind={e.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium">
                      {outbound ? "->" : "<-"} {other?.title ?? otherId}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {e.label ?? edgeKindTitle(e.kind)}
                      {e.contract ? ` · ${e.contract}` : ""}
                      {e.fromPort || e.toPort
                        ? ` · ${e.fromPort ?? "*"} -> ${e.toPort ?? "*"}`
                        : ""}
                      {e.operations?.length ? ` · ${e.operations.length} ops` : ""}
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Not connected yet. Click an Exposes port on the card, then a Consumes port on another
            node (or use the Connect tool).
          </div>
        )}
      </Section>

      <Section title="Repository">
        {node.repo ? (
          <button
            type="button"
            disabled={!node.repoUrl}
            onClick={() => {
              if (node.repoUrl) openExternal(node.repoUrl);
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-xs hover:bg-muted disabled:cursor-default disabled:opacity-70"
          >
            <Github className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{node.repo}</div>
              <div className="text-[10px] text-muted-foreground">
                {node.repoUrl ? "Open in new tab" : "Path only - no browse URL"}
              </div>
            </div>
            {node.repoUrl ? (
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground">
            No repository linked in the SCAN model yet.
          </div>
        )}
      </Section>

      <Section title="Contracts">
        {protocols.length ? (
          <div className="space-y-1.5">
            {protocols.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"
              >
                <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">{c}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px]">from ports</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            No protocol metadata on ports yet.
          </div>
        )}
      </Section>

      {productAi && (
        <Section title="Ask Sphere">
          <div className="flex flex-wrap gap-1.5">
            {[
              "Add resilience policies",
              "Split into read/write",
              "Add missing tests",
              "Rename service",
            ].map((s) => (
              <button
                key={s}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] hover:bg-muted"
              >
                <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                {s}
              </button>
            ))}
          </div>
        </Section>
      )}

      <IconPickerModal
        open={iconOpen}
        onClose={() => setIconOpen(false)}
        title="Component icon"
        currentIcon={node.icon}
        fallbackIcon={meta.Icon}
        softClass={meta.soft}
        colorClass={meta.color}
        onSave={(icon) => onUpdateIcon(node.id, icon)}
      />
    </div>
  );
}

function EdgeInspector({
  edge,
  nodeById,
  onUpdate,
}: {
  edge: SphereEdge;
  nodeById: Record<string, SphereNode>;
  onUpdate: (
    id: string,
    patch: {
      label?: string | null;
      contract?: string | null;
      operations?: string[] | null;
    },
  ) => void;
}) {
  const [label, setLabel] = useState(edge.label ?? "");
  const [contract, setContract] = useState(edge.contract ?? "");
  const [operationsText, setOperationsText] = useState(
    (edge.operations ?? []).join("\n"),
  );

  useEffect(() => {
    setLabel(edge.label ?? "");
    setContract(edge.contract ?? "");
    setOperationsText((edge.operations ?? []).join("\n"));
  }, [edge.id, edge.label, edge.contract, edge.operations]);

  const opsList = operationsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const beforeOps = (edge.operations ?? []).join("\n");
  const dirty =
    (label.trim() || "") !== (edge.label ?? "") ||
    (contract.trim() || "") !== (edge.contract ?? "") ||
    opsList.join("\n") !== beforeOps;

  const save = () => {
    if (!dirty) return;
    onUpdate(edge.id, {
      label: label.trim() || null,
      contract: contract.trim() || null,
      operations: opsList.length ? opsList : null,
    });
  };

  const fromNode = nodeById[edge.from];
  const toNode = nodeById[edge.to];

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <EdgeIcon kind={edge.kind} />
          <div className="text-base font-semibold">{edgeKindTitle(edge.kind)} connection</div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate font-medium text-foreground">
            {fromNode?.title ?? edge.from}
          </span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-medium text-foreground">
            {toNode?.title ?? edge.to}
          </span>
        </div>
        {(edge.fromPort || edge.toPort) && (
          <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3 shrink-0" />
            {edge.fromPort ?? " - "} {"->"} {edge.toPort ?? " - "}
          </div>
        )}
      </div>
      <Section title="Label">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          placeholder="e.g. REST, Publish, Git Integration"
          className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Section>
      <Section title="Contract">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <FileCode2 className="h-3.5 w-3.5 shrink-0" />
            <span>Protocol or contract reference stored on the connection</span>
          </div>
          <input
            value={contract}
            onChange={(e) => setContract(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            placeholder="e.g. OpenAPI, AsyncAPI, openapi.yaml"
            className="w-full rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Section>
      <Section title="Endpoints / operations">
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            One per line - shown when hovering the connection on the canvas.
          </p>
          <textarea
            value={operationsText}
            onChange={(e) => setOperationsText(e.target.value)}
            rows={5}
            placeholder={"POST /orders\nGET /orders/{id}"}
            className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-[11px] outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            disabled={!dirty}
            onClick={save}
            className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save connection
          </button>
        </div>
      </Section>
      <Section title="Resilience">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {[
            ["Timeout", "2s"],
            ["Retries", "3"],
            ["Circuit breaker", "on"],
            ["Rate limit", "100/s"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border bg-background px-2 py-1.5">
              <div className="text-[9px] uppercase text-muted-foreground">{k}</div>
              <div className="font-medium">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Resilience fields are Sphere placeholders - not part of SCAN model yet.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}

function PortRow({
  label,
  protocol,
  kind,
  onChange,
  onDelete,
}: {
  label: string;
  protocol?: string;
  kind: NodeKind;
  onChange?: (patch: { label?: string | null; protocol?: string | null }) => void;
  onDelete?: () => void;
}) {
  const [draftLabel, setDraftLabel] = useState(label);
  const [draftProtocol, setDraftProtocol] = useState(protocol ?? "");

  useEffect(() => {
    setDraftLabel(label);
    setDraftProtocol(protocol ?? "");
  }, [label, protocol]);

  const commit = () => {
    if (!onChange) return;
    const nextLabel = draftLabel.trim();
    if (!nextLabel) {
      setDraftLabel(label);
      return;
    }
    if (nextLabel !== label || (draftProtocol.trim() || undefined) !== (protocol || undefined)) {
      onChange({
        label: nextLabel,
        protocol: draftProtocol.trim() || null,
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
      <Circle className="h-2 w-2 shrink-0 fill-current" style={{ color: kindColorVar[kind] }} />
      <input
        value={draftLabel}
        onChange={(e) => setDraftLabel(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="min-w-0 flex-1 bg-transparent font-medium outline-none"
        aria-label="Port label"
      />
      <input
        value={draftProtocol}
        onChange={(e) => setDraftProtocol(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        placeholder="protocol"
        className="w-[72px] bg-transparent text-right text-muted-foreground outline-none placeholder:text-muted-foreground/50"
        aria-label="Port protocol"
      />
      {onDelete && (
        <button
          type="button"
          title="Remove port"
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ------------------------- TOOL RAIL ------------------------- */

function ToolRail({
  tool,
  setTool,
  showGrid,
  setShowGrid,
  onPickCreate,
  onPickBoundary,
}: {
  tool: "select" | "pan" | "connect" | "create" | "boundary";
  setTool: (t: "select" | "pan" | "connect" | "create" | "boundary") => void;
  showGrid: boolean;
  setShowGrid: (b: boolean) => void;
  onPickCreate: (kind: CreateKind) => void;
  onPickBoundary: (kind: "trust" | "runtime") => void;
}) {
  const items: {
    id: "select" | "pan" | "connect";
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }[] = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "pan", icon: Hand, label: "Pan" },
    { id: "connect", icon: ArrowRight, label: "Connect" },
  ];
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col items-center gap-2 rounded-xl bg-surface p-1.5 node-shadow hairline">
      {items.map((it) => {
        const Icon = it.id === "connect" && tool === "connect" ? Pointer : it.icon;
        return (
          <IconBtn
            key={it.id}
            label={it.label}
            tooltipSide="right"
            onClick={() => setTool(it.id)}
            active={tool === it.id}
          >
            <Icon className="h-4 w-4" />
          </IconBtn>
        );
      })}
      <div className="my-1 h-px w-6 bg-border" />
      <PopoverAdd active={tool === "create"} onPick={onPickCreate} />
      <PopoverBoundary active={tool === "boundary"} onPick={onPickBoundary} />
      <IconBtn
        label="Toggle grid"
        tooltipSide="right"
        onClick={() => setShowGrid(!showGrid)}
        active={showGrid}
      >
        <Grid3x3 className="h-4 w-4" />
      </IconBtn>
    </div>
  );
}

function PopoverAdd({
  active,
  onPick,
}: {
  active?: boolean;
  onPick: (kind: CreateKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = (
    Object.keys(createKindHints) as CreateKind[]
  ).map((kind) => ({ kind, label: createKindHints[kind].label, nodeKind: createKindHints[kind].nodeKind }));
  return (
    <div className="relative">
      <IconBtn
        label="Add component"
        tooltipSide="right"
        onClick={() => setOpen(!open)}
        active={open || active}
      >
        <Plus className="h-4 w-4" />
      </IconBtn>
      {open && (
        <div className="absolute left-full top-0 z-30 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg">
          <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Add Component
          </div>
          {items.map((it) => {
            const meta = kindMeta[it.nodeKind];
            return (
              <button
                key={it.kind}
                onClick={() => {
                  onPick(it.kind);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
              >
                <div className={`grid h-6 w-6 place-items-center rounded ${meta.soft}`}>
                  <meta.Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                </div>
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PopoverBoundary({
  active,
  onPick,
}: {
  active?: boolean;
  onPick: (kind: "trust" | "runtime") => void;
}) {
  const [open, setOpen] = useState(false);
  const items: { kind: "trust" | "runtime"; label: string; hint: string; Icon: typeof Shield }[] = [
    { kind: "trust", label: "Trust Boundary", hint: "Security / ownership box", Icon: Shield },
    { kind: "runtime", label: "Agent Runtime", hint: "Runtime / execution box", Icon: Bot },
  ];
  return (
    <div className="relative">
      <IconBtn
        label="Add boundary"
        tooltipSide="right"
        onClick={() => setOpen(!open)}
        active={open || active}
      >
        <Square className="h-4 w-4" />
      </IconBtn>
      {open && (
        <div className="absolute left-full top-0 z-30 ml-2 w-56 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg">
          <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Add Boundary
          </div>
          {items.map((it) => (
            <button
              key={it.kind}
              type="button"
              onClick={() => {
                onPick(it.kind);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
            >
              <div
                className={`grid h-6 w-6 place-items-center rounded ${
                  it.kind === "runtime" ? "bg-agent-soft" : "bg-svc-soft"
                }`}
              >
                <it.Icon
                  className={`h-3.5 w-3.5 ${it.kind === "runtime" ? "text-agent" : "text-svc"}`}
                />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{it.label}</div>
                <div className="text-[10px] text-muted-foreground">{it.hint}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
  variant,
  disabled,
  tooltipSide = "top",
  tooltip = true,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  variant?: "ghost";
  disabled?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltip?: boolean;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none ${
        active ? "bg-primary/10 text-primary" : ""
      } ${variant === "ghost" ? "hover:bg-surface" : ""}`}
    >
      {children}
    </button>
  );
  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide} sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/* ------------------------- LEGEND + MINIMAP + TOAST ------------------------- */

function Legend() {
  const items: { kind: NodeKind }[] = [
    { kind: "external" },
    { kind: "service" },
    { kind: "database" },
    { kind: "event" },
    { kind: "search" },
    { kind: "agent" },
    { kind: "repo" },
  ];
  return (
    <div className="w-[220px] overflow-hidden rounded-xl border border-border bg-surface node-shadow">
      <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Legend
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 text-[10px]">
        {items.map((it) => {
          const m = kindMeta[it.kind];
          return (
            <div key={it.kind} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{
                  background: `color-mix(in oklab, ${kindColorVar[it.kind]} 15%, transparent)`,
                  border: `1px solid ${kindColorVar[it.kind]}`,
                }}
              />
              {m.label}
            </div>
          );
        })}
      </div>
      <div className="border-t border-border p-2 text-[10px] text-muted-foreground">
        <div className="mb-1 flex items-center gap-1.5">
          <FileCode2 className="h-3 w-3" /> Contract / Schema
        </div>
        <div className="mb-1 flex items-center gap-1.5">
          <ArrowLeft className="h-3 w-3" /> Consumes (In)
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowRight className="h-3 w-3" /> Exposes (Out)
        </div>
      </div>
    </div>
  );
}

function MiniMap({
  nodes,
  groups,
  edges,
  pan,
  zoom,
  canvasSize,
  systemName,
  onNavigate,
  onPanDelta,
}: {
  nodes: SphereNode[];
  groups: SphereGroup[];
  edges: SphereEdge[];
  pan: Point;
  zoom: number;
  canvasSize: { w: number; h: number };
  systemName: string;
  onNavigate: (worldX: number, worldY: number) => void;
  onPanDelta: (dxWorld: number, dyWorld: number) => void;
}) {
  const mapW = 220;
  const mapH = 130;
  const pad = 24;
  const mapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ lastX: number; lastY: number } | null>(null);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const include = (x: number, y: number, w: number, h: number) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    };
    for (const n of nodes) include(n.x, n.y, n.w, n.h);
    for (const g of groups) include(g.x, g.y, g.w, g.h);
    if (!Number.isFinite(minX)) {
      return { minX: 0, minY: 0, width: 1000, height: 600 };
    }
    return {
      minX: minX - pad,
      minY: minY - pad,
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2),
    };
  }, [nodes, groups]);

  const scale = Math.min(mapW / bounds.width, mapH / bounds.height);
  const offsetX = (mapW - bounds.width * scale) / 2;
  const offsetY = (mapH - bounds.height * scale) / 2;

  const toMap = (x: number, y: number) => ({
    x: (x - bounds.minX) * scale + offsetX,
    y: (y - bounds.minY) * scale + offsetY,
  });

  const toWorld = (mx: number, my: number) => ({
    x: (mx - offsetX) / scale + bounds.minX,
    y: (my - offsetY) / scale + bounds.minY,
  });

  const viewWorld = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    w: canvasSize.w / zoom,
    h: canvasSize.h / zoom,
  };
  const viewMap = toMap(viewWorld.x, viewWorld.y);
  const viewMapW = viewWorld.w * scale;
  const viewMapH = viewWorld.h * scale;

  const localPoint = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = mapRef.current?.getBoundingClientRect();
    return {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const p = localPoint(e);
    const insideViewport =
      p.x >= viewMap.x &&
      p.x <= viewMap.x + viewMapW &&
      p.y >= viewMap.y &&
      p.y <= viewMap.y + viewMapH;
    if (!insideViewport) {
      const w = toWorld(p.x, p.y);
      onNavigate(w.x, w.y);
    }
    drag.current = { lastX: p.x, lastY: p.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = localPoint(e);
    const dxMap = p.x - drag.current.lastX;
    const dyMap = p.y - drag.current.lastY;
    if (dxMap === 0 && dyMap === 0) return;
    onPanDelta(dxMap / scale, dyMap / scale);
    drag.current = { lastX: p.x, lastY: p.y };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const nodeById = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const label =
    systemName.length > 22 ? `${systemName.slice(0, 20)}...` : systemName;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface node-shadow">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Minimap
        <span
          className="max-w-[140px] truncate rounded bg-muted px-1.5 py-0.5 text-[9px] normal-case font-medium text-foreground"
          title={systemName}
        >
          {label}
        </span>
      </div>
      <div
        ref={mapRef}
        className="relative cursor-crosshair bg-canvas select-none"
        style={{ width: mapW, height: mapH }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {groups.map((g) => {
          const p = toMap(g.x, g.y);
          return (
            <div
              key={g.id}
              className="pointer-events-none absolute rounded-sm border border-dashed border-border/80 bg-muted/30"
              style={{
                left: p.x,
                top: p.y,
                width: Math.max(2, g.w * scale),
                height: Math.max(2, g.h * scale),
              }}
            />
          );
        })}
        <svg
          className="pointer-events-none absolute inset-0"
          width={mapW}
          height={mapH}
        >
          {edges.map((e) => {
            const from = nodeById[e.from];
            const to = nodeById[e.to];
            if (!from || !to) return null;
            const a = toMap(from.x + from.w / 2, from.y + from.h / 2);
            const b = toMap(to.x + to.w / 2, to.y + to.h / 2);
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="color-mix(in oklab, var(--border) 80%, transparent)"
                strokeWidth={1}
              />
            );
          })}
        </svg>
        {nodes.map((n) => {
          const p = toMap(n.x, n.y);
          return (
            <div
              key={n.id}
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: p.x,
                top: p.y,
                width: Math.max(2, n.w * scale),
                height: Math.max(2, n.h * scale),
                background: `color-mix(in oklab, ${kindColorVar[n.kind]} 45%, white)`,
                border: `1px solid ${kindColorVar[n.kind]}`,
              }}
            />
          );
        })}
        <div
          className="pointer-events-none absolute rounded border-2 border-primary/70 bg-primary/10"
          style={{
            left: viewMap.x,
            top: viewMap.y,
            width: Math.max(8, viewMapW),
            height: Math.max(8, viewMapH),
          }}
        />
      </div>
    </div>
  );
}

function ValidationToast({ productAi = false }: { productAi?: boolean }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-warn/40 bg-surface px-4 py-2.5 node-shadow-lg">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-warn-soft">
        <AlertTriangle className="h-4 w-4 text-warn" />
      </div>
      <div className="text-[11px]">
        <div className="font-semibold">1 architecture warning</div>
        <div className="text-muted-foreground">
          Inventory Service is missing an async contract for OrderCreated
        </div>
      </div>
      {productAi && (
        <button className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground">
          Ask Sphere to fix
        </button>
      )}
      <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ------------------------- CONTEXT MENU ------------------------- */

function ContextMenu({
  x,
  y,
  onClose,
  nodeTitle,
  onDelete,
  onRename,
  onDuplicate,
  onConnect,
  onGroupBoundary,
}: {
  x: number;
  y: number;
  onClose: () => void;
  nodeTitle: string;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onConnect: () => void;
  onGroupBoundary: () => void;
}) {
  const items: { label: string; danger?: boolean; shortcut?: string; action?: () => void }[] = [
    { label: "Connect", action: onConnect },
    { label: "Rename", shortcut: "F2", action: onRename },
    { label: "Duplicate", shortcut: "Cmd+D", action: onDuplicate },
    { label: "Group into boundary", action: onGroupBoundary },
    { label: "Attach repository" },
    { label: "Add API contract" },
    { label: "Delete", danger: true, shortcut: "Backspace", action: onDelete },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-56 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg"
        style={{ left: x, top: y }}
      >
        <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {nodeTitle}
        </div>
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              if (it.action) {
                it.action();
              } else {
                onClose();
              }
            }}
            className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted ${
              it.danger ? "text-destructive" : ""
            }`}
          >
            {it.label}
            {it.shortcut && (
              <span className="text-[10px] text-muted-foreground">{it.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}

/* ------------------------- PREVIEW DRAWER ------------------------- */

function fitPreviewSvg(svg: string): string {
  return svg
    .replace(/<\?xml[^?]*\?>\s*/i, "")
    .replace(/\swidth="[^"]*"/, ' width="100%"')
    .replace(/\sheight="[^"]*"/, ' height="auto"');
}

function formatYamlPreviewError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "issues" in err &&
    Array.isArray((err as { issues: unknown }).issues)
  ) {
    const issues = (err as {
      issues: Array<{ path?: Array<string | number>; message?: string }>;
    }).issues;
    return issues
      .slice(0, 3)
      .map((issue) => {
        const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
        return path ? `${path}: ${issue.message ?? "invalid"}` : (issue.message ?? "invalid");
      })
      .join("; ");
  }
  return err instanceof Error ? err.message : "Invalid SCAN YAML";
}

function ScanYamlDiagramPreview({
  yaml,
  error,
}: {
  yaml: string;
  error: string | null;
}) {
  const preview = useMemo(() => {
    if (error) return { ok: false as const, error };
    try {
      const model = parseScanYaml(yaml);
      const graph = projectToGraph(model);
      if (!graph.nodes.length && !graph.groups.length) {
        return { ok: false as const, error: "No diagram elements to preview yet." };
      }
      return { ok: true as const, svg: fitPreviewSvg(graphToSvg(graph)) };
    } catch (err) {
      return { ok: false as const, error: formatYamlPreviewError(err) };
    }
  }, [yaml, error]);

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-canvas">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Diagram preview
        </span>
        <span className="text-[10px] text-muted-foreground">What Apply will load</span>
      </div>
      {preview.ok ? (
        <div
          className="max-h-[260px] overflow-auto bg-[#f8fafc] p-2 [&_svg]:mx-auto [&_svg]:block [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: preview.svg }}
        />
      ) : (
        <div className="space-y-2 px-3 py-3">
          <div className="flex items-start gap-2 text-[11px] text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Preview unavailable: {preview.error}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Use Regenerate to send this error back to Sphere AI for a corrected YAML.
          </p>
        </div>
      )}
    </div>
  );
}

function validatePreviewYaml(yaml: string): string | null {
  try {
    const model = parseScanYaml(yaml);
    const graph = projectToGraph(model);
    if (!graph.nodes.length && !graph.groups.length) {
      return "No diagram elements to preview yet.";
    }
    return null;
  } catch (err) {
    return formatYamlPreviewError(err);
  }
}

type DiffLine = { kind: "context" | "add" | "remove"; text: string };

function computeYamlDiff(baseYaml: string, nextYaml: string): DiffLine[] {
  const a = baseYaml.split("\n");
  const b = nextYaml.split("\n");
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  const LOOKAHEAD = 24;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: "context", text: a[i] });
      i += 1;
      j += 1;
      continue;
    }

    let aMatch = -1;
    let bMatch = -1;
    for (let k = 1; k <= LOOKAHEAD; k += 1) {
      if (aMatch === -1 && i + k < a.length && a[i + k] === b[j]) aMatch = i + k;
      if (bMatch === -1 && j + k < b.length && b[j + k] === a[i]) bMatch = j + k;
      if (aMatch !== -1 && bMatch !== -1) break;
    }

    if (aMatch === -1 && bMatch === -1) {
      out.push({ kind: "remove", text: a[i] });
      out.push({ kind: "add", text: b[j] });
      i += 1;
      j += 1;
      continue;
    }
    if (aMatch !== -1 && (bMatch === -1 || aMatch - i <= bMatch - j)) {
      while (i < aMatch) {
        out.push({ kind: "remove", text: a[i] });
        i += 1;
      }
      continue;
    }
    while (j < bMatch) {
      out.push({ kind: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < a.length) {
    out.push({ kind: "remove", text: a[i] });
    i += 1;
  }
  while (j < b.length) {
    out.push({ kind: "add", text: b[j] });
    j += 1;
  }
  return out;
}

function YamlPreviewBlock({
  yaml,
  baseYaml,
}: {
  yaml: string;
  baseYaml?: string | null;
}) {
  const TRUNCATE_LINES = 12;
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const diffLines = useMemo(() => {
    if (!baseYaml?.trim()) {
      return yaml.split("\n").map((text) => ({ kind: "context" as const, text }));
    }
    return computeYamlDiff(baseYaml, yaml);
  }, [baseYaml, yaml]);

  const added = diffLines.filter((line) => line.kind === "add").length;
  const removed = diffLines.filter((line) => line.kind === "remove").length;
  const hasDiff = Boolean(baseYaml?.trim()) && (added > 0 || removed > 0);
  const isTruncated = !expanded && diffLines.length > TRUNCATE_LINES;
  const visible = isTruncated ? diffLines.slice(0, TRUNCATE_LINES) : diffLines;

  const copyYaml = () => {
    void navigator.clipboard.writeText(yaml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-[hsl(var(--muted)/0.6)]">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          SCAN YAML — {yaml.split("\n").length} lines
        </span>
        <div className="flex items-center gap-2">
          {hasDiff && (
            <span className="font-mono text-[10px] tabular-nums">
              <span className="text-ok">+{added}</span>
              <span className="text-muted-foreground"> / </span>
              <span className="text-destructive">-{removed}</span>
            </span>
          )}
          <button
            onClick={copyYaml}
            title="Copy YAML"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ClipboardCopy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="max-h-[320px] overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {visible.map((line, idx) => {
          const prefix = line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " ";
          const cls =
            line.kind === "add"
              ? "bg-ok-soft/50 text-ok"
              : line.kind === "remove"
                ? "bg-destructive/10 text-destructive"
                : "text-foreground";
          return (
            <div key={`${idx}-${line.kind}-${line.text}`} className={`whitespace-pre-wrap px-1 ${cls}`}>
              {prefix}
              {line.text}
            </div>
          );
        })}
        {isTruncated && <div className="px-1 text-muted-foreground">…</div>}
      </pre>
      {diffLines.length > TRUNCATE_LINES && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full border-t border-border px-3 py-1.5 text-center text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {expanded
            ? "Show less"
            : hasDiff
              ? `Show full diff (${diffLines.length} lines)`
              : `Show all ${diffLines.length} lines`}
        </button>
      )}
    </div>
  );
}

function PreviewDrawer({
  title,
  reply,
  yaml,
  baseYaml,
  hasYaml,
  incomplete = false,
  busy = false,
  onCancel,
  onApply,
  onRegenerate,
}: {
  title: string;
  reply: string;
  yaml: string | null;
  baseYaml: string | null;
  hasYaml: boolean;
  incomplete?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onApply: () => void;
  onRegenerate: (validationError: string) => void;
}) {
  const previewError = useMemo(
    () => (hasYaml && yaml ? validatePreviewYaml(yaml) : null),
    [hasYaml, yaml],
  );
  const canApply = hasYaml && !previewError && !busy;
  const showRegenerate = Boolean(previewError || incomplete);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="w-[680px] overflow-hidden rounded-2xl border border-border bg-surface node-shadow-lg">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-event/10 px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-event text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground">
              {incomplete && !hasYaml
                ? "Incomplete or truncated response — regenerate for the full diagram"
                : hasYaml
                  ? previewError
                    ? "YAML has validation issues — regenerate to fix"
                    : "Preview before applying to the architecture board"
                  : "Reply only — no diagram changes proposed"}
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-md p-1 hover:bg-muted disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[560px] overflow-auto p-4">
          <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm leading-relaxed text-foreground">
            {reply || "No message."}
          </div>
          {hasYaml && yaml ? (
            <>
              <ScanYamlDiagramPreview yaml={yaml} error={previewError} />
              <YamlPreviewBlock yaml={yaml} baseYaml={baseYaml} />
            </>
          ) : (
            <div className="mt-4 rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
              {incomplete
                ? "No complete YAML was returned. Use Regenerate to retry with the same prompt and attachments."
                : "No YAML was returned. Ask Sphere to add or change architecture elements to get an applyable proposal."}
            </div>
          )}
          {hasYaml && !previewError && (
            <div className="mt-3 rounded-lg bg-ok-soft/40 border border-ok/30 p-3 text-[11px] text-muted-foreground">
              Applying will replace the current board document with the agent YAML (undo with Ctrl+Z after load via a new history root).
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-[11px] text-muted-foreground">
            {busy
              ? "Regenerating…"
              : previewError
                ? "Validation failed"
                : incomplete
                  ? "Incomplete response"
                  : hasYaml
                    ? "SCAN YAML ready"
                    : "Chat only"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
            >
              Cancel
            </button>
            {showRegenerate && (
              <button
                onClick={() =>
                  onRegenerate(
                    previewError ??
                      "Previous response was truncated or incomplete — return the full SCAN document.",
                  )
                }
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {busy ? "Fixing…" : "Regenerate"}
              </button>
            )}
            <button
              onClick={onApply}
              disabled={!canApply}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" /> Apply changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- COMMAND PALETTE ------------------------- */

function CommandPalette({
  onClose,
  onCreateComponent,
}: {
  onClose: () => void;
  onCreateComponent: (kind: CreateKind) => void;
}) {
  const [q, setQ] = useState("");
  type PaletteIcon = React.ComponentType<{ className?: string }>;
  type PaletteItem =
    | { icon: PaletteIcon; label: string; meta: string; kind: CreateKind }
    | { icon: PaletteIcon; label: string; meta?: undefined; kind?: undefined };

  const componentItems: PaletteItem[] = [
    { icon: Leaf, label: "Service", meta: "Spring Boot / API", kind: "service" },
    { icon: DbIcon, label: "Datastore", meta: "PostgreSQL / MySQL", kind: "datastore" },
    { icon: Radio, label: "Event / Stream", meta: "Kafka / Queue / Topic", kind: "event-stream" },
    { icon: Search, label: "Search", meta: "Elasticsearch / Index", kind: "search" },
    { icon: Bot, label: "Agent", meta: "Agent runtime", kind: "agent" },
    { icon: Github, label: "Repository", meta: "Code / Contracts", kind: "repository" },
    { icon: ExternalLink, label: "External System", meta: "3rd party dependency", kind: "external-system" },
  ];
  const groups: Array<{ title: string; items: PaletteItem[] }> = [
    {
      title: "Components",
      items: componentItems,
    },
    {
      title: "Actions",
      items: [
        { icon: Plus, label: "Add service" },
        { icon: ArrowRight, label: "Draw connection" },
        { icon: Sparkles, label: "Highlight services without contracts" },
        { icon: Square, label: "Wrap in trust boundary" },
      ],
    },
    {
      title: "Views",
      items: [
        { icon: Layers, label: "Show all systems" },
        { icon: Building2Icon, label: "External integrations" },
        { icon: FileCode2, label: "Contract map" },
        { icon: Bot, label: "Agent runtime" },
      ],
    },
  ];
  const query = q.trim().toLowerCase();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!query) return true;
        const meta = item.meta ?? "";
        return `${group.title} ${item.label} ${meta}`.toLowerCase().includes(query);
      }),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-foreground/10 pt-24 backdrop-blur-sm">
      <div
        className="w-[560px] overflow-hidden rounded-2xl border border-border bg-popover node-shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search components, contracts, actions..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">ESC</span>
        </div>
        <div className="max-h-[420px] overflow-auto p-2">
          {visibleGroups.map((g) => (
            <div key={g.title} className="mb-2">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </div>
              {g.items.map((it) => (
                <button
                  key={it.label}
                  onClick={() => {
                    if (it.kind) {
                      onCreateComponent(it.kind);
                      return;
                    }
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <div className="grid h-6 w-6 place-items-center rounded bg-muted">
                    <it.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="flex-1">{it.label}</span>
                  {it.meta ? (
                    <span className="text-[10px] text-muted-foreground">{it.meta}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Up/Down Navigate</span>
            <span>Enter Select</span>
          </div>
          <div className="flex items-center gap-1">
            <CommandIcon className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

/* ------------------------- EDGE ICON ------------------------- */

function EdgeIcon({ kind }: { kind: SphereEdge["kind"] }) {
  const map = {
    rest: { icon: FileCode2, color: "text-foreground" },
    grpc: { icon: FileCode2, color: "text-foreground" },
    async: { icon: Radio, color: "text-event" },
    stream: { icon: Radio, color: "text-event" },
    db: { icon: DbIcon, color: "text-agent" },
    git: { icon: Github, color: "text-foreground" },
    flow: { icon: ArrowRight, color: "text-agent" },
  } as const;
  const { icon: Icon, color } = map[kind];
  return <Icon className={`h-3 w-3 ${color}`} />;
}
