"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal, type TerminalLine } from "@/components/Terminal";
import { StatusBar } from "@/components/StatusBar";
import { PhaseContextPanel } from "@/components/PhaseContextPanel";
import { EvidencePanel } from "@/components/EvidencePanel";
import { ActionHistoryPanel } from "@/components/ActionHistoryPanel";
import { CommandOptionsModal } from "@/components/CommandOptionsModal";
import { TextInputModal } from "@/components/TextInputModal";
import { PhaseTrail } from "@/components/PhaseTrail";
import { ResizableTerminalWrapper } from "@/components/ResizableTerminalWrapper";
import { classifyBudget, classifyDetection, normalizeScore } from "@/lib/scoring";
import type { SerializedAction, SerializedEvidence, SerializedPhase, SerializedPhaseRun } from "@/types/mission";

interface MissionPayload {
  id: string;
  seed: string;
  studentName: string | null;
  status: "in_progress" | "completed" | "aborted" | "incomplete";
  startedAt: string;
  endedAt: string | null;
  currentPhase: number;
  maxPhase: number;
  score: number;
  detection: number;
  budget: number;
  flags: string[];
  dataset: {
    domain: string;
    netbios: string;
    initialUser: { username: string };
  };
  phase: SerializedPhase;
  phaseRuns: SerializedPhaseRun[];
  evidences: SerializedEvidence[];
  actions: SerializedAction[];
}

