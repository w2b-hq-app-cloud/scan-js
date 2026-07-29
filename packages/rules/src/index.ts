// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ConnectionType, SphereModel, SpherePort } from "@spherescan/model";

export type EntityKind =
  | "service"
  | "database"
  | "search"
  | "event"
  | "external"
  | "agent"
  | "repo"
  | "unknown";

export type EntityPorts = {
  consumes: SpherePort[];
  exposes: SpherePort[];
};

/**
 * Capability tokens used for relaxed default connection validation.
 * Kind pairs are suggestions; capabilities decide whether an edge is plausible.
 */
export type NodeCapability =
  | "accept-request"
  | "initiate-request"
  | "publish-event"
  | "consume-event"
  | "state-access"
  | "delegate"
  | "git-source"
  | "git-consume";

const KIND_CAPABILITIES: Record<Exclude<EntityKind, "unknown">, ReadonlySet<NodeCapability>> = {
  service: new Set([
    "accept-request",
    "initiate-request",
    "publish-event",
    "consume-event",
    "state-access",
    "delegate",
    "git-consume",
  ]),
  external: new Set([
    "accept-request",
    "initiate-request",
    "publish-event",
    "consume-event",
  ]),
  database: new Set(["state-access"]),
  search: new Set(["accept-request", "consume-event", "state-access"]),
  event: new Set(["publish-event", "consume-event"]),
  agent: new Set([
    "accept-request",
    "initiate-request",
    "publish-event",
    "consume-event",
    "delegate",
    "git-source",
    "git-consume",
  ]),
  repo: new Set(["git-source", "git-consume"]),
};

/** Map model entity id -> coarse kind used by connection rules. */
export function resolveEntityKind(model: SphereModel, id: string): EntityKind {
  if (model.external_systems.some((e) => e.id === id)) return "external";
  if (model.channels.some((c) => c.id === id)) return "event";
  if (model.agents.some((a) => a.id === id)) return "agent";
  if (model.repositories.some((r) => r.id === id)) return "repo";
  const component = model.components.find((c) => c.id === id);
  if (!component) return "unknown";
  switch (component.type) {
    case "service":
      return "service";
    case "datastore":
      return "database";
    case "search":
      return "search";
    case "event-stream":
      return "event";
    case "external-system":
      return "external";
    case "agent":
      return "agent";
    case "repository":
      return "repo";
    default:
      return "unknown";
  }
}

export function capabilitiesForKind(kind: EntityKind): ReadonlySet<NodeCapability> {
  if (kind === "unknown") return new Set();
  return KIND_CAPABILITIES[kind];
}

/** Resolve consume/expose ports for any model element id. */
export function resolveEntityPorts(model: SphereModel, id: string): EntityPorts {
  const empty: EntityPorts = { consumes: [], exposes: [] };
  const component = model.components.find((c) => c.id === id);
  if (component) {
    return {
      consumes: component.consumes ?? [],
      exposes: component.exposes ?? [],
    };
  }
  const channel = model.channels.find((c) => c.id === id);
  if (channel) {
    return {
      consumes: channel.consumes ?? [],
      exposes: channel.exposes ?? [],
    };
  }
  const ext = model.external_systems.find((e) => e.id === id);
  if (ext) {
    return {
      consumes: ext.consumes ?? [],
      exposes: ext.exposes ?? [],
    };
  }
  const agent = model.agents.find((a) => a.id === id);
  if (agent) {
    return {
      consumes: agent.consumes ?? [],
      exposes: agent.exposes ?? [],
    };
  }
  const repo = model.repositories.find((r) => r.id === id);
  if (repo) {
    return {
      consumes: repo.consumes ?? [],
      exposes: repo.exposes ?? [],
    };
  }
  return empty;
}

/**
 * Pedagogical / suggest-first matrix. Used for suggestedType and documentation;
 * not the sole legality gate (see capability checks below).
 */
type SuggestRule = {
  from: EntityKind[];
  to: EntityKind[];
  types: ConnectionType[];
};

const SUGGEST_RULES: SuggestRule[] = [
  {
    from: ["external", "service", "agent"],
    to: ["service", "external", "agent", "search"],
    types: ["synchronous-request", "grpc-request"],
  },
  {
    from: ["service", "external", "agent", "database", "search"],
    to: ["database", "search", "service"],
    types: ["database-access"],
  },
  {
    from: ["service", "external", "agent"],
    to: ["event"],
    types: ["event-publication"],
  },
  {
    from: ["event"],
    to: ["search", "service", "external", "agent"],
    types: ["stream-consume", "event-subscription"],
  },
  {
    from: ["agent", "service"],
    to: ["agent"],
    types: ["agent-delegation"],
  },
  {
    from: ["agent", "service", "repo"],
    to: ["repo", "service", "agent"],
    types: ["git-integration"],
  },
];

export type ConnectionCheck = {
  allowed: boolean;
  reason?: string;
  suggestedType?: ConnectionType;
  /** true when allowed via capability fit rather than a classic matrix row */
  relaxed?: boolean;
};

