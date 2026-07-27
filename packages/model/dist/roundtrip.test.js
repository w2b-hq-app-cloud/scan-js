import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseSphereYaml, parseSphereJson } from "./parse.js";
import { serializeSphereYaml, serializeSphereJson } from "./serialize.js";
import { createEmptyModel, slugifyId } from "./empty.js";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = readFileSync(join(root, "fixtures/order-platform.yaml"), "utf8");
test("parse order-platform fixture", () => {
    const model = parseSphereYaml(fixture);
    assert.equal(model.system.id, "order-platform");
    assert.equal(String(model.scan), "0.1");
    assert.ok(model.components.length >= 3);
    assert.ok(model.views[0]?.layout["order-api"]);
});
test("yaml round-trip preserves ids and layout", () => {
    const model = parseSphereYaml(fixture);
    const yaml = serializeSphereYaml(model);
    const again = parseSphereYaml(yaml);
    assert.equal(again.system.name, model.system.name);
    assert.equal(again.connections.length, model.connections.length);
    assert.deepEqual(again.views[0].layout["order-api"], model.views[0].layout["order-api"]);
});
test("json round-trip", () => {
    const model = parseSphereYaml(fixture);
    const json = serializeSphereJson(model);
    const again = parseSphereJson(json);
    assert.equal(again.system.id, "order-platform");
});
test("createEmptyModel returns valid model with one empty view", () => {
    const model = createEmptyModel("Order Platform");
    assert.equal(String(model.scan), "0.1");
    assert.equal(model.system.id, "order-platform");
    assert.equal(model.system.name, "Order Platform");
    assert.equal(model.components.length, 0);
    assert.equal(model.connections.length, 0);
    assert.equal(model.views.length, 1);
    assert.equal(model.views[0].id, "architecture-board");
    assert.deepEqual(model.views[0].layout, {});
    const yaml = serializeSphereYaml(model);
    const again = parseSphereYaml(yaml);
    assert.equal(again.system.id, "order-platform");
});
test("slugifyId", () => {
    assert.equal(slugifyId("My Cool System"), "my-cool-system");
    assert.equal(slugifyId("  "), "system");
});
