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

| From â†’ To | Allowed `type` values |
|-----------|------------------------|
| `external` or `service` â†’ `service` | `synchronous-request`, `grpc-request` |
| `service` â†’ `database` | `database-access` |
| `service` or `external` â†’ `event` | `event-publication` |
| `event` â†’ `search`, `service`, or `external` | `stream-consume`, `event-subscription` |
| `agent` â†’ `agent` | `agent-delegation` |
| `agent` â†’ `repo` | `git-integration` |

Anything else is **illegal** (e.g. agent â†’ database, service â†’ agent as typed edge).

## Port checks

When `fromPort` / `toPort` are set:

- `fromPort` must exist on **from**â€™s `exposes`
- `toPort` must exist on **to**â€™s `consumes`

Omit both ports if the model has no ports yet; prefer setting them for services/APIs.

## Suggesting a type

1. Resolve kinds for `from` and `to`.
2. Find the matching row in the table.
3. Pick the first type, or the one that matches protocol (REST â†’ `synchronous-request`, gRPC â†’ `grpc-request`, Kafka publish â†’ `event-publication`, consume â†’ `stream-consume`).

## Diagram side heuristics

| Flow | `fromSide` â†’ `toSide` |
|------|------------------------|
| Left â†’ right request | `r` â†’ `l` |
| Service down to DB/event | `b` â†’ `t` |
| Event right to consumer | `r` â†’ `l` |
