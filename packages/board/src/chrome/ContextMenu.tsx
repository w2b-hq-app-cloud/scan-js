// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

export function ContextMenu({
  x,
  y,
  onClose,
  nodeTitle,
  onDelete,
  onRename,
  onDuplicate,
  onConnect,
  onGroupBoundary,
}: {
  x: number;
  y: number;
  onClose: () => void;
  nodeTitle: string;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onConnect: () => void;
  onGroupBoundary: () => void;
}) {
  const items: { label: string; danger?: boolean; shortcut?: string; action?: () => void }[] = [
    { label: "Connect", action: onConnect },
    { label: "Rename", shortcut: "F2", action: onRename },
    { label: "Duplicate", shortcut: "Cmd+D", action: onDuplicate },
    { label: "Group into boundary", action: onGroupBoundary },
    { label: "Attach repository" },
    { label: "Add API contract" },
    { label: "Delete", danger: true, shortcut: "Backspace", action: onDelete },
  ];
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-56 overflow-hidden rounded-xl border border-border bg-popover node-shadow-lg"
        style={{ left: x, top: y }}
      >
        <div className="border-b border-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {nodeTitle}
        </div>
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => {
              if (it.action) {
                it.action();
              } else {
                onClose();
              }
            }}
            className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted ${
              it.danger ? "text-destructive" : ""
            }`}
          >
            {it.label}
            {it.shortcut && (
              <span className="text-[10px] text-muted-foreground">{it.shortcut}</span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
