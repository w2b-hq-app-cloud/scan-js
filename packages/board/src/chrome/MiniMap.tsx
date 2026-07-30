// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useMemo, useRef, type MouseEvent, type PointerEvent } from "react";
import type { SphereNode, SphereEdge, SphereGroup } from "@spherescan/viewer";
import type { Point } from "../board-types";
import { kindColorVar } from "../board-style";

export function MiniMap({
  nodes,
  groups,
  edges,
  pan,
  zoom,
  canvasSize,
  systemName,
  onNavigate,
  onPanDelta,
}: {
  nodes: SphereNode[];
  groups: SphereGroup[];
  edges: SphereEdge[];
  pan: Point;
  zoom: number;
  canvasSize: { w: number; h: number };
  systemName: string;
  onNavigate: (worldX: number, worldY: number) => void;
  onPanDelta: (dxWorld: number, dyWorld: number) => void;
}) {
  const mapW = 220;
  const mapH = 130;
  const pad = 24;
  const mapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ lastX: number; lastY: number } | null>(null);

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const include = (x: number, y: number, w: number, h: number) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    };
    for (const n of nodes) include(n.x, n.y, n.w, n.h);
    for (const g of groups) include(g.x, g.y, g.w, g.h);
    if (!Number.isFinite(minX)) {
      return { minX: 0, minY: 0, width: 1000, height: 600 };
    }
    return {
      minX: minX - pad,
      minY: minY - pad,
      width: Math.max(1, maxX - minX + pad * 2),
      height: Math.max(1, maxY - minY + pad * 2),
    };
  }, [nodes, groups]);

  const scale = Math.min(mapW / bounds.width, mapH / bounds.height);
  const offsetX = (mapW - bounds.width * scale) / 2;
  const offsetY = (mapH - bounds.height * scale) / 2;

  const toMap = (x: number, y: number) => ({
    x: (x - bounds.minX) * scale + offsetX,
    y: (y - bounds.minY) * scale + offsetY,
  });

  const toWorld = (mx: number, my: number) => ({
    x: (mx - offsetX) / scale + bounds.minX,
    y: (my - offsetY) / scale + bounds.minY,
  });

  const viewWorld = {
    x: -pan.x / zoom,
    y: -pan.y / zoom,
    w: canvasSize.w / zoom,
    h: canvasSize.h / zoom,
  };
  const viewMap = toMap(viewWorld.x, viewWorld.y);
  const viewMapW = viewWorld.w * scale;
  const viewMapH = viewWorld.h * scale;

  const localPoint = (e: PointerEvent | MouseEvent) => {
    const rect = mapRef.current?.getBoundingClientRect();
    return {
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
    };
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const p = localPoint(e);
    const insideViewport =
      p.x >= viewMap.x &&
      p.x <= viewMap.x + viewMapW &&
      p.y >= viewMap.y &&
      p.y <= viewMap.y + viewMapH;
    if (!insideViewport) {
      const w = toWorld(p.x, p.y);
      onNavigate(w.x, w.y);
    }
    drag.current = { lastX: p.x, lastY: p.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current) return;
    const p = localPoint(e);
    const dxMap = p.x - drag.current.lastX;
    const dyMap = p.y - drag.current.lastY;
    if (dxMap === 0 && dyMap === 0) return;
    onPanDelta(dxMap / scale, dyMap / scale);
    drag.current = { lastX: p.x, lastY: p.y };
  };

  const onPointerUp = (e: PointerEvent) => {
    drag.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const nodeById = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const label =
    systemName.length > 22 ? `${systemName.slice(0, 20)}...` : systemName;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface node-shadow">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Minimap
        <span
          className="max-w-[140px] truncate rounded bg-muted px-1.5 py-0.5 text-[9px] normal-case font-medium text-foreground"
          title={systemName}
        >
          {label}
        </span>
      </div>
      <div
        ref={mapRef}
        className="relative cursor-crosshair bg-canvas select-none"
        style={{ width: mapW, height: mapH }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {groups.map((g) => {
          const p = toMap(g.x, g.y);
          return (
            <div
              key={g.id}
              className="pointer-events-none absolute rounded-sm border border-dashed border-border/80 bg-muted/30"
              style={{
                left: p.x,
                top: p.y,
                width: Math.max(2, g.w * scale),
                height: Math.max(2, g.h * scale),
              }}
            />
          );
        })}
        <svg
          className="pointer-events-none absolute inset-0"
          width={mapW}
          height={mapH}
        >
          {edges.map((e) => {
            const from = nodeById[e.from];
            const to = nodeById[e.to];
            if (!from || !to) return null;
            const a = toMap(from.x + from.w / 2, from.y + from.h / 2);
            const b = toMap(to.x + to.w / 2, to.y + to.h / 2);
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="color-mix(in oklab, var(--border) 80%, transparent)"
                strokeWidth={1}
              />
            );
          })}
        </svg>
        {nodes.map((n) => {
          const p = toMap(n.x, n.y);
          return (
            <div
              key={n.id}
              className="pointer-events-none absolute rounded-[1px]"
              style={{
                left: p.x,
                top: p.y,
                width: Math.max(2, n.w * scale),
                height: Math.max(2, n.h * scale),
                background: `color-mix(in oklab, ${kindColorVar[n.kind]} 45%, white)`,
                border: `1px solid ${kindColorVar[n.kind]}`,
              }}
            />
          );
        })}
        <div
          className="pointer-events-none absolute rounded border-2 border-primary/70 bg-primary/10"
          style={{
            left: viewMap.x,
            top: viewMap.y,
            width: Math.max(8, viewMapW),
            height: Math.max(8, viewMapH),
          }}
        />
      </div>
    </div>
  );
}

