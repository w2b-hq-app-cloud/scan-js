// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  Anchor,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  FileCode2,
  Plus,
  Trash2,
} from "lucide-react";
import type { SphereNode, SphereEdge } from "@spherescan/viewer";
import { kindMeta } from "../kinds";
import { ElementIcon } from "../ElementIcon";
import { IconPickerModal } from "../IconPickerModal";
import { openExternal, edgeKindTitle } from "../board-style";
import { EdgeIcon } from "../icons/EdgeIcon";
import { Section } from "./Section";
import { PortRow } from "./PortRow";

function MetaPlus({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );
}

/** Section with + until a value exists; then a compact directly editable field. */
function OptionalMetaSection({
  title,
  value,
  placeholder,
  multiline,
  onCommit,
  onOpen,
  resetKey,
}: {
  title: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  onCommit: (next: string | null) => void;
  /** When set, show an open icon on the field row (same row as the input). */
  onOpen?: () => void;
  /** Reset drafting when selection changes (e.g. node id). */
  resetKey: string;
}) {
  const hasValue = Boolean(value.trim());
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const open = drafting || hasValue;

  useEffect(() => {
    setDrafting(false);
    setDraft(value);
  }, [resetKey]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (drafting) inputRef.current?.focus();
  }, [drafting]);

  const commit = () => {
    const next = draft.trim();
    if (next === (value.trim() || "")) {
      if (!next) setDrafting(false);
      return;
    }
    onCommit(next || null);
    if (!next) setDrafting(false);
  };

  const clear = () => {
    setDraft("");
    setDrafting(false);
    if (hasValue) onCommit(null);
  };

  const fieldClass =
    "min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50";

  return (
    <Section
      title={title}
      action={
        !open ? <MetaPlus label={`Add ${title.toLowerCase()}`} onClick={() => setDrafting(true)} /> : undefined
      }
    >
      {open ? (
        <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
          {multiline ? (
            <textarea
              ref={(el) => {
                inputRef.current = el;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              rows={2}
              placeholder={placeholder}
              className={`${fieldClass} resize-none`}
              aria-label={placeholder}
            />
          ) : (
            <input
              ref={(el) => {
                inputRef.current = el;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setDraft(value);
                  setDrafting(false);
                }
              }}
              placeholder={placeholder}
              className={fieldClass}
              aria-label={placeholder}
            />
          )}
          {onOpen && hasValue ? (
            <button
              type="button"
              title="Open"
              onClick={onOpen}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            title="Remove"
            onClick={clear}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ) : null}
    </Section>
  );
}

function LinksSection({
  links,
  resetKey,
  onAdd,
  onRemove,
}: {
  links: NonNullable<SphereNode["links"]>;
  resetKey: string;
  onAdd: (link: { kind: "doc" | "repo" | "openapi" | "other"; href: string; title?: string }) => void;
  onRemove: (index: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [href, setHref] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAdding(false);
    setHref("");
  }, [resetKey]);

  useEffect(() => {
    if (adding) {
      setHref("");
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [adding]);

  const commitAdd = () => {
    const next = href.trim();
    if (!next) {
      setAdding(false);
      setHref("");
      return;
    }
    const kind =
      /\.ya?ml$/i.test(next) || /openapi/i.test(next)
        ? "openapi"
        : /^https?:\/\/(www\.)?github\.com\//i.test(next)
          ? "repo"
          : "doc";
    onAdd({ kind, href: next });
    setHref("");
    setAdding(false);
  };

  return (
    <Section
      title="Links"
      action={!adding ? <MetaPlus label="Add link" onClick={() => setAdding(true)} /> : undefined}
    >
      <div className="space-y-1.5">
        {links.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {links.map((link, index) => (
              <div
                key={`${link.href}-${index}`}
                className="flex items-center gap-0.5 rounded-md border border-border bg-background px-1 py-0.5"
              >
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  title={link.title ? `${link.title}\n${link.href}` : link.href}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Anchor className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  title="Remove link"
                  onClick={() => onRemove(index)}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {adding ? (
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
            <Anchor className="h-3 w-3 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitAdd();
                }
                if (e.key === "Escape") {
                  setHref("");
                  setAdding(false);
                }
              }}
              placeholder="https://…"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
              aria-label="Link URL"
            />
          </div>
        ) : null}
      </div>
    </Section>
  );
}

export function NodeInspector({
  node,
  edges,
  nodeById,
  onSelectEdge,
  onUpdateIcon,
  onUpdateDescription,
  onAddPort,
  onUpdatePort,
  onDeletePort,
  onUpdateMeta,
  onSetRepository,
  onAddLink,
  onRemoveLink,
}: {
  node: SphereNode;
  edges: SphereEdge[];
  nodeById: Record<string, SphereNode>;
  onSelectEdge: (id: string) => void;
  onUpdateIcon: (id: string, icon: string | null) => void;
  onUpdateDescription: (id: string, description: string | null) => void;
  onAddPort: (id: string, role: "consume" | "expose") => void;
  onUpdatePort: (
    id: string,
    portId: string,
    patch: { label?: string | null; protocol?: string | null },
  ) => void;
  onDeletePort: (id: string, portId: string) => void;
  onUpdateMeta: (id: string, patch: { description?: string | null; notes?: string | null }) => void;
  onSetRepository: (id: string, repository: string | null) => void;
  onAddLink: (id: string, link: { kind: "doc" | "repo" | "openapi" | "other"; href: string; title?: string }) => void;
  onRemoveLink: (id: string, index: number) => void;
}) {
  const meta = kindMeta[node.kind];
  const [iconOpen, setIconOpen] = useState(false);
  const [description, setDescription] = useState(node.description ?? "");
  const related = edges.filter((e) => e.from === node.id || e.to === node.id);
  const protocols = Array.from(
    new Set(
      [...(node.consumes ?? []), ...(node.exposes ?? [])]
        .map((p) => p.protocol)
        .filter((p): p is string => Boolean(p)),
    ),
  );

  useEffect(() => {
    setDescription(node.description ?? "");
  }, [node.id, node.description]);

  const commitDescription = () => {
    const next = description.trim();
    const prev = (node.description ?? "").trim();
    if (next === prev) return;
    onUpdateDescription(node.id, next || null);
  };

  return (
    <div>
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            title="Change icon"
            onClick={() => setIconOpen(true)}
            className={`grid h-10 w-10 place-items-center rounded-lg ring-offset-2 transition hover:ring-2 hover:ring-primary/30 ${meta.soft}`}
          >
            <ElementIcon
              icon={node.icon}
              Fallback={meta.Icon}
              className={`h-5 w-5 ${meta.color}`}
            />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">{node.title}</div>
            <div className="text-xs text-muted-foreground">
              {meta.label}
              {node.subtitle ? ` · ${node.subtitle}` : ""}
            </div>
            <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
              {node.id}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">Click icon to change</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {node.status === "warn" && (
            <span className="flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn">
              <AlertTriangle className="h-2.5 w-2.5" /> Validation warning
            </span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{meta.label}</span>
          {node.tech && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{node.tech}</span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
            {related.length} connection{related.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <Section title="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={commitDescription}
          rows={4}
          placeholder="What this component does, ownership, constraints…"
          className="w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 text-[12px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
          aria-label="Component description"
        />
      </Section>

      {node.warn && (
        <div className="mx-4 mt-4 rounded-lg border border-warn/40 bg-warn-soft p-3 text-[11px] text-warn">
          <div className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5" /> Validation
          </div>
          {node.warn}
        </div>
      )}

      <OptionalMetaSection
        title="Notes"
        value={node.notes ?? ""}
        placeholder="Authoring notes"
        multiline
        resetKey={node.id}
        onCommit={(next) => onUpdateMeta(node.id, { notes: next })}
      />

      <Section title="API Surface">
        <div className="mb-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => onAddPort(node.id, "consume")}
            className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
          >
            + Consume
          </button>
          <button
            type="button"
            onClick={() => onAddPort(node.id, "expose")}
            className="rounded-md border border-border px-2 py-1 text-[10px] font-medium hover:bg-muted"
          >
            + Expose
          </button>
        </div>
        {node.consumes?.length ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Consumes
            </div>
            {node.consumes.map((p) => (
              <PortRow
                key={p.id}
                label={p.label}
                protocol={p.protocol}
                kind={node.kind}
                onChange={(patch) => onUpdatePort(node.id, p.id, patch)}
                onDelete={() => onDeletePort(node.id, p.id)}
              />
            ))}
          </div>
        ) : null}
        {node.exposes?.length ? (
          <div className={`space-y-1.5 ${node.consumes?.length ? "mt-3" : ""}`}>
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ArrowRight className="h-3 w-3" /> Exposes
            </div>
            {node.exposes.map((p) => (
              <PortRow
                key={p.id}
                label={p.label}
                protocol={p.protocol}
                kind={node.kind}
                onChange={(patch) => onUpdatePort(node.id, p.id, patch)}
                onDelete={() => onDeletePort(node.id, p.id)}
              />
            ))}
          </div>
        ) : null}
        {!node.consumes?.length && !node.exposes?.length && (
          <div className="text-[11px] text-muted-foreground">
            No ports yet. Add Consume / Expose above, then wire on the canvas: Expose {"->"} Consume.
          </div>
        )}
      </Section>

      <Section title="Connections">
        {related.length ? (
          <div className="space-y-1.5">
            {related.map((e) => {
              const otherId = e.from === node.id ? e.to : e.from;
              const other = nodeById[otherId];
              const outbound = e.from === node.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onSelectEdge(e.id)}
                  className="flex w-full items-start gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-left hover:bg-muted"
                >
                  <EdgeIcon kind={e.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium">
                      {outbound ? "->" : "<-"} {other?.title ?? otherId}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {e.label ?? edgeKindTitle(e.kind)}
                      {e.contract ? ` · ${e.contract}` : ""}
                      {e.fromPort || e.toPort
                        ? ` · ${e.fromPort ?? "*"} -> ${e.toPort ?? "*"}`
                        : ""}
                      {e.operations?.length ? ` · ${e.operations.length} ops` : ""}
                    </div>
                  </div>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            Not connected yet. Click an Exposes port on the card, then a Consumes port on another
            node (or use the Connect tool).
          </div>
        )}
      </Section>

      <OptionalMetaSection
        title="Repository"
        value={node.repo ?? ""}
        placeholder="github-org/repository or URL"
        resetKey={node.id}
        onCommit={(next) => onSetRepository(node.id, next)}
        onOpen={node.repoUrl ? () => openExternal(node.repoUrl!) : undefined}
      />

      <LinksSection
        links={node.links ?? []}
        resetKey={node.id}
        onAdd={(link) => onAddLink(node.id, link)}
        onRemove={(index) => onRemoveLink(node.id, index)}
      />

      <Section title="Contracts">
        {protocols.length ? (
          <div className="space-y-1.5">
            {protocols.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"
              >
                <FileCode2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="flex-1 truncate">{c}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px]">from ports</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground">
            No protocol metadata on ports yet.
          </div>
        )}
      </Section>

      <IconPickerModal
        open={iconOpen}
        onClose={() => setIconOpen(false)}
        title="Component icon"
        currentIcon={node.icon}
        fallbackIcon={meta.Icon}
        softClass={meta.soft}
        colorClass={meta.color}
        onSave={(icon) => onUpdateIcon(node.id, icon)}
      />
    </div>
  );
}
