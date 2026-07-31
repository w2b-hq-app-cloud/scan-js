// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { parseScanYaml } from "@spherescan/model";
import { projectToGraph } from "@spherescan/viewer";

export function fitPreviewSvg(svg: string): string {
  return svg
    .replace(/<\?xml[^?]*\?>\s*/i, "")
    .replace(/\swidth="[^"]*"/, ' width="100%"')
    .replace(/\sheight="[^"]*"/, ' height="auto"');
}

export function formatYamlPreviewError(err: unknown): string {
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

export function validatePreviewYaml(yaml: string): string | null {
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

export type DiffLine = { kind: "context" | "add" | "remove"; text: string };

export function computeYamlDiff(baseYaml: string, nextYaml: string): DiffLine[] {
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
