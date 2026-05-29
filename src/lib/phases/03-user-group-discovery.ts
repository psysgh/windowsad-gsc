import type { PhaseDefinition } from "./types";

export const phase03: PhaseDefinition = {
  number: 3,
  technicalName: "User and Group Discovery",
  thematicName: "Inventário de pessoas e times da operação",
  objective:
    "Enumerar usuários e grupos do domínio, identificando contas Tier 0 e times operacionais críticos.",
  context: ds =>
    [
      `👥 DC localizado. Hora de conhecer a "tripulação": quem opera as antenas, quem planeja janelas, quem mexe nos payloads.`,
      `Cada grupo do AD aqui corresponde a uma função real da estação — telemetria, planejamento, dinâmica de voo, IAM.`,
      ``,
      `Você está caçando três tipos de alvo neste inventário:`,
      `  🔑 contas em Tier 0 / Domain Admins → reis do reino`,
      `  🎫 contas com SPN                    → alvos de Kerberoast (fase 6)`,
      `  📭 contas DONT_REQ_PREAUTH           → alvos de AS-REP Roasting (fase 5)`,
      ``,
      `O filtro LDAP que você escolher define se você passa despercebido ou se acende a árvore de Natal no SIEM.`,
      ``,
      `👉 Comando esperado: Get-DomainUser`
    ].join("\n"),
  expectedCommand: "Get-DomainUser",
  acceptedCommands: ["Get-ADUser"],
  options: [
    {
      id: "a",
      text: "Get-DomainUser -PreauthNotRequired -Properties samaccountname,description",
      correct: true,
      response: ds =>
        [
          `samaccountname                  description`,
          `------------------------------- --------------------------------------------------`,
          `${ds.asrepTarget.username.padEnd(31)} ${ds.asrepTarget.description}`,
          ``,
          `[+] 1 conta com DONT_REQ_PREAUTH localizada. Anote para AS-REP Roasting.`
        ].join("\n"),
      scoreDelta: 1.2,
      detectionDelta: 4,
      budgetDelta: -4,
      unlockEvidences: ds => [
        {
          label: "Conta com pré-autenticação desabilitada",
          payload: { user: ds.asrepTarget.username, description: ds.asrepTarget.description }
        }
      ],
      flag: ds => ds.flags.p3
    },
    {
      id: "b",
      text: "Get-DomainUser -AdminCount -Properties memberof",
      correct: false,
      alternativePath: true,
      response: ds =>
        [
          `[+] Contas com AdminCount=1 (proteção AdminSDHolder):`,
          `    - administrator`,
          `    - svc-iamcore-admin`,
          `    - ${ds.dcSyncPrincipal} (IAM Core)`,
          ``,
          `Caminho válido para Tier 0, mas não localiza o alvo de AS-REP.`
        ].join("\n"),
      scoreDelta: 0.5,
      detectionDelta: 4,
      budgetDelta: -4
    },
    {
      id: "c",
      text: "Get-DomainUser -SPN",
      correct: false,
      alternativePath: true,
      response: ds =>
        [
          `[+] Contas com SPN:`,
          ...ds.serviceAccounts.slice(0, 3).map(s => `    ${s.username}    ${s.spn}`),
          ``,
          `Pula direto para Kerberoast — adianta fase 6 mas não cumpre objetivo desta.`
        ].join("\n"),
      scoreDelta: 0.4,
      detectionDelta: 4,
      budgetDelta: -4
    },
    {
      id: "d",
      text: "Get-DomainUser -LDAPFilter '(objectClass=*)' -Properties *",
      correct: false,
      response: () =>
        "Consulta sem filtro retorna todos os atributos de todos os usuários — pico de tráfego LDAP e detecção alta.",
      scoreDelta: -0.5,
      detectionDelta: 15,
      budgetDelta: -6
    },
    {
      id: "e",
      text: "Get-DomainUser -Identity 'administrator' -Properties unicodePwd",
      correct: false,
      response: () =>
        "unicodePwd não é legível via LDAP normal — tentativa inútil que gera evento 4662 com Property = unicodePwd.",
      scoreDelta: -0.5,
      detectionDelta: 12,
      budgetDelta: -5
    }
  ],
  interpretationQuestion:
    "Qual conta da listagem você considera de maior risco neste momento e por quê? Cite a propriedade que sustenta sua avaliação.",
  techExplanation:
    "Filtros LDAP eficientes (PreauthNotRequired, SPN, AdminCount) são preferíveis a varreduras amplas porque revelam alvos imediatos sem gerar pico de LDAP."
};