export type ConnectPortOptions = {
  fromPort?: string;
  toPort?: string;
};

function checkPorts(
  model: SphereModel,
  fromId: string,
  toId: string,
  ports?: ConnectPortOptions,
): ConnectionCheck | null {
  if (!ports?.fromPort && !ports?.toPort) return null;

  const fromPorts = resolveEntityPorts(model, fromId);
  const toPorts = resolveEntityPorts(model, toId);

  if (ports.fromPort) {
    const exposed = fromPorts.exposes.some((p) => p.id === ports.fromPort);
    if (!exposed) {
      return {
        allowed: false,
        reason: `Port "${ports.fromPort}" is not an expose port on ${fromId}`,
      };
    }
  }

  if (ports.toPort) {
    const consumed = toPorts.consumes.some((p) => p.id === ports.toPort);
    if (!consumed) {
      return {
        allowed: false,
        reason: `Port "${ports.toPort}" is not a consume port on ${toId}`,
      };
    }
  }

  return null;
}

function hasCap(kind: EntityKind, cap: NodeCapability): boolean {
  return capabilitiesForKind(kind).has(cap);
}

/**
 * Capability fit for a connection type. Returns false for structurally
 * impossible combinations (e.g. database initiating agent-delegation).
 */
export function connectionTypeFitsCapabilities(
  from: EntityKind,
  to: EntityKind,
  type: ConnectionType,
): boolean {
  switch (type) {
    case "synchronous-request":
    case "grpc-request":
      return hasCap(from, "initiate-request") && hasCap(to, "accept-request");
    case "event-publication":
      return hasCap(from, "publish-event") && to === "event";
    case "event-subscription":
    case "stream-consume":
      return from === "event" && hasCap(to, "consume-event");
    case "database-access":
      // Prefer store on either end; allow analytics/read patterns in either direction.
      return (
        (hasCap(from, "state-access") && hasCap(to, "state-access")) ||
        (hasCap(from, "initiate-request") && to === "database") ||
        (from === "database" && hasCap(to, "state-access"))
      );
    case "agent-delegation":
      return hasCap(from, "delegate") && (to === "agent" || to === "service");
    case "git-integration": {
      const fromGit = hasCap(from, "git-source") || hasCap(from, "git-consume");
      const toGit = hasCap(to, "git-source") || hasCap(to, "git-consume");
      return fromGit && toGit && (from === "repo" || to === "repo");
    }
    default:
      return false;
  }
}

function suggestFromMatrix(from: EntityKind, to: EntityKind): ConnectionType | undefined {
  const matches = SUGGEST_RULES.filter((r) => r.from.includes(from) && r.to.includes(to));
  return matches[0]?.types[0];
}

function firstFittingType(from: EntityKind, to: EntityKind): ConnectionType | undefined {
  const preferred = suggestFromMatrix(from, to);
  if (preferred && connectionTypeFitsCapabilities(from, to, preferred)) {
    return preferred;
  }
  const order: ConnectionType[] = [
    "synchronous-request",
    "grpc-request",
    "event-publication",
    "stream-consume",
    "event-subscription",
    "database-access",
    "agent-delegation",
    "git-integration",
  ];
  return order.find((t) => connectionTypeFitsCapabilities(from, to, t));
}

export function canConnect(
  model: SphereModel,
  fromId: string,
  toId: string,
  type?: ConnectionType,
  ports?: ConnectPortOptions,
): ConnectionCheck {
  if (fromId === toId) {
    return { allowed: false, reason: "Cannot connect an element to itself" };
  }
  const from = resolveEntityKind(model, fromId);
  const to = resolveEntityKind(model, toId);
  if (from === "unknown" || to === "unknown") {
    return { allowed: false, reason: "Unknown source or target element" };
  }

  const portCheck = checkPorts(model, fromId, toId, ports);
  if (portCheck) return portCheck;

  const matrixMatch = SUGGEST_RULES.some(
    (r) =>
      r.from.includes(from) &&
      r.to.includes(to) &&
      (!type || r.types.includes(type)),
  );

  if (type) {
    if (!connectionTypeFitsCapabilities(from, to, type)) {
      const suggested = firstFittingType(from, to);
      return {
        allowed: false,
        reason: `Connection type ${type} is not semantically plausible for ${from} -> ${to}`,
        suggestedType: suggested,
      };
    }
    return {
      allowed: true,
      suggestedType: type,
      relaxed: !matrixMatch,
    };
  }

  const suggested = firstFittingType(from, to);
  if (!suggested) {
    return { allowed: false, reason: `No plausible connection for ${from} -> ${to}` };
  }
  return {
    allowed: true,
    suggestedType: suggested,
    relaxed: !matrixMatch,
  };
}

export function suggestConnectionType(
  model: SphereModel,
  fromId: string,
  toId: string,
): ConnectionType | undefined {
  return canConnect(model, fromId, toId).suggestedType;
}
