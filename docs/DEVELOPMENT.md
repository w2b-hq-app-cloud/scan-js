# Development - SCAN (`scan-js`)

Local setup for contributing to the SCAN toolkit.

## Prerequisites

- Node.js 22+
- npm 10+

## Install & build

```bash
npm install --legacy-peer-deps
npm run build
npm test
npm run typecheck
npm run validate
```

## Reference whiteboard

```bash
npm run dev
```

Opens the minimal modeler in `apps/whiteboard`. How-to: [MANUAL.md](MANUAL.md).

## Packages

Workspaces under `packages/*` and `apps/*`. Build order is handled by the root `build` script (`model` -> `rules` -> `viewer` -> `modeler` -> `cli` -> whiteboard).

`@spherescan/board` is a **private** workspace package (source consumed by the whiteboard). It is not published to npm in v0.1 - see README.

## VS Code / Cursor preview

Read-only diagram preview for `*.scan.yaml`:

```bash
npm run ext:package
code --install-extension packages/vscode-scan/scan-*.vsix
```

Docs: [`packages/vscode-scan/README.md`](../packages/vscode-scan/README.md), publish steps in [`SHIPPING.md`](../packages/vscode-scan/SHIPPING.md).

## Skill sync (when nested under sphere-io)

Canonical skill: [`skills/scan-notation/`](../skills/scan-notation/).  
From sphere-io, `scripts/sync-scan-notation-skill.py` (pre-commit / post-merge) mirrors it to `.cursor/skills/scan-notation/`.

## CI

GitHub Actions runs install, build, test, typecheck, and a smoke validate on push/PR.
