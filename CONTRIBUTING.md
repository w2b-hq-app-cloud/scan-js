# Contributing to SCAN (`scan-js`)

Thanks for helping improve **System & Component Architecture Notation** and the `@spherescan/*` toolkit.

This repository is the **open-source SCAN project**. Contributions should advance the notation, libraries, reference whiteboard, CLI, and docs â€” not proprietary product hosts.

## Setup

```bash
npm install --legacy-peer-deps
npm run build
npm test
npm run typecheck
npm run validate
```

Run the reference modeler:

```bash
npm run dev
```

## Where to work

| Area | Path |
|------|------|
| Metamodel / parse / validate | `packages/model` |
| Connection legality | `packages/rules` |
| Render / export | `packages/viewer` |
| Edit commands / undo / auto-layout | `packages/modeler` |
| CLI | `packages/cli` |
| Reference UI | `apps/whiteboard` |
| Spec | `docs/spec/scan-0.1.md` |

Keep the whiteboard **minimal and embeddable** â€” a demo of the toolkit, not a full product shell.

## Notation changes

If you change the SCAN metamodel or rules:

1. Update [`docs/spec/scan-0.1.md`](docs/spec/scan-0.1.md) and the JSON schema under `packages/model/schemas/`
2. Add/adjust fixtures and tests
3. Keep `type` (role) separate from `technology` (stack)

## Pull requests

- Keep changes focused and named for **SCAN / scan-js** (not external product brands)
- Add or update tests when behavior changes (`model`, `rules`, `viewer`, `modeler`)
- Run `npm run typecheck` and `npm test` before opening a PR
- Prefer small PRs over large mixed refactors

## Licensing of contributions

By submitting a contribution, you agree that:

- contributions to `docs/spec/` are licensed under CC BY 4.0;
- contributions to software, schemas, examples and skills are licensed under
  Apache License 2.0;
- your contribution does not grant rights to the Sphere or SCAN trademarks.

See [TRADEMARKS.md](TRADEMARKS.md) and the [Licensing](README.md#licensing) section of the README.

## Reference AI skill

The canonical platform-independent skill lives at [`skills/scan-notation/`](skills/scan-notation/).
When this repo is nested under sphere-io, git hooks sync it to
`.cursor/skills/scan-notation/` via `scripts/sync-scan-notation-skill.py`.
**Edit the copy under `skills/scan-notation/`**, not only the Cursor mirror.

## Code of conduct

Be respectful. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
