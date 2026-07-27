#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseScanYaml, serializeScanJson, validateScanModel } from "@spherescan/model";
import { graphToSvg, projectToGraph } from "@spherescan/viewer";

function usage() {
  console.log(`scan <command> [options]

SCAN - System & Component Architecture Notation toolkit (open source).
Not the Sphere product platform.

Commands:
  validate <file.yaml>          Validate a SCAN YAML file (schema + refs)
  export svg <file.yaml> [-o out.svg]
  export png <file.yaml>        Use SVG export in Node; PNG via viewer in browser
  export json <file.yaml> [-o out.json]
`);
}

function main(argv: string[]) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "-h" || cmd === "--help") {
    usage();
    process.exit(cmd ? 0 : 1);
  }

  if (cmd === "validate") {
    const file = rest[0];
    if (!file) {
      console.error("Missing file");
      process.exit(1);
    }
    const yaml = readFileSync(resolve(file), "utf8");
    let model;
    try {
      model = parseScanYaml(yaml);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`INVALID  schema: ${message}`);
      process.exit(1);
    }
    const result = validateScanModel(model);
    if (!result.ok) {
      console.error(`INVALID  ${result.issues.filter((i) => i.severity === "error").length} error(s)`);
      for (const issue of result.issues) {
        console.error(`  [${issue.severity}] ${issue.code} @ ${issue.path}: ${issue.message}`);
      }
      process.exit(1);
    }
    console.log(
      `OK  scan=${model.scan} system=${model.system.id} elements=${
        model.components.length +
        model.channels.length +
        model.external_systems.length +
        model.agents.length +
        model.repositories.length
      }`,
    );
    return;
  }

  if (cmd === "export") {
    const format = rest[0];
    const file = rest[1];
    if (!format || !file) {
      usage();
      process.exit(1);
    }
    const outIdx = rest.indexOf("-o");
    const out = outIdx >= 0 ? rest[outIdx + 1] : undefined;
    const yaml = readFileSync(resolve(file), "utf8");
    const model = parseScanYaml(yaml);

    if (format === "json") {
      const json = serializeScanJson(model);
      if (out) writeFileSync(resolve(out), json);
      else process.stdout.write(json);
      return;
    }

    if (format === "svg") {
      const svg = graphToSvg(projectToGraph(model));
      if (out) writeFileSync(resolve(out), svg);
      else process.stdout.write(svg);
      return;
    }

    if (format === "png") {
      console.error(
        "PNG export from CLI is not available in Node. Use: scan export svg <file> -o out.svg",
      );
      process.exit(1);
    }

    console.error(`Unknown export format: ${format}`);
    process.exit(1);
  }

  console.error(`Unknown command: ${cmd}`);
  usage();
  process.exit(1);
}

main(process.argv.slice(2));
