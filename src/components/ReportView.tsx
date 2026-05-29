"use client";

import type { MissionReport } from "@/lib/reportBuilder";

export function ReportView({ report }: { report: MissionReport }) {
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${report.identification.missionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPhases = 13;
  const completedCount = report.techniquesDemonstrated.length;

  return (
    <div className="report-page">
      <div className="report-toolbar no-print">
        <a className="btn" href="/">← início</a>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={downloadJson}>⬇ Baixar JSON</button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨 Imprimir / Salvar PDF (A4)
        </button>
      </div>

      {/* ─── COVER ─────────────────────────────────────────────────── */}
      <section className="report-cover">
        <div className="eyebrow">FIAP · Global Solution · {report.identification.discipline}</div>
        <h1>{report.identification.title}</h1>
        <div className="lede">Relatório de tentativa — emitido em {fmt(new Date().toISOString())}</div>

        <div className="report-meta-grid">
          <MetaCard label="Aluno" value={report.identification.studentName ?? "—"} />
          <MetaCard label="Seed (RM)" value={report.seed} mono />
          <MetaCard label="Domínio simulado" value={report.domain} mono />
          <MetaCard label="Mission ID" value={report.identification.missionId} mono small />
        </div>

        <div className="report-hero-stats">
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Nota final
            </div>
            <div className="report-score-big">{report.finalScore.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>/ 10.0 · bruto {report.rawScore.toFixed(2)}</div>
          </div>
          <div className="report-stat-grid">
            <Stat label="Status" value={statusLabel(report.status)} />
            <Stat label="Fase máxima" value={`${report.maxPhaseReached} / ${totalPhases}`} />
            <Stat label="Técnicas" value={`${completedCount} / ${totalPhases}`} />
            <Stat
              label="Detecção"
              value={`${report.detection.value} (${report.detection.level})`}
            />
            <Stat
              label="Orçamento"
              value={`${report.budget.remaining} (${report.budget.status})`}
            />
            <Stat label="Flags obtidas" value={String(report.flags.length)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 22, fontSize: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Início
            </div>
            <div style={{ color: "#e2e8f0", marginTop: 2 }}>{fmt(report.startedAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Encerramento
            </div>
            <div style={{ color: "#e2e8f0", marginTop: 2 }}>
              {report.endedAt ? fmt(report.endedAt) : "missão ainda em andamento"}
            </div>
          </div>
        </div>
      </section>

      {/* ─── RESUMO ────────────────────────────────────────────────── */}
      <section className="report-section">
        <h2>Resumo avaliativo</h2>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#cbd5e1" }}>
          {report.professorSummary}
        </p>
      </section>

      {/* ─── FLAGS ─────────────────────────────────────────────────── */}
      {report.flags.length > 0 && (
        <section className="report-section">
          <h2>Flags obtidas ({report.flags.length})</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
            {report.flags.map(f => (
              <li key={f} className="mono" style={{ fontSize: 12, color: "#5eead4" }}>
                ▸ {f}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── TÉCNICAS ──────────────────────────────────────────────── */}
      <section className="report-section">
        <h2>Técnicas — demonstradas vs faltantes</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <div>
            <div style={{ fontSize: 11, color: "#86efac", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              ✓ Demonstradas ({completedCount})
            </div>
            <div className="report-tag-row">
              {report.techniquesDemonstrated.length === 0
                ? <span style={{ color: "#64748b", fontSize: 12 }}>nenhuma</span>
                : report.techniquesDemonstrated.map(t => (
                  <span key={t} className="tag tag-ok">{t}</span>
                ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#fca5a5", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
              ✗ Não demonstradas ({report.techniquesMissed.length})
            </div>
            <div className="report-tag-row">
              {report.techniquesMissed.length === 0
                ? <span style={{ color: "#86efac", fontSize: 12 }}>todas demonstradas</span>
                : report.techniquesMissed.map(t => (
                  <span key={t} className="tag tag-danger">{t}</span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── RECOMENDAÇÕES ─────────────────────────────────────────── */}
      <section className="report-section">
        <h2>Recomendações automáticas</h2>
        {report.automaticRecommendations.length === 0 ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Nenhuma recomendação adicional gerada.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>
            {report.automaticRecommendations.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        )}
      </section>

      {/* ─── DETALHAMENTO POR FASE ─────────────────────────────────── */}
      <section className="report-section">
        <h2>Detalhamento por fase</h2>
        <div style={{ display: "grid", gap: 8 }}>
          {report.phases.map(p => (
            <PhaseCard key={p.number} phase={p} />
          ))}
        </div>
      </section>

      {/* ─── LOG CRONOLÓGICO ───────────────────────────────────────── */}
      <section className="report-section">
        <h2>Log cronológico ({report.actions.length} ações)</h2>
        {report.actions.length === 0 ? (
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Nenhuma ação registrada.</div>
        ) : (
          <table className="report-action-table">
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Quando</th>
                <th style={{ width: "8%" }}>Fase</th>
                <th style={{ width: "16%" }}>Tipo</th>
                <th>Entrada</th>
              </tr>
            </thead>
            <tbody>
              {report.actions.map((a, i) => (
                <tr key={i}>
                  <td>{fmt(a.at)}</td>
                  <td>F{a.phase}</td>
                  <td>{a.kind}</td>
                  <td className="mono">{a.input}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ─── NOTAS MANUAIS DO PROFESSOR ────────────────────────────── */}
      <section className="report-section">
        <h2>Observações manuais do professor</h2>
        <div className="report-notes-box">
          (campo livre para o professor preencher à mão na versão impressa
          ou anotar digitalmente no PDF)
        </div>
      </section>

      <footer className="report-footer">
        Ground Station Compromise · FIAP Offensive Security · Mission ID {report.identification.missionId}
      </footer>
    </div>
  );
}

/* ─── Helper components ──────────────────────────────────────────── */

function MetaCard({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="report-meta-card">
      <div className="lbl">{label}</div>
      <div className={`val ${mono ? "mono" : ""}`} style={small ? { fontSize: 11 } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-stat">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}

interface PhaseReportLite {
  number: number;
  technicalName: string;
  thematicName: string;
  enteredAt: string | null;
  exitedAt: string | null;
  attempts: number;
  chosenOptionId: string | null;
  chosenOptionText: string | null;
  correct: boolean | null;
  alternativePath: boolean;
  justificationRequired: boolean;
  justification: string | null;
  interpretationQuestion: string | null;
  interpretationAnswer: string | null;
  evidencesUnlocked: { label: string; payload: unknown }[];
  scoreDelta: number;
  detectionDelta: number;
  budgetDelta: number;
  techExplanation: string;
  commandsConsulted: string[];
}

function PhaseCard({ phase: p }: { phase: PhaseReportLite }) {
  return (
    <div className="report-phase">
      <div className="report-phase-head">
        <div>
          <div className="report-phase-title">F{p.number} · {p.technicalName}</div>
          <div className="report-phase-subtitle">{p.thematicName}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {p.correct === true && <span className="tag tag-ok">✓ acertou</span>}
          {p.correct === false && <span className="tag tag-danger">✗ errou</span>}
          {p.correct === null && <span className="tag tag-muted">não tentada</span>}
          {p.alternativePath && <span className="tag tag-warn">caminho alternativo</span>}
        </div>
      </div>

      <dl className="report-kv-grid">
        <dt>Entrou</dt>
        <dd>{p.enteredAt ? fmt(p.enteredAt) : "—"}</dd>
        <dt>Saiu</dt>
        <dd>{p.exitedAt ? fmt(p.exitedAt) : "—"}</dd>
        <dt>Tentativas</dt>
        <dd>{p.attempts}</dd>
        <dt>Opção escolhida</dt>
        <dd>
          {p.chosenOptionText
            ? <span className="mono" style={{ fontSize: 11 }}>{p.chosenOptionText}</span>
            : "—"}
        </dd>
        <dt>Δ Score · Detecção · Orçamento</dt>
        <dd className="mono">
          {sign(p.scoreDelta)} · {sign(p.detectionDelta)} · {sign(p.budgetDelta)}
        </dd>
      </dl>

      {p.justificationRequired && (
        <div className="report-subblock">
          <div className="label">Justificativa do aluno</div>
          <div>{p.justification ?? <em style={{ color: "#94a3b8" }}>não enviada</em>}</div>
        </div>
      )}

      {p.interpretationQuestion && (
        <div className="report-subblock">
          <div className="label">Pergunta interpretativa</div>
          <div style={{ fontStyle: "italic", color: "#94a3b8", marginBottom: 4 }}>{p.interpretationQuestion}</div>
          <div>
            <strong>R:</strong>{" "}
            {p.interpretationAnswer ?? <em style={{ color: "#94a3b8" }}>não respondida</em>}
          </div>
        </div>
      )}

      {p.commandsConsulted.length > 0 && (
        <div className="report-subblock">
          <div className="label">Comandos digitados no terminal ({p.commandsConsulted.length})</div>
          <ul className="mono" style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 11 }}>
            {p.commandsConsulted.slice(-10).map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      {p.evidencesUnlocked.length > 0 && (
        <div className="report-subblock">
          <div className="label">Evidências liberadas</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 16, fontSize: 12 }}>
            {p.evidencesUnlocked.map((e, i) => <li key={i}>{e.label}</li>)}
          </ul>
        </div>
      )}

      <div className="report-subblock">
        <div className="label">Explicação técnica</div>
        <div>{p.techExplanation}</div>
      </div>
    </div>
  );
}

/* ─── helpers ─── */

function sign(n: number): string {
  if (n > 0) return `+${n.toFixed(2)}`;
  return n.toFixed(2);
}

function fmt(s: string): string {
  try {
    const d = new Date(s);
    return d.toLocaleString("pt-BR");
  } catch {
    return s;
  }
}

function statusLabel(s: string): string {
  switch (s) {
    case "completed":
      return "✓ concluída";
    case "aborted":
      return "encerrada pelo aluno";
    case "incomplete":
      return "incompleta";
    default:
      return "em andamento";
  }
}
