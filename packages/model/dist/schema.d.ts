import { z } from "zod";
export declare const SCAN_VERSION = "0.1";
/** @deprecated Use SCAN_VERSION */
export declare const SPHERE_VERSION = "0.1";
declare const portSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    protocol: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    protocol?: string | undefined;
}, {
    id: string;
    label: string;
    protocol?: string | undefined;
}>;
/**
 * Optional diagram icon override.
 * - Lucide name (e.g. `shield`, `database`)
 * - `https://...` / `http://...` image URL
 * - `data:image/...` (uploaded file encoded as data URL)
 */
export declare const iconSchema: z.ZodOptional<z.ZodString>;
declare const componentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["service", "datastore", "search", "external-system", "agent", "repository", "event-stream"]>;
    technology: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        provider: z.ZodOptional<z.ZodString>;
        path: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        provider?: string | undefined;
    }, {
        path: string;
        provider?: string | undefined;
    }>, z.ZodString]>>;
    consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        protocol: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        protocol?: string | undefined;
    }, {
        id: string;
        label: string;
        protocol?: string | undefined;
    }>, "many">>;
    exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        protocol: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        protocol?: string | undefined;
    }, {
        id: string;
        label: string;
        protocol?: string | undefined;
    }>, "many">>;
    status: z.ZodOptional<z.ZodEnum<["ok", "warn"]>>;
    warn: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
    name: string;
    status?: "ok" | "warn" | undefined;
    repository?: string | {
        path: string;
        provider?: string | undefined;
    } | undefined;
    technology?: string | undefined;
    subtitle?: string | undefined;
    icon?: string | undefined;
    consumes?: {
        id: string;
        label: string;
        protocol?: string | undefined;
    }[] | undefined;
    exposes?: {
        id: string;
        label: string;
        protocol?: string | undefined;
    }[] | undefined;
    warn?: string | undefined;
}, {
    id: string;
    type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
    name: string;
    status?: "ok" | "warn" | undefined;
    repository?: string | {
        path: string;
        provider?: string | undefined;
    } | undefined;
    technology?: string | undefined;
    subtitle?: string | undefined;
    icon?: string | undefined;
    consumes?: {
        id: string;
        label: string;
        protocol?: string | undefined;
    }[] | undefined;
    exposes?: {
        id: string;
        label: string;
        protocol?: string | undefined;
    }[] | undefined;
    warn?: string | undefined;
}>;
export declare const connectionTypeSchema: z.ZodEnum<["synchronous-request", "event-publication", "event-subscription", "database-access", "stream-consume", "agent-delegation", "git-integration", "grpc-request"]>;
declare const connectionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    from: z.ZodString;
    to: z.ZodString;
    type: z.ZodEnum<["synchronous-request", "event-publication", "event-subscription", "database-access", "stream-consume", "agent-delegation", "git-integration", "grpc-request"]>;
    protocol: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    contract: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        reference: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type?: string | undefined;
        reference?: string | undefined;
    }, {
        type?: string | undefined;
        reference?: string | undefined;
    }>, z.ZodString]>>;
    fromSide: z.ZodOptional<z.ZodEnum<["l", "r", "t", "b"]>>;
    toSide: z.ZodOptional<z.ZodEnum<["l", "r", "t", "b"]>>;
    /** Source port id (typically an expose port on `from`) */
    fromPort: z.ZodOptional<z.ZodString>;
    /** Target port id (typically a consume port on `to`) */
    toPort: z.ZodOptional<z.ZodString>;
    /** Endpoints, RPCs, topics, or queries used on this connection */
    operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
    from: string;
    to: string;
    id?: string | undefined;
    label?: string | undefined;
    protocol?: string | undefined;
    contract?: string | {
        type?: string | undefined;
        reference?: string | undefined;
    } | undefined;
    fromSide?: "l" | "r" | "t" | "b" | undefined;
    toSide?: "l" | "r" | "t" | "b" | undefined;
    fromPort?: string | undefined;
    toPort?: string | undefined;
    operations?: string[] | undefined;
}, {
    type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
    from: string;
    to: string;
    id?: string | undefined;
    label?: string | undefined;
    protocol?: string | undefined;
    contract?: string | {
        type?: string | undefined;
        reference?: string | undefined;
    } | undefined;
    fromSide?: "l" | "r" | "t" | "b" | undefined;
    toSide?: "l" | "r" | "t" | "b" | undefined;
    fromPort?: string | undefined;
    toPort?: string | undefined;
    operations?: string[] | undefined;
}>;
declare const layoutEntrySchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    w: z.ZodOptional<z.ZodNumber>;
    h: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    x: number;
    y: number;
    w?: number | undefined;
    h?: number | undefined;
}, {
    x: number;
    y: number;
    w?: number | undefined;
    h?: number | undefined;
}>;
/** Stroke/tint palette for boundaries (matches board CSS tokens). */
export declare const boundaryColorSchema: z.ZodEnum<["svc", "ext", "data", "event", "search", "agent", "repo", "warn"]>;
declare const viewSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodDefault<z.ZodString>;
    boundaries: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        tag: z.ZodOptional<z.ZodString>;
        kind: z.ZodDefault<z.ZodEnum<["trust", "runtime"]>>;
        /** Optional color token; omit to tint from `kind` (trust→svc, runtime→agent). */
        color: z.ZodOptional<z.ZodEnum<["svc", "ext", "data", "event", "search", "agent", "repo", "warn"]>>;
        icon: z.ZodOptional<z.ZodString>;
        members: z.ZodArray<z.ZodString, "many">;
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        x: number;
        y: number;
        w: number;
        h: number;
        kind: "runtime" | "trust";
        members: string[];
        icon?: string | undefined;
        tag?: string | undefined;
        color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
    }, {
        id: string;
        label: string;
        x: number;
        y: number;
        w: number;
        h: number;
        members: string[];
        icon?: string | undefined;
        tag?: string | undefined;
        kind?: "runtime" | "trust" | undefined;
        color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
    }>, "many">>;
    layout: z.ZodRecord<z.ZodString, z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodOptional<z.ZodNumber>;
        h: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
        w?: number | undefined;
        h?: number | undefined;
    }, {
        x: number;
        y: number;
        w?: number | undefined;
        h?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    boundaries: {
        id: string;
        label: string;
        x: number;
        y: number;
        w: number;
        h: number;
        kind: "runtime" | "trust";
        members: string[];
        icon?: string | undefined;
        tag?: string | undefined;
        color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
    }[];
    layout: Record<string, {
        x: number;
        y: number;
        w?: number | undefined;
        h?: number | undefined;
    }>;
}, {
    id: string;
    layout: Record<string, {
        x: number;
        y: number;
        w?: number | undefined;
        h?: number | undefined;
    }>;
    type?: string | undefined;
    boundaries?: {
        id: string;
        label: string;
        x: number;
        y: number;
        w: number;
        h: number;
        members: string[];
        icon?: string | undefined;
        tag?: string | undefined;
        kind?: "runtime" | "trust" | undefined;
        color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
    }[] | undefined;
}>;
export declare const scanModelSchema: z.ZodEffects<z.ZodObject<{
    scan: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    sphere: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    system: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    }, {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    }>;
    components: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["service", "datastore", "search", "external-system", "agent", "repository", "event-stream"]>;
        technology: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        repository: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            provider: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            provider?: string | undefined;
        }, {
            path: string;
            provider?: string | undefined;
        }>, z.ZodString]>>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        status: z.ZodOptional<z.ZodEnum<["ok", "warn"]>>;
        warn: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }, {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }>, "many">>;
    channels: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodDefault<z.ZodLiteral<"event-stream">>;
        technology: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "event-stream";
        name: string;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        type?: "event-stream" | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    external_systems: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodOptional<z.ZodLiteral<"external-system">>;
        technology: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        repository: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            provider: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            provider?: string | undefined;
        }, {
            path: string;
            provider?: string | undefined;
        }>, z.ZodString]>>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    agents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        runtime: z.ZodOptional<z.ZodString>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }, {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }>, "many">>;
    agent_runtimes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type?: string | undefined;
    }, {
        id: string;
        name: string;
        type?: string | undefined;
    }>, "many">>;
    repositories: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        provider: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    connections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        from: z.ZodString;
        to: z.ZodString;
        type: z.ZodEnum<["synchronous-request", "event-publication", "event-subscription", "database-access", "stream-consume", "agent-delegation", "git-integration", "grpc-request"]>;
        protocol: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        contract: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            reference: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type?: string | undefined;
            reference?: string | undefined;
        }, {
            type?: string | undefined;
            reference?: string | undefined;
        }>, z.ZodString]>>;
        fromSide: z.ZodOptional<z.ZodEnum<["l", "r", "t", "b"]>>;
        toSide: z.ZodOptional<z.ZodEnum<["l", "r", "t", "b"]>>;
        /** Source port id (typically an expose port on `from`) */
        fromPort: z.ZodOptional<z.ZodString>;
        /** Target port id (typically a consume port on `to`) */
        toPort: z.ZodOptional<z.ZodString>;
        /** Endpoints, RPCs, topics, or queries used on this connection */
        operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }, {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }>, "many">>;
    views: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodString>;
        boundaries: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tag: z.ZodOptional<z.ZodString>;
            kind: z.ZodDefault<z.ZodEnum<["trust", "runtime"]>>;
            /** Optional color token; omit to tint from `kind` (trust→svc, runtime→agent). */
            color: z.ZodOptional<z.ZodEnum<["svc", "ext", "data", "event", "search", "agent", "repo", "warn"]>>;
            icon: z.ZodOptional<z.ZodString>;
            members: z.ZodArray<z.ZodString, "many">;
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }, {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            kind?: "runtime" | "trust" | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }>, "many">>;
        layout: z.ZodRecord<z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodOptional<z.ZodNumber>;
            h: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        boundaries: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[];
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
    }, {
        id: string;
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
        type?: string | undefined;
        boundaries?: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            kind?: "runtime" | "trust" | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    scan: string | number;
    system: {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    };
    components: {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }[];
    channels: {
        id: string;
        type: "event-stream";
        name: string;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    external_systems: {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    agents: {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }[];
    agent_runtimes: {
        id: string;
        name: string;
        type?: string | undefined;
    }[];
    repositories: {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    connections: {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }[];
    views: {
        id: string;
        type: string;
        boundaries: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[];
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
    }[];
    sphere?: string | number | undefined;
}, {
    scan: string | number;
    system: {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    };
    views: {
        id: string;
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
        type?: string | undefined;
        boundaries?: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            kind?: "runtime" | "trust" | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[] | undefined;
    }[];
    sphere?: string | number | undefined;
    components?: {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }[] | undefined;
    channels?: {
        id: string;
        name: string;
        type?: "event-stream" | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    external_systems?: {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    agents?: {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }[] | undefined;
    agent_runtimes?: {
        id: string;
        name: string;
        type?: string | undefined;
    }[] | undefined;
    repositories?: {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    connections?: {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }[] | undefined;
}>, {
    scan: string | number;
    system: {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    };
    components: {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }[];
    channels: {
        id: string;
        type: "event-stream";
        name: string;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    external_systems: {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    agents: {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }[];
    agent_runtimes: {
        id: string;
        name: string;
        type?: string | undefined;
    }[];
    repositories: {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    connections: {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }[];
    views: {
        id: string;
        type: string;
        boundaries: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[];
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
    }[];
    sphere?: string | number | undefined;
}, unknown>;
/** @deprecated Use scanModelSchema */
export declare const sphereModelSchema: z.ZodEffects<z.ZodObject<{
    scan: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    sphere: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    system: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    }, {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    }>;
    components: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["service", "datastore", "search", "external-system", "agent", "repository", "event-stream"]>;
        technology: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        repository: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            provider: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            provider?: string | undefined;
        }, {
            path: string;
            provider?: string | undefined;
        }>, z.ZodString]>>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        status: z.ZodOptional<z.ZodEnum<["ok", "warn"]>>;
        warn: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }, {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }>, "many">>;
    channels: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodDefault<z.ZodLiteral<"event-stream">>;
        technology: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: "event-stream";
        name: string;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        type?: "event-stream" | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    external_systems: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodOptional<z.ZodLiteral<"external-system">>;
        technology: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        repository: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            provider: z.ZodOptional<z.ZodString>;
            path: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            path: string;
            provider?: string | undefined;
        }, {
            path: string;
            provider?: string | undefined;
        }>, z.ZodString]>>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    agents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        purpose: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        runtime: z.ZodOptional<z.ZodString>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }, {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }>, "many">>;
    agent_runtimes: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type?: string | undefined;
    }, {
        id: string;
        name: string;
        type?: string | undefined;
    }>, "many">>;
    repositories: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        provider: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        subtitle: z.ZodOptional<z.ZodString>;
        icon: z.ZodOptional<z.ZodString>;
        consumes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
        exposes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            protocol: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }, {
            id: string;
            label: string;
            protocol?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }, {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }>, "many">>;
    connections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        from: z.ZodString;
        to: z.ZodString;
        type: z.ZodEnum<["synchronous-request", "event-publication", "event-subscription", "database-access", "stream-consume", "agent-delegation", "git-integration", "grpc-request"]>;
        protocol: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        contract: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            type: z.ZodOptional<z.ZodString>;
            reference: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type?: string | undefined;
            reference?: string | undefined;
        }, {
            type?: string | undefined;
            reference?: string | undefined;
        }>, z.ZodString]>>;
        fromSide: z.ZodOptional<z.ZodEnum<["l", "r", "t", "b"]>>;
        toSide: z.ZodOptional<z.ZodEnum<["l", "r", "t", "b"]>>;
        /** Source port id (typically an expose port on `from`) */
        fromPort: z.ZodOptional<z.ZodString>;
        /** Target port id (typically a consume port on `to`) */
        toPort: z.ZodOptional<z.ZodString>;
        /** Endpoints, RPCs, topics, or queries used on this connection */
        operations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }, {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }>, "many">>;
    views: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodDefault<z.ZodString>;
        boundaries: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            tag: z.ZodOptional<z.ZodString>;
            kind: z.ZodDefault<z.ZodEnum<["trust", "runtime"]>>;
            /** Optional color token; omit to tint from `kind` (trust→svc, runtime→agent). */
            color: z.ZodOptional<z.ZodEnum<["svc", "ext", "data", "event", "search", "agent", "repo", "warn"]>>;
            icon: z.ZodOptional<z.ZodString>;
            members: z.ZodArray<z.ZodString, "many">;
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodNumber;
            h: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }, {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            kind?: "runtime" | "trust" | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }>, "many">>;
        layout: z.ZodRecord<z.ZodString, z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            w: z.ZodOptional<z.ZodNumber>;
            h: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        boundaries: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[];
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
    }, {
        id: string;
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
        type?: string | undefined;
        boundaries?: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            kind?: "runtime" | "trust" | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    scan: string | number;
    system: {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    };
    components: {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }[];
    channels: {
        id: string;
        type: "event-stream";
        name: string;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    external_systems: {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    agents: {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }[];
    agent_runtimes: {
        id: string;
        name: string;
        type?: string | undefined;
    }[];
    repositories: {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    connections: {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }[];
    views: {
        id: string;
        type: string;
        boundaries: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[];
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
    }[];
    sphere?: string | number | undefined;
}, {
    scan: string | number;
    system: {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    };
    views: {
        id: string;
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
        type?: string | undefined;
        boundaries?: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            kind?: "runtime" | "trust" | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[] | undefined;
    }[];
    sphere?: string | number | undefined;
    components?: {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }[] | undefined;
    channels?: {
        id: string;
        name: string;
        type?: "event-stream" | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    external_systems?: {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    agents?: {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }[] | undefined;
    agent_runtimes?: {
        id: string;
        name: string;
        type?: string | undefined;
    }[] | undefined;
    repositories?: {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[] | undefined;
    connections?: {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }[] | undefined;
}>, {
    scan: string | number;
    system: {
        id: string;
        name: string;
        purpose?: string | undefined;
        owner?: string | undefined;
    };
    components: {
        id: string;
        type: "service" | "datastore" | "search" | "external-system" | "agent" | "repository" | "event-stream";
        name: string;
        status?: "ok" | "warn" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        warn?: string | undefined;
    }[];
    channels: {
        id: string;
        type: "event-stream";
        name: string;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    external_systems: {
        id: string;
        name: string;
        type?: "external-system" | undefined;
        repository?: string | {
            path: string;
            provider?: string | undefined;
        } | undefined;
        technology?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    agents: {
        id: string;
        name: string;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        purpose?: string | undefined;
        runtime?: string | undefined;
    }[];
    agent_runtimes: {
        id: string;
        name: string;
        type?: string | undefined;
    }[];
    repositories: {
        id: string;
        name: string;
        path?: string | undefined;
        provider?: string | undefined;
        subtitle?: string | undefined;
        icon?: string | undefined;
        consumes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
        exposes?: {
            id: string;
            label: string;
            protocol?: string | undefined;
        }[] | undefined;
    }[];
    connections: {
        type: "synchronous-request" | "event-publication" | "event-subscription" | "database-access" | "stream-consume" | "agent-delegation" | "git-integration" | "grpc-request";
        from: string;
        to: string;
        id?: string | undefined;
        label?: string | undefined;
        protocol?: string | undefined;
        contract?: string | {
            type?: string | undefined;
            reference?: string | undefined;
        } | undefined;
        fromSide?: "l" | "r" | "t" | "b" | undefined;
        toSide?: "l" | "r" | "t" | "b" | undefined;
        fromPort?: string | undefined;
        toPort?: string | undefined;
        operations?: string[] | undefined;
    }[];
    views: {
        id: string;
        type: string;
        boundaries: {
            id: string;
            label: string;
            x: number;
            y: number;
            w: number;
            h: number;
            kind: "runtime" | "trust";
            members: string[];
            icon?: string | undefined;
            tag?: string | undefined;
            color?: "search" | "agent" | "warn" | "svc" | "ext" | "data" | "event" | "repo" | undefined;
        }[];
        layout: Record<string, {
            x: number;
            y: number;
            w?: number | undefined;
            h?: number | undefined;
        }>;
    }[];
    sphere?: string | number | undefined;
}, unknown>;
export type ScanModel = z.infer<typeof scanModelSchema>;
/** @deprecated Use ScanModel */
export type SphereModel = ScanModel;
export type SphereView = z.infer<typeof viewSchema>;
export type SphereComponent = z.infer<typeof componentSchema>;
export type SphereConnection = z.infer<typeof connectionSchema>;
export type SpherePort = z.infer<typeof portSchema>;
export type ConnectionType = z.infer<typeof connectionTypeSchema>;
export type LayoutEntry = z.infer<typeof layoutEntrySchema>;
export {};
