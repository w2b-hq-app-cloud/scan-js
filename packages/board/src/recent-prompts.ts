// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { recentPrompts as seedRecentPrompts } from "./chrome-data";

export const RECENT_PROMPTS_KEY = "scan.board.recentPrompts";
export const MAX_RECENT_PROMPTS = 8;

export function readStoredRecentPrompts(): string[] {
  if (typeof window === "undefined") return [...seedRecentPrompts];
  try {
    const raw = window.localStorage.getItem(RECENT_PROMPTS_KEY);
    if (!raw) return [...seedRecentPrompts];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...seedRecentPrompts];
    const cleaned = parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => item.trim())
      .slice(0, MAX_RECENT_PROMPTS);
    return cleaned.length ? cleaned : [...seedRecentPrompts];
  } catch {
    return [...seedRecentPrompts];
  }
}

export function rememberRecentPrompt(previous: string[], message: string): string[] {
  const trimmed = message.trim();
  if (!trimmed) return previous;
  const next = [trimmed, ...previous.filter((item) => item !== trimmed)].slice(
    0,
    MAX_RECENT_PROMPTS,
  );
  try {
    window.localStorage.setItem(RECENT_PROMPTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}
