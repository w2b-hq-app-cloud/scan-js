# SCAN toolkit (`scan-js`) - Agent Backlog

> **This repo** = SCAN notation + standalone renderer/modeler (`@spherescan/*`).  
> **Sphere product** = sibling repo `sphere-io` (embeds `@spherescan/*`; owns AI/agents/SaaS).  
> Prefer **one item (or one track) per agent**.

---

## Priority order (do not skip ahead)

Build in this order. Later layers depend on earlier ones being stable.

1. **Notation** - schema, spec, validation, round-trip YAML (`Track A`, related `B`)
2. **Renderer** - faithful canvas + embed/export (`Track C`, whiteboard display) - must stay embeddable standalone
3. **Modeler** - create / connect / edit / undo that write the real model (`Track D`, `E` modeler UX)
4. **OSS polish & release** - CLI, docs, examples, publish `@spherescan/*` (`Track F`, `G`)
5. **Sphere AI / agents last** - NL->model, real AI command bar, agent execution (`Track I` only).  
   Keep mocked Sphere chrome in the whiteboard; **implement** real AI later - do **not** remove chrome as cleanup.

---

## How to use with multiple agents

1. Pick an item with status `todo` (not `done` / `in_progress` / `deferred` / `cancelled`) in a track that does not overlap another agent's files.
2. Mark it `in_progress` when starting.
3. Keep PRs small; note acceptance criteria in the PR description.
4. **When finished, always set that item's status to `done` in this file** (and add a one-line note under "Recently completed" if useful). Do this in the same change set as the implementation - so the next agent sees an accurate board.

**Conflict hotspots (serialize agents):**

- [`apps/whiteboard/src/components/sphere/SphereApp.tsx`](apps/whiteboard/src/components/sphere/SphereApp.tsx) - only one agent at a time
- [`packages/model/src/schema.ts`](packages/model/src/schema.ts) - schema changes need coordinated tests
- Package `exports` / root `package.json` workspaces - coordinate if renaming packages

**Safe parallel tracks:** Model/spec, Rules, Viewer embed polish, CLI, Docs/OSS release (avoid two agents in `SphereApp.tsx`).

**Focus now:** SCAN notation + `@spherescan/viewer` + `@spherescan/modeler` (standalone-shippable). Sphere chrome in `apps/whiteboard` is a product shell around SCAN - leave mocked AI/collab UI in place until Track I.

---

## Recently completed (IDs - do not re-implement)

| ID | Status | Summary |
|----|--------|---------|
| **A1** | done | JSON Schema matches Zod (`$defs`, enums); fixtures validated via Ajv |
| **A3** | done | `createEmptyModel(systemName)` in `@spherescan/model` |
| **A5** | done | Spec completeness for v0.1 elements + connection types + DI |
| **C1** | done | Richer SVG/PNG export (kind icons, ports, badges, routed edges) |
| **D4** | done | Boundary resize/create + membership sync; whiteboard resize handles |
| **E1** | done | Drag-and-drop YAML onto canvas to import |
| **E2** | done | Connect-mode highlight, hint bar, Esc cancel |
| **E6** | done | New board toolbar action (`modeler.newBoard`) |
| **E8** | done | Toast on failed / successful connect |
| **D3** | done | `updateConnection` label/contract + undo |
| **E4** | done | Edge inspector edit label/contract |
| **D1** | done | Port-to-port `connect(..., { fromPort, toPort })` |
| **E3** | done | Port click targets for connect (expose -> consume) |
| **B1** | done | Port-aware rules (expose->consume when ports set) |
| **E9** | done | Dirty badge + beforeunload + Ctrl+S save YAML |
| **E12** | done | Repo open-in-tab, connection `operations` hover + inspector, richer node details / create hints |
| **D2** | done | `duplicateElement` clones with new id, offset layout, remapped ports; undo |
| **E5** | done | Context menu Duplicate + Ctrl/Cmd+D |
| **A4** | done | `validateScanModel` - unique ids + connection/boundary/layout/runtime/port refs; CLI wired |

**Also already landed (scaffold, not backlog IDs):** monorepo `@spherescan/*`, basic model parse/serialize, rules matrix v0, viewer export, modeler create/connect/move/delete/undo, whiteboard wired to packages.

**No item is `in_progress` right now.**

