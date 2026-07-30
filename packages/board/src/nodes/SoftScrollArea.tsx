// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type PointerEvent,
  type WheelEvent,
} from "react";

export function SoftScrollArea({
  className,
  children,
  onPointerDown,
  onWheel,
}: {
  className?: string;
  children: ReactNode;
  onPointerDown?: (e: PointerEvent) => void;
  onWheel?: (e: WheelEvent) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, height: 0, show: false, needed: false });
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncThumb = useCallback((flash: boolean) => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const needed = scrollHeight > clientHeight + 1;
    if (!needed) {
      setThumb({ top: 0, height: 0, show: false, needed: false });
      return;
    }
    const height = Math.max(18, (clientHeight / scrollHeight) * clientHeight);
    const maxTop = Math.max(0, clientHeight - height);
    const top =
      maxTop === 0 ? 0 : (scrollTop / (scrollHeight - clientHeight)) * maxTop;
    setThumb((t) => ({
      top,
      height,
      needed: true,
      show: flash ? true : t.show,
    }));
    if (flash) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setThumb((t) => ({ ...t, show: false }));
      }, 900);
    }
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const run = () => syncThumb(false);
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    const content = el.firstElementChild;
    if (content) ro.observe(content);
    return () => {
      ro.disconnect();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [syncThumb, children]);

  return (
    <div
      className={`relative min-h-0 overflow-hidden ${className ?? ""}`}
      onMouseEnter={() => syncThumb(true)}
    >
      <div
        ref={scrollerRef}
        tabIndex={-1}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain outline-none focus:outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={onPointerDown}
        onWheel={onWheel}
        onScroll={() => syncThumb(true)}
      >
        {children}
      </div>
      {thumb.needed && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-1 right-0.5 z-[2] w-[3px]"
        >
          <div
            className="absolute left-0 w-full rounded-full bg-foreground/35 transition-opacity duration-300 ease-out"
            style={{
              height: thumb.height,
              transform: `translateY(${thumb.top}px)`,
              opacity: thumb.show ? 1 : 0,
            }}
          />
        </div>
      )}
    </div>
  );
}

