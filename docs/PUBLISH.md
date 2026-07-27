# Publishing SCAN to npm (`@spherescan`)

> **Full guide:** when nested under sphere-io, see  
> [`docs/PUBLISH-SCAN-NPM.md`](../../docs/PUBLISH-SCAN-NPM.md).

**Scope:** [npmjs.com/org/spherescan](https://www.npmjs.com/org/spherescan) → `@spherescan/model`, `@spherescan/rules`, `@spherescan/viewer`, `@spherescan/modeler`, `@spherescan/cli`  
(`@scan` is not available on npm.)

Keep **`@spherescan/board`** private until 0.2.

## Quick path

```bash
npm login
npm install --legacy-peer-deps && npm run build && npm test

npm publish -w @spherescan/model --access public
npm publish -w @spherescan/rules --access public
npm publish -w @spherescan/viewer --access public
npm publish -w @spherescan/modeler --access public
npm publish -w @spherescan/cli --access public

git tag -f v0.1.0 && git push origin v0.1.0
```
