// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useMemo, type ReactNode } from "react";
import { X } from "lucide-react";
import type { SphereNode, SphereEdge, SphereGroup, BoundaryColor } from "@spherescan/viewer";
import type { BoardInspectorExtrasContext } from "../board-types";
import { BoundaryInspector } from "./BoundaryInspector";
import { NodeInspector } from "./NodeInspector";
import { EdgeInspector } from "./EdgeInspector";

export function Inspector({
  node,
  edge,
  group,
  nodes,
  edges,
  onClose,
  onUpdateConnection,
  onUpdateBoundary,
  onUpdateElementIcon,
  onUpdateElementDescription,
  onAddPort,
  onUpdatePort,
  onDeletePort,
  onDeleteBoundary,
  onRenameBoundary,
  onSelectEdge,
  onSelectNode,
  renderInspectorExtras,
}: {
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
  onUpdateElementDescription: (id: string, description: string | null) => void;
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
  renderInspectorExtras?: (ctx: BoardInspectorExtrasContext) => ReactNode;
}) {
  const nodeById = useMemo(() => {
    const map: Record<string, SphereNode> = {};
    for (const n of nodes) map[n.id] = n;
    return map;
  }, [nodes]);

  const extras = renderInspectorExtras?.({
    node,
    edge,
    group,
    nodes,
    edges,
  });

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

      <div className="flex-1 overflow-auto">
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
            node={node}
            edges={edges}
            nodeById={nodeById}
            onSelectEdge={onSelectEdge}
            onUpdateIcon={onUpdateElementIcon}
            onUpdateDescription={onUpdateElementDescription}
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
        {extras}
      </div>
    </div>
  );
}
