"use client";

import type { SerializedAction } from "@/types/mission";

export function ActionHistoryPanel({ actions }: { actions: SerializedAction[] }) {
  const recent = actions.slice(-30).reverse();
  return (
    <div className="panel" style={{ padding: 14 }}>
      <div className="panel-title">Histórico de ações</div>
      {recent.length === 0 ? (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>Nenhuma ação registrada.</div>
      ) : (
        <ul style={{ marginTop: 8, display: "grid", gap: 4, maxHeight: 220, overflowY: "auto" }}>
          {recent.map(a => (
            <li key={a.id} className="mono" style={{ fontSize: 11, color: "#94a3b8" }}>
              <span style={{ color: "#64748b" }}>F{a.phase} · {new Date(a.at).toLocaleTimeString()}</span>{" "}
              <span style={{ color: a.kind === "option_choice" ? "#5eead4" : a.kind === "interpretation" ? "#fbbf24" : a.kind === "justification" ? "#a78bfa" : "#cbd5e1" }}>
                [{a.kind}]
              </span>{" "}
              <span style={{ color: "#e2e8f0" }}>{truncate(a.input, 60)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
