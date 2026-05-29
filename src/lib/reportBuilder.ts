// Constrói o relatório final da missão a partir do estado do banco.

import { PHASES } from "./phases";
import { buildDataset } from "./seedDataset";
import { classifyBudget, classifyDetection, normalizeScore, SCORING } from "./scoring";

export interface ActionEntry {
  at: string;
  phase: number;
  kind: string;
  input: string;
  output: string;
}

export interface PhaseReport {
  number: number;
  technicalName: string;
  thematicName: string;
  enteredAt: string | null;
  exitedAt: string | null;
  context: string;
  objective: string;
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

export interface MissionReport {
  identification: {
    missionId: string;
    studentName: string | null;
    title: "Ground Station Compromise — Global Solution FIAP";
    discipline: "Offensive Security";
  };
  seed: string;
  domain: string;
  startedAt: string;
  endedAt: string | null;
  status: "in_progress" | "completed" | "aborted" | "incomplete";
  finalScore: number;
  rawScore: number;
  detection: { value: number; level: string };
  budget: { remaining: number; status: string };
  maxPhaseReached: number;
  actions: ActionEntry[];
  phases: PhaseReport[];
  flags: string[];
  techniquesDemonstrated: string[];
  techniquesMissed: string[];
  automaticRecommendations: string[];
  professorSummary: string;
  professorNotes: string;        // sempre vazio — campo para preenchimento manual
}

interface DbMission {
  id: string;
  seed: string;
  studentName: string | null;
  startedAt: Date;
  endedAt: Date | null;
  status: string;
  currentPhase: number;
  maxPhase: number;
  score: number;
  detection: number;
  budget: number;
  flags: string;
}
interface DbPhaseRun {
  phaseNumber: number;
  enteredAt: Date;
  exitedAt: Date | null;
  attempts: number;
  chosenOptionId: string | null;
  correct: boolean | null;
  justification: string | null;
  interpretationQ: string | null;
  interpretationA: string | null;
  scoreDelta: number;
  detectionDelta: number;
  budgetDelta: number;
}
interface DbAction {
  at: Date;
  phase: number;
  kind: string;
  input: string;
  output: string;
}
interface DbEvidence {
  phase: number;
  label: string;
  payload: string;
}

export function buildReport(
  mission: DbMission,
  runs: DbPhaseRun[],
  actions: DbAction[],
  evidences: DbEvidence[]
): MissionReport {
  const ds = buildDataset(mission.seed);
  const flags: string[] = JSON.parse(mission.flags || "[]");

  // Score normalizado
  let rawScore = mission.score;
  if (classifyDetection(mission.detection) === "stealth") rawScore += SCORING.stealthBonus;
  if (mission.budget < 0) rawScore += SCORING.budgetExhaustedPenalty;
  const finalScore = normalizeScore(rawScore);

  const phaseReports: PhaseReport[] = PHASES.map(p => {
    const run = runs.find(r => r.phaseNumber === p.number);
    const opt = run?.chosenOptionId ? p.options.find(o => o.id === run.chosenOptionId) : null;
    const evidencesForPhase = evidences
      .filter(e => e.phase === p.number)
      .map(e => ({ label: e.label, payload: safeParse(e.payload) }));
    const commandsConsulted = actions
      .filter(a => a.phase === p.number && a.kind === "terminal")
      .map(a => a.input);

    return {
      number: p.number,
      technicalName: p.technicalName,
      thematicName: p.thematicName,
      enteredAt: run?.enteredAt ? run.enteredAt.toISOString() : null,
      exitedAt: run?.exitedAt ? run.exitedAt.toISOString() : null,
      context: p.context(ds),
      objective: p.objective,
      attempts: run?.attempts ?? 0,
      chosenOptionId: run?.chosenOptionId ?? null,
      chosenOptionText: opt?.text ?? null,
      correct: run?.correct ?? null,
      alternativePath: Boolean(opt?.alternativePath),
      justificationRequired: Boolean(p.requiresJustification),
      justification: run?.justification ?? null,
      interpretationQuestion: p.interpretationQuestion ?? null,
      interpretationAnswer: run?.interpretationA ?? null,
      evidencesUnlocked: evidencesForPhase,
      scoreDelta: run?.scoreDelta ?? 0,
      detectionDelta: run?.detectionDelta ?? 0,
      budgetDelta: run?.budgetDelta ?? 0,
      techExplanation: p.techExplanation,
      commandsConsulted
    };
  });

  const completedNumbers = runs.filter(r => r.correct === true).map(r => r.phaseNumber);
  const techniquesDemonstrated = PHASES.filter(p => completedNumbers.includes(p.number)).map(
    p => p.technicalName
  );
  const techniquesMissed = PHASES.filter(p => !completedNumbers.includes(p.number)).map(
    p => p.technicalName
  );

  const recommendations: string[] = [];
  if (mission.detection >= SCORING.noisyThreshold) {
    recommendations.push(
      "Nível de detecção crítico: priorize técnicas stealth (AS-REP, Kerberoast, RBCD) sobre execução remota agressiva (psexec)."
    );
  }
  if (mission.budget < 20) {
    recommendations.push(
      "Orçamento operacional baixo: muitos comandos exploratórios. Planeje a coleta antes de executar."
    );
  }
  for (const run of runs) {
    if (run.correct === false) {
      const p = PHASES.find(x => x.number === run.phaseNumber);
      if (p) recommendations.push(`Revisar a fase ${p.number} (${p.technicalName}): opção incorreta escolhida.`);
    }
  }
  if (techniquesMissed.length > 0 && mission.status !== "completed") {
    recommendations.push(
      `Faltam demonstrações de: ${techniquesMissed.join(", ")}.`
    );
  }

  const professorSummary = [
    `Aluno${mission.studentName ? ` (${mission.studentName})` : ""} executou a missão na seed "${mission.seed}".`,
    `Status final: ${statusPt(mission.status)}.`,
    `Pontuação normalizada: ${finalScore.toFixed(1)}/10 (bruto: ${rawScore.toFixed(2)} / ${SCORING.rawScoreMax}).`,
    `Fase máxima alcançada: ${mission.maxPhase} de ${PHASES.length}.`,
    `Detecção: ${mission.detection.toFixed(1)} (${classifyDetection(mission.detection)}). Orçamento restante: ${mission.budget.toFixed(1)} (${classifyBudget(mission.budget)}).`,
    `Técnicas demonstradas: ${techniquesDemonstrated.length} de ${PHASES.length}.`
  ].join(" ");

  return {
    identification: {
      missionId: mission.id,
      studentName: mission.studentName,
      title: "Ground Station Compromise — Global Solution FIAP",
      discipline: "Offensive Security"
    },
    seed: mission.seed,
    domain: ds.domain,
    startedAt: mission.startedAt.toISOString(),
    endedAt: mission.endedAt ? mission.endedAt.toISOString() : null,
    status: mission.status as MissionReport["status"],
    finalScore,
    rawScore,
    detection: { value: Math.round(mission.detection * 10) / 10, level: classifyDetection(mission.detection) },
    budget: { remaining: Math.round(mission.budget * 10) / 10, status: classifyBudget(mission.budget) },
    maxPhaseReached: mission.maxPhase,
    actions: actions.map(a => ({
      at: a.at.toISOString(),
      phase: a.phase,
      kind: a.kind,
      input: a.input,
      output: a.output
    })),
    phases: phaseReports,
    flags,
    techniquesDemonstrated,
    techniquesMissed,
    automaticRecommendations: recommendations,
    professorSummary,
    professorNotes: ""
  };
}

function statusPt(status: string): string {
  switch (status) {
    case "completed":
      return "missão concluída";
    case "aborted":
      return "encerrada pelo aluno";
    case "incomplete":
      return "incompleta";
    default:
      return "em andamento";
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
