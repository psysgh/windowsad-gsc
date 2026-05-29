// Gera dataset realista de uma estação terrestre de operação de satélites
// de observação da Terra, de forma determinística a partir de uma seed.

import { Rng } from "./prng";

export interface DomainUser {
  username: string;
  fullName: string;
  role: string;
  group: string;
  enabled: boolean;
  preauthDisabled: boolean;     // alvo de AS-REP Roasting
  passwordLastSet: string;
  description?: string;
  highValue?: boolean;
}

export interface DomainGroup {
  name: string;
  description: string;
  tier: 0 | 1 | 2;
}

export interface DomainHost {
  hostname: string;
  os: string;
  role: string;
  ip: string;
  isDC?: boolean;
  unconstrainedDelegation?: boolean;
}

export interface ServiceAccount {
  username: string;
  spn: string;
  description: string;
  weakPassword: boolean;
  ntlmHash: string;
  group: string;
}

export interface AclEdge {
  principal: string;        // usuário/grupo que possui o privilégio
  rights: string;           // ex: "GenericWrite", "WriteDacl", "GenericAll"
  target: string;           // objeto alvo
  exploitable: boolean;     // se leva a algum caminho
  rationale: string;
}

export interface DelegationFinding {
  account: string;
  type: "unconstrained" | "constrained" | "rbcd";
  target?: string;
  exploitable: boolean;
}

export interface Dataset {
  seed: string;
  shortSeed: string;
  domain: string;
  netbios: string;
  dcHost: string;
  users: DomainUser[];
  groups: DomainGroup[];
  hosts: DomainHost[];
  serviceAccounts: ServiceAccount[];
  acls: AclEdge[];
  delegations: DelegationFinding[];
  initialUser: DomainUser;     // credencial inicial do aluno
  initialPassword: string;
  asrepTarget: DomainUser;     // alvo de AS-REP
  kerberoastTarget: ServiceAccount;
  aclTarget: AclEdge;
  delegationTarget: DelegationFinding;
  lateralHost: DomainHost;
  dcSyncPrincipal: string;     // conta que será usada para DCSync
  krbtgtHash: string;          // alvo do Golden Ticket
  flags: Record<string, string>;
}

const FIRST_NAMES = [
  "ana", "marcos", "helena", "rafael", "isabela", "joao", "camila", "lucas",
  "beatriz", "pedro", "mariana", "guilherme", "fernanda", "ricardo", "patricia",
  "diego", "amanda", "thiago", "carolina", "bruno", "natalia", "felipe",
  "juliana", "andre", "vanessa"
];
const LAST_NAMES = [
  "figueiredo", "tanaka", "cruz", "santos", "oliveira", "almeida", "ferreira",
  "souza", "lima", "ribeiro", "carvalho", "moreira", "pereira", "barbosa",
  "rodrigues", "mendes", "machado", "araujo", "rocha", "campos"
];

const TEAM_ROLES = [
  { role: "Mission Planner", group: "MissionPlanning" },
  { role: "Telemetry Analyst", group: "TelemetryEngineers" },
  { role: "Ground Station Operator", group: "GroundStationOps" },
  { role: "Flight Dynamics Engineer", group: "FlightDynamics" },
  { role: "Payload Processing Engineer", group: "PayloadProcessing" },
  { role: "Earth Observation Scientist", group: "ScienceDataReaders" },
  { role: "SatCom Operator", group: "SatcomOperators" },
  { role: "Orbit Analyst", group: "OrbitDynamics" },
  { role: "Network Operations", group: "NetworkOps" },
  { role: "IAM Engineer", group: "IAMCore" }
];

const HOST_TEMPLATES = [
  { prefix: "gs-relay", role: "Ground station RF relay gateway", os: "Windows Server 2019" },
  { prefix: "tlm-ingest", role: "Telemetry ingestion broker", os: "Windows Server 2022" },
  { prefix: "mp-planner", role: "Mission planning workstation", os: "Windows 10 Enterprise" },
  { prefix: "eo-archive", role: "Earth observation data archive", os: "Windows Server 2019" },
  { prefix: "fd-orbit", role: "Flight dynamics propagator", os: "Windows Server 2022" },
  { prefix: "satcom-ops", role: "SatCom operator workstation", os: "Windows 10 Enterprise" },
  { prefix: "payload-proc", role: "Payload data processor", os: "Windows Server 2019" },
  { prefix: "sci-data", role: "Science data distribution", os: "Windows Server 2019" },
  { prefix: "iam-app", role: "IAM application host", os: "Windows Server 2022" },
  { prefix: "netops-jump", role: "Network operations jump server", os: "Windows Server 2019" },
  { prefix: "dev-mp", role: "Mission planning dev box", os: "Windows 10 Enterprise" }
];

