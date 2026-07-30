// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useEffect, useState } from "react";
import { ArrowRight, FileCode2, Link2 } from "lucide-react";
import type { SphereNode, SphereEdge } from "@spherescan/viewer";
import { edgeKindTitle } from "../board-style";
import { EdgeIcon } from "../icons/EdgeIcon";
import { Section } from "./Section";

export function EdgeInspector({
  edge,
  nodeById,
  onUpdate,
}: {
  edge: SphereEdge;
  nodeById: Record<string, SphereNode>;
  onUpdate: (
    id: string,
    patch: {
      label?: string | null;
      contract?: string | null;
      operations?: string[] | null;
    },
  ) => void;
}) {
  const [label, setLabel] = useState(edge.label ?? "");
  const [contract, setContract] = useState(edge.contract ?? "");
  const [operationsText, setOperationsText] = useState(
    (edge.operations ?? []).join("\n"),
  );

  useEffect(() => {
    setLabel(edge.label ?? "");
    setContract(edge.contract ?? "");
    setOperationsText((edge.operations ?? []).join("\n"));
  }, [edge.id, edge.label, edge.contract, edge.operations]);

  const opsList = operationsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const beforeOps = (edge.operations ?? []).join("\n");
  const dirty =
    (label.trim() || "") !== (edge.label ?? "") ||
    (contract.trim() || "") !== (edge.contract ?? "") ||
    opsList.join("\n") !== beforeOps;

  const save = () => {
    if (!dirty) return;
    onUpdate(edge.id, {
      label: label.trim() || null,
      contract: contract.trim() || null,
      operations: opsList.length ? opsList : null,
    });
  };

  const fromNode = nodeById[edge.from];
  const toNode = nodeById[edge.to];

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <EdgeIcon kind={edge.kind} />
          <div className="text-base font-semibold">{edgeKindTitle(edge.kind)} connection</div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate font-medium text-foreground">
            {fromNode?.title ?? edge.from}
          </span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate font-medium text-foreground">
            {toNode?.title ?? edge.to}
          </span>
        </div>
        {(edge.fromPort || edge.toPort) && (
          <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3 shrink-0" />
            {edge.fromPort ?? " - "} {"->"} {edge.toPort ?? " - "}
          </div>
        )}
      </div>
      <Section title="Label">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          placeholder="e.g. REST, Publish, Git Integration"
          className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Section>
      <Section title="Contract">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <FileCode2 className="h-3.5 w-3.5 shrink-0" />
            <span>Protocol or contract reference stored on the connection</span>
          </div>
          <input
            value={contract}
            onChange={(e) => setContract(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            placeholder="e.g. OpenAPI, AsyncAPI, openapi.yaml"
            className="w-full rounded-md border border-border bg-background px-2.5 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Section>
      <Section title="Endpoints / operations">
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            One per line - shown when hovering the connection on the canvas.
          </p>
          <textarea
            value={operationsText}
            onChange={(e) => setOperationsText(e.target.value)}
            rows={5}
            placeholder={"POST /orders\nGET /orders/{id}"}
            className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-[11px] outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            disabled={!dirty}
            onClick={save}
            className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save connection
          </button>
        </div>
      </Section>
      <Section title="Resilience">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {[
            ["Timeout", "2s"],
            ["Retries", "3"],
            ["Circuit breaker", "on"],
            ["Rate limit", "100/s"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-md border border-border bg-background px-2 py-1.5">
              <div className="text-[9px] uppercase text-muted-foreground">{k}</div>
              <div className="font-medium">{v}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Resilience fields are Sphere placeholders - not part of SCAN model yet.
        </p>
      </Section>
    </div>
  );
}

