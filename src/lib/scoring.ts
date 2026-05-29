// Sistema de pontuação, detecção e orçamento.
// Customize aqui os impactos de cada tipo de ação.

export const SCORING = {
  initialBudget: 100,
  initialDetection: 0,
  // Custo de cada comando enviado ao terminal (mesmo que seja "help")
  perTerminalCommandBudget: -0.5,
  // Ruído mínimo por comando enviado
  perTerminalCommandDetection: 0.2,
  // Penalidades por input não reconhecido
  unknownCommandDetection: 1.5,
  unknownCommandBudget: -1.0,
  // Tentativa errada em fase
  wrongOptionScore: -0.5,
  wrongOptionDetection: 6,
  wrongOptionBudget: -8,
  // Threshold de detecção que marca o relatório como ruidoso
  noisyThreshold: 70,
  // Score bruto máximo esperado (usado para normalizar para 0-10)
  rawScoreMax: 18,
  // Bônus por encerrar com baixo nível de detecção
  stealthBonus: 0.5,
  // Penalidade por orçamento estourado
  budgetExhaustedPenalty: -1.0
};

export function normalizeScore(raw: number): number {
  const clamped = Math.max(0, Math.min(SCORING.rawScoreMax, raw));
  return Math.round((clamped / SCORING.rawScoreMax) * 100) / 10;
}

export function classifyDetection(detection: number): "stealth" | "moderate" | "noisy" | "burned" {
  if (detection < 20) return "stealth";
  if (detection < 50) return "moderate";
  if (detection < SCORING.noisyThreshold) return "noisy";
  return "burned";
}

export function classifyBudget(budget: number): "ok" | "low" | "exhausted" {
  if (budget > 30) return "ok";
  if (budget > 0) return "low";
  return "exhausted";
}
