import { formatHelp, listKnownCommands, resolveCommand } from "./commandHelp";
import type { PhaseDefinition } from "./phases/types";
import type { Dataset } from "./seedDataset";

export type TerminalAction =
  | { type: "text"; output: string }
  | { type: "clear" }
  | { type: "status" }
  | { type: "evidence" }
  | { type: "phase_command"; command: string }
  | { type: "unknown" };

export interface TerminalResult {
  action: TerminalAction;
  cost: { detection: number; budget: number };
}

function manTopic(topic: string): string | null {
  const entry = resolveCommand(topic);
  if (!entry) return null;
  return formatHelp(entry);
}

export function processTerminalInput(
  rawInput: string,
  phase: PhaseDefinition,
  dataset: Dataset
): TerminalResult {
  const input = rawInput.trim();
  if (!input) {
    return { action: { type: "text", output: "" }, cost: { detection: 0, budget: 0 } };
  }

  // help
  if (/^help$/i.test(input)) {
    const lines = [
      "Comandos do console operacional (educacional):",
      "",
      "  help                 — esta ajuda",
      "  clear                — limpa o histórico do terminal",
      "  status               — pontuação, detecção, orçamento, fase",
      "  evidence             — evidências coletadas até o momento",
      "  man <comando>        — manual de um comando AD conhecido",
      "  <comando> -h         — ajuda curta do comando",
      "  <comando>            — digite só o nome para ver a ajuda contextual",
      "",
      `Comandos conhecidos: ${listKnownCommands().join(", ")}`,
      "",
      `Fase atual: ${phase.number} — ${phase.technicalName} (${phase.thematicName})`,
      `Objetivo: ${phase.objective}`
    ];
    return { action: { type: "text", output: lines.join("\n") }, cost: { detection: 0, budget: 0 } };
  }

  if (/^clear$/i.test(input)) {
    return { action: { type: "clear" }, cost: { detection: 0, budget: 0 } };
  }
  if (/^status$/i.test(input)) {
    return { action: { type: "status" }, cost: { detection: 0, budget: 0 } };
  }
  if (/^evidence(s)?$/i.test(input)) {
    return { action: { type: "evidence" }, cost: { detection: 0, budget: 0 } };
  }

  // man <topic>
  const manMatch = input.match(/^man\s+(.+)$/i);
  if (manMatch) {
    const topic = manMatch[1].trim();
    const out = manTopic(topic);
    if (out) return { action: { type: "text", output: out }, cost: { detection: 0, budget: 0 } };
    return {
      action: { type: "text", output: `man: nenhuma página para "${topic}"` },
      cost: { detection: 0, budget: 0 }
    };
  }

  // <cmd> -h ou <cmd> --help
  const helpMatch = input.match(/^(\S+)\s+(-h|--help)\s*$/i);
  if (helpMatch) {
    const out = manTopic(helpMatch[1]);
    if (out) return { action: { type: "text", output: out }, cost: { detection: 0, budget: 0 } };
  }

  // Comando da fase: corresponde exatamente ao expectedCommand ou um alias aceito.
  const cmdMatch = input.match(/^(\S+)$/);
  if (cmdMatch) {
    const name = cmdMatch[1];
    const lowered = name.toLowerCase();
    const accepted = [phase.expectedCommand, ...(phase.acceptedCommands ?? [])].map(c => c.toLowerCase());
    if (accepted.includes(lowered)) {
      return {
        action: { type: "phase_command", command: name },
        cost: { detection: 1, budget: -2 }
      };
    }
    // Conhecido mas não da fase — mostra help contextual
    const entry = resolveCommand(name);
    if (entry) {
      return {
        action: { type: "text", output: formatHelp(entry) },
        cost: { detection: 0, budget: 0 }
      };
    }
  }

  // Tentativa de comando com argumentos (não da fase) — sintetiza saída ruidosa
  const argMatch = input.match(/^(\S+)\s+(.+)$/);
  if (argMatch) {
    const known = resolveCommand(argMatch[1]);
    if (known) {
      return {
        action: {
          type: "text",
          output:
            `[!] ${known.name}: nesta fase o console educacional só dispara o comando quando você digita apenas o nome,\n` +
            `    para que possamos apresentar as opções completas de invocação. Tente digitar apenas:\n\n` +
            `    ${known.name}\n`
        },
        cost: { detection: 0.5, budget: -0.5 }
      };
    }
  }

  return {
    action: { type: "unknown" },
    cost: { detection: 1.5, budget: -1.0 }
  };
}
