/**
 * Persist the open SCAN YAML across hard refresh **per browser tab**.
 *
 * Uses sessionStorage (not localStorage) so each tab keeps its own diagram:
 * refresh restores that tab's copy; other tabs are unaffected. Closing the tab
 * discards its draft. A leftover localStorage key from older builds is cleared.
 */

export const BOARD_DRAFT_KEY = "scan.whiteboard.draftYaml";
/** @deprecated Shared across tabs — migrated away; cleared on access. */
const LEGACY_LOCAL_DRAFT_KEY = "scan.whiteboard.draftYaml";

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days (tab sessions are shorter)
const MAX_YAML_CHARS = 1_500_000;

export type BoardDraft = {
  yaml: string;
  updatedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function clearLegacyLocalDraft(): void {
  try {
    window.localStorage?.removeItem(LEGACY_LOCAL_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function normalizeScanYaml(yaml: string): string {
  return yaml.replace(/\r\n/g, "\n").trim();
}

export function readBoardDraft(): BoardDraft | null {
  if (!canUseStorage()) return null;
  clearLegacyLocalDraft();
  try {
    const raw = window.sessionStorage.getItem(BOARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BoardDraft>;
    if (typeof parsed.yaml !== "string" || typeof parsed.updatedAt !== "number") {
      window.sessionStorage.removeItem(BOARD_DRAFT_KEY);
      return null;
    }
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(BOARD_DRAFT_KEY);
      return null;
    }
    if (parsed.yaml.length > MAX_YAML_CHARS) {
      window.sessionStorage.removeItem(BOARD_DRAFT_KEY);
      return null;
    }
    return { yaml: parsed.yaml, updatedAt: parsed.updatedAt };
  } catch {
    try {
      window.sessionStorage.removeItem(BOARD_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeBoardDraft(yaml: string): void {
  if (!canUseStorage()) return;
  clearLegacyLocalDraft();
  const normalized = normalizeScanYaml(yaml);
  if (!normalized || normalized.length > MAX_YAML_CHARS) return;
  try {
    const draft: BoardDraft = { yaml: normalized, updatedAt: Date.now() };
    window.sessionStorage.setItem(BOARD_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearBoardDraft(): void {
  clearLegacyLocalDraft();
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.removeItem(BOARD_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

/** `?fresh=1` skips restoring the browser draft (starts from sample / empty). */
export function shouldSkipDraftRestore(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("fresh") === "1";
  } catch {
    return false;
  }
}
