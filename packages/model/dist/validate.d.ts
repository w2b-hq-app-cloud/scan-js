import type { ScanModel } from "./schema.js";
export type ScanValidationSeverity = "error" | "warning";
export type ScanValidationIssue = {
    /** Stable machine-readable code */
    code: string;
    message: string;
    /** Dot path into the model, e.g. `connections[0].to` */
    path: string;
    severity: ScanValidationSeverity;
};
export type ScanValidationResult = {
    ok: boolean;
    issues: ScanValidationIssue[];
};
/**
 * Semantic validation beyond Zod/JSON Schema:
 * - unique element / connection / view / boundary / agent_runtime ids
 * - unique port ids within each element
 * - connections.from / .to reference existing elements
 * - fromPort / toPort reference expose / consume ports when set
 * - boundary.members reference existing elements
 * - agents[].runtime reference agent_runtimes when set
 * - layout keys reference existing elements (orphan layout → error)
 */
export declare function validateScanModel(model: ScanModel): ScanValidationResult;
/** @deprecated Use validateScanModel */
export declare const validateSphereModel: typeof validateScanModel;
