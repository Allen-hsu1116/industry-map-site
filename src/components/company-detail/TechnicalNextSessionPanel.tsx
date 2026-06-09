export interface TechnicalNextSessionPanelProps {
  nextSession: {
    focus: string[];
    triggerRules: string[];
  };
}

/* ─── Technical Next Session Panel ─── */
export function TechnicalNextSessionPanel({ nextSession }: TechnicalNextSessionPanelProps) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5">
      <div className="mb-3 text-sm font-bold text-white">🎯 明日觀察與盤中觸發條件</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-cyan-300">觀察重點</div>
          <ul className="space-y-1.5">
            {nextSession.focus.map((item, index) => (
              <li key={index} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">觸發條件</div>
          <ul className="space-y-1.5">
            {nextSession.triggerRules.map((item, index) => (
              <li key={index} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
