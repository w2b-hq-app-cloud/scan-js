// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useState, type ComponentType } from "react";
import {
  ArrowRight,
  Bot,
  Command as CommandIcon,
  Database as DbIcon,
  ExternalLink,
  FileCode2,
  Github,
  Layers,
  Leaf,
  Plus,
  Radio,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import type { CreateKind } from "@spherescan/modeler";
import { Building2Icon } from "../icons/Building2Icon";

export function CommandPalette({
  onClose,
  onCreateComponent,
}: {
  onClose: () => void;
  onCreateComponent: (kind: CreateKind) => void;
}) {
  const [q, setQ] = useState("");
  type PaletteIcon = ComponentType<{ className?: string }>;
  type PaletteItem =
    | { icon: PaletteIcon; label: string; meta: string; kind: CreateKind }
    | { icon: PaletteIcon; label: string; meta?: undefined; kind?: undefined };

  const componentItems: PaletteItem[] = [
    { icon: Leaf, label: "Service", meta: "Spring Boot / API", kind: "service" },
    { icon: DbIcon, label: "Datastore", meta: "PostgreSQL / MySQL", kind: "datastore" },
    { icon: Radio, label: "Event / Stream", meta: "Kafka / Queue / Topic", kind: "event-stream" },
    { icon: Search, label: "Search", meta: "Elasticsearch / Index", kind: "search" },
    { icon: Bot, label: "Agent", meta: "Agent runtime", kind: "agent" },
    { icon: Github, label: "Repository", meta: "Code / Contracts", kind: "repository" },
    { icon: ExternalLink, label: "External System", meta: "3rd party dependency", kind: "external-system" },
  ];
  const groups: Array<{ title: string; items: PaletteItem[] }> = [
    {
      title: "Components",
      items: componentItems,
    },
    {
      title: "Actions",
      items: [
        { icon: Plus, label: "Add service" },
        { icon: ArrowRight, label: "Draw connection" },
        { icon: Sparkles, label: "Highlight services without contracts" },
        { icon: Square, label: "Wrap in trust boundary" },
      ],
    },
    {
      title: "Views",
      items: [
        { icon: Layers, label: "Show all systems" },
        { icon: Building2Icon, label: "External integrations" },
        { icon: FileCode2, label: "Contract map" },
        { icon: Bot, label: "Agent runtime" },
      ],
    },
  ];
  const query = q.trim().toLowerCase();
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!query) return true;
        const meta = item.meta ?? "";
        return `${group.title} ${item.label} ${meta}`.toLowerCase().includes(query);
      }),
    }))
    .filter((group) => group.items.length > 0);
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-foreground/10 pt-24 backdrop-blur-sm">
      <div
        className="w-[560px] overflow-hidden rounded-2xl border border-border bg-popover node-shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search components, contracts, actions..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">ESC</span>
        </div>
        <div className="max-h-[420px] overflow-auto p-2">
          {visibleGroups.map((g) => (
            <div key={g.title} className="mb-2">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </div>
              {g.items.map((it) => (
                <button
                  key={it.label}
                  onClick={() => {
                    if (it.kind) {
                      onCreateComponent(it.kind);
                      return;
                    }
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <div className="grid h-6 w-6 place-items-center rounded bg-muted">
                    <it.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="flex-1">{it.label}</span>
                  {it.meta ? (
                    <span className="text-[10px] text-muted-foreground">{it.meta}</span>
                  ) : null}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Up/Down Navigate</span>
            <span>Enter Select</span>
          </div>
          <div className="flex items-center gap-1">
            <CommandIcon className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

/* ------------------------- EDGE ICON ------------------------- */

