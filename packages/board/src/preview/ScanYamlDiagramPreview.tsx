// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { parseScanYaml } from "@spherescan/model";
import { projectToGraph, graphToSvg } from "@spherescan/viewer";
import { fitPreviewSvg, formatYamlPreviewError } from "./preview-utils";

export function ScanYamlDiagramPreview({
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
