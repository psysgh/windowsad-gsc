// Ajuda contextual para comandos AD conhecidos.
// Cada entrada simula um "--help" ou página de manual.

export interface CommandHelpEntry {
  name: string;
  category: "windows" | "powerview" | "powershell-ad" | "impacket" | "linux" | "tool";
  synopsis: string;
  description: string;
  commonFlags: { flag: string; meaning: string }[];
  operationalNotes: string[];
}

const HELP: Record<string, CommandHelpEntry> = {
  whoami: {
    name: "whoami",
    category: "windows",
    synopsis: "whoami [/all] [/groups] [/priv]",
    description: "Exibe identidade do contexto atual: usuário, grupos e privilégios.",
    commonFlags: [
      { flag: "/all", meaning: "Exibe identidade, grupos e privilégios" },
      { flag: "/groups", meaning: "Apenas membership de grupos" },
      { flag: "/priv", meaning: "Privilégios habilitados/desabilitados na sessão" }
    ],
    operationalNotes: [
      "Baixo ruído operacional — comando padrão de inventário.",
      "Use /all para checar se o token carrega privilégios sensíveis (SeDebug, SeImpersonate)."
    ]
  },
  net: {
    name: "net",
    category: "windows",
    synopsis: "net <user|group|localgroup|view|use> ...",
    description: "Wrapper legado para enumerar e gerenciar usuários, grupos e sessões SMB.",
    commonFlags: [
      { flag: "user /domain", meaning: "Lista usuários do domínio" },
      { flag: "group /domain", meaning: "Lista grupos do domínio" },
      { flag: "view", meaning: "Lista shares acessíveis" }
    ],
    operationalNotes: [
      "Gera logs em controladores e na máquina origem.",
      "Saída pode ser truncada em domínios grandes."
    ]
  },
  nltest: {
    name: "nltest",
    category: "windows",
    synopsis: "nltest /dclist:<domínio> | /domain_trusts | /dsgetdc:<domínio>",
    description: "Ferramenta de teste de confiança e localização de DCs.",
    commonFlags: [
      { flag: "/dclist:<domínio>", meaning: "Lista DCs registrados" },
      { flag: "/domain_trusts", meaning: "Enumera relações de confiança" },
      { flag: "/dsgetdc:<domínio>", meaning: "Identifica o DC primário e site" }
    ],
    operationalNotes: [
      "Útil para identificar topologia e site assignment do alvo.",
      "Ruído baixo a médio."
    ]
  },
  "Get-ADUser": {
    name: "Get-ADUser",
    category: "powershell-ad",
    synopsis: "Get-ADUser -Filter <filtro> -Properties <props>",
    description: "Cmdlet do módulo ActiveDirectory. Consulta objetos user via LDAP.",
    commonFlags: [
      { flag: "-Filter '*'", meaning: "Lista todos os usuários" },
      { flag: "-Properties servicePrincipalName", meaning: "Inclui SPNs" },
      { flag: "-Properties userAccountControl", meaning: "Inclui flags UAC (DONT_REQ_PREAUTH, etc.)" }
    ],
    operationalNotes: [
      "Requer o RSAT instalado e contexto autenticado.",
      "Filtros LDAP eficientes evitam ruído desnecessário."
    ]
  },
  "Get-ADGroup": {
    name: "Get-ADGroup",
    category: "powershell-ad",
    synopsis: "Get-ADGroup -Filter <filtro> -Properties Members",
    description: "Cmdlet para enumeração de grupos AD e suas memberships.",
    commonFlags: [
      { flag: "-Filter '*'", meaning: "Lista todos os grupos" },
      { flag: "-Properties Members", meaning: "Inclui DNs dos membros" }
    ],
    operationalNotes: [
      "Procure grupos com nomes como Tier0, Admins, ServiceOps."
    ]
  },
  "Get-ADComputer": {
    name: "Get-ADComputer",
    category: "powershell-ad",
    synopsis: "Get-ADComputer -Filter <filtro> -Properties <props>",
    description: "Cmdlet para enumeração de objetos computer (hosts, DCs).",
    commonFlags: [
      { flag: "-Filter '*'", meaning: "Lista todos os hosts" },
      { flag: "-Properties OperatingSystem,TrustedForDelegation", meaning: "Inclui OS e flag de unconstrained delegation" }
    ],
    operationalNotes: [
      "Hosts com TrustedForDelegation = True são alvos prioritários."
    ]
  },
  "Get-DomainUser": {
    name: "Get-DomainUser",
    category: "powerview",
    synopsis: "Get-DomainUser -SPN | -PreauthNotRequired | -AdminCount",
    description: "PowerView (PowerSploit). Enumeração avançada de usuários com filtros prontos.",
    commonFlags: [
      { flag: "-SPN", meaning: "Apenas usuários com SPN (alvos de Kerberoast)" },
      { flag: "-PreauthNotRequired", meaning: "DONT_REQ_PREAUTH (alvos de AS-REP)" },
      { flag: "-AdminCount", meaning: "Contas marcadas como administrativas (AdminCount=1)" }
    ],
    operationalNotes: [
      "PowerView dispara assinaturas de AV/EDR comuns — opere com cuidado.",
      "Cada execução acumula detecção."
    ]
  },
  "Get-DomainGroup": {
    name: "Get-DomainGroup",
    category: "powerview",
    synopsis: "Get-DomainGroup [-Identity] [-MemberIdentity]",
    description: "PowerView: enumeração de grupos e mapeamento de membership reverso.",
    commonFlags: [
      { flag: "-MemberIdentity <user>", meaning: "Grupos onde o usuário é membro" }
    ],
    operationalNotes: ["Combine com -AdminCount para destacar Tier 0."]
  },
  "Get-DomainComputer": {
    name: "Get-DomainComputer",
    category: "powerview",
    synopsis: "Get-DomainComputer [-Unconstrained] [-TrustedToAuth]",
    description: "PowerView: enumeração de hosts com filtros de delegação.",
    commonFlags: [
      { flag: "-Unconstrained", meaning: "Hosts com unconstrained delegation" },
      { flag: "-TrustedToAuth", meaning: "Hosts com constrained delegation (S4U)" }
    ],
    operationalNotes: ["Hosts de relay, jump e gateway costumam ter delegações herdadas."]
  },
  "GetUserSPNs.py": {
    name: "GetUserSPNs.py",
    category: "impacket",
    synopsis: "GetUserSPNs.py <domínio>/<user>:<senha> -dc-ip <ip> [-request]",
    description: "impacket. Lista contas com SPN e requisita TGS para Kerberoasting.",
    commonFlags: [
      { flag: "-request", meaning: "Solicita o TGS e exporta o hash em formato hashcat" },
      { flag: "-outputfile", meaning: "Escreve hashes em arquivo" },
      { flag: "-dc-ip", meaning: "Endereço do DC alvo" }
    ],
    operationalNotes: [
      "Gera evento 4769 (Kerberos service ticket requested) no DC.",
      "Requisitar todos os SPNs aumenta detecção; selecione contas suspeitas."
    ]
  },
  "GetNPUsers.py": {
    name: "GetNPUsers.py",
    category: "impacket",
    synopsis: "GetNPUsers.py <domínio>/ -usersfile users.txt -dc-ip <ip>",
    description: "impacket. Captura AS-REP de contas com pré-autenticação desabilitada.",
    commonFlags: [
      { flag: "-usersfile", meaning: "Lista de usuários candidatos" },
      { flag: "-no-pass", meaning: "Não requer credencial inicial" },
      { flag: "-format hashcat", meaning: "Saída direta para hashcat (-m 18200)" }
    ],
    operationalNotes: [
      "AS-REP bem-sucedido NÃO gera 4768 com falha — bom para stealth.",
      "Use uma userlist enxuta para evitar lockout policy."
    ]
  },
  hashcat: {
    name: "hashcat",
    category: "tool",
    synopsis: "hashcat -m <modo> -a 0 <hashes> <wordlist>",
    description: "Cracking offline. Suporta TGS-REP (-m 13100) e AS-REP (-m 18200).",
    commonFlags: [
      { flag: "-m 13100", meaning: "TGS-REP / Kerberoast" },
      { flag: "-m 18200", meaning: "AS-REP Roasting" },
      { flag: "-r rules/best64.rule", meaning: "Aplicação de regras" }
    ],
    operationalNotes: ["Não gera ruído na rede — cracking é offline."]
  },
  "secretsdump.py": {
    name: "secretsdump.py",
    category: "impacket",
    synopsis: "secretsdump.py <domínio>/<user>:<senha>@<dc> [-just-dc-ntlm]",
    description: "impacket. Realiza DCSync ou dump local de SAM/LSA.",
    commonFlags: [
      { flag: "-just-dc-ntlm", meaning: "Apenas hashes NTLM via DCSync" },
      { flag: "-just-dc-user <user>", meaning: "DCSync direcionado a uma conta (ex.: krbtgt)" }
    ],
    operationalNotes: [
      "Requer privilégio Replicating Directory Changes (All) ou equivalente.",
      "Gera evento 4662 — alvo de regras de detecção dedicadas."
    ]
  },
  "ticketer.py": {
    name: "ticketer.py",
    category: "impacket",
    synopsis: "ticketer.py -nthash <krbtgt-hash> -domain-sid <SID> -domain <domínio> <usuário>",
    description: "impacket. Forja TGTs (Golden Ticket) ou TGSs (Silver Ticket).",
    commonFlags: [
      { flag: "-nthash", meaning: "Hash NTLM da conta krbtgt" },
      { flag: "-domain-sid", meaning: "SID do domínio alvo" },
      { flag: "-groups 512,520,518", meaning: "SIDs de grupos a serem inseridos no PAC" }
    ],
    operationalNotes: [
      "Verifique tempo de vida razoável (TGTs com lifetime de 10 anos chamam atenção).",
      "Use SIDHistory com cuidado em domínios filhos."
    ]
  },
  "psexec.py": {
    name: "psexec.py",
    category: "impacket",
    synopsis: "psexec.py <domínio>/<user>:<senha>@<host>",
    description: "impacket. Executa comando em host remoto via SMB.",
    commonFlags: [
      { flag: "-hashes", meaning: "Autentica com NTLM Pass-the-Hash" },
      { flag: "-k", meaning: "Autentica com ticket Kerberos atual" }
    ],
    operationalNotes: [
      "Cria serviço temporário — alto ruído (EID 7045, 7036).",
      "Prefira wmiexec/smbexec para reduzir detecção."
    ]
  },
  "wmiexec.py": {
    name: "wmiexec.py",
    category: "impacket",
    synopsis: "wmiexec.py <domínio>/<user>:<senha>@<host>",
    description: "impacket. Execução remota via WMI.",
    commonFlags: [
      { flag: "-hashes", meaning: "Pass-the-Hash" },
      { flag: "-shell-type", meaning: "powershell ou cmd" }
    ],
    operationalNotes: ["Ruído menor que psexec; ainda assim WMI é monitorado."]
  },
  "bloodhound-python": {
    name: "bloodhound-python",
    category: "tool",
    synopsis: "bloodhound-python -u <user> -p <senha> -d <domínio> -c All -ns <dc-ip>",
    description: "Ingestor de dados AD para visualização de caminhos de ataque (BloodHound).",
    commonFlags: [
      { flag: "-c All", meaning: "Coleta todos os métodos de coleta" },
      { flag: "-c Default", meaning: "Coleta padrão (menos ruidosa)" },
      { flag: "--zip", meaning: "Compacta a saída" }
    ],
    operationalNotes: [
      "Gera consultas LDAP em volume — produz pico de tráfego.",
      "Use -c Default para reduzir detecção."
    ]
  },
  "Rubeus": {
    name: "Rubeus",
    category: "tool",
    synopsis: "Rubeus.exe <kerberoast|asreproast|ptt|s4u> [opções]",
    description: "Toolkit Kerberos do Specter Ops (C#).",
    commonFlags: [
      { flag: "kerberoast", meaning: "Solicita TGSs de contas com SPN" },
      { flag: "asreproast", meaning: "Captura AS-REP de contas DONT_REQ_PREAUTH" },
      { flag: "ptt", meaning: "Pass-the-ticket: injeta TGT/TGS na sessão" }
    ],
    operationalNotes: ["Versões antigas são detectadas por AV; ofusque ou recompile."]
  }
};

