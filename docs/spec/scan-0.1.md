# SCAN - System & Component Architecture Notation 0.1

**SCAN** is the formal notation for describing software systems, components, contracts, data, messaging, and agents.

Sphere (the product) *uses* SCAN. This open-source toolkit implements SCAN's metamodel, viewer, and modeler - not the full Sphere platform.

| Concern | Where it lives |
|---------|----------------|
| Semantics (what exists, how it connects) | Root collections: `components`, `channels`, `connections`, ... |
| Presentation (diagram DI) | `views[].layout` and `views[].boundaries` boxes |
| Machine validation | Zod in `@spherescan/model` + JSON Schema [`packages/model/schemas/scan-0.1.json`](../../packages/model/schemas/scan-0.1.json) |

**Authority:** this human-readable specification is **normative**. Machine-readable schemas and Zod models in `@spherescan/model` are implementations of this document. If they disagree, **this specification is authoritative**.

Canonical serialization is **YAML**. JSON is supported via the same schema.

Root version key: `scan: "0.1"` (legacy `sphere:` accepted by the parser and schema).

---

## Document root

| Field | Required | Description |
|-------|----------|-------------|
| `scan` | one of `scan` / `sphere` | Notation version (`"0.1"` or `0.1`) |
| `sphere` | legacy | Alias for `scan` |
| `system` | yes | System metadata |
| `components` | no (default `[]`) | Logical / deployable building blocks |
| `channels` | no | Event / stream channels |
| `external_systems` | no | Systems outside the modeled boundary |
| `agents` | no | Autonomous or assisted agents |
| `agent_runtimes` | no | Runtime environments for agents |
| `repositories` | no | Source / artifact repositories as first-class nodes |
| `connections` | no | Typed edges between elements |
| `views` | yes (>=1) | Diagram views + layout DI |

**Principle:** keep `type` (architectural role) separate from `technology` (implementation stack).

---

## System

```yaml
system:
  id: order-platform
  name: Order Platform
  purpose: Process customer orders   # optional
  owner: Commerce Team               # optional
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Stable identifier |
| `name` | yes | Display name |
| `purpose` | no | Short intent |
| `owner` | no | Team or person |

---

## Ports (interfaces)

Ports appear on components, channels, external systems, agents, and repositories under `consumes` / `exposes`.

```yaml
consumes:
  - id: oa-rest
    label: REST
    protocol: OpenAPI    # optional
exposes:
  - id: oa-out
    label: REST
    protocol: OpenAPI
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Unique within the owning element |
| `label` | yes | Short display name |
| `protocol` | no | e.g. OpenAPI, Proto, AsyncAPI |

`consumes` = inbound dependency surface. `exposes` = provided interface. Connection legality for port pairs is enforced by `@spherescan/rules` (not by this schema alone).

---

## Components

Primary architectural nodes.

```yaml
components:
  - id: order-api
    name: Order API
    type: service
    technology: Spring Boot
    description: Accepts and validates customer orders; owns the order aggregate.
    notes: Managed by the checkout team.
    links:
      - kind: doc              # doc | repo | openapi | other
        href: https://docs.example.com/order-api
        title: API guide
    repository:
      provider: github
      path: company/order-api
    status: warn              # optional: ok | warn
    warn: Missing async contract
    consumes: [ ... ]
    exposes: [ ... ]
```

### Component `type` (role)

| Value | Typical use |
|-------|-------------|
| `service` | Application / API service |
| `datastore` | Database or persistent store |
| `search` | Search / index engine |
| `external-system` | Allowed on components; prefer `external_systems` collection |
| `agent` | Allowed on components; prefer `agents` collection |
| `repository` | Allowed on components; prefer `repositories` collection |
| `event-stream` | Allowed on components; prefer `channels` collection |

### Other component fields

