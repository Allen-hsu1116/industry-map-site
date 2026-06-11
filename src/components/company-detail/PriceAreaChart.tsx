import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface PriceAreaChartDataPoint {
  month: string;
  high: number;
  low: number;
  avg: number;
}

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

export function PriceAreaChart({ data }: { data: PriceAreaChartDataPoint[] }) {
  const chartData = data.map(d => ({
    month: formatTrendMonth(d.month),
    avg: d.avg,
    high: d.high,
    low: d.low,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="month" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value: unknown, name: unknown) => {
            const label = String(name) === "avg" ? "均價" : String(name) === "high" ? "最高" : "最低";
            return [`${Number(value).toLocaleString()} 元`, label];
          }}
        />
        <Area type="monotone" dataKey="avg" stroke="#818cf8" strokeWidth={2} fill="url(#priceGrad)" dot={{ r: 3, fill: "#818cf8", stroke: "#1e1e2e", strokeWidth: 1.5 }} activeDot={{ r: 5 }} name="avg" />
        <Line type="monotone" dataKey="high" stroke="#34d399" strokeWidth={1} strokeDasharray="4 4" dot={false} name="high" />
        <Line type="monotone" dataKey="low" stroke="#f87171" strokeWidth={1} strokeDasharray="4 4" dot={false} name="low" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