const SERVICE_TEMPLATES = [
  { acct: "svc-telemetry-ingest", spnFor: "tlm-ingest", desc: "Service principal de ingestão de telemetria", group: "TelemetryEngineers" },
  { acct: "svc-orbit-propagator", spnFor: "fd-orbit", desc: "Conta de propagação de órbita (SGP4)", group: "FlightDynamics" },
  { acct: "svc-eo-archive", spnFor: "eo-archive", desc: "Indexador do arquivo de observação da Terra", group: "PayloadProcessing" },
  { acct: "svc-satcom-relay", spnFor: "gs-relay", desc: "Relay RF para enlaces de uplink/downlink", group: "SatcomOperators" },
  { acct: "svc-mp-scheduler", spnFor: "mp-planner", desc: "Scheduler de janelas de passagem", group: "MissionPlanning" },
  { acct: "svc-sci-publisher", spnFor: "sci-data", desc: "Publicador de produtos científicos L1/L2", group: "ScienceDataReaders" }
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function buildDataset(seed: string): Dataset {
  const rng = new Rng(seed);
  const shortSeed = rng.hexHash(3);
  const domain = `groundops-${shortSeed}.corp`;
  const netbios = `GROUNDOPS${shortSeed.toUpperCase()}`;

  // Grupos AD temáticos
  const groups: DomainGroup[] = [
    { name: "Domain Admins", description: "Tier 0 — administradores do domínio", tier: 0 },
    { name: "Enterprise Admins", description: "Tier 0 — administradores da floresta", tier: 0 },
    { name: "Tier0-MissionOps", description: "Operação Tier 0 de missão crítica", tier: 0 },
    { name: "IAMCore", description: "Engenharia de identidade e acesso", tier: 0 },
    { name: "MissionPlanning", description: "Planejamento de janelas e contatos", tier: 1 },
    { name: "TelemetryEngineers", description: "Engenharia de telemetria", tier: 1 },
    { name: "FlightDynamics", description: "Dinâmica de voo e órbita", tier: 1 },
    { name: "SatcomOperators", description: "Operação de SatCom", tier: 1 },
    { name: "PayloadProcessing", description: "Processamento de payload", tier: 1 },
    { name: "OrbitDynamics", description: "Análise orbital", tier: 1 },
    { name: "GroundStationOps", description: "Operação de estação terrestre", tier: 2 },
    { name: "ScienceDataReaders", description: "Consumidores de dados científicos", tier: 2 },
    { name: "NetworkOps", description: "Operação de rede corporativa", tier: 2 }
  ];

  // Hosts
  const hosts: DomainHost[] = HOST_TEMPLATES.map((t, i) => ({
    hostname: `${t.prefix}-${pad2(rng.int(1, 5))}`,
    os: t.os,
    role: t.role,
    ip: `10.${rng.int(20, 90)}.${rng.int(0, 255)}.${rng.int(2, 250)}`
  }));
  // DC
  const dcHost = `dc-iamcore-${pad2(rng.int(1, 3))}`;
  hosts.unshift({
    hostname: dcHost,
    os: "Windows Server 2022 (Domain Controller)",
    role: "Primary Domain Controller para IAM Core",
    ip: `10.10.${rng.int(0, 255)}.${rng.int(2, 30)}`,
    isDC: true
  });

  // Usuários — 25 no total
  const usedNames = new Set<string>();
  const users: DomainUser[] = [];
  for (let i = 0; i < 22; i++) {
    let username = "";
    while (!username || usedNames.has(username)) {
      const f = rng.pick(FIRST_NAMES);
      const l = rng.pick(LAST_NAMES);
      username = `${f}.${l}`;
    }
    usedNames.add(username);
    const team = rng.pick(TEAM_ROLES);
    const fullName = username.split(".").map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
    users.push({
      username,
      fullName,
      role: team.role,
      group: team.group,
      enabled: true,
      preauthDisabled: false,
      passwordLastSet: `202${rng.int(3, 5)}-${pad2(rng.int(1, 12))}-${pad2(rng.int(1, 28))}`
    });
  }

  // Selecionar credencial inicial — operador júnior em GroundStationOps
  const juniorCandidates = users.filter(u => u.group === "GroundStationOps" || u.group === "NetworkOps");
  const initialUser: DomainUser = juniorCandidates.length > 0
    ? juniorCandidates[rng.int(0, juniorCandidates.length - 1)]
    : users[0];
  initialUser.description = "Credencial inicial cedida ao Red Team durante a contratação";
  const initialPassword = `Outono${rng.int(2024, 2026)}!`;

  // Selecionar alvo AS-REP — conta antiga com pré-autenticação desabilitada
  const asrepUserIdx = users.findIndex(u => u !== initialUser && u.group === "MissionPlanning");
  const asrepTarget = users[asrepUserIdx >= 0 ? asrepUserIdx : 1];
  asrepTarget.preauthDisabled = true;
  asrepTarget.description = "Conta legada importada de domínio antigo (DONT_REQ_PREAUTH herdado)";

  // Adicionar usuário de IAM com privilégio aproveitável
  const iamUserName = `${rng.pick(FIRST_NAMES)}.${rng.pick(LAST_NAMES)}`;
  const iamUser: DomainUser = {
    username: iamUserName,
    fullName: iamUserName.split(".").map(p => p[0].toUpperCase() + p.slice(1)).join(" "),
    role: "IAM Engineer",
    group: "IAMCore",
    enabled: true,
    preauthDisabled: false,
    passwordLastSet: "2024-09-12",
    highValue: true,
    description: "Engenheiro de IAM com poder de escrita em objetos sensíveis"
  };
  users.push(iamUser);

  // Service accounts com SPNs
  const serviceAccounts: ServiceAccount[] = SERVICE_TEMPLATES.map(t => {
    const host = hosts.find(h => h.hostname.startsWith(t.spnFor)) || hosts[1];
    return {
      username: t.acct,
      spn: `MSSQLSvc/${host.hostname}.${domain}:1433`,
      description: t.desc,
      weakPassword: false,
      ntlmHash: rng.ntlmHash(),
      group: t.group
    };
  });

  // Kerberoast target — uma das service accounts com senha fraca
  const kerberoastIdx = rng.int(0, serviceAccounts.length - 1);
  serviceAccounts[kerberoastIdx].weakPassword = true;
  serviceAccounts[kerberoastIdx].description += " — senha fraca herdada de migração";
  const kerberoastTarget = serviceAccounts[kerberoastIdx];

  // ACLs — explora caminho do IAM eng escrevendo em Tier0-MissionOps
  const acls: AclEdge[] = [
    {
      principal: iamUser.username,
      rights: "GenericWrite",
      target: "Tier0-MissionOps",
      exploitable: true,
      rationale: "Permite adicionar membros ao grupo Tier 0 — pivot para missão crítica"
    },
    {
      principal: "TelemetryEngineers",
      rights: "ReadProperty",
      target: "svc-telemetry-ingest",
      exploitable: false,
      rationale: "Apenas leitura; comum em delegação interna"
    },
    {
      principal: kerberoastTarget.username,
      rights: "WriteOwner",
      target: "fd-orbit-propagator-service",
      exploitable: false,
      rationale: "Objeto não existe no domínio atual — falso positivo de auditoria antiga"
    },
    {
      principal: "MissionPlanning",
      rights: "WriteDacl",
      target: "svc-mp-scheduler",
      exploitable: true,
      rationale: "Caminho alternativo para forçar mudança de senha em svc-mp-scheduler"
    }
  ];
  const aclTarget = acls[0];

  // Delegações
  const dcCandidate = hosts.find(h => h.hostname.startsWith("netops-jump")) || hosts[2];
  dcCandidate.unconstrainedDelegation = true;
  const delegations: DelegationFinding[] = [
    {
      account: dcCandidate.hostname + "$",
      type: "unconstrained",
      exploitable: true
    },
    {
      account: serviceAccounts[0].username,
      type: "constrained",
      target: `cifs/${dcHost}.${domain}`,
      exploitable: true
    },
    {
      account: serviceAccounts[2].username,
      type: "rbcd",
      target: hosts[3].hostname,
      exploitable: false
    }
  ];
  const delegationTarget = delegations[1];

  // Host alvo de movimento lateral
  const lateralHost = hosts.find(h => h.hostname.startsWith("iam-app")) || hosts[hosts.length - 1];

  // DCSync — usar conta IAM (aceita) ou conta com Replicating Directory Changes
  const dcSyncPrincipal = iamUser.username;

  // krbtgt para Golden Ticket
  const krbtgtHash = rng.ntlmHash();

  // Flags por fase (derivadas)
  const flagCode = (label: string) => `FLAG{GS-${shortSeed.toUpperCase()}-${label}-${rng.hexHash(4).toUpperCase()}}`;
  const flags: Record<string, string> = {
    p2: flagCode("ENUM"),
    p3: flagCode("DISCOVERY"),
    p4: flagCode("SVCACCT"),
    p5: flagCode("ASREP"),
    p6: flagCode("KERBROAST"),
    p7: flagCode("CRACK"),
    p8: flagCode("ACL"),
    p9: flagCode("DELEG"),
    p10: flagCode("LATERAL"),
    p11: flagCode("DCSYNC"),
    p12: flagCode("GOLDEN"),
    p13: flagCode("IMPACT")
  };

  return {
    seed,
    shortSeed,
    domain,
    netbios,
    dcHost,
    users,
    groups,
    hosts,
    serviceAccounts,
    acls,
    delegations,
    initialUser,
    initialPassword,
    asrepTarget,
    kerberoastTarget,
    aclTarget,
    delegationTarget,
    lateralHost,
    dcSyncPrincipal,
    krbtgtHash,
    flags
  };
}
