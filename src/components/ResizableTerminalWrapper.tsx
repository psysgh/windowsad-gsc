"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "gs:termHeight";
const MIN_HEIGHT_PX = 240;
const MAX_HEIGHT_VH = 70;
const DEFAULT_HEIGHT_VH = 48;

/**
 * Envolve o terminal e permite ajuste manual da altura via drag
 * em uma barra visível na borda inferior. Persiste em localStorage
 * e respeita limites para não estourar a viewport.
 */
export function ResizableTerminalWrapper({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    let initial = Math.floor(window.innerHeight * (DEFAULT_HEIGHT_VH / 100));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const n = parseInt(saved, 10);
        if (Number.isFinite(n) && n >= MIN_HEIGHT_PX) {
          const max = Math.floor(window.innerHeight * (MAX_HEIGHT_VH / 100));
          initial = Math.min(n, max);
        }
      }
    } catch {}
    setHeight(initial);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = wrapperRef.current?.offsetHeight ?? MIN_HEIGHT_PX;
    const max = Math.floor(window.innerHeight * (MAX_HEIGHT_VH / 100));
    const handle = e.currentTarget;
    try { handle.setPointerCapture(e.pointerId); } catch {}
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => {
      const next = Math.max(MIN_HEIGHT_PX, Math.min(max, startH + (ev.clientY - startY)));
      setHeight(next);
    };
    const onUp = (ev: PointerEvent) => {
      try { handle.releasePointerCapture(ev.pointerId); } catch {}
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (wrapperRef.current) {
        try { localStorage.setItem(STORAGE_KEY, String(wrapperRef.current.offsetHeight)); } catch {}
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="terminal-resize"
      style={height ? { height } : undefined}
    >
      <div className="terminal-resize-inner">{children}</div>
      <div
        className="terminal-resize-grip"
        onPointerDown={onPointerDown}
        title="Arraste para redimensionar o terminal"
        aria-label="Arraste para redimensionar o terminal"
        role="separator"
      >
        <span aria-hidden="true">▬▬▬▬</span>
      </div>
    </div>
  );
}
