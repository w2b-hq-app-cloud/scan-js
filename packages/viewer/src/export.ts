import type { BoardGraph, Port, SphereEdge, SphereNode } from "./board-types.js";
import {
  edgeVisual,
  kindVisuals,
  renderLucideIcon,
  warnVisual,
} from "./kind-icons.js";
import {
  computeLabelStagger,
  edgePath,
  placeEdgeLabel,
  resolveEdgeAnchors,
} from "./edge-geometry.js";
import { boundaryExportFill, boundaryExportStroke } from "./boundary-colors.js";

function edgeFanIndex(
  edges: BoardGraph["edges"],
  edgeId: string,
): { index: number; count: number } {
  const target = edges.find((e) => e.id === edgeId);
  if (!target) return { index: 0, count: 1 };
  const peers = edges.filter((e) => e.from === target.from && e.to === target.to);
  return {
    index: Math.max(0, peers.findIndex((e) => e.id === edgeId)),
    count: peers.length || 1,
  };
}

export function diagramBounds(graph: BoardGraph, pad = 40) {
  const boxes = [
    ...graph.groups.map((g) => ({ x: g.x, y: g.y, w: g.w, h: g.h })),
    ...graph.nodes.map((n) => ({ x: n.x, y: n.y, w: n.w, h: n.h })),
  ];
  if (!boxes.length) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...boxes.map((b) => b.y + b.h));
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

type Point = { x: number; y: number };

function edgeStroke(kind: SphereEdge["kind"]): { stroke: string; dash: string } {
  switch (kind) {
    case "db":
    case "flow":
      return { stroke: "#22c55e", dash: kind === "flow" ? "5 4" : "6 4" };
    case "async":
    case "stream":
      return { stroke: "#c026d3", dash: "6 4" };
    case "git":
      return { stroke: "#94a3b8", dash: "5 4" };
    default:
      return { stroke: "#475569", dash: "" };
  }
}

function estimateTextWidth(text: string, fontSize: number) {
  return Math.ceil(text.length * fontSize * 0.55);
}

function renderPortRow(
  ports: Port[],
  x: number,
  y: number,
  width: number,
  color: string,
  side: "in" | "out",
): string {
  return ports
    .map((p, i) => {
      const py = y + i * 14;
      const label = p.protocol ? `${p.label} (${p.protocol})` : p.label;
      if (side === "in") {
        return (
          `<circle cx="${x + 4}" cy="${py}" r="3" fill="none" stroke="${color}" stroke-width="1.5"/>` +
          `<text x="${x + 12}" y="${py + 3}" font-family="system-ui,sans-serif" font-size="10" fill="#0f172a">${escapeXml(label)}</text>`
        );
      }
      return (
        `<text x="${x + width - 12}" y="${py + 3}" text-anchor="end" font-family="system-ui,sans-serif" font-size="10" fill="#0f172a">${escapeXml(label)}</text>` +
        `<circle cx="${x + width - 4}" cy="${py}" r="3" fill="${color}" stroke="${color}" stroke-width="1"/>`
      );
    })
    .join("");
}

function renderDbCylinder(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
): string {
  const rx = Math.max(8, width / 2 - 10);
  const ry = Math.min(14, height * 0.12);
  const cx = x + width / 2;
  const topY = y + ry + 2;
  const bottomY = y + height - ry - 2;
  const stroke = color;
  const platter = "#bae6fd"; // light mix of data color for portable SVG
  const body =
    `<path d="M ${cx - rx} ${topY} L ${cx - rx} ${bottomY} A ${rx} ${ry} 0 0 0 ${cx + rx} ${bottomY} L ${cx + rx} ${topY} A ${rx} ${ry} 0 0 1 ${cx - rx} ${topY}" fill="white" stroke="${stroke}" stroke-width="1.5"/>` +
    [0.28, 0.52, 0.76]
      .map((t) => {
        const py = topY + (bottomY - topY) * t;
        return `<path d="M ${cx - rx} ${py} A ${rx} ${ry} 0 0 0 ${cx + rx} ${py}" stroke="${platter}" stroke-width="1" fill="none"/>`;
      })
      .join("") +
    `<ellipse cx="${cx}" cy="${bottomY}" rx="${rx}" ry="${ry}" fill="white" stroke="${stroke}" stroke-width="1.5"/>` +
    `<ellipse cx="${cx}" cy="${topY}" rx="${rx}" ry="${ry}" fill="white" stroke="${stroke}" stroke-width="1.5"/>`;
  return body;
}

