# @spherescan/model

SCAN metamodel - parse, serialize, and validate System & Component Architecture Notation documents.

```bash
npm install @spherescan/model
```

```js
import { parseScanYaml, validateScanModel, serializeScanYaml } from "@spherescan/model";

const model = parseScanYaml(yamlText);
const { ok, issues } = validateScanModel(model);
if (!ok) console.error(issues);
else console.log(serializeScanYaml(model));
```

JSON Schema: `@spherescan/model/schema.json` (also under `schemas/scan-0.1.json`).

License: Apache-2.0. Spec: CC BY 4.0 under `docs/spec/`.
