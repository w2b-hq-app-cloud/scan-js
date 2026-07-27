import type { SphereConnection, SphereModel, SphereView } from "@spherescan/model";
import type {
  BoardGraph,
  NodeKind,
  Port,
  SphereEdge,
  SphereGroup,
  SphereNode,
} from "./board-types.js";

type LayoutMap = SphereView["layout"];

function repoPath(
  repository: string | { provider?: string; path: string } | undefined,
): string | undefined {
  if (!repository) return undefined;
  if (typeof repository === "string") return repository;
  return repository.path;
}

function repoUrl(
  repository: string | { provider?: string; path: string } | undefined,
  fallbackProvider?: string,
): string | undefined {
  if (!repository) return undefined;
  const path = typeof repository === "string" ? repository : repository.path;
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const provider =
    (typeof repository === "string" ? undefined : repository.provider) ??
    fallbackProvider ??
    "github";
  if (provider === "github") return `https://github.com/${path}`;
  if (provider === "gitlab") return `https://gitlab.com/${path}`;
  return undefined;
}

function mapPorts(
  ports: { id: string; label: string; protocol?: string }[] | undefined,
  side: "in" | "out",
): Port[] | undefined {
  if (!ports?.length) return undefined;
  return ports.map((p) => ({
    id: p.id,
    side,
    label: p.label,
    protocol: p.protocol,
  }));
}

function componentKind(
  type: string,
): NodeKind {
  switch (type) {
    case "service":
      return "service";
    case "datastore":
      return "database";
    case "search":
      return "search";
    case "external-system":
      return "external";
    case "agent":
      return "agent";
    case "repository":
      return "repo";
    case "event-stream":
      return "event";
    default:
      return "service";
  }
}

function defaultSize(kind: NodeKind): { w: number; h: number } {
  switch (kind) {
    case "external":
      return { w: 220, h: 150 };
    case "database":
      return { w: 220, h: 160 };
    case "repo":
      return { w: 260, h: 180 };
    default:
      return { w: 260, h: 190 };
  }
}

function kindSubtitle(kind: NodeKind, technology?: string, subtitle?: string): string | undefined {
  if (subtitle) return subtitle;
  if (technology) return technology;
  switch (kind) {
    case "external":
      return "External System";
    case "agent":
      return "Agent";
    case "repo":
      return "Repository";
    default:
      return technology;
  }
}

function kindTechLabel(kind: NodeKind): string | undefined {
  switch (kind) {
    case "service":
      return "Service";
    case "database":
      return "Database";
    case "event":
      return "Event Stream";
    case "search":
      return "Search";
    case "agent":
      return "Agent";
    case "repo":
      return "Repository";
    default:
      return undefined;
  }
}

function memberGroupId(view: SphereView, entityId: string): string | undefined {
  return view.boundaries.find((b) => b.members.includes(entityId))?.id;
}

function requireLayout(layout: LayoutMap, id: string) {
  const entry = layout[id];
  if (!entry) {
    throw new Error(`Missing layout for entity "${id}"`);
  }
  return entry;
}

function connectionEdgeKind(
  type: SphereConnection["type"],
): SphereEdge["kind"] {
  switch (type) {
    case "synchronous-request":
      return "rest";
    case "grpc-request":
      return "grpc";
    case "database-access":
      return "db";
    case "event-publication":
      return "async";
    case "event-subscription":
    case "stream-consume":
      return "stream";
    case "agent-delegation":
      return "flow";
    case "git-integration":
      return "git";
    default:
      return "rest";
  }
}

function contractLabel(
  contract: SphereConnection["contract"],
): string | undefined {
  if (!contract) return undefined;
  if (typeof contract === "string") return contract;
  return contract.type;
}

function projectGroups(view: SphereView): SphereGroup[] {
  return view.boundaries.map((b) => ({
    id: b.id,
    title: b.label,
    tag: b.tag,
    kind: b.kind ?? "trust",
    icon: b.icon,
    members: [...(b.members ?? [])],
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    color: b.kind === "runtime" ? "agent" : "svc",
  }));
}

