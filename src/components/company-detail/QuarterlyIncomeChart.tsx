import { Bar, BarChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface QuarterlyIncomeChartDataPoint {
  quarter: string;
  revenue: number;
  grossProfit: number;
  operatingIncome?: number;
  netIncome: number;
  eps: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
}

const CHART_COLORS = {
  revenue: "#818cf8",
  grossProfit: "#34d399",
  netIncome: "#fbbf24",
  grossMargin: "#f472b6",
};

const rechartsAxisStyle = { fill: "#94a3b8", fontSize: 11 };

function formatRevenueThousandsDisplay(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "-";
  // 千元 → 元；display in 台幣億/兆
  const ntd = num * 1000;
  return formatRevenueNTDDisplay(ntd);
}

function formatRevenueNTDDisplay(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "-";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2).replace(/\.?0+$/, "")}兆`;
  if (num >= 1e8) return `${(num / 1e8).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 1e4) return `${(num / 1e4).toFixed(0)}萬`;
  return num.toLocaleString();
}

export function QuarterlyIncomeChart({ data }: { data: QuarterlyIncomeChartDataPoint[] }) {
  if (!data || data.length === 0) return null;
  if (data.length === 1) {
    const d = data[0];
    const gm = d.revenue > 0 ? ((d.grossProfit / d.revenue) * 100).toFixed(1) : "-";
    return (
      <div className="bg-white/[0.02] rounded-xl p-4">
        <div className="text-xs text-[var(--color-text-tertiary)] mb-2">季度損益趨勢</div>
        <div className="grid grid-cols-3 gap-3">
          <div><span className="text-xs text-[var(--color-text-tertiary)]">營收</span><div className="text-sm font-bold text-white">{formatRevenueThousandsDisplay(d.revenue)}</div></div>
          <div><span className="text-xs text-[var(--color-text-tertiary)]">毛利</span><div className="text-sm font-bold text-white">{formatRevenueThousandsDisplay(d.grossProfit)}</div></div>
          <div><span className="text-xs text-[var(--color-text-tertiary)]">淨利</span><div className="text-sm font-bold text-white">{formatRevenueThousandsDisplay(d.netIncome)}</div></div>
        </div>
        <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">毛利率 {gm}%</div>
        <div className="text-xs text-[var(--color-text-tertiary)] text-center py-2 mt-2">📈 資料累積中</div>
      </div>
    );
  }
  const chartData = data.map(d => ({
    quarter: d.quarter,
    revenue: d.revenue / 100000, // 千元 → 億
    grossProfit: d.grossProfit / 100000,
    netIncome: d.netIncome / 100000,
    grossMargin: d.revenue > 0 ? parseFloat(((d.grossProfit / d.revenue) * 100).toFixed(1)) : 0,
  }));
  return (
    <div className="bg-white/[0.02] rounded-xl p-4">
      <div className="text-xs text-[var(--color-text-tertiary)] mb-2">季度損益趨勢</div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="quarter" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
          <YAxis yAxisId="right" orientation="right" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              const n = String(name);
              if (n === "grossMargin") return [`${v}%`, "毛利率"];
              const label = n === "revenue" ? "營收" : n === "grossProfit" ? "毛利" : "淨利";
              return [`${v.toFixed(1)} 億`, label];
            }}
          />
          <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.revenue} radius={[2, 2, 0, 0]} name="revenue" />
          <Bar yAxisId="left" dataKey="grossProfit" fill={CHART_COLORS.grossProfit} radius={[2, 2, 0, 0]} name="grossProfit" />
          <Bar yAxisId="left" dataKey="netIncome" fill={CHART_COLORS.netIncome} radius={[2, 2, 0, 0]} name="netIncome" />
          <Line yAxisId="right" type="monotone" dataKey="grossMargin" stroke={CHART_COLORS.grossMargin} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.grossMargin }} name="grossMargin" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
