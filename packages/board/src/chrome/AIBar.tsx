// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import { useRef } from "react";
import { History as HistoryIcon, Mic, Paperclip, Send, Sparkles } from "lucide-react";
import type { BoardAiAttachment } from "../board-types";
import { IconBtn } from "../ui/IconBtn";

export function AiOrb() {
  return <div className="ai-orb-minimal h-7 w-7 rounded-full" />;
}


export function AIBar({
  prompt,
  setPrompt,
  onSubmit,
  busy = false,
  recording = false,
  voiceEnabled = false,
  onToggleVoice,
  suggestions,
  recent,
  attachments,
  onAttachFiles,
  onRemoveAttachment,
  menuOpen,
  onMenuOpenChange,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  recording?: boolean;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  suggestions: string[];
  recent: string[];
  attachments: BoardAiAttachment[];
  onAttachFiles: (files: FileList | null) => void;
  onRemoveAttachment: (name: string) => void;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}) {
  const attachInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputLocked = busy || recording;
  const voiceLabel = !voiceEnabled
    ? "Voice input unavailable"
    : recording
      ? "Stop recording"
      : busy
        ? "Voice input busy"
        : "Voice input";
  return (
    <div className="relative z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className={`mx-auto flex w-full max-w-5xl items-center gap-2 px-4 ${attachments.length ? "pb-10 pt-3" : "py-3"}`}>
        <div className="relative flex flex-1 items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 node-shadow focus-within:ring-2 focus-within:ring-primary/30">
          <Sparkles className="h-4 w-4 text-primary" />

          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => onMenuOpenChange(true)}
            onBlur={() => setTimeout(() => onMenuOpenChange(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && prompt.trim() && !inputLocked) {
                onMenuOpenChange(false);
                inputRef.current?.blur();
                onSubmit();
              }
              if (e.key === "Escape") {
                onMenuOpenChange(false);
                inputRef.current?.blur();
              }
            }}
            disabled={inputLocked}
            placeholder={
              recording
                ? "Listening… click the mic to stop"
                : "Ask Sphere to design or modify this architecture..."
            }
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
          />
          <IconBtn
            label="Attach reference"
            onClick={() => attachInputRef.current?.click()}
            disabled={inputLocked}
          >
            <Paperclip className="h-4 w-4" />
          </IconBtn>
          <input
            ref={attachInputRef}
            type="file"
            accept=".txt,.md,.png,.jpg,.jpeg,text/plain,text/markdown,image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => {
              onAttachFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <IconBtn
            label={voiceLabel}
            onClick={onToggleVoice}
            active={recording}
            danger={recording}
            disabled={!voiceEnabled || (busy && !recording)}
          >
            <Mic className={`h-4 w-4 ${recording ? "text-red-500" : ""}`} />
          </IconBtn>
          <button
            onClick={() => {
              if (!prompt.trim() || inputLocked) return;
              onMenuOpenChange(false);
              inputRef.current?.blur();
              onSubmit();
            }}
            disabled={inputLocked || !prompt.trim()}
            className="ml-1 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {busy ? "Thinking…" : "Send"}
          </button>

          {attachments.length > 0 && (
            <div className="absolute -bottom-9 left-2 right-2 flex flex-wrap gap-1">
              {attachments.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => onRemoveAttachment(file.name)}
                  className="max-w-[220px] truncate rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  title={`Remove ${file.name}`}
                >
                  {file.kind === "image" ? "img" : "doc"}: {file.name} ×
                </button>
              ))}
            </div>
          )}

          {menuOpen && (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg">
              <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Suggested commands
              </div>
              <div className="max-h-60 overflow-auto py-1">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onMouseDown={() => setPrompt(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {s}
                  </button>
                ))}
              </div>
              <div className="border-t border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </div>
              <div className="pb-2">
                {recent.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No recent prompts yet</div>
                ) : (
                  recent.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => setPrompt(s)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
                    >
                      <HistoryIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{s}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------- VIEW TABS ------------------------- */

