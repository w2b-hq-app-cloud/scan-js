// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import * as vscode from "vscode";
import {
  ScanPreviewEditorProvider,
  isScanDocument,
  openScanPreview,
  showScanSource,
} from "./previewEditor";
import { SCAN_PREVIEW_EDITOR_ID } from "./previewHtml";

function isScanUri(uri: vscode.Uri | undefined): boolean {
  if (!uri) return false;
  const name = uri.path.toLowerCase();
  return (
    name.endsWith(".scan.yaml") ||
    name.endsWith(".scan.yml") ||
    name.endsWith(".scan")
  );
}

function activeScanTarget(): {
  uri: vscode.Uri;
  mode: "source" | "preview";
  document?: vscode.TextDocument;
} | undefined {
  const ed = vscode.window.activeTextEditor;
  if (ed && isScanDocument(ed.document)) {
    return { uri: ed.document.uri, mode: "source", document: ed.document };
  }

  const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
  const input = tab?.input;
  if (input instanceof vscode.TabInputCustom && isScanUri(input.uri)) {
    return {
      uri: input.uri,
      mode: input.viewType === SCAN_PREVIEW_EDITOR_ID ? "preview" : "source",
    };
  }
  if (input instanceof vscode.TabInputText && isScanUri(input.uri)) {
    const document = vscode.workspace.textDocuments.find(
      (d) => d.uri.toString() === input.uri.toString(),
    );
    return { uri: input.uri, mode: "source", document };
  }
  return undefined;
}

function asUri(value: unknown): vscode.Uri | undefined {
  if (!value) return undefined;
  if (value instanceof vscode.Uri) return value;
  if (typeof value === "string") {
    try {
      return vscode.Uri.parse(value);
    } catch {
      return undefined;
    }
  }
  if (typeof value === "object" && value !== null && "scheme" in value && "path" in value) {
    try {
      return vscode.Uri.from(value as vscode.Uri);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(ScanPreviewEditorProvider.register(context));

  const iconFixKey = "scan.restoredDefaultIconTheme";
  if (!context.globalState.get(iconFixKey)) {
    void context.globalState.update(iconFixKey, true);
    const iconTheme = vscode.workspace
      .getConfiguration("workbench")
      .get<string>("iconTheme");
    if (iconTheme === "spherescan-scan-icons") {
      void vscode.workspace
        .getConfiguration("workbench")
        .update("iconTheme", "vs-seti", vscode.ConfigurationTarget.Global);
    }
  }

  // Always-visible fallback: Cursor often collapses editor-title icons into "...".
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000,
  );
  status.name = "SCAN Preview";
  context.subscriptions.push(status);

  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  /** Last SCAN URI shown on the status item — survives status-bar click focus loss. */
  let pinnedUri: vscode.Uri | undefined;

  const refreshChrome = () => {
    const target = activeScanTarget();
    if (!target) {
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (activeScanTarget()) {
          refreshChrome();
          return;
        }
        pinnedUri = undefined;
        void vscode.commands.executeCommand("setContext", "scan.isScanEditor", false);
        void vscode.commands.executeCommand("setContext", "scan.isPreviewEditor", false);
        status.hide();
      }, 150);
      return;
    }

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }

    pinnedUri = target.uri;

    // Do not await — language flips can rebind the editor and cancel a concurrent openWith.
    if (target.document && target.document.languageId !== "scan") {
      void vscode.languages.setTextDocumentLanguage(target.document, "scan");
    }

    const inPreview = target.mode === "preview";
    void vscode.commands.executeCommand("setContext", "scan.isScanEditor", true);
    void vscode.commands.executeCommand("setContext", "scan.isPreviewEditor", inPreview);

    if (inPreview) {
      status.text = "$(go-to-file) SCAN Source";
      status.tooltip = "Show YAML source";
      status.command = {
        command: "scan.showSource",
        title: "Show Source",
        arguments: [target.uri],
      };
    } else {
      status.text = "$(open-preview) SCAN Preview";
      status.tooltip = "Open SCAN diagram preview (Ctrl+Shift+V)";
      status.command = {
        command: "scan.openPreview",
        title: "Open Preview",
        arguments: [target.uri],
      };
    }
    status.show();
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("scan.openPreview", (arg?: unknown) => {
      const uri = asUri(arg) ?? pinnedUri ?? activeScanTarget()?.uri;
      const target = activeScanTarget();
      return openScanPreview(target?.document, vscode.ViewColumn.Active, uri);
    }),
    vscode.commands.registerCommand("scan.openPreviewToSide", (arg?: unknown) => {
      const uri = asUri(arg) ?? pinnedUri ?? activeScanTarget()?.uri;
      const target = activeScanTarget();
      return openScanPreview(target?.document, vscode.ViewColumn.Beside, uri);
    }),
    vscode.commands.registerCommand("scan.showSource", (arg?: unknown) => {
      const uri = asUri(arg) ?? pinnedUri;
      return showScanSource(uri);
    }),
    vscode.commands.registerCommand("scan.refreshPreview", () => {
      const uri = pinnedUri ?? activeScanTarget()?.uri;
      if (uri) {
        void vscode.commands.executeCommand(
          "vscode.openWith",
          uri,
          SCAN_PREVIEW_EDITOR_ID,
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      refreshChrome();
    }),
    vscode.window.tabGroups.onDidChangeTabs(() => {
      refreshChrome();
    }),
    vscode.window.tabGroups.onDidChangeTabGroups(() => {
      refreshChrome();
    }),
    vscode.workspace.onDidOpenTextDocument(() => {
      refreshChrome();
    }),
    vscode.workspace.onDidCloseTextDocument(() => {
      refreshChrome();
    }),
    {
      dispose: () => {
        if (hideTimer) clearTimeout(hideTimer);
      },
    },
  );

  refreshChrome();
}

export function deactivate(): void {
  // no-op
}
