import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildReport } from "@/lib/reportBuilder";
import { ReportView } from "@/components/ReportView";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: { id: string } }) {
  const mission = await prisma.mission.findUnique({
    where: { id: params.id },
    include: {
      phases: { orderBy: { phaseNumber: "asc" } },
      actions: { orderBy: { at: "asc" } },
      evidences: { orderBy: { unlockedAt: "asc" } }
    }
  });
  if (!mission) notFound();

  const report = buildReport(
    {
      id: mission.id,
      seed: mission.seed,
      studentName: mission.studentName,
      startedAt: mission.startedAt,
      endedAt: mission.endedAt,
      status: mission.status,
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

  return <ReportView report={report} />;
}
