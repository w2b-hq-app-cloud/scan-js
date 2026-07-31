// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ReactNode } from "react";

export type Point = { x: number; y: number };

/** Canvas interaction mode for the left tool rail. */
export type BoardTool = "select" | "pan" | "connect" | "create" | "boundary" | "fast";

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

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
  /** Wall-clock generation time in seconds (BFF or client-measured). */
  durationSec?: number;
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
    selection?: string[];
  }) => Promise<string[]>;
  layout?: (input: { yaml: string }) => Promise<{
    reply?: string;
    yaml: string;
  }>;
  /**
   * Optional Enterprise Architect pass (Sphere). Returns ephemeral warnings —
   * does not rewrite board YAML.
   */
  architect?: (input: { yaml: string }) => Promise<{
    warnings: { elementId: string; message: string }[];
  }>;
  /** Optional STT: Sphere wires this to mesh faster-whisper. */
  transcribeAudio?: (input: { blob: Blob; mimeType: string }) => Promise<string>;
};

/** Architecture warning shown in ValidationToast / node badges. */
export type ArchitectureWarning = {
  id: string;
  title: string;
  message: string;
};
