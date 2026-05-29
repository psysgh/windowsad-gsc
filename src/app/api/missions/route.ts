import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SCORING } from "@/lib/scoring";
import { buildDataset } from "@/lib/seedDataset";

export const runtime = "nodejs";

export async function GET() {
  const missions = await prisma.mission.findMany({
    orderBy: { startedAt: "desc" }
  });
  return NextResponse.json(missions.map(m => ({
    id: m.id,
    seed: m.seed,
    studentName: m.studentName,
    status: m.status,
    startedAt: m.startedAt,
    endedAt: m.endedAt,
    currentPhase: m.currentPhase,
    maxPhase: m.maxPhase,
    score: m.score,
    detection: m.detection,
    budget: m.budget
  })));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const seed = (body?.seed ?? "").toString().trim();
  const studentName = body?.studentName ? String(body.studentName).trim() : null;
  if (!seed || seed.length < 3) {
    return NextResponse.json({ error: "seed deve ter pelo menos 3 caracteres" }, { status: 400 });
  }

  // Validate seed produz dataset
  buildDataset(seed);

  const mission = await prisma.mission.create({
    data: {
      seed,
      studentName,
      status: "in_progress",
      currentPhase: 1,
      maxPhase: 1,
      score: 0,
      detection: SCORING.initialDetection,
      budget: SCORING.initialBudget,
      flags: "[]"
    }
  });
  // PhaseRun da fase 1
  await prisma.phaseRun.create({
    data: { missionId: mission.id, phaseNumber: 1 }
  });
  return NextResponse.json({ id: mission.id });
}
