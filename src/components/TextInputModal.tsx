"use client";

import { useState } from "react";

interface Props {
  title: string;
  description: string;
  minLength: number;
  placeholder?: string;
  busy?: boolean;
  onSubmit: (text: string) => Promise<void> | void;
  onClose?: () => void;
  closable?: boolean;
}

export function TextInputModal({
  title,
  description,
  minLength,
  placeholder,
  busy,
  onSubmit,
  onClose,
  closable
}: Props) {
  const [text, setText] = useState("");
  const valid = text.trim().length >= minLength;
  return (
    <div className="modal-backdrop" onClick={() => closable && onClose && onClose()}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="panel-title">{title}</div>
        <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 6, lineHeight: 1.5 }}>{description}</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={placeholder}
          rows={6}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 10,
            background: "#0a0f1c",
            color: "#e2e8f0",
            border: "1px solid #1f2a3d",
            borderRadius: 6,
            fontSize: 13,
            resize: "vertical"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <span style={{ fontSize: 11, color: valid ? "#86efac" : "#94a3b8" }}>
            {text.trim().length} / mín. {minLength} caracteres
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {closable && (
              <button className="btn btn-ghost" onClick={onClose} disabled={busy}>cancelar</button>
            )}
            <button
              className="btn btn-primary"
              disabled={!valid || busy}
              onClick={() => onSubmit(text.trim())}
            >
              {busy ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
