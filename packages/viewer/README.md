# @spherescan/viewer

Embeddable SCAN renderer â€” project a model to a board graph and export SVG/PNG.

```bash
npm install @spherescan/viewer @spherescan/model
```

```js
import { ScanViewer } from "@spherescan/viewer";

const viewer = new ScanViewer({ container: "#canvas" });
await viewer.importYAML(yamlString);
```

Also: `projectToGraph`, `graphToSvg`, `svgToPngBlob`.

License: Apache-2.0.
