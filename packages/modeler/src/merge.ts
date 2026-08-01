import type { SphereModel } from "@spherescan/model";
import { diagramBounds, projectToGraph } from "@spherescan/viewer";
import { cloneModel, createId } from "./modeling.js";

export type MergeOptions = {
  /** Pixel offset applied to incoming nodes/boundaries. Defaults to placing
   *  incoming content to the right of the target's current bounds. */
  offset?: { x: number; y: number };
};

type IdMap = Map<string, string>;

/** Mints a fresh id for every id in `incoming` that collides with `target`. */
function buildIdMap(target: SphereModel, incoming: SphereModel): IdMap {
  const targetIds = new Set<string>();
  for (const c of target.components) targetIds.add(c.id);
  for (const c of target.channels) targetIds.add(c.id);
  for (const c of target.external_systems) targetIds.add(c.id);
  for (const a of target.agents) targetIds.add(a.id);
  for (const r of target.agent_runtimes) targetIds.add(r.id);
  for (const r of target.repositories) targetIds.add(r.id);
  for (const conn of target.connections) if (conn.id) targetIds.add(conn.id);
  for (const view of target.views) {
    for (const b of view.boundaries) targetIds.add(b.id);
  }

  const kindPrefix = (id: string): string => {
    if (incoming.components.some((c) => c.id === id)) return "service";
    if (incoming.channels.some((c) => c.id === id)) return "event-stream";
    if (incoming.external_systems.some((c) => c.id === id)) return "external-system";
    if (incoming.agents.some((c) => c.id === id)) return "agent";
    if (incoming.agent_runtimes.some((c) => c.id === id)) return "runtime";
    if (incoming.repositories.some((c) => c.id === id)) return "repository";
    return "boundary";
  };

  const map: IdMap = new Map();
  const allIncomingIds = new Set<string>();
  for (const c of incoming.components) allIncomingIds.add(c.id);
  for (const c of incoming.channels) allIncomingIds.add(c.id);
  for (const c of incoming.external_systems) allIncomingIds.add(c.id);
  for (const a of incoming.agents) allIncomingIds.add(a.id);
  for (const r of incoming.agent_runtimes) allIncomingIds.add(r.id);
  for (const r of incoming.repositories) allIncomingIds.add(r.id);
  for (const view of incoming.views) {
    for (const b of view.boundaries) allIncomingIds.add(b.id);
  }

  for (const id of allIncomingIds) {
    if (targetIds.has(id)) {
      map.set(id, createId(kindPrefix(id)));
    }
  }

  // Ports and connections get their own ids remapped only if they collide too.
  const portIds = new Set<string>();
  const collectPorts = (arr: { consumes?: { id: string }[]; exposes?: { id: string }[] }[]) => {
    for (const el of arr) {
      for (const p of el.consumes ?? []) portIds.add(p.id);
      for (const p of el.exposes ?? []) portIds.add(p.id);
    }
  };
  collectPorts(incoming.components);
  collectPorts(incoming.channels);
  collectPorts(incoming.external_systems);
  collectPorts(incoming.agents);
  collectPorts(incoming.repositories);

  const targetPortIds = new Set<string>();
  const collectTargetPorts = (arr: { consumes?: { id: string }[]; exposes?: { id: string }[] }[]) => {
    for (const el of arr) {
      for (const p of el.consumes ?? []) targetPortIds.add(p.id);
      for (const p of el.exposes ?? []) targetPortIds.add(p.id);
    }
  };
  collectTargetPorts(target.components);
  collectTargetPorts(target.channels);
  collectTargetPorts(target.external_systems);
  collectTargetPorts(target.agents);
  collectTargetPorts(target.repositories);

  for (const id of portIds) {
    if (targetPortIds.has(id)) map.set(id, createId("port"));
  }

  for (const conn of incoming.connections) {
    if (conn.id && targetIds.has(conn.id)) map.set(conn.id, createId("conn"));
  }

  return map;
}

function mapped(map: IdMap, id: string): string {
  return map.get(id) ?? id;
}

function remapElement<T extends { id: string; consumes?: { id: string }[]; exposes?: { id: string }[] }>(
  el: T,
  map: IdMap,
): T {
  const copy = structuredClone(el);
  copy.id = mapped(map, el.id);
  if (copy.consumes) copy.consumes = copy.consumes.map((p) => ({ ...p, id: mapped(map, p.id) }));
  if (copy.exposes) copy.exposes = copy.exposes.map((p) => ({ ...p, id: mapped(map, p.id) }));
  return copy;
}

/**
 * Merges `incoming`'s elements/connections/boundaries/layout (for `viewId`,
 * or its first view) into a clone of `target`, remapping any colliding ids
 * and offsetting incoming content so it doesn't overlap existing nodes.
 * Returns the merged model; does not mutate either input.
 */
export function mergeModels(
  target: SphereModel,
  incoming: SphereModel,
  viewId?: string,
  options?: MergeOptions,
): SphereModel {
  const next = cloneModel(target);
  const map = buildIdMap(target, incoming);

  next.components.push(...incoming.components.map((c) => remapElement(c, map)));
  next.channels.push(...incoming.channels.map((c) => remapElement(c, map)));
  next.external_systems.push(...incoming.external_systems.map((c) => remapElement(c, map)));
  next.agents.push(
    ...incoming.agents.map((a) => {
      const copy = remapElement(a, map);
      if (copy.runtime) copy.runtime = mapped(map, copy.runtime);
      return copy;
    }),
  );
  next.agent_runtimes.push(
    ...incoming.agent_runtimes.map((r) => ({ ...structuredClone(r), id: mapped(map, r.id) })),
  );
  next.repositories.push(...incoming.repositories.map((c) => remapElement(c, map)));

  next.connections.push(
    ...incoming.connections.map((conn) => ({
      ...structuredClone(conn),
      id: conn.id ? mapped(map, conn.id) : conn.id,
      from: mapped(map, conn.from),
      to: mapped(map, conn.to),
      fromPort: conn.fromPort ? mapped(map, conn.fromPort) : conn.fromPort,
      toPort: conn.toPort ? mapped(map, conn.toPort) : conn.toPort,
    })),
  );

  const targetView = (viewId ? target.views.find((v) => v.id === viewId) : undefined) ?? target.views[0];
  const incomingView = (viewId ? incoming.views.find((v) => v.id === viewId) : undefined) ?? incoming.views[0];
  const nextView = (viewId ? next.views.find((v) => v.id === viewId) : undefined) ?? next.views[0];
  if (!targetView || !incomingView || !nextView) return next;

  const targetBounds = diagramBounds(projectToGraph(target, targetView.id));
  const incomingBounds = diagramBounds(projectToGraph(incoming, incomingView.id));
  const offset = options?.offset ?? {
    x: targetBounds.x + targetBounds.width + 120 - incomingBounds.x,
    y: targetBounds.y - incomingBounds.y,
  };

  for (const [id, entry] of Object.entries(incomingView.layout)) {
    nextView.layout[mapped(map, id)] = {
      ...entry,
      x: entry.x + offset.x,
      y: entry.y + offset.y,
    };
  }

  for (const b of incomingView.boundaries) {
    nextView.boundaries.push({
      ...structuredClone(b),
      id: mapped(map, b.id),
      members: b.members.map((m) => mapped(map, m)),
      x: b.x + offset.x,
      y: b.y + offset.y,
    });
  }

  return next;
}
