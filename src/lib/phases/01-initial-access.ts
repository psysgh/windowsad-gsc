import type { PhaseDefinition } from "./types";

export const phase01: PhaseDefinition = {
  number: 1,
  technicalName: "Initial Access Context",
  thematicName: "Briefing operacional na estação terrestre",
  objective:
    "Validar o contexto inicial: identidade da credencial cedida, máquina de pivot e domínio alvo.",
  context: ds =>
    [
      `📡 Você está sentado em uma das workstations da sala de operações da estação terrestre.`,
      `Telas exibem janelas de passagem em L-band, plots de elevação e logs de telemetria.`,
      `O cliente — operadora civil de satélites de observação da Terra — autorizou um exercício ofensivo`,
      `sobre o domínio corporativo "${ds.domain}" que sustenta esse segmento solo.`,
      ``,
      `🪪 Sua credencial inicial — concedida em escopo controlado pelo IAM da operadora:`,
      `   • usuário     : ${ds.initialUser.username}`,
      `   • nome        : ${ds.initialUser.fullName}`,
      `   • grupo       : ${ds.initialUser.group}`,
      `   • função      : ${ds.initialUser.role}`,
      `   • senha       : ${ds.initialPassword}`,
      `   • workstation : ingressada em ${ds.netbios}`,
      ``,
      `Antes de qualquer movimento, confirme em que contexto você está logado.`,
      `Sem isso, qualquer técnica seguinte vira chute. 👉 Comando esperado: whoami`
    ].join("\n"),
  expectedCommand: "whoami",
  evidencesOnEntry: ds => [
    {
      label: "Carta de autorização ofensiva",
      payload: {
        autorizadoPor: "IAM Core / Diretoria Operacional",
        escopoDoTeste: `Domínio ${ds.domain} e estações de operação relacionadas`,
        janela: "imediata, encerramento via 'Encerrar missão'",
        credencial: ds.initialUser.username
      }
    }
  ],
  options: [
    {
      id: "a",
      text: "whoami /all",
      correct: true,
      response: ds =>
        [
          `USER INFORMATION`,
          `User Name        SID`,
          `================ =========================================`,
          `${ds.netbios}\\${ds.initialUser.username}   S-1-5-21-${Math.abs(hash(ds.seed))}-1106`,
          ``,
          `GROUP INFORMATION`,
          `Group Name                                     Type             SID          Attributes`,
          `============================================== ================ ============ ==================================================`,
          `${ds.netbios}\\Domain Users                        Group            S-1-5-21-..  Mandatory group, Enabled by default, Enabled group`,
          `${ds.netbios}\\${ds.initialUser.group.padEnd(34)} Group            S-1-5-21-..  Mandatory group, Enabled by default, Enabled group`,
          ``,
          `PRIVILEGES INFORMATION`,
          `Privilege Name                  State`,
          `=============================== ========`,
          `SeChangeNotifyPrivilege         Enabled`,
          `SeIncreaseWorkingSetPrivilege   Disabled`,
          ``,
          `[+] Contexto inicial confirmado.`
        ].join("\n"),
      scoreDelta: 1.0,
      detectionDelta: 1,
      budgetDelta: -2,
      unlockEvidences: ds => [
        {
          label: "Identidade inicial validada",
          payload: { username: ds.initialUser.username, groups: ["Domain Users", ds.initialUser.group] }
        }
      ]
    },
    {
      id: "b",
      text: "whoami /priv",
      correct: false,
      alternativePath: true,
      response: () =>
        "Apenas privilégios. Útil, mas não revela memberships — você perde o contexto de grupo necessário para a próxima fase.",
      scoreDelta: 0.3,
      detectionDelta: 1,
      budgetDelta: -2
    },
    {
      id: "c",
      text: "whoami /user",
      correct: false,
      response: () =>
        "Mostra apenas SID do usuário. Pouca utilidade para validar contexto e grupos.",
      scoreDelta: -0.2,
      detectionDelta: 1,
      budgetDelta: -2
    },
    {
      id: "d",
      text: "whoami /logonid",
      correct: false,
      response: () => "Retorna apenas o LUID da sessão de logon. Irrelevante para reconhecimento.",
      scoreDelta: -0.2,
      detectionDelta: 1,
      budgetDelta: -2
    },
    {
      id: "e",
      text: "whoami /groups /fo csv > C:\\Users\\Public\\groups.csv",
      correct: false,
      response: () =>
        "Escrever arquivo em diretório público durante a fase de contexto é desnecessário e amplia rastros forenses sem motivo.",
      scoreDelta: -0.4,
      detectionDelta: 8,
      budgetDelta: -3
    }
  ],
  techExplanation:
    "Validar identidade e grupos do token é o primeiro passo de qualquer pentest AD: define se há privilégios herdados, contexto de máquina ingressada e quais grupos podem ser consultados."
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
