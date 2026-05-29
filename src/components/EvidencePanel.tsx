"use client";

import { useState } from "react";
import type { SerializedEvidence } from "@/types/mission";

export function EvidencePanel({ evidences }: { evidences: SerializedEvidence[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="panel" style={{ padding: 14 }}>
      <div className="panel-title">Evidências coletadas ({evidences.length})</div>
      {evidences.length === 0 ? (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
          Nenhuma evidência liberada ainda. Cada acerto em fase libera evidências aqui.
        </div>
      ) : (
        <ul style={{ marginTop: 8, display: "grid", gap: 6 }}>
          {evidences.map(e => (
            <li key={e.id} style={{ background: "#0a0f1c", borderRadius: 6, border: "1px solid #1f2a3d" }}>
              <button
                onClick={() => setOpen(open === e.id ? null : e.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  color: "#e2e8f0",
                  cursor: "pointer",
                  fontSize: 12
                }}
              >
                <span className="tag tag-muted" style={{ marginRight: 8 }}>F{e.phase}</span>
                {e.label}
              </button>
              {open === e.id && (
                <pre className="mono" style={{ margin: 0, padding: "8px 10px", fontSize: 11, color: "#94a3b8", background: "#050810", borderTop: "1px solid #1f2a3d", overflowX: "auto" }}>
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
