// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import {
  AlertTriangle,
  Bot,
  FileCode2,
  Filter,
  Grid3x3,
  Layers,
  Locate,
} from "lucide-react";
import type { SphereNode, SphereGroup } from "@spherescan/viewer";
import { Building2Icon } from "../icons/Building2Icon";

export function ViewTabs({
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

