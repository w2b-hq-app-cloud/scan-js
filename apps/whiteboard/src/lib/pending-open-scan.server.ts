/**
 * In-memory slot for SCAN YAML pushed into the running whiteboard via
 * POST /api/open-scan. Survives only for the Node/Vite process lifetime.
 */

export type PendingOpenScan = {
  id: string;
  yaml: string;
  createdAt: number;
  source: string | null;
};

const MAX_YAML_CHARS = 1_500_000;
/** Drop unclaimed pushes after this window. */
const PENDING_TTL_MS = 1000 * 60 * 5;

let pending: PendingOpenScan | null = null;
let seq = 0;

function pruneExpired(): void {
  if (!pending) return;
  if (Date.now() - pending.createdAt > PENDING_TTL_MS) {
    pending = null;
  }
}

export function setPendingOpenScan(
  yaml: string,
  source?: string | null,
): PendingOpenScan {
  const normalized = yaml.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    throw new Error("yaml is empty");
  }
  if (normalized.length > MAX_YAML_CHARS) {
    throw new Error(`yaml exceeds ${MAX_YAML_CHARS} characters`);
  }
  seq += 1;
  pending = {
    id: `open-${seq}-${Date.now().toString(36)}`,
    yaml: normalized,
    createdAt: Date.now(),
    source: source?.trim() || null,
  };
  return pending;
}

export function peekPendingOpenScan(afterId?: string | null): PendingOpenScan | null {
  pruneExpired();
  if (!pending) return null;
  if (afterId && pending.id === afterId) return null;
  return pending;
}

export function claimPendingOpenScan(id?: string | null): PendingOpenScan | null {
  pruneExpired();
  if (!pending) return null;
  if (id && pending.id !== id) return null;
  const claimed = pending;
  pending = null;
  return claimed;
}

export function clearPendingOpenScan(): void {
  pending = null;
}

export { MAX_YAML_CHARS };