export function MissionClient({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [mission, setMission] = useState<MissionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [optionsModal, setOptionsModal] = useState<{ command: string; options: { id: string; text: string }[]; revisit: boolean } | null>(null);
  const [justificationOpen, setJustificationOpen] = useState(false);
  const [interpretationOpen, setInterpretationOpen] = useState(false);
  const [outcome, setOutcome] = useState<{
    correct: boolean;
    response: string;
    requiresJustification: boolean;
    requiresInterpretation: boolean;
    techExplanation: string | null;
    flag: string | null;
    finalPhase: boolean;
  } | null>(null);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/missions/${missionId}`, { cache: "no-store" });
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data: MissionPayload = await res.json();
    setMission(data);
    setLoading(false);
    return data;
  }, [missionId, router]);

  useEffect(() => {
    fetchState().then(data => {
      if (data) {
        try { localStorage.setItem("gs:lastMission", data.id); } catch {}
        if (lines.length === 0) {
          setLines([
            { kind: "sys", text: `[*] Estabelecendo sessão em ${data.dataset.netbios}\\${data.dataset.initialUser.username}@${data.dataset.domain}` },
            { kind: "sys", text: `[*] Console operacional de Red Team — modo educacional.` },
            { kind: "sys", text: `[*] Fase ${data.phase.number}: ${data.phase.technicalName}` },
            { kind: "sys", text: `[*] Digite 'help' para a lista de comandos. Boa caçada.` }
          ]);
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runForCurrent = useMemo(() => {
    if (!mission) return null;
    return mission.phaseRuns.find(r => r.phaseNumber === mission.currentPhase) ?? null;
  }, [mission]);

  // Determine if we can advance
  const canAdvance = useMemo(() => {
    if (!mission || !runForCurrent) return false;
    if (runForCurrent.correct !== true) return false;
    if (mission.phase.requiresJustification && !runForCurrent.justification) return false;
    if (mission.phase.interpretationQuestion && !runForCurrent.interpretationA) return false;
    return true;
  }, [mission, runForCurrent]);

  async function handleTerminal(input: string) {
    if (!mission) return;
    setBusy(true);
    setLines(l => [...l, { prompt: prompt(mission), text: input, kind: "echo" }]);

    if (/^clear$/i.test(input)) {
      setLines([]);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`/api/missions/${missionId}/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!res.ok) {
        setLines(l => [...l, { kind: "err", text: data.error || "erro" }]);
        return;
      }

      if (data.kind === "clear") {
        setLines([]);
      } else if (data.kind === "status") {
        const det = classifyDetection(data.state.detection);
        const bud = classifyBudget(data.state.budget);
        const ns = normalizeScore(data.state.score);
        setLines(l => [
          ...l,
          { kind: "sys", text: `Fase ${mission.currentPhase}/13 · score ${ns.toFixed(1)} · detecção ${data.state.detection.toFixed(1)} (${det}) · orçamento ${data.state.budget.toFixed(1)} (${bud})` }
        ]);
      } else if (data.kind === "evidence") {
        if (mission.evidences.length === 0) {
          setLines(l => [...l, { kind: "sys", text: "Nenhuma evidência liberada ainda." }]);
        } else {
          const text = mission.evidences.map(e => `[F${e.phase}] ${e.label}`).join("\n");
          setLines(l => [...l, { kind: "sys", text }]);
        }
      } else if (data.kind === "options_request") {
        if (data.revisit) {
          setLines(l => [
            ...l,
            { kind: "sys", text: "[*] Reabrindo opções da fase — reconsulta sem custo." }
          ]);
        }
        setOptionsModal({
          command: extractCmd(input),
          options: data.options,
          revisit: Boolean(data.revisit)
        });
      } else if (data.kind === "unknown") {
        setLines(l => [...l, { kind: "err", text: data.output }]);
      } else {
        if (data.output) setLines(l => [...l, { kind: "out", text: data.output }]);
      }

      // Refresh state lightly: update mission detection/budget locally; re-fetch on relevant changes
      setMission(m => (m ? { ...m, detection: data.state.detection, budget: data.state.budget } : m));
    } finally {
      setBusy(false);
    }
  }

  async function chooseOption(optionId: string) {
    if (!mission || !optionsModal) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "choose_option", optionId })
      });
      const data = await res.json();
      setOptionsModal(null);
      if (!res.ok) {
        setLines(l => [...l, { kind: "err", text: data.error || "erro" }]);
        return;
      }
      setLines(l => [
        ...l,
        { kind: "sys", text: `[escolha] opção ${optionId.toUpperCase()}` },
        { kind: data.correct ? "ok" : "err", text: data.response }
      ]);
      setOutcome({
        correct: data.correct,
        response: data.response,
        requiresJustification: data.requiresJustification,
        requiresInterpretation: data.requiresInterpretation,
        techExplanation: data.techExplanation,
        flag: data.flag,
        finalPhase: data.finalPhase
      });
      if (data.flag) {
        setLines(l => [...l, { kind: "ok", text: `[flag] ${data.flag}` }]);
      }
      if (data.correct && data.techExplanation) {
        setLines(l => [...l, { kind: "sys", text: `[explicação] ${data.techExplanation}` }]);
      }
      await fetchState();
      if (data.requiresJustification) setJustificationOpen(true);
      else if (data.requiresInterpretation) setInterpretationOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function submitJustification(text: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_justification", justification: text })
      });
      const data = await res.json();
      if (!res.ok) {
        setLines(l => [...l, { kind: "err", text: data.error || "erro" }]);
        return;
      }
      setLines(l => [...l, { kind: "sys", text: "[justificativa registrada]" }]);
      setJustificationOpen(false);
      await fetchState();
      if (mission?.phase.interpretationQuestion) {
        setInterpretationOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitInterpretation(text: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit_interpretation", interpretation: text })
      });
      const data = await res.json();
      if (!res.ok) {
        setLines(l => [...l, { kind: "err", text: data.error || "erro" }]);
        return;
      }
      setLines(l => [...l, { kind: "sys", text: "[resposta interpretativa registrada]" }]);
      setInterpretationOpen(false);
      await fetchState();
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    setBusy(true);
    try {
      const res = await fetch(`/api/missions/${missionId}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "advance" })
      });
      const data = await res.json();
      if (!res.ok) {
        setLines(l => [...l, { kind: "err", text: data.error || "erro" }]);
        return;
      }
      const fresh = await fetchState();
      setOutcome(null);
      if (data.completed) {
        setLines(l => [
          ...l,
          { kind: "ok", text: "[+] Missão concluída. Use 'Exportar relatório' acima." }
        ]);
      } else if (fresh) {
        setLines(l => [
          ...l,
          { kind: "sys", text: `[*] Avançando para fase ${data.nextPhase}: ${fresh.phase.technicalName}` }
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function abort() {
    if (!confirm("Encerrar a missão agora e abrir o relatório?")) return;
    await fetch(`/api/missions/${missionId}`, { method: "DELETE" });
    window.open(`/mission/${missionId}/report`, "_blank");
    await fetchState();
  }

  if (loading || !mission) {
    return (
      <div style={{ padding: 32, color: "#94a3b8" }}>Carregando missão...</div>
    );
  }

  return (
    <div className="mission-shell">
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Ground Station Compromise</div>
          <div style={{ fontSize: 11, color: "#64748b" }} className="mono">
            {mission.dataset.domain} · {mission.studentName ?? "aluno não identificado"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <a className="btn" href={`/mission/${missionId}/report`} target="_blank" rel="noreferrer">
            Exportar relatório
          </a>
          <button className="btn btn-danger" onClick={abort}>
            Encerrar missão e exportar relatório
          </button>
        </div>
      </header>

      <div style={{ flexShrink: 0 }}>
        <StatusBar
          currentPhase={mission.currentPhase}
          maxPhase={mission.maxPhase}
          score={mission.score}
          detection={mission.detection}
          budget={mission.budget}
          status={mission.status}
        />
      </div>

      <div style={{ flexShrink: 0 }}>
        <PhaseTrail current={mission.currentPhase} total={13} />
      </div>

      <div className="mission-main grow">
        <div className="mission-left">
          <PhaseContextPanel phase={mission.phase} />

          <ResizableTerminalWrapper>
            <Terminal
              prompt={prompt(mission)}
              lines={lines}
              onSubmit={handleTerminal}
              busy={busy}
            />
          </ResizableTerminalWrapper>

          <div className="panel" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {runForCurrent?.correct === true ? "Fase resolvida." : "Fase em andamento."}
              {mission.phase.requiresJustification && (
                <span style={{ marginLeft: 8 }}>
                  Justificativa:{" "}
                  <span className={runForCurrent?.justification ? "tag tag-ok" : "tag tag-warn"}>
                    {runForCurrent?.justification ? "ok" : "pendente"}
                  </span>
                </span>
              )}
              {mission.phase.interpretationQuestion && (
                <span style={{ marginLeft: 8 }}>
                  Interpretação:{" "}
                  <span className={runForCurrent?.interpretationA ? "tag tag-ok" : "tag tag-warn"}>
                    {runForCurrent?.interpretationA ? "ok" : "pendente"}
                  </span>
                </span>
              )}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {mission.phase.requiresJustification && runForCurrent?.correct && !runForCurrent.justification && (
                <button className="btn" onClick={() => setJustificationOpen(true)}>Registrar justificativa</button>
              )}
              {mission.phase.interpretationQuestion && runForCurrent?.correct && !runForCurrent.interpretationA && (
                <button className="btn" onClick={() => setInterpretationOpen(true)}>Responder pergunta</button>
              )}
              {canAdvance && <span className="ready-badge">pronto para avançar</span>}
              <button
                className={`btn btn-primary ${canAdvance ? "btn-advance-ready" : ""}`}
                disabled={!canAdvance || busy}
                onClick={advance}
              >
                Avançar fase <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>

        <aside className="mission-aside">
          <EvidencePanel evidences={mission.evidences} />
          <ActionHistoryPanel actions={mission.actions} />
          {mission.flags.length > 0 && (
            <div className="panel" style={{ padding: 14 }}>
              <div className="panel-title">Flags obtidas ({mission.flags.length})</div>
              <ul style={{ marginTop: 8, display: "grid", gap: 4 }}>
                {mission.flags.map(f => (
                  <li key={f} className="mono" style={{ fontSize: 11, color: "#5eead4" }}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {optionsModal && (
        <CommandOptionsModal
          command={optionsModal.command}
          options={optionsModal.options}
          revisit={optionsModal.revisit}
          onChoose={chooseOption}
          onClose={() => setOptionsModal(null)}
          busy={busy}
        />
      )}

      {justificationOpen && mission.phase.requiresJustification && (
        <TextInputModal
          title={`Justificativa — Fase ${mission.phase.number}`}
          description={`Explique tecnicamente, em pelo menos 30 caracteres, por que você escolheu esta técnica. Sua resposta entra no relatório que o professor vai corrigir.`}
          minLength={30}
          placeholder="Ex.: Optei por GetNPUsers com -no-pass porque a conta tem DONT_REQ_PREAUTH e..."
          busy={busy}
          onSubmit={submitJustification}
          onClose={() => setJustificationOpen(false)}
          closable
        />
      )}

      {interpretationOpen && mission.phase.interpretationQuestion && (
        <TextInputModal
          title={`Pergunta — Fase ${mission.phase.number}`}
          description={mission.phase.interpretationQuestion}
          minLength={20}
          placeholder="Sua resposta..."
          busy={busy}
          onSubmit={submitInterpretation}
          onClose={() => setInterpretationOpen(false)}
          closable
        />
      )}
    </div>
  );
}

function prompt(m: { dataset: { netbios: string; initialUser: { username: string } } }): string {
  return `${m.dataset.netbios}\\${m.dataset.initialUser.username}>`;
}

function extractCmd(s: string): string {
  return s.trim().split(/\s+/)[0];
}
