import { stringify } from "yaml";
import type { ScanModel } from "./schema.js";
import { scanModelSchema } from "./schema.js";

function forEmit(model: ScanModel): Record<string, unknown> {
  const validated = scanModelSchema.parse(model);
  const { sphere: _legacy, ...rest } = validated as ScanModel & { sphere?: unknown };
  return { ...rest, scan: validated.scan };
}

/** Serialize a validated SCAN model to YAML (`scan:` version key). */
export function serializeScanYaml(model: ScanModel): string {
  return stringify(forEmit(model), {
    lineWidth: 100,
    defaultStringType: "PLAIN",
    defaultKeyType: "PLAIN",
  });
}

/** Serialize a validated SCAN model to pretty JSON. */
export function serializeScanJson(model: ScanModel): string {
  return `${JSON.stringify(forEmit(model), null, 2)}\n`;
}

/** @deprecated Use serializeScanYaml */
export const serializeSphereYaml = serializeScanYaml;
/** @deprecated Use serializeScanJson */
export const serializeSphereJson = serializeScanJson;
