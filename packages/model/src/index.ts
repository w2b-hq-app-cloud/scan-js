// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

export {
  SCAN_VERSION,
  SPHERE_VERSION,
  scanModelSchema,
  sphereModelSchema,
  connectionTypeSchema,
  iconSchema,
  boundaryColorSchema,
  type ScanModel,
  type SphereModel,
  type SphereView,
  type SphereComponent,
  type SphereConnection,
  type SpherePort,
  type ElementLink,
  type ConnectionType,
  type LayoutEntry,
} from "./schema.js";
export {
  parseScanYaml,
  parseScanJson,
  parseSphereYaml,
  parseSphereJson,
} from "./parse.js";
export {
  serializeScanYaml,
  serializeScanJson,
  serializeSphereYaml,
  serializeSphereJson,
  scanStringNeedsQuotes,
} from "./serialize.js";
export {
  createEmptyModel,
  createEmptySphereModel,
  slugifyId,
  type CreateEmptyModelOptions,
} from "./empty.js";
export {
  validateScanModel,
  validateSphereModel,
  type ScanValidationIssue,
  type ScanValidationResult,
  type ScanValidationSeverity,
} from "./validate.js";
