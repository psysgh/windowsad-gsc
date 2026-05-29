# Arquitetura

Aplicação Next.js 14 (App Router) full-stack. Um único processo serve frontend e API.

## Camadas

```
┌────────────────────────────────────────────────────┐
│ Browser (React Client Components)                  │
│  Tela inicial · Mission dashboard · Report · Prof  │
└────────────┬───────────────────────────────────────┘
             │ fetch (JSON)
┌────────────▼───────────────────────────────────────┐
│ Next.js API Routes (Node.js runtime)               │
│  /api/missions               (POST, GET)           │
│  /api/missions/[id]          (GET, DELETE)         │
│  /api/missions/[id]/terminal (POST)                │
│  /api/missions/[id]/phase    (POST)                │
│  /api/missions/[id]/report   (GET)                 │
└────────────┬───────────────────────────────────────┘
             │ Prisma
┌────────────▼───────────────────────────────────────┐
│ SQLite (prisma/dev.db)                             │
│  Mission, PhaseRun, Action, Evidence               │
└────────────────────────────────────────────────────┘
```

## Estado canônico no servidor

Pontuação, fase atual, detecção e orçamento ficam no banco. O cliente nunca decide o que é correto — apenas exibe. Isso impede burla via DevTools.

## Determinismo via seed (RM do aluno)

`src/lib/prng.ts` (`mulberry32` + `xmur3`) gera randomização reprodutível. `src/lib/seedDataset.ts` deriva o domínio inteiro (usuários, grupos, hosts, SPNs, delegações, hashes NTLM simulados, krbtgt, flags) **em tempo real** a cada request — não é persistido. A seed é o RM informado pelo aluno na tela inicial: o mesmo RM reconstrói o cenário idêntico, permitindo que o professor reproduza qualquer tentativa a partir do RM impresso no relatório.

## Terminal educacional

`src/lib/terminalEngine.ts` interpreta input em ordem:

1. comandos fixos (`help`, `clear`, `status`, `evidence`, `man <x>`, `<x> -h`);
2. comando esperado da fase (ou alias aceito) → dispara modal de 5 opções;
3. comando conhecido sem args → exibe `man` contextual;
4. comando conhecido **com** args → orienta a chamar sem args para abrir as opções;
5. qualquer outro input → "command not found" + penalidade leve.

## Avanço de fase

`/api/missions/[id]/phase` aceita 4 ações:

- `choose_option` — registra escolha, aplica deltas, libera evidências e flag (se acertou).
- `submit_justification` — exige ≥ 30 caracteres, salvo em `PhaseRun.justification`.
- `submit_interpretation` — exige ≥ 20 caracteres, salvo em `PhaseRun.interpretationA`.
- `advance` — valida pré-requisitos e troca `currentPhase`. Na última fase, marca `status = completed`.

## Relatório

`src/lib/reportBuilder.ts` agrega Mission + PhaseRuns + Actions + Evidences em um JSON com as 16 seções do enunciado, normaliza o score para 0-10 e gera recomendações automáticas baseadas em detecção, orçamento e técnicas faltantes. A página `/mission/[id]/report` renderiza esse JSON com estilo print-friendly (CSS `@media print`) — PDF sai do diálogo do navegador.
