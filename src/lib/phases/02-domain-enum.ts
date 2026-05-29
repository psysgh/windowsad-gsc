import type { PhaseDefinition } from "./types";

export const phase02: PhaseDefinition = {
  number: 2,
  technicalName: "Domain Enumeration",
  thematicName: "Mapeamento do segmento solo (IAM Core)",
  objective:
    "Identificar o Domain Controller responsável pelo IAM Core e a estrutura do domínio de operações.",
  context: ds =>
    [
      `🛰️ Identidade confirmada. Agora você precisa saber para qual controlador de domínio sua workstation está conversando.`,
      `Nesta operadora, o IAM Core mantém um DC dedicado ao segmento solo — ele é quem assina cada ticket Kerberos`,
      `que sustenta acesso à telemetria, ao planejamento de missão e ao arquivo de payload.`,
      ``,
      `🎯 Localizar esse DC é pré-requisito para tudo que vem depois: AS-REP, Kerberoast, DCSync, Golden Ticket.`,
      `Sem o nome certo, nenhum desses ataques funciona.`,
      ``,
      `💡 Lembre-se das ferramentas nativas do Windows para sondar canal seguro e DCs.`,
      `   (digite 'help' no terminal para ver os comandos conhecidos do console)`
    ].join("\n"),
  expectedCommand: "nltest",
  options: [
    {
      id: "a",
      text: "nltest /dclist:{domain}".replace("{domain}", "<domínio>"),
      correct: true,
      response: ds =>
        [
          `Get list of DCs in domain '${ds.domain}' from '\\\\${ds.dcHost}.${ds.domain}'`,
          `    ${ds.dcHost}.${ds.domain} [PDC] [DS] Site: GROUNDSTATION-PRIMARY`,
          `The command completed successfully`,
          ``,
          `[+] DC primário identificado: ${ds.dcHost}.${ds.domain}`
        ].join("\n"),
      scoreDelta: 1.2,
      detectionDelta: 2,
      budgetDelta: -3,
      unlockEvidences: ds => [
        { label: "Domain Controller identificado", payload: { dcHost: ds.dcHost, domain: ds.domain } }
      ],
      flag: ds => ds.flags.p2
    },
    {
      id: "b",
      text: "nltest /domain_trusts",
      correct: false,
      alternativePath: true,
      response: ds =>
        `Lista relações de confiança (não há trusts externos relevantes em "${ds.domain}"). Avança parcialmente, mas não cumpre o objetivo.`,
      scoreDelta: 0.3,
      detectionDelta: 2,
      budgetDelta: -3
    },
    {
      id: "c",
      text: "nltest /dsgetdc:NONEXISTENT-DOMAIN",
      correct: false,
      response: () =>
        `ERROR_NO_SUCH_DOMAIN — o domínio fornecido não existe; ação inútil e ruidosa.`,
      scoreDelta: -0.4,
      detectionDelta: 6,
      budgetDelta: -3
    },
    {
      id: "d",
      text: "nltest /sc_query:127.0.0.1",
      correct: false,
      response: () => `Consulta o canal seguro local — irrelevante para enumeração do domínio remoto.`,
      scoreDelta: -0.2,
      detectionDelta: 2,
      budgetDelta: -3
    },
    {
      id: "e",
      text: "nltest /server:0.0.0.0 /list",
      correct: false,
      response: () => `Parâmetro inválido — gera log de erro autenticado e revela tentativa.`,
      scoreDelta: -0.4,
      detectionDelta: 6,
      budgetDelta: -3
    }
  ],
  techExplanation:
    "Enumerar o DC é o passo zero antes de qualquer operação Kerberos (TGT, TGS, DCSync). nltest é nativo e produz baixo ruído quando bem direcionado."
};
