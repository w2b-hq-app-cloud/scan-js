// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { parseScanYaml, validateScanModel } from "@spherescan/model";
import { graphToSvg, projectToGraph } from "@spherescan/viewer";

export type PreviewPayload = {
  ok: true;
  svg: string;
  system: { id: string; name: string };
};

export type PreviewError = {
  ok: false;
  message: string;
};

export type PreviewResult = PreviewPayload | PreviewError;

/** Parse SCAN YAML → SVG for the read-only webview. */
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
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
