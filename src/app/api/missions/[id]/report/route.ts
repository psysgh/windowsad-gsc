import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildReport } from "@/lib/reportBuilder";
import { apiError } from "@/lib/apiError";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      phases: { orderBy: { phaseNumber: "asc" } },
      actions: { orderBy: { at: "asc" } },
      evidences: { orderBy: { unlockedAt: "asc" } }
    }
  });
  if (!mission) return NextResponse.json({ error: "Missão não encontrada" }, { status: 404 });
  // Se ainda em progresso, marcamos como "incomplete" para fins do relatório (não persistido)
  const status = mission.status;
  const report = buildReport(
    {
      id: mission.id,
      seed: mission.seed,
      studentName: mission.studentName,
      startedAt: mission.startedAt,
      endedAt: mission.endedAt,
      status,
      currentPhase: mission.currentPhase,
      maxPhase: mission.maxPhase,
      score: mission.score,
      detection: mission.detection,
      budget: mission.budget,
      flags: mission.flags
    },
    mission.phases,
    mission.actions,
    mission.evidences
  );
  return NextResponse.json(report);
  } catch (e) {
    return apiError(e, "GET /api/missions/[id]/report");
  }
}
