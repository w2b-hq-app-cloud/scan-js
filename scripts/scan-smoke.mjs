#!/usr/bin/env node
/**
 * Smoke: validate the order-platform fixture via the built CLI.
 */
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(root, "packages/cli/dist/cli.js");
const fixture = resolve(root, "packages/model/fixtures/order-platform.yaml");

if (!existsSync(cli)) {
  console.error("scan-smoke: build CLI first (npm run build)");
  process.exit(1);
}

const r = spawnSync(process.execPath, [cli, "validate", fixture], {
  cwd: root,
  encoding: "utf8",
});
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");
if (r.status !== 0) {
  console.error("scan-smoke: validate failed");
  process.exit(r.status ?? 1);
}
console.log("scan-smoke: ok");
