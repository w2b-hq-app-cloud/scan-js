# SCAN connection rules (v0.1)

Source of truth: `@spherescan/rules` (`packages/rules/src/index.ts`).

Validation is **capability-based** (relaxed default). The classic matrix below is a
**suggestion / documentation layer**, not an exhaustive reject list.

## Kind resolution

| Model location | Rule kind |
|----------------|-----------|
| `components` `type: service` | `service` |
| `components` `type: datastore` | `database` |
| `components` `type: search` | `search` |
| `channels` | `event` |
| `external_systems` | `external` |
| `agents` | `agent` |
| `repositories` | `repo` |

## Hard rejects (always)

- Same-element loops
- Unknown element ids
- Invalid connection type names (schema)
- Port integrity when `fromPort` / `toPort` are set:
  - `fromPort` must exist on **from**'s `exposes`
  - `toPort` must exist on **to**'s `consumes`

## Capability fit (default legality)

An edge is allowed when the connection `type` fits source/target capabilities:

| `type` | Needs |
|--------|--------|
| `synchronous-request`, `grpc-request` | source can initiate requests; target can accept requests |
| `event-publication` | source can publish; target is an `event` channel |
| `stream-consume`, `event-subscription` | source is `event`; target can consume events |
| `database-access` | store/access semantics on at least one end (either direction OK) |
| `agent-delegation` | source can delegate; target is `agent` or `service` |
| `git-integration` | one end is `repo`; both ends participate in git/source flow |

This intentionally allows real patterns such as:

- `service` -> `agent` (`agent-delegation`)
- `service` -> `external` (`synchronous-request`)
- `repo` -> `service` (`git-integration`)
- `database` -> analytics `service` (`database-access`)

## Common-case suggestion matrix

Prefer these defaults when suggesting a type:

| From -> To | Suggested `type` values |
|-----------|------------------------|
| `external` / `service` / `agent` -> `service` / `external` / `agent` / `search` | `synchronous-request`, `grpc-request` |
| `service` / `external` / `agent` -> `database` / `search` | `database-access` |
| `service` / `external` / `agent` -> `event` | `event-publication` |
| `event` -> `search` / `service` / `external` / `agent` | `stream-consume`, `event-subscription` |
| `agent` / `service` -> `agent` | `agent-delegation` |
| `agent` / `service` / `repo` <-> `repo` / `service` / `agent` | `git-integration` |

## Suggesting a type

1. Resolve kinds for `from` and `to`.
2. Prefer a matrix suggestion if it also fits capabilities.
3. Otherwise pick the first capability-fitting type.
4. Prefer protocol hints: REST -> `synchronous-request`, gRPC -> `grpc-request`, Kafka publish -> `event-publication`, consume -> `stream-consume`.

## Diagram side heuristics

| Flow | `fromSide` -> `toSide` |
|------|------------------------|
| Left -> right request | `r` -> `l` |
| Service down to DB/event | `b` -> `t` |
| Event right to consumer | `r` -> `l` |

## Boundaries (boxes)

View boundaries are **not** connection kinds. Allowed boundary `kind` values:

- `trust`
- `runtime`

Never use `external` / `service` as boundary `kind`. Put third parties in `external_systems`.
Optional boundary `color`: `svc` | `ext` | `data` | `event` | `search` | `agent` | `repo` | `warn` (color-codes the dashed box).
