"use client";

import { cn } from "@/lib/utils";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type RevenueTab = "monthly" | "quarterly" | "yearly";

interface TrendMonthlyRevenue { month: string; revenue: number; mom: number; yoy: number; }
interface TrendQuarterlyIncome { quarter: string; revenue: number; grossProfit: number; operatingIncome?: number; netIncome: number; eps: number; grossMargin?: number; operatingMargin?: number; netMargin?: number; }

interface FinancialTrends {
  monthly_revenue?: TrendMonthlyRevenue[];
  quarterly_income?: TrendQuarterlyIncome[];
}

interface RevenueAnalysisPanelData {
  trends?: FinancialTrends;
}

function formatPercentNum(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

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

/** Format MOPS income statement values. Unit: 千元. */
function formatRevenueThousandsDisplay(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "-";
  // 千元 → 元；display in 台幣億/兆
  const ntd = num * 1000;
  return formatRevenueNTDDisplay(ntd);
}

/** Format monthly revenue / market values. Unit: 元. */
function formatRevenueNTDDisplay(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "-";
  if (num >= 1e12) return `${(num / 1e12).toFixed(2).replace(/\.?0+$/, "")}兆`;
  if (num >= 1e8) return `${(num / 1e8).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 1e4) return `${(num / 1e4).toFixed(0)}萬`;
  return num.toLocaleString();
}

function formatRevenueDisplay(num: number): string {
  // Backward-compatible default for income statement / quarterly data (千元).
  return formatRevenueThousandsDisplay(num);
}

const CHART_COLORS = {
  revenue: "#818cf8",
  grossProfit: "#34d399",
  netIncome: "#fbbf24",
  grossMargin: "#f472b6",
  price: "#60a5fa",
  priceHigh: "#93c5fd",
  priceLow: "#60a5fa",
  mom: "#f97316",
  yoy: "#34d399",
};

const rechartsAxisStyle = { fill: "#94a3b8", fontSize: 11 };

/* ─── Revenue Analysis Panel (aistockmap style) ─── */
export function RevenueAnalysisPanel({ data, revenueTab, onRevenueTabChange }: { data: RevenueAnalysisPanelData; revenueTab: RevenueTab; onRevenueTabChange: (tab: RevenueTab) => void }) {
  const trends = data.trends;
  const revenueTabs: { id: "monthly" | "quarterly" | "yearly"; label: string }[] = [
    { id: "monthly", label: "月份" },
    { id: "quarterly", label: "季度" },
    { id: "yearly", label: "年度" },
  ];

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">營收分析趨勢</h4>
        {/* Pill buttons */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
          {revenueTabs.map(tab => (
            <button
              key={tab.id}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                revenueTab === tab.id
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-gray-400 hover:text-[var(--color-text-secondary)]"
              )}
              onClick={() => onRevenueTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly */}
      {revenueTab === "monthly" && trends?.monthly_revenue && trends.monthly_revenue.length > 1 && (
        <>
          <RevenueComposedChart data={trends.monthly_revenue} mode="monthly" />
          <div className="mt-4 overflow-hidden rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                  <th className="px-3 py-2 text-left">月份</th>
                  <th className="px-3 py-2 text-right">營收（元→億）</th>
                  <th className="px-3 py-2 text-right">MoM</th>
                  <th className="px-3 py-2 text-right">YoY</th>
                </tr>
              </thead>
              <tbody className="max-h-52 overflow-y-auto">
                {trends.monthly_revenue.slice().reverse().slice(0, 12).map((row, i) => (
                  <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                    <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{formatTrendMonth(row.month)}</td>
                    <td className="px-3 py-1.5 text-right text-white font-medium">{formatRevenueNTDDisplay(row.revenue)}</td>
                    <td className={cn("px-3 py-1.5 text-right", row.mom >= 0 ? "text-rose-400" : "text-emerald-400")}>{formatPercentNum(row.mom)}</td>
                    <td className={cn("px-3 py-1.5 text-right", row.yoy >= 0 ? "text-rose-400" : "text-emerald-400")}>{formatPercentNum(row.yoy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {revenueTab === "monthly" && (!trends?.monthly_revenue || trends.monthly_revenue.length <= 1) && (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">📋 月營收資料累積中</div>
      )}

      {/* Quarterly */}
      {revenueTab === "quarterly" && trends?.quarterly_income && trends.quarterly_income.length > 1 && (
        (() => {
          const qi = trends.quarterly_income!;
          // Pre-compute YoY and QoQ for each quarter
          const qiWithRates = qi.map((row, idx) => {
            const prev4 = idx >= 4 ? qi[idx - 4] : null;
            const prev1 = idx >= 1 ? qi[idx - 1] : null;
            const yoy = prev4 && prev4.revenue > 0 ? ((row.revenue - prev4.revenue) / prev4.revenue * 100) : null;
            const qoq = prev1 && prev1.revenue > 0 ? ((row.revenue - prev1.revenue) / prev1.revenue * 100) : null;
            return { ...row, yoy, qoq };
          });
          return (<>
          <RevenueComposedChart data={qi} mode="quarterly" />
          <div className="mt-4 overflow-hidden rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                  <th className="px-3 py-2 text-left">季度</th>
                  <th className="px-3 py-2 text-right">營收</th>
                  <th className="px-3 py-2 text-right">QoQ</th>
                  <th className="px-3 py-2 text-right">YoY</th>
                </tr>
              </thead>
              <tbody className="max-h-52 overflow-y-auto">
                {[...qiWithRates].reverse().slice(0, 8).map((row, i) => (
                    <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                      <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{formatQuarterLabel(row.quarter)}</td>
                      <td className="px-3 py-1.5 text-right text-white font-medium">{formatRevenueDisplay(row.revenue)}</td>
                      <td className={cn("px-3 py-1.5 text-right", row.qoq !== null && row.qoq >= 0 ? "text-rose-400" : row.qoq !== null ? "text-emerald-400" : "text-[var(--color-text-tertiary)]")}>
                        {row.qoq !== null ? formatPercentNum(row.qoq) : "-"}
                      </td>
                      <td className={cn("px-3 py-1.5 text-right", row.yoy !== null && row.yoy >= 0 ? "text-rose-400" : row.yoy !== null ? "text-emerald-400" : "text-[var(--color-text-tertiary)]")}>
                        {row.yoy !== null ? formatPercentNum(row.yoy) : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>)})()
      )}
      {revenueTab === "quarterly" && (!trends?.quarterly_income || trends.quarterly_income.length <= 1) && (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">📋 季度資料累積中</div>
      )}

      {/* Yearly */}
      {revenueTab === "yearly" && trends?.quarterly_income && trends.quarterly_income.length > 0 && (() => {
        const yearlyMap = new Map<number, { revenue: number; grossProfit: number; netIncome: number }>();
        trends.quarterly_income.forEach(q => {
          const yearMatch = q.quarter.match(/(\d{3,4})/);
          if (yearMatch) {
            const raw = parseInt(yearMatch[1]);
            const yr = raw < 200 ? raw + 1911 : raw;
            const existing = yearlyMap.get(yr) || { revenue: 0, grossProfit: 0, netIncome: 0 };
            yearlyMap.set(yr, { revenue: existing.revenue + q.revenue, grossProfit: existing.grossProfit + q.grossProfit, netIncome: existing.netIncome + q.netIncome });
          }
        });
        const yearlyData = Array.from(yearlyMap.entries())
          .sort(([a], [b]) => a - b)
          .map(([yr, vals]) => ({
            year: String(yr),
            revenue: vals.revenue,
            grossProfit: vals.grossProfit,
            netIncome: vals.netIncome,
          }));
        // Calculate YoY for yearly
        const yearlyWithYoy = yearlyData.map((d, i) => ({
          ...d,
          yoy: i > 0 && yearlyData[i - 1].revenue > 0 ? ((d.revenue - yearlyData[i - 1].revenue) / yearlyData[i - 1].revenue * 100) : null,
        }));
        const chartData = yearlyWithYoy.map(d => ({
          year: d.year,
          revenue: d.revenue / 1e9,  // 千元 → 兆
          yoy: d.yoy,
        }));
        return (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="year" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}兆`} />
                <YAxis yAxisId="right" orientation="right" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(value: unknown, name: unknown) => {
                    const v = Number(value);
                    const n = String(name);
                    if (n === "yoy") return [`${v.toFixed(1)}%`, "YoY"];
                    return [`${v.toFixed(2)} 兆`, "營收"];
                  }}
                />
                <Legend formatter={(value: string) => value === "revenue" ? "營收" : "YoY"} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} name="revenue" />
                <Line yAxisId="right" type="monotone" dataKey="yoy" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="yoy" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 overflow-hidden rounded-xl">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                    <th className="px-3 py-2 text-left">年度</th>
                    <th className="px-3 py-2 text-right">營收</th>
                    <th className="px-3 py-2 text-right">年度YoY%</th>
                  </tr>
                </thead>
                <tbody className="max-h-52 overflow-y-auto">
                  {yearlyWithYoy.slice().reverse().slice(0, 10).map((row, i) => (
                    <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                      <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{row.year}</td>
                      <td className="px-3 py-1.5 text-right text-white font-medium">{formatRevenueDisplay(row.revenue)}</td>
                      <td className={cn("px-3 py-1.5 text-right", row.yoy !== null && row.yoy >= 0 ? "text-emerald-400" : "text-rose-400")}>
                        {row.yoy !== null ? formatPercentNum(row.yoy) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}
      {revenueTab === "yearly" && (!trends?.quarterly_income || trends.quarterly_income.length === 0) && (
        <div className="text-center py-8 text-[var(--color-text-tertiary)] text-sm">📋 年度資料準備中</div>
      )}
    </div>
  );
}

/* ─── Revenue ComposedChart (bar + YoY line) ─── */
function RevenueComposedChart({ data, mode }: { data: TrendMonthlyRevenue[] | TrendQuarterlyIncome[]; mode: "monthly" | "quarterly" }) {
  if (mode === "monthly") {
    const monthlyData = (data as TrendMonthlyRevenue[]).map(d => ({
      period: formatTrendMonth(d.month),
      revenue: d.revenue / 100000000, // 元 → 億
      mom: d.mom,
      yoy: d.yoy,
    }));
    return (
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={monthlyData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="period" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
          <YAxis yAxisId="right" orientation="right" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              const n = String(name);
              if (n === "yoy") return [`${v.toFixed(1)}%`, "YoY"];
              if (n === "mom") return [`${v.toFixed(1)}%`, "MoM"];
              return [`${v.toFixed(1)} 億`, "營收"];
            }}
          />
          <Legend formatter={(value: string) => value === "revenue" ? "營收" : value === "yoy" ? "YoY" : "MoM"} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} name="revenue" />
          <Line yAxisId="right" type="monotone" dataKey="yoy" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="yoy" />
          <Line yAxisId="right" type="monotone" dataKey="mom" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: "#f97316", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="mom" />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // Quarterly mode: show revenue bars + YoY line + QoQ line
  const quarterlyData = data as TrendQuarterlyIncome[];
  // Calculate YoY by comparing to quarter from 4 periods ago, QoQ by comparing to previous quarter
  const chartData = quarterlyData.map((d, idx) => {
    const prevSameQ = idx >= 4 ? quarterlyData[idx - 4] : null;
    const prevQ = idx >= 1 ? quarterlyData[idx - 1] : null;
    const yoy = prevSameQ && prevSameQ.revenue > 0 ? ((d.revenue - prevSameQ.revenue) / prevSameQ.revenue * 100) : null;
    const qoq = prevQ && prevQ.revenue > 0 ? ((d.revenue - prevQ.revenue) / prevQ.revenue * 100) : null;
    return {
      period: formatQuarterLabel(d.quarter),
      revenue: d.revenue / 100000, // 千元 → 億
      yoy,
      qoq,
    };
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 5, right: 15, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="period" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
        <YAxis yAxisId="right" orientation="right" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(value: unknown, name: unknown) => {
            const v = Number(value);
            const n = String(name);
            if (n === "yoy") return [v !== null ? `${v.toFixed(1)}%` : "-", "YoY"];
            if (n === "qoq") return [v !== null ? `${v.toFixed(1)}%` : "-", "QoQ"];
            return [`${v.toFixed(1)} 億`, "營收"];
          }}
        />
        <Legend formatter={(value: string) => value === "revenue" ? "營收" : value === "yoy" ? "YoY" : "QoQ"} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
        <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.revenue} radius={[3, 3, 0, 0]} name="revenue" />
        <Line yAxisId="right" type="monotone" dataKey="yoy" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="yoy" connectNulls={false} />
        <Line yAxisId="right" type="monotone" dataKey="qoq" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: "#a78bfa", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="qoq" connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

