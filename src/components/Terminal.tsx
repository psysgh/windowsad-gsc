"use client";

import { useEffect, useRef, useState } from "react";

export interface TerminalLine {
  prompt?: string;
  text: string;
  kind?: "echo" | "out" | "err" | "ok" | "sys";
}

interface Props {
  prompt: string;
  lines: TerminalLine[];
  onSubmit: (input: string) => Promise<void> | void;
  busy?: boolean;
  placeholder?: string;
}

export function Terminal({ prompt, lines, onSubmit, busy, placeholder }: Props) {
  const [value, setValue] = useState("");
  const histRef = useRef<HTMLDivElement>(null);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [histPos, setHistPos] = useState<number>(-1);

  useEffect(() => {
    if (histRef.current) histRef.current.scrollTop = histRef.current.scrollHeight;
  }, [lines]);

  async function submit() {
    const v = value.trim();
    if (!v || busy) return;
    setHistoryStack(s => [...s, v]);
    setHistPos(-1);
    setValue("");
    await onSubmit(v);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyStack.length === 0) return;
      const next = histPos < 0 ? historyStack.length - 1 : Math.max(0, histPos - 1);
      setHistPos(next);
      setValue(historyStack[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histPos < 0) return;
      const next = histPos + 1;
      if (next >= historyStack.length) {
        setHistPos(-1);
        setValue("");
      } else {
        setHistPos(next);
        setValue(historyStack[next]);
      }
    }
  }

  return (
    <div className="terminal">
      <div className="terminal-chrome">
        <div className="dots">
          <span className="dot r" />
          <span className="dot y" />
          <span className="dot g" />
        </div>
        <span className="mono">ops-console · {prompt.replace(/>\s*$/, "")}</span>
        <span style={{ fontSize: 10 }}>educacional</span>
      </div>
      <div ref={histRef} className="term-history">
        {lines.map((l, i) => (
          <div key={i}>
            {l.prompt && <span className="prompt">{l.prompt} </span>}
            <span
              className={
                l.kind === "echo"
                  ? "echo"
                  : l.kind === "err"
                    ? "err"
                    : l.kind === "ok"
                      ? "ok"
                      : ""
              }
            >
              {l.text}
            </span>
          </div>
        ))}
        {busy && <div style={{ color: "#64748b" }}>...</div>}
      </div>
      <div className="term-input-row">
        <span className="mono prompt" style={{ color: "#5eead4" }}>{prompt}</span>
        <input
          autoFocus
          spellCheck={false}
          autoComplete="off"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder || "digite 'help' para começar"}
          disabled={busy}
        />
        {!busy && !value && <span className="term-cursor" />}
      </div>
    </div>
  );
}
