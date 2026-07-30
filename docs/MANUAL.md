# SCAN Whiteboard - User Manual

Complete guide to the **SCAN** reference modeler (`apps/whiteboard`): how every control works, from top-left to bottom-right.

> Start the app with `npm run dev` from the scan-js workspace (or `npm run dev:whiteboard` from a monorepo that includes it). The page title is **SCAN - Notation modeler**.

Notation deep-dive: [`docs/spec/scan-0.1.md`](spec/scan-0.1.md). This manual is about the **UI**, not the YAML schema alone.

---

## Screen map

```text
+--------------------------------------------------------------------------+
| TOP BAR - SCAN · diagram name · Saved/Unsaved · Undo/Redo · File menu   |
+--------------------------------------------------------------------------+
| VIEW TABS - All / External / Contracts / Agents     Focus · Auto-layout |
+----+---------------------------------------------------------------+-----+
| T  |                                                               | I   |
| O  |                     CANVAS (nodes, edges,                     | N   |
| O  |                     boundaries, ports)                        | S   |
| L  |                                                               | P   |
|    |                                                               | E   |
| R  |                                                               | C   |
| A  |                                                               | T   |
| I  |                                                               | O   |
| L  |                                                               | R   |
|----+                                                               |-----|
|    |  Zoom - % + Fit Locate          [mode banner]    Legend       |     |
|    |                                              Minimap          |     |
+----+---------------------------------------------------------------+-----+
```

Mode banners (Connect / Fast design / place component / place boundary) appear centered above the zoom controls when active.

---

## 1. Top bar

### Left - branding and diagram

| Control | What it does |
|---------|----------------|
| **SCAN** / *Notation modeler* | Product chrome for the reference app |
| **Diagram name** (e.g. *Order Platform*) | Click to open **Diagram name** - renames the SCAN `system.name` used for exports |
| Status pill | **Saved** (green) or **Unsaved** (warn). Closing the tab with unsaved work prompts the browser |

### Right - history and files

| Control | What it does |
|---------|----------------|
| **Undo** | Undo last modeling command |
| **Redo** | Redo |
| `N/M` | History step / stack size (informational) |
| **= Board & export** | File menu (below) |

### File menu

| Item | Shortcut | Result |
|------|----------|--------|
| **New board** | - | If dirty, confirms discard -> asks for a diagram name -> empty board |
| **Import YAML** | - | File picker for `.scan` / `.yaml` / `.yml` / `.scan.yaml` |
| **Save YAML** | **Ctrl+S** (Cmd+S) | Saves as `{diagram-name}.scan.yaml` (disk picker when the browser supports it, otherwise download) |
| **Export SVG** | - | Downloads `{diagram-name}.svg` |
| **Export PNG** | - | Downloads `{diagram-name}.png` |

