"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroIllustration } from "@/components/HeroIllustration";
import { ResetMissionModal } from "@/components/ResetMissionModal";

interface SavedStudent {
  name: string;
  rm: string;
}

interface ResumeInfo {
  id: string;
  studentName: string | null;
  status: string;
  currentPhase: number;
  maxPhase: number;
}

export default function HomePage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [rm, setRm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeInfo | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Carrega progresso local (formulário pré-preenchido e missão ativa)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("gs:lastStudent");
      if (raw) {
        const saved: SavedStudent = JSON.parse(raw);
        if (saved.name) setStudentName(saved.name);
        if (saved.rm) setRm(saved.rm);
      }
    } catch {}
    try {
      const lastId = localStorage.getItem("gs:lastMission");
      if (lastId) {
        fetch(`/api/missions/${lastId}`)
          .then(r => (r.ok ? r.json() : null))
          .then(data => {
            if (data && data.status === "in_progress") {
              setResume({
                id: data.id,
                studentName: data.studentName,
                status: data.status,
                currentPhase: data.currentPhase,
                maxPhase: data.maxPhase
              });
            } else {
              localStorage.removeItem("gs:lastMission");
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const nameOk = studentName.trim().length >= 3;
  const rmOk = /^[A-Za-z0-9._-]{4,}$/.test(rm.trim());
  const canStart = nameOk && rmOk;

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const cleanName = studentName.trim();
      const cleanRm = rm.trim();
      try {
        localStorage.setItem("gs:lastStudent", JSON.stringify({ name: cleanName, rm: cleanRm }));
      } catch {}
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed: cleanRm,
          studentName: `${cleanName} — RM ${cleanRm}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao iniciar missão");
      try {
        localStorage.setItem("gs:lastMission", data.id);
      } catch {}
      router.push(`/mission/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erro");
      setBusy(false);
    }
  }

  function continueMission() {
    if (resume) router.push(`/mission/${resume.id}`);
  }

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 1100, width: "100%", display: "grid", gap: 16 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="#5eead4" strokeWidth="1.4" />
              <circle cx="12" cy="12" r="3.2" fill="#5eead4" />
              <line x1="12" y1="3" x2="12" y2="6" stroke="#5eead4" strokeWidth="1.4" />
              <line x1="12" y1="18" x2="12" y2="21" stroke="#5eead4" strokeWidth="1.4" />
            </svg>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                FIAP · Global Solution
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Offensive Security</div>
            </div>
          </div>
          <button className="btn-link" onClick={() => setResetOpen(true)}>
            ⚙ reset (uso do professor)
          </button>
        </header>

        <section className="hero panel-elevated">
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 360px)", gap: 24, alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
                Ground Station Compromise
              </h1>
              <p style={{ color: "#cbd5e1", marginTop: 10, lineHeight: 1.6, fontSize: 15 }}>
                Uma operadora civil de satélites de observação da Terra suspeita que seu segmento solo —
                onde rodam telemetria, planejamento de janelas de passagem e processamento de payload —
                foi tocado por um ator externo. Você é o(a) analista ofensivo(a) contratado(a) para
                provar, etapa por etapa, até onde uma credencial banal de operador júnior pode chegar.
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                <span className="tag tag-accent">13 fases técnicas</span>
                <span className="tag tag-muted">terminal educacional</span>
                <span className="tag tag-muted">pontuação 0 — 10</span>
                <span className="tag tag-muted">relatório PDF/JSON</span>
              </div>
            </div>
            <HeroIllustration className="hero-illust" />
          </div>
        </section>

        {resume && (
          <section className="panel panel-elevated" style={{ padding: 16, borderColor: "#134e4a" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="panel-title" style={{ color: "#5eead4" }}>Missão em andamento detectada</div>
                <div style={{ fontSize: 14, color: "#e2e8f0", marginTop: 4 }}>
                  {resume.studentName ?? "Aluno"} · fase {resume.currentPhase} de 13
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  Seu progresso foi salvo automaticamente. Você pode continuar de onde parou ou começar uma nova tentativa abaixo
                  (a anterior fica registrada).
                </div>
              </div>
              <button className="btn btn-primary" onClick={continueMission}>Continuar missão →</button>
            </div>
          </section>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: 16 }}>
          <div className="panel panel-elevated" style={{ padding: 22 }}>
            <div className="panel-title">Como funciona</div>
            <ol style={{ marginTop: 10, paddingLeft: 18, color: "#cbd5e1", fontSize: 13.5, lineHeight: 1.7 }}>
              <li>
                Você entra com nome e RM. O <span className="mono" style={{ color: "#5eead4" }}>RM vira a semente</span>{" "}
                do cenário — usuários, hashes simulados, flags e até o nome do domínio são exclusivos da sua tentativa.
              </li>
              <li>
                Em cada fase, um terminal espera o comando técnico esperado. Digitar só o nome do comando
                (<span className="mono">whoami</span>, <span className="mono">GetNPUsers.py</span>...) abre 5 opções
                de invocação completa; algumas certas, algumas falsamente atraentes.
              </li>
              <li>
                Suas decisões mexem em três medidores: <b>pontuação</b>, <b>detecção</b> (o ruído operacional que você gera) e{" "}
                <b>orçamento</b> de operação (cada ação custa).
              </li>
              <li>
                Em algumas fases você precisa <b>justificar a escolha</b> ou responder uma pergunta de interpretação.
                Tudo entra no relatório.
              </li>
              <li>
                Ao final — ou ao desistir — você exporta um relatório (PDF/JSON) que vai para o professor.
              </li>
            </ol>
          </div>

          <div className="panel panel-elevated" style={{ padding: 22 }}>
            <div className="panel-title">Identificação</div>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Nome completo
                </label>
                <input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="ex.: João da Silva"
                  style={{
                    width: "100%", marginTop: 4, padding: "10px 12px",
                    background: "#0a0f1c", border: "1px solid #1f2a3d",
                    borderRadius: 6, color: "#e2e8f0"
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  RM (registro do aluno)
                </label>
                <input
                  value={rm}
                  onChange={e => setRm(e.target.value)}
                  placeholder="ex.: 558293"
                  className="mono"
                  style={{
                    width: "100%", marginTop: 4, padding: "10px 12px",
                    background: "#0a0f1c", border: "1px solid #1f2a3d",
                    borderRadius: 6, color: "#e2e8f0"
                  }}
                />
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                  Seu RM gera o cenário. Mesmo RM, mesmo domínio simulado — útil para o professor reproduzir
                  sua tentativa a partir do relatório.
                </div>
              </div>
              {error && <div style={{ color: "#fca5a5", fontSize: 13 }}>⚠ {error}</div>}
              <button
                className="btn btn-primary"
                onClick={start}
                disabled={busy || !canStart}
                style={{ justifyContent: "center", padding: "11px 16px" }}
              >
                {busy ? "Iniciando..." : resume ? "Iniciar nova tentativa" : "Iniciar missão"}
              </button>
              {!canStart && (studentName || rm) && (
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {!nameOk && "Informe seu nome completo (mín. 3 caracteres). "}
                  {!rmOk && "RM inválido (mín. 4 caracteres alfanuméricos)."}
                </div>
              )}
            </div>
          </div>
        </section>

        <footer style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", padding: "8px 4px" }}>
          <span>Laboratório educacional — todas as ferramentas e saídas são simuladas.</span>
          <span>v1.0 · roda 100% offline</span>
        </footer>
      </div>

      {resetOpen && (
        <ResetMissionModal
          onClose={() => setResetOpen(false)}
          onSuccess={() => {
            setResetOpen(false);
            setResume(null);
            setError(null);
            setStudentName("");
            setRm("");
            alert("Atividade resetada com sucesso.");
          }}
        />
      )}
    </main>
  );
}
