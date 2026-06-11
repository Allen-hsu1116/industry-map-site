import { CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

export interface ValuationTrendChartPoint {
  date: string;
  pe: number;
  pb: number;
  dividendYield: number;
}

export interface ValuationTrendRow {
  date: string;
  peText: string;
  pbText: string;
  dividendYieldText: string;
  isStriped: boolean;
}

export interface CompanyValuationTrendPanelProps {
  chartData: ValuationTrendChartPoint[];
  rows: ValuationTrendRow[];
}

const valuationLabels: Record<string, string> = {
  pe: "本益比",
  pb: "淨值比",
  dividendYield: "殖利率%",
};

export function CompanyValuationTrendPanel({ chartData, rows }: CompanyValuationTrendPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <h4 className="text-sm font-bold text-white mb-4">📐 本益比 / 淨值比 / 殖利率趨勢</h4>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={6} />
            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, "auto"]} />
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
                Number(value).toFixed(2),
                valuationLabels[String(name)] || String(name),
              ]}
            />
            <Legend formatter={(value: string) => valuationLabels[value] || value} />
            <Line type="monotone" dataKey="pe" yAxisId="left" stroke="#818cf8" strokeWidth={2} dot={false} name="本益比" />
            <Line type="monotone" dataKey="pb" yAxisId="left" stroke="#f472b6" strokeWidth={2} dot={false} name="淨值比" />
            <Line
              type="monotone"
              dataKey="dividendYield"
              yAxisId="right"
              stroke="#22ab94"
              strokeWidth={2}
              dot={false}
              name="殖利率%"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
              <th className="px-3 py-2 text-left">日期</th>
              <th className="px-3 py-2 text-right">本益比</th>
              <th className="px-3 py-2 text-right">淨值比</th>
              <th className="px-3 py-2 text-right">殖利率%</th>
            </tr>
          </thead>
          <tbody className="max-h-52 overflow-y-auto">
            {rows.map((row) => (
              <tr
                key={row.date}
                className={cn(
                  "border-t border-white/[0.03] hover:bg-white/[0.02]",
                  row.isStriped ? "bg-white/[0.01]" : "",
                )}
              >
                <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{row.date}</td>
                <td className="px-3 py-1.5 text-right text-white font-medium">{row.peText}</td>
                <td className="px-3 py-1.5 text-right text-white font-medium">{row.pbText}</td>
                <td className="px-3 py-1.5 text-right text-white font-medium">{row.dividendYieldText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
