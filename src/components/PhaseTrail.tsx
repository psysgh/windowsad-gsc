"use client";

interface Props {
  current: number;
  total: number;
}

export function PhaseTrail({ current, total }: Props) {
  return (
    <div className="phase-trail" aria-label={`Fase ${current} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls = n < current ? "step done" : n === current ? "step current" : "step";
        return <div key={n} className={cls} title={`Fase ${n}`} />;
      })}
    </div>
  );
}
