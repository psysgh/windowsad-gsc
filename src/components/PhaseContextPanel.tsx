"use client";

import { PhaseIcon } from "./PhaseIcon";
import type { SerializedPhase } from "@/types/mission";

interface Props {
  phase: SerializedPhase;
}

export function PhaseContextPanel({ phase }: Props) {
  return (
    <div className="panel panel-elevated" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: "linear-gradient(135deg, #0e7490, #115e59)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid #134e4a"
          }}
        >
          <PhaseIcon phaseNumber={phase.number} size={22} />
        </div>
        <div>
          <div className="panel-title">Fase {phase.number} — {phase.technicalName}</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{phase.thematicName}</div>
        </div>
      </div>
      <div className="mission-context-body">
        {phase.context}
      </div>
      <div style={{ marginTop: 12, padding: "10px 12px", background: "#0a0f1c", borderRadius: 8, border: "1px dashed #1f2a3d" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>🎯 Objetivo</div>
        <div style={{ fontSize: 13, color: "#e2e8f0", marginTop: 2 }}>{phase.objective}</div>
      </div>
    </div>
  );
}
