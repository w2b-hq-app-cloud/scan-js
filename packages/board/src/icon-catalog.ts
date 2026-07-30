import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  Bot,
  Boxes,
  Building2,
  Cloud,
  Code2,
  Cog,
  Cpu,
  Database,
  FileCode2,
  FolderGit2,
  Github,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Leaf,
  Lock,
  MessageSquare,
  Network,
  Package,
  Radio,
  Search,
  Server,
  Shield,
  Sparkles,
  SquareTerminal,
  Store,
  Workflow,
  Zap,
} from "lucide-react";

/** True when the icon value is an image URL / data URL rather than a Lucide name. */
export function isIconUrl(icon: string): boolean {
  return /^(https?:|data:|blob:)/i.test(icon.trim());
}

export type CatalogIcon = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

/** Curated Lucide set for architecture diagrams. */
export const ICON_CATALOG: CatalogIcon[] = [
  { id: "leaf", label: "Service", Icon: Leaf },
  { id: "server", label: "Server", Icon: Server },
  { id: "cpu", label: "CPU", Icon: Cpu },
  { id: "cog", label: "Settings", Icon: Cog },
  { id: "zap", label: "Zap", Icon: Zap },
  { id: "activity", label: "Activity", Icon: Activity },
  { id: "workflow", label: "Workflow", Icon: Workflow },
  { id: "boxes", label: "Boxes", Icon: Boxes },
  { id: "layers", label: "Layers", Icon: Layers },
  { id: "package", label: "Package", Icon: Package },
  { id: "database", label: "Database", Icon: Database },
  { id: "hard-drive", label: "Disk", Icon: HardDrive },
  { id: "archive", label: "Archive", Icon: Archive },
  { id: "search", label: "Search", Icon: Search },
  { id: "radio", label: "Stream", Icon: Radio },
  { id: "message-square", label: "Messages", Icon: MessageSquare },
  { id: "network", label: "Network", Icon: Network },
  { id: "globe", label: "Globe", Icon: Globe },
  { id: "cloud", label: "Cloud", Icon: Cloud },
  { id: "building-2", label: "External", Icon: Building2 },
  { id: "store", label: "Store", Icon: Store },
  { id: "bot", label: "Agent", Icon: Bot },
  { id: "sparkles", label: "AI", Icon: Sparkles },
  { id: "shield", label: "Shield", Icon: Shield },
  { id: "lock", label: "Lock", Icon: Lock },
  { id: "key-round", label: "Key", Icon: KeyRound },
  { id: "github", label: "GitHub", Icon: Github },
  { id: "folder-git-2", label: "Git folder", Icon: FolderGit2 },
  { id: "file-code-2", label: "Code file", Icon: FileCode2 },
  { id: "code-2", label: "Code", Icon: Code2 },
  { id: "square-terminal", label: "Terminal", Icon: SquareTerminal },
];

const catalogById = new Map(ICON_CATALOG.map((i) => [i.id, i]));

/** Resolve a Lucide icon by kebab-case id; undefined if unknown. */
export function resolveLucideIcon(name: string): LucideIcon | undefined {
  const key = name.trim().toLowerCase().replace(/\s+/g, "-");
  return catalogById.get(key)?.Icon;
}

export function defaultKindIconId(
  kind: "service" | "external" | "database" | "event" | "search" | "agent" | "repo" | "trust" | "runtime",
): string {
  switch (kind) {
    case "service":
      return "leaf";
    case "external":
      return "building-2";
    case "database":
      return "database";
    case "event":
      return "radio";
    case "search":
      return "search";
    case "agent":
      return "bot";
    case "repo":
      return "github";
    case "trust":
      return "shield";
    case "runtime":
      return "cpu";
  }
}
