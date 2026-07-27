import { z } from "zod";

export const SCAN_VERSION = "0.1";
/** @deprecated Use SCAN_VERSION */
export const SPHERE_VERSION = SCAN_VERSION;

const portSchema = z.object({
  id: z.string(),
  label: z.string(),
  protocol: z.string().optional(),
});

/**
 * Optional diagram icon override.
 * - Lucide name (e.g. `shield`, `database`)
 * - `https://...` / `http://...` image URL
 * - `data:image/...` (uploaded file encoded as data URL)
 */
export const iconSchema = z.string().min(1).optional();

const repositoryRefSchema = z.union([
  z.object({
    provider: z.string().optional(),
    path: z.string(),
  }),
  z.string(),
]);

const componentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "service",
    "datastore",
    "search",
    "external-system",
    "agent",
    "repository",
    "event-stream",
  ]),
  technology: z.string().optional(),
  subtitle: z.string().optional(),
  icon: iconSchema,
  repository: repositoryRefSchema.optional(),
  consumes: z.array(portSchema).optional(),
  exposes: z.array(portSchema).optional(),
  status: z.enum(["ok", "warn"]).optional(),
  warn: z.string().optional(),
});

const channelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal("event-stream").default("event-stream"),
  technology: z.string().optional(),
  icon: iconSchema,
  consumes: z.array(portSchema).optional(),
  exposes: z.array(portSchema).optional(),
});

const externalSystemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal("external-system").optional(),
  technology: z.string().optional(),
  icon: iconSchema,
  repository: repositoryRefSchema.optional(),
  consumes: z.array(portSchema).optional(),
  exposes: z.array(portSchema).optional(),
});

const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string().optional(),
  subtitle: z.string().optional(),
  icon: iconSchema,
  runtime: z.string().optional(),
  consumes: z.array(portSchema).optional(),
  exposes: z.array(portSchema).optional(),
});

const agentRuntimeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
});

const repositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string().optional(),
  path: z.string().optional(),
  subtitle: z.string().optional(),
  icon: iconSchema,
  consumes: z.array(portSchema).optional(),
  exposes: z.array(portSchema).optional(),
});

export const connectionTypeSchema = z.enum([
  "synchronous-request",
  "event-publication",
  "event-subscription",
  "database-access",
  "stream-consume",
  "agent-delegation",
  "git-integration",
  "grpc-request",
]);

const connectionSchema = z.object({
  id: z.string().optional(),
  from: z.string(),
  to: z.string(),
  type: connectionTypeSchema,
  protocol: z.string().optional(),
  label: z.string().optional(),
  contract: z
    .union([
      z.object({
        type: z.string().optional(),
        reference: z.string().optional(),
      }),
      z.string(),
    ])
    .optional(),
  fromSide: z.enum(["l", "r", "t", "b"]).optional(),
  toSide: z.enum(["l", "r", "t", "b"]).optional(),
  /** Source port id (typically an expose port on `from`) */
  fromPort: z.string().optional(),
  /** Target port id (typically a consume port on `to`) */
  toPort: z.string().optional(),
  /** Endpoints, RPCs, topics, or queries used on this connection */
  operations: z.array(z.string()).optional(),
});

const layoutEntrySchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().optional(),
  h: z.number().optional(),
});

const boundarySchema = z.object({
  id: z.string(),
  label: z.string(),
  tag: z.string().optional(),
  kind: z.enum(["trust", "runtime"]).default("trust"),
  icon: iconSchema,
  members: z.array(z.string()),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

const viewSchema = z.object({
  id: z.string(),
  type: z.string().default("service-architecture"),
  boundaries: z.array(boundarySchema).default([]),
  layout: z.record(layoutEntrySchema),
});

export const scanModelSchema = z.preprocess((raw) => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = { ...(raw as Record<string, unknown>) };
    if (obj.scan == null && obj.sphere != null) {
      obj.scan = obj.sphere;
    }
    return obj;
  }
  return raw;
}, z.object({
  scan: z.union([z.string(), z.number()]),
  sphere: z.union([z.string(), z.number()]).optional(),
  system: z.object({
    id: z.string(),
    name: z.string(),
    purpose: z.string().optional(),
    owner: z.string().optional(),
  }),
  components: z.array(componentSchema).default([]),
  channels: z.array(channelSchema).default([]),
  external_systems: z.array(externalSystemSchema).default([]),
  agents: z.array(agentSchema).default([]),
  agent_runtimes: z.array(agentRuntimeSchema).default([]),
  repositories: z.array(repositorySchema).default([]),
  connections: z.array(connectionSchema).default([]),
  views: z.array(viewSchema).min(1),
}));

/** @deprecated Use scanModelSchema */
export const sphereModelSchema = scanModelSchema;

export type ScanModel = z.infer<typeof scanModelSchema>;
/** @deprecated Use ScanModel */
export type SphereModel = ScanModel;
export type SphereView = z.infer<typeof viewSchema>;
export type SphereComponent = z.infer<typeof componentSchema>;
export type SphereConnection = z.infer<typeof connectionSchema>;
export type SpherePort = z.infer<typeof portSchema>;
export type ConnectionType = z.infer<typeof connectionTypeSchema>;
export type LayoutEntry = z.infer<typeof layoutEntrySchema>;
