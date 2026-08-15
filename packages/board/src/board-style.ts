// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { SphereEdge, NodeKind } from "@spherescan/viewer";
import type { CreateKind } from "@spherescan/modeler";

export function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export const createKindHints: Record<
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

export function edgeKindTitle(kind: SphereEdge["kind"]): string {
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

export const kindColorVar: Record<NodeKind, string> = {
  service: "var(--svc)",
  external: "var(--ext)",
  database: "var(--data)",
  event: "var(--event)",
  search: "var(--search)",
  agent: "var(--agent)",
  repo: "var(--repo)",
};

/** Dash/width from connection kind; stroke follows the source node kind when provided. */
export const edgeStyle = (
  kind: SphereEdge["kind"],
  sourceKind?: NodeKind,
) => {
  const stroke = sourceKind
    ? kindColorVar[sourceKind]
    : kind === "db" || kind === "flow"
      ? "var(--agent)"
      : kind === "async" || kind === "stream"
        ? "var(--event)"
        : kind === "git"
          ? "oklch(0.5 0.02 260)"
          : "oklch(0.35 0.03 260)";
  switch (kind) {
    case "rest":
    case "grpc":
      return { stroke, dash: "", width: 1.5 };
    case "db":
      return { stroke, dash: "6 4", width: 1.5 };
    case "async":
    case "stream":
      return { stroke, dash: "6 4", width: 1.5 };
    case "git":
      return { stroke, dash: "5 4", width: 1.5 };
    case "flow":
      return { stroke, dash: "5 4", width: 1.5 };
  }
};
