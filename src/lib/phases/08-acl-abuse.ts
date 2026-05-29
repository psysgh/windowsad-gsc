import type { PhaseDefinition } from "./types";

export const phase08: PhaseDefinition = {
  number: 8,
  technicalName: "ACL Abuse",
  thematicName: "Abuso de permissões herdadas no grupo Tier 0",
  objective:
    "Mapear o caminho de ataque via ACL: conta IAM com GenericWrite em Tier0-MissionOps. Confirmar a permissão e planejar o pivot.",
  context: ds =>
    [
      `🛡️ Senha em mão. Agora você quer ir do nível "operador" para o nível "rei do reino".`,
      `   BloodHound enxerga o grafo do AD como ele realmente é: vértices e arestas. Uma ACE solta`,
      `   é exatamente o tipo de aresta que ninguém limpa porque "sempre foi assim".`,
      ``,
      `🔍 O que você suspeita:`,
      `   • Principal : ${ds.aclTarget.principal}`,
      `   • Direito   : ${ds.aclTarget.rights}`,
      `   • Sobre     : ${ds.aclTarget.target}`,
      `   • Por quê   : ${ds.aclTarget.rationale}`,
      ``,
      `🎯 Confirmar essa relação no BloodHound dá o "ok" para abusar dela: escrever o membership de`,
      `   ${ds.aclTarget.target} e galgar até Domain Admins. A coleta -c Default é stealth, a -c All é arma de gente apressada.`,
      ``,
      `📝 Antes de avançar, você precisará justificar por que escolheu o caminho que escolheu.`,
      ``,
      `💡 Você está num laptop fora do domínio — use a versão Python do ingestor BloodHound.`
    ].join("\n"),
  expectedCommand: "bloodhound-python",
  requiresJustification: true,
  options: [
    {
      id: "a",
      text: "bloodhound-python -u {svc} -p '<senha>' -d {dom} -c Default -ns <DC-IP> --zip",
      correct: true,
      response: ds =>
        [
          `INFO: Connecting to LDAP server: ${ds.dcHost}.${ds.domain}`,
          `INFO: Found 1 domains`,
          `INFO: Compressing output into 2026...bloodhound.zip`,
          ``,
          `[+] Caminho confirmado:`,
          `    ${ds.aclTarget.principal} --[GenericWrite]--> Tier0-MissionOps --[member]--> Domain Admins`,
          `[+] Plano: usar a conta de serviço comprometida para se autenticar como ${ds.aclTarget.principal}`,
          `    via técnicas de targeted Kerberoast/credential abuse antes de adicionar membros ao grupo.`
        ].join("\n"),
      scoreDelta: 1.4,
      detectionDelta: 6,
      budgetDelta: -6,
      unlockEvidences: ds => [
        {
          label: "Path BloodHound",
          payload: {
            from: ds.aclTarget.principal,
            edge: "GenericWrite",
            to: "Tier0-MissionOps",
            chain: ["Tier0-MissionOps", "Domain Admins"]
          }
        }
      ],
      flag: ds => ds.flags.p8
    },
    {
      id: "b",
      text: "bloodhound-python -u {svc} -p '<senha>' -d {dom} -c All -ns <DC-IP>",
      correct: true,
      alternativePath: true,
      response: ds =>
        [
          `INFO: Collecting via: All`,
          `INFO: This is going to be noisy.`,
          ``,
          `[+] Mesmo caminho identificado, porém com volume LDAP/SMB elevado.`,
          `[!] Detecção +12 — caminho válido, mas operacionalmente arriscado.`
        ].join("\n"),
      scoreDelta: 0.7,
      detectionDelta: 12,
      budgetDelta: -6,
      unlockEvidences: ds => [
        {
          label: "Path BloodHound (coleta agressiva)",
          payload: { method: "All", from: ds.aclTarget.principal, to: ds.aclTarget.target }
        }
      ],
      flag: ds => ds.flags.p8
    },
    {
      id: "c",
      text: "net group 'Domain Admins' {user} /add /domain",
      correct: false,
      response: () =>
        "Tentar adicionar diretamente sem ter o privilégio falha em UAC e gera 4728 imediato — equipe de IAM alertada.",
      scoreDelta: -0.6,
      detectionDelta: 20,
      budgetDelta: -5
    },
    {
      id: "d",
      text: "Get-Acl 'AD:CN=Tier0-MissionOps,...' | Format-List",
      correct: false,
      alternativePath: true,
      response: ds =>
        [
          `Path        : Microsoft.ActiveDirectory.Management.dll\\ActiveDirectory:://...`,
          `Owner       : ${ds.netbios}\\Domain Admins`,
          `Access      : ${ds.aclTarget.principal} -> ${ds.aclTarget.rights} (Allow)`,
          ``,
          `[~] Confirma a ACE mas não monta o grafo completo. Caminho válido como sanity-check.`
        ].join("\n"),
      scoreDelta: 0.4,
      detectionDelta: 3,
      budgetDelta: -4
    },
    {
      id: "e",
      text: "Set-DomainObject Tier0-MissionOps -Set @{description='owned'}",
      correct: false,
      response: () =>
        "Escrita destrutiva sem autenticação como principal — operacionalmente irreversível e ostensiva.",
      scoreDelta: -0.7,
      detectionDelta: 25,
      budgetDelta: -8
    }
  ],
  techExplanation:
    "ACL Abuse depende de mapear o grafo de privilégios. BloodHound (-c Default) gera tráfego LDAP controlado; coletas 'All' incluem sessões, SPNs e ACLs em massa — mais ruído."
};
