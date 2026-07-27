#!/usr/bin/env node
/**
 * Smoke checks that published-style package entry points resolve after build.
 * Exit 0 on success.
 */
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "packages/model/dist/index.js",
  "packages/rules/dist/index.js",
  "packages/viewer/dist/index.js",
  "packages/modeler/dist/index.js",
  "packages/cli/dist/cli.js",
  "packages/model/schemas/scan-0.1.json",
  "docs/spec/scan-0.1.md",
  "LICENSE",
  "NOTICE",
  "TRADEMARKS.md",
  "skills/scan-notation/SKILL.md",
];

let failed = false;
for (const rel of required) {
  const p = resolve(root, rel);
  if (!existsSync(p)) {
    console.error(`missing: ${rel}`);
    failed = true;
  }
}

if (failed) {
  console.error("check-scan-link: failed");
  process.exit(1);
}
console.log("check-scan-link: ok");
