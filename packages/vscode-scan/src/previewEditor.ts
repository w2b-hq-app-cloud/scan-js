// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import * as vscode from "vscode";
import {
  SCAN_PREVIEW_EDITOR_ID,
  PreviewWebviewBridge,
  basename,
  buildPreviewHtml,
  isScanDocument,
} from "./previewHtml";

/**
 * Markdown-style custom editor: same tab toggles between YAML source and
 * diagram preview via `vscode.openWith` / editor title actions.
 */
export class ScanPreviewEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = SCAN_PREVIEW_EDITOR_ID;

  constructor(private readonly extensionUri: vscode.Uri) {}

  static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ScanPreviewEditorProvider(context.extensionUri);
    return vscode.window.registerCustomEditorProvider(
      ScanPreviewEditorProvider.viewType,
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      },
    );
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };
    webviewPanel.title = `SCAN: ${basename(document.uri)}`;
    webviewPanel.webview.html = buildPreviewHtml(webviewPanel.webview, this.extensionUri);

    const bridge = new PreviewWebviewBridge(webviewPanel.webview, () => {
      void vscode.commands.executeCommand("vscode.openWith", document.uri, "default");
    });

    const changeDoc = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        bridge.pushDocument(e.document);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDoc.dispose();
      bridge.dispose();
    });

    // Initial paint (held until webview posts `ready`).
    bridge.pushDocument(document);
  }
}

export async function openScanPreview(
  document: vscode.TextDocument | undefined,
  column: vscode.ViewColumn,
  uri?: vscode.Uri,
): Promise<void> {
  const fromDoc =
    document && isScanDocument(document)
      ? document.uri
      : vscode.window.activeTextEditor?.document &&
          isScanDocument(vscode.window.activeTextEditor.document)
        ? vscode.window.activeTextEditor.document.uri
        : undefined;
  const target = fromDoc ?? uri;
  if (!target) {
    void vscode.window.showInformationMessage("Open a *.scan.yaml file to preview.");
    return;
  }
  await vscode.commands.executeCommand(
    "vscode.openWith",
    target,
    SCAN_PREVIEW_EDITOR_ID,
    column,
  );
}

export async function showScanSource(): Promise<void> {
  const tab = vscode.window.tabGroups.activeTabGroup.activeTab;
  const input = tab?.input;
  const uri =
    input instanceof vscode.TabInputCustom
      ? input.uri
      : input instanceof vscode.TabInputText
        ? input.uri
        : undefined;
  if (!uri) {
    void vscode.window.showInformationMessage("No SCAN preview to switch from.");
    return;
  }
  await vscode.commands.executeCommand("vscode.openWith", uri, "default");
}

export { isScanDocument };
