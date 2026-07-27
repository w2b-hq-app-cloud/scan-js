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

type Rule = {
  from: EntityKind[];
  to: EntityKind[];
  types: ConnectionType[];
};

const RULES: Rule[] = [
  {
    from: ["external", "service"],
    to: ["service"],
    types: ["synchronous-request", "grpc-request"],
  },
  {
    from: ["service"],
    to: ["database"],
    types: ["database-access"],
  },
  {
    from: ["service", "external"],
    to: ["event"],
    types: ["event-publication"],
  },
  {
    from: ["event"],
    to: ["search", "service", "external"],
    types: ["stream-consume", "event-subscription"],
  },
  {
    from: ["agent"],
    to: ["agent"],
    types: ["agent-delegation"],
  },
  {
    from: ["agent"],
    to: ["repo"],
    types: ["git-integration"],
  },
];

export type ConnectionCheck = {
  allowed: boolean;
  reason?: string;
  suggestedType?: ConnectionType;
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

  const matches = RULES.filter((r) => r.from.includes(from) && r.to.includes(to));
  if (!matches.length) {
    return { allowed: false, reason: `No rule allows ${from} -> ${to}` };
  }

  if (type) {
    const ok = matches.some((r) => r.types.includes(type));
    if (!ok) {
      return {
        allowed: false,
        reason: `Connection type ${type} not allowed for ${from} -> ${to}`,
        suggestedType: matches[0].types[0],
      };
    }
    return { allowed: true };
  }

  return { allowed: true, suggestedType: matches[0].types[0] };
}

export function suggestConnectionType(
  model: SphereModel,
  fromId: string,
  toId: string,
): ConnectionType | undefined {
  return canConnect(model, fromId, toId).suggestedType;
}
