# SCAN Diagram Preview (VS Code / Cursor)

Read-only preview for **System & Component Architecture Notation** (`*.scan.yaml`).

Toggle the same editor between **YAML source** and **diagram preview** (like Markdown), then **pan / zoom / fit**. No editing tools — YAML stays the source of truth.

Part of the open-source [scan-js](https://github.com/w2b-hq-app-cloud/scan-js) toolkit (`@spherescan/model` + `@spherescan/viewer`).

![SCAN architecture diagram](https://raw.githubusercontent.com/w2b-hq-app-cloud/scan-js/main/docs/screenshot.png)

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
code --install-extension packages/vscode-scan/scan-*.vsix --force
# Cursor:
cursor --install-extension packages/vscode-scan/scan-*.vsix --force
```

### From the Marketplace

Once published as **`spherescan.scan`**, install from the Extensions view (`Ctrl+Shift+X`) or:

```bash
code --install-extension spherescan.scan
```

See [SHIPPING.md](./SHIPPING.md) to publish.

## Usage

1. Open a `*.scan.yaml` file.
2. Toggle preview in the **same tab** (like Markdown):
   - Editor title **Open Preview** icon (top-right of the editor)
   - Shortcut `Ctrl+Shift+V` / `Cmd+Shift+V`
   - Status bar **SCAN Preview**
3. In preview, use **Preview | SCAN** (or title **Show Source** / the same shortcut) to return to YAML.
4. Optional: **Open Preview to the Side** (`Ctrl+K V`) for a side-by-side layout.
5. Drag to pan, scroll to zoom, use **Fit** / **±**.

Preview refreshes automatically when you edit the YAML (keep the source editor open in another group, or toggle back to edit).

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
