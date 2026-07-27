# SCAN connection rules (v0.1)

Source of truth: `@spherescan/rules` (`packages/rules/src/index.ts`). Kinds below are **rule kinds**, not always YAML `type` strings.

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

## Allowed edges

| From -> To | Allowed `type` values |
|-----------|------------------------|
| `external` or `service` -> `service` | `synchronous-request`, `grpc-request` |
| `service` -> `database` | `database-access` |
| `service` or `external` -> `event` | `event-publication` |
| `event` -> `search`, `service`, or `external` | `stream-consume`, `event-subscription` |
| `agent` -> `agent` | `agent-delegation` |
| `agent` -> `repo` | `git-integration` |

Anything else is **illegal** (e.g. agent -> database, service -> agent as typed edge).

## Port checks

When `fromPort` / `toPort` are set:

- `fromPort` must exist on **from**'s `exposes`
- `toPort` must exist on **to**'s `consumes`

Omit both ports if the model has no ports yet; prefer setting them for services/APIs.

## Suggesting a type

1. Resolve kinds for `from` and `to`.
2. Find the matching row in the table.
3. Pick the first type, or the one that matches protocol (REST -> `synchronous-request`, gRPC -> `grpc-request`, Kafka publish -> `event-publication`, consume -> `stream-consume`).

## Diagram side heuristics

| Flow | `fromSide` -> `toSide` |
|------|------------------------|
| Left -> right request | `r` -> `l` |
| Service down to DB/event | `b` -> `t` |
| Event right to consumer | `r` -> `l` |
