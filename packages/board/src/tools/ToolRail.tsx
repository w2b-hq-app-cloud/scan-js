// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import type { ComponentType } from "react";
import {
  ArrowRight,
  Grid3x3,
  Hand,
  MousePointer2,
  PenLine,
  Pointer,
  Waypoints,
} from "lucide-react";
import type { CreateKind } from "@spherescan/modeler";
import type { BoardTool } from "../board-types";
import { PopoverAdd } from "./PopoverAdd";
import { PopoverBoundary } from "./PopoverBoundary";
import { IconBtn } from "../ui/IconBtn";

export function ToolRail({
  tool,
  setTool,
  showGrid,
  setShowGrid,
  orthogonalEdges,
  setOrthogonalEdges,
  onPickCreate,
  onPickBoundary,
}: {
  tool: BoardTool;
  setTool: (t: BoardTool) => void;
  showGrid: boolean;
  setShowGrid: (b: boolean) => void;
  orthogonalEdges: boolean;
  setOrthogonalEdges: (b: boolean) => void;
  onPickCreate: (kind: CreateKind) => void;
  onPickBoundary: (kind: "trust" | "runtime") => void;
}) {
  const items: {
    id: "select" | "pan" | "connect";
    icon: ComponentType<{ className?: string }>;
    label: string;
  }[] = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "pan", icon: Hand, label: "Pan" },
    { id: "connect", icon: ArrowRight, label: "Connect" },
  ];
  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col items-center gap-2 rounded-xl bg-surface p-1.5 node-shadow hairline">
      {items.map((it) => {
        const Icon = it.id === "connect" && tool === "connect" ? Pointer : it.icon;
        return (
          <IconBtn
            key={it.id}
            label={it.label}
            tooltipSide="right"
            onClick={() => setTool(it.id)}
            active={tool === it.id}
          >
            <Icon className="h-4 w-4" />
          </IconBtn>
        );
      })}
      <IconBtn
        label="Fast design (F)"
        tooltipSide="right"
        onClick={() => setTool(tool === "fast" ? "select" : "fast")}
        active={tool === "fast"}
      >
        <PenLine className="h-4 w-4" />
      </IconBtn>
      <div className="my-1 h-px w-6 bg-border" />
      <PopoverAdd active={tool === "create"} onPick={onPickCreate} />
      <PopoverBoundary active={tool === "boundary"} onPick={onPickBoundary} />
      <IconBtn
        label="Toggle grid"
        tooltipSide="right"
        onClick={() => setShowGrid(!showGrid)}
        active={showGrid}
      >
        <Grid3x3 className="h-4 w-4" />
      </IconBtn>
      <IconBtn
        label={orthogonalEdges ? "Curved arrows" : "Straight 90° arrows"}
        tooltipSide="right"
        onClick={() => setOrthogonalEdges(!orthogonalEdges)}
        active={orthogonalEdges}
      >
        <Waypoints className="h-4 w-4" />
      </IconBtn>
    </div>
  );
}

