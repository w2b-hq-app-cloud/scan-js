import type { NodeKind } from "@/lib/board-types";

export const commandSuggestions = [
  "Add an inventory service using Spring Boot and PostgreSQL",
  "Connect Order API to Payment Platform using its payment authorization API",
  "Create Kafka events for order creation and payment completion",
  "Add an agent runtime that can generate and review these services",
  "Show only the external integrations",
  "Highlight services without API contracts",
  "Group all commerce services inside a trust boundary",
  "Replace direct database access with an API",
  "Add the missing resilience policies",
];

export const recentPrompts = [
  "Add Search Index consuming OrderCreated events",
  "Introduce a Fraud Provider via gRPC",
  "Split Orders DB into read replicas",
];

export const previewChanges = {
  title: "Sphere will add",
  additions: [
    { kind: "service" as NodeKind, label: "Inventory Service", detail: "Spring Boot" },
    { kind: "database" as NodeKind, label: "Inventory DB", detail: "PostgreSQL" },
    { kind: "service" as NodeKind, label: "REST connection", detail: "from Order API" },
    { kind: "repo" as NodeKind, label: "OpenAPI contract", detail: "openapi.yaml" },
    { kind: "repo" as NodeKind, label: "GitHub repository", detail: "company/inventory-service" },
  ],
};
