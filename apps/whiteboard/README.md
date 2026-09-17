# @spherescan/whiteboard

Minimal **SCAN** reference modeler (System & Component Architecture Notation).

Open-source scope: canvas, tools, YAML I/O, inspector - a demo of the `@spherescan/*`
toolkit. Not a full product platform.

Consumes `@spherescan/model`, `@spherescan/viewer`, `@spherescan/modeler`, `@spherescan/rules`, and `@spherescan/board`.

## Run

From the scan-js repo root (after building packages):

```bash
npm install --legacy-peer-deps
npm run build
npm run dev
```

Default URL: [http://localhost:3001](http://localhost:3001).

## Browser draft (per tab)

The open diagram is saved to **`sessionStorage`** under `scan.whiteboard.draftYaml`.
Each browser tab has its own copy: refresh restores **that** tab’s diagram; other
tabs keep theirs. Closing a tab discards its draft. (An older shared
`localStorage` draft is cleared if still present.)

Skip restore: open [http://localhost:3001/?fresh=1](http://localhost:3001/?fresh=1).

## Open from another app (`/api/open-scan`)

While the whiteboard **Vite / Start** server is running, another process can
POST a SCAN document into the open tab (the board polls once per second).

```bash
# JSON body
curl -s -X POST http://localhost:3001/api/open-scan \
  -H "Content-Type: application/json" \
  --data-binary @- <<'EOF'
{"yaml":"scan: \"0.1\"\nsystem:\n  id: demo\n  name: Demo\n","source":"my-app"}
EOF

# Or raw YAML
curl -s -X POST http://localhost:3001/api/open-scan \
  -H "Content-Type: text/yaml" \
  --data-binary @path/to/architecture.scan.yaml
```

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/open-scan` | Queue YAML (`{ yaml, source? }` JSON, or raw `text/yaml`) |
| `GET` | `/api/open-scan?after=<id>&claim=1` | Peek (or claim) pending document; whiteboard uses `claim=1` from the focused tab only |
| `DELETE` | `/api/open-scan?id=<id>` | Claim / clear after load |
| `OPTIONS` | `/api/open-scan` | CORS preflight (`Access-Control-Allow-Origin: *`) |

Requires the TanStack Start server (dev / Node preview). A static nginx export
of `dist/` does not include this API.