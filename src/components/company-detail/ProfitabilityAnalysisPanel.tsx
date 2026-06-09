"use client";

import { cn } from "@/lib/utils";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ProfitTab = "quarterly" | "yearly";

interface TrendQuarterlyIncome { quarter: string; revenue: number; grossProfit: number; operatingIncome?: number; netIncome: number; eps: number; grossMargin?: number; operatingMargin?: number; netMargin?: number; }

interface FinancialTrends {
  quarterly_income?: TrendQuarterlyIncome[];
}

interface ProfitabilityAnalysisPanelData {
  trends?: FinancialTrends;
}

const rechartsAxisStyle = { fill: "#94a3b8", fontSize: 11 };

/** Convert ROC quarter labels like "115Q1" → "2026年 Q1", "114Q4" → "2025年 Q4" */
function formatQuarterLabel(q: string): string {
  if (!q) return "-";
  const match = q.match(/^(\d{2,3})Q(\d)$/);
  if (match) {
    const rocYear = parseInt(match[1]);
    const qNum = match[2];
    return `${rocYear + 1911}年 Q${qNum}`;
  }
  // If already in CE format like "2025Q1"
  const ceMatch = q.match(/^(\d{4})Q(\d)$/);
  if (ceMatch) {
    return `${ceMatch[1]}年 Q${ceMatch[2]}`;
  }
  return q;
}

