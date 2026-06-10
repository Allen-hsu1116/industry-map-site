export interface CompanyIndustryMarketPositionPanelProps {
  marketPosition: string;
  detail: string;
}

function marketPositionColor(marketPosition: string) {
  if (marketPosition.includes("龍頭")) return "#34d399";
  if (marketPosition.includes("成長")) return "#fbbf24";
  return "#60a5fa";
}

export function CompanyIndustryMarketPositionPanel({
  marketPosition,
  detail,
}: CompanyIndustryMarketPositionPanelProps) {
  const color = marketPositionColor(marketPosition);

  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-3">🎯 市場定位</h4>
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-3 h-3 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-lg font-bold" style={{ color }}>
          {marketPosition}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {detail}
      </p>
    </div>
  );
}