function renderNode(n: SphereNode): string {
  const visual = kindVisuals[n.kind] ?? kindVisuals.service;
  const isDb = n.kind === "database";
  const stroke = visual.color;
  const border = stroke;

  const padX = 12;
  const padY = 12;
  const chip = 28;
  const iconSize = 16;
  const chipX = n.x + padX;
  const chipY = n.y + padY;
  const iconX = chipX + (chip - iconSize) / 2;
  const iconY = chipY + (chip - iconSize) / 2;
  const textX = chipX + chip + 8;
  const titleY = n.y + padY + 14;
  const subtitleY = titleY + 16;

  let portsSvg = "";
  const hasPorts = Boolean(n.consumes?.length || n.exposes?.length);
  if (hasPorts) {
    const portsTop = n.y + padY + chip + 10;
    const colW = (n.w - padX * 2) / 2;
    const leftX = n.x + padX;
    const rightX = n.x + padX + colW;
    if (n.consumes?.length) {
      portsSvg +=
        `<text x="${leftX}" y="${portsTop}" font-family="system-ui,sans-serif" font-size="9" font-weight="600" letter-spacing="0.06em" fill="#64748b">CONSUMES</text>` +
        renderPortRow(n.consumes, leftX, portsTop + 14, colW, stroke, "in");
    }
    if (n.exposes?.length) {
      portsSvg +=
        `<text x="${n.x + n.w - padX}" y="${portsTop}" text-anchor="end" font-family="system-ui,sans-serif" font-size="9" font-weight="600" letter-spacing="0.06em" fill="#64748b">EXPOSES</text>` +
        renderPortRow(n.exposes, rightX, portsTop + 14, colW, stroke, "out");
    }
  }

  let footerSvg = "";
  if (n.tech || n.status === "warn") {
    const footerY = n.y + n.h - 22;
    if (n.status === "warn") {
      const badgeH = 16;
      const badgeX = n.x + padX;
      const badgeY = footerY - 2;
      const label = n.warn ?? "Missing contract";
      const badgeW = estimateTextWidth(label, 10) + 22;
      footerSvg +=
        `<rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="999" fill="${warnVisual.soft}"/>` +
        renderLucideIcon(warnVisual.icon, badgeX + 4, badgeY + 2, 12, warnVisual.color, {
          strokeWidth: 2.5,
        }) +
        `<text x="${badgeX + 18}" y="${badgeY + 12}" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="${warnVisual.color}">${escapeXml(label)}</text>`;
    }
    if (n.tech) {
      const label = n.tech;
      const badgeW = estimateTextWidth(label, 10) + 16;
      const badgeH = 16;
      const badgeX = n.x + n.w - padX - badgeW;
      const badgeY = footerY - 2;
      footerSvg +=
        `<rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="999" fill="${visual.soft}"/>` +
        `<text x="${badgeX + badgeW / 2}" y="${badgeY + 12}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="${stroke}">${escapeXml(label)}</text>`;
    }
  }

  const shell = isDb
    ? renderDbCylinder(n.x, n.y, n.w, n.h, border)
    : `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="12" fill="white" stroke="${border}" stroke-width="2"/>`;

  return (
    `<g data-node="${escapeXml(n.id)}" data-kind="${n.kind}">` +
    shell +
    `<rect x="${chipX}" y="${chipY}" width="${chip}" height="${chip}" rx="6" fill="${visual.soft}"/>` +
    renderLucideIcon(visual.icon, iconX, iconY, iconSize, stroke) +
    `<text x="${textX}" y="${titleY}" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#0f172a">${escapeXml(n.title)}</text>` +
    (n.subtitle
      ? `<text x="${textX}" y="${subtitleY}" font-family="system-ui,sans-serif" font-size="11" fill="#64748b">${escapeXml(n.subtitle)}</text>`
      : "") +
    portsSvg +
    footerSvg +
    `</g>`
  );
}

