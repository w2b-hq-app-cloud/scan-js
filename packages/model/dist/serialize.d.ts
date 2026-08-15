import type { ScanModel } from "./schema.js";
/**
 * True when a plain (unquoted) YAML scalar would be ambiguous or illegal —
 * e.g. descriptions containing `Local e2e: …` which become nested mappings.
 */
export declare function scanStringNeedsQuotes(value: string): boolean;
/** Serialize a validated SCAN model to YAML (`scan:` version key). */
export declare function serializeScanYaml(model: ScanModel): string;
/** Serialize a validated SCAN model to pretty JSON. */
export declare function serializeScanJson(model: ScanModel): string;
/** @deprecated Use serializeScanYaml */
export declare const serializeSphereYaml: typeof serializeScanYaml;
/** @deprecated Use serializeScanJson */
export declare const serializeSphereJson: typeof serializeScanJson;
