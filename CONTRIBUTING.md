# Contributing to SCAN (`scan-js`)

Thanks for helping improve **System & Component Architecture Notation** and the `@spherescan/*` toolkit.

This repository is the **open-source SCAN project**. Contributions should advance the notation, libraries, reference whiteboard, CLI, and docs — not proprietary product hosts.

## How to contribute

### Share knowledge

- Open or join a conversation on [GitHub Discussions](https://github.com/w2b-hq-app-cloud/scan-js/discussions) when you have a question or idea that does not need a code change yet.
- Prefer issues for actionable bugs and feature work (see below).

### File bugs or feature requests

1. [Search existing issues](https://github.com/w2b-hq-app-cloud/scan-js/issues) before filing a duplicate.
2. [Open a new issue](https://github.com/w2b-hq-app-cloud/scan-js/issues/new/choose) with enough context for someone unfamiliar with your setup.
3. For bugs: steps to reproduce, expected vs actual behavior, and environment (OS, Node version, package versions). A minimal SCAN YAML fixture helps a lot.
4. For features: describe the use case and, if useful, a sketch of the API or UI — keep scope on SCAN, not a host product.

### Write code

You can contribute fixes and features once you have a clear issue (or a small, self-contained improvement).

**All code lands via pull request into `main`.** Do not push commits directly to `main` (protected), including maintainers.

There are two ways to get your branch onto GitHub:

| Who | How |
|-----|-----|
| **Community contributors** | [Fork](https://github.com/w2b-hq-app-cloud/scan-js/fork) the repo, create a **feature branch** on your fork, push, then open a PR into `main`. |
| **Maintainers / invited collaborators** (write access on `w2b-hq-app-cloud/scan-js`) | Create a **feature branch on the origin** (e.g. `feature/…` or `fix/…`), push it to `origin`, then open a PR into `main`. No fork required. |

If you contribute regularly and want collaborator access so you can push feature branches on origin, ask a maintainer.

For large changes, open a **draft PR** early so others can give feedback before you finish.

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

When this tree is nested under `sphere-io/`, install once at the **monorepo root**, not inside `scan-js/` — see the Develop section of the [README](README.md#develop).

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

Keep the whiteboard **minimal and embeddable** — a demo of the toolkit, not a full product shell.

## Notation changes

If you change the SCAN metamodel or rules:

1. Update [`docs/spec/scan-0.1.md`](docs/spec/scan-0.1.md) and the JSON schema under `packages/model/schemas/`
2. Add/adjust fixtures and tests
3. Keep `type` (role) separate from `technology` (stack)

## Pull requests

Before (or when) you open a PR:

- Base branch: **`main`**
- Keep changes focused and named for **SCAN / scan-js** (not external product brands)
- Reference the related GitHub issue when there is one
- Add or update tests when behavior changes (`model`, `rules`, `viewer`, `modeler`)
- Run `npm run typecheck` and `npm test` locally
- Prefer small PRs over large mixed refactors

## Review

- Another person should review the PR when possible (maintainers included — still use PRs, not silent merges to `main`).
- Address review feedback on the same feature branch; force-push only when needed to clean history on that branch.
- Maintainers merge approved PRs after review.

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
