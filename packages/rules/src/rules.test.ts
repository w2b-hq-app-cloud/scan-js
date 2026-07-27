import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseSphereYaml } from "@spherescan/model";
import { canConnect, suggestConnectionType } from "./index.js";

const fixture = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../model/fixtures/order-platform.yaml"),
  "utf8",
);

test("allows service to database", () => {
  const model = parseSphereYaml(fixture);
  const check = canConnect(model, "order-api", "orders-db", "database-access");
  assert.equal(check.allowed, true);
});

test("rejects agent to database", () => {
  const model = parseSphereYaml(fixture);
  const check = canConnect(model, "arch-agent", "orders-db");
  assert.equal(check.allowed, false);
});

test("suggests type for service to event", () => {
  const model = parseSphereYaml(fixture);
  assert.equal(suggestConnectionType(model, "order-api", "order-created"), "event-publication");
});

test("allows external to event publication", () => {
  const model = parseSphereYaml(fixture);
  const check = canConnect(model, "payment-platform", "order-created", "event-publication");
  assert.equal(check.allowed, true);
});

test("port-aware: allow expose â†’ consume", () => {
  const model = parseSphereYaml(fixture);
  const check = canConnect(model, "order-api", "payment-service", undefined, {
    fromPort: "oa-out",
    toPort: "ps-in",
  });
  assert.equal(check.allowed, true);
});

test("port-aware: reject consume as fromPort", () => {
  const model = parseSphereYaml(fixture);
  const check = canConnect(model, "order-api", "payment-service", undefined, {
    fromPort: "oa-rest",
    toPort: "ps-in",
  });
  assert.equal(check.allowed, false);
  assert.match(check.reason ?? "", /expose port/);
});
