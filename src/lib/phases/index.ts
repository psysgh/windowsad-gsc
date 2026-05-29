import { Rng } from "../prng";
import { phase01 } from "./01-initial-access";
import { phase02 } from "./02-domain-enum";
import { phase03 } from "./03-user-group-discovery";
import { phase04 } from "./04-service-account-discovery";
import { phase05 } from "./05-asrep-roasting";
import { phase06 } from "./06-kerberoasting";
import { phase07 } from "./07-credential-cracking";
import { phase08 } from "./08-acl-abuse";
import { phase09 } from "./09-delegation-abuse";
import { phase10 } from "./10-lateral-movement";
import { phase11 } from "./11-dcsync";
import { phase12 } from "./12-golden-ticket";
import { phase13 } from "./13-impact";
import type { CommandOption, PhaseDefinition } from "./types";

export const PHASES: PhaseDefinition[] = [
  phase01,
  phase02,
  phase03,
  phase04,
  phase05,
  phase06,
  phase07,
  phase08,
  phase09,
  phase10,
  phase11,
  phase12,
  phase13
];

export function getPhase(n: number): PhaseDefinition | undefined {
  return PHASES.find(p => p.number === n);
}

/**
 * Reordena as opções de uma fase de forma determinística a partir
 * da seed da missão. A opção correta deixa de cair sempre em "A",
 * mas a mesma seed sempre produz a mesma ordem — o professor pode
 * reproduzir a tela exata do aluno repetindo a seed (RM).
 */
export function getShuffledOptions(phase: PhaseDefinition, seed: string): CommandOption[] {
  const rng = new Rng(`gso|${seed}|p${phase.number}`);
  return rng.shuffle(phase.options);
}

export type { PhaseDefinition } from "./types";
