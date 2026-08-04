// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import * as vscode from "vscode";
import { isScanDocument, ScanPreviewPanel } from "./previewPanel";

export function activate(context: vscode.ExtensionContext): void {
  const remapScanLanguage = (doc: vscode.TextDocument) => {
    if (doc.languageId !== "scan" && isScanDocument(doc)) {
      void vscode.languages.setTextDocumentLanguage(doc, "scan");
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("scan.openPreview", () => {
      const doc = vscode.window.activeTextEditor?.document;
      ScanPreviewPanel.show(
        context.extensionUri,
        vscode.ViewColumn.Active,
        doc && isScanDocument(doc) ? doc : undefined,
      );
    }),
    vscode.commands.registerCommand("scan.openPreviewToSide", () => {
      const doc = vscode.window.activeTextEditor?.document;
      ScanPreviewPanel.show(
        context.extensionUri,
        vscode.ViewColumn.Beside,
        doc && isScanDocument(doc) ? doc : undefined,
      );
    }),
    vscode.commands.registerCommand("scan.refreshPreview", () => {
      ScanPreviewPanel.current?.refresh();
    }),
  );

  // Remap *.scan.yaml / *.scan even when YAML claims the editor.
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(remapScanLanguage),
    vscode.window.onDidChangeActiveTextEditor((ed) => {
      if (ed) remapScanLanguage(ed.document);
    }),
  );

  for (const doc of vscode.workspace.textDocuments) {
    remapScanLanguage(doc);
  }
}

export function deactivate(): void {
  // no-op
}