### Suggested next pickups (unblocked)

| Prefer | IDs | Notes |
|--------|-----|--------|
| Notation | **A2** | Unknown-key round-trip policy - A1/A4/A5 done |
| Rules | **B4**, **B2**, **B3** | Matrix / containment / soft warnings |
| UX polish | **E10** | Keyboard shortcuts (F2 rename, tools) - Cmd+D duplicate done via E5 |
| Modeler | **D5**, **D6** | Cheap drag preview; multi-select move |

---

## Done (do not re-implement)

| Area | What landed |
|------|-------------|
| Positioning | Sphere = product; SCAN = notation; OSS = `@spherescan/*` toolkit |
| Monorepo | `packages/model`, `rules`, `viewer`, `modeler`, `cli` + `apps/whiteboard` + `examples/embed-viewer` |
| Model | Zod schema (`scan:` / legacy `sphere:`), parse/serialize, round-trip tests, `createEmptyModel`, `validateScanModel`, JSON Schema + v0.1 spec |
| Rules | Basic connection legality + tests |
| Viewer | `projectToGraph`, snapshot SVG embed (`ScanViewer`), richer `saveSVG` / `savePNG` (icons, ports, badges) |
| Modeler | `CommandStack`, move/delete/rename/create/connect/duplicate, undo/redo, YAML save, `newBoard`, `updateConnection`, boundary resize/create + membership |
| Whiteboard | SCAN modeler UI wired to packages; YAML drop; connect feedback; New board; edge label/contract edit; Duplicate (menu + Cmd+D) |
| OSS hygiene | Apache-2.0, CONTRIBUTING, CI, README, self-host doc |

---

## Track A - Notation & `@spherescan/model`

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| A1 | done | Expand JSON Schema to match Zod (required fields, enums, `$defs`) | Schema validates fixture; document in spec | `packages/model/schemas/scan-0.1.json`, `docs/spec/scan-0.1.md` |
| A2 | todo | Preserve unknown YAML keys on round-trip (passthrough / strip policy) | Documented policy; test with extra field | `packages/model/src/serialize.ts`, `parse.ts` |
| A3 | done | Empty board factory (`createEmptyModel(systemName)`) | Returns valid model with one empty view | `packages/model/src/` |
| A4 | done | Id uniqueness + reference validation (connections point to existing ids) | `validateScanModel(model)` returns structured errors | `packages/model/src/validate.ts`, CLI `validate` |
| A5 | done | Spec completeness for v0.1 elements + connection types | Spec lists all kinds, ports, views/layout DI | `docs/spec/scan-0.1.md` |

---

## Track B - `@spherescan/rules`

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| B1 | done | Port-aware rules (expose->consume when ports exist) | Illegal port pair rejected with reason | `packages/rules/src/` |
| B2 | todo | Containment rules (who may live in trust vs runtime boundary) | Tests for member assignment | `packages/rules/src/` |
| B3 | todo | "Missing contract" warnings as soft rules | Returns warnings without blocking connect | `packages/rules/src/` + whiteboard toast wiring |
| B4 | todo | Expand matrix for search/repo/external edge cases | Table-driven tests cover all v0.1 kinds | `packages/rules/src/rules.test.ts` |

---

## Track C - `@spherescan/viewer` (embed + export)

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| C1 | done | Richer SVG export (ports, badges, dashed edges closer to notation) | Visual parity smoke vs fixture titles/ports | `packages/viewer/src/export.ts` |
| C2 | todo | Transparent PNG option + scale docs | `savePNG({ scale, transparent })` | `packages/viewer/src/export.ts`, `viewer.ts` |
| C3 | todo | `importYAMLUrl` CORS/error UX helpers | Clear errors; example updated | `packages/viewer/src/viewer.ts`, `examples/embed-viewer/` |
| C4 | todo | Fit/zoom API for embed (if keeping snapshot, document limits) | `fitViewport` / resize observer documented | `packages/viewer/src/viewer.ts` |
| C5 | done | Extract interactive canvas into `@spherescan/board` | Both apps import `BoardApp`; shell prop for chrome | `packages/board/`, `apps/*/SphereApp.tsx` |

---

