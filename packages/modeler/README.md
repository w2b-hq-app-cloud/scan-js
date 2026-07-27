# @spherescan/modeler

SCAN editing API â€” command stack for create, connect, move, delete, auto-layout, undo/redo.

```bash
npm install @spherescan/modeler @spherescan/viewer @spherescan/model @spherescan/rules
```

```js
import { ScanModeler } from "@spherescan/modeler";

const modeler = new ScanModeler({ container: "#canvas" });
await modeler.importYAML(yamlString);
modeler.getModeling().createElement({ kind: "service", id: "api", name: "API" });
```

Prefer `ScanModeler`; `SphereModeler` is a legacy alias.

License: Apache-2.0.
