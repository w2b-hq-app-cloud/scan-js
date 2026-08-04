// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { parseScanYaml, validateScanModel } from "@spherescan/model";
import { graphToSvg, projectToGraph, type SphereEdge, type SphereNode } from "@spherescan/viewer";

export type PreviewPort = {
  id: string;
  side: "in" | "out";
  label: string;
  protocol?: string;
};

export type PreviewNode = {
  id: string;
  kind: string;
  title: string;
  subtitle?: string;
  tech?: string;
  description?: string;
  notes?: string;
  status?: string;
  warn?: string;
  consumes: PreviewPort[];
  exposes: PreviewPort[];
};

export type PreviewEdge = {
  id: string;
  from: string;
  to: string;
  kind: string;
  label?: string;
  contract?: string;
  fromPort?: string;
  toPort?: string;
  operations?: string[];
};

export type PreviewPayload = {
  ok: true;
  svg: string;
  system: { id: string; name: string };
  nodes: PreviewNode[];
  edges: PreviewEdge[];
};

export type PreviewError = {
  ok: false;
  message: string;
};

export type PreviewResult = PreviewPayload | PreviewError;

function mapPort(p: { id: string; side: "in" | "out"; label: string; protocol?: string }): PreviewPort {
  return {
    id: p.id,
    side: p.side,
    label: p.label,
    protocol: p.protocol,
  };
}

function mapNode(n: SphereNode): PreviewNode {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    subtitle: n.subtitle,
    tech: n.tech,
    description: n.description,
    notes: n.notes,
    status: n.status,
    warn: n.warn,
    consumes: (n.consumes ?? []).map(mapPort),
    exposes: (n.exposes ?? []).map(mapPort),
  };
}

function mapEdge(e: SphereEdge): PreviewEdge {
  return {
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.kind,
    label: e.label,
    contract: e.contract,
    fromPort: e.fromPort,
    toPort: e.toPort,
    operations: e.operations,
  };
}

/** Parse SCAN YAML → SVG + compact graph meta for the read-only webview. */
export function renderScanPreview(yamlText: string): PreviewResult {
  let model;
  try {
    model = parseScanYaml(yamlText);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const validation = validateScanModel(model);
  const errors = validation.issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return {
      ok: false,
      message: errors.map((i) => `${i.path}: ${i.message}`).join("\n"),
    };
  }

  try {
    const graph = projectToGraph(model);
    const svg = graphToSvg(graph, { mode: "orthogonal" });
    return {
      ok: true,
      svg,
      system: { id: model.system.id, name: model.system.name },
      nodes: graph.nodes.map(mapNode),
      edges: graph.edges.map(mapEdge),
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
