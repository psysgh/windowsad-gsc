# Customização da pontuação

Arquivo central: `src/lib/scoring.ts`.

| Constante | Default | Significado |
|---|---|---|
| `initialBudget` | 100 | Orçamento inicial da missão |
| `initialDetection` | 0 | Detecção inicial |
| `perTerminalCommandBudget` | -0.5 | Custo por comando enviado ao terminal |
| `perTerminalCommandDetection` | 0.2 | Ruído mínimo por comando |
| `unknownCommandDetection` | 1.5 | Penalidade por input não reconhecido |
| `unknownCommandBudget` | -1.0 | Custo extra por input desconhecido |
| `wrongOptionScore` | -0.5 | Penalidade de score por opção errada |
| `wrongOptionDetection` | +6 | Detecção extra por opção errada |
| `wrongOptionBudget` | -8 | Custo extra por opção errada |
| `noisyThreshold` | 70 | Acima disto, relatório marca missão como "ruidosa" |
| `rawScoreMax` | 18 | Score bruto máximo esperado (normaliza para 0-10) |
| `stealthBonus` | +0.5 | Bônus se detecção final for stealth (<20) |
| `budgetExhaustedPenalty` | -1.0 | Penalidade se orçamento estourar |

Os deltas individuais de cada opção ficam em `src/lib/phases/NN-*.ts`. O `reportBuilder.ts` normaliza `rawScore / rawScoreMax * 10` ao gerar o relatório final.

## Classificações

- **Detecção**: `<20` stealth · `<50` moderate · `<70` noisy · `≥70` burned
- **Orçamento**: `>30` ok · `>0` low · `≤0` exhausted

Altere os limiares em `classifyDetection` / `classifyBudget` no mesmo arquivo se necessário.
