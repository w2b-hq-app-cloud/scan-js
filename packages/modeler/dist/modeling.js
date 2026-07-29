import { canConnect, suggestConnectionType } from "@spherescan/rules";
import { computeAutoLayout } from "./auto-layout.js";
function cloneModel(model) {
    return structuredClone(model);
}
function ensureView(model, viewId) {
    const view = (viewId ? model.views.find((v) => v.id === viewId) : undefined) ?? model.views[0];
    if (!view)
        throw new Error("Model has no views");
    return view;
}
function defaultSize(kind) {
    switch (kind) {
        case "external-system":
            return { w: 220, h: 150 };
        case "datastore":
            return { w: 220, h: 160 };
        case "repository":
            return { w: 260, h: 180 };
        default:
            return { w: 260, h: 190 };
    }
}
function createId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
const MIN_BOUNDARY_W = 160;
const MIN_BOUNDARY_H = 120;
function clampRect(rect) {
    return {
        x: rect.x,
        y: rect.y,
        w: Math.max(MIN_BOUNDARY_W, rect.w),
        h: Math.max(MIN_BOUNDARY_H, rect.h),
    };
}
function layoutCenter(layout) {
    const w = layout.w ?? 200;
    const h = layout.h ?? 160;
    return { x: layout.x + w / 2, y: layout.y + h / 2 };
}
function rectContains(rect, cx, cy) {
    return cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h;
}
/** Recompute boundary members from element centers inside each boundary rect. */
export function syncBoundaryMembership(view) {
    const ids = Object.keys(view.layout);
    for (const b of view.boundaries) {
        b.members = ids.filter((id) => {
            const layout = view.layout[id];
            if (!layout)
                return false;
            const c = layoutCenter(layout);
            return rectContains(b, c.x, c.y);
        });
    }
}
export class Modeling {
    getModel;
    setModel;
    stack;
    viewId;
    constructor(getModel, setModel, stack, viewId) {
        this.getModel = getModel;
        this.setModel = setModel;
        this.stack = stack;
        this.viewId = viewId;
    }
    replace(next, prev, label) {
        this.stack.execute({
            id: createId("cmd"),
            label,
            execute: () => this.setModel(next),
            undo: () => this.setModel(prev),
        });
    }
    moveElement(id, x, y) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const layout = view.layout[id] ?? { x: 0, y: 0 };
        view.layout[id] = { ...layout, x, y };
        syncBoundaryMembership(view);
        this.replace(next, prev, `Move ${id}`);
    }
    /** Update layout without stacking (used while dragging); commit via moveElement on pointer up. */
    previewMove(id, x, y) {
        const next = cloneModel(this.getModel());
        const view = ensureView(next, this.viewId);
        const layout = view.layout[id] ?? { x: 0, y: 0 };
        view.layout[id] = { ...layout, x, y };
        this.setModel(next);
    }
    renameElement(id, name) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const component = next.components.find((c) => c.id === id);
        if (component)
            component.name = name;
        const channel = next.channels.find((c) => c.id === id);
        if (channel)
            channel.name = name;
        const ext = next.external_systems.find((c) => c.id === id);
        if (ext)
            ext.name = name;
        const agent = next.agents.find((c) => c.id === id);
        if (agent)
            agent.name = name;
        const repo = next.repositories.find((c) => c.id === id);
        if (repo)
            repo.name = name;
        this.replace(next, prev, `Rename ${id}`);
    }
    /** Set or clear a custom diagram icon (Lucide name, URL, or data URL). */
    updateElementIcon(id, icon) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const trimmed = icon?.trim() || null;
        const apply = (el) => {
            if (!trimmed)
                delete el.icon;
            else
                el.icon = trimmed;
        };
        const component = next.components.find((c) => c.id === id);
        if (component) {
            apply(component);
            this.replace(next, prev, `Update icon ${id}`);
            return;
        }
        const channel = next.channels.find((c) => c.id === id);
        if (channel) {
            apply(channel);
            this.replace(next, prev, `Update icon ${id}`);
            return;
        }
        const ext = next.external_systems.find((c) => c.id === id);
        if (ext) {
            apply(ext);
            this.replace(next, prev, `Update icon ${id}`);
            return;
        }
        const agent = next.agents.find((c) => c.id === id);
        if (agent) {
            apply(agent);
            this.replace(next, prev, `Update icon ${id}`);
            return;
        }
        const repo = next.repositories.find((c) => c.id === id);
        if (repo) {
            apply(repo);
            this.replace(next, prev, `Update icon ${id}`);
            return;
        }
        throw new Error(`Element not found: ${id}`);
    }
    renameSystem(name) {
        const trimmed = name.trim();
        if (!trimmed)
            throw new Error("System name cannot be empty");
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        next.system.name = trimmed;
        this.replace(next, prev, `Rename system to ${trimmed}`);
    }
    deleteElement(id) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        next.components = next.components.filter((c) => c.id !== id);
        next.channels = next.channels.filter((c) => c.id !== id);
        next.external_systems = next.external_systems.filter((c) => c.id !== id);
        next.agents = next.agents.filter((c) => c.id !== id);
        next.repositories = next.repositories.filter((c) => c.id !== id);
        next.connections = next.connections.filter((c) => c.from !== id && c.to !== id);
        for (const view of next.views) {
            delete view.layout[id];
            for (const b of view.boundaries) {
                b.members = b.members.filter((m) => m !== id);
            }
        }
        this.replace(next, prev, `Delete ${id}`);
    }
    /**
     * Clone an element with a new id and offset layout.
     * Ports are remapped to unique ids; connections are not copied.
     */
    duplicateElement(id, offset = { x: 40, y: 40 }) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const component = next.components.find((c) => c.id === id);
        const channel = next.channels.find((c) => c.id === id);
        const external = next.external_systems.find((c) => c.id === id);
        const agent = next.agents.find((c) => c.id === id);
        const repo = next.repositories.find((c) => c.id === id);
        if (!component && !channel && !external && !agent && !repo) {
            throw new Error(`Element not found: ${id}`);
        }
        const prefix = component
            ? component.type === "datastore"
                ? "datastore"
                : component.type === "search"
                    ? "search"
                    : "service"
            : channel
                ? "event-stream"
                : external
                    ? "external-system"
                    : agent
                        ? "agent"
                        : "repository";
        const newId = createId(prefix);
        if (component) {
            const copy = structuredClone(component);
            copy.id = newId;
            copy.name = duplicateName(copy.name);
            copy.consumes = remapPorts(copy.consumes, id, newId);
            copy.exposes = remapPorts(copy.exposes, id, newId);
            next.components.push(copy);
        }
        else if (channel) {
            const copy = structuredClone(channel);
            copy.id = newId;
            copy.name = duplicateName(copy.name);
            copy.consumes = remapPorts(copy.consumes, id, newId);
            copy.exposes = remapPorts(copy.exposes, id, newId);
            next.channels.push(copy);
        }
        else if (external) {
            const copy = structuredClone(external);
            copy.id = newId;
            copy.name = duplicateName(copy.name);
            copy.consumes = remapPorts(copy.consumes, id, newId);
            copy.exposes = remapPorts(copy.exposes, id, newId);
            next.external_systems.push(copy);
        }
        else if (agent) {
            const copy = structuredClone(agent);
            copy.id = newId;
            copy.name = duplicateName(copy.name);
            copy.consumes = remapPorts(copy.consumes, id, newId);
            copy.exposes = remapPorts(copy.exposes, id, newId);
            next.agents.push(copy);
        }
        else if (repo) {
            const copy = structuredClone(repo);
            copy.id = newId;
            copy.name = duplicateName(copy.name);
            if (copy.path) {
                copy.path = copy.path.includes(id)
                    ? copy.path.replaceAll(id, newId)
                    : `company/${newId}`;
            }
            if (copy.subtitle?.includes(id)) {
                copy.subtitle = copy.subtitle.replaceAll(id, newId);
            }
            else if (copy.path) {
                copy.subtitle = copy.path;
            }
            copy.consumes = remapPorts(copy.consumes, id, newId);
            copy.exposes = remapPorts(copy.exposes, id, newId);
            next.repositories.push(copy);
        }
        let placed = false;
        for (const view of next.views) {
            const layout = view.layout[id];
            if (!layout)
                continue;
            view.layout[newId] = {
                ...layout,
                x: layout.x + offset.x,
                y: layout.y + offset.y,
            };
            syncBoundaryMembership(view);
            placed = true;
        }
        if (!placed) {
            const view = ensureView(next, this.viewId);
            const kind = prefix;
            const size = defaultSize(kind);
            view.layout[newId] = {
                x: offset.x,
                y: offset.y,
                w: size.w,
                h: size.h,
            };
            syncBoundaryMembership(view);
        }
        this.replace(next, prev, `Duplicate ${id}`);
        return newId;
    }
    deleteConnection(connectionId) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        next.connections = next.connections.filter((c, i) => (c.id ?? `e${i + 1}`) !== connectionId);
        this.replace(next, prev, `Delete connection ${connectionId}`);
    }
    updateConnection(connectionId, patch) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const index = next.connections.findIndex((c, i) => (c.id ?? `e${i + 1}`) === connectionId);
        if (index < 0)
            throw new Error(`Connection not found: ${connectionId}`);
        const connection = next.connections[index];
        const beforeLabel = connection.label;
        const beforeContract = typeof connection.contract === "string"
            ? connection.contract
            : connection.contract?.type ?? connection.contract?.reference;
        const beforeOps = JSON.stringify(connection.operations ?? []);
        if ("label" in patch) {
            const label = patch.label?.trim() || undefined;
            if (label === undefined)
                delete connection.label;
            else
                connection.label = label;
        }
        if ("contract" in patch) {
            const contract = patch.contract?.trim() || undefined;
            if (contract === undefined)
                delete connection.contract;
            else
                connection.contract = contract;
        }
        if ("operations" in patch) {
            const ops = (patch.operations ?? [])
                .map((o) => o.trim())
                .filter(Boolean);
            if (!ops.length)
                delete connection.operations;
            else
                connection.operations = ops;
        }
        const afterLabel = connection.label;
        const afterContract = typeof connection.contract === "string" ? connection.contract : undefined;
        const afterOps = JSON.stringify(connection.operations ?? []);
        if (beforeLabel === afterLabel &&
            beforeContract === afterContract &&
            beforeOps === afterOps) {
            return;
        }
        this.replace(next, prev, `Update connection ${connectionId}`);
    }
    createElement(kind, position, name) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const id = createId(kind);
        const size = defaultSize(kind);
        const layout = {
            x: position.x,
            y: position.y,
            w: position.w ?? size.w,
            h: position.h ?? size.h,
        };
        view.layout[id] = layout;
        const title = name ?? defaultName(kind);
        switch (kind) {
            case "service":
            case "datastore":
            case "search":
                next.components.push({
                    id,
                    name: title,
                    type: kind,
                    technology: kind === "service"
                        ? "Spring Boot"
                        : kind === "datastore"
                            ? "PostgreSQL"
                            : "Elasticsearch",
                    consumes: kind === "service" ? [{ id: `${id}-in`, label: "REST", protocol: "OpenAPI" }] : undefined,
                    exposes: kind === "service" ? [{ id: `${id}-out`, label: "REST", protocol: "OpenAPI" }] : undefined,
                });
                break;
            case "event-stream":
                next.channels.push({
                    id,
                    name: title,
                    type: "event-stream",
                    technology: "Kafka",
                    consumes: [{ id: `${id}-in`, label: "Event", protocol: "v1" }],
                    exposes: [{ id: `${id}-out`, label: "Event", protocol: "v1" }],
                });
                break;
            case "external-system":
                next.external_systems.push({
                    id,
                    name: title,
                    type: "external-system",
                    exposes: [{ id: `${id}-out`, label: "REST", protocol: "OpenAPI" }],
                });
                break;
            case "agent":
                next.agents.push({
                    id,
                    name: title,
                    subtitle: "Agent",
                    consumes: [{ id: `${id}-in`, label: "Input" }],
                    exposes: [{ id: `${id}-out`, label: "Output" }],
                });
                break;
            case "repository":
                next.repositories.push({
                    id,
                    name: title,
                    provider: "github",
                    path: `company/${id}`,
                    subtitle: `company/${id}`,
                });
                break;
        }
        syncBoundaryMembership(view);
        this.replace(next, prev, `Create ${kind}`);
        return id;
    }
    /**
     * Create a trust/runtime boundary rectangle on the active view.
     * Members are derived from elements whose centers fall inside the rect.
     */
    createBoundary(kind, rect, label) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const id = createId(kind === "runtime" ? "runtime" : "trust");
        const box = clampRect(rect);
        view.boundaries.push({
            id,
            label: label ?? (kind === "runtime" ? "Agent Runtime" : "Trust Boundary"),
            tag: kind === "trust" ? "Trust Boundary" : undefined,
            kind,
            members: [],
            ...box,
        });
        syncBoundaryMembership(view);
        this.replace(next, prev, `Create boundary ${id}`);
        return id;
    }
    renameBoundary(id, label) {
        const trimmed = label.trim();
        if (!trimmed)
            throw new Error("Boundary name cannot be empty");
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const boundary = view.boundaries.find((b) => b.id === id);
        if (!boundary)
            throw new Error(`Boundary not found: ${id}`);
        boundary.label = trimmed;
        this.replace(next, prev, `Rename boundary ${id}`);
    }
    updateBoundary(id, patch) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const boundary = view.boundaries.find((b) => b.id === id);
        if (!boundary)
            throw new Error(`Boundary not found: ${id}`);
        if ("label" in patch) {
            const label = patch.label?.trim();
            if (!label)
                throw new Error("Boundary name cannot be empty");
            boundary.label = label;
        }
        if ("tag" in patch) {
            const tag = patch.tag?.trim();
            if (!tag)
                delete boundary.tag;
            else
                boundary.tag = tag;
        }
        if (patch.kind) {
            boundary.kind = patch.kind;
            if (patch.kind === "trust" && !boundary.tag) {
                boundary.tag = "Trust Boundary";
            }
            if (patch.kind === "runtime" && boundary.tag === "Trust Boundary") {
                delete boundary.tag;
            }
        }
        if ("icon" in patch) {
            const icon = patch.icon?.trim();
            if (!icon)
                delete boundary.icon;
            else
                boundary.icon = icon;
        }
        if ("color" in patch) {
            if (!patch.color)
                delete boundary.color;
            else
                boundary.color = patch.color;
        }
        this.replace(next, prev, `Update boundary ${id}`);
    }
    deleteBoundary(id) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const before = view.boundaries.length;
        view.boundaries = view.boundaries.filter((b) => b.id !== id);
        if (view.boundaries.length === before) {
            throw new Error(`Boundary not found: ${id}`);
        }
        this.replace(next, prev, `Delete boundary ${id}`);
    }
    /** Live move while dragging; commit with moveBoundary on pointer up. Moves members with the box. */
    previewMoveBoundary(id, x, y) {
        const current = this.getModel();
        const view = ensureView(current, this.viewId);
        const boundary = view.boundaries.find((b) => b.id === id);
        if (!boundary)
            throw new Error(`Boundary not found: ${id}`);
        const nx = Math.round(x);
        const ny = Math.round(y);
        const dx = nx - boundary.x;
        const dy = ny - boundary.y;
        if (dx === 0 && dy === 0)
            return;
        const next = cloneModel(current);
        const nextView = ensureView(next, this.viewId);
        const nextBoundary = nextView.boundaries.find((b) => b.id === id);
        nextBoundary.x = nx;
        nextBoundary.y = ny;
        for (const memberId of nextBoundary.members ?? []) {
            const layout = nextView.layout[memberId];
            if (!layout)
                continue;
            nextView.layout[memberId] = {
                ...layout,
                x: layout.x + dx,
                y: layout.y + dy,
            };
        }
        this.setModel(next);
    }
    /** Translate a boundary and all of its members by the same delta. Undoable. */
    moveBoundary(id, x, y) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const boundary = view.boundaries.find((b) => b.id === id);
        if (!boundary)
            throw new Error(`Boundary not found: ${id}`);
        const nx = Math.round(x);
        const ny = Math.round(y);
        const dx = nx - boundary.x;
        const dy = ny - boundary.y;
        if (dx === 0 && dy === 0)
            return;
        boundary.x = nx;
        boundary.y = ny;
        for (const memberId of boundary.members ?? []) {
            const layout = view.layout[memberId];
            if (!layout)
                continue;
            view.layout[memberId] = {
                ...layout,
                x: layout.x + dx,
                y: layout.y + dy,
            };
        }
        syncBoundaryMembership(view);
        this.replace(next, prev, `Move boundary ${id}`);
    }
    /** Live resize while dragging; commit with resizeBoundary on pointer up. */
    previewResizeBoundary(id, rect) {
        const next = cloneModel(this.getModel());
        const view = ensureView(next, this.viewId);
        const boundary = view.boundaries.find((b) => b.id === id);
        if (!boundary)
            throw new Error(`Boundary not found: ${id}`);
        const box = clampRect(rect);
        boundary.x = box.x;
        boundary.y = box.y;
        boundary.w = box.w;
        boundary.h = box.h;
        this.setModel(next);
    }
    resizeBoundary(id, rect) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const boundary = view.boundaries.find((b) => b.id === id);
        if (!boundary)
            throw new Error(`Boundary not found: ${id}`);
        const box = clampRect(rect);
        boundary.x = box.x;
        boundary.y = box.y;
        boundary.w = box.w;
        boundary.h = box.h;
        syncBoundaryMembership(view);
        this.replace(next, prev, `Resize boundary ${id}`);
    }
    /**
     * Recompute view layout so nodes/boundaries do not overlap and edge
     * anchors face each other (labels stay readable). Undoable as one step.
     */
    autoLayout(options) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const view = ensureView(next, this.viewId);
        const planned = computeAutoLayout(next, this.viewId, options);
        for (const [id, entry] of Object.entries(planned.layout)) {
            const prevEntry = view.layout[id];
            view.layout[id] = {
                ...prevEntry,
                x: entry.x,
                y: entry.y,
                w: entry.w ?? prevEntry?.w,
                h: entry.h ?? prevEntry?.h,
            };
        }
        for (const box of planned.boundaries) {
            const boundary = view.boundaries.find((b) => b.id === box.id);
            if (!boundary)
                continue;
            boundary.x = box.x;
            boundary.y = box.y;
            boundary.w = box.w;
            boundary.h = box.h;
            boundary.members = [...box.members];
        }
        // Drop empty shells left out of the pack (or emptied by exclusive assignment).
        const packedIds = new Set(planned.boundaries.map((b) => b.id));
        view.boundaries = view.boundaries.filter((b) => packedIds.has(b.id));
        for (const side of planned.connectionSides) {
            const conn = next.connections.find((c) => c.id === side.id);
            if (!conn)
                continue;
            conn.fromSide = side.fromSide;
            conn.toSide = side.toSide;
        }
        syncBoundaryMembership(view);
        this.replace(next, prev, "Auto-layout");
    }
    connect(fromId, toId, options) {
        const model = this.getModel();
        const ports = options?.fromPort || options?.toPort
            ? { fromPort: options.fromPort, toPort: options.toPort }
            : undefined;
        const suggested = options?.type ?? suggestConnectionType(model, fromId, toId);
        const check = canConnect(model, fromId, toId, suggested, ports);
        if (!check.allowed || !suggested) {
            throw new Error(check.reason ?? "Connection not allowed");
        }
        const prev = cloneModel(model);
        const next = cloneModel(prev);
        const id = createId("e");
        const connection = {
            id,
            from: fromId,
            to: toId,
            type: suggested,
            fromSide: options?.fromSide ?? "r",
            toSide: options?.toSide ?? "l",
            label: options?.label ?? defaultLabel(suggested),
            contract: options?.contract ?? defaultContract(suggested),
            fromPort: options?.fromPort,
            toPort: options?.toPort,
        };
        next.connections.push(connection);
        this.replace(next, prev, `Connect ${fromId} -> ${toId}`);
        return id;
    }
    addPort(elementId, role, port) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const target = findPortHost(next, elementId);
        if (!target)
            throw new Error(`Element not found: ${elementId}`);
        const id = createId(role === "consume" ? `${elementId}-in` : `${elementId}-out`);
        const entry = {
            id,
            label: port?.label?.trim() || (role === "consume" ? "In" : "Out"),
            protocol: port?.protocol?.trim() || undefined,
        };
        if (role === "consume") {
            target.consumes = [...(target.consumes ?? []), entry];
        }
        else {
            target.exposes = [...(target.exposes ?? []), entry];
        }
        this.replace(next, prev, `Add ${role} port on ${elementId}`);
        return id;
    }
    updatePort(elementId, portId, patch) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const target = findPortHost(next, elementId);
        if (!target)
            throw new Error(`Element not found: ${elementId}`);
        const port = target.consumes?.find((p) => p.id === portId) ??
            target.exposes?.find((p) => p.id === portId);
        if (!port)
            throw new Error(`Port not found: ${portId}`);
        if ("label" in patch) {
            const label = patch.label?.trim();
            if (!label)
                throw new Error("Port label cannot be empty");
            port.label = label;
        }
        if ("protocol" in patch) {
            const protocol = patch.protocol?.trim();
            if (!protocol)
                delete port.protocol;
            else
                port.protocol = protocol;
        }
        this.replace(next, prev, `Update port ${portId}`);
    }
    deletePort(elementId, portId) {
        const prev = cloneModel(this.getModel());
        const next = cloneModel(prev);
        const target = findPortHost(next, elementId);
        if (!target)
            throw new Error(`Element not found: ${elementId}`);
        const beforeC = target.consumes?.length ?? 0;
        const beforeE = target.exposes?.length ?? 0;
        if (target.consumes) {
            target.consumes = target.consumes.filter((p) => p.id !== portId);
            if (!target.consumes.length)
                delete target.consumes;
        }
        if (target.exposes) {
            target.exposes = target.exposes.filter((p) => p.id !== portId);
            if (!target.exposes.length)
                delete target.exposes;
        }
        const afterC = target.consumes?.length ?? 0;
        const afterE = target.exposes?.length ?? 0;
        if (beforeC === afterC && beforeE === afterE) {
            throw new Error(`Port not found: ${portId}`);
        }
        for (const c of next.connections) {
            if (c.fromPort === portId)
                delete c.fromPort;
            if (c.toPort === portId)
                delete c.toPort;
        }
        this.replace(next, prev, `Delete port ${portId}`);
    }
}
function findPortHost(model, id) {
    return (model.components.find((c) => c.id === id) ??
        model.channels.find((c) => c.id === id) ??
        model.external_systems.find((c) => c.id === id) ??
        model.agents.find((c) => c.id === id) ??
        model.repositories.find((c) => c.id === id));
}
function defaultName(kind) {
    switch (kind) {
        case "service":
            return "New Service";
        case "datastore":
            return "New Database";
        case "search":
            return "New Search Index";
        case "event-stream":
            return "New Event Stream";
        case "external-system":
            return "External System";
        case "agent":
            return "New Agent";
        case "repository":
            return "GitHub Repository";
    }
}
function duplicateName(name) {
    const trimmed = name.trim();
    if (/ copy(?: \d+)?$/i.test(trimmed)) {
        const base = trimmed.replace(/ copy(?: \d+)?$/i, "");
        const match = trimmed.match(/ copy(?: (\d+))?$/i);
        const n = match?.[1] ? Number(match[1]) + 1 : 2;
        return `${base} copy ${n}`;
    }
    return `${trimmed} copy`;
}
function remapPorts(ports, oldId, newId) {
    if (!ports?.length)
        return ports;
    return ports.map((p, i) => ({
        ...p,
        id: p.id.includes(oldId) ? p.id.replaceAll(oldId, newId) : `${newId}-p${i}`,
    }));
}
function defaultLabel(type) {
    switch (type) {
        case "synchronous-request":
            return "REST";
        case "grpc-request":
            return "gRPC";
        case "database-access":
            return "DB Access";
        case "event-publication":
            return "Publish";
        case "stream-consume":
        case "event-subscription":
            return "Stream";
        case "git-integration":
            return "Git Integration";
        default:
            return undefined;
    }
}
function defaultContract(type) {
    switch (type) {
        case "synchronous-request":
            return "OpenAPI";
        case "grpc-request":
            return "Proto";
        case "database-access":
            return "JDBC";
        case "event-publication":
        case "stream-consume":
        case "event-subscription":
            return "AsyncAPI";
        default:
            return undefined;
    }
}
export function nodeKindToCreateKind(kind) {
    switch (kind) {
        case "service":
            return "service";
        case "database":
            return "datastore";
        case "search":
            return "search";
        case "event":
            return "event-stream";
        case "external":
            return "external-system";
        case "agent":
            return "agent";
        case "repo":
            return "repository";
        default:
            return null;
    }
}
