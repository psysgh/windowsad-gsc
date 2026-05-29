import type { Dataset } from "../seedDataset";

export interface CommandOption {
  id: string;
  text: string;
  correct: boolean;
  alternativePath?: boolean;
  response: (ds: Dataset) => string;
  scoreDelta: number;
  detectionDelta: number;
  budgetDelta: number;
  unlockEvidences?: (ds: Dataset) => EvidenceTemplate[];
  flag?: (ds: Dataset) => string | null;
  finalPhase?: boolean;
}

export interface EvidenceTemplate {
  label: string;
  payload: unknown;
}

export interface PhaseDefinition {
  number: number;
  technicalName: string;
  thematicName: string;
  context: (ds: Dataset) => string;
  objective: string;
  evidencesOnEntry?: (ds: Dataset) => EvidenceTemplate[];
  expectedCommand: string;          // comando que dispara o modal de opções
  acceptedCommands?: string[];      // outros aliases que também disparam
  options: CommandOption[];
  requiresJustification?: boolean;
  interpretationQuestion?: string;
  techExplanation: string;
}
