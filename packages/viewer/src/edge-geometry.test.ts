import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeLabelStagger,
  edgeControls,
  edgePath,
  placeEdgeLabel,
  pointOnCubic,
} from "./edge-geometry.js";

test("edgePath is a cubic bezier matching control points", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 40 };
  const { c1, c2 } = edgeControls(a, b, "r");
  const d = edgePath(a, b, "r", "l");
  assert.match(d, /^M 0 0 C /);
  assert.ok(d.includes(`${c1.x} ${c1.y}`));
  assert.ok(d.includes(`${c2.x} ${c2.y}`));
});

test("pointOnCubic interpolates endpoints and bows off the chord", () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  const c1 = { x: 0, y: 80 };
  const c2 = { x: 100, y: 80 };
  const start = pointOnCubic(a, c1, c2, b, 0);
  const end = pointOnCubic(a, c1, c2, b, 1);
  const mid = pointOnCubic(a, c1, c2, b, 0.5);
  assert.deepEqual(start, a);
  assert.deepEqual(end, b);
  // Strong upward bow — mid Y well above the chord (y=0).
  assert.ok(mid.y > 40);
});

test("placeEdgeLabel clears endpoint boxes", () => {
  const a = { x: 0, y: 50 };
  const b = { x: 300, y: 50 };
  const nodes = [
    { x: 0, y: 0, w: 120, h: 100 },
    { x: 280, y: 0, w: 120, h: 100 },
  ];
  const p = placeEdgeLabel({
    a,
    b,
    aSide: "r",
    bSide: "l",
    nodes,
    labelW: 80,
    labelH: 24,
  });
  // Mid should not sit inside either node.
  const inA = p.x >= 0 && p.x <= 120 && p.y >= 0 && p.y <= 100;
  const inB = p.x >= 280 && p.x <= 400 && p.y >= 0 && p.y <= 100;
  assert.equal(inA, false);
  assert.equal(inB, false);
});

test("computeLabelStagger spreads coincident labels", () => {
  const map = computeLabelStagger([
    { id: "e1", x: 10, y: 10 },
    { id: "e2", x: 12, y: 11 },
    { id: "e3", x: 200, y: 200 },
  ]);
  assert.equal(map.get("e3"), 0);
  assert.notEqual(map.get("e1"), map.get("e2"));
});
