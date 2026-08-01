// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useState, type ReactNode } from "react";
import {
  Check,
  Circle,
  Command as CommandIcon,
  Download,
  FileCode2,
  FilePlus2,
  Image as ImageIcon,
  Menu,
  Redo2,
  Search,
  Undo2,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Modal } from "../Modal";
import type { BoardShell } from "../board-types";
import { IconBtn } from "../ui/IconBtn";
import { AiOrb } from "./AIBar";

export function TopBar({
  shell,
  systemName,
  topBarBeforeTitle,
  topBarAfterStatus,
  topBarAfterBrand,
  canUndo,
  canRedo,
  dirty,
  onUndo,
  onRedo,
  onNewBoard,
  onRenameDiagram,
  onPalette,
  onDownloadYaml,
  onDownloadCopy,
  onImportYaml,
  onExportSvg,
  onExportPng,
}: {
  shell: BoardShell;
  systemName: string;
  topBarBeforeTitle?: ReactNode;
  topBarAfterStatus?: ReactNode;
  topBarAfterBrand?: ReactNode;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewBoard: () => void;
  onRenameDiagram: () => void;
  onPalette: () => void;
  /** Save — goes to the host (cloud / local-store) when persistence is configured, otherwise downloads. */
  onDownloadYaml: () => void;
  /** Download copy — always writes a local .scan.yaml file, independent of host persistence. */
  onDownloadCopy: () => void;
  onImportYaml: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}) {
  const isSphere = shell === "sphere";
  const [coworkOpen, setCoworkOpen] = useState(false);
  return (
    <div
      className={`flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 ${
        isSphere ? "h-14" : "h-12"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isSphere && <AiOrb />}
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              {isSphere ? "Sphere" : "SCAN"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isSphere ? "Architecture Whiteboard" : "Notation modeler"}
            </div>
          </div>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        {topBarAfterBrand ? (
          <>
            {topBarAfterBrand}
            <div className="mx-2 h-6 w-px bg-border" />
          </>
        ) : null}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {topBarBeforeTitle}
          <button
            type="button"
            onClick={onRenameDiagram}
            title="Rename diagram"
            className="rounded-md px-2 py-1 font-medium text-foreground hover:bg-muted"
          >
            {systemName}
          </button>
          {!isSphere && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1 ${
                dirty ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"
              }`}
              title={dirty ? "Unsaved local changes" : "All changes saved"}
            >
              {dirty ? (
                <>
                  <Circle className="h-2.5 w-2.5 fill-current" /> Unsaved
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" /> Saved
                </>
              )}
            </span>
          )}
          {topBarAfterStatus}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
          <IconBtn label="Undo" onClick={onUndo} variant="ghost" disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Redo" onClick={onRedo} variant="ghost" disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </IconBtn>
          <div className="mx-1 h-5 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Board & export"
                aria-label="Board & export"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[11rem]">
              <DropdownMenuItem onSelect={onNewBoard}>
                <FilePlus2 className="h-4 w-4" />
                New board
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onImportYaml}>
                <Upload className="h-4 w-4" />
                Import YAML
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDownloadYaml}>
                <Download className="h-4 w-4" />
                Save
                <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+S</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDownloadCopy}>
                <Download className="h-4 w-4" />
                Download copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onExportSvg}>
                <FileCode2 className="h-4 w-4" />
                Export SVG
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onExportPng}>
                <ImageIcon className="h-4 w-4" />
                Export PNG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {isSphere && (
          <>
            <button
              onClick={onPalette}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <Search className="h-3.5 w-3.5" /> Search components, contracts...
              <span className="ml-2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                <CommandIcon className="h-3 w-3" /> K
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCoworkOpen(true)}
              title="Collaboration coming soon"
              className="flex -space-x-2 rounded-md p-0.5 hover:bg-muted"
            >
              {["EM", "JR", "AN"].map((i, idx) => (
                <div
                  key={i}
                  className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-surface"
                  style={{
                    background: ["var(--svc)", "var(--agent)", "var(--event)"][idx],
                  }}
                >
                  {i}
                </div>
              ))}
            </button>
            <button
              type="button"
              onClick={() => setCoworkOpen(true)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              title="Collaboration coming soon"
            >
              Share
            </button>
          </>
        )}
      </div>

      <Modal
        open={coworkOpen}
        onClose={() => setCoworkOpen(false)}
        title="Co-work coming soon"
        description="Realtime sharing and editing with teammates is on the way. For now, save diagrams to your organization and open them from the Library."
        tone="info"
        size="sm"
        actions={[
          {
            label: "Got it",
            variant: "primary",
            onClick: () => setCoworkOpen(false),
            autoFocus: true,
          },
        ]}
      />
    </div>
  );
}

/* ------------------------- AI BAR ------------------------- */