## Track D - `@spherescan/modeler`

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| D1 | done | Port-to-port `connect(from, to, { fromPort, toPort })` | Connection stores port ids; rules enforced | `packages/modeler/src/modeling.ts`, schema if needed |
| D2 | done | Duplicate element command | Clone with new id + offset layout; undo works | `packages/modeler/src/modeling.ts` |
| D3 | done | Update connection label/contract command | Undo restores previous | `packages/modeler/src/modeling.ts` |
| D4 | done | Boundary create / resize / membership commands | Members + boundary rect in view | `packages/modeler/src/modeling.ts` |
| D5 | todo | Drag performance: don't clone full model every pointer move | Preview path is cheap; commit still one command | `packages/modeler/src/modeling.ts`, `useSphereBoard.ts` |
| D6 | todo | Multi-select move command | N nodes one undo step | `packages/modeler/` |

---

## Track E - SCAN whiteboard UX (`apps/whiteboard`)

> Prefer agents that only touch `hooks/` or small components - avoid two agents in `packages/board`.  
> Whiteboard and Sphere share **`@spherescan/board`** (canvas, tools, minimap, view filters). Sphere-only chrome: AI bar / Share / collab / Cmd+K (`shell="sphere"`).

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| E1 | done | Drag-and-drop YAML onto canvas to import | Drop `.yaml` loads board | `@spherescan/board` |
| E2 | done | Connect mode visual feedback (highlight source, cursor, cancel Esc) | Clear UX; invalid target toast | `@spherescan/board` |
| E3 | done | Port-level click targets for connect | Click expose -> consume wires ports | `@spherescan/board` + modeler D1 |
| E4 | done | Edge inspector: edit label/contract | Saves via modeler command | `@spherescan/board` + D3 |
| E5 | done | Wire context menu Duplicate | Uses D2; Ctrl/Cmd+D | `@spherescan/board` ContextMenu |
| E6 | done | Empty board / New board action | Starts from A3 factory | Toolbar + modeler import |
| E7 | todo | Split `BoardApp.tsx` into modules (canvas, topbar, inspector, tools) | Files &lt; ~400 lines each; behavior unchanged | `packages/board/src/` - **solo agent** |
| E8 | done | Toast on failed connect (replace `console.warn`) | User-visible message | `@spherescan/board` |
| E9 | done | Dirty indicator + beforeunload when unsaved | Browser warns on close; Ctrl+S saves YAML | `useSphereBoard.ts`, TopBar |
| E10 | todo | Keyboard: F2 rename, Esc clear connect, tool shortcuts | Matches context menu hints | `@spherescan/board` |
| E11 | done | Slim chrome: remove Sphere product UI from SCAN whiteboard | No AI bar / Share / avatars; SCAN branding; board features stay shared | `BoardApp` `shell="scan"` |
| E12 | done | Repo GitHub open + connection operations hover/inspector + component detail UX | Hover shows endpoints; inspector lists real ports/connections/repo URL | `@spherescan/board`, schema `operations`, fixture |

### E11 note

SCAN whiteboard is the OSS reference shell only. Product features (AI, collab, Share) belong in proprietary Sphere (`apps/sphere`). View filter tabs, minimap, connect tools, and the rest of the board live in `@spherescan/board` for both apps.

---

## Track F - CLI & tooling

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| F1 | todo | Resolve paths from cwd (not package dir) when invoked via npm | `scan validate ./file.yaml` from repo root works | `packages/cli/src/cli.ts`, root scripts |
| F2 | todo | `scan export png` via optional dependency or document SVG->PNG path | Documented; or puppeteer/sharp optional | `packages/cli/`, docs |
| F3 | todo | `scan format` (rewrite YAML consistently) | Idempotent format test | `packages/cli/`, `serialize.ts` |
| F4 | todo | Package bin works after `npm link` / published layout | README snippet verified | `packages/cli/package.json` |

---

## Track G - Examples, docs, OSS release

