# Shipping the SCAN VS Code / Cursor extension

Extension id: **`spherescan.scan`**  
Package path: `scan-js/packages/vscode-scan/`  
Distribution: **VSIX** / Visual Studio Marketplace / Open VSX (not npm).

## Prerequisites

1. [Node.js](https://nodejs.org/) 20+ and npm.
2. Built toolkit packages this extension bundles:

   ```bash
   cd scan-js
   npm i
   npm run build -w @spherescan/model
   npm run build -w @spherescan/viewer
   ```

3. For Marketplace publish: a [Visual Studio Marketplace publisher](https://marketplace.visualstudio.com/manage) named **`spherescan`** (or change `"publisher"` in `package.json` to match yours).
4. Azure DevOps Personal Access Token with **Marketplace → Manage** scope.

## Build a VSIX locally

```bash
cd scan-js
npm run package -w scan
# → packages/vscode-scan/scan-0.1.10.vsix (version from package.json)
```

Install for smoke test:

```bash
code --install-extension packages/vscode-scan/scan-0.1.10.vsix --force
# or
cursor --install-extension packages/vscode-scan/scan-0.1.10.vsix --force
```

### Smoke checklist

- [ ] Open a valid `*.scan.yaml` → editor title **Open Preview** icon (top-right) toggles same-tab diagram
- [ ] `Ctrl+Shift+V` toggles Preview ↔ SCAN source
- [ ] In preview, title **Show Source** returns to YAML
- [ ] Diagram toolbar has zoom/fit only
- [ ] Diagram renders full-bleed (no Details column); **Fit** frames the graph
- [ ] Drag pans; wheel zooms
- [ ] Break the YAML → preview shows an error; fix → diagram returns
- [ ] Extensions view shows Sphere icon + README screenshot
- [ ] Reload window → preview command still works

## Publish to Visual Studio Marketplace

1. Confirm `"publisher": "spherescan"` in [`package.json`](./package.json).
2. Marketplace assets: `media/icon.png` (128×128 Sphere mark) and `media/screenshot.png` (also embedded in README). Upload the screenshot in the Marketplace publisher portal when creating the listing.
3. Bump `"version"` when releasing (independent of `@spherescan/*` npm versions).
4. Package and publish:

   ```bash
   cd packages/vscode-scan
   npm run build
   npx --yes @vscode/vsce login spherescan
   npx --yes @vscode/vsce publish
   # or: vsce package && vsce publish -i scan-x.y.z.vsix
   ```

5. Verify listing: https://marketplace.visualstudio.com/items?itemName=spherescan.scan

**Cursor** installs VS Code Marketplace extensions; users can search **SCAN Diagram Preview** or install `spherescan.scan` from the Extensions panel.

## Publish to Open VSX (optional)

Some environments prefer [Open VSX](https://open-vsx.org/):

```bash
npx --yes ovsx publish scan-0.1.0.vsix -p "$OVSX_PAT"
```

Create a token at https://open-vsx.org/user-settings/tokens.

## Versioning notes

| Artifact | Version |
|----------|---------|
| Extension (`spherescan.scan`) | `package.json` → `version` (semver; bump per VSIX release) |
| `@spherescan/model` / `viewer` | Pinned in extension `dependencies`; rebuild extension when APIs change |

Do **not** include this package in `scan-release` npm publishes — it is editor-only.

## Uninstall

```bash
code --uninstall-extension spherescan.scan
```
