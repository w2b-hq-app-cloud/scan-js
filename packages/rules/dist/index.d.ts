import type { ConnectionType, SphereModel, SpherePort } from "@spherescan/model";
export type EntityKind = "service" | "database" | "search" | "event" | "external" | "agent" | "repo" | "unknown";
export type EntityPorts = {
    consumes: SpherePort[];
    exposes: SpherePort[];
};
/** Map model entity id â†’ coarse kind used by connection rules. */
export declare function resolveEntityKind(model: SphereModel, id: string): EntityKind;
/** Resolve consume/expose ports for any model element id. */
export declare function resolveEntityPorts(model: SphereModel, id: string): EntityPorts;
export type ConnectionCheck = {
    allowed: boolean;
    reason?: string;
    suggestedType?: ConnectionType;
};
export type ConnectPortOptions = {
    fromPort?: string;
    toPort?: string;
};
export declare function canConnect(model: SphereModel, fromId: string, toId: string, type?: ConnectionType, ports?: ConnectPortOptions): ConnectionCheck;
export declare function suggestConnectionType(model: SphereModel, fromId: string, toId: string): ConnectionType | undefined;
