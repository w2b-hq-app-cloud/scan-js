// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { MouseEvent, PointerEvent } from "react";
import { AlertTriangle, Github } from "lucide-react";
import type { SphereNode } from "@spherescan/viewer";
import { kindMeta } from "../kinds";
import { ElementIcon } from "../ElementIcon";
import { openExternal, kindColorVar } from "../board-style";
import { SoftScrollArea } from "./SoftScrollArea";
import { NodePortsColumns } from "./NodePortsColumns";
import { DbCylinder } from "./DbCylinder";
import { SelectionCheck } from "./SelectionCheck";

export function NodeCard({
  node,
  selected,
  connectSource,
  connectSourcePortId,
  dim,
  highlight,
  onPointerDown,
  onContextMenu,
  onPortPointerDown,
  onClick,
  onDoubleClick,
}: {
  node: SphereNode;
  selected: boolean;
  connectSource?: boolean;
  connectSourcePortId?: string;
  connectMode?: boolean;
  dim: boolean;
  highlight: boolean;
  onPointerDown: (e: PointerEvent) => void;
  onContextMenu: (e: MouseEvent) => void;
  onPortPointerDown?: (
    e: PointerEvent,
    portId: string,
    role: "expose" | "consume",
  ) => void;
  onClick: (e: MouseEvent) => void;
  onDoubleClick?: (e: MouseEvent) => void;
}) {
  const meta = kindMeta[node.kind];
  const isDb = node.kind === "database";
  const emphasized = Boolean(connectSource || selected);
  const consumes = node.consumes ?? [];
  const exposes = node.exposes ?? [];
  const hasPorts = consumes.length > 0 || exposes.length > 0;

  return (
    <div
      className={`absolute z-[1] select-none transition-opacity ${dim ? "opacity-30" : ""}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {selected && <SelectionCheck />}
      {isDb && (
        <DbCylinder
          width={node.w}
          height={node.h}
          color={kindColorVar[node.kind]}
          selected={emphasized}
        />
      )}
      <div
        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl ${
          isDb
            ? `bg-transparent ${
                connectSource
                  ? "outline outline-2 outline-offset-2 outline-primary"
                  : highlight
                    ? "outline outline-2 outline-offset-2 outline-[var(--warn)]"
                    : ""
              }`
            : `border-2 bg-surface node-shadow ${
                connectSource
                  ? "ring-4 ring-primary/40 node-shadow-lg outline outline-2 outline-offset-2 outline-primary"
                  : selected
                    ? "ring-4 ring-primary/25 node-shadow-lg"
                    : ""
              } ${highlight && !connectSource ? "ring-2 ring-warn" : ""}`
        }`}
        style={
          isDb
            ? undefined
            : {
                borderColor: emphasized
                  ? kindColorVar[node.kind]
                  : `color-mix(in oklab, ${kindColorVar[node.kind]} 45%, transparent)`,
              }
        }
      >
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pt-3">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${meta.soft}`}
            >
              <ElementIcon
                icon={node.icon}
                Fallback={meta.Icon}
                className={`h-4 w-4 ${meta.color}`}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{node.title}</div>
              {node.subtitle && (
                <div className="truncate text-[11px] text-muted-foreground">{node.subtitle}</div>
              )}
            </div>
          </div>
          <button
            type="button"
            title={node.repoUrl ? `Open ${node.repo}` : node.repo ? node.repo : "No repository"}
            className={`shrink-0 rounded p-0.5 outline-none focus:outline-none ${
              node.repoUrl
                ? "cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-muted"
                : "pointer-events-none opacity-0"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (node.repoUrl) openExternal(node.repoUrl);
            }}
          >
            <Github className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {hasPorts ? (
          <SoftScrollArea
            className="mt-2 flex-1"
            onWheel={(e) => e.stopPropagation()}
          >
            <NodePortsColumns
              node={node}
              connectSourcePortId={connectSourcePortId}
              onPortPointerDown={onPortPointerDown}
            />
          </SoftScrollArea>
        ) : (
          <div className="min-h-0 flex-1" />
        )}

        {node.tech && (
          <div className="mt-auto flex shrink-0 items-center justify-between px-3 pb-2.5 pt-1.5">
            {node.status === "warn" ? (
              <span className="flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn">
                <AlertTriangle className="h-2.5 w-2.5" /> Missing contract
              </span>
            ) : (
              <span />
            )}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `color-mix(in oklab, ${kindColorVar[node.kind]} 10%, transparent)`,
                color: kindColorVar[node.kind],
              }}
            >
              {node.tech}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

