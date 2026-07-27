import { type ScanModel } from "./schema.js";
export declare function parseScanYaml(source: string): ScanModel;
export declare function parseScanJson(source: string | unknown): ScanModel;
/** @deprecated Use parseScanYaml */
export declare const parseSphereYaml: typeof parseScanYaml;
/** @deprecated Use parseScanJson */
export declare const parseSphereJson: typeof parseScanJson;
