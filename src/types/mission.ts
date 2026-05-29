import type { Dataset } from "@/lib/seedDataset";
import type { PhaseDefinition } from "@/lib/phases/types";

export interface MissionState {
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
  dataset: Dataset;
  phase: SerializedPhase;
  phaseRuns: SerializedPhaseRun[];
  evidences: SerializedEvidence[];
  actions: SerializedAction[];
}

export interface SerializedPhase {
  number: number;
  technicalName: string;
  thematicName: string;
  objective: string;
  context: string;
  expectedCommand: string;
  techExplanation: string;
  requiresJustification: boolean;
  interpretationQuestion: string | null;
}

export interface SerializedPhaseOption {
  id: string;
  text: string;
}
export interface SerializedPhaseRun {
  phaseNumber: number;
  enteredAt: string;
  exitedAt: string | null;
  attempts: number;
  chosenOptionId: string | null;
  correct: boolean | null;
  justification: string | null;
  interpretationA: string | null;
  scoreDelta: number;
  detectionDelta: number;
  budgetDelta: number;
}
export interface SerializedEvidence {
  id: string;
  phase: number;
  label: string;
  payload: unknown;
  unlockedAt: string;
}
export interface SerializedAction {
  id: string;
  at: string;
  phase: number;
  kind: string;
  input: string;
  output: string;
}

export function serializePhase(p: PhaseDefinition, ds: Dataset): SerializedPhase {
  return {
    number: p.number,
    technicalName: p.technicalName,
    thematicName: p.thematicName,
    objective: p.objective,
    context: p.context(ds),
    expectedCommand: p.expectedCommand,
    techExplanation: p.techExplanation,
    requiresJustification: Boolean(p.requiresJustification),
    interpretationQuestion: p.interpretationQuestion ?? null
  };
}
