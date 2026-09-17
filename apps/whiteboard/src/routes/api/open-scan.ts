/**
 * Open a SCAN document in the running whiteboard from another app.
 *
 *   POST /api/open-scan          — push YAML (JSON `{ yaml }` or raw text/yaml body)
 *   GET  /api/open-scan?after=id&claim=1 — poll; claim=1 clears after return (focused tab)
 *   DELETE /api/open-scan?id=…   — claim/clear after the board applied it
 *   OPTIONS /api/open-scan       — CORS preflight
 */
import { createFileRoute } from "@tanstack/react-router";

import {
  claimPendingOpenScan,
  clearPendingOpenScan,
  MAX_YAML_CHARS,
  peekPendingOpenScan,
  setPendingOpenScan,
} from "@/lib/pending-open-scan.server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

async function readYamlFromRequest(request: Request): Promise<{
  yaml: string;
  source: string | null;
}> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      yaml?: unknown;
      scan?: unknown;
      source?: unknown;
      filename?: unknown;
    };
    const yaml =
      typeof body.yaml === "string"
        ? body.yaml
        : typeof body.scan === "string"
          ? body.scan
          : "";
    const source =
      typeof body.source === "string"
        ? body.source
        : typeof body.filename === "string"
          ? body.filename
          : null;
    return { yaml, source };
  }

  if (
    contentType.includes("text/yaml") ||
    contentType.includes("application/x-yaml") ||
    contentType.includes("text/plain") ||
    contentType.includes("application/yaml") ||
    !contentType
  ) {
    const yaml = await request.text();
    return { yaml, source: null };
  }

  // Fallback: try text
  const yaml = await request.text();
  return { yaml, source: null };
}

export const Route = createFileRoute("/api/open-scan")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: CORS_HEADERS,
        }),

      GET: async ({ request }) => {
        const url = new URL(request.url);
        const after = url.searchParams.get("after");
        const claim = url.searchParams.get("claim") === "1";
        const pending = claim
          ? (() => {
              const peeked = peekPendingOpenScan(after);
              if (!peeked) return null;
              return claimPendingOpenScan(peeked.id);
            })()
          : peekPendingOpenScan(after);
        if (!pending) {
          return json({ ok: true, pending: null });
        }
        return json({
          ok: true,
          pending: {
            id: pending.id,
            yaml: pending.yaml,
            createdAt: pending.createdAt,
            source: pending.source,
          },
        });
      },

      POST: async ({ request }) => {
        try {
          const { yaml, source } = await readYamlFromRequest(request);
          const pending = setPendingOpenScan(yaml, source);
          return json({
            ok: true,
            id: pending.id,
            bytes: pending.yaml.length,
            maxBytes: MAX_YAML_CHARS,
            source: pending.source,
          });
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : String(cause);
          return json({ ok: false, error: message }, 400);
        }
      },

      DELETE: async ({ request }) => {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (id) {
          const claimed = claimPendingOpenScan(id);
          return json({ ok: true, claimed: Boolean(claimed) });
        }
        clearPendingOpenScan();
        return json({ ok: true, claimed: true });
      },
    },
  },
});