// Aliases comuns
const ALIAS: Record<string, string> = {
  "getuserspns": "GetUserSPNs.py",
  "getuserspns.py": "GetUserSPNs.py",
  "getnpusers": "GetNPUsers.py",
  "getnpusers.py": "GetNPUsers.py",
  "secretsdump": "secretsdump.py",
  "secretsdump.py": "secretsdump.py",
  "ticketer": "ticketer.py",
  "ticketer.py": "ticketer.py",
  "psexec": "psexec.py",
  "psexec.py": "psexec.py",
  "wmiexec": "wmiexec.py",
  "wmiexec.py": "wmiexec.py",
  "bloodhound": "bloodhound-python",
  "bloodhound-python": "bloodhound-python",
  "rubeus": "Rubeus",
  "rubeus.exe": "Rubeus",
  "get-aduser": "Get-ADUser",
  "get-adgroup": "Get-ADGroup",
  "get-adcomputer": "Get-ADComputer",
  "get-domainuser": "Get-DomainUser",
  "get-domaingroup": "Get-DomainGroup",
  "get-domaincomputer": "Get-DomainComputer",
  "hashcat": "hashcat",
  "whoami": "whoami",
  "net": "net",
  "nltest": "nltest"
};

export function resolveCommand(name: string): CommandHelpEntry | null {
  const key = ALIAS[name.toLowerCase()];
  if (key && HELP[key]) return HELP[key];
  if (HELP[name]) return HELP[name];
  return null;
}

export function listKnownCommands(): string[] {
  return Object.keys(HELP);
}

export function formatHelp(entry: CommandHelpEntry): string {
  const flags = entry.commonFlags
    .map(f => `    ${f.flag.padEnd(36)} ${f.meaning}`)
    .join("\n");
  const notes = entry.operationalNotes.map(n => `  • ${n}`).join("\n");
  return [
    `NAME`,
    `    ${entry.name} — ${entry.category}`,
    ``,
    `SYNOPSIS`,
    `    ${entry.synopsis}`,
    ``,
    `DESCRIPTION`,
    `    ${entry.description}`,
    ``,
    `OPTIONS`,
    flags,
    ``,
    `OPERATIONAL NOTES`,
    notes
  ].join("\n");
}