| Field | Required | Notes |
|-------|----------|-------|
| `id`, `name`, `type` | yes | |
| `technology` | no | Implementation hint |
| `subtitle` | no | Secondary line under the title |
| `description` | no | Free-text notes (role, ownership, constraints); Sphere inspector + design agent |
| `notes` | no | Freeform authoring notes |
| `links` | no | Typed references: `{ kind, href, title? }`; `kind` is `doc`, `repo`, `openapi`, or `other` |
| `icon` | no | Diagram icon override: Lucide name (`shield`), `https://...`, or `data:image/...` |
| `repository` | no | String path **or** `{ provider?, path }` |
| `consumes` / `exposes` | no | Port lists |
| `status` | no | `ok` \| `warn` |
| `warn` | no | Human-readable warning when `status: warn` |

---

## Channels

Messaging / stream topics modeled as first-class elements.

```yaml
channels:
  - id: order-created
    name: Order Created
    type: event-stream      # const; default if omitted
    technology: Kafka
    description: Domain event emitted when an order is accepted.
    consumes: [ ... ]
    exposes: [ ... ]
```

| Field | Required | Notes |
|-------|----------|-------|
| `id`, `name` | yes | |
| `type` | no | Must be `event-stream` when present |
| `technology` | no | e.g. Kafka, Pulsar |
| `description` | no | Free-text notes |
| `consumes` / `exposes` | no | Topic / schema ports |

---

## External systems

Systems outside the modeled product surface.

```yaml
external_systems:
  - id: payment-platform
    name: Payment Platform
    type: external-system     # optional const
    description: Third-party payment provider (card capture and refunds).
    repository: stripe/openapi
    exposes:
      - id: pp-rest
        label: REST
        protocol: OpenAPI
```

| Field | Required | Notes |
|-------|----------|-------|
| `id`, `name` | yes | |
| `type` | no | `external-system` when present |
| `technology` | no | |
| `description` | no | Free-text notes |
| `repository` | no | String or `{ provider?, path }` |
| `consumes` / `exposes` | no | |

---

## Agents and agent runtimes

```yaml
agents:
  - id: coding-agent
    name: Coding Agent
    purpose: Build & Implement
    subtitle: Build & Implement
    description: Implements approved design changes in application repositories.
    runtime: eng-agent-runtime    # id -> agent_runtimes
    consumes: [ ... ]
    exposes: [ ... ]

agent_runtimes:
  - id: eng-agent-runtime
    name: Engineering Agent Runtime
    type: governed-runtime        # free-form string
    description: Shared runtime for engineering agents (tooling, secrets, network).
```

| Element | Required fields | Notable optional fields |
|---------|-----------------|-------------------------|
| Agent | `id`, `name` | `purpose`, `subtitle`, `description`, `runtime`, ports |
| Agent runtime | `id`, `name` | `type` (string), `description` |

---

## Repositories

First-class source/artifact nodes (distinct from inline `repository` refs on components).

```yaml
repositories:
  - id: github
    name: GitHub Repository
    provider: github
    path: company/order-platform
    subtitle: company/order-platform
    description: Canonical monorepo for the order platform services.
    consumes: [ ... ]
    exposes: [ ... ]
```

| Field | Required | Notes |
|-------|----------|-------|
| `id`, `name` | yes | |
| `provider`, `path`, `subtitle` | no | |
| `description` | no | Free-text notes |
| `consumes` / `exposes` | no | |

---

## Connections

Typed edges between element ids.

```yaml
connections:
  - id: e1
    from: payment-platform
    to: order-api
    type: synchronous-request
    label: REST
    contract: OpenAPI
    fromSide: r
    toSide: l
```

| Field | Required | Notes |
|-------|----------|-------|
| `from`, `to` | yes | Element ids |
| `type` | yes | See table below |
| `id` | no | Recommended for stable editing |
| `protocol` | no | |
| `label` | no | Edge label on the diagram |
| `contract` | no | String **or** `{ type?, reference? }` |
| `fromSide` / `toSide` | no | Diagram DI: `l` \| `r` \| `t` \| `b` |
| `fromPort` / `toPort` | no | Port ids on `from` / `to` (expose -> consume when present) |
| `operations` | no | List of endpoints / RPCs / topics / queries used on the link |

```yaml
connections:
  - id: e2
    from: order-api
    to: payment-service
    type: synchronous-request
    fromPort: oa-out
    toPort: ps-in
    label: REST
    contract: OpenAPI
    operations:
      - POST /payments/authorize
      - GET /payments/{id}
```

