// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ReactNode } from "react";
import type { SphereNode, SphereEdge, SphereGroup } from "@spherescan/viewer";

export type Point = { x: number; y: number };

/** Canvas interaction mode for the left tool rail. */
export type BoardTool = "select" | "pan" | "connect" | "create" | "boundary" | "fast";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/**
 * Host API registered via `onBoardReady` so product apps (e.g. Sphere) can
 * read/write the open document without embedding product UI in this package.
 */
export type BoardHostApi = {
  peekYaml: () => string;
  loadYaml: (yaml: string) => Promise<void>;
  getSelection: () => BoardSelection;
  subscribeSelection: (listener: (selection: BoardSelection) => void) => () => void;
  /** Subscribe to document revisions (after model commands). */
  subscribeDocument: (listener: (yaml: string) => void) => () => void;
};

/** System rename vs duplicate vs new board — hosts map this to workspace relocate vs fresh seed. */
export type SystemIdentityChange = {
  reason: "rename" | "duplicate" | "new";
  fromSystemId: string | null;
  toSystemId: string;
  yaml: string;
};

export type BoardSelection = {
  nodeIds: string[];
  edgeId: string | null;
  boundaryId: string | null;
};

export type BoardNodeOverlayContext = {
  node: SphereNode;
  /** World-space top-left and size (same space as node.x/y/w/h). */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type BoardInspectorExtrasContext = {
  node: SphereNode | null;
  edge: SphereEdge | null;
  group: SphereGroup | null;
  nodes: SphereNode[];
  edges: SphereEdge[];
};

export type BoardAppProps = {
  /**
   * Layout sizing. `viewport` (default) = full browser window; `parent` = fill the host container
   * (use for embeds inside a page that already has chrome).
   */
  fill?: "viewport" | "parent";
  /**
   * Host chrome: replaces the default SCAN brand mark (title + subtitle).
   * Product hosts (Sphere) pass their own mark; whiteboard keeps the default.
   */
  topBarBrand?: ReactNode;
  /** Host chrome: inserted before the diagram title. */
  topBarBeforeTitle?: ReactNode;
  /** Host chrome: after save status. */
  topBarAfterStatus?: ReactNode;
  /** Host chrome: between brand and diagram title. */
  topBarAfterBrand?: ReactNode;
  /** Fired when dirty (unsaved) state changes - hosts can show leave confirmations. */
  onDirtyChange?: (dirty: boolean) => void;
  /**
   * Browser `beforeunload` warning ("Reload site?"). Default true.
   * Product hosts may set false and use a native Modal + router blocker instead.
   */
  warnOnUnload?: boolean;
  /**
   * Optional host persistence hook. When supplied, Cmd/Ctrl+S passes the
   * current YAML document to the host instead of writing a local file.
   * Return true only after the host has persisted the document successfully.
   */
  onSaveDocument?: (yaml: string) => Promise<boolean>;
  /**
   * Fired after a successful local Save / download when `onSaveDocument` is
   * not set (e.g. anonymous hosts that fall back to .scan.yaml on disk).
   */
  onLocalSave?: (info: { filename: string; connected: boolean }) => void;
  /** Called after a model command changes the document, for host-driven autosave. */
  onDocumentChange?: (yaml: string) => void;
  /**
   * Fired when the system name/id changes via Rename or Duplicate.
   * Hosts with per-system workspaces should relocate on rename and seed fresh on duplicate.
   */
  onSystemIdentityChange?: (change: SystemIdentityChange) => void;
  /** YAML supplied by a host to replace the built-in sample document. */
  initialYaml?: string | null;
  /**
   * One-shot: YAML to merge (additive) into the current board, e.g. a library
   * template attached from another screen. Applied once, then the host should
   * clear it via `onMergeApplied`.
   */
  pendingMergeYaml?: string | null;
  /** Fired after `pendingMergeYaml` has been applied to the board. */
  onMergeApplied?: () => void;
  /**
   * Start from an empty Untitled board instead of the Order Platform sample.
   * Ignored when `initialYaml` is supplied (e.g. opening a saved diagram).
   */
  startEmpty?: boolean;
  /**
   * Host-pushed SCAN YAML. When `applyYamlNonce` changes, the board replaces the open document.
   */
  applyYaml?: string | null;
  applyYamlNonce?: number;
  /** Host share/view-only hint. Decorative for type compatibility. */
  readOnly?: boolean;
  /** Register imperative host API once the board is ready. */
  onBoardReady?: (api: BoardHostApi) => void;
  /** World-space overlay above the selected node (product Ask / Build chrome). */
  renderNodeOverlay?: (ctx: BoardNodeOverlayContext) => ReactNode;
  /** Extra panels below the standard inspector sections. */
  renderInspectorExtras?: (ctx: BoardInspectorExtrasContext) => ReactNode;
  /** Chrome under the top bar (e.g. product AI prompt bar). */
  renderBottomChrome?: () => ReactNode;
  /** Host left panel beside the canvas (e.g. product chat sidebar). */
  renderLeftPanel?: () => ReactNode;
  /** Host controls on the right side of the view-tabs row. */
  renderViewTabsEnd?: () => ReactNode;
  /** Absolute overlay over the canvas (e.g. YAML / Code surface). */
  renderCanvasOverlay?: () => ReactNode;
  /** Host-owned architecture warnings (badges + toast). */
  architectureWarnings?: ArchitectureWarning[];
  /** Optional CTA next to the validation toast (host-owned label/action). */
  renderValidationAction?: (warning: ArchitectureWarning) => ReactNode;
  /** True while host is re-validating architecture. */
  architectureValidating?: boolean;
};

/** Architecture warning shown in ValidationToast / node badges. */
export type ArchitectureWarning = {
  id: string;
  title: string;
  message: string;
};
