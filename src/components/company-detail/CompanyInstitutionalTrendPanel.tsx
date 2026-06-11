import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

export interface InstitutionalTrendChartPoint {
  date: string;
  foreign: number;
  trust: number;
  dealer: number;
  total: number;
}

export interface InstitutionalTrendRow {
  date: string;
  foreignText: string;
  foreignClassName: string;
  trustText: string;
  trustClassName: string;
  dealerText: string;
  dealerClassName: string;
  totalText: string;
  totalClassName: string;
  isStriped: boolean;
}

export interface CompanyInstitutionalTrendPanelProps {
  chartData: InstitutionalTrendChartPoint[];
  rows: InstitutionalTrendRow[];
  formatShares: (shares: number) => string;
}

const investorLabels: Record<string, string> = {
  foreign: "外資",
  trust: "投信",
  dealer: "自營商",
  total: "合計",
};

export function CompanyInstitutionalTrendPanel({
  chartData,
  rows,
  formatShares,
}: CompanyInstitutionalTrendPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-4">📊 三大法人買賣超趨勢（近30日）</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={6} />
            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(value) =>
                value >= 1000
                  ? `${(value / 1000).toFixed(0)}千`
                  : value <= -1000
                    ? `${(value / 1000).toFixed(0)}千`
                    : `${value}`
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.96)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: "12px",
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#f8fafc" }}
              itemStyle={{ color: "#cbd5e1" }}
              formatter={(value: unknown, name: unknown) => [
                `${formatShares(Number(value) * 1000)}張`,
                investorLabels[String(name)] || String(name),
              ]}
            />
            <Legend formatter={(value: string) => investorLabels[value] || value} />
            <Bar dataKey="foreign" fill="rgba(99,102,241,0.6)" name="外資" />
            <Bar dataKey="trust" fill="rgba(34,211,238,0.6)" name="投信" />
            <Bar dataKey="dealer" fill="rgba(251,191,36,0.6)" name="自營商" />
            <Line type="monotone" dataKey="total" stroke="#f472b6" strokeWidth={2} dot={false} name="合計" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-hidden rounded-xl mt-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
              <th className="px-2 py-1.5 text-left">日期</th>
              <th className="px-2 py-1.5 text-right">外資</th>
              <th className="px-2 py-1.5 text-right">投信</th>
              <th className="px-2 py-1.5 text-right">自營商</th>
              <th className="px-2 py-1.5 text-right">合計</th>
            </tr>
          </thead>
          <tbody className="max-h-48 overflow-y-auto">
            {rows.map((row) => (
              <tr
                key={row.date}
                className={cn(
                  "border-t border-white/[0.03] hover:bg-white/[0.02]",
                  row.isStriped ? "bg-white/[0.01]" : "",
                )}
              >
                <td className="px-2 py-1 text-[var(--color-text-secondary)]">{row.date}</td>
                <td className={`px-2 py-1 text-right font-medium ${row.foreignClassName}`}>{row.foreignText}</td>
                <td className={`px-2 py-1 text-right font-medium ${row.trustClassName}`}>{row.trustText}</td>
                <td className={`px-2 py-1 text-right font-medium ${row.dealerClassName}`}>{row.dealerText}</td>
                <td className={`px-2 py-1 text-right font-bold ${row.totalClassName}`}>{row.totalText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
