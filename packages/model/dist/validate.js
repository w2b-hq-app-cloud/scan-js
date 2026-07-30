function issue(code, message, path, severity = "error") {
    return { code, message, path, severity };
}
function collectElements(model) {
    const out = [];
    for (let i = 0; i < model.components.length; i++) {
        const c = model.components[i];
        out.push({
            id: c.id,
            path: `components[${i}]`,
            consumes: c.consumes ?? [],
            exposes: c.exposes ?? [],
        });
    }
    for (let i = 0; i < model.channels.length; i++) {
        const c = model.channels[i];
        out.push({
            id: c.id,
            path: `channels[${i}]`,
            consumes: c.consumes ?? [],
            exposes: c.exposes ?? [],
        });
    }
    for (let i = 0; i < model.external_systems.length; i++) {
        const c = model.external_systems[i];
        out.push({
            id: c.id,
            path: `external_systems[${i}]`,
            consumes: c.consumes ?? [],
            exposes: c.exposes ?? [],
        });
    }
    for (let i = 0; i < model.agents.length; i++) {
        const c = model.agents[i];
        out.push({
            id: c.id,
            path: `agents[${i}]`,
            consumes: c.consumes ?? [],
            exposes: c.exposes ?? [],
        });
    }
    for (let i = 0; i < model.repositories.length; i++) {
        const c = model.repositories[i];
        out.push({
            id: c.id,
            path: `repositories[${i}]`,
            consumes: c.consumes ?? [],
            exposes: c.exposes ?? [],
        });
    }
    return out;
}
function checkUniqueIds(entries, code, issues) {
    const seen = new Map();
    for (const entry of entries) {
        const prev = seen.get(entry.id);
        if (prev) {
            issues.push(issue(code, `Duplicate id "${entry.id}" (also at ${prev})`, `${entry.path}.id`));
        }
        else {
            seen.set(entry.id, `${entry.path}.id`);
        }
    }
}
function checkPortUnique(ports, basePath, issues) {
    const seen = new Map();
    for (let i = 0; i < ports.length; i++) {
        const p = ports[i];
        const path = `${basePath}[${i}].id`;
        const prev = seen.get(p.id);
        if (prev) {
            issues.push(issue("duplicate-port-id", `Duplicate port id "${p.id}" on the same element (also at ${prev})`, path));
        }
        else {
            seen.set(p.id, path);
        }
    }
}
/**
 * Semantic validation beyond Zod/JSON Schema:
 * - unique element / connection / view / boundary / agent_runtime ids
 * - unique port ids within each element
 * - connections.from / .to reference existing elements
 * - fromPort / toPort reference expose / consume ports when set
 * - boundary.members reference existing elements
 * - agents[].runtime reference agent_runtimes when set
 * - layout keys reference existing elements (orphan layout -> error)
 */
