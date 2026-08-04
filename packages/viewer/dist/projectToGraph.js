import { resolveBoundaryColor } from "./boundary-colors.js";
function repoPath(repository) {
    if (!repository)
        return undefined;
    if (typeof repository === "string")
        return repository;
    return repository.path;
}
function repoUrl(repository, fallbackProvider) {
    if (!repository)
        return undefined;
    const path = typeof repository === "string" ? repository : repository.path;
    if (!path)
        return undefined;
    if (/^https?:\/\//i.test(path))
        return path;
    const provider = (typeof repository === "string" ? undefined : repository.provider) ??
        fallbackProvider ??
        "github";
    if (provider === "github")
        return `https://github.com/${path}`;
    if (provider === "gitlab")
        return `https://gitlab.com/${path}`;
    return undefined;
}
function mapPorts(ports, side) {
    if (!ports?.length)
        return undefined;
    return ports.map((p) => ({
        id: p.id,
        side,
        label: p.label,
        protocol: p.protocol,
    }));
}
function componentKind(type) {
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
/** Canonical on-canvas box size per kind. Layout YAML may carry w/h, but the
 *  viewer always renders these standards (agents often emit undersized boxes). */
function defaultSize(kind) {
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
function kindSubtitle(kind, technology, subtitle) {
    if (subtitle)
        return subtitle;
    if (technology)
        return technology;
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
function kindTechLabel(kind) {
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
function memberGroupId(view, entityId) {
    return view.boundaries.find((b) => b.members.includes(entityId))?.id;
}
function requireLayout(layout, id) {
    const entry = layout[id];
    if (!entry) {
        throw new Error(`Missing layout for entity "${id}"`);
    }
    return entry;
}
function connectionEdgeKind(type) {
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
function contractLabel(contract) {
    if (!contract)
        return undefined;
    if (typeof contract === "string")
        return contract;
    return contract.type;
}
function projectGroups(view) {
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
        color: resolveBoundaryColor(b.color, b.kind ?? "trust"),
    }));
}
function projectNodes(model, view) {
    const nodes = [];
    for (const ext of model.external_systems) {
        const kind = "external";
        const layout = requireLayout(view.layout, ext.id);
        const size = defaultSize(kind);
        nodes.push({
            id: ext.id,
            kind,
            title: ext.name,
            subtitle: kindSubtitle(kind, ext.technology),
            description: ext.description,
            icon: ext.icon,
            x: layout.x,
            y: layout.y,
            w: size.w,
            h: size.h,
            group: memberGroupId(view, ext.id),
            consumes: mapPorts(ext.consumes, "in"),
            exposes: mapPorts(ext.exposes, "out"),
            repo: repoPath(ext.repository),
            repoUrl: repoUrl(ext.repository),
            notes: ext.notes,
            links: ext.links?.map((link) => ({ ...link })),
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
            description: c.description,
            icon: c.icon,
            tech: c.type === "service" || c.type === "datastore" || c.type === "search"
                ? kindTechLabel(kind)
                : kindTechLabel(kind),
            x: layout.x,
            y: layout.y,
            w: size.w,
            h: size.h,
            group: memberGroupId(view, c.id),
            consumes: mapPorts(c.consumes, "in"),
            exposes: mapPorts(c.exposes, "out"),
            repo: repoPath(c.repository),
            repoUrl: repoUrl(c.repository),
            notes: c.notes,
            links: c.links?.map((link) => ({ ...link })),
            status: c.status,
            warn: c.warn,
        });
    }
    for (const ch of model.channels) {
        const kind = "event";
        const layout = requireLayout(view.layout, ch.id);
        const size = defaultSize(kind);
        nodes.push({
            id: ch.id,
            kind,
            title: ch.name,
            subtitle: kindSubtitle(kind, ch.technology),
            description: ch.description,
            icon: ch.icon,
            tech: kindTechLabel(kind),
            x: layout.x,
            y: layout.y,
            w: size.w,
            h: size.h,
            group: memberGroupId(view, ch.id),
            consumes: mapPorts(ch.consumes, "in"),
            exposes: mapPorts(ch.exposes, "out"),
        });
    }
    for (const a of model.agents) {
        const kind = "agent";
        const layout = requireLayout(view.layout, a.id);
        const size = defaultSize(kind);
        nodes.push({
            id: a.id,
            kind,
            title: a.name,
            subtitle: kindSubtitle(kind, undefined, a.subtitle ?? a.purpose),
            description: a.description,
            icon: a.icon,
            tech: kindTechLabel(kind),
            x: layout.x,
            y: layout.y,
            w: size.w,
            h: size.h,
            group: memberGroupId(view, a.id),
            consumes: mapPorts(a.consumes, "in"),
            exposes: mapPorts(a.exposes, "out"),
            notes: a.notes,
            links: a.links?.map((link) => ({ ...link })),
        });
    }
    for (const r of model.repositories) {
        const kind = "repo";
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
            w: size.w,
            h: size.h,
            group: memberGroupId(view, r.id),
            consumes: mapPorts(r.consumes, "in"),
            exposes: mapPorts(r.exposes, "out"),
            repo: r.path,
            repoUrl: repoUrl(r.path ? { provider: r.provider, path: r.path } : undefined, r.provider),
        });
    }
    return nodes;
}
function projectEdges(model, view) {
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
            waypoints: view.routes?.[c.id ?? `e${index + 1}`]?.waypoints.map((point) => ({ ...point })),
        };
    });
}
export function projectToGraph(model, viewId) {
    const view = (viewId ? model.views.find((v) => v.id === viewId) : undefined) ??
        model.views[0];
    if (!view) {
        throw new Error("Sphere model has no views to project");
    }
    return {
        groups: projectGroups(view),
        nodes: projectNodes(model, view),
        edges: projectEdges(model, view),
    };
}
