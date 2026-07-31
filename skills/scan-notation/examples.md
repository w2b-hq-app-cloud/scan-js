# SCAN diagram examples

## Example A - service + DB + external REST

```yaml
scan: "0.1"

system:
  id: billing
  name: Billing
  purpose: Charge customers
  owner: Payments

external_systems:
  - id: stripe
    name: Stripe
    type: external-system
    repository: stripe/openapi
    exposes:
      - id: stripe-rest
        label: REST
        protocol: OpenAPI

components:
  - id: billing-api
    name: Billing API
    type: service
    technology: Spring Boot
    repository:
      provider: github
      path: company/billing-api
    consumes:
      - id: billing-api-in
        label: REST
        protocol: OpenAPI
    exposes:
      - id: billing-api-out
        label: REST
        protocol: OpenAPI

  - id: billing-db
    name: Billing DB
    type: datastore
    technology: PostgreSQL

connections:
  - id: e1
    from: stripe
    to: billing-api
    type: synchronous-request
    fromPort: stripe-rest
    toPort: billing-api-in
    label: REST
    contract: OpenAPI
    fromSide: r
    toSide: l
    operations:
      - POST /v1/charges
      - GET /v1/charges/{id}

  - id: e2
    from: billing-api
    to: billing-db
    type: database-access
    label: DB Access
    contract: JDBC
    fromSide: b
    toSide: t
    operations:
      - INSERT charges
      - SELECT charges BY id

views:
  - id: architecture-board
    type: service-architecture
    boundaries:
      - id: g-billing
        label: Billing
        tag: Trust Boundary
        kind: trust
        members: [billing-api, billing-db]
        x: 80
        y: 40
        w: 520
        h: 480
    layout:
      stripe: { x: 40, y: 160, w: 220, h: 150 }
      billing-api: { x: 160, y: 120, w: 260, h: 190 }
      billing-db: { x: 180, y: 360, w: 220, h: 160 }
```

## Example B - publish / consume events

```yaml
scan: "0.1"

system:
  id: orders
  name: Orders

components:
  - id: order-api
    name: Order API
    type: service
    technology: Spring Boot
    exposes:
      - id: order-api-out
        label: REST
        protocol: OpenAPI

  - id: search-index
    name: Search Index
    type: search
    technology: Elasticsearch
    consumes:
      - id: search-in
        label: OrderCreated
        protocol: v1

channels:
  - id: order-created
    name: Order Created
    type: event-stream
    technology: Kafka
    consumes:
      - id: oc-in
        label: Event
        protocol: v1
    exposes:
      - id: oc-out
        label: Event
        protocol: v1

connections:
  - id: e-pub
    from: order-api
    to: order-created
    type: event-publication
    label: Publish
    contract: AsyncAPI
    fromSide: b
    toSide: t
    operations: [OrderCreated]

  - id: e-sub
    from: order-created
    to: search-index
    type: stream-consume
    label: Stream
    contract: AsyncAPI
    fromSide: r
    toSide: l
    operations: [consume OrderCreated]

views:
  - id: architecture-board
    layout:
      order-api: { x: 100, y: 80, w: 260, h: 190 }
      order-created: { x: 100, y: 320, w: 260, h: 190 }
      search-index: { x: 420, y: 320, w: 260, h: 190 }
```

## Example C - agents + git

```yaml
scan: "0.1"

system:
  id: eng-agents
  name: Engineering Agents

agents:
  - id: coding-agent
    name: Coding Agent
    purpose: Build & Implement
    exposes:
      - id: coding-out
        label: Output
  - id: review-agent
    name: Review Agent
    purpose: Review changes
    consumes:
      - id: review-in
        label: Input
    exposes:
      - id: review-out
        label: Output

repositories:
  - id: github
    name: GitHub Repository
    provider: github
    path: company/app
    subtitle: company/app
    consumes:
      - id: gh-in
        label: Code
        protocol: PR

connections:
  - id: e-del
    from: coding-agent
    to: review-agent
    type: agent-delegation
    fromSide: r
    toSide: l
  - id: e-git
    from: review-agent
    to: github
    type: git-integration
    label: Git Integration
    fromSide: r
    toSide: l

views:
  - id: architecture-board
    boundaries:
      - id: g-runtime
        label: Agent Runtime
        kind: runtime
        members: [coding-agent, review-agent]
        x: 40
        y: 40
        w: 640
        h: 280
    layout:
      coding-agent: { x: 80, y: 80, w: 260, h: 190 }
      review-agent: { x: 380, y: 80, w: 260, h: 190 }
      github: { x: 700, y: 80, w: 260, h: 180 }
```

## Example D - parallel edges (numbered labels)

When two connections share the same `from` → `to`, number every label:

```yaml
scan: "0.1"

system:
  id: efactura-spv
  name: eFactura SPV download

components:
  - id: importer
    name: Import Job
    type: service
    technology: NestJS

external_systems:
  - id: anaf-api
    name: ANAF FCTEL
    type: external-system

connections:
  - id: e-list
    from: importer
    to: anaf-api
    type: synchronous-request
    label: 1. List messages
    contract: OpenAPI
    fromSide: r
    toSide: l
    operations:
      - GET /listaMesajePaginatieFactura
  - id: e-download
    from: importer
    to: anaf-api
    type: synchronous-request
    label: 2. Download ZIP
    contract: OpenAPI
    fromSide: r
    toSide: l
    operations:
      - GET /descarcare?id=

views:
  - id: architecture-board
    layout:
      importer: { x: 80, y: 120, w: 260, h: 190 }
      anaf-api: { x: 420, y: 120, w: 220, h: 150 }
```

## Anti-patterns

- Putting Kafka topics under `components` with `type: service` - use `channels`.
- `type: database-access` between two services - use `synchronous-request` or `grpc-request`.
- Layout missing an element id that appears in `connections` - node won't render.
- Reusing port ids across different elements is OK; reusing **element** ids is not.
- Inventing connection types like `http` or `kafka` - use the enum above.
- Multiple edges between the same `from`/`to` **without** numbered labels (`1.`, `2.`, …) - parallel arrows become ambiguous on the board.
