"use client";

interface Option {
  id: string;
  text: string;
}

interface Props {
  command: string;
  options: Option[];
  revisit?: boolean;
  onChoose: (id: string) => void;
  onClose: () => void;
  busy: boolean;
}

export function CommandOptionsModal({ command, options, revisit, onChoose, onClose, busy }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div className="panel-title">Invocação completa para</div>
          {revisit && (
            <span className="tag tag-accent" title="Você já abriu este modal antes nesta fase — reabrir é grátis.">
              reconsulta · sem custo
            </span>
          )}
        </div>
        <div className="mono" style={{ fontSize: 16, color: "#5eead4", marginTop: 2 }}>{command}</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
          {revisit
            ? "Você já viu estas opções nesta fase. Pode fechar e voltar quantas vezes quiser sem perder pontos ou orçamento — só a escolha final é registrada."
            : "Escolha a forma correta de chamar este comando para a fase atual. Apenas uma é ideal; algumas podem funcionar como caminhos alternativos (com pontuação menor) e outras são incorretas."}
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
          {options.map(o => (
            <button key={o.id} className="option-card" disabled={busy} onClick={() => onChoose(o.id)}>
              <span className="id-chip">{o.id.toUpperCase()}</span>
              <span className="mono" style={{ fontSize: 12, color: "#cbd5e1", flex: 1 }}>{o.text}</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>cancelar</button>
        </div>
      </div>
    </div>
  );
}
