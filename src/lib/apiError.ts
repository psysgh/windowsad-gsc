import { NextResponse } from "next/server";

/**
 * Captura qualquer erro de rota da API e devolve sempre JSON.
 * Detecta o caso clássico "banco não inicializado" (comum em alunos
 * que rodaram `npm run dev` sem antes rodar a migração do Prisma)
 * e dá uma mensagem acionável — em vez de devolver o HTML padrão
 * 500 do Next.js, que quebra o `.json()` no cliente com
 * "Unexpected end of JSON input".
 */
export function apiError(e: unknown, context = "rota") {
  const msg = e instanceof Error ? e.message : String(e);
  const isDbMissing =
    /does not exist|no such table|database file|unable to open|sqlite|p[0-9]+|table.+not found/i.test(msg) ||
    /PrismaClientKnownRequestError|PrismaClientInitializationError/i.test(
      e instanceof Error ? e.name : ""
    );

  console.error(`[${context}]`, msg);

  if (isDbMissing) {
    return NextResponse.json(
      {
        error:
          "Banco de dados não inicializado. Pare o servidor (Ctrl+C) e rode 'npm run db:migrate' antes de 'npm run dev' novamente.",
        kind: "db-not-initialized"
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: `Erro interno (${context}): ${msg}`, kind: "internal" },
    { status: 500 }
  );
}
