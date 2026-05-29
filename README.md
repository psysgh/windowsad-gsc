# Ground Station Compromise

Aplicação web local para uso como **Global Solution** da FIAP na disciplina de **Offensive Security**. Simula, sem depender de Active Directory real, uma jornada completa de exploração AD (Enumeração → AS-REP Roasting → Kerberoasting → ACL Abuse → Delegation Abuse → Movimento Lateral → DCSync → Golden Ticket → Comprometimento do domínio) em um cenário realista de **operação de estação terrestre de satélites de observação da Terra**.

Cada aluno roda a aplicação na própria máquina. Na tela inicial informa **nome + RM**, e o cenário (usuários, grupos, hosts, SPNs, hashes simulados e flags) é derivado deterministicamente do RM — duas tentativas com o mesmo RM produzem exatamente o mesmo ambiente. Ao final (ou ao desistir), o aluno exporta um relatório em JSON ou HTML/PDF e envia ao professor para correção.

---

## 1. Objetivo

- Avaliar conhecimento prático em técnicas ofensivas de AD.

## 2. Como rodar localmente

```bash
# 1) Instalar dependências (gera o cliente Prisma automaticamente)
npm install

# 2) Criar e migrar o banco SQLite local
npx prisma migrate dev --name init

# 3) Subir o servidor
npm run dev
```

A aplicação inicia em `http://localhost:3000`.

> Requisitos: Node.js 18.18+ e npm. Sem Docker, sem APIs externas obrigatórias.

## 3. Tela inicial

`http://localhost:3000` — o aluno informa:

- **Nome completo** (≥ 3 caracteres)
- **RM** (≥ 4 caracteres alfanuméricos — letras, dígitos, `.`, `-`, `_`)

Ao clicar em **Iniciar missão**, a aplicação cria a missão e abre o dashboard em `/mission/<id>`. O RM vira a seed do cenário — mesmo RM = mesmo cenário, sempre.

## 4. Dashboard da missão

`http://localhost:3000/mission/<id>` reúne:

- **Status bar** com fase atual / fase máxima, pontuação 0-10, detecção (`stealth`/`moderate`/`noisy`/`burned`) e orçamento.
- **Painel de contexto** da fase: nome técnico, nome temático e objetivo.
- **Terminal educacional**.
- **Painel de evidências** coletadas (clicável, mostra payload JSON).
- **Histórico de ações**.
- **Painel de flags** obtidas.

No topo, dois botões:

- **Exportar relatório** — abre `/mission/<id>/report` em nova aba.
- **Encerrar missão e exportar relatório** — muda o status para `aborted` antes de abrir o relatório.

## 5. Terminal

Orientado por intenções, não é um shell real. Aceita:

- `help`, `clear`, `status`, `evidence`
- `man <comando>` ou `<comando> -h` — ajuda contextual de comandos AD conhecidos
- Apenas o nome de um comando conhecido → exibe ajuda contextual
- Apenas o nome do comando **esperado da fase** → abre o modal com 5 opções de invocação completa, das quais 1 é correta (algumas fases têm 2 caminhos válidos com pontuação diferente; os demais são incorretos)

Comandos conhecidos: `whoami`, `net`, `nltest`, `Get-ADUser`, `Get-ADGroup`, `Get-ADComputer`, `Get-DomainUser`, `Get-DomainGroup`, `Get-DomainComputer`, `GetUserSPNs.py`, `GetNPUsers.py`, `hashcat`, `secretsdump.py`, `ticketer.py`, `psexec.py`, `wmiexec.py`, `bloodhound-python`, `Rubeus`.

## 6. Relatório

Exportável de duas formas a partir de `/mission/<id>/report`:

- **Imprimir / Salvar como PDF** — usa o diálogo do navegador (sem dependência server-side de Chromium).
- **Baixar JSON** — relatório estruturado.

O relatório contém: identificação (nome + RM), seed (= RM), domínio simulado, horários, status final, pontuação 0-10, detecção, orçamento, fase máxima alcançada, lista cronológica de ações, detalhamento por fase (contexto, opção escolhida, justificativa, pergunta interpretativa e resposta, evidências liberadas, explicação técnica), flags, técnicas demonstradas/não-demonstradas, recomendações automáticas, resumo avaliativo e campo para observações manuais do professor.

## 7. Resetar a atividade

Duas formas:

**Pela UI (durante uma prova travada):** botão **⚙ reset (uso do professor)** no canto superior direito da tela inicial. Pede a senha do professor. Apaga todas as missões registradas e limpa o progresso local do navegador.

**Pela linha de comando (para reset técnico):**

```bash
npm run db:reset
```

Apaga `prisma/dev.db` e recria a partir do schema.

## 7.1 Persistência local e retomada após crash

A missão fica gravada em `prisma/dev.db` no disco — derrubar o navegador, fechar o terminal ou reiniciar a máquina **não perde progresso**. Quando o aluno reabrir `http://localhost:3000`, a tela inicial detecta a missão em andamento (via `localStorage`) e oferece um banner **"Continuar missão"** que retoma exatamente de onde parou. O formulário também volta pré-preenchido com nome + RM da última tentativa.

## 8. Customizar fases

Cada fase é um módulo em `src/lib/phases/NN-*.ts` exportando um `PhaseDefinition`. Para alterar uma fase, edite o arquivo correspondente (contexto, comando esperado, 5 opções, deltas de score/detecção/orçamento, justificativa obrigatória, pergunta interpretativa, explicação técnica final). Para reordenar ou adicionar, ajuste `src/lib/phases/index.ts`.

Veja [`docs/PHASE_AUTHORING.md`](docs/PHASE_AUTHORING.md).

---

## Estrutura do projeto

```
ground-station-compromise/
├── prisma/
│   └── schema.prisma            # Mission, PhaseRun, Action, Evidence
├── src/
│   ├── app/
│   │   ├── page.tsx             # tela inicial (nome + RM)
│   │   ├── mission/[id]/        # dashboard do aluno + relatório
│   │   └── api/                 # rotas REST
│   ├── components/              # Terminal, painéis, modais, ReportView
│   ├── lib/
│   │   ├── prng.ts              # PRNG determinístico
│   │   ├── seedDataset.ts       # gera o domínio simulado
│   │   ├── phases/              # 13 fases + tipos
│   │   ├── terminalEngine.ts    # parser do terminal educacional
│   │   ├── commandHelp.ts       # help text dos comandos AD
│   │   ├── scoring.ts           # constantes e normalização
│   │   ├── reportBuilder.ts     # JSON do relatório
│   │   └── db.ts                # cliente Prisma singleton
│   └── types/
└── docs/
```

---

## Premissa narrativa

Uma operadora civil de satélites de observação da Terra detectou indícios de comprometimento em seu ambiente de identidade. O aluno assume o papel de analista ofensivo autorizado, recebendo uma credencial de baixo privilégio para o segmento solo (`groundops-<sufixo>.corp`). Sua missão é demonstrar, etapa por etapa, como um atacante poderia sair dessa credencial até comprometer o domínio que sustenta telemetria, planejamento de missão, propagação orbital e processamento de payload.

A história é mantida realista: nenhum cenário de ficção, alienígenas, super armas ou guerra galáctica.

## Avisos

Este projeto é **estritamente educacional**. As "ferramentas" e "saídas" são simuladas; nenhum comando é executado contra um sistema real. Use em laboratório local de sala de aula ou ambiente de avaliação.
