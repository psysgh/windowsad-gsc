import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPhase } from "@/lib/phases";
import { buildDataset } from "@/lib/seedDataset";
import { serializePhase } from "@/types/mission";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      phases: { orderBy: { phaseNumber: "asc" } },
      evidences: { orderBy: { unlockedAt: "asc" } },
      actions: { orderBy: { at: "asc" } }
    }
  });
  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  const ds = buildDataset(mission.seed);
  const phaseDef = getPhase(mission.currentPhase);
  if (!phaseDef) return NextResponse.json({ error: "Fase inválida" }, { status: 500 });

  return NextResponse.json({
    id: mission.id,
    seed: mission.seed,
    studentName: mission.studentName,
    status: mission.status,
    startedAt: mission.startedAt,
    endedAt: mission.endedAt,
    currentPhase: mission.currentPhase,
    maxPhase: mission.maxPhase,
    score: mission.score,
    detection: mission.detection,
    budget: mission.budget,
    flags: JSON.parse(mission.flags || "[]"),
    dataset: ds,
    phase: serializePhase(phaseDef, ds),
    phaseRuns: mission.phases.map(r => ({
      phaseNumber: r.phaseNumber,
      enteredAt: r.enteredAt,
      exitedAt: r.exitedAt,
      attempts: r.attempts,
      chosenOptionId: r.chosenOptionId,
      correct: r.correct,
      justification: r.justification,
      interpretationA: r.interpretationA,
      scoreDelta: r.scoreDelta,
      detectionDelta: r.detectionDelta,
      budgetDelta: r.budgetDelta
    })),
    evidences: mission.evidences.map(e => ({
      id: e.id,
      phase: e.phase,
      label: e.label,
      payload: safeParse(e.payload),
      unlockedAt: e.unlockedAt
    })),
    actions: mission.actions.map(a => ({
      id: a.id,
      at: a.at,
      phase: a.phase,
      kind: a.kind,
      input: a.input,
      output: a.output
    }))
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const mission = await prisma.mission.findUnique({ where: { id: params.id } });
  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  if (mission.status !== "in_progress") {
    return NextResponse.json({ ok: true, alreadyFinal: true });
  }
  await prisma.mission.update({
    where: { id: mission.id },
    data: { status: "aborted", endedAt: new Date() }
  });
  return NextResponse.json({ ok: true });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
