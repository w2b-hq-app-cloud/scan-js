import assert from "node:assert/strict";
import { test } from "node:test";
import {
  computeLabelStagger,
  edgeControls,
  edgePath,
  orthogonalWaypoints,
  pickEdgeSides,
  placeEdgeLabel,
  pointOnCubic,
  resolveEdgeAnchors,
  routeOrthogonalEdges,
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

test("orthogonal edgePath uses only axis-aligned L segments", () => {
  const a = { x: 0, y: 50 };
  const b = { x: 200, y: 150 };
  const d = edgePath(a, b, "r", "l", "orthogonal");
  assert.match(d, /^M /);
  assert.equal(d.includes(" C "), false);
  assert.ok(d.includes(" L "));
  const pts = orthogonalWaypoints(a, b, "r", "l");
  for (let i = 0; i < pts.length - 1; i++) {
    const sameX = Math.abs(pts[i].x - pts[i + 1].x) < 0.5;
    const sameY = Math.abs(pts[i].y - pts[i + 1].y) < 0.5;
    assert.ok(sameX || sameY, "each step must be horizontal or vertical");
  }
});

test("routeOrthogonalEdges inserts hop arcs at crossings", () => {
  // Horizontal then vertical crossing near (100, 50)
  const paths = routeOrthogonalEdges([
    {
      id: "h",
      a: { x: 0, y: 50 },
      b: { x: 200, y: 50 },
      aSide: "r",
      bSide: "l",
    },
    {
      id: "v",
      a: { x: 100, y: 0 },
      b: { x: 100, y: 120 },
      aSide: "b",
      bSide: "t",
    },
  ]);
  const vertical = paths.get("v") ?? "";
  assert.ok(vertical.includes(" A "), `expected hop arc, got: ${vertical}`);
});

test("pickEdgeSides attaches to facing edges from travel direction", () => {
  const right = pickEdgeSides(
    { x: 0, y: 0, w: 100, h: 80 },
    { x: 200, y: 10, w: 100, h: 80 },
  );
  assert.deepEqual(right, { fromSide: "r", toSide: "l" });

  const below = pickEdgeSides(
    { x: 0, y: 0, w: 100, h: 80 },
    { x: 10, y: 160, w: 100, h: 80 },
  );
  assert.deepEqual(below, { fromSide: "b", toSide: "t" });

  const left = pickEdgeSides(
    { x: 200, y: 0, w: 100, h: 80 },
    { x: 0, y: 10, w: 100, h: 80 },
  );
  assert.deepEqual(left, { fromSide: "l", toSide: "r" });
});

test("resolveEdgeAnchors lands on box edges not centers", () => {
  const from = { x: 0, y: 0, w: 100, h: 80 };
  const to = { x: 200, y: 20, w: 100, h: 80 };
  const { a, b, fromSide, toSide } = resolveEdgeAnchors(from, to);
  assert.equal(fromSide, "r");
  assert.equal(toSide, "l");
  assert.equal(a.x, 100);
  assert.equal(b.x, 200);
  assert.ok(a.y >= from.y && a.y <= from.y + from.h);
  assert.ok(b.y >= to.y && b.y <= to.y + to.h);
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
  // Strong upward bow - mid Y well above the chord (y=0).
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
