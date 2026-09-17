/**
 * Persist the open SCAN YAML across hard refresh until the user loads a
 * different document (import, New board, or POST /api/open-scan).
 */

export const BOARD_DRAFT_KEY = "scan.whiteboard.draftYaml";

const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const MAX_YAML_CHARS = 1_500_000;

export type BoardDraft = {
  yaml: string;
  updatedAt: number;
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function normalizeScanYaml(yaml: string): string {
  return yaml.replace(/\r\n/g, "\n").trim();
}

export function readBoardDraft(): BoardDraft | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(BOARD_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BoardDraft>;
    if (typeof parsed.yaml !== "string" || typeof parsed.updatedAt !== "number") {
      window.localStorage.removeItem(BOARD_DRAFT_KEY);
      return null;
    }
    if (Date.now() - parsed.updatedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(BOARD_DRAFT_KEY);
      return null;
    }
    if (parsed.yaml.length > MAX_YAML_CHARS) {
      window.localStorage.removeItem(BOARD_DRAFT_KEY);
      return null;
    }
    return { yaml: parsed.yaml, updatedAt: parsed.updatedAt };
  } catch {
    try {
      window.localStorage.removeItem(BOARD_DRAFT_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeBoardDraft(yaml: string): void {
  if (!canUseStorage()) return;
  const normalized = normalizeScanYaml(yaml);
  if (!normalized || normalized.length > MAX_YAML_CHARS) return;
  try {
    const draft: BoardDraft = { yaml: normalized, updatedAt: Date.now() };
    window.localStorage.setItem(BOARD_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function clearBoardDraft(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(BOARD_DRAFT_KEY);
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
