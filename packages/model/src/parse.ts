import { parse as parseYaml } from "yaml";
import { scanModelSchema, type ScanModel } from "./schema.js";

export function parseScanYaml(source: string): ScanModel {
  const raw = parseYaml(source);
  return scanModelSchema.parse(raw);
}

export function parseScanJson(source: string | unknown): ScanModel {
  const raw = typeof source === "string" ? JSON.parse(source) : source;
  return scanModelSchema.parse(raw);
}

/** @deprecated Use parseScanYaml */
export const parseSphereYaml = parseScanYaml;
/** @deprecated Use parseScanJson */
export const parseSphereJson = parseScanJson;