You can also **drag and drop** a SCAN/YAML file onto the canvas (see [Canvas](#4-canvas)).

---

## 2. View tabs and auto-layout

### Filter tabs

| Tab | Effect on the canvas |
|-----|----------------------|
| **All Systems** | Everything at full opacity |
| **External Integrations** | Emphasizes external systems and services; dims other kinds |
| **Contracts** | Emphasizes nodes that have consume/expose ports; dims port-less nodes; warn-status nodes get a warning ring |
| **Agent Runtime** | Emphasizes agents and repositories; dims other kinds |

Badge numbers on the tabs are **demo labels** in the reference UI (not live counts).

**Filters** (button on the right) is a placeholder control - not wired yet.

**Focus** (next to Auto-layout) dims nodes and edges outside the **1-hop neighborhood** of the current selection or hovered connection. Turn it off to see the full board at equal opacity. Focus is **on by default**.

### Auto-layout

**Auto-layout** rearranges components and boundaries with the layered layout engine (left->right columns, wider gaps for dense boards), then fits the viewport. Tall columns split into extra columns; databases/events with many attachments sit in a **side pocket** beside their producer. Parallel edges between the same pair get **fanned** side anchors. Undo with **Ctrl+Z**.

### Connection labels

Labels sit on the Bezier curve (not the chord midpoint) and nudge clear of node boxes. Near-duplicate labels stagger apart. Below ~70% zoom, labels hide until you hover or select the connection - reduces clutter on dense boards.

---

## 3. Left tool rail

Overlay at the **top-left** of the canvas. Hover for tooltips.

| Tool | Icon | Behavior |
|------|------|----------|
| **Select** | Pointer | Select, drag nodes, drag boundaries (moves members), resize boundaries, open inspector |
| **Pan** | Hand | Drag the canvas (`grab` cursor) |
| **Connect** | Arrow (finger when active) | Wire nodes / ports; see [Connections](#5-connections-expose--consume) |
| **Fast design** | Pen | Toggle sketch mode: click empty canvas → component, drag a box → boundary, click two components → connect. Stays on until toggled off or **Esc**. |
| **Add component** | **+** | Opens the component kind menu |
| **Add boundary** | Square | Opens trust / runtime boundary menu |
| **Toggle grid** | Grid | Turns the dot grid on/off (default on) |

### Fast design

Toggle **Fast design** on the rail (pen icon). While active:

1. **Click** empty canvas → places the current Add-component kind (default **Service**).  
2. **Drag a box** (at least ~120×80) → creates a **Trust** or **Runtime** boundary (whichever is selected in Add boundary).  
3. **Click** a component, then another → creates a connection (same rules as Connect).  
4. While Fast design is on, **Add component** / **Add boundary** menus only change *what* you place next; they do not leave the mode.  
5. **Esc** cancels an in-progress wire or draw first; press again (or toggle the tool) to exit the mode.

Mode banner at the bottom explains the gestures. Normal Select / Pan / Connect stay available as separate tools so Fast design does not overlap them.

### Add component

Pick a kind, then click the canvas to place it (snaps to a 4px grid). **Esc** cancels.

| Menu label | SCAN role | Default ports (typical) |
|------------|-----------|-------------------------|
| **Service** | Runnable API | REST consume + expose |
| **External System** | Outside system | Expose by default |
| **Datastore** | Persistent store | - |
| **Event / Stream** | Topic / channel | Event in + out |
| **Search** | Search / index | - |
| **Agent** | Agent | Input + output |
| **Repository** | Source / artifact | - |

After place: toast *{Kind} added*; tool returns to **Select**; inspector opens for the new node.

### Add boundary

| Menu label | Kind | Use |
|------------|------|-----|
| **Trust Boundary** | `trust` | Security / ownership box |
| **Agent Runtime** | `runtime` | Runtime / execution box |

Click the canvas to place a large dashed rectangle (~480x320, centered on the click). Resize so **component centers** fall inside - those become members.

You can also right-click a component -> **Group into boundary** to wrap it in a trust box.

---

## 4. Canvas

### Pan

- **Pan** tool + drag  
- **Middle mouse**, **Alt+drag**, or **right-drag** on empty canvas  
- Mouse / trackpad **wheel** (without Ctrl) pans  
- **Minimap** click / drag (see [Minimap](#9-minimap-and-legend))

### Zoom

Zoom is clamped between **30%** and **200%** (default ~85%).

| Action | Behavior |
|--------|----------|
| **Ctrl+wheel** / **Cmd+wheel** (pinch) | Zoom toward the pointer |
| Bottom-left **-** / **+** | Step zoom toward the last pointer position on the canvas |
| Click the **N%** label | Reset zoom/pan to defaults |
| **Fit to screen** | Fit all layout boxes and boundaries |

### Select and drag

- Click empty canvas -> clear selection  
- Click a **node** -> select (inspector)  
- Drag a node in **Select** -> move (4px snap); undoable
- Drag a **boundary** body -> move the box **and all members** together; undoable
- Click an **edge** or edge **label** -> select connection
- Click a **boundary** or its title chip -> select boundary

### Drop YAML

Drag a `.scan` / `.yaml` / `.yml` / `.scan.yaml` file over the canvas until the overlay appears:

> **Drop SCAN file to load board**

Drop to import (replaces the current board). Invalid files show an error toast.

---

## 5. Connections (Expose -> Consume)

SCAN wires run from an **expose** port (filled circle, right column on a card) to a **consume** port (hollow circle, left column).

### Quick wire (no Connect tool)

1. Click an **Exposes** port on a card.  
2. Click a **Consumes** port on another card.  
3. Toast **Port connection created**. **Esc** cancels mid-wire.

While a source is active, a banner appears:

> Source: *Component* · *port-id* - click a consume port (or node)

### Connect tool

1. Choose **Connect** on the rail (or context menu **Connect**).  
2. Click an expose port **or** a node body to set the source.  
3. Click a consume port **or** another node to finish.  
4. **Esc** exits Connect and clears an in-progress wire.

Node-body -> node-body creates a connection without binding specific ports (rules still apply).

### Context menu Connect

Right-click a component -> **Connect** starts wiring from that node (no port yet). Finish on a consume port or another node.

### Rules and errors

Illegal pairs (e.g. database -> database) show **Cannot connect** with a reason from `@spherescan/rules`. Same-node wiring is blocked. You can re-click another **Expose** to change the source before finishing.

### Alter an existing connection

1. Click the edge path or its mid-label (or a connection row in the inspector).  
2. In the **Inspector**, edit **Label**, **Contract**, and **Endpoints / operations** (one per line).  
3. Press Enter in Label/Contract fields or click **Save connection**.  

**Delete** / **Backspace** removes the selected connection (no confirm).

Hovering an edge with operations shows an endpoints popover listing ops and optional `fromPort -> toPort`.

---

## 6. Ports (Consumes / Exposes)

### On the card

| Column | Meaning | Circle |
|--------|---------|--------|
| **Consumes** | Inbound API / events | Hollow |
| **Exposes** | Outbound API / events | Filled |

Each row shows **label** and optional `(protocol)`. Ports are always hoverable and clickable (same affordance as Connect mode).

Cards show only as many ports as fit in the node height (no nested scroll on the canvas). When there are more ports, a **Show more...** control appears; it opens a modal with the full consume/expose lists (scroll there if needed). Connect from the modal the same way as on the card.

- Click **Expose** -> start a wire  
- Click **Consume** with an active source -> finish the wire  
- Click **Consume** with no source -> select an existing inbound edge on that port (if any)

### In the inspector - API Surface

With a component selected:

| Control | Action |
|---------|--------|
| **+ Consume** | Add an inbound port |
| **+ Expose** | Add an outbound port |
| Label / protocol fields | Edit inline; blur or **Enter** saves |
| **x** on a row | Remove the port (clears port ids on edges that referenced it) |

New **Service** / **Event** / **Agent** / **External** nodes typically already have default ports - you can rename protocols (e.g. OpenAPI, AsyncAPI) to match your contracts.

### Contracts section

Lists unique **protocol** values gathered from the component's ports (badge *from ports*). This is derived metadata, not a separate editor.

---

## 7. Components (nodes)

### Kinds (legend)

| Kind | Label on legend / inspector |
|------|-----------------------------|
| external | External System |
| service | Service |
| database | Data Store (cylinder shape) |
| event | Event / Stream |
| search | Search |
| agent | Agent |
| repo | Repository / Artifact |

### Card chrome

- Icon + **title** + optional subtitle  
- Hover GitHub icon if a browse URL is linked  
- Tech / status chips; optional **Missing contract** warn badge  

### Change icon

In the inspector, click the large icon -> **Component icon** modal:

1. **Library** - pick a Lucide icon  
2. **Image URL** - `https://...` or `data:image/...`, then **Use**  
3. **Upload** - image <= 256 KB  
4. **Reset to default** / **Save icon**  

Stored on the SCAN element as optional `icon`.

### Context menu (right-click component)

| Item | Shortcut | Action |
|------|----------|--------|
| **Connect** | - | Start Connect from this node |
| **Rename** | F2 | Rename modal |
| **Duplicate** | Ctrl/Cmd+D | Clone with offset layout |
| **Group into boundary** | - | Create a trust boundary around it |
| **Attach repository** | - | Placeholder (not wired) |
| **Add API contract** | - | Placeholder (not wired) |
| **Delete** | Backspace | Confirm, then remove |

### Rename / delete

- **F2** or context **Rename** -> **Rename component** modal  
- **Delete** / **Backspace** or context **Delete** -> confirm dialog (undoable via history after confirm)

---

## 8. Boundaries

Dashed boxes grouping components.

| Kind | Appearance | Typical tag |
|------|------------|-------------|
| **trust** | Service-colored dashed border | e.g. Trust Boundary |
| **runtime** | Agent-colored dashed border | Runtime / execution |

### Interact

- Click body or title chip -> select (inspector)  
- Double-click title -> rename  
- When selected: **eight resize handles** - drag edges/corners (members stay put; membership re-syncs)
- Drag the **boundary body** (not a handle) to move the box with every contained component
- Members update from which **node centers** lie inside the box  

### Inspector

- Click icon -> **Boundary icon** picker (same as components)  
- **Name**, **Kind** (trust / runtime), **Tag**  
- **Members** list - click a row to select that component  
- **Save changes** / **Delete**  
- **F2** button also opens rename  

---

## 9. Minimap and legend

Bottom-**right** stack: **Legend** above **Minimap**.

### Legend

Shows kind colors for External System, Service, Data Store, Event / Stream, Search, Agent, Repository / Artifact, plus notes for **Contract / Schema**, **Consumes (In)**, **Exposes (Out)**.

### Minimap

- Header **Minimap** + truncated system name  
- Live overview of groups, edges, nodes, and the current viewport rectangle  
- **Click** outside the viewport -> center the canvas there  
- **Drag** -> pan the world  

---

## 10. Zoom cluster (bottom-left)

| Control | Label | Action |
|---------|-------|--------|
| - | Zoom out | Decrease zoom |
| `N%` | - | Reset viewport |
| + | Zoom in | Increase zoom |
| Maximize icon | Fit to screen | Fit content |
| Crosshair | Locate selection | Placeholder (not wired yet) |

---

## 11. Inspector (right)

Appears when a **component**, **connection**, or **boundary** is selected. Header **Inspector** + close (**x**).

### Component

1. Icon (change) · title · kind · id  
2. Status / kind / tech / connection-count chips  
3. Optional validation warning box  
4. **API Surface** - ports CRUD ([section 6](#6-ports-consumes--exposes))  
5. **Connections** - click a row to open that edge  
6. **Repository** - open linked GitHub URL when present  
7. **Contracts** - protocols from ports  

### Connection

1. Kind title (REST, gRPC, Async, Database, Stream, Git, Flow)  
2. From -> To (+ ports if set)  
3. **Label**, **Contract**, **Endpoints / operations**  
4. **Resilience** - UI placeholders (not persisted in SCAN 0.1)  

### Boundary

See [section 8](#8-boundaries).

---

## 12. Validation banner

A demo warning toast may appear near the bottom center (e.g. missing async contract). Dismiss with **x**. Live rule-engine validation toasts also appear for failed connects / import errors (Sonner, typically bottom-right).

---

## 13. Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl/Cmd+ S** | Save YAML |
| **Ctrl/Cmd+ Z** | Undo |
| **Ctrl/Cmd+ Y** or **Ctrl/Cmd+ Shift+Z** | Redo |
| **Ctrl/Cmd+ D** | Duplicate selected component |
| **F2** | Rename selected component or boundary |
| **Delete** / **Backspace** | Delete selection (component confirms; edge/boundary immediate) |
| **Esc** | Cancel Connect / Fast design wire or draw; exit Fast design / place modes; clear in-progress wire; close context menu |

Shortcuts are ignored while typing in inputs.

---

## 14. Modals (reference)

| Modal | When |
|-------|------|
| **Rename component** | F2 / context Rename |
| **Rename boundary** | F2 / double-click title / inspector |
| **Delete component?** | Delete / context Delete |
| **Diagram name** | Click name in top bar |
| **Discard unsaved changes?** | New board while dirty |
| **New board** | After discard confirm - enter system name |
| **Component icon** / **Boundary icon** | Click icon in inspector |

---

## 15. Workflow cheatsheets

### Build a small diagram

1. **Add component** -> Service -> click canvas.  
2. Add a **Datastore** and an **External System**.  
3. Wire **Service Expose -> Datastore Consume** (or use Connect).  
4. **Add boundary** -> Trust -> resize around services.  
5. **Save YAML** / export SVG or PNG.  

### Edit contracts on a wire

1. Select the edge.  
2. Set **Contract** to e.g. `OpenAPI` or `openapi.yaml`.  
3. List operations under **Endpoints / operations**.  
4. **Save connection**.  

### Import someone else's board

1. **Import YAML** or drop a `.scan.yaml` on the canvas.  
2. **Fit to screen** if needed.  
3. Use view tabs to focus externals / contracts / agents.  

---

## 16. Known stubs / limitations (reference UI)

These are visible but not fully implemented yet:

- **Filters** button next to Auto-layout  
- **Locate selection** in the zoom cluster  
- Context menu **Attach repository** / **Add API contract**  
- View-tab count badges (static)  
- Edge **Resilience** fields (display-only)  
- Validation banner copy (demo content)

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`docs/spec/scan-0.1.md`](spec/scan-0.1.md) | Notation semantics and YAML fields |
| [`docs/BACKLOG.md`](BACKLOG.md) | Roadmap for `@spherescan/*` and whiteboard |
| [`README.md`](../README.md) | Packages, embed API, develop scripts |
