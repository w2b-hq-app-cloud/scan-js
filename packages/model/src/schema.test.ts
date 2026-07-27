import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { Ajv2020, type ErrorObject } from "ajv/dist/2020.js";
import { parse as parseYaml } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(
  readFileSync(join(root, "schemas/scan-0.1.json"), "utf8"),
) as object;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function loadYaml(name: string): unknown {
  return parseYaml(readFileSync(join(root, "fixtures", name), "utf8"));
}

function assertValid(doc: unknown, label: string) {
  const ok = validate(doc);
  if (!ok) {
    const detail = (validate.errors ?? [])
      .map((e: ErrorObject) => `${e.instancePath || "/"} ${e.message}`)
      .join("; ");
    assert.fail(`${label} failed JSON Schema: ${detail}`);
  }
}

test("scan-0.1.json validates order-platform fixture", () => {
  assertValid(loadYaml("order-platform.yaml"), "order-platform");
});

test("scan-0.1.json validates dummy-cafe fixture", () => {
  assertValid(loadYaml("dummy-cafe.yaml"), "dummy-cafe");
});

test("scan-0.1.json rejects missing system", () => {
  const bad = {
    scan: "0.1",
    views: [{ id: "v1", layout: {} }],
  };
  assert.equal(validate(bad), false);
});

test("scan-0.1.json rejects unknown connection type", () => {
  const bad = {
    scan: "0.1",
    system: { id: "s", name: "S" },
    connections: [{ from: "a", to: "b", type: "not-a-real-type" }],
    views: [{ id: "v1", layout: {} }],
  };
  assert.equal(validate(bad), false);
});

test("scan-0.1.json accepts legacy sphere root key", () => {
  assertValid(
    {
      sphere: "0.1",
      system: { id: "s", name: "S" },
      views: [{ id: "v1", layout: { a: { x: 0, y: 0 } } }],
    },
    "legacy sphere root",
  );
});