/** Build an SVG snapshot of the board graph matching the live whiteboard cards. */
export function graphToSvg(graph: BoardGraph): string {
  const b = diagramBounds(graph);

  const groupRects = graph.groups
    .map((g) => {
      const fill = boundaryExportFill(g.color);
      const stroke = boundaryExportStroke(g.color);
      const title = g.tag ? `${g.title} - ${g.tag}` : g.title;
      return (
        `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${fill}" stroke="${stroke}" stroke-dasharray="8 6" stroke-width="2" rx="12"/>` +
        `<text x="${g.x + 16}" y="${g.y + 28}" font-family="system-ui,sans-serif" font-size="14" fill="#334155">${escapeXml(title)}</text>`
      );
    })
    .join("\n");

  const nodeBoxes = graph.nodes.map((n) => ({
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
  }));

  const labeled = graph.edges
    .filter((e) => e.label)
    .map((e) => {
      const from = graph.nodes.find((n) => n.id === e.from);
      const to = graph.nodes.find((n) => n.id === e.to);
      if (!from || !to) return null;
      const fan = edgeFanIndex(graph.edges, e.id);
      const anchors = resolveEdgeAnchors(from, to, fan.index, fan.count);
      const rough = placeEdgeLabel({
        a: anchors.a,
        b: anchors.b,
        aSide: anchors.fromSide,
        bSide: anchors.toSide,
        nodes: nodeBoxes,
        fromBox: from,
        toBox: to,
        fanIndex: fan.index,
        fanCount: fan.count,
      });
      return {
        id: e.id,
        x: rough.x,
        y: rough.y,
        e,
        a: anchors.a,
        bPt: anchors.b,
        fromSide: anchors.fromSide,
        toSide: anchors.toSide,
        from,
        to,
        fan,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    x: number;
    y: number;
    e: (typeof graph.edges)[number];
    a: { x: number; y: number };
    bPt: { x: number; y: number };
    fromSide: "l" | "r" | "t" | "b";
    toSide: "l" | "r" | "t" | "b";
    from: SphereNode;
    to: SphereNode;
    fan: { index: number; count: number };
  }>;

  const staggerMap = computeLabelStagger(
    labeled.map((l) => ({ id: l.id, x: l.x, y: l.y })),
  );

  const edges = graph.edges
    .map((e) => {
      const from = graph.nodes.find((n) => n.id === e.from);
      const to = graph.nodes.find((n) => n.id === e.to);
      if (!from || !to) return "";
      const fan = edgeFanIndex(graph.edges, e.id);
      const anchors = resolveEdgeAnchors(from, to, fan.index, fan.count);
      const style = edgeStroke(e.kind);
      const dashed = style.dash ? ` stroke-dasharray="${style.dash}"` : "";
      const marker =
        e.kind === "flow" || e.kind === "db"
          ? "url(#arrow-agent)"
          : e.kind === "async" || e.kind === "stream"
            ? "url(#arrow-event)"
            : "url(#arrow)";
      const d = edgePath(anchors.a, anchors.b, anchors.fromSide, anchors.toSide);
      let labelSvg = "";
      if (e.label) {
        const mid = placeEdgeLabel({
          a: anchors.a,
          b: anchors.b,
          aSide: anchors.fromSide,
          bSide: anchors.toSide,
          nodes: nodeBoxes,
          stagger: staggerMap.get(e.id) ?? 0,
          fromBox: from,
          toBox: to,
          fanIndex: fan.index,
          fanCount: fan.count,
        });
        const ev = edgeVisual(e.kind);
        const contractLine = e.contract ? 12 : 0;
        const textW = Math.max(
          estimateTextWidth(e.label, 10),
          e.contract ? estimateTextWidth(e.contract, 9) : 0,
        );
        const boxW = textW + 28;
        const boxH = 18 + contractLine;
        const boxX = mid.x - boxW / 2;
        const boxY = mid.y - boxH / 2;
        labelSvg =
          `<rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="6" fill="white" stroke="#e2e8f0"/>` +
          renderLucideIcon(ev.icon, boxX + 4, boxY + (boxH - 12) / 2, 12, ev.color) +
          `<text x="${boxX + 20}" y="${boxY + 13}" font-family="system-ui,sans-serif" font-size="10" font-weight="500" fill="#0f172a">${escapeXml(e.label)}</text>` +
          (e.contract
            ? `<text x="${boxX + 20}" y="${boxY + 24}" font-family="system-ui,sans-serif" font-size="9" fill="#64748b">${escapeXml(e.contract)}</text>`
            : "");
      }
      return (
        `<path d="${d}" stroke="${style.stroke}" stroke-width="1.5" fill="none"${dashed} marker-end="${marker}" opacity="0.9"/>` +
        labelSvg
      );
    })
    .join("\n");

  const nodes = graph.nodes.map(renderNode).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" width="${b.width}" height="${b.height}">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
    </marker>
    <marker id="arrow-agent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#22c55e"/>
    </marker>
    <marker id="arrow-event" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#c026d3"/>
    </marker>
  </defs>
  <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="#f8fafc"/>
  ${groupRects}
  ${edges}
  ${nodes}
</svg>`;
}

function escapeXml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Rasterize SVG string to PNG blob (browser only). */
export async function svgToPngBlob(svg: string, scale = 2): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("svgToPngBlob requires a browser environment");
  }
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(img.width * scale));
    canvas.height = Math.max(1, Math.floor(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG encode failed"))),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load SVG for PNG export"));
    img.src = url;
  });
}
