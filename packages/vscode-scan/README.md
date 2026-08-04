# SCAN Diagram Preview (VS Code / Cursor)

Read-only preview for **System & Component Architecture Notation** (`*.scan.yaml`).

Open a diagram beside the editor (like Markdown preview), **pan / zoom / fit**, and **click** a component or connection to inspect details. No editing tools — YAML stays the source of truth.

Part of the open-source [scan-js](https://github.com/w2b-hq-app-cloud/scan-js) toolkit (`@spherescan/model` + `@spherescan/viewer`).

## Install

### From a VSIX (local / CI)

```bash
cd scan-js
npm i
npm run build -w @spherescan/model
npm run build -w @spherescan/viewer
npm run package -w scan
```

Then:

```bash
code --install-extension packages/vscode-scan/scan-*.vsix
# Cursor:
cursor --install-extension packages/vscode-scan/scan-*.vsix
```

### From the Marketplace

Once published as **`spherescan.scan`**, install from the Extensions view (`Ctrl+Shift+X`) or:

```bash
code --install-extension spherescan.scan
```

See [SHIPPING.md](./SHIPPING.md) to publish.

## Usage

1. Open a `*.scan.yaml` file (e.g. `packages/model/fixtures/order-platform.yaml` renamed or any SCAN document).
2. **SCAN: Open Preview to the Side** (editor title icon, or `Ctrl+K V` / `Cmd+K V`).
3. Drag to pan, scroll to zoom, use **Fit** / **±**.
4. Click a box or wire — details appear in the side panel.

Preview refreshes automatically when you edit the YAML.

## Development

```bash
cd scan-js/packages/vscode-scan
npm run build          # esbuild → dist/extension.js
npm run watch          # rebuild on change
npx --yes @vscode/vsce package --no-dependencies
```

The scan-js workspace excludes this package from Cursor/VS Code **npm task auto-detect** (see `scan-js/.vscode/settings.json`) so the editor does not toast a false “failed to parse package.json” for this VS Code extension manifest.

## License

Apache-2.0 — Copyright 2026 WABLOO PARTNERS SRL
