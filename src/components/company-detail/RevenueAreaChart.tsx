import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface RevenueAreaChartDataPoint {
  month: string;
  revenue: number;
  mom: number;
  yoy: number;
}

const CHART_COLORS = {
  revenue: "#818cf8",
};

const rechartsAxisStyle = { fill: "#94a3b8", fontSize: 11 };

function formatTrendMonth(month: string): string {
  if (!month) return "-";
  // Handle CE year format like "202405" → "2024/05"
  if (/^\d{6}$/.test(month)) {
    const year = parseInt(month.slice(0, 4));
    if (year >= 2000) {
      // CE format: YYYYMM
      return `${month.slice(0, 4)}/${month.slice(4)}`;
    }
    // ROC format like "11504": 3-digit year + 2-digit month
    const rocYear = parseInt(month.slice(0, 3));
    return `${rocYear + 1911}/${month.slice(3)}`;
  }
  if (/^\d{5}$/.test(month)) {
    // ROC 5-digit format: e.g. "11405"
    const rocYear = parseInt(month.slice(0, 3));
    return `${rocYear + 1911}/${month.slice(3)}`;
  }
  if (month.length === 5 && month.includes("/")) {
    const parts = month.split("/");
    const rocYear = parseInt(parts[0]);
    return `${rocYear + 1911}/${parts[1]}`;
  }
  return month;
}

function formatRevenueNTDDisplay(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "-";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2).replace(/\.?0+$/, "")}兆`;
  if (num >= 1e8) return `${(num / 1e8).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 1e4) return `${(num / 1e4).toFixed(0)}萬`;
  return num.toLocaleString();
}

export function RevenueAreaChart({ data }: { data: RevenueAreaChartDataPoint[] }) {
  if (!data || data.length === 0) return null;
  if (data.length === 1) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">月營收趨勢</span>
          <span className="text-lg font-bold text-white">{formatRevenueNTDDisplay(data[0].revenue)}</span>
        </div>
        <div className="text-xs text-[var(--color-text-tertiary)] text-center py-4">📈 資料累積中，敬請期待完整走勢圖</div>
      </div>
    );
  }
  const chartData = data.map(d => ({
    month: formatTrendMonth(d.month),
    revenue: d.revenue / 100000000, // 元 → 億
    mom: d.mom,
    yoy: d.yoy,
  }));
  return (
    <div className="bg-white/[0.02] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">月營收趨勢</span>
        <span className="text-sm font-bold text-white">{formatRevenueNTDDisplay(data[data.length - 1].revenue)}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: unknown, name: unknown) => [`${Number(value).toFixed(1)} 億`, "營收"]}
          />
          <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} fill="url(#revGrad)" dot={{ r: 3, fill: CHART_COLORS.revenue, stroke: "#1e1e2e", strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
