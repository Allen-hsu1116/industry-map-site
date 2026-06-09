import { cn } from "@/lib/utils";

interface FinancialIncome {
  revenue: string;
  grossProfit: string;
  operatingIncome: string;
  netIncome: string;
  eps: string;
  revenueYoy?: number;
}

interface FinancialValuation {
  pe: string;
  pb: string;
}

interface FinancialMonthlyRevenue {
  yoy: string;
}

interface TrendQuarterlyIncome {
  quarter: string;
}

interface FinancialOverviewCardsData {
  income: FinancialIncome;
  valuation: FinancialValuation;
  monthly_revenue: FinancialMonthlyRevenue;
  marketCap?: string;
  trends?: {
    quarterly_income?: TrendQuarterlyIncome[];
  };
}

/** Convert ROC quarter labels like "115Q1" → "2026年 Q1", "114Q4" → "2025年 Q4" */
function formatQuarterLabel(q: string): string {
  if (!q) return "-";
  const match = q.match(/(\d{3,4})\s*[Qq季]?\s*([1-4])?/);
  if (match) {
    const rawYear = parseInt(match[1]);
    const ceYear = rawYear < 200 ? rawYear + 1911 : rawYear;
    const quarter = match[2] || (q.includes("Q") ? q.split("Q")[1] : "");
    return quarter ? `${ceYear}年 Q${quarter}` : String(ceYear);
  }
  return q;
}

function formatRevenueDisplay(num: number): string {
  // Backward-compatible default for income statement / quarterly data (千元).
  if (!Number.isFinite(num) || num === 0) return "-";
  const yi = num / 100000; // 千元 -> 億元
  if (Math.abs(yi) >= 10000) return `${(yi / 10000).toFixed(2)} 兆`;
  return `${yi.toFixed(1)} 億`;
}

/* ─── Financial Overview Cards (aistockmap style: 2x4 grid) ─── */
export function FinancialOverviewCards({ data }: { data: FinancialOverviewCardsData }) {
  const rev = parseFloat(data.income.revenue) || 0;
  const gp = parseFloat(data.income.grossProfit) || 0;
  const oi = parseFloat(data.income.operatingIncome) || 0;
  const ni = parseFloat(data.income.netIncome) || 0;
  const eps = data.income.eps || "-";
  const pe = data.valuation.pe || "-";
  const pb = data.valuation.pb || "-";
  // revenueYoy: prefer quarterly YoY from income data (accurate for 季營收);
  // fall back to monthly_revenue.yoy if not available
  const revenueYoy = data.income.revenueYoy != null ? data.income.revenueYoy : (parseFloat(data.monthly_revenue.yoy) || 0);

  const grossMargin = rev > 0 ? ((gp / rev) * 100).toFixed(1) + "%" : "-";
  const operatingMargin = rev > 0 && oi > 0 ? ((oi / rev) * 100).toFixed(1) + "%" : "-";
  const netMargin = rev > 0 && ni > 0 ? ((ni / rev) * 100).toFixed(1) + "%" : "-";

  const marketCap = data.marketCap || "-";

  // Determine the period label for income statement — use CE year
  const latestQuarter = data.trends?.quarterly_income?.[data.trends.quarterly_income.length - 1];
  const periodLabel = latestQuarter ? formatQuarterLabel(latestQuarter.quarter) : "最新季度";

  const cards: { label: string; value: string; sub?: string }[] = [
    { label: `季營收 (${periodLabel})`, value: formatRevenueDisplay(parseFloat(data.income.revenue) || 0), sub: revenueYoy !== 0 ? `${revenueYoy > 0 ? "+" : ""}${revenueYoy.toFixed(1)}%` : undefined },
    { label: "市值", value: marketCap === "-" ? "-" : marketCap },
    { label: "本益比", value: pe, sub: pe !== "-" ? "x" : undefined },
    { label: "股價淨值比", value: pb, sub: pb !== "-" ? "x" : undefined },
    { label: "毛利率", value: grossMargin },
    { label: "營益率", value: operatingMargin },
    { label: "淨利率", value: netMargin },
    { label: "EPS", value: eps, sub: eps !== "-" ? "元" : undefined },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
          最新財務概況{periodLabel ? ` (${periodLabel})` : ""}
        </h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.08] transition-all">
            <div className="text-[11px] text-[var(--color-text-tertiary)] mb-1.5">{card.label}</div>
            <div className="text-xl font-bold text-white">{card.value}</div>
            {card.sub && (
              <div className={cn(
                "text-xs mt-1",
                /^[+-]\d/.test(card.sub) && parseFloat(card.sub) > 0 ? "text-emerald-400" :
                /^[+-]\d/.test(card.sub) && parseFloat(card.sub) < 0 ? "text-rose-400" :
                "text-[var(--color-text-tertiary)]"
              )}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