function projectNodes(model: SphereModel, view: SphereView): SphereNode[] {
  const nodes: SphereNode[] = [];

  for (const ext of model.external_systems) {
    const kind: NodeKind = "external";
    const layout = requireLayout(view.layout, ext.id);
    const size = defaultSize(kind);
    nodes.push({
      id: ext.id,
      kind,
      title: ext.name,
      subtitle: kindSubtitle(kind, ext.technology),
      icon: ext.icon,
      x: layout.x,
      y: layout.y,
      w: layout.w ?? size.w,
      h: layout.h ?? size.h,
      group: memberGroupId(view, ext.id),
      consumes: mapPorts(ext.consumes, "in"),
      exposes: mapPorts(ext.exposes, "out"),
      repo: repoPath(ext.repository),
      repoUrl: repoUrl(ext.repository),
    });
  }

  for (const c of model.components) {
    const kind = componentKind(c.type);
    const layout = requireLayout(view.layout, c.id);
    const size = defaultSize(kind);
    nodes.push({
      id: c.id,
      kind,
      title: c.name,
      subtitle: kindSubtitle(kind, c.technology, c.subtitle),
      icon: c.icon,
      tech: c.type === "service" || c.type === "datastore" || c.type === "search"
        ? kindTechLabel(kind)
        : kindTechLabel(kind),
      x: layout.x,
      y: layout.y,
      w: layout.w ?? size.w,
      h: layout.h ?? size.h,
      group: memberGroupId(view, c.id),
      consumes: mapPorts(c.consumes, "in"),
      exposes: mapPorts(c.exposes, "out"),
      repo: repoPath(c.repository),
      repoUrl: repoUrl(c.repository),
      status: c.status,
      warn: c.warn,
    });
  }

  for (const ch of model.channels) {
    const kind: NodeKind = "event";
    const layout = requireLayout(view.layout, ch.id);
    const size = defaultSize(kind);
    nodes.push({
      id: ch.id,
      kind,
      title: ch.name,
      subtitle: kindSubtitle(kind, ch.technology),
      icon: ch.icon,
      tech: kindTechLabel(kind),
      x: layout.x,
      y: layout.y,
      w: layout.w ?? size.w,
      h: layout.h ?? size.h,
      group: memberGroupId(view, ch.id),
      consumes: mapPorts(ch.consumes, "in"),
      exposes: mapPorts(ch.exposes, "out"),
    });
  }

  for (const a of model.agents) {
    const kind: NodeKind = "agent";
    const layout = requireLayout(view.layout, a.id);
    const size = defaultSize(kind);
    nodes.push({
      id: a.id,
      kind,
      title: a.name,
      subtitle: kindSubtitle(kind, undefined, a.subtitle ?? a.purpose),
      icon: a.icon,
      tech: kindTechLabel(kind),
      x: layout.x,
      y: layout.y,
      w: layout.w ?? size.w,
      h: layout.h ?? size.h,
      group: memberGroupId(view, a.id),
      consumes: mapPorts(a.consumes, "in"),
      exposes: mapPorts(a.exposes, "out"),
    });
  }

  for (const r of model.repositories) {
    const kind: NodeKind = "repo";
    const layout = requireLayout(view.layout, r.id);
    const size = defaultSize(kind);
    nodes.push({
      id: r.id,
      kind,
      title: r.name,
      subtitle: kindSubtitle(kind, undefined, r.subtitle ?? r.path),
      icon: r.icon,
      tech: kindTechLabel(kind),
      x: layout.x,
      y: layout.y,
      w: layout.w ?? size.w,
      h: layout.h ?? size.h,
      group: memberGroupId(view, r.id),
      consumes: mapPorts(r.consumes, "in"),
      exposes: mapPorts(r.exposes, "out"),
      repo: r.path,
      repoUrl: repoUrl(
        r.path ? { provider: r.provider, path: r.path } : undefined,
        r.provider,
      ),
    });
  }

  return nodes;
}

function projectEdges(model: SphereModel): SphereEdge[] {
  return model.connections.map((c, index) => {
    const kind = connectionEdgeKind(c.type);
    return {
      id: c.id ?? `e${index + 1}`,
      from: c.from,
      to: c.to,
      fromSide: c.fromSide,
      toSide: c.toSide,
      kind,
      label: c.label,
      contract: contractLabel(c.contract),
      fromPort: c.fromPort,
      toPort: c.toPort,
      operations: c.operations?.length ? [...c.operations] : undefined,
    };
  });
}

export function projectToGraph(model: SphereModel, viewId?: string): BoardGraph {
  const view =
    (viewId ? model.views.find((v) => v.id === viewId) : undefined) ??
    model.views[0];

  if (!view) {
    throw new Error("Sphere model has no views to project");
  }

  return {
    groups: projectGroups(view),
    nodes: projectNodes(model, view),
    edges: projectEdges(model),
  };
}
