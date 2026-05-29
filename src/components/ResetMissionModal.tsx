"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetMissionModal({ onClose, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function submit() {
    if (!confirmed) {
      setError("Marque a confirmação antes de prosseguir.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Falha ao resetar");
        return;
      }
      // limpa progresso local também
      try {
        localStorage.removeItem("gs:lastMission");
        localStorage.removeItem("gs:lastStudent");
      } catch {}
      onSuccess();
    } catch {
      setError("Erro de comunicação com o servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="panel-title" style={{ color: "#fca5a5" }}>Reset da atividade — uso restrito do professor</div>
        <p style={{ fontSize: 13, color: "#cbd5e1", marginTop: 10, lineHeight: 1.55 }}>
          Esta operação apaga <b>todas</b> as missões deste laptop — usuário, evidências, justificativas,
          respostas interpretativas e relatórios. Use somente quando a máquina apresentar problema e for
          necessário recomeçar do zero, com autorização do professor.
        </p>

        <label style={{ fontSize: 12, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 14, display: "block" }}>
          Senha do professor
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="mono"
          style={{
            width: "100%",
            marginTop: 4,
            padding: "10px 12px",
            background: "#0a0f1c",
            border: "1px solid #1f2a3d",
            borderRadius: 6,
            color: "#e2e8f0"
          }}
          autoFocus
        />

        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12, fontSize: 12, color: "#cbd5e1" }}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            Confirmo que estou autorizado a apagar todas as missões registradas nesta máquina.
          </span>
        </label>

        {error && <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 10 }}>⚠ {error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>cancelar</button>
          <button
            className="btn btn-danger"
            onClick={submit}
            disabled={busy || password.length < 4}
          >
            {busy ? "Resetando..." : "Confirmar reset"}
          </button>
        </div>
      </div>
    </div>
  );
}
