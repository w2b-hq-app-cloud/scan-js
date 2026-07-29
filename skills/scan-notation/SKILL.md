---
name: scan-notation
description: >-
  Author valid SCAN (System & Component Architecture Notation) 0.1 YAML diagrams
  and models. Use when creating or editing SCAN/Sphere architecture YAML, board
  fixtures, connections, ports, views/layout, or when the user asks to model a
  system, draw a SCAN diagram, or generate architecture.scan.yaml / scan YAML.
---

<!--
Copyright 2026 WABLOO PARTNERS SRL
SPDX-License-Identifier: Apache-2.0
-->

# SCAN notation - construct diagrams

SCAN describes software systems as **YAML** (or JSON). Semantics live in root collections; diagram boxes live in `views[].layout`. Sphere *uses* SCAN via `@spherescan/*` from sibling repo `scan-js` - do not reimplement the canvas here.

**File naming:** save diagrams as **`*.scan.yaml`** (e.g. `checkout.scan.yaml`, `architecture.scan.yaml`). Do **not** use `.sphere.yaml` - that extension is legacy.

**Canonical skill location:** `scan-js/skills/scan-notation/` (this directory when inside scan-js). Cursor installs a synced mirror at `sphere-io/.cursor/skills/scan-notation/`. **Edit the canonical copy**; `python scripts/sync-scan-notation-skill.py` (pre-commit + post-merge) refreshes the Cursor mirror and optional skeletons.

Canonical sources (in `../scan-js` when working from sphere-io):

- Spec: `../scan-js/docs/spec/scan-0.1.md`
- Schema: `../scan-js/packages/model/schemas/scan-0.1.json`
- Fixture: `../scan-js/packages/model/fixtures/order-platform.yaml`
- Rules: `../scan-js/packages/rules/src/index.ts`

## Workflow

1. Identify **system** (`id`, `name`) and elements (services, DBs, externals, events, agents, repos).
2. Put each element in the **correct collection** (see map below).
3. Add **ports** (`consumes` / `exposes`) on nodes that talk over APIs/events.
4. Add **connections** with legal `type` (see [connection-rules.md](connection-rules.md)).
5. Add **one view** with `layout` for every element id; optional `boundaries`.
6. Validate from scan-js: `cd ../scan-js && node packages/cli/dist/cli.js validate <file.scan.yaml>` (schema + `validateScanModel`) or call `validateScanModel` from `@spherescan/model`.
7. Prefer stable `id`s (kebab-case). Never reuse an id across collections.
8. Write the file as **`<name>.scan.yaml`** (not `.sphere.yaml`).

Copy this checklist:

```
- [ ] scan: "0.1"
- [ ] system.id + system.name
- [ ] Every element in the right collection
- [ ] Every connected id exists
- [ ] Connection types are capability-plausible (see connection-rules.md; matrix is suggestions)
- [ ] fromPort = expose on from; toPort = consume on to (when set)
- [ ] views[0].layout has every element id
- [ ] Boundary members subset of layout ids; boxes use label/members + trust|runtime kind
- [ ] Saved as *.scan.yaml
```

## Element map (where things go)

| Concept | Collection | `type` / notes |
|---------|------------|----------------|
| API / app service | `components` | `type: service` |
| Database | `components` | `type: datastore` |
| Search index | `components` | `type: search` |
| Kafka/topic/stream | `channels` | `type: event-stream` (default) |
| 3rd-party / outside system | `external_systems` | optional `type: external-system` |
| Agent | `agents` | not under `components` |
| Git / artifact repo node | `repositories` | first-class node |
| Agent runtime env | `agent_runtimes` | referenced by `agents[].runtime` |

Keep **`type`** (role) separate from **`technology`** (stack), e.g. `type: service` + `technology: Spring Boot`.

Inline `repository:` on a component is a **ref** (`path` or `{ provider, path }`), not a canvas node. Use `repositories:` when the repo itself is a diagram element.

## Minimal valid document

```yaml
scan: "0.1"

system:
  id: checkout
  name: Checkout

components:
  - id: checkout-api
    name: Checkout API
    type: service
    technology: NestJS
    consumes:
      - id: checkout-api-in
        label: REST
        protocol: OpenAPI
    exposes:
      - id: checkout-api-out
        label: REST
        protocol: OpenAPI

  - id: checkout-db
    name: Checkout DB
    type: datastore
    technology: PostgreSQL

connections:
  - id: e1
    from: checkout-api
    to: checkout-db
    type: database-access
    label: DB Access
    contract: JDBC
    fromSide: b
    toSide: t

views:
  - id: architecture-board
    type: service-architecture
    boundaries: []
    layout:
      checkout-api: { x: 120, y: 80, w: 260, h: 190 }
      checkout-db: { x: 120, y: 320, w: 220, h: 160 }
```

Save this as e.g. `checkout.scan.yaml`.

## Ports

```yaml
consumes:   # inbound - others connect TO this
  - id: svc-in
    label: REST
    protocol: OpenAPI
exposes:    # outbound - this connects FROM this
  - id: svc-out
    label: REST
    protocol: OpenAPI
```

- Port `id` unique within the owning element.
- When wiring ports on a connection: `fromPort` must be an **expose** on `from`; `toPort` must be a **consume** on `to`.

## Connections (quick)

Required: `from`, `to`, `type`. Recommended: `id`, `label`, `contract`, `fromSide`/`toSide`, `operations`.

| `type` | Typical use |
|--------|-------------|
| `synchronous-request` | REST-style service<->service or external->service |
| `grpc-request` | gRPC-style |
| `database-access` | service -> datastore |
| `event-publication` | service -> channel |
| `stream-consume` / `event-subscription` | channel -> service/search |
| `agent-delegation` | agent -> agent |
| `git-integration` | agent -> repository |

Default labels/contracts often used in fixtures: REST/OpenAPI, gRPC/Proto, DB Access/JDBC, Publish|Stream/AsyncAPI, Git Integration.

`operations` (optional): list endpoints/RPCs/topics shown on hover, e.g. `POST /orders`.

**Legal kind pairs:** see [connection-rules.md](connection-rules.md). Do not invent types outside the table.

## Layout & boundaries

- Every element that should appear on the board needs `views[].layout[id]: { x, y, w?, h? }`.
- Suggested default sizes: service/agent/event ~`260x190`, datastore ~`220x160`, external ~`220x150`, repo ~`260x180`.
- Space nodes ~80-120px apart; left-to-right for request flow; DB/events often below services.
- `fromSide` / `toSide`: `l` | `r` | `t` | `b` (edge attachment).
- Boundaries: `kind: trust` | `runtime`; `members` are element ids whose centers sit inside the rect.

## Authoring tips

- Prefer **many small typed edges** over one vague connection.
- External systems expose APIs; your services **consume** them (edge often `external -> service` or service->service after an internal wrapper).
- Warnings: `status: warn` + `warn: "..."`.
- Output **complete YAML** the user can drop into the whiteboard or `scan validate`, saved as **`*.scan.yaml`**.
- Do not put presentation-only fields on components; layout stays under `views`.

## Larger examples

- Compact multi-kind board: [examples.md](examples.md)
- Full fixture: `../scan-js/packages/model/fixtures/order-platform.yaml`
