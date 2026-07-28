# Embed `@spherescan/board` (rehearsal)

Private until 0.2 — this example shows how a **host page** would embed the interactive SCAN board and preload a diagram.

## Run (from scan-js workspace)

```bash
cd scan-js
npm install --legacy-peer-deps
# board is source; modeler/viewer should already be built, or:
npm run build -w @spherescan/model -w @spherescan/rules -w @spherescan/viewer -w @spherescan/modeler

npm run dev -w @spherescan/embed-board
# → http://localhost:5175
```

From the monorepo root (`sphere-io`):

```bash
npm install --legacy-peer-deps
npm run build:scan
npm run dev -w @spherescan/embed-board
```

## What the host code looks like

```tsx
import BoardApp from "@spherescan/board";
import diagramYaml from "../../architectures/hello-scan.scan.yaml?raw";

export function Page() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header>…your product chrome…</header>
      <main style={{ flex: 1, minHeight: 0 }}>
        <BoardApp shell="scan" fill="parent" initialYaml={diagramYaml} />
      </main>
    </div>
  );
}
```

## Loading SCAN YAML

| Pattern | When to use |
|---------|-------------|
| `import x from "../../architectures/hello-scan.scan.yaml?raw"` | Known diagram at build time (this example) |
| `<input type="file">` + `file.text()` | User picks a file from disk (also wired in the demo) |
| `fetch("/api/diagrams/…")` then `initialYaml={text}` | Host backend / CMS |
| Absolute disk path in Vite | Dev-only: add the folder to `server.fs.allow` and import it — not for production |

This rehearsal preloads [`../architectures/hello-scan.scan.yaml`](../architectures/hello-scan.scan.yaml).

## Install shape (when board is published)

```bash
npm i @spherescan/board @spherescan/model @spherescan/modeler @spherescan/rules @spherescan/viewer
npm i react react-dom lucide-react sonner   # peers the board expects
```

Until then, depend via the nested workspace / `file:../../packages/board` (as this example does through the scan-js workspace).

## Notes

- React must be a **single** instance in the host (board lists it as a peer).
- Give the board a bounded height (`flex: 1` + `minHeight: 0`, or a fixed `px`/`vh`).
- Prefer `@spherescan/viewer` for read-only SVG embeds without React UI chrome.
