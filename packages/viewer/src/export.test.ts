import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseSphereYaml } from "@spherescan/model";
import { graphToSvg } from "./export.js";
import { projectToGraph } from "./projectToGraph.js";

const fixture = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../model/fixtures/order-platform.yaml"),
  "utf8",
);

test("projectToGraph yields nodes and edges", () => {
  const graph = projectToGraph(parseSphereYaml(fixture));
  assert.equal(graph.nodes.length, 12);
  assert.equal(graph.edges.length, 11);
  assert.equal(graph.groups.length, 2);
});

test("graphToSvg produces svg markup", () => {
  const graph = projectToGraph(parseSphereYaml(fixture));
  const svg = graphToSvg(graph);
  assert.match(svg, /<svg/);
  assert.match(svg, /Order API/);
});

test("graphToSvg embeds kind icons matching the live renderer", () => {
  const graph = projectToGraph(parseSphereYaml(fixture));
  const svg = graphToSvg(graph);
  // Soft icon chip + Lucide leaf path used for service kind
  assert.match(svg, /data-kind="service"/);
  assert.match(svg, /M11 20A7 7 0 0 1 9\.8 6\.1/);
  // Ports / tech badge data from the fixture cards
  assert.match(svg, /CONSUMES|EXPOSES|viewBox="0 0 24 24"/);
});

test("graphToSvg draws cylinder shell for database nodes", () => {
  const graph = projectToGraph(parseSphereYaml(fixture));
  const svg = graphToSvg(graph);
  assert.match(svg, /data-kind="database"/);
  assert.match(svg, /<ellipse /);
});

test("graphToSvg defaults to orthogonal edge paths (no cubic Bezier)", () => {
  const graph = projectToGraph(parseSphereYaml(fixture));
  const ortho = graphToSvg(graph);
  const curved = graphToSvg(graph, { mode: "bezier" });
  const edgeD = (svg: string) =>
    [...svg.matchAll(/<path d="([^"]+)"[^>]*marker-end=/g)].map((m) => m[1]);
  for (const d of edgeD(ortho)) {
    assert.match(d, /L/, `expected L segment in ${d}`);
    assert.equal(/[Cc]/.test(d), false, `orthogonal path should not use cubic C: ${d}`);
  }
  assert.ok(edgeD(curved).some((d) => /[Cc]/.test(d)), "bezier mode should use cubic C");
});
