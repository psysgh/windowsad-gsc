import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPhase } from "@/lib/phases";
import { buildDataset } from "@/lib/seedDataset";
import { processTerminalInput } from "@/lib/terminalEngine";
import { SCORING } from "@/lib/scoring";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const input = String(body?.input ?? "").trim();
  if (!input) return NextResponse.json({ error: "input vazio" }, { status: 400 });

  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  if (mission.status !== "in_progress") {
    return NextResponse.json({ error: "Missão encerrada" }, { status: 409 });
  }
  const phaseDef = getPhase(mission.currentPhase);
  if (!phaseDef) return NextResponse.json({ error: "Fase inválida" }, { status: 500 });

  const ds = buildDataset(mission.seed);
  const result = processTerminalInput(input, phaseDef, ds);

  // Custo padrão de cada comando enviado ao terminal
  let detectionDelta = SCORING.perTerminalCommandDetection + result.cost.detection;
  let budgetDelta = SCORING.perTerminalCommandBudget + result.cost.budget;

  // ────────────────────────────────────────────────────────────────────
  // Reabertura gratuita das opções da fase:
  //   se o aluno já invocou o comando da fase antes (e fechou a janela
  //   sem escolher ou escolheu errado e quer rever as alternativas),
  //   abrir de novo o modal não pode penalizar — consultar opções é
  //   parte legítima do estudo.
  // ────────────────────────────────────────────────────────────────────
  let revisit = false;
  if (result.action.type === "phase_command") {
    const prior = await prisma.action.findFirst({
      where: {
        missionId: mission.id,
        phase: mission.currentPhase,
        kind: "terminal",
        input
      }
    });
    if (prior) {
      revisit = true;
      detectionDelta = 0;
      budgetDelta = 0;
    }
  }

  let output = "";
  let kind: "options_request" | "text" | "clear" | "status" | "evidence" | "unknown" = "text";
  let optionsToReturn: { id: string; text: string }[] | undefined;

  switch (result.action.type) {
    case "text":
      output = result.action.output;
      kind = "text";
      break;
    case "clear":
      output = "";
      kind = "clear";
      break;
    case "status":
      output = "";
      kind = "status";
      break;
    case "evidence":
      output = "";
      kind = "evidence";
      break;
    case "phase_command":
      output = revisit
        ? `[*] Reabrindo opções de ${result.action.command} — reconsulta sem custo.`
        : `[*] Disparando ${result.action.command} — selecione a invocação correta.`;
      kind = "options_request";
      optionsToReturn = phaseDef.options.map(o => ({ id: o.id, text: o.text }));
      break;
    case "unknown":
      output = `bash: ${input}: command not found (consulte 'help')`;
      kind = "unknown";
      break;
  }

  const newScore = mission.score;
  const newDetection = Math.max(0, mission.detection + detectionDelta);
  const newBudget = mission.budget + budgetDelta;

  const actionOutput =
    kind === "options_request"
      ? revisit
        ? `(reabertura das opções para ${
            result.action.type === "phase_command" ? result.action.command : ""
          } — sem custo)`
        : `(opções apresentadas para ${
            result.action.type === "phase_command" ? result.action.command : ""
          })`
      : output;

  await prisma.$transaction([
    prisma.action.create({
      data: {
        missionId: mission.id,
        phase: mission.currentPhase,
        kind: "terminal",
        input,
        output: actionOutput
      }
    }),
    prisma.mission.update({
      where: { id: mission.id },
      data: { detection: newDetection, budget: newBudget }
    })
  ]);

  return NextResponse.json({
    output,
    kind,
    revisit,
    options: optionsToReturn,
    state: { score: newScore, detection: newDetection, budget: newBudget }
  });
}
