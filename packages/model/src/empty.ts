import { SCAN_VERSION, scanModelSchema, type ScanModel } from "./schema.js";

export type CreateEmptyModelOptions = {
  /** System id; default derived from name */
  systemId?: string;
  /** View id for the empty board layout */
  viewId?: string;
  purpose?: string;
  owner?: string;
};

/** Slug suitable for system / view ids. */
export function slugifyId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "system";
}

/**
 * Create a valid empty SCAN model with one view and empty layout.
 * Use as the starting point for a new architecture board.
 */
export function createEmptyModel(
  systemName: string,
  options: CreateEmptyModelOptions = {},
): ScanModel {
  const name = systemName.trim() || "Untitled System";
  const systemId = options.systemId?.trim() || slugifyId(name);
  const viewId = options.viewId?.trim() || "architecture-board";

  return scanModelSchema.parse({
    scan: SCAN_VERSION,
    system: {
      id: systemId,
      name,
      purpose: options.purpose,
      owner: options.owner,
    },
    components: [],
    channels: [],
    external_systems: [],
    agents: [],
    agent_runtimes: [],
    repositories: [],
    connections: [],
    views: [
      {
        id: viewId,
        type: "service-architecture",
        boundaries: [],
        layout: {},
      },
    ],
  });
}

/** @deprecated Use createEmptyModel */
export const createEmptySphereModel = createEmptyModel;
