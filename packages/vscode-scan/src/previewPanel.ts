// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import * as vscode from "vscode";
import { renderScanPreview, type PreviewResult } from "./render";

const VIEW_TYPE = "scan.preview";

export class ScanPreviewPanel {
  public static current: ScanPreviewPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private editorUri: vscode.Uri | undefined;
  private disposables: vscode.Disposable[] = [];
  private debounce: ReturnType<typeof setTimeout> | undefined;

  static show(
    extensionUri: vscode.Uri,
    column: vscode.ViewColumn | undefined,
    document?: vscode.TextDocument,
  ): ScanPreviewPanel {
    const targetColumn = column ?? vscode.ViewColumn.Beside;

    if (ScanPreviewPanel.current) {
      ScanPreviewPanel.current.panel.reveal(targetColumn);
      if (document) {
        ScanPreviewPanel.current.bindDocument(document);
      } else {
        ScanPreviewPanel.current.refreshFromActive();
      }
      return ScanPreviewPanel.current;
    }

    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPE,
      "SCAN Preview",
      targetColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
      },
    );

    ScanPreviewPanel.current = new ScanPreviewPanel(panel, extensionUri, document);
    return ScanPreviewPanel.current;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    document?: vscode.TextDocument,
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.panel.webview.html = this.getHtml();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.onDidChangeViewState(
      () => {
        void vscode.commands.executeCommand(
          "setContext",
          "scanPreviewFocus",
          this.panel.active,
        );
      },
      null,
      this.disposables,
    );

    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (this.editorUri && e.document.uri.toString() === this.editorUri.toString()) {
          this.scheduleRefresh(e.document);
        }
      },
      null,
      this.disposables,
    );

    vscode.window.onDidChangeActiveTextEditor(
      (ed) => {
        if (ed && isScanDocument(ed.document)) {
          this.bindDocument(ed.document);
        }
      },
      null,
      this.disposables,
    );

    if (document) {
      this.bindDocument(document);
    } else {
      this.refreshFromActive();
    }
  }

  refresh(): void {
    if (this.editorUri) {
      const doc = vscode.workspace.textDocuments.find(
        (d) => d.uri.toString() === this.editorUri!.toString(),
      );
      if (doc) {
        this.pushRender(doc);
        return;
      }
    }
    this.refreshFromActive();
  }

  private refreshFromActive(): void {
    const ed = vscode.window.activeTextEditor;
    if (ed && isScanDocument(ed.document)) {
      this.bindDocument(ed.document);
      return;
    }
    this.post({
      type: "error",
      message: "Open a *.scan.yaml file to preview.",
    });
  }

  private bindDocument(document: vscode.TextDocument): void {
    this.editorUri = document.uri;
    this.panel.title = `SCAN: ${basename(document.uri)}`;
    this.pushRender(document);
  }

  private scheduleRefresh(document: vscode.TextDocument): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.pushRender(document), 200);
  }

  private pushRender(document: vscode.TextDocument): void {
    const result = renderScanPreview(document.getText());
    this.postResult(result);
  }

  private postResult(result: PreviewResult): void {
    if (result.ok) {
      this.post({
        type: "render",
        svg: result.svg,
        system: result.system,
        nodes: result.nodes,
        edges: result.edges,
      });
    } else {
      this.post({ type: "error", message: result.message });
    }
  }

  private post(message: unknown): void {
    void this.panel.webview.postMessage(message);
  }

  private getHtml(): string {
    const webview = this.panel.webview;
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "preview.css"),
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "webview.js"),
    );
    const csp = [
      "default-src 'none'",
      `style-src ${webview.cspSource}`,
      `script-src ${webview.cspSource}`,
      "img-src data: https:",
    ].join("; ");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>SCAN Preview</title>
</head>
<body>
  <header class="toolbar">
    <div class="toolbar-left">
      <span id="system-label" class="system-label">SCAN</span>
    </div>
    <div class="toolbar-right">
      <button type="button" id="btn-zoom-out" title="Zoom out">−</button>
      <button type="button" id="btn-zoom-reset" title="Reset zoom">100%</button>
      <button type="button" id="btn-zoom-in" title="Zoom in">+</button>
      <button type="button" id="btn-fit" title="Fit to view">Fit</button>
    </div>
  </header>
  <div class="main">
    <div id="viewport" class="viewport" tabindex="0">
      <div id="canvas" class="canvas"></div>
      <div id="error" class="error hidden"></div>
      <p id="hint" class="hint">Drag to pan · scroll to zoom · click a box or wire for details</p>
    </div>
    <aside id="details" class="details">
      <h2>Details</h2>
      <p class="muted" id="details-empty">Select a component or connection.</p>
      <div id="details-body" class="hidden"></div>
    </aside>
  </div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    ScanPreviewPanel.current = undefined;
    if (this.debounce) clearTimeout(this.debounce);
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}

export function isScanDocument(document: vscode.TextDocument): boolean {
  if (document.languageId === "scan") return true;
  const name = document.uri.path.toLowerCase();
  return (
    name.endsWith(".scan.yaml") ||
    name.endsWith(".scan.yml") ||
    name.endsWith(".scan")
  );
}

function basename(uri: vscode.Uri): string {
  const parts = uri.path.split("/");
  return parts[parts.length - 1] || "diagram";
}
