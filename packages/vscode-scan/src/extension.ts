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

  // Left side, high priority — less likely to be collapsed than right-side items.
  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  status.name = "SCAN Preview";
  context.subscriptions.push(status);

  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const refreshChrome = async () => {
    const target = activeScanTarget();
    if (!target) {
      // Debounce hide: tab switches briefly clear the active editor and caused flicker.
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(async () => {
        if (activeScanTarget()) return;
        await vscode.commands.executeCommand("setContext", "scan.isScanEditor", false);
        await vscode.commands.executeCommand("setContext", "scan.isPreviewEditor", false);
        status.hide();
      }, 150);
      return;
    }

    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }

    if (target.document && target.document.languageId !== "scan") {
      try {
        await vscode.languages.setTextDocumentLanguage(target.document, "scan");
      } catch {
        /* ignore */
      }
    }

    const inPreview = target.mode === "preview";
    await vscode.commands.executeCommand("setContext", "scan.isScanEditor", true);
    await vscode.commands.executeCommand("setContext", "scan.isPreviewEditor", inPreview);

    if (inPreview) {
      status.text = "$(go-to-file) SCAN Source";
      status.command = "scan.showSource";
      status.tooltip = "Show YAML source";
    } else {
      status.text = "$(open-preview) SCAN Preview";
      status.command = "scan.openPreview";
      status.tooltip = "Open SCAN diagram preview";
    }
    status.show();
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("scan.openPreview", () => {
      const target = activeScanTarget();
      return openScanPreview(target?.document, vscode.ViewColumn.Active, target?.uri);
    }),
    vscode.commands.registerCommand("scan.openPreviewToSide", () => {
      const target = activeScanTarget();
      return openScanPreview(target?.document, vscode.ViewColumn.Beside, target?.uri);
    }),
    vscode.commands.registerCommand("scan.showSource", () => showScanSource()),
    vscode.commands.registerCommand("scan.refreshPreview", () => {
      const target = activeScanTarget();
      if (target?.uri) {
        void vscode.commands.executeCommand(
          "vscode.openWith",
          target.uri,
          SCAN_PREVIEW_EDITOR_ID,
        );
      }
    }),
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      void refreshChrome();
    }),
    vscode.window.tabGroups.onDidChangeTabs(() => {
      void refreshChrome();
    }),
    vscode.window.tabGroups.onDidChangeTabGroups(() => {
      void refreshChrome();
    }),
    vscode.workspace.onDidOpenTextDocument(() => {
      void refreshChrome();
    }),
    vscode.workspace.onDidCloseTextDocument(() => {
      void refreshChrome();
    }),
    {
      dispose: () => {
        if (hideTimer) clearTimeout(hideTimer);
      },
    },
  );

  void refreshChrome();
}

export function deactivate(): void {
  // no-op
}
