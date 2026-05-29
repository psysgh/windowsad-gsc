import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/apiError";

export const runtime = "nodejs";

// Senha fixa do professor. Em produção viria de variável de ambiente,
// mas como este é um lab que roda 100% local, fica no código por simplicidade.
const PROFESSOR_PASSWORD = "Pf2272@2026";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body?.password ?? "");
    if (password !== PROFESSOR_PASSWORD) {
      // Pequeno delay para reduzir brute-force trivial
      await new Promise(r => setTimeout(r, 600));
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    // Cascade delete via Mission → PhaseRun/Action/Evidence
    const result = await prisma.mission.deleteMany({});
    return NextResponse.json({ ok: true, removed: result.count });
  } catch (e) {
    return apiError(e, "POST /api/admin/reset");
  }
}
