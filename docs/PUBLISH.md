# Publishing SCAN to npm (`@spherescan`)

> **Full guide:** when nested under sphere-io, see  
> [`docs/PUBLISH-SCAN-NPM.md`](../../docs/PUBLISH-SCAN-NPM.md).

**Scope:** [npmjs.com/org/spherescan](https://www.npmjs.com/org/spherescan)

| Package | Default release? | Notes |
|---------|------------------|--------|
| `@spherescan/model` | yes | Metamodel |
| `@spherescan/rules` | yes | Connection rules |
| `@spherescan/viewer` | yes | Render / export |
| `@spherescan/modeler` | yes | Edit API |
| `@spherescan/cli` | yes | `scan` binary |
| `@spherescan/board` | opt-in (`--with-board`) | React canvas (source exports; Vite hosts transpile) |

Do **not** publish `@spherescan/whiteboard` or examples.

## Release CLI (preferred)

The release tool lives in the **sphere-io** monorepo (Python), not inside this SCAN package tree. From `sphere-io/` with nested `scan-js/` on **`main`**, clean tree, and `npm login` to the spherescan org:

```bash
# Via unified CLI (preferred)
python sphere.py workspace scan-release patch --dry-run
python sphere.py workspace scan-release patch -y
python sphere.py workspace scan-release minor --with-board -y

# Aliases / standalone wrapper (same script)
python sphere.py workspace release patch --dry-run
python scan-release.py patch --dry-run
```

Bump argument: `major` | `minor` | `patch`.

Implementation: `sphere-io/scripts/scan-release.py` (wired in `sphere.py` as `workspace scan-release`).

The CLI:

1. Bumps every publishable package version in `scan-js/` (and `@spherescan/*` dependency pins)
2. Optionally prepares board for public publish (`--with-board`)
3. Updates `CHANGELOG.md`
4. Runs `npm run build` && `npm test` (unless `--skip-tests`)
5. `npm publish -w … --access public` in dependency order
6. Commits, creates annotated tag `vX.Y.Z` on the release commit, pushes branch + tag

Useful flags: `--dry-run`, `--yes`/`-y`, `--otp <code>`, `--allow-dirty`, `--allow-branch`, `--no-git`, `--no-publish`.

## Manual path (legacy)

```bash
cd scan-js
npm login
npm install --legacy-peer-deps && npm run build && npm test

npm publish -w @spherescan/model --access public
npm publish -w @spherescan/rules --access public
npm publish -w @spherescan/viewer --access public
npm publish -w @spherescan/modeler --access public
npm publish -w @spherescan/cli --access public
# optional:
# npm publish -w @spherescan/board --access public

git tag -a v0.2.0 -m "SCAN v0.2.0"
git push origin main
git push origin v0.2.0
```
