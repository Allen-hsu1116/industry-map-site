import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface FinancialDividend {
  year: string;
  cashDividendPerShare: string;
}

interface FinancialDividendHistoryEntry {
  year: string;
  cashDividend: number;
  stockDividend: number;
  totalDividend: number;
}

interface DividendPolicyPanelData {
  dividend: FinancialDividend;
  dividendHistory?: FinancialDividendHistoryEntry[];
}

const rechartsAxisStyle = { fill: "#94a3b8", fontSize: 11 };

/** Convert ROC year string like "107" → "2018" */
function formatROCYear(year: string): string {
  if (!year) return "-";
  const raw = parseInt(year);
  if (Number.isFinite(raw) && raw < 200) return String(raw + 1911);
  return year;
}

/* ─── Dividend Policy Panel (aistockmap style) ─── */
export function DividendPolicyPanel({ data }: { data: DividendPolicyPanelData }) {
  const history = data.dividendHistory;
  const currentCash = data.dividend.cashDividendPerShare || "-";

  // If we have history data, show chart + table
  if (history && history.length > 0) {
    const chartData = history.slice(-8);
    return (
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
            股利政策
          </h4>
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            配息頻率: 季
          </span>
        </div>

        {/* Bar Chart */}
        <div className="bg-white/[0.02] rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--color-text-tertiary)]">歷年股利發放</span>
            <span className="text-xs text-[var(--color-text-tertiary)]">最新現金股利：<span className="text-indigo-400 font-bold">{currentCash}</span> 元/股</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="year" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
              <YAxis tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: unknown, name: unknown) => {
                  const v = Number(value);
                  const n = String(name);
                  const label = n === "cashDividend" ? "現金股利" : n === "stockDividend" ? "股票股利" : "合計";
                  return [`${v.toFixed(2)} 元`, label];
                }}
              />
              <Legend formatter={(value: string) => value === "cashDividend" ? "現金股利" : value === "stockDividend" ? "股票股利" : "合計"} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Bar dataKey="cashDividend" fill="#6366f1" radius={[3, 3, 0, 0]} name="cashDividend" />
              <Bar dataKey="stockDividend" fill="#f97316" radius={[3, 3, 0, 0]} name="stockDividend" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dividend table — HTML <table> */}
        <div className="overflow-hidden rounded-xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
                <th className="px-3 py-2 text-left">所屬年度</th>
                <th className="px-3 py-2 text-right">現金股利</th>
                <th className="px-3 py-2 text-right">股票股利</th>
                <th className="px-3 py-2 text-right">合計股利</th>
              </tr>
            </thead>
            <tbody className="max-h-48 overflow-y-auto">
              {history.slice(0, 10).map((row, i) => (
                <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                  <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{formatROCYear(row.year)}</td>
                  <td className="px-3 py-1.5 text-right text-indigo-400 font-medium">{row.cashDividend.toFixed(2)} 元</td>
                  <td className="px-3 py-1.5 text-right text-orange-400 font-medium">{row.stockDividend.toFixed(2)} 元</td>
                  <td className="px-3 py-1.5 text-right text-white font-medium">{row.totalDividend.toFixed(2)} 元</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback: show simple dividend info
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
          股利政策
        </h4>
      </div>
      <div className="bg-white/[0.02] rounded-xl p-6 text-center">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">現金股利</div>
            <div className="text-2xl font-bold text-indigo-400">{currentCash}<span className="text-sm font-normal text-[var(--color-text-tertiary)] ml-1">元/股</span></div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)] mb-1">股利年度</div>
            <div className="text-2xl font-bold text-white">{data.dividend.year || "-"}</div>
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-tertiary)]">📋 歷年股利資料準備中</p>
      </div>
    </div>
  );
}
