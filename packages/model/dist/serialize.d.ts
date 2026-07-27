import type { ScanModel } from "./schema.js";
/** Serialize a validated SCAN model to YAML (`scan:` version key). */
export declare function serializeScanYaml(model: ScanModel): string;
/** Serialize a validated SCAN model to pretty JSON. */
export declare function serializeScanJson(model: ScanModel): string;
/** @deprecated Use serializeScanYaml */
export declare const serializeSphereYaml: typeof serializeScanYaml;
/** @deprecated Use serializeScanJson */
export declare const serializeSphereJson: typeof serializeScanJson;