| ID | Status | Item | Acceptance criteria | Primary paths |
|----|--------|------|---------------------|---------------|
| G1 | todo | Expand embed example (URL load, export buttons) | README in example folder | `examples/embed-viewer/` |
| G2 | todo | Public API docs for viewer + modeler (markdown or typedoc) | Install + embed + saveYAML/SVG covered | `docs/api/` or package READMEs |
| G3 | todo | More `examples/architectures/*.yaml` (2-3 boards) | Validate via CLI | `examples/architectures/` |
| G4 | todo | npm publish dry-run checklist for `@spherescan/*` | `npm pack` each package; no secrets; versions aligned | `packages/*/package.json` |
| G5 | todo | GitHub release notes template + tags `v0.1.0` | Doc only until you publish | `docs/` or `.github/` |
| G6 | todo | Self-host deploy example (Docker or static) | One working recipe | `docs/self-host.md`, optional `Dockerfile` |
| G7 | todo | Keep README Sphere-vs-SCAN table accurate as packages evolve | Positioning never drifts | `README.md` |

---

## Track H - Post-v0.1 enhancements (later)

| ID | Status | Item | Notes |
|----|--------|------|-------|
| H1 | done | Auto-layout (layered) as a modeler command | `modeling.autoLayout()` - no ELK dep yet |
| H2 | todo | Mermaid / PlantUML exporters | From `@spherescan/model` graph |
| H3 | todo | React/Vue embed wrappers | Thin wrappers over `ScanViewer` |
| H4 | todo | Technology icon catalog package | Extension pack |
| H5 | deferred | Collaborative editing / CRDT | Sphere product - after OSS modeler is solid |

---

## Track I - Sphere AI / agents (LAST - after stable SCAN notation + renderer + modeler)

> Do not start these until Tracks A-E core SCAN modeler paths are stable.  
> Keep existing mocked Sphere chrome in the whiteboard; **wire it** here - do not delete it (E11 cancelled).

| ID | Status | Item | Notes |
|----|--------|------|-------|
| I1 | deferred | NL -> SCAN model (prompt -> YAML/model patch) | Sphere product agents |
| I2 | deferred | Wire AI command bar / palette to real modeler commands | Uses existing `AIBar` chrome |
| I3 | deferred | Agent execution from architecture (codegen, PRs) | Sphere control plane |
| I4 | deferred | Governance / policy agents over diagrams | Sphere product |

Formerly tracked as H6 (`NL -> model`). Explicitly last in priority order.

---

## Suggested multi-agent waves

### Wave 1 (parallel, low conflict) - notation / rules / export / CLI / docs

- Agent 1: ~~**A4**~~ **done** (id/ref validation) - A1+A5 done
- Agent 2: **A2** (unknown-key round-trip policy)
- Agent 3: **B1 + B4** (rules)
- Agent 4: **C2** (transparent PNG + scale) - C1 done
- Agent 5: **F1 + F3** (CLI)
- Agent 6: **G1 + G2** (docs/examples)

### Wave 2 - stable SCAN modeler

- Agent 1: ~~**D3 + E4**~~ **done**
- Agent 2: **D1** then **E3** (ports)
- Agent 3: ~~**D2 + E5**~~ **done** (duplicate)
- ~~**A3 + E6**~~ **done** · ~~**D4**~~ **done** (boundary resize)
- Also free: **E9**, **E10** - do **not** pick cancelled **E11**

### Wave 3 (solo / careful)

- Agent 1 only: **E7** (split SphereApp)
- Then Agent 2 only: **C5** (interactive canvas into `@spherescan/viewer` for standalone embed)

### Wave 4 (release `@spherescan/*` standalone)

- **G4 + G5 + G7** + version bump + publish (human-gated) - publishable `@spherescan/*` packages

### Wave 5 (last) - Sphere AI / agents

- **Track I** - wire mocked Sphere chrome to real agents after SCAN renderer/modeler are solid

---

## Definition of done (per item)

- [ ] Typecheck / tests for touched packages pass (`npm test`, `npm run typecheck`)
- [ ] No edits under `sphere-prototype/`
- [ ] Does not expand scope into Sphere product features
- [ ] Acceptance criteria above met
- [ ] Short note in PR (or chat): what changed + how to verify manually
- [ ] **Backlog row status -> `done`** (required before handoff)
- [ ] Update "Recently completed" / "Suggested next pickups" if the next unblocked set changed

---

## Quick commands

```bash
npm install --legacy-peer-deps
npm run build -w @spherescan/model -w @spherescan/rules -w @spherescan/viewer -w @spherescan/modeler -w @spherescan/cli
npm test
npm run typecheck
npm run dev
node packages/cli/dist/cli.js validate packages/model/fixtures/order-platform.yaml
```