export function validateScanModel(model) {
    const issues = [];
    const elements = collectElements(model);
    const elementById = new Map(elements.map((e) => [e.id, e]));
    // Element id uniqueness across all diagram entities
    checkUniqueIds(elements.map((e) => ({ id: e.id, path: e.path })), "duplicate-element-id", issues);
    // agent_runtimes
    const runtimeEntries = model.agent_runtimes.map((r, i) => ({
        id: r.id,
        path: `agent_runtimes[${i}]`,
    }));
    checkUniqueIds(runtimeEntries, "duplicate-agent-runtime-id", issues);
    const runtimeIds = new Set(model.agent_runtimes.map((r) => r.id));
    // Runtime ids should not collide with element ids
    for (const r of runtimeEntries) {
        if (elementById.has(r.id)) {
            issues.push(issue("duplicate-element-id", `agent_runtime id "${r.id}" collides with an element id`, `${r.path}.id`));
        }
    }
    // Ports unique within element (including across consumes vs exposes)
    for (const el of elements) {
        checkPortUnique(el.consumes, `${el.path}.consumes`, issues);
        checkPortUnique(el.exposes, `${el.path}.exposes`, issues);
        const consumeIds = new Set(el.consumes.map((p) => p.id));
        for (let i = 0; i < el.exposes.length; i++) {
            const p = el.exposes[i];
            if (consumeIds.has(p.id)) {
                issues.push(issue("duplicate-port-id", `Port id "${p.id}" used in both consumes and exposes on "${el.id}"`, `${el.path}.exposes[${i}].id`));
            }
        }
    }
    // Agent runtime refs
    for (let i = 0; i < model.agents.length; i++) {
        const agent = model.agents[i];
        if (agent.runtime && !runtimeIds.has(agent.runtime)) {
            issues.push(issue("unknown-agent-runtime", `Agent "${agent.id}" references unknown runtime "${agent.runtime}"`, `agents[${i}].runtime`));
        }
    }
    // Connection ids + endpoints + ports
    const connectionIdEntries = [];
    for (let i = 0; i < model.connections.length; i++) {
        const c = model.connections[i];
        const base = `connections[${i}]`;
        if (c.id) {
            connectionIdEntries.push({ id: c.id, path: base });
            if (elementById.has(c.id) || runtimeIds.has(c.id)) {
                issues.push(issue("duplicate-element-id", `Connection id "${c.id}" collides with an element or runtime id`, `${base}.id`));
            }
        }
        if (!elementById.has(c.from)) {
            issues.push(issue("unknown-connection-endpoint", `Connection from "${c.from}" does not exist`, `${base}.from`));
        }
        if (!elementById.has(c.to)) {
            issues.push(issue("unknown-connection-endpoint", `Connection to "${c.to}" does not exist`, `${base}.to`));
        }
        const fromEl = elementById.get(c.from);
        const toEl = elementById.get(c.to);
        if (c.fromPort && fromEl) {
            if (!fromEl.exposes.some((p) => p.id === c.fromPort)) {
                issues.push(issue("unknown-from-port", `fromPort "${c.fromPort}" is not an expose port on "${c.from}"`, `${base}.fromPort`));
            }
        }
        if (c.toPort && toEl) {
            if (!toEl.consumes.some((p) => p.id === c.toPort)) {
                issues.push(issue("unknown-to-port", `toPort "${c.toPort}" is not a consume port on "${c.to}"`, `${base}.toPort`));
            }
        }
    }
    checkUniqueIds(connectionIdEntries, "duplicate-connection-id", issues);
    // Views / boundaries / layout
    const viewIdEntries = model.views.map((v, i) => ({
        id: v.id,
        path: `views[${i}]`,
    }));
    checkUniqueIds(viewIdEntries, "duplicate-view-id", issues);
    for (let vi = 0; vi < model.views.length; vi++) {
        const view = model.views[vi];
        const boundaryEntries = view.boundaries.map((b, bi) => ({
            id: b.id,
            path: `views[${vi}].boundaries[${bi}]`,
        }));
        checkUniqueIds(boundaryEntries, "duplicate-boundary-id", issues);
        for (let bi = 0; bi < view.boundaries.length; bi++) {
            const b = view.boundaries[bi];
            for (let mi = 0; mi < b.members.length; mi++) {
                const member = b.members[mi];
                if (!elementById.has(member)) {
                    issues.push(issue("unknown-boundary-member", `Boundary "${b.id}" member "${member}" does not exist`, `views[${vi}].boundaries[${bi}].members[${mi}]`));
                }
            }
        }
        for (const layoutId of Object.keys(view.layout)) {
            if (!elementById.has(layoutId)) {
                issues.push(issue("unknown-layout-id", `Layout key "${layoutId}" does not match any element`, `views[${vi}].layout.${layoutId}`));
            }
        }
    }
    const errors = issues.filter((i) => i.severity === "error");
    return {
        ok: errors.length === 0,
        issues,
    };
}
/** @deprecated Use validateScanModel */
export const validateSphereModel = validateScanModel;
