import { stringify } from "yaml";
import { scanModelSchema } from "./schema.js";
function forEmit(model) {
    const validated = scanModelSchema.parse(model);
    const { sphere: _legacy, ...rest } = validated;
    return { ...rest, scan: validated.scan };
}
/** Serialize a validated SCAN model to YAML (`scan:` version key). */
export function serializeScanYaml(model) {
    return stringify(forEmit(model), {
        lineWidth: 100,
        defaultStringType: "PLAIN",
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
