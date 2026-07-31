// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useEffect, useState } from "react";
import { Cpu, Shield } from "lucide-react";
import type { SphereNode, SphereGroup, BoundaryColor } from "@spherescan/viewer";
import { BOUNDARY_COLORS, boundaryColorMeta } from "@spherescan/viewer";
import { kindMeta } from "../kinds";
import { ElementIcon } from "../ElementIcon";
import { IconPickerModal } from "../IconPickerModal";
import { Section } from "./Section";

export function BoundaryInspector({
  group,
  nodes,
  onUpdate,
  onDelete,
  onRename,
  onSelectNode,
}: {
  group: SphereGroup;
  nodes: SphereNode[];
  onUpdate: (
    id: string,
    patch: {
      label?: string | null;
      tag?: string | null;
      kind?: "trust" | "runtime";
      icon?: string | null;
      color?: BoundaryColor | null;
    },
  ) => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
  onSelectNode: (id: string) => void;
}) {
  const [label, setLabel] = useState(group.title);
  const [tag, setTag] = useState(group.tag ?? "");
  const [kind, setKind] = useState<"trust" | "runtime">(group.kind ?? "trust");
  const [iconOpen, setIconOpen] = useState(false);

  useEffect(() => {
    setLabel(group.title);
    setTag(group.tag ?? "");
    setKind(group.kind ?? "trust");
  }, [group.id, group.title, group.tag, group.kind]);

  const members = (group.members ?? [])
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is SphereNode => Boolean(n));

  const dirty =
    label.trim() !== group.title ||
    (tag.trim() || undefined) !== (group.tag || undefined) ||
    kind !== (group.kind ?? "trust");

  const Fallback = kind === "runtime" ? Cpu : Shield;
  const softClass = kind === "runtime" ? "bg-muted" : "bg-svc-soft";
  const colorClass = kind === "runtime" ? "text-muted-foreground" : "text-svc";

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            title="Change icon"
            onClick={() => setIconOpen(true)}
            className={`grid h-10 w-10 place-items-center rounded-lg ring-offset-2 transition hover:ring-2 hover:ring-primary/30 ${softClass}`}
          >
            <ElementIcon
              icon={group.icon}
              Fallback={Fallback}
              className={`h-5 w-5 ${colorClass}`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{group.title}</div>
            <div className="text-[11px] text-muted-foreground">
              {kind === "runtime" ? "Runtime boundary" : "Trust boundary"}
              <span className="text-muted-foreground/80"> · click icon to change</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRename(group.id)}
            className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            F2
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <Section title="Name">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            placeholder="Boundary name"
          />
        </Section>

        <Section title="Kind">
          <div className="flex gap-2">
            {(["trust", "runtime"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium capitalize ${
                  kind === k
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Color">
          <div className="flex flex-wrap gap-2">
            {BOUNDARY_COLORS.map((token) => {
              const meta = boundaryColorMeta[token];
              const selected = group.color === token;
              return (
                <button
                  key={token}
                  type="button"
                  title={meta.label}
                  aria-label={meta.label}
                  aria-pressed={selected}
                  onClick={() => onUpdate(group.id, { color: token })}
                  className={`h-7 w-7 rounded-full transition ${
                    selected
                      ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: meta.hex }}
                />
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {boundaryColorMeta[group.color].label}
          </p>
        </Section>

        <Section title="Tag">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
            placeholder="e.g. Trust Boundary"
          />
        </Section>

        <Section title={`Members (${members.length})`}>
          {members.length ? (
            <div className="space-y-1">
              {members.map((n) => {
                const meta = kindMeta[n.kind];
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onSelectNode(n.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                  >
                    <ElementIcon
                      icon={n.icon}
                      Fallback={meta.Icon}
                      className={`h-3.5 w-3.5 ${meta.color}`}
                    />
                    <span className="truncate">{n.title}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              No members yet. Resize so component centers fall inside the box.
            </p>
          )}
        </Section>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!dirty || !label.trim()}
            onClick={() =>
              onUpdate(group.id, {
                label: label.trim(),
                tag: tag.trim() || null,
                kind,
              })
            }
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            Save changes
          </button>
          <button
            type="button"
            onClick={() => onDelete(group.id)}
            className="rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            Delete
          </button>
        </div>
      </div>

      <IconPickerModal
        open={iconOpen}
        onClose={() => setIconOpen(false)}
        title="Boundary icon"
        currentIcon={group.icon}
        fallbackIcon={Fallback}
        softClass={softClass}
        colorClass={colorClass}
        onSave={(icon) => onUpdate(group.id, { icon })}
      />
    </div>
  );
}