### Connection types (v0.1)

| Type | Meaning |
|------|---------|
| `synchronous-request` | Request/response (e.g. REST) |
| `grpc-request` | Synchronous gRPC-style call |
| `database-access` | Client -> datastore |
| `event-publication` | Producer -> channel |
| `event-subscription` | Channel -> consumer (subscription) |
| `stream-consume` | Stream / topic consume |
| `agent-delegation` | Agent -> agent handoff |
| `git-integration` | Agent/system -> repository |

Which kind pairs are legal is defined by `@spherescan/rules`, not by this document's schema alone. Reference integrity (ids exist) is enforced by `validateScanModel` (Track **A4**).

---

## Views and diagram DI

Views hold **presentation only**. Semantics stay in the root collections.

```yaml
views:
  - id: architecture-board
    type: service-architecture          # default if omitted
    boundaries:
      - id: g-order
        label: Order Platform
        tag: Trust Boundary             # optional
        kind: trust                     # trust | runtime (default trust)
        members: [order-api, orders-db]
        x: 420
        y: 60
        w: 1240
        h: 620
    layout:
      order-api: { x: 480, y: 180, w: 260, h: 190 }
    routes:
      e-order-payment:
        waypoints:
          - { x: 840, y: 275 }
          - { x: 840, y: 420 }
```

### View

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | |
| `layout` | yes | Map of element id -> box |
| `type` | no | Default `service-architecture` |
| `boundaries` | no | Default `[]` |
| `routes` | no | Map of connection id to DI route with intermediate `{ x, y }` orthogonal waypoints |

### Layout entry (DI box)

| Field | Required | Notes |
|-------|----------|-------|
| `x`, `y` | yes | Origin of the node box |
| `w`, `h` | no | Size; renderers supply defaults per kind |

### Boundary

| Field | Required | Notes |
|-------|----------|-------|
| `id`, `label` | yes | |
| `members` | yes | Element ids inside the boundary |
| `x`, `y`, `w`, `h` | yes | Boundary rectangle |
| `kind` | no | `trust` \| `runtime` (default `trust`) |
| `tag` | no | Secondary label (e.g. "Trust Boundary") |
| `icon` | no | Same as element `icon` (Lucide name / URL / data URL) |

`fromSide` / `toSide` on connections are also DI (edge routing), co-located with connection semantics for authoring convenience.
`routes` is view-specific DI: omit a connection route to use automatic routing; stored waypoints are intermediate points only, with anchors derived from the endpoint boxes.

---

## Validation

1. **Structural:** JSON Schema [`scan-0.1.json`](../../packages/model/schemas/scan-0.1.json) (also published as `@spherescan/model/schema.json`) and Zod `scanModelSchema` in `@spherescan/model`.
2. **Semantic:** `validateScanModel(model)` in `@spherescan/model` - id uniqueness, connection/boundary/layout/runtime refs, port ids on connections. Returns `{ ok, issues[] }` with `code`, `path`, `message`, `severity`.
3. **CLI:** `scan validate <file.yaml>` parses with Zod, then runs `validateScanModel` (exit 1 on errors).

Unknown keys: Zod currently strips extras on parse. Explicit passthrough / strip policy is Track **A2**.

---

## Fixtures

- [`packages/model/fixtures/order-platform.yaml`](../../packages/model/fixtures/order-platform.yaml) - canonical multi-kind board
- [`packages/model/fixtures/dummy-cafe.yaml`](../../packages/model/fixtures/dummy-cafe.yaml) - second sample

Both must validate against the JSON Schema and parse with `@spherescan/model`.

---

## Related

- Agent backlog: [BACKLOG.md](../BACKLOG.md)

---

Copyright (c) 2026 WABLOO PARTNERS SRL.

The SCAN - System & Component Architecture Notation specification is licensed
under the Creative Commons Attribution 4.0 International License.

To view the license, visit:
https://creativecommons.org/licenses/by/4.0/

Suggested attribution:

> "SCAN - System & Component Architecture Notation", WABLOO PARTNERS SRL,
> licensed under CC BY 4.0. Changes, if any, must be indicated.
