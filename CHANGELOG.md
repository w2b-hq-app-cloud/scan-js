# Changelog

All notable changes to SCAN (`scan-js`) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `@spherescan/board`: Duplicate diagram control + `onSystemIdentityChange` so hosts can relocate workspaces on rename and treat duplicate as a fresh identity.
- `@spherescan/modeler`: `renameSystem` keeps `system.id` slugified in sync with the display name.

### Changed

- (none yet)

## [0.3.2] - 2026-08-01

### Changed

- (none yet)

## [0.3.1] - 2026-08-01

### Added

- `@spherescan/modeler`: `mergeModels` — merges another SCAN document's elements/connections into a model, remapping any colliding ids and offsetting incoming layout so it doesn't overlap existing content. Exposed as `Modeling.mergeYAML` (single undoable step) and `ScanModeler.mergeYAML`.
- `@spherescan/board`: `BoardAppProps.pendingMergeYaml` / `onMergeApplied` — host slot to merge YAML into the currently-open board (additive, one-shot, apply-once guard mirrors `initialYaml`). No board-side UI; hosts drive it entirely.
- `@spherescan/modeler`: export `cloneModel` and `createId` from `modeling.ts` (previously private) for reuse by `merge.ts`.
- VS Code / Cursor extension [`packages/vscode-scan`](packages/vscode-scan) (`spherescan.scan`): read-only `*.scan.yaml` / `*.scan` preview with pan/zoom and detail inspection; see [SHIPPING.md](packages/vscode-scan/SHIPPING.md).
- `@spherescan/viewer`: SVG export marks nodes/edges with `data-node` / `data-edge` (wider hit target) for preview selection.
- `@spherescan/model`: element descriptions, notes, typed links, and per-view orthogonal route waypoints.
- `@spherescan/modeler` / `@spherescan/board`: undoable metadata, repository, link, boundary-layer, and route editing APIs with inspector controls.
- `@spherescan/viewer`: graph metadata projection and persisted-waypoint orthogonal routing.
- `@spherescan/board`: Duplicate diagram control + `onSystemIdentityChange` so hosts can relocate workspaces on rename and treat duplicate as a fresh identity.
- `@spherescan/modeler`: `renameSystem` keeps `system.id` slugified in sync with the display name.

### Changed

- `@spherescan/board` **0.4.0**: strip Sphere product / AI chrome from `BoardApp`; hosts use extension slots (`onBoardReady`, `renderNodeOverlay`, `renderInspectorExtras`, `renderBottomChrome`, `architectureWarnings`). Removed `shell` / `BoardAiAdapter` / implementation adapter props and related exports.
- `@spherescan/board`: document-change notifications no longer re-fire when only the host `onDocumentChange` callback identity changes (avoids host update loops).

## [0.3.0] - 2026-07-31

### Fixed

- `@spherescan/board`: load the Order Platform sample as a TS string module (no `*.yaml?raw`) so Vite/Rolldown works through Windows `node_modules` junctions.

### Added

- Optional SCAN element field **`description`** (components, channels, externals, agents, repositories, agent_runtimes); inspector textarea + modeler `updateElementDescription`; design agent instructed to always set it via `upsert_element`.
- `@spherescan/board`: architecture warning toast from YAML `status`/`warn` plus host `BoardAiAdapter.architect` overlay; **Ask Sphere to fix** and on-canvas / inspector Ask Sphere chips call `chat` with the component id/name in the prompt.
- `@spherescan/board` / `@spherescan/modeler`: Ctrl/Cmd+click multi-select for components and boundaries; drag moves the whole selection; zoom chrome shows selection count.
- `@spherescan/model`: strip YAML/JSON `null` on optional fields during parse (agents often emit `warn: null` / `status: null`, which Zod `.optional()` rejects).
- `@spherescan/board`: **Fast design** mode (pen tool on the rail) — click places a component, thin box places a datastore, large box (≥300×220) creates a boundary, click-to-click connects; on-canvas legend while active; Esc cancels wire/draw then exits the mode.
- `@spherescan/board`: connect-target highlight while Fast design (or Connect) wiring is active.

### Changed

- `@spherescan/board`: scope-only split of `BoardApp.tsx` into `chrome/`, `tools/`, `nodes/`, `inspector/`, `preview/`, plus shared helpers (`board-types`, `board-geometry`, `board-style`, `board-files`). Public `index.ts` exports unchanged.
- `@spherescan/viewer` / `@spherescan/board`: edge labels use AABB deconfliction so chips stack with a gap instead of overlapping.
- `@spherescan/viewer` / `@spherescan/board`: orthogonal edges get mid-corridor **lane gaps** so parallel straight wires (and labels) no longer stack on top of each other.
- `@spherescan/viewer` / `@spherescan/board` / `@spherescan/modeler`: SVG/PNG export (and CLI) use **orthogonal** edges by default to match the live board; pass `{ mode: "bezier" }` when curved arrows are selected.

## [0.2.0] - 2026-07-30

### Added

- `@spherescan/board`: agent preview dialogue shows generation duration in seconds.
- `@spherescan/board`: optional `BoardAiAdapter.transcribeAudio` + AIBar Mic (MediaRecorder → STT → auto-submit). Sphere wires local Whisper; SCAN whiteboard stays mic-off without the adapter.

### Changed

- `@spherescan/board`: double-click a component opens the rename modal; Cmd/Ctrl+D and Cmd/Ctrl+C/V work for boundaries as well as elements.
- `@spherescan/board`: connect mode shows a draft rubber-band after the first click, exits to select on success or empty-canvas cancel.
- `@spherescan/board` / `@spherescan/viewer`: toggle **straight 90° arrows** (orthogonal routing) with hop arcs where edges cross; **edge attachment** (L/T/R/B from travel direction) is shared by curved and straight modes.
- `@spherescan/board` / `@spherescan/modeler`: runtime boundaries are labeled **Runtime** (not Agent Runtime) with a Cpu icon by default.
- `@spherescan/board`: AI YAML preview now shows visual line numbers in the preview gutter for reference, while copy-to-clipboard still copies raw YAML only (no numbers).
- `@spherescan/board`: removed the decorative "Preview changes" checkbox from the AI bar; agent replies always open the preview drawer.
- `skills/scan-notation`: prefer **outer-shell** boundaries when recreating from diagrams; do not nest or mirror every inner visual subgroup.

## [0.1.0] - 2026-07-26

### Added

- `@spherescan/model` - parse, serialize, validate SCAN 0.1 YAML/JSON
- `@spherescan/rules` - connection legality
- `@spherescan/viewer` - graph projection and SVG/PNG export
- `@spherescan/modeler` - command stack editing API
- `@spherescan/cli` - `scan validate` / `scan export svg`
- Reference whiteboard (`apps/whiteboard`)
- Normative spec (`docs/spec/scan-0.1.md`, CC BY 4.0)
- Reference AI skill (`skills/scan-notation/`, Apache 2.0)
- Dual licensing (CC BY 4.0 spec / Apache 2.0 software), NOTICE, TRADEMARKS

### Notes

- `@spherescan/board` remains a **private** workspace package (not published) until 0.2
- Legacy `sphere:` YAML root and `Sphere*` API aliases are supported for compatibility
