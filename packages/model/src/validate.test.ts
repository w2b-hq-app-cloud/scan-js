import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseScanYaml } from "./parse.js";
import { createEmptyModel } from "./empty.js";
import { validateScanModel } from "./validate.js";
import type { ScanModel } from "./schema.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "../fixtures");

function load(name: string): ScanModel {
  return parseScanYaml(readFileSync(join(fixtures, name), "utf8"));
}

test("validateScanModel accepts order-platform fixture", () => {
  const result = validateScanModel(load("order-platform.yaml"));
  assert.equal(result.ok, true, JSON.stringify(result.issues, null, 2));
  assert.equal(result.issues.length, 0);
});

test("validateScanModel accepts dummy-cafe fixture", () => {
  const result = validateScanModel(load("dummy-cafe.yaml"));
  assert.equal(result.ok, true, JSON.stringify(result.issues, null, 2));
});

test("validateScanModel accepts empty model", () => {
  const result = validateScanModel(createEmptyModel("Demo"));
  assert.equal(result.ok, true);
});

test("duplicate element ids across collections", () => {
  const model = createEmptyModel("Demo");
  model.components.push({
    id: "shared",
    name: "A",
    type: "service",
  });
  model.channels.push({
    id: "shared",
    name: "B",
    type: "event-stream",
  });
  model.views[0].layout["shared"] = { x: 0, y: 0 };
  const result = validateScanModel(model);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "duplicate-element-id"));
});

test("unknown connection endpoint", () => {
  const model = createEmptyModel("Demo");
  model.components.push({
    id: "api",
    name: "API",
    type: "service",
  });
  model.views[0].layout["api"] = { x: 0, y: 0 };
  model.connections.push({
    id: "e1",
    from: "api",
    to: "missing-db",
    type: "database-access",
  });
  const result = validateScanModel(model);
  assert.equal(result.ok, false);
  assert.ok(
    result.issues.some(
      (i) => i.code === "unknown-connection-endpoint" && i.path.endsWith(".to"),
    ),
  );
});

test("unknown fromPort / toPort", () => {
  const model = createEmptyModel("Demo");
  model.components.push(
    {
      id: "a",
      name: "A",
      type: "service",
      exposes: [{ id: "a-out", label: "REST" }],
    },
    {
      id: "b",
      name: "B",
      type: "service",
      consumes: [{ id: "b-in", label: "REST" }],
    },
  );
  model.views[0].layout["a"] = { x: 0, y: 0 };
  model.views[0].layout["b"] = { x: 100, y: 0 };
  model.connections.push({
    id: "e1",
    from: "a",
    to: "b",
    type: "synchronous-request",
    fromPort: "wrong-out",
    toPort: "wrong-in",
  });
  const result = validateScanModel(model);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "unknown-from-port"));
  assert.ok(result.issues.some((i) => i.code === "unknown-to-port"));
});

test("unknown boundary member and orphan layout key", () => {
  const model = createEmptyModel("Demo");
  model.components.push({
    id: "api",
    name: "API",
    type: "service",
  });
  model.views[0].layout["api"] = { x: 0, y: 0 };
  model.views[0].layout["ghost"] = { x: 10, y: 10 };
  model.views[0].boundaries.push({
    id: "g1",
    label: "Box",
    kind: "trust",
    members: ["api", "nope"],
    x: 0,
    y: 0,
    w: 400,
    h: 300,
  });
  const result = validateScanModel(model);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "unknown-boundary-member"));
  assert.ok(result.issues.some((i) => i.code === "unknown-layout-id"));
});

test("unknown agent runtime", () => {
  const model = createEmptyModel("Demo");
  model.agents.push({
    id: "bot",
    name: "Bot",
    runtime: "missing-runtime",
  });
  model.views[0].layout["bot"] = { x: 0, y: 0 };
  const result = validateScanModel(model);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "unknown-agent-runtime"));
});

test("duplicate connection ids", () => {
  const model = createEmptyModel("Demo");
  model.components.push(
    { id: "a", name: "A", type: "service" },
    { id: "b", name: "B", type: "service" },
  );
  model.views[0].layout["a"] = { x: 0, y: 0 };
  model.views[0].layout["b"] = { x: 100, y: 0 };
  model.connections.push(
    { id: "e1", from: "a", to: "b", type: "synchronous-request" },
    { id: "e1", from: "b", to: "a", type: "synchronous-request" },
  );
  const result = validateScanModel(model);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "duplicate-connection-id"));
});

test("valid port-wired connection passes", () => {
  const model = createEmptyModel("Demo");
  model.components.push(
    {
      id: "a",
      name: "A",
      type: "service",
      exposes: [{ id: "a-out", label: "REST" }],
    },
    {
      id: "b",
      name: "B",
      type: "service",
      consumes: [{ id: "b-in", label: "REST" }],
    },
  );
  model.views[0].layout["a"] = { x: 0, y: 0 };
  model.views[0].layout["b"] = { x: 100, y: 0 };
  model.connections.push({
    id: "e1",
    from: "a",
    to: "b",
    type: "synchronous-request",
    fromPort: "a-out",
    toPort: "b-in",
  });
  const result = validateScanModel(model);
  assert.equal(result.ok, true, JSON.stringify(result.issues, null, 2));
});
