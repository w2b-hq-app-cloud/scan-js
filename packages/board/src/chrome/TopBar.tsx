// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { type ReactNode } from "react";
import {
  Check,
  Circle,
  Copy,
  Download,
  FileCode2,
  FilePlus2,
  Image as ImageIcon,
  Menu,
  Redo2,
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
import { IconBtn } from "../ui/IconBtn";

export function TopBar({
  systemName,
  topBarBrand,
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
  onDuplicateDiagram,
  onDownloadYaml,
  onDownloadCopy,
  onImportYaml,
  onExportSvg,
  onExportPng,
}: {
  systemName: string;
  topBarBrand?: ReactNode;
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
  onDuplicateDiagram: () => void;
  /** Save — goes to the host (cloud / local-store) when persistence is configured, otherwise downloads. */
  onDownloadYaml: () => void;
  /** Download copy — always writes a local .scan.yaml file, independent of host persistence. */
  onDownloadCopy: () => void;
  onImportYaml: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      <div className="flex items-center gap-3">
        {topBarBrand ?? (
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">SCAN</div>
            <div className="text-[10px] text-muted-foreground">Notation modeler</div>
          </div>
        )}
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
          <button
            type="button"
            onClick={onDuplicateDiagram}
            title="Duplicate diagram — same architecture under a new name"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
            Duplicate
          </button>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
        </div>
      </div>

      <div className="flex items-center gap-1">
        {topBarAfterStatus}
        <IconBtn label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconBtn>
        <IconBtn label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconBtn>
        <div className="mx-1 h-6 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              title="File"
            >
              <Menu className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onNewBoard}>
              <FilePlus2 className="h-4 w-4" /> New board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImportYaml}>
              <Upload className="h-4 w-4" /> Import YAML…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDownloadYaml}>
              <Download className="h-4 w-4" /> Save
              <span className="ml-auto text-[10px] text-muted-foreground">Ctrl+S</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadCopy}>
              <Download className="h-4 w-4" /> Download copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSvg}>
              <FileCode2 className="h-4 w-4" /> Export SVG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPng}>
              <ImageIcon className="h-4 w-4" /> Export PNG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
