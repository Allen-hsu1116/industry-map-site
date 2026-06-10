export interface CompanyIndustryTechnologyFocusPanelProps {
  focus: string;
  dailyIndustrySignals: string[];
  dailyIndustryRisks: string[];
  dailyIndustryWatch: string[];
}

export function CompanyIndustryTechnologyFocusPanel({
  focus,
  dailyIndustrySignals,
  dailyIndustryRisks,
  dailyIndustryWatch,
}: CompanyIndustryTechnologyFocusPanelProps) {
  const hasDailyIndustryItems = dailyIndustrySignals.length > 0 || dailyIndustryRisks.length > 0 || dailyIndustryWatch.length > 0;

  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-3">🔬 技術重心</h4>
      <div className="space-y-4">
        {focus.split('\n\n').map((section, si) => {
          const lines = section.split('\n');
          const title = lines[0];
          const bullets = lines.slice(1).filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
          return (
            <div key={si}>
              {title && <p className="text-sm font-semibold text-white mb-2">{title.replace(/^[-•]\s*/, '')}</p>}
              {bullets.length > 0 && (
                <ul className="space-y-1.5">
                  {bullets.map((b, bi) => (
                    <li key={bi} className="text-sm text-[var(--color-text-secondary)] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-indigo-400">
                      {b.replace(/^[-•]\s*/, '')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {hasDailyIndustryItems && (
          <div className="grid gap-3 border-t border-white/[0.04] pt-4 md:grid-cols-3">
            {dailyIndustrySignals.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">題材正向訊號</div>
                <ul className="space-y-1.5">
                  {dailyIndustrySignals.slice(0, 3).map((item, i) => <li key={i} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {item}</li>)}
                </ul>
              </div>
            )}
            {dailyIndustryRisks.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-amber-300">題材風險</div>
                <ul className="space-y-1.5">
                  {dailyIndustryRisks.slice(0, 3).map((item, i) => <li key={i} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {item}</li>)}
                </ul>
              </div>
            )}
            {dailyIndustryWatch.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-sky-300">觀察重點</div>
                <ul className="space-y-1.5">
                  {dailyIndustryWatch.slice(0, 3).map((item, i) => <li key={i} className="text-xs leading-relaxed text-[var(--color-text-secondary)]">• {item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
