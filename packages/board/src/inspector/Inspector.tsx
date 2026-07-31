// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useMemo } from "react";
import { X } from "lucide-react";
import type { SphereNode, SphereEdge, SphereGroup, BoundaryColor } from "@spherescan/viewer";
import type { BoardShell } from "../board-types";
import { BoundaryInspector } from "./BoundaryInspector";
import { NodeInspector } from "./NodeInspector";
import { EdgeInspector } from "./EdgeInspector";

export function Inspector({
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
  onAskSphere,
  askChips,
  askLoading,
  onRequestAskSuggestions,
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
  onAskSphere?: (prompt: string) => void;
  askChips?: string[];
  askLoading?: boolean;
  onRequestAskSuggestions?: () => void;
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
          onAskSphere={onAskSphere}
          askChips={askChips}
          askLoading={askLoading}
          onRequestAskSuggestions={onRequestAskSuggestions}
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

