export interface CompanyTechnicalIndicatorCard {
  label: string;
  value: string;
  sub: string;
  color: string;
}

export interface CompanyTechnicalIndicatorsPanelProps {
  cards: CompanyTechnicalIndicatorCard[];
}

export function CompanyTechnicalIndicatorsPanel({ cards }: CompanyTechnicalIndicatorsPanelProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
      <h4 className="text-sm font-bold text-white mb-4">📈 技術指標數值</h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => (
          <div key={item.label} className="bg-white/[0.04] rounded-xl p-4">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{item.label}</p>
            <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