/* ─── Profitability Analysis Panel (aistockmap style) ─── */
export function ProfitabilityAnalysisPanel({ data, profitTab, onProfitTabChange }: { data: ProfitabilityAnalysisPanelData; profitTab: ProfitTab; onProfitTabChange: (tab: ProfitTab) => void }) {
  const trends = data.trends;
  if (!trends?.quarterly_income || trends.quarterly_income.length < 2) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4">📈 獲利能力趨勢</h4>
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">📋 季度資料累積中</div>
      </div>
    );
  }

  const profitTabs: { id: "quarterly" | "yearly"; label: string }[] = [
    { id: "quarterly", label: "季度" },
    { id: "yearly", label: "年度" },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">獲利能力趨勢</h4>
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
          {profitTabs.map(tab => (
            <button
              key={tab.id}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                profitTab === tab.id
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-gray-400 hover:text-[var(--color-text-secondary)]"
              )}
              onClick={() => onProfitTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {profitTab === "quarterly" && (
        <ProfitabilityQuarterlyView data={trends.quarterly_income} />
      )}

      {profitTab === "yearly" && (() => {
        const yearlyMap = new Map<number, { grossProfit: number; operatingIncome: number; netIncome: number; eps: number; revenue: number }>();
        trends.quarterly_income.forEach(q => {
          const yearMatch = q.quarter.match(/(\d{3,4})/);
          if (yearMatch) {
            const raw = parseInt(yearMatch[1]);
            const yr = raw < 200 ? raw + 1911 : raw;
            const existing = yearlyMap.get(yr) || { grossProfit: 0, operatingIncome: 0, netIncome: 0, eps: 0, revenue: 0 };
            yearlyMap.set(yr, {
              grossProfit: existing.grossProfit + q.grossProfit,
              operatingIncome: existing.operatingIncome + (q.operatingIncome || (q.operatingMargin && q.revenue > 0 ? q.revenue * q.operatingMargin / 100 : 0)),
              netIncome: existing.netIncome + q.netIncome,
              eps: existing.eps + q.eps,
              revenue: existing.revenue + q.revenue,
            });
          }
        });
        const yearlyData = Array.from(yearlyMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([yr, vals]) => ({
            year: String(yr),
            grossMargin: vals.revenue > 0 ? parseFloat(((vals.grossProfit / vals.revenue) * 100).toFixed(1)) : 0,
            operatingMargin: vals.revenue > 0 ? parseFloat(((vals.operatingIncome / vals.revenue) * 100).toFixed(1)) : 0,
            netMargin: vals.revenue > 0 ? parseFloat(((vals.netIncome / vals.revenue) * 100).toFixed(1)) : 0,
            eps: parseFloat(vals.eps.toFixed(2)),
          }));
        return <ProfitabilityChartAndTable data={yearlyData} periodKey="year" periodLabel="年度" />;
      })()}
    </div>
  );
}

/* ─── Profitability Quarterly View ─── */
function ProfitabilityQuarterlyView({ data }: { data: TrendQuarterlyIncome[] }) {
  const chartData = data.map(d => ({
    quarter: d.quarter,
    grossMargin: d.grossMargin ?? (d.revenue > 0 ? parseFloat(((d.grossProfit / d.revenue) * 100).toFixed(1)) : 0),
    operatingMargin: d.operatingMargin ?? (d.revenue > 0 && d.grossProfit > 0 ? parseFloat((((d.grossProfit - (d.revenue > 0 ? (d.revenue * 0.08) : 0)) / d.revenue) * 100).toFixed(1)) : 0),
    netMargin: d.netMargin ?? (d.revenue > 0 ? parseFloat(((d.netIncome / d.revenue) * 100).toFixed(1)) : 0),
    eps: d.eps,
  }));
  return <ProfitabilityChartAndTable data={chartData} periodKey="quarter" periodLabel="季度" />;
}

/* ─── Profitability Chart + Table ─── */
function ProfitabilityChartAndTable({ data, periodKey, periodLabel }: { data: { grossMargin: number; netMargin: number; eps: number; operatingMargin?: number; [key: string]: unknown }[]; periodKey: string; periodLabel: string }) {
  // Format the period label — convert ROC year quarters to CE
  const formatPeriodLabel = (val: unknown) => {
    const s = String(val);
    if (periodKey === "quarter") return formatQuarterLabel(s);
    if (periodKey === "year") return s;
    return s;
  };
  return (
    <>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey={periodKey} tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: string) => formatPeriodLabel(v)} />
          <YAxis yAxisId="left" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <YAxis yAxisId="right" orientation="right" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              const n = String(name);
              if (n === "grossMargin") return [`${v}%`, "毛利率"];
              if (n === "operatingMargin") return [`${v}%`, "營益率"];
              if (n === "netMargin") return [`${v}%`, "淨利率"];
              if (n === "eps") return [`${v.toFixed(2)} 元`, "EPS"];
              return [`${v}`, n];
            }}
          />
          <Legend formatter={(value: string) => value === "grossMargin" ? "毛利率" : value === "operatingMargin" ? "營益率" : value === "netMargin" ? "淨利率" : value === "eps" ? "EPS" : value} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar yAxisId="right" dataKey="eps" fill="#6366f1" fillOpacity={0.6} radius={[3, 3, 0, 0]} name="eps" />
          <Line yAxisId="left" type="monotone" dataKey="grossMargin" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: "#f472b6", stroke: "#1e1e2e", strokeWidth: 1.5 }} activeDot={{ r: 5 }} name="grossMargin" />
          <Line yAxisId="left" type="monotone" dataKey="operatingMargin" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: "#22d3ee", stroke: "#1e1e2e", strokeWidth: 1.5 }} activeDot={{ r: 5 }} name="operatingMargin" />
          <Line yAxisId="left" type="monotone" dataKey="netMargin" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: "#fbbf24", stroke: "#1e1e2e", strokeWidth: 1.5 }} activeDot={{ r: 5 }} name="netMargin" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-4 overflow-hidden rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
              <th className="px-3 py-2 text-left">{periodLabel}</th>
              <th className="px-3 py-2 text-right">毛利率</th>
              <th className="px-3 py-2 text-right">營益率</th>
              <th className="px-3 py-2 text-right">淨利率</th>
              <th className="px-3 py-2 text-right">EPS</th>
            </tr>
          </thead>
          <tbody className="max-h-52 overflow-y-auto">
            {[...data].reverse().slice(0, 10).map((row, i) => (
              <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{formatPeriodLabel(row[periodKey])}</td>
                <td className="px-3 py-1.5 text-right text-pink-400 font-medium">{row.grossMargin.toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-right text-cyan-400 font-medium">{row.operatingMargin !== undefined ? `${row.operatingMargin.toFixed(1)}%` : "-"}</td>
                <td className="px-3 py-1.5 text-right text-yellow-400 font-medium">{row.netMargin.toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-right text-indigo-400 font-medium">{row.eps.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
