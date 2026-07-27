import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { SphereModeler } from "./modeler.js";
const fixture = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../model/fixtures/order-platform.yaml"), "utf8");
test("autoLayout separates nodes and is undoable", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    const before = modeler.getModel().views[0].layout["order-api"];
    modeler.modeling.autoLayout();
    const after = modeler.getModel().views[0];
    const boxes = Object.entries(after.layout).map(([id, e]) => ({
        id,
        x: e.x,
        y: e.y,
        w: e.w ?? 260,
        h: e.h ?? 180,
    }));
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            const overlap = a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
            assert.equal(overlap, false, `${a.id} overlaps ${b.id}`);
        }
    }
    const trust = after.boundaries.find((b) => b.id === "g-order");
    for (const id of [
        "order-api",
        "payment-service",
        "inventory-service",
        "orders-db",
        "order-created",
        "search-index",
    ]) {
        const e = after.layout[id];
        assert.ok(e, `missing layout ${id}`);
        assert.ok(e.x >= trust.x, `${id} left of trust`);
        assert.ok(e.y >= trust.y, `${id} above trust`);
        assert.ok(e.x + (e.w ?? 260) <= trust.x + trust.w, `${id} right of trust`);
        assert.ok(e.y + (e.h ?? 180) <= trust.y + trust.h, `${id} below trust`);
    }
    // Dense boards should get wider horizontal breathing room than legacy defaults.
    const xs = boxes.map((b) => b.x);
    assert.ok(Math.max(...xs) - Math.min(...xs) > 200);
    assert.notEqual(after.layout["order-api"].x, before.x);
    modeler.undo();
    assert.equal(modeler.getModel().views[0].layout["order-api"].x, before.x);
    assert.equal(modeler.getModel().views[0].layout["order-api"].y, before.y);
});
test("autoLayout fans sides for parallel edges between the same pair", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    modeler.modeling.connect("order-api", "payment-service");
    modeler.modeling.connect("order-api", "payment-service");
    modeler.modeling.autoLayout();
    const conns = modeler
        .getModel()
        .connections.filter((c) => c.from === "order-api" && c.to === "payment-service");
    assert.ok(conns.length >= 2);
    const sides = conns.map((c) => `${c.fromSide ?? "?"}-${c.toSide ?? "?"}`);
    assert.ok(new Set(sides).size >= 2, `expected fanned sides for parallel edges, got ${sides.join(",")}`);
});
test("create service and connect", async () => {
    const modeler = new SphereModeler();
    await modeler.importYAML(fixture);
    const id = modeler.modeling.createElement("service", { x: 100, y: 100 }, "Billing Service");
    assert.ok(modeler.getModel().components.some((c) => c.id === id));
    const edgeId = modeler.modeling.connect("order-api", id);
    assert.ok(modeler.getModel().connections.some((c) => c.id === edgeId));
});
test("duplicateElement clones with new id, offset layout, remapped ports + undo", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    const before = modeler.getModel().views[0].layout["order-api"];
    const source = modeler.getModel().components.find((c) => c.id === "order-api");
    const connCount = modeler.getModel().connections.length;
    const newId = modeler.modeling.duplicateElement("order-api");
    assert.notEqual(newId, "order-api");
    const copy = modeler.getModel().components.find((c) => c.id === newId);
    assert.ok(copy);
    assert.equal(copy.name, "Order API copy");
    assert.equal(copy.technology, source.technology);
    assert.ok(copy.exposes?.every((p) => p.id.includes(newId)));
    assert.ok(copy.consumes?.every((p) => p.id.includes(newId)));
    assert.ok(!copy.exposes?.some((p) => p.id === source.exposes?.[0]?.id));
    const layout = modeler.getModel().views[0].layout[newId];
    assert.equal(layout.x, before.x + 40);
    assert.equal(layout.y, before.y + 40);
    assert.equal(modeler.getModel().connections.length, connCount);
    modeler.undo();
    assert.equal(modeler.getModel().components.some((c) => c.id === newId), false);
    assert.equal(modeler.getModel().views[0].layout[newId], undefined);
});
test("saveYAML round-trips", async () => {
    const modeler = new SphereModeler();
    await modeler.importYAML(fixture);
    const yaml = modeler.saveYAML();
    assert.match(yaml, /order-platform/);
    assert.equal(modeler.isDirty(), false);
});
test("newBoard starts empty and dirty", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    await modeler.newBoard("Payments");
    const model = modeler.getModel();
    assert.equal(model.system.name, "Payments");
    assert.equal(model.system.id, "payments");
    assert.equal(model.components.length, 0);
    assert.equal(model.views[0].id, "architecture-board");
    assert.equal(modeler.isDirty(), true);
    assert.equal(modeler.commandStack.canUndo(), false);
});
test("updateConnection label/contract + undo", async () => {
    const modeler = new SphereModeler();
    await modeler.importYAML(fixture);
    const conn = modeler.getModel().connections[0];
    assert.ok(conn);
    const id = conn.id ?? "e1";
    modeler.modeling.updateConnection(id, {
        label: "Payments API",
        contract: "openapi/payments.yaml",
    });
    const updated = modeler.getModel().connections.find((c, i) => (c.id ?? `e${i + 1}`) === id);
    assert.equal(updated.label, "Payments API");
    assert.equal(updated.contract, "openapi/payments.yaml");
    modeler.undo();
    const restored = modeler.getModel().connections.find((c, i) => (c.id ?? `e${i + 1}`) === id);
    assert.equal(restored.label, conn.label);
    assert.deepEqual(restored.contract, conn.contract);
});
test("updateConnection operations + undo", async () => {
    const modeler = new SphereModeler();
    await modeler.importYAML(fixture);
    const conn = modeler.getModel().connections.find((c) => c.id === "e2");
    assert.ok(conn);
    const before = conn.operations ? [...conn.operations] : undefined;
    modeler.modeling.updateConnection("e2", {
        operations: ["POST /v2/pay", "GET /v2/pay/{id}"],
    });
    const updated = modeler.getModel().connections.find((c) => c.id === "e2");
    assert.deepEqual(updated.operations, ["POST /v2/pay", "GET /v2/pay/{id}"]);
    modeler.undo();
    const restored = modeler.getModel().connections.find((c) => c.id === "e2");
    assert.deepEqual(restored.operations, before);
});
test("resizeBoundary + membership sync on create inside", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    const before = modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order");
    modeler.modeling.resizeBoundary("g-order", {
        x: before.x,
        y: before.y,
        w: before.w + 200,
        h: before.h + 120,
    });
    const resized = modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order");
    assert.equal(resized.w, before.w + 200);
    assert.equal(resized.h, before.h + 120);
    // Place a new service inside the expanded boundary
    const id = modeler.modeling.createElement("service", { x: before.x + 40, y: before.y + 40 }, "Inside Service");
    const members = modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order").members;
    assert.ok(members.includes(id));
    modeler.undo(); // undo create
    modeler.undo(); // undo resize
    const restoredBoundary = modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order");
    assert.equal(restoredBoundary.w, before.w);
    assert.equal(restoredBoundary.h, before.h);
});
test("moveBoundary translates box and members together + undo", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    const view = modeler.getModel().views[0];
    const before = view.boundaries.find((b) => b.id === "g-order");
    const memberId = before.members[0];
    assert.ok(memberId);
    const memberBefore = { ...view.layout[memberId] };
    const dx = 80;
    const dy = 40;
    modeler.modeling.moveBoundary("g-order", before.x + dx, before.y + dy);
    const after = modeler.getModel().views[0];
    const moved = after.boundaries.find((b) => b.id === "g-order");
    assert.equal(moved.x, before.x + dx);
    assert.equal(moved.y, before.y + dy);
    const memberAfter = after.layout[memberId];
    assert.equal(memberAfter.x, memberBefore.x + dx);
    assert.equal(memberAfter.y, memberBefore.y + dy);
    assert.ok(moved.members.includes(memberId));
    modeler.undo();
    const restored = modeler.getModel().views[0];
    const b2 = restored.boundaries.find((b) => b.id === "g-order");
    assert.equal(b2.x, before.x);
    assert.equal(b2.y, before.y);
    assert.equal(restored.layout[memberId].x, memberBefore.x);
    assert.equal(restored.layout[memberId].y, memberBefore.y);
});
test("createBoundary adds rect to view", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.newBoard("Demo");
    const id = modeler.modeling.createBoundary("trust", { x: 100, y: 100, w: 400, h: 300 }, "Demo Trust");
    const b = modeler.getModel().views[0].boundaries.find((x) => x.id === id);
    assert.ok(b);
    assert.equal(b.label, "Demo Trust");
    assert.equal(b.kind, "trust");
});
test("renameBoundary + deleteBoundary + undo", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    const before = modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order");
    modeler.modeling.renameBoundary("g-order", "Commerce Zone");
    assert.equal(modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order").label, "Commerce Zone");
    modeler.modeling.deleteBoundary("g-order");
    assert.equal(modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order"), undefined);
    modeler.undo();
    assert.equal(modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order").label, "Commerce Zone");
    modeler.undo();
    assert.equal(modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order").label, before.label);
});
test("updateElementIcon + boundary icon + undo", async () => {
    const modeler = new SphereModeler({ viewId: "architecture-board" });
    await modeler.importYAML(fixture);
    modeler.modeling.updateElementIcon("order-api", "server");
    assert.equal(modeler.getModel().components.find((c) => c.id === "order-api").icon, "server");
    modeler.modeling.updateBoundary("g-order", { icon: "shield" });
    assert.equal(modeler.getModel().views[0].boundaries.find((b) => b.id === "g-order").icon, "shield");
    modeler.modeling.updateElementIcon("order-api", null);
    assert.equal(modeler.getModel().components.find((c) => c.id === "order-api").icon, undefined);
    modeler.undo();
    assert.equal(modeler.getModel().components.find((c) => c.id === "order-api").icon, "server");
});
test("port-to-port connect stores fromPort/toPort", async () => {
    const modeler = new SphereModeler();
    await modeler.importYAML(fixture);
    const edgeId = modeler.modeling.connect("order-api", "payment-service", {
        fromPort: "oa-out",
        toPort: "ps-in",
    });
    const edge = modeler.getModel().connections.find((c) => c.id === edgeId);
    assert.equal(edge.fromPort, "oa-out");
    assert.equal(edge.toPort, "ps-in");
});
test("port-to-port connect rejects non-expose fromPort", async () => {
    const modeler = new SphereModeler();
    await modeler.importYAML(fixture);
    assert.throws(() => modeler.modeling.connect("order-api", "payment-service", {
        fromPort: "oa-rest",
        toPort: "ps-in",
    }), /expose port/);
});
