// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import * as vscode from "vscode";
import { renderScanPreview, type PreviewResult } from "./render";

export const SCAN_PREVIEW_EDITOR_ID = "scan.previewEditor";

export function isScanDocument(document: vscode.TextDocument): boolean {
  if (document.languageId === "scan") return true;
  const name = document.uri.path.toLowerCase();
  return (
    name.endsWith(".scan.yaml") ||
    name.endsWith(".scan.yml") ||
    name.endsWith(".scan")
  );
}

export function basename(uri: vscode.Uri): string {
  const parts = uri.path.split("/");
  return parts[parts.length - 1] || "diagram";
}

export function buildPreviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
): string {
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "preview.css"),
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "webview.js"),
  );
  const csp = [
    "default-src 'none'",
    `style-src ${webview.cspSource} 'unsafe-inline'`,
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
      <p id="hint" class="hint">Drag to pan · scroll to zoom</p>
    </div>
  </div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}

export function previewMessageFromResult(result: PreviewResult): unknown {
  if (result.ok) {
    return {
      type: "render",
      svg: result.svg,
      system: result.system,
    };
  }
  return { type: "error", message: result.message };
}

/** Keeps last payload and (re)sends when the webview reports ready. */
export class PreviewWebviewBridge {
  private ready = false;
  private pending: unknown | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly webview: vscode.Webview,
    private readonly onShowSource?: () => void,
  ) {
    this.disposables.push(
      webview.onDidReceiveMessage((msg) => {
        if (!msg || typeof msg !== "object") return;
        const type = (msg as { type?: string }).type;
        if (type === "ready") {
          this.ready = true;
          if (this.pending !== undefined) {
            void webview.postMessage(this.pending);
          }
          return;
        }
        if (type === "showSource") {
          this.onShowSource?.();
        }
      }),
    );
  }

  post(message: unknown): void {
    this.pending = message;
    if (this.ready) {
      void this.webview.postMessage(message);
    }
  }

  pushDocument(document: vscode.TextDocument): void {
    this.post(previewMessageFromResult(renderScanPreview(document.getText())));
  }

  dispose(): void {
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}
