import assert from "node:assert/strict";
import { test } from "node:test";
import { parseScanYaml } from "./parse.js";
import { scanStringNeedsQuotes, serializeScanYaml } from "./serialize.js";
import { createEmptyModel } from "./empty.js";

test("scanStringNeedsQuotes detects colon-rich scalars", () => {
  assert.equal(scanStringNeedsQuotes("plain"), false);
  assert.equal(scanStringNeedsQuotes("Local e2e: docker compose"), true);
  assert.equal(scanStringNeedsQuotes("http://localhost:5173"), true);
});

test("serializeScanYaml quotes colon-rich descriptions so parse round-trips", () => {
  const model = createEmptyModel("Demo", { systemId: "demo" });
  model.components = [
    {
      id: "web",
      name: "Web",
      type: "service",
      description:
        "Desktop-first SPA. Local e2e: `docker compose up --build` from the platform root.",
    },
  ];
  const yaml = serializeScanYaml(model);
  assert.match(yaml, /description: "/);
  const parsed = parseScanYaml(yaml);
  assert.equal(parsed.components?.[0]?.id, "web");
  assert.match(parsed.components?.[0]?.description ?? "", /Local e2e:/);
});
