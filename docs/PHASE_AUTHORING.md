# Autoria de fases

As 13 fases vivem em `src/lib/phases/NN-*.ts`. Cada uma exporta um `PhaseDefinition`:

```ts
export const phaseNN: PhaseDefinition = {
  number: 5,
  technicalName: "AS-REP Roasting",
  thematicName: "Captação de AS-REP em conta legada de planejamento",
  objective: "Solicitar o AS-REP da conta com pré-autenticação Kerberos desabilitada...",
  context: ds => `texto exibido no painel de contexto, com interpolação do dataset`,
  evidencesOnEntry: ds => [...],                 // opcional
  expectedCommand: "GetNPUsers.py",              // dispara o modal de opções
  acceptedCommands: ["Rubeus"],                  // aliases aceitos
  requiresJustification: true,                   // obriga justificativa antes de avançar
  interpretationQuestion: "Pergunta livre...",    // opcional
  options: [
    {
      id: "a",
      text: "GetNPUsers.py ... -no-pass -format hashcat -dc-ip <DC-IP>",
      correct: true,
      response: ds => "saída simulada do comando",
      scoreDelta: 1.5, detectionDelta: 4, budgetDelta: -6,
      unlockEvidences: ds => [{ label: "Hash AS-REP capturado", payload: {...} }],
      flag: ds => ds.flags.p5
    },
    // ... 4 outras opções (1+ caminhos alternativos com alternativePath: true)
  ],
  techExplanation: "Bloco curto exibido após a conclusão correta da fase."
};
```

Registro: adicione/reordene em `src/lib/phases/index.ts`.

## Caminhos alternativos

Marque `alternativePath: true` em opções secundárias **válidas** (que avançam, mas com score menor ou detecção maior). Use-as para premiar variedade técnica (ex.: Rubeus vs. impacket).

## Justificativas e perguntas interpretativas

- `requiresJustification: true` → o aluno precisa explicar a escolha (≥ 30 caracteres) antes de avançar.
- `interpretationQuestion: "..."` → resposta livre (≥ 20 caracteres) salva no relatório.

Tudo é registrado em `Action` e aparece no relatório do professor.

## Acessar o dataset

`context`, `response`, `unlockEvidences` e `flag` recebem o `Dataset` derivado da seed (`src/lib/seedDataset.ts`). Use propriedades como `ds.domain`, `ds.asrepTarget.username`, `ds.kerberoastTarget.spn` para que o texto fique coerente com o cenário gerado.

## Saídas com ruído

Inclua entradas falsamente interessantes nas respostas das opções **erradas** (descrições vagas, contas irrelevantes, hashes ruins). Isso pressiona o aluno a ler e interpretar a saída.
