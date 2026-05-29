import type { PhaseDefinition } from "./types";

export const phase04: PhaseDefinition = {
  number: 4,
  technicalName: "Service Account Discovery",
  thematicName: "Identificação de contas de serviço da telemetria",
  objective:
    "Enumerar contas de serviço associadas a SPNs em sistemas operacionais — telemetria, propagador de órbita e arquivo de observação.",
  context: ds =>
    [
      `🛠️ Cada sistema operacional desta estação tem um "robô" rodando em nome dele — uma conta de serviço com SPN.`,
      `Esses SPNs costumam ser pontos cegos: senhas antigas, dono original já saiu da empresa, ninguém ousa girar.`,
      ``,
      `Você procura nominalmente por contas atadas a:`,
      `  • tlm-ingest  → ingestão de pacotes de telemetria recebidos do satélite`,
      `  • fd-orbit    → propagador orbital (SGP4)`,
      `  • eo-archive  → arquivo de observação da Terra (produtos L1/L2)`,
      ``,
      `Cada SPN encontrado vira munição para Kerberoast na próxima fase.`,
      ``,
      `💡 Filtre por servicePrincipalName e exporte description — você quer o atributo SPN, não apenas nomes.`
    ].join("\n"),
  expectedCommand: "Get-ADUser",
  acceptedCommands: ["Get-DomainUser"],
  options: [
    {
      id: "a",
      text: "Get-ADUser -Filter {ServicePrincipalName -ne '$null'} -Properties ServicePrincipalName,Description",
      correct: true,
      response: ds =>
        [
          `SamAccountName                  ServicePrincipalName`,
          `------------------------------- -------------------------------------------------`,
          ...ds.serviceAccounts.map(
            s => `${s.username.padEnd(31)} ${s.spn}`
          ),
          ``,
          `[+] ${ds.serviceAccounts.length} contas de serviço com SPN localizadas.`,
          `[!] Conta destacada: ${ds.kerberoastTarget.username} — ${ds.kerberoastTarget.description}`
        ].join("\n"),
      scoreDelta: 1.3,
      detectionDelta: 3,
      budgetDelta: -3,
      unlockEvidences: ds => [
        {
          label: "Inventário de SPNs do domínio",
          payload: ds.serviceAccounts.map(s => ({ user: s.username, spn: s.spn, group: s.group }))
        }
      ],
      flag: ds => ds.flags.p4
    },
    {
      id: "b",
      text: "Get-ADUser -Filter 'Name -like \"svc*\"' -Properties servicePrincipalName",
      correct: false,
      alternativePath: true,
      response: ds =>
        [
          `[+] Heurística por nome encontra a maioria das contas svc-*:`,
          ...ds.serviceAccounts.slice(0, 4).map(s => `    ${s.username}`),
          ``,
          `Funciona, mas perde contas de serviço com nomes não-padrão e o SPN propriamente dito.`
        ].join("\n"),
      scoreDelta: 0.5,
      detectionDelta: 3,
      budgetDelta: -3
    },
    {
      id: "c",
      text: "Get-ADUser -Filter * -Properties *",
      correct: false,
      response: () => "Dump completo de todos os atributos — varredura LDAP massiva e alta detecção.",
      scoreDelta: -0.5,
      detectionDelta: 18,
      budgetDelta: -6
    },
    {
      id: "d",
      text: "Get-ADUser -Identity 'krbtgt' -Properties memberOf",
      correct: false,
      response: () => "krbtgt não é alvo desta fase. Consultá-la agora gera alerta em IAM Core.",
      scoreDelta: -0.4,
      detectionDelta: 12,
      budgetDelta: -3
    },
    {
      id: "e",
      text: "Get-ADUser -Filter 'Description -like \"*senha*\"'",
      correct: false,
      response: () => "Filtro frágil; algumas descrições legadas trazem texto enganoso (falso positivo).",
      scoreDelta: -0.2,
      detectionDelta: 3,
      budgetDelta: -3
    }
  ],
  techExplanation:
    "Contas com ServicePrincipalName são alvos de Kerberoast porque qualquer usuário pode requisitar TGS para o SPN, capturando hash crackable offline."
};
