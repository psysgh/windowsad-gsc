"use client";

import { classifyBudget, classifyDetection, normalizeScore } from "@/lib/scoring";

interface Props {
  currentPhase: number;
  maxPhase: number;
  score: number;
  detection: number;
  budget: number;
  status: string;
}

export function StatusBar({ currentPhase, maxPhase, score, detection, budget, status }: Props) {
  const det = classifyDetection(detection);
  const bud = classifyBudget(budget);
  const normScore = normalizeScore(score);
  return (
    <div className="panel" style={{ padding: 12, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <Metric label="Fase" value={`${currentPhase} / 13`} sub={`máx alcançada: ${maxPhase}`} />
      <Metric label="Pontuação" value={normScore.toFixed(1)} sub={`bruto: ${score.toFixed(2)}`} />
      <Metric
        label="Detecção"
        value={detection.toFixed(1)}
        sub={det}
        accent={det === "stealth" ? "ok" : det === "moderate" ? "warn" : "danger"}
      />
      <Metric
        label="Orçamento"
        value={budget.toFixed(1)}
        sub={bud}
        accent={bud === "ok" ? "ok" : bud === "low" ? "warn" : "danger"}
      />
      <div style={{ marginLeft: "auto" }}>
        <span
          className={`tag ${status === "in_progress" ? "tag-ok" : status === "completed" ? "tag-ok" : "tag-warn"}`}
        >
          {status === "in_progress" ? "em progresso" : status === "completed" ? "concluída" : status === "aborted" ? "encerrada" : status}
        </span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  accent
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "ok" | "warn" | "danger";
}) {
  const color = accent === "ok" ? "#4ade80" : accent === "warn" ? "#fbbf24" : accent === "danger" ? "#f87171" : "#e2e8f0";
  return (
    <div style={{ minWidth: 110 }}>
      <div className="panel-title">{label}</div>
      <div className="mono" style={{ fontSize: 18, color, marginTop: 2, fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#64748b" }}>{sub}</div>}
    </div>
  );
}
