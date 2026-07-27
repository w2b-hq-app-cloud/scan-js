# API walkthrough

Import YAML -> render -> edit -> export, using the `@spherescan/*` toolkit.

## 1. Validate

```bash
node packages/cli/dist/cli.js validate path/to/architecture.scan.yaml
```

Or programmatically:

```js
import { parseScanYaml, validateScanModel } from "@spherescan/model";

const model = parseScanYaml(yamlText);
const result = validateScanModel(model);
```

## 2. Render (viewer)

```js
import { ScanViewer } from "@spherescan/viewer";

const viewer = new ScanViewer({ container: document.querySelector("#canvas") });
await viewer.importYAML(yamlText);
```

## 3. Edit (modeler)

```js
import { ScanModeler } from "@spherescan/modeler";

const modeler = new ScanModeler({ container: document.querySelector("#canvas") });
await modeler.importYAML(yamlText);
// use modeling commands / UI; then:
const out = modeler.saveYAML();
```

## 4. Export SVG

```bash
node packages/cli/dist/cli.js export svg path/to/architecture.scan.yaml -o out.svg
```

Or from the viewer graph: `projectToGraph` -> `graphToSvg`.

## 5. Embed example

See [`examples/embed-viewer`](../../examples/embed-viewer) for a minimal HTML/JS embed.

## 6. Sample architectures

YAML fixtures under [`examples/architectures`](../../examples/architectures) and [`packages/model/fixtures`](../../packages/model/fixtures).
