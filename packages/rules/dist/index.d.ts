import type { ConnectionType, SphereModel, SpherePort } from "@spherescan/model";
export type EntityKind = "service" | "database" | "search" | "event" | "external" | "agent" | "repo" | "unknown";
export type EntityPorts = {
    consumes: SpherePort[];
    exposes: SpherePort[];
};
/**
 * Capability tokens used for relaxed default connection validation.
 * Kind pairs are suggestions; capabilities decide whether an edge is plausible.
 */
export type NodeCapability = "accept-request" | "initiate-request" | "publish-event" | "consume-event" | "state-access" | "delegate" | "git-source" | "git-consume";
/** Map model entity id -> coarse kind used by connection rules. */
export declare function resolveEntityKind(model: SphereModel, id: string): EntityKind;
export declare function capabilitiesForKind(kind: EntityKind): ReadonlySet<NodeCapability>;
/** Resolve consume/expose ports for any model element id. */
export declare function resolveEntityPorts(model: SphereModel, id: string): EntityPorts;
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
/**
 * Capability fit for a connection type. Returns false for structurally
 * impossible combinations (e.g. database initiating agent-delegation).
 */
export declare function connectionTypeFitsCapabilities(from: EntityKind, to: EntityKind, type: ConnectionType): boolean;
export declare function canConnect(model: SphereModel, fromId: string, toId: string, type?: ConnectionType, ports?: ConnectPortOptions): ConnectionCheck;
export declare function suggestConnectionType(model: SphereModel, fromId: string, toId: string): ConnectionType | undefined;
