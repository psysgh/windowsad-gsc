import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPhase, getShuffledOptions, PHASES } from "@/lib/phases";
import { buildDataset } from "@/lib/seedDataset";
import { SCORING } from "@/lib/scoring";
import { apiError } from "@/lib/apiError";

export const runtime = "nodejs";

interface PhasePayload {
  action: "choose_option" | "submit_justification" | "submit_interpretation" | "advance";
  optionId?: string;
  justification?: string;
  interpretation?: string;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const body = (await req.json().catch(() => ({}))) as PhasePayload;
  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: { phases: true }
  });
  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  if (mission.status !== "in_progress") {
    return NextResponse.json({ error: "Missão encerrada" }, { status: 409 });
  }
  const phaseDef = getPhase(mission.currentPhase);
  if (!phaseDef) return NextResponse.json({ error: "Fase inválida" }, { status: 500 });
  const ds = buildDataset(mission.seed);
  const run = mission.phases.find(r => r.phaseNumber === mission.currentPhase);
  if (!run) return NextResponse.json({ error: "PhaseRun ausente" }, { status: 500 });

  if (body.action === "choose_option") {
    // O cliente envia o display id (a, b, c, d, e) baseado na ordem que viu na tela —
    // que é uma permutação determinística baseada na seed da missão.
    // Aqui re-derivamos a mesma permutação para mapear de volta para a opção original.
    const displayId = (body.optionId ?? "").toString().toLowerCase().trim();
    if (!/^[a-e]$/.test(displayId)) {
      return NextResponse.json({ error: "opção inválida" }, { status: 400 });
    }
    const shuffled = getShuffledOptions(phaseDef, mission.seed);
    const displayIdx = displayId.charCodeAt(0) - 97;
    const opt = shuffled[displayIdx];
    if (!opt) return NextResponse.json({ error: "opção inválida" }, { status: 400 });

    const isCorrect = opt.correct;
    const scoreDelta = opt.scoreDelta + (isCorrect ? 0 : SCORING.wrongOptionScore);
    const detectionDelta = opt.detectionDelta + (isCorrect ? 0 : SCORING.wrongOptionDetection);
    const budgetDelta = opt.budgetDelta + (isCorrect ? 0 : SCORING.wrongOptionBudget);

    const evidencesToCreate = isCorrect && opt.unlockEvidences ? opt.unlockEvidences(ds) : [];
    const newFlags: string[] = JSON.parse(mission.flags || "[]");
    if (isCorrect && opt.flag) {
      const f = opt.flag(ds);
      if (f && !newFlags.includes(f)) newFlags.push(f);
    }

    await prisma.$transaction(async tx => {
      await tx.action.create({
        data: {
          missionId: mission.id,
          phase: mission.currentPhase,
          kind: "option_choice",
          input: `${phaseDef.expectedCommand} / exibida como ${displayId.toUpperCase()} (gabarito ${opt.id.toUpperCase()})`,
          output: opt.response(ds)
        }
      });
      await tx.phaseRun.update({
        where: { id: run.id },
        data: {
          attempts: { increment: 1 },
          chosenOptionId: opt.id,
          correct: isCorrect,
          scoreDelta: { increment: scoreDelta },
          detectionDelta: { increment: detectionDelta },
          budgetDelta: { increment: budgetDelta }
        }
      });
      for (const ev of evidencesToCreate) {
        await tx.evidence.create({
          data: {
            missionId: mission.id,
            phase: mission.currentPhase,
            label: ev.label,
            payload: JSON.stringify(ev.payload)
          }
        });
      }
      await tx.mission.update({
        where: { id: mission.id },
        data: {
          score: { increment: scoreDelta },
          detection: { increment: detectionDelta },
          budget: { increment: budgetDelta },
          flags: JSON.stringify(newFlags)
        }
      });
    });

    return NextResponse.json({
      correct: isCorrect,
      response: opt.response(ds),
      requiresJustification: Boolean(phaseDef.requiresJustification) && isCorrect,
      requiresInterpretation: Boolean(phaseDef.interpretationQuestion) && isCorrect,
      techExplanation: isCorrect ? phaseDef.techExplanation : null,
      flag: isCorrect && opt.flag ? opt.flag(ds) : null,
      finalPhase: Boolean(opt.finalPhase)
    });
  }

  if (body.action === "submit_justification") {
    const text = (body.justification ?? "").trim();
    if (text.length < 30) {
      return NextResponse.json({ error: "Justificativa muito curta (mín. 30 caracteres)" }, { status: 400 });
    }
    await prisma.phaseRun.update({ where: { id: run.id }, data: { justification: text } });
    await prisma.action.create({
      data: {
        missionId: mission.id,
        phase: mission.currentPhase,
        kind: "justification",
        input: "justificativa",
        output: text
      }
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "submit_interpretation") {
    const text = (body.interpretation ?? "").trim();
    if (text.length < 20) {
      return NextResponse.json({ error: "Resposta muito curta (mín. 20 caracteres)" }, { status: 400 });
    }
    await prisma.phaseRun.update({
      where: { id: run.id },
      data: {
        interpretationQ: phaseDef.interpretationQuestion ?? null,
        interpretationA: text
      }
    });
    await prisma.action.create({
      data: {
        missionId: mission.id,
        phase: mission.currentPhase,
        kind: "interpretation",
        input: phaseDef.interpretationQuestion ?? "",
        output: text
      }
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "advance") {
    if (run.correct !== true) {
      return NextResponse.json({ error: "Resolva a fase corretamente antes de avançar" }, { status: 400 });
    }
    if (phaseDef.requiresJustification && !run.justification) {
      return NextResponse.json({ error: "Justificativa obrigatória pendente" }, { status: 400 });
    }
    if (phaseDef.interpretationQuestion && !run.interpretationA) {
      return NextResponse.json({ error: "Resposta interpretativa pendente" }, { status: 400 });
    }

    const isLast = mission.currentPhase >= PHASES.length;
    const nextPhase = isLast ? mission.currentPhase : mission.currentPhase + 1;

    await prisma.$transaction(async tx => {
      await tx.phaseRun.update({
        where: { id: run.id },
        data: { exitedAt: new Date() }
      });
      if (isLast) {
        await tx.mission.update({
          where: { id: mission.id },
          data: { status: "completed", endedAt: new Date(), maxPhase: PHASES.length }
        });
      } else {
        // cria PhaseRun da próxima
        const existing = await tx.phaseRun.findFirst({
          where: { missionId: mission.id, phaseNumber: nextPhase }
        });
        if (!existing) {
          await tx.phaseRun.create({
            data: { missionId: mission.id, phaseNumber: nextPhase }
          });
        }
        await tx.mission.update({
          where: { id: mission.id },
          data: {
            currentPhase: nextPhase,
            maxPhase: Math.max(mission.maxPhase, nextPhase)
          }
        });
      }
    });

    return NextResponse.json({ ok: true, completed: isLast, nextPhase });
  }

  return NextResponse.json({ error: "ação inválida" }, { status: 400 });
  } catch (e) {
    return apiError(e, "POST /api/missions/[id]/phase");
  }
}
