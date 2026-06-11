import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";

export interface MarginTradingChartPoint {
  date: string;
  shortMarginRatio: number | null;
  marginBuy: number;
  marginSell: number;
}

export interface MarginTradingRow {
  date: string;
  marginBalanceText: string;
  shortBalanceText: string;
  ratioText: string;
  marginBuyText: string;
  marginSellText: string;
  isStriped: boolean;
}

export interface CompanyMarginTradingPanelProps {
  chartData: MarginTradingChartPoint[];
  rows: MarginTradingRow[];
  shortMarginRatio: string;
}

const marginLabels: Record<string, string> = {
  shortMarginRatio: "券資比",
  marginBuy: "融資買",
  marginSell: "融資賣",
};

export function CompanyMarginTradingPanel({
  chartData,
  rows,
  shortMarginRatio,
}: CompanyMarginTradingPanelProps) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white">💰 融資融券</h4>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
          券資比：<span className="font-bold">{shortMarginRatio}</span>
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={6} />
            <YAxis
              yAxisId="left"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, "auto"]}
            />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.96)",
                border: "1px solid rgba(148,163,184,0.2)",
                borderRadius: "12px",
                color: "#e2e8f0",
              }}
              labelStyle={{ color: "#f8fafc" }}
              itemStyle={{ color: "#cbd5e1" }}
              formatter={(value: unknown, name: unknown) => {
                const numericValue = Number(value);
                return [
                  String(name) === "shortMarginRatio" ? `${numericValue.toFixed(2)}%` : numericValue.toLocaleString(),
                  marginLabels[String(name)] || String(name),
                ];
              }}
            />
            <Legend formatter={(value: string) => marginLabels[value] || value} />
            <Line
              type="monotone"
              dataKey="shortMarginRatio"
              yAxisId="left"
              stroke="#fbbf24"
              strokeWidth={2.5}
              dot={{ r: 2 }}
              name="券資比"
              connectNulls
            />
            <Bar dataKey="marginBuy" yAxisId="right" fill="rgba(34,197,94,0.45)" name="融資買" />
            <Bar dataKey="marginSell" yAxisId="right" fill="rgba(239,68,68,0.45)" name="融資賣" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-hidden rounded-xl mt-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
              <th className="px-2 py-1.5 text-left">日期</th>
              <th className="px-2 py-1.5 text-right">融資餘額</th>
              <th className="px-2 py-1.5 text-right">融券餘額</th>
              <th className="px-2 py-1.5 text-right">券資比</th>
              <th className="px-2 py-1.5 text-right">融資買</th>
              <th className="px-2 py-1.5 text-right">融資賣</th>
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
                <td className="px-2 py-1 text-right text-indigo-400 font-medium">{row.marginBalanceText}</td>
                <td className="px-2 py-1 text-right text-pink-400 font-medium">{row.shortBalanceText}</td>
                <td className="px-2 py-1 text-right font-bold text-white">{row.ratioText}</td>
                <td className="px-2 py-1 text-right text-emerald-400">{row.marginBuyText}</td>
                <td className="px-2 py-1 text-right text-rose-400">{row.marginSellText}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
