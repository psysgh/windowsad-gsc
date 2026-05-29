import type { PhaseDefinition } from "./types";

export const phase07: PhaseDefinition = {
  number: 7,
  technicalName: "Credential Cracking Simulation",
  thematicName: "Quebra offline dos hashes Kerberos capturados",
  objective:
    "Selecionar o modo correto do hashcat para o hash TGS-REP capturado e iniciar o crack offline.",
  context: ds =>
    [
      `💻 Saindo da rede da operadora por enquanto — toda a próxima ação acontece no seu próprio laptop.`,
      `   Você tem dois hashes na mesa:`,
      `     • AS-REP de  ${ds.asrepTarget.username}      (formato $krb5asrep$23)`,
      `     • TGS-REP de ${ds.kerberoastTarget.username} (formato $krb5tgs$23)`,
      ``,
      `📚 Sua wordlist foi construída a partir de convenções históricas da própria operadora:`,
      `   nomes de missões antigas, datas de lançamento, codinomes de antenas, "Telemetria<ano>" e variantes.`,
      `   É exatamente esse tipo de coisa que sobrevive em senhas de conta de serviço.`,
      ``,
      `🎯 Cracking é OFFLINE — não gera tráfego, não acorda o SIEM. Mas escolher o modo errado do hashcat`,
      `   queima orçamento de tempo sem hit. Pense em qual hash você quer ver desabar primeiro.`,
      ``,
      `👉 Comando esperado: hashcat`
    ].join("\n"),
  expectedCommand: "hashcat",
  options: [
    {
      id: "a",
      text: "hashcat -m 13100 -a 0 tgs.txt wordlist.txt -r rules/best64.rule",
      correct: true,
      response: ds =>
        [
          `Session..........: groundops`,
          `Status...........: Cracked`,
          `Hash.Mode........: 13100 (Kerberos 5, TGS-REP etype 23)`,
          `Hash.Target......: $krb5tgs$23$*${ds.kerberoastTarget.username}$...`,
          `Recovered........: 1/1 (100%) Digests`,
          ``,
          `[+] Senha recuperada: Telemetria${(parseInt(ds.shortSeed, 16) % 50) + 2019}!`,
          `[+] Conta de serviço comprometida: ${ds.kerberoastTarget.username}`
        ].join("\n"),
      scoreDelta: 1.2,
      detectionDelta: 0,
      budgetDelta: -4,
      unlockEvidences: ds => [
        {
          label: "Credencial de serviço recuperada",
          payload: {
            user: ds.kerberoastTarget.username,
            password: `Telemetria${(parseInt(ds.shortSeed, 16) % 50) + 2019}!`,
            method: "hashcat 13100"
          }
        }
      ],
      flag: ds => ds.flags.p7
    },
    {
      id: "b",
      text: "hashcat -m 18200 -a 0 asrep.txt wordlist.txt",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `Recovered........: 1/1`,
          `[+] Senha recuperada: SatVision${(parseInt(ds.shortSeed, 16) % 30) + 2020}`,
          `[+] Conta legada comprometida: ${ds.asrepTarget.username}`,
          ``,
          `Caminho alternativo: usa hash AS-REP em vez de TGS. Avança, mas o pivot é mais fraco (conta sem privilégios elevados).`
        ].join("\n"),
      scoreDelta: 0.7,
      detectionDelta: 0,
      budgetDelta: -4,
      unlockEvidences: ds => [
        {
          label: "Credencial legada recuperada",
          payload: { user: ds.asrepTarget.username, method: "hashcat 18200" }
        }
      ],
      flag: ds => ds.flags.p7
    },
    {
      id: "c",
      text: "hashcat -m 1000 -a 3 tgs.txt ?a?a?a?a?a?a?a",
      correct: false,
      response: () =>
        "Modo 1000 é NTLM offline (SAM); brute-force amplo demais — gasta orçamento sem produzir hit.",
      scoreDelta: -0.4,
      detectionDelta: 0,
      budgetDelta: -8
    },
    {
      id: "d",
      text: "john --format=krb5tgs tgs.txt --wordlist=wordlist.txt",
      correct: false,
      response: () =>
        "JohnTheRipper funciona, mas a equipe padronizou hashcat. Avalie aderência ao playbook.",
      scoreDelta: 0.0,
      detectionDelta: 0,
      budgetDelta: -3
    },
    {
      id: "e",
      text: "hashcat -m 13100 -a 0 tgs.txt /dev/random",
      correct: false,
      response: () => "Wordlist inválida; sem candidatos, sem resultado.",
      scoreDelta: -0.3,
      detectionDelta: 0,
      budgetDelta: -3
    }
  ],
  techExplanation:
    "Modos hashcat relevantes: 13100 (TGS-REP, Kerberoast), 18200 (AS-REP). Ambos são offline — não geram tráfego no domínio durante a quebra."
};
