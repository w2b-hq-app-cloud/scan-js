/**
 * SCAN whiteboard — `@spherescan/board` host.
 * Restores the open diagram from localStorage and accepts pushes via /api/open-scan.
 */
import { useCallback, useEffect, useState } from "react";
import BoardApp from "@spherescan/board";

import {
  clearBoardDraft,
  readBoardDraft,
  shouldSkipDraftRestore,
  writeBoardDraft,
} from "@/lib/board-draft";

type RestoreState =
  | { status: "loading" }
  | { status: "ready"; initialYaml: string | undefined };

type PendingPayload = {
  id: string;
  yaml: string;
  createdAt: number;
  source: string | null;
};

const POLL_MS = 1000;

export default function ScanApp() {
  const [restore, setRestore] = useState<RestoreState>({ status: "loading" });
  const [applyYaml, setApplyYaml] = useState<string | null>(null);
  const [applyYamlNonce, setApplyYamlNonce] = useState(0);

  useEffect(() => {
    if (shouldSkipDraftRestore()) {
      clearBoardDraft();
      setRestore({ status: "ready", initialYaml: undefined });
      return;
    }
    const draft = readBoardDraft();
    setRestore({
      status: "ready",
      initialYaml: draft?.yaml?.trim() ? draft.yaml : undefined,
    });
  }, []);

  const onDocumentChange = useCallback((yaml: string) => {
    writeBoardDraft(yaml);
  }, []);

  // Poll the local Start server for YAML pushed by external apps.
  useEffect(() => {
    if (restore.status !== "ready") return;
    let cancelled = false;
    let afterId = "";

    const tick = async () => {
      try {
        const url = afterId
          ? `/api/open-scan?after=${encodeURIComponent(afterId)}`
          : "/api/open-scan";
        const res = await fetch(url, { method: "GET", cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          ok?: boolean;
          pending?: PendingPayload | null;
        };
        const pending = data.pending;
        if (!pending?.yaml?.trim() || pending.id === afterId) return;
        afterId = pending.id;
        writeBoardDraft(pending.yaml);
        setApplyYaml(pending.yaml);
        setApplyYamlNonce((n) => n + 1);
        void fetch(`/api/open-scan?id=${encodeURIComponent(pending.id)}`, {
          method: "DELETE",
        }).catch(() => {
          /* ignore */
        });
      } catch {
        /* server restart / offline — keep polling */
      }
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [restore.status]);

  if (restore.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading board…
      </div>
    );
  }

  return (
    <BoardApp
      initialYaml={restore.initialYaml}
      applyYaml={applyYaml}
      applyYamlNonce={applyYamlNonce}
      onDocumentChange={onDocumentChange}
    />
  );
}
