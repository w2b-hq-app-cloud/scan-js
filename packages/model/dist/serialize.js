import { stringify } from "yaml";
import { scanModelSchema } from "./schema.js";
function forEmit(model) {
    const validated = scanModelSchema.parse(model);
    const { sphere: _legacy, ...rest } = validated;
    return { ...rest, scan: validated.scan };
}
/**
 * True when a plain (unquoted) YAML scalar would be ambiguous or illegal —
 * e.g. descriptions containing `Local e2e: …` which become nested mappings.
 */
export function scanStringNeedsQuotes(value) {
    if (value === "")
        return true;
    if (/[\n\r]/.test(value))
        return true;
    if (/^\s|\s$/.test(value))
        return true;
    if (/[:#\[\]{},&*!|>'"%@`]/.test(value))
        return true;
    if (/^[-?]/.test(value))
        return true;
    if (/^(true|false|null|~|y|n|yes|no|on|off)$/i.test(value))
        return true;
    if (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(value))
        return true;
    return false;
}
/** Serialize a validated SCAN model to YAML (`scan:` version key). */
export function serializeScanYaml(model) {
    // Double-quote string values so colon-rich descriptions (URLs, "Local e2e:")
    // never round-trip as Nested mappings / YAMLParseError.
    return stringify(forEmit(model), {
        lineWidth: 100,
        defaultStringType: "QUOTE_DOUBLE",
        defaultKeyType: "PLAIN",
    });
}
/** Serialize a validated SCAN model to pretty JSON. */
export function serializeScanJson(model) {
    return `${JSON.stringify(forEmit(model), null, 2)}\n`;
}
/** @deprecated Use serializeScanYaml */
export const serializeSphereYaml = serializeScanYaml;
/** @deprecated Use serializeScanJson */
export const serializeSphereJson = serializeScanJson;
