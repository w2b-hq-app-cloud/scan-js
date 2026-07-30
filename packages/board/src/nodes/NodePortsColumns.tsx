// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { PointerEvent } from "react";
import { Circle } from "lucide-react";
import type { SphereNode } from "@spherescan/viewer";
import { kindColorVar } from "../board-style";

export function NodePortsColumns({
  node,
  connectSourcePortId,
  onPortPointerDown,
}: {
  node: SphereNode;
  connectSourcePortId?: string;
  onPortPointerDown?: (
    e: PointerEvent,
    portId: string,
    role: "expose" | "consume",
  ) => void;
}) {
  const consumes = node.consumes ?? [];
  const exposes = node.exposes ?? [];
  const isDb = node.kind === "database";

  if (!consumes.length && !exposes.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 px-3 pb-1 text-[10px]">
      <div className="min-w-0">
        {consumes.length > 0 && (
          <>
            <div
              className={`sticky top-0 z-[1] mb-1 pb-0.5 font-semibold uppercase tracking-wider text-muted-foreground ${
                isDb ? "bg-transparent" : "bg-surface/95 backdrop-blur-[2px]"
              }`}
            >
              Consumes
            </div>
            {consumes.map((p) => (
              <button
                key={p.id}
                type="button"
                title={`${p.label}${p.protocol ? ` (${p.protocol})` : ""} - click to select wire or finish connect`}
                className="flex w-full cursor-pointer items-center gap-1.5 rounded py-0.5 text-left outline-none hover:bg-muted focus:outline-none focus-visible:outline-none"
                onPointerDown={(e) => onPortPointerDown?.(e, p.id, "consume")}
              >
                <Circle
                  className="h-2 w-2 shrink-0 fill-none"
                  style={{ color: kindColorVar[node.kind] }}
                />
                <span className="truncate font-medium">{p.label}</span>
                {p.protocol && (
                  <span className="truncate text-muted-foreground">({p.protocol})</span>
                )}
              </button>
            ))}
          </>
        )}
      </div>
      <div className="min-w-0 text-right">
        {exposes.length > 0 && (
          <>
            <div
              className={`sticky top-0 z-[1] mb-1 pb-0.5 font-semibold uppercase tracking-wider text-muted-foreground ${
                isDb ? "bg-transparent" : "bg-surface/95 backdrop-blur-[2px]"
              }`}
            >
              Exposes
            </div>
            {exposes.map((p) => (
              <button
                key={p.id}
                type="button"
                title={`${p.label}${p.protocol ? ` (${p.protocol})` : ""} - click to start a connection`}
                className={`flex w-full cursor-pointer items-center justify-end gap-1.5 rounded py-0.5 outline-none hover:bg-muted focus:outline-none focus-visible:outline-none ${
                  connectSourcePortId === p.id
                    ? "bg-primary/15 ring-1 ring-primary/40"
                    : ""
                }`}
                onPointerDown={(e) => onPortPointerDown?.(e, p.id, "expose")}
              >
                <span className="truncate font-medium">{p.label}</span>
                {p.protocol && (
                  <span className="truncate text-muted-foreground">({p.protocol})</span>
                )}
                <Circle
                  className="h-2 w-2 shrink-0 fill-current"
                  style={{ color: kindColorVar[node.kind] }}
                />
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

