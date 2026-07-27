import type { NodeKind } from "@spherescan/viewer";
import {
  Boxes,
  Database,
  Radio,
  Search,
  Bot,
  Github,
  Building2,
  Leaf,
  type LucideIcon,
} from "lucide-react";

export const kindMeta: Record<
  NodeKind,
  {
    Icon: LucideIcon;
    color: string;
    soft: string;
    label: string;
    ring: string;
  }
> = {
  service: {
    Icon: Leaf,
    color: "text-svc",
    soft: "bg-svc-soft",
    ring: "ring-svc/40",
    label: "Service",
  },
  external: {
    Icon: Building2,
    color: "text-ext",
    soft: "bg-ext-soft",
    ring: "ring-ext/40",
    label: "External System",
  },
  database: {
    Icon: Database,
    color: "text-data",
    soft: "bg-data-soft",
    ring: "ring-data/40",
    label: "Data Store",
  },
  event: {
    Icon: Radio,
    color: "text-event",
    soft: "bg-event-soft",
    ring: "ring-event/40",
    label: "Event / Stream",
  },
  search: {
    Icon: Search,
    color: "text-search",
    soft: "bg-search-soft",
    ring: "ring-search/40",
    label: "Search",
  },
  agent: {
    Icon: Bot,
    color: "text-agent",
    soft: "bg-agent-soft",
    ring: "ring-agent/40",
    label: "Agent",
  },
  repo: {
    Icon: Github,
    color: "text-repo",
    soft: "bg-repo-soft",
    ring: "ring-repo/30",
    label: "Repository / Artifact",
  },
};

export const AllIcons = { Boxes };
