"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import industriesData from "../../public/data/industries.json";
import companiesData from "../../public/data/companies.json";

/* ─── Types ─── */
interface CompanyInGroup { code: string; name: string; role: string; relevance: string; analysis?: string; }
interface Group { name: string; companies: CompanyInGroup[]; }
interface TopicData { slug: string; name: string; description: string; total: number; groups: Group[]; }
interface CompanyData { code: string; name: string; topic_count: number; topics: string[]; }

interface FinancialProfile { industry: string; chairman: string; established: string; listed: string; capital: string; website: string; }
interface FinancialValuation { date: string; pe: string; pb: string; dividendYield: string; }
interface FinancialPrice { date: string; open: number; high: number; low: number; close: number; volume: number; }
interface FinancialIncome { revenue: string; grossProfit: string; operatingIncome: string; netIncome: string; eps: string; }
interface FinancialMonthlyRevenue { month: string; revenue: string; mom: string; yoy: string; }
interface FinancialBalance { totalAssets: string; totalLiabilities: string; equity: string; bookValuePerShare: string; }
interface FinancialDividend { year: string; cashDividendPerShare: string; }

interface TrendMonthlyRevenue { month: string; revenue: number; mom: number; yoy: number; }
interface TrendQuarterlyIncome { quarter: string; revenue: number; grossProfit: number; netIncome: number; eps: number; }
interface TrendMonthlyPrice { month: string; high: number; low: number; avg: number; volume: number; }

interface FinancialTrends {
  monthly_revenue?: TrendMonthlyRevenue[];
  quarterly_income?: TrendQuarterlyIncome[];
  monthly_price?: TrendMonthlyPrice[];
}

interface FinancialData {
  code: string;
  name: string;
  profile: FinancialProfile;
  valuation: FinancialValuation;
  price: FinancialPrice;
  income: FinancialIncome;
  monthly_revenue: FinancialMonthlyRevenue;
  balance: FinancialBalance;
  dividend: FinancialDividend;
  trends?: FinancialTrends;
  updatedAt: string;
}

const CATEGORY_COLORS: Record<string, { gradient: string; solid: string; light: string; bg: string }> = {
  "半導體製造": { gradient: "from-blue-500 to-blue-700", solid: "#3b82f6", light: "#93c5fd", bg: "bg-blue-500/10" },
  "IC設計":     { gradient: "from-purple-500 to-purple-700", solid: "#8b5cf6", light: "#c4b5fd", bg: "bg-purple-500/10" },
  "IC 設計":    { gradient: "from-purple-500 to-purple-700", solid: "#8b5cf6", light: "#c4b5fd", bg: "bg-purple-500/10" },
  "先進封測":   { gradient: "from-cyan-500 to-cyan-700", solid: "#06b6d4", light: "#67e8f9", bg: "bg-cyan-500/10" },
  "基板材料":   { gradient: "from-amber-500 to-amber-700", solid: "##f59e0b", light: "#fcd34d", bg: "bg-amber-500/10" },
  "記憶體":     { gradient: "from-green-500 to-green-700", solid: "#22c55e", light: "##86efac", bg: "bg-green-500/10" },
  "AI 伺服器":  { gradient: "from-rose-500 to-rose-700", solid: "#f43f5e", light: "#fda4af", bg: "bg-rose-500/10" },
  "散熱冷卻":   { gradient: "from-orange-500 to-orange-700", solid: "#f97316", light: "#fdba74", bg: "bg-orange-500/10" },
  "散熱":       { gradient: "from-orange-500 to-orange-700", solid: "#f97316", light: "#fdba74", bg: "bg-orange-500/10" },
  "電子零組件": { gradient: "from-indigo-500 to-indigo-700", solid: "#6366f1", light: "#a5b4fc", bg: "bg-[var(--color-primary)]/10" },
  "被動元件":   { gradient: "from-teal-500 to-teal-700", solid: "##14b8a6", light: "#5eead4", bg: "bg-teal-500/10" },
  "網通衛星":   { gradient: "from-sky-500 to-sky-700", solid: "#0ea5e9", light: "#7dd3fc", bg: "bg-sky-500/10" },
  "光學顯示":   { gradient: "from-fuchsia-500 to-fuchsia-700", solid: "#d946ef", light: "#f0abfc", bg: "bg-fuchsia-500/10" },
  "消費終端":   { gradient: "from-pink-500 to-pink-700", solid: "#ec4899", light: "#f9a8d4", bg: "bg-pink-500/10" },
  "醫療器材":   { gradient: "from-red-500 to-red-700", solid: "#ef4444", light: "#fca5a5", bg: "bg-red-500/10" },
  "綠能環保":   { gradient: "from-emerald-500 to-emerald-700", solid: "#10b981", light: "#6ee7b7", bg: "bg-emerald-500/10" },
  "傳產工業":   { gradient: "from-yellow-500 to-yellow-700", solid: "#eab308", light: "#fde047", bg: "bg-yellow-500/10" },
  "金融航運":   { gradient: "from-slate-400 to-slate-600", solid: "#94a3b8", light: "#cbd5e1", bg: "bg-slate-500/10" },
  "智慧機器人": { gradient: "from-violet-500 to-violet-700", solid: "#7c3aed", light: "#c4b5fd", bg: "bg-violet-500/10" },
  "軟體資安":   { gradient: "from-lime-500 to-lime-700", solid: "#84cc16", light: "#bef264", bg: "bg-lime-500/10" },
  "HPC":        { gradient: "from-indigo-500 to-indigo-700", solid: "#6366f1", light: "#a5b4fc", bg: "bg-[var(--color-primary)]/10" },
  "光通訊":     { gradient: "from-pink-400 to-pink-600", solid: "#f472b6", light: "#f9a8d4", bg: "bg-pink-500/10" },
};

const DEFAULT_COLOR = { gradient: "from-gray-500 to-gray-700", solid: "#6b7280", light: "#d1d5db", bg: "bg-gray-500/10" };

function getCategory(topicName: string): string {
  if (topicName.includes("｜")) return topicName.split("｜")[0];
  return "其他";
}
function getCategoryColor(topicName: string) {
  const cat = getCategory(topicName);
  return CATEGORY_COLORS[cat] || DEFAULT_COLOR;
}

const ROLE_BADGE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  "核心": { label: "核心", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  "成長": { label: "成長", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  "利基": { label: "利基", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  "相關": { label: "相關", color: "#a1a1aa", bg: "rgba(161,161,170,0.12)" },
};

function getRelevanceInfo(relevance: string): { label: string; className: string; emoji: string } {
  const r = String(relevance).trim();
  if (r === "極高" || r === "high") return { label: "核心", className: "badge-core", emoji: "🟢" };
  if (r === "高" || r === "90" || r === "95" || r === "80" || r === "85") return { label: "核心", className: "badge-core", emoji: "🟢" };
  if (r === "中" || r === "medium" || r === "70" || r === "75") return { label: "成長", className: "badge-growth", emoji: "🟠" };
  if (r === "低" || r === "60" || r === "65" || r === "55") return { label: "利基", className: "badge-niche", emoji: "🔵" };
  return { label: "相關", className: "badge-related", emoji: "⚪" };
}

function getRoleBadge(relevance: string) {
  const info = getRelevanceInfo(relevance);
  return ROLE_BADGE_MAP[info.label] || ROLE_BADGE_MAP["相關"];
}

function mapGroupNames(groups: Group[]): Group[] {
  const levelNames = ["上游原料與設備", "中游製造與組件", "下游系統與應用", "周邊與服務", "其他"];
  return groups.map((g, i) => ({ ...g, name: g.name || levelNames[i] || `群組 ${i + 1}` }));
}

/* ─── Number formatting helpers (Chinese units) ─── */
function formatMoneyNTD(thousands: string): string {
  const num = parseFloat(thousands);
  if (isNaN(num) || num === 0) return "-";
  if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}億`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}百萬`;
  return num.toLocaleString();
}

function formatMoneyNTDNum(num: number): string {
  if (num === 0) return "-";
  if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}億`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}百萬`;
  return num.toLocaleString();
}

function formatCapitalNTD(ntd: string): string {
  const num = parseFloat(ntd);
  if (isNaN(num) || num === 0) return "-";
  if (num >= 1e11) return `${(num / 1e11).toFixed(1).replace(/\.0$/, "")}百億`;
  if (num >= 1e10) return `${(num / 1e10).toFixed(1).replace(/\.0$/, "")}十億`;
  if (num >= 1e8) return `${(num / 1e8).toFixed(2)}億`;
  return num.toLocaleString();
}

function formatPercent(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num)) return "-";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function formatPercentAbs(val: string): string {
  const num = parseFloat(val);
  if (isNaN(num)) return "-";
  return `${num.toFixed(2)}%`;
}

function formatPercentNum(val: number): string {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

function formatPrice(num: number): string {
  if (num === 0) return "-";
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${y}/${m}/${d}`;
}

function formatRocDate(dateStr: string): string {
  if (!dateStr) return "-";
  return dateStr;
}

function formatTrendMonth(month: string): string {
  if (!month) return "-";
  if (month.length === 5) {
    const y = parseInt(month.slice(0, 3));
    const m = month.slice(3);
    return `${y + 1911}/${m}`;
  }
  return month;
}

function formatTrendQuarter(quarter: string): string {
  if (!quarter) return "-";
  return quarter;
}

type TabId = "focus" | "topics" | "map" | "companies";
type CompanyDetailTab = "overview" | "financials" | "supply_chain";

/* ─── Sparkline SVG Component ─── */
function SparkLine({
  data,
  width = 120,
  height = 32,
  color = "#818cf8",
  gradientFrom = "#818cf8",
  showDots = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  gradientFrom?: string;
  showDots?: boolean;
}) {
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const step = data.length > 1 ? chartW / (data.length - 1) : 0;

  const points = data.map((val, i) => {
    const x = data.length === 1 ? width / 2 : padding + i * step;
    const y = height - padding - ((val - min) / range) * chartH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath = data.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : "";

  const gradId = `spark-grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.3" />
          <stop offset="100%" stopColor={gradientFrom} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {data.length > 1 && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {showDots && points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={data.length <= 8 ? 2.5 : 1.5} fill={i === points.length - 1 ? color : "var(--color-surface)"} stroke={color} strokeWidth="1" />
      ))}
      {showDots && points.length > 0 && (
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={color} opacity="0.2" />
      )}
    </svg>
  );
}

/* ─── Trend Indicator (up/down arrow) ─── */
function TrendIndicator({ value, suffix = "%", size = "sm" }: { value: number; suffix?: string; size?: "sm" | "md" }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const arrow = isNeutral ? "─" : isPositive ? "▲" : "▼";
  const colorClass = isNeutral ? "text-[var(--color-text-tertiary)]" : isPositive ? "text-emerald-400" : "text-rose-400";
  const textSize = size === "md" ? "text-base" : "text-xs";
  return (
    <span className={cn("font-semibold tabular-nums", colorClass, textSize)}>
      {arrow} {Math.abs(value).toFixed(2)}{suffix}
    </span>
  );
}

/* ─── Tiny icon components ─── */
function SearchIcon({ className = "w-4.5 h-4.5" }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}
function CloseIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function ArrowIcon() {
  return <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
}
function ExternalIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}
function AiIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;
}

/* ─── Financial Detail Components ─── */
function StatItem({ label, value, sub, className = "", trend }: { label: string; value: string | React.ReactNode; sub?: string; className?: string; trend?: React.ReactNode }) {
  return (
    <div className={cn("bg-[var(--color-sm)] bg-white/[0.02] rounded-xl p-4", className)}>
      <div className="text-xs text-[var(--color-text-tertiary)] mb-1.5 flex items-center gap-1.5">{label}{trend}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-[var(--color-text-tertiary)] mt-1">{sub}</div>}
    </div>
  );
}

function TrendSparkLine({ data, color, label, formattedValue }: { data: number[]; color?: string; label: string; formattedValue: string }) {
  return (
    <div className="bg-white/[0.02] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">{label}</span>
        <span className="text-sm font-bold text-white">{formattedValue}</span>
      </div>
      <SparkLine data={data} width={180} height={36} color={color || "#818cf8"} gradientFrom={color || "#818cf8"} showDots={data.length <= 12} />
    </div>
  );
}

function CompanyFinancialPanel({ data }: { data: FinancialData }) {
  const trends = data.trends;
  const grossMargin = (() => {
    const rev = parseFloat(data.income.revenue);
    const gp = parseFloat(data.income.grossProfit);
    if (rev > 0 && gp > 0) return ((gp / rev) * 100).toFixed(1) + "%";
    return "-";
  })();
  const netMargin = (() => {
    const rev = parseFloat(data.income.revenue);
    const ni = parseFloat(data.income.netIncome);
    if (rev > 0 && ni > 0) return ((ni / rev) * 100).toFixed(1) + "%";
    return "-";
  })();
  const debtRatio = (() => {
    const assets = parseFloat(data.balance.totalAssets);
    const liabilities = parseFloat(data.balance.totalLiabilities);
    if (assets > 0 && liabilities > 0) return ((liabilities / assets) * 100).toFixed(1) + "%";
    return "-";
  })();

  // Extract trend data for sparklines
  const revenueTrendData: number[] = trends?.monthly_revenue?.map(d => d.revenue) || [];
  const momTrendData: number[] = trends?.monthly_revenue?.map(d => d.mom) || [];
  const yoyTrendData: number[] = trends?.monthly_revenue?.map(d => d.yoy) || [];
  const epsTrendData: number[] = trends?.quarterly_income?.map(d => d.eps) || [];
  const gpTrendData: number[] = trends?.quarterly_income?.map(d => {
    const rev = d.revenue;
    return rev > 0 ? (d.grossProfit / rev) * 100 : 0;
  }) || [];
  const niTrendData: number[] = trends?.quarterly_income?.map(d => {
    const rev = d.revenue;
    return rev > 0 ? (d.netIncome / rev) * 100 : 0;
  }) || [];
  const priceAvgData: number[] = trends?.monthly_price?.map(d => d.avg) || [];

  return (
    <div className="space-y-6">
      {/* Valuation + Price Sparkline */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📈 估值指標</h4>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="本益比 (P/E)" value={data.valuation.pe || "-"} sub={data.valuation.pe ? "倍" : undefined} />
          <StatItem label="股價淨值比 (P/B)" value={data.valuation.pb || "-"} sub={data.valuation.pb ? "倍" : undefined} />
          <StatItem label="現金殖利率" value={data.valuation.dividendYield ? `${data.valuation.dividendYield}%` : "-"} />
          <StatItem label="每股淨值" value={data.balance.bookValuePerShare || "-"} sub="元" />
        </div>
      </div>

      {/* Price with sparkline */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">💹 股價資訊</h4>
        {/* Price sparkline */}
        {priceAvgData.length > 0 && (
          <div className="bg-white/[0.02] rounded-xl p-5 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--color-text-tertiary)]">月均價趨勢</span>
              <span className="text-lg font-bold text-white">{formatPrice(data.price.close)} <span className="text-xs text-[var(--color-text-tertiary)]">元</span></span>
            </div>
            <SparkLine data={priceAvgData} width={320} height={48} color="#818cf8" gradientFrom="#818cf8" showDots={priceAvgData.length <= 12} />
          </div>
        )}
        <div className="grid grid-cols-4 gap-3">
          <StatItem label="收盤價" value={formatPrice(data.price.close)} sub="元" className="col-span-2" />
          <StatItem label="開盤" value={formatPrice(data.price.open)} sub="元" />
          <StatItem label="成交量" value={formatPrice(data.price.volume)} sub="張" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatItem label="最高" value={formatPrice(data.price.high)} sub="元" />
          <StatItem label="最低" value={formatPrice(data.price.low)} sub="元" />
        </div>
      </div>

      {/* Income with trend sparklines */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📊 財務摘要</h4>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="營業收入" value={formatMoneyNTD(data.income.revenue)} sub="千元" className="col-span-2" />
          <StatItem
            label="毛利"
            value={formatMoneyNTD(data.income.grossProfit)}
            sub={`毛利率 ${grossMargin}`}
            trend={gpTrendData.length > 1 ? <SparkLine data={gpTrendData} width={40} height={14} color="#34d399" showDots={false} /> : undefined}
          />
          <StatItem
            label="淨利"
            value={formatMoneyNTD(data.income.netIncome)}
            sub={`淨利率 ${netMargin}`}
            trend={niTrendData.length > 1 ? <SparkLine data={niTrendData} width={40} height={14} color="#818cf8" showDots={false} /> : undefined}
          />
          <StatItem
            label="EPS"
            value={data.income.eps || "-"}
            sub="元/股"
            trend={epsTrendData.length > 1 ? <SparkLine data={epsTrendData} width={40} height={14} color="#fbbf24" showDots={false} /> : undefined}
          />
          <StatItem label="負債比" value={debtRatio} />
        </div>

        {/* Quarterly income trend sparklines */}
        {trends?.quarterly_income && trends.quarterly_income.length > 0 && (
          <div className="mt-4 space-y-3">
            <h5 className="text-[11px] font-medium text-[var(--color-text-tertiary)] tracking-wider">季度趨勢</h5>
            <div className="grid grid-cols-2 gap-3">
              {epsTrendData.length > 1 && (
                <TrendSparkLine data={epsTrendData} color="#fbbf24" label="EPS 趨勢" formattedValue={`${data.income.eps} 元`} />
              )}
              {gpTrendData.length > 1 && (
                <TrendSparkLine data={gpTrendData} color="#34d399" label="毛利率趨勢" formattedValue={grossMargin} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Revenue with sparkline */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📅 月營收</h4>

        {/* Revenue trend sparkline */}
        {revenueTrendData.length > 0 && (
          <div className="bg-white/[0.02] rounded-xl p-5 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--color-text-tertiary)]">月營收趨勢</span>
              <span className="text-lg font-bold text-white">{formatMoneyNTD(data.monthly_revenue.revenue)} <span className="text-xs text-[var(--color-text-tertiary)]">千元</span></span>
            </div>
            <SparkLine data={revenueTrendData} width={320} height={48} color="#818cf8" gradientFrom="#818cf8" showDots={revenueTrendData.length <= 12} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <StatItem label="月營收" value={formatMoneyNTD(data.monthly_revenue.revenue)} sub="千元" className="col-span-3" />
          <StatItem
            label="月增率 (MoM)"
            value={formatPercent(data.monthly_revenue.mom)}
            trend={<TrendIndicator value={parseFloat(data.monthly_revenue.mom) || 0} />}
          />
          <StatItem
            label="年增率 (YoY)"
            value={formatPercentAbs(data.monthly_revenue.yoy)}
            trend={<TrendIndicator value={parseFloat(data.monthly_revenue.yoy) || 0} />}
          />
          {(revenueTrendData.length > 1 || momTrendData.length > 1) && (
            <StatItem label="資料期數" value={`${revenueTrendData.length} 期`} sub="月營收趨勢" />
          )}
        </div>
      </div>

      {/* Dividend */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">💰 股利</h4>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="現金股利" value={data.dividend.cashDividendPerShare || "-"} sub="元/股" />
          <StatItem label="股利年度" value={data.dividend.year || "-"} />
        </div>
      </div>

      {/* Data source */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-[var(--color-text-tertiary)]">資料更新：{data.updatedAt} · 來源：TWSE</p>
      </div>
    </div>
  );
}

function CompanyOverviewPanel({ data }: { data: FinancialData }) {
  const trends = data.trends;
  const revenueTrendData: number[] = trends?.monthly_revenue?.map(d => d.yoy) || [];
  const priceAvgData: number[] = trends?.monthly_price?.map(d => d.avg) || [];

  return (
    <div className="space-y-6">
      {/* AI Industry Analysis */}
      <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-600/[0.06] border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <AiIcon />
          </div>
          <h4 className="text-sm font-bold text-white">AI 產業分析</h4>
          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">Beta</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {data.name}（{data.code}）為{data.profile.industry}龍頭企業，本益比 {data.valuation.pe || "—"} 倍，殖利率 {data.valuation.dividendYield ? `${data.valuation.dividendYield}%` : "—"}。
          {parseFloat(data.monthly_revenue.yoy) > 0
            ? ` 月營收年增 ${data.monthly_revenue.yoy}%，成長動能持續。`
            : parseFloat(data.monthly_revenue.yoy) < 0
            ? ` 月營收年減 ${Math.abs(parseFloat(data.monthly_revenue.yoy))}%，需關注營收動能變化。`
            : ""}
          {data.income.eps ? `每股盈餘 ${data.income.eps} 元。` : ""}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-xs text-[var(--color-text-tertiary)] px-3 py-1.5 bg-white/[0.04] rounded-lg">
            📊 分析基於公開財務資料
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">🏢 基本資料</h4>
        <div className="space-y-3">
          {[
            { label: "產業別", value: data.profile.industry || "-", icon: "🏭" },
            { label: "董事長", value: data.profile.chairman || "-", icon: "👔" },
            { label: "成立日期", value: formatDate(data.profile.established) || "-", icon: "📅" },
            { label: "上市日期", value: formatDate(data.profile.listed) || "-", icon: "🏛️" },
            { label: "實收資本額", value: formatCapitalNTD(data.profile.capital) || "-", icon: "💰" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2.5 px-4 bg-white/[0.02] rounded-xl">
              <span className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                <span className="text-xs">{row.icon}</span>{row.label}
              </span>
              <span className="text-sm text-white font-medium">{row.value}</span>
            </div>
          ))}
          {data.profile.website && (
            <div className="flex items-center justify-between py-2.5 px-4 bg-white/[0.02] rounded-xl">
              <span className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                <span className="text-xs">🌐</span>公司網站
              </span>
              <a href={data.profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
                {data.profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ExternalIcon />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Valuation with sparklines */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📈 快速估值</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{data.price.close ? formatPrice(data.price.close) : "-"}</div>
                <div className="text-xs text-[var(--color-text-tertiary)] mt-1">收盤價 (元)</div>
              </div>
              {priceAvgData.length > 0 && (
                <div className="opacity-70">
                  <SparkLine data={priceAvgData} width={60} height={24} color="#818cf8" showDots={false} />
                </div>
              )}
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-400">{data.valuation.pe || "-"}</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">本益比 (倍)</div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-400">{data.income.eps || "-"}</div>
                <div className="text-xs text-[var(--color-text-tertiary)] mt-1">EPS (元)</div>
              </div>
              {revenueTrendData.length > 0 && (
                <div className="opacity-70">
                  <SparkLine data={revenueTrendData} width={60} height={24} color="#fbbf24" showDots={false} />
                </div>
              )}
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-rose-400">{data.valuation.dividendYield ? `${data.valuation.dividendYield}%` : "-"}</div>
            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">殖利率</div>
          </div>
        </div>
      </div>

      {/* Data source */}
      <div className="text-center pt-2">
        <p className="text-[10px] text-[var(--color-text-tertiary)]">資料更新：{data.updatedAt}</p>
      </div>
    </div>
  );
}

function NoFinancialData({ code }: { code: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-white mb-2">財務資料尚未準備</h3>
      <p className="text-sm text-[var(--color-text-tertiary)] mb-6 max-w-sm mx-auto leading-relaxed">
        {code} 的財務資料正在準備中，我們正在逐步擴充公司資料庫。
      </p>
      <div className="flex gap-3 justify-center">
        <a
          href={`https://aistockmap.com/stock/${code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/15 transition-all"
        >
          查看 AI Stock Map <ExternalIcon />
        </a>
        <a
          href={`https://goodinfo.tw/tw/StockDetail.asp?StockID=${code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/[0.05] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)] px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
        >
          GoodInfo <ExternalIcon />
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("topics");
  const [search, setSearch] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"count" | "name">("count");
  const [detailViewMode, setDetailViewMode] = useState<"list" | "structure">("structure");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyDetailTab, setCompanyDetailTab] = useState<CompanyDetailTab>("overview");
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const topics: TopicData[] = industriesData.topics as TopicData[];
  const companies: CompanyData[] = companiesData as CompanyData[];
  const stats = industriesData.stats;

  const categories = useMemo(() => { const cats = new Set<string>(); topics.forEach((t) => cats.add(getCategory(t.name))); return ["全部", ...Array.from(cats)]; }, [topics]);

  const filteredTopics = useMemo(() => {
    let filtered = topics;
    if (selectedCategory !== "全部") filtered = filtered.filter((t) => getCategory(t.name) === selectedCategory);
    if (search) { const q = search.toLowerCase(); filtered = filtered.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.groups.some((g) => g.companies.some((c) => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.role?.toLowerCase().includes(q)))); }
    return sortBy === "count" ? [...filtered].sort((a, b) => b.total - a.total) : [...filtered].sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));
  }, [topics, selectedCategory, search, sortBy]);

  const selectedTopicData = useMemo(() => (selectedTopicSlug ? topics.find((t) => t.slug === selectedTopicSlug) || null : null), [selectedTopicSlug, topics]);

  const suggestions = useMemo(() => {
    if (!search || search.length < 1) return [];
    const q = search.toLowerCase();
    const results: { type: "topic" | "company"; slug: string; name: string; sub: string }[] = [];
    const seen = new Set<string>();
    for (const t of topics) { if (t.name.toLowerCase().includes(q) && !seen.has(t.slug)) { seen.add(t.slug); results.push({ type: "topic", slug: t.slug, name: t.name, sub: `${t.total} 家公司` }); if (results.length >= 6) break; } }
    for (const c of companies) { if ((c.name.toLowerCase().includes(q) || c.code.includes(q)) && !seen.has(c.code)) { seen.add(c.code); results.push({ type: "company", slug: c.code, name: `${c.code} ${c.name}`, sub: `${c.topic_count} 個題材` }); if (results.length >= 8) break; } }
    return results;
  }, [search, topics, companies]);

  const categoryCount = useMemo(() => { const m: Record<string, number> = {}; topics.forEach((t) => { const cat = getCategory(t.name); m[cat] = (m[cat] || 0) + 1; }); m["全部"] = topics.length; return m; }, [topics]);

  const [companySearch, setCompanySearch] = useState("");
  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    const q = companySearch.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.code.includes(q) || c.topics.some((t) => t.toLowerCase().includes(q)));
  }, [companies, companySearch]);

  const selectedCompanyData = useMemo(() => {
    if (!selectedCompanyCode) return null;
    const comp = companies.find((c) => c.code === selectedCompanyCode);
    if (!comp) return null;
    const relatedTopics = topics.filter((t) => comp.topics.includes(t.slug));
    const roles: { topic: string; topicName: string; topicDescription: string; group: string; role: string; relevance: string; analysis?: string }[] = [];
    for (const t of relatedTopics) {
      for (const g of t.groups) {
        for (const c of g.companies) {
          if (c.code === comp.code) { roles.push({ topic: t.slug, topicName: t.name, topicDescription: t.description || "", group: g.name, role: c.role, relevance: c.relevance, analysis: (c as any).analysis }); }
        }
      }
    }
    return { ...comp, relatedTopics, roles };
  }, [selectedCompanyCode, companies, topics]);

  // Fetch financial data when a company is selected
  useEffect(() => {
    if (!selectedCompanyCode) {
      setFinancialData(null);
      setFinancialError(false);
      return;
    }
    setFinancialLoading(true);
    setFinancialError(false);
    fetch(`/industry-map-site/data/financials/${selectedCompanyCode}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: FinancialData) => {
        setFinancialData(data);
        setFinancialLoading(false);
      })
      .catch(() => {
        setFinancialData(null);
        setFinancialError(true);
        setFinancialLoading(false);
      });
  }, [selectedCompanyCode]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowAutocomplete(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToTopic = (slug: string) => { setSelectedTopicSlug(slug); setActiveTab("map"); setDetailViewMode("structure"); };
  const goToCompany = (code: string) => {
    setSelectedCompanyCode(code);
    if (activeTab === "companies") { /* stay, detail panel will show */ }
    else { setShowCompanyModal(true); }
  };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen text-[var(--color-text-primary)] flex flex-col" style={{ background: "var(--color-bg)" }}>
      {/* ─── Background gradient decoration ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.04] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-600/[0.04] blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-600/[0.02] blur-3xl" />
      </div>

      {/* ─── Top Nav ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-[var(--color-border)]" style={{ background: "var(--color-bg)cc" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            <div className="flex items-center gap-3.5 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/15">🏭</div>
              <div className="leading-tight">
                <h1 className="text-[15px] font-bold text-white tracking-tight">台股產業鏈知識圖譜</h1>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{stats.total_topics} 題材 · {stats.unique_companies} 公司</p>
              </div>
            </div>
            <div ref={searchRef} className="relative flex-1 max-w-xl mx-auto">
              <div className={cn("flex items-center rounded-2xl transition-all duration-200", searchFocused ? "bg-[var(--color-surface-hover)] ring-2 ring-[var(--color-primary)]/30" : "bg-[var(--color-surface)]")}>
                <Input
                  type="text"
                  placeholder="搜尋題材、公司名稱或代碼..."
                  className="w-full bg-transparent border-0 shadow-none px-6 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowAutocomplete(true); }}
                  onFocus={() => { setShowAutocomplete(true); setSearchFocused(true); }}
                  onBlur={() => setSearchFocused(false)}
                />
                <div className="pr-5 text-[var(--color-text-tertiary)]"><SearchIcon /></div>
              </div>
              {showAutocomplete && suggestions.length > 0 && (
                <div className="autocomplete-dropdown rounded-2xl mt-1.5">
                  {suggestions.map((s, i) => (
                    <button key={`${s.type}-${s.slug}-${i}`} className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors text-left" onClick={() => { if (s.type === "topic") goToTopic(s.slug); else { goToCompany(s.slug); } setSearch(""); setShowAutocomplete(false); }}>
                      <span className="text-[var(--color-text-primary)] text-sm">{s.name}</span>
                      <span className="text-xs text-[var(--color-text-tertiary)] ml-4 shrink-0">{s.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 -mb-px overflow-x-auto pb-0.5">
            {([
              { id: "focus" as TabId, label: "每日焦點", icon: "🔥" },
              { id: "topics" as TabId, label: "題材總覽", icon: "📋" },
              { id: "map" as TabId, label: "產業地圖", icon: "🗺️" },
              { id: "companies" as TabId, label: "公司資料庫", icon: "🏢" },
            ] as const).map((tab) => (
              <button key={tab.id} className={cn("nav-tab px-6 py-3.5 text-sm font-medium whitespace-nowrap transition-all", activeTab === tab.id ? "active text-indigo-400" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]")} onClick={() => setActiveTab(tab.id)}>
                <span className="mr-1.5">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Stats Bar ─── */}
      <div className="relative bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { emoji: "📋", number: stats.total_topics, label: "題材數", color: "text-indigo-400" },
              { emoji: "🏢", number: stats.unique_companies, label: "不重複公司", color: "text-emerald-400" },
              { emoji: "📊", number: stats.total_companies, label: "公司條目", color: "text-amber-400" },
              { emoji: "🏷️", number: categories.length - 1, label: "產業類別", color: "text-rose-400" },
            ].map((stat, i) => (
              <Card key={i} className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all hover:-translate-y-0.5">
                <CardContent className="p-0 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-xl shrink-0">{stat.emoji}</div>
                  <div>
                    <div className={cn("text-2xl font-bold leading-none", stat.color)}>{stat.number}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1.5">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <main className="flex-1 relative max-w-7xl mx-auto w-full px-6 lg:px-8 py-8">

        {/* ─── Focus Tab ─── */}
        {activeTab === "focus" && (
          <div className="fade-in">
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-3xl max-w-2xl mx-auto mt-8 p-8">
              <CardContent className="p-0 text-center">
                <div className="text-6xl mb-6">🔥</div>
                <h2 className="text-2xl font-bold text-white mb-3">每日焦點</h2>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-md mx-auto">每日精選台股產業題材焦點，追蹤市場動態與產業趨勢變化。敬請期待更多功能上線。</p>
                <div className="mt-10 flex justify-center gap-4">
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 h-11 rounded-2xl shadow-lg shadow-indigo-500/15" onClick={() => setActiveTab("topics")}>瀏覽全部題材</Button>
                  <Button variant="outline" className="border-[var(--color-border-hover)] bg-white/[0.05] hover:bg-white/[0.08] text-white h-11 px-8 rounded-2xl" onClick={() => setActiveTab("map")}>產業地圖</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Topics Tab ─── */}
        {activeTab === "topics" && (
          <div className="flex gap-8 fade-in">
            <aside className="hidden lg:block w-56 shrink-0">
              <div className="sticky top-[140px] space-y-2">
                <h3 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-5 px-4">產業類別</h3>
                {categories.map((cat) => {
                  const color = cat === "全部" ? DEFAULT_COLOR : CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                  const count = categoryCount[cat] || 0;
                  const isActive = selectedCategory === cat;
                  return (
                    <button key={cat} className={cn("w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all", isActive ? "bg-[var(--color-primary)]/10 text-white border-l-[3px] border-indigo-500" : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.03]")} onClick={() => setSelectedCategory(cat)}>
                      <div className="flex items-center gap-2.5">
                        {cat !== "全部" && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color.solid }} />}
                        <span className="truncate">{cat}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-xs border-0", isActive ? "bg-[var(--color-primary)]/20 text-[var(--color-primary-hover)]" : "bg-white/[0.04] text-[var(--color-text-tertiary)]")}>{count}</Badge>
                    </button>
                  );
                })}
              </div>
            </aside>
            <div className="flex-1 min-w-0">
              <div className="lg:hidden flex flex-wrap gap-2.5 mb-6 overflow-x-auto pb-2">
                {categories.map((cat) => {
                  const color = cat === "全部" ? DEFAULT_COLOR : CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                  return (
                    <button key={cat} className={cn("category-pill px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all", selectedCategory === cat ? "bg-[var(--color-primary)]/15 border-indigo-500/40 text-[var(--color-primary-hover)]" : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]")} onClick={() => setSelectedCategory(cat)}>
                      {cat !== "全部" && <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color.solid }} />}{cat}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-[var(--color-text-tertiary)]">共 <span className="text-white font-semibold">{filteredTopics.length}</span> 個題材</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant={sortBy === "count" ? "default" : "outline"}
                    size="sm"
                    className={cn("rounded-xl", sortBy === "count" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/30 hover:bg-[var(--color-primary)]/20" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]")}
                    onClick={() => setSortBy("count")}
                  >按公司數</Button>
                  <Button
                    variant={sortBy === "name" ? "default" : "outline"}
                    size="sm"
                    className={cn("rounded-xl", sortBy === "name" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/30 hover:bg-[var(--color-primary)]/20" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]")}
                    onClick={() => setSortBy("name")}
                  >按名稱</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTopics.map((topic) => {
                  const cat = getCategory(topic.name);
                  const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                  return (
                    <Card
                      key={topic.slug}
                      className={cn("bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-[var(--color-border-hover)] hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1")}
                      onClick={() => goToTopic(topic.slug)}
                    >
                      <div className={cn("h-1.5 bg-gradient-to-r", color.gradient)} />
                      <CardHeader className="px-6 pb-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color.solid }} />
                            <span className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider truncate">{cat}</span>
                          </div>
                          <Badge className={cn("bg-gradient-to-r text-white border-0 text-[11px] font-bold shrink-0", color.gradient)}>
                            {topic.total} 家
                          </Badge>
                        </div>
                        <CardTitle className="text-[15px] text-white leading-relaxed">{topic.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pt-2 pb-4">
                        {topic.description && (
                          <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-2 leading-relaxed">{topic.description.substring(0, 120)}{topic.description.length > 120 ? "..." : ""}</p>
                        )}
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2">
                          <span className="text-xs text-indigo-400 font-medium">探索產業地圖</span>
                          <span className="text-indigo-400/60"><ExternalIcon /></span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {filteredTopics.length === 0 && (
                <div className="text-center py-24">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-[var(--color-text-tertiary)] text-lg">找不到符合條件的題材</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Map Tab ─── */}
        {activeTab === "map" && (
          <div className="fade-in">
            {!selectedTopicData ? (
              <div className="text-center py-24">
                <div className="text-6xl mb-5">🗺️</div>
                <h2 className="text-2xl font-bold text-white mb-3">產業地圖</h2>
                <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto mb-8 leading-relaxed">請先從「題材總覽」選擇一個題材，或從下方挑選，即可查看產業地圖與供應鏈結構。</p>
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 h-11 rounded-2xl shadow-lg shadow-indigo-500/15" onClick={() => setActiveTab("topics")}>📋 瀏覽題材總覽</Button>
                <div className="mt-12 max-w-3xl mx-auto">
                  <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] mb-5">熱門題材</h3>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {topics.slice(0, 12).map((t) => {
                      const cat = getCategory(t.name);
                      const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                      return (
                        <Button key={t.slug} variant="outline" className="px-5 py-2.5 rounded-xl bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white hover:border-indigo-500/40" onClick={() => goToTopic(t.slug)}>
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: color.solid }} />{t.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-8">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-border-hover)]" onClick={() => setSelectedTopicSlug(null)}>
                      <ArrowIcon />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        {(() => { const cat = getCategory(selectedTopicData.name); const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR; return <><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color.solid }} /><span className="text-xs font-medium text-[var(--color-text-tertiary)]">{cat}</span></>; })()}
                      </div>
                      <h2 className="text-xl font-bold text-white">{selectedTopicData.name}</h2>
                    </div>
                    <Badge className="bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border border-indigo-500/20 text-xs font-medium shrink-0">
                      {selectedTopicData.total} 家公司
                    </Badge>
                  </div>

                  {selectedTopicData.description && (
                    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl mb-7">
                      <CardContent className="p-6">
                        <p className="text-sm text-[var(--color-text-secondary)] leading-[1.8]">{selectedTopicData.description}</p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center gap-3 mb-7">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("rounded-xl", detailViewMode === "list" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/30" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]")}
                      onClick={() => setDetailViewMode("list")}
                    >📋 公司列表</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("rounded-xl", detailViewMode === "structure" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/30" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]")}
                      onClick={() => setDetailViewMode("structure")}
                    >🔗 供應鏈結構</Button>
                  </div>

                  {/* List View */}
                  {detailViewMode === "list" && (
                    <div className="space-y-5">
                      {mapGroupNames(selectedTopicData.groups).map((group, gi) => (
                        <Card key={gi} className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl overflow-hidden">
                          <CardHeader className="px-7 py-5 border-b border-[var(--color-border)] flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-semibold text-white">{group.name}</CardTitle>
                            <Badge variant="outline" className="border-0 bg-white/[0.04] text-[var(--color-text-tertiary)] text-xs">{group.companies.length} 家公司</Badge>
                          </CardHeader>
                          <CardContent className="p-0 divide-y divide-white/[0.04]">
                            {group.companies.map((company) => {
                              const relInfo = getRelevanceInfo(company.relevance);
                              return (
                                <button key={company.code} className="company-card w-full flex items-center justify-between px-7 py-5 gap-4 text-left" onClick={() => goToCompany(company.code)}>
                                  <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-11 h-11 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                                      <span className="text-xs font-mono font-bold text-[var(--color-text-secondary)]">{company.code.slice(0, 4)}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white">{company.name}</span>
                                        <span className="text-xs text-[var(--color-text-tertiary)]">{company.code}</span>
                                      </div>
                                      {company.role && <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">{company.role}</p>}
                                    </div>
                                  </div>
                                  <span className={cn(relInfo.className, "text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap shrink-0")}>{relInfo.emoji} {relInfo.label}</span>
                                </button>
                              );
                            })}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Structure View */}
                  {detailViewMode === "structure" && (
                    <div className="space-y-12">
                      {(() => {
                        const namedGroups = mapGroupNames(selectedTopicData.groups);
                        const levelColors = [
                          { bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/20", text: "text-emerald-400", label: "上游", icon: "⬆️" },
                          { bg: "bg-amber-500/[0.06]", border: "border-amber-500/20", text: "text-amber-400", label: "中游", icon: "⏺️" },
                          { bg: "bg-blue-500/[0.06]", border: "border-blue-500/20", text: "text-blue-400", label: "下游", icon: "⬇️" },
                          { bg: "bg-purple-500/[0.06]", border: "border-purple-500/20", text: "text-purple-400", label: "周邊", icon: "🔄" },
                          { bg: "bg-slate-500/[0.06]", border: "border-slate-500/20", text: "text-slate-400", label: "其他", icon: "📦" },
                        ];
                        return namedGroups.map((group, gi) => {
                          const level = levelColors[Math.min(gi, levelColors.length - 1)];
                          return (
                            <div key={gi} className="slide-up" style={{ animationDelay: `${gi * 80}ms` }}>
                              <div className="flex items-center gap-2.5 mb-5">
                                <span className="text-lg">{level.icon}</span>
                                <h3 className={cn("font-bold text-sm", level.text)}>{level.label}：{group.name}</h3>
                                <Badge variant="outline" className="ml-auto border-0 bg-white/[0.04] text-[var(--color-text-tertiary)] text-xs">{group.companies.length} 家</Badge>
                              </div>
                              {gi > 0 && (
                                <div className="flex justify-center my-5">
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-8 bg-gradient-to-b from-white/[0.04] to-white/[0.12]" />
                                    <svg className="w-4 h-4 text-[var(--color-text-tertiary)] -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                  </div>
                                </div>
                              )}
                              <div className={cn(level.bg, level.border, "border rounded-2xl p-6")}>
                                <div className="flex flex-wrap gap-3">
                                  {group.companies.map((company) => {
                                    const relInfo = getRelevanceInfo(company.relevance);
                                    return (
                                      <Button key={company.code} variant="outline" className="bg-[var(--color-surface)]/80 border-[var(--color-border)] rounded-xl px-5 h-auto py-3 hover:border-indigo-500/30 hover:bg-[var(--color-surface)] text-white" onClick={() => goToCompany(company.code)}>
                                        <div className="text-center">
                                          <div className="text-xs font-bold text-white">{company.code}</div>
                                          <div className="text-[11px] text-[var(--color-text-secondary)]">{company.name}</div>
                                        </div>
                                        <span className={cn(relInfo.className, "text-[11px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap ml-2")}>{relInfo.label}</span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Right panel */}
                <div className="hidden xl:block w-72 shrink-0">
                  <div className="sticky top-[140px] space-y-6">
                    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl">
                      <CardContent className="p-6">
                        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-5">題材概要</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">公司總數</span><span className="text-white font-medium">{selectedTopicData.total}</span></div>
                          <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">供應鏈層級</span><span className="text-white font-medium">{selectedTopicData.groups.length}</span></div>
                          {(() => {
                            const highRel = selectedTopicData.groups.reduce((acc, g) => acc + g.companies.filter((c) => String(c.relevance) === "高" || ["80","85","90","95"].includes(String(c.relevance))).length, 0);
                            return <div className="flex justify-between text-sm"><span className="text-[var(--color-text-secondary)]">核心公司</span><span className="text-emerald-400 font-medium">{highRel}</span></div>;
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl">
                      <CardContent className="p-6">
                        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-5">同類題材</h4>
                        <div className="space-y-2">
                          {topics.filter((t) => getCategory(t.name) === getCategory(selectedTopicData.name) && t.slug !== selectedTopicData.slug).slice(0, 5).map((t) => (
                            <Button key={t.slug} variant="ghost" className="w-full justify-start px-4 py-2.5 rounded-xl text-sm text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.04] h-auto truncate" onClick={() => goToTopic(t.slug)}>{t.name}</Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Companies Tab ─── */}
        {activeTab === "companies" && (
          <div className="fade-in">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative flex-1 max-w-xl">
                <div className="flex items-center rounded-2xl bg-[var(--color-surface)]">
                  <Input
                    type="text"
                    placeholder="搜尋公司名稱或代碼..."
                    className="w-full bg-transparent border-0 shadow-none px-6 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                  />
                  <div className="pr-5 text-[var(--color-text-tertiary)]"><SearchIcon /></div>
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)]">共 <span className="text-white font-semibold">{filteredCompanies.length}</span> 家公司</p>
            </div>
            <div className="flex gap-8">
              <div className={cn("transition-all duration-300", selectedCompanyData ? "w-[45%]" : "w-full")}>
                <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-[100px_1fr_100px] px-7 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60">
                    <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">代碼</span>
                    <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">名稱</span>
                    <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider text-right">題材數</span>
                  </div>
                  <ScrollArea className="max-h-[calc(100vh-280px)]">
                    {filteredCompanies.slice(0, 150).map((company) => (
                      <button key={company.code} className={cn("company-row w-full grid grid-cols-[100px_1fr_100px] px-7 py-4 items-center gap-4 text-left transition-colors", selectedCompanyCode === company.code ? "bg-[var(--color-primary)]/10" : "hover:bg-white/[0.03]")} onClick={() => { setSelectedCompanyCode(company.code); setCompanyDetailTab("overview"); }}>
                        <span className="text-sm font-mono font-bold text-indigo-400">{company.code}</span>
                        <span className="text-sm text-white font-medium">{company.name}</span>
                        <span className="text-sm text-right">
                          <Badge className="bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-0 text-xs">{company.topic_count}</Badge>
                        </span>
                      </button>
                    ))}
                  </ScrollArea>
                  {filteredCompanies.length > 150 && (
                    <div className="px-7 py-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-tertiary)]">
                      顯示前 150 筆，共 {filteredCompanies.length} 家公司
                    </div>
                  )}
                </Card>
              </div>
              {selectedCompanyData && (
                <div className="flex-1 min-w-0 fade-in">
                  <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl sticky top-[140px]">
                    <CardContent className="p-0">
                      {/* Company Header */}
                      <div className="px-8 pt-8 pb-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/15">{selectedCompanyData.code.slice(0, 4)}</div>
                            <div>
                              <h2 className="text-xl font-bold text-white">{selectedCompanyData.name}</h2>
                              <span className="text-sm text-[var(--color-text-tertiary)]">{selectedCompanyData.code}</span>
                            </div>
                          </div>
                          <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl bg-white/[0.04] border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-white" onClick={() => setSelectedCompanyCode(null)}>
                            <CloseIcon />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-indigo-400">{selectedCompanyData.topic_count}</div>
                            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">相關題材</div>
                          </div>
                          <div className="bg-white/[0.02] rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{selectedCompanyData.roles.length}</div>
                            <div className="text-xs text-[var(--color-text-tertiary)] mt-1">供應鏈角色</div>
                          </div>
                        </div>
                      </div>

                      {/* Detail Tabs */}
                      <div className="px-8 flex gap-1 border-b border-[var(--color-border)]">
                        {([
                          { id: "overview" as CompanyDetailTab, label: "概覽", icon: "📊" },
                          { id: "financials" as CompanyDetailTab, label: "財務", icon: "💹" },
                          { id: "supply_chain" as CompanyDetailTab, label: "供應鏈", icon: "🔗" },
                        ]).map((tab) => (
                          <button
                            key={tab.id}
                            className={cn(
                              "px-5 py-3 text-sm font-medium transition-all border-b-2",
                              companyDetailTab === tab.id
                                ? "text-indigo-400 border-indigo-400"
                                : "text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]"
                            )}
                            onClick={() => setCompanyDetailTab(tab.id)}
                          >
                            <span className="mr-1.5">{tab.icon}</span>{tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="px-8 py-6 max-h-[calc(100vh-420px)] overflow-y-auto">
                        {companyDetailTab === "overview" && (
                          financialLoading ? (
                            <div className="text-center py-12">
                              <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm text-[var(--color-text-tertiary)] mt-3">載入財務資料...</p>
                            </div>
                          ) : financialData ? (
                            <CompanyOverviewPanel data={financialData} />
                          ) : financialError ? (
                            <NoFinancialData code={selectedCompanyData.code} />
                          ) : null
                        )}
                        {companyDetailTab === "financials" && (
                          financialLoading ? (
                            <div className="text-center py-12">
                              <div className="inline-block w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm text-[var(--color-text-tertiary)] mt-3">載入財務資料...</p>
                            </div>
                          ) : financialData ? (
                            <CompanyFinancialPanel data={financialData} />
                          ) : financialError ? (
                            <NoFinancialData code={selectedCompanyData.code} />
                          ) : null
                        )}
                        {companyDetailTab === "supply_chain" && (
                          <div className="space-y-6">
                            {/* AI Analysis for supply chain */}
                            <div className="bg-gradient-to-br from-indigo-500/[0.06] to-violet-600/[0.04] border border-indigo-500/15 rounded-2xl p-6">
                              <div className="flex items-center gap-2.5 mb-3">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/15">
                                  <AiIcon />
                                </div>
                                <h4 className="text-sm font-bold text-white">供應鏈分析</h4>
                              </div>
                              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                {selectedCompanyData.name} 在 {selectedCompanyData.roles.length} 個產業題材中扮演重要角色，
                                涵蓋 {Array.from(new Set(selectedCompanyData.roles.map(r => {
                                  const cat = getCategory(r.topicName);
                                  return cat;
                                }))).join("、")} 等領域。
                              </p>
                            </div>

                            <div>
                              <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4">供應鏈角色</h4>
                              <div className="space-y-4">
                                {selectedCompanyData.roles.map((role, i) => {
                                  const relInfo = getRelevanceInfo(role.relevance);
                                  const roleBadge = getRoleBadge(role.relevance);
                                  return (
                                    <div key={i} className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <span
                                            className="text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap"
                                            style={{ color: roleBadge.color, backgroundColor: roleBadge.bg }}
                                          >
                                            {relInfo.emoji} {relInfo.label}
                                          </span>
                                          <Button variant="ghost" className="text-sm text-indigo-400 hover:text-[var(--color-primary-hover)] font-medium h-auto p-0 truncate" onClick={() => goToTopic(role.topic)}>{role.topicName}</Button>
                                        </div>
                                      </div>
                                      {/* Relevance tagline / role description */}
                                      {role.role && (
                                        <p className="text-sm text-[var(--color-text-secondary)] mb-2 leading-relaxed">{role.role}</p>
                                      )}
                                      {/* AI analysis placeholder */}
                                      <div className="mt-2 pt-2 border-t border-white/[0.04]">
                                        {role.analysis ? (
                                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{role.analysis}</p>
                                        ) : (
                                          <p className="text-xs text-[var(--color-text-tertiary)] italic">🤖 分析準備中...</p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <Separator className="bg-white/[0.06]" />
                            <div>
                              <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4">相關題材</h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedCompanyData.relatedTopics.map((t) => {
                                  const cat = getCategory(t.name);
                                  const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                                  return (
                                    <Button key={t.slug} variant="outline" size="sm" className="rounded-lg text-xs font-medium h-auto py-1.5 hover:border-indigo-500/40 transition-colors" style={{ backgroundColor: `${color.solid}12`, borderColor: `${color.solid}30`, color: color.solid }} onClick={() => goToTopic(t.slug)}>{t.name}</Button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Company Modal (for map/topics tab clicks) ─── */}
      {showCompanyModal && selectedCompanyData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setShowCompanyModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <Card className="relative bg-[var(--color-surface)] border-white/[0.1] rounded-2xl max-w-lg w-full mx-4 shadow-2xl modal-in" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/15">{selectedCompanyData.code.slice(0, 4)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedCompanyData.name}</h2>
                    <span className="text-sm text-[var(--color-text-tertiary)]">{selectedCompanyData.code}</span>
                  </div>
                </div>
                <Button variant="outline" size="icon" className="w-9 h-9 rounded-xl bg-white/[0.04] border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-white" onClick={() => setShowCompanyModal(false)}>
                  <CloseIcon />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[var(--color-surface)] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-400">{selectedCompanyData.topic_count}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1">相關題材</div>
                </div>
                <div className="bg-[var(--color-surface)] rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{selectedCompanyData.roles.length}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-1">供應鏈角色</div>
                </div>
              </div>
              <h3 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">供應鏈角色</h3>
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                {selectedCompanyData.roles.slice(0, 10).map((role, i) => {
                  const relInfo = getRelevanceInfo(role.relevance);
                  const roleBadge = getRoleBadge(role.relevance);
                  return (
                    <div key={i} className="bg-[var(--color-surface)] rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <Button variant="ghost" className="text-sm text-indigo-400 hover:text-[var(--color-primary-hover)] font-medium h-auto p-0 truncate" onClick={() => { setShowCompanyModal(false); goToTopic(role.topic); }}>{role.topicName}</Button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[var(--color-text-secondary)]">{role.group}</span>
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                            style={{ color: roleBadge.color, backgroundColor: roleBadge.bg }}
                          >
                            {relInfo.label}
                          </span>
                        </div>
                      </div>
                      {role.role && (
                        <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">{role.role}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-11 rounded-xl" onClick={() => { setShowCompanyModal(false); setSelectedCompanyCode(selectedCompanyData.code); setActiveTab("companies"); setCompanyDetailTab("overview"); }}>查看完整資料</Button>
                <Button variant="outline" className="bg-white/[0.05] border-[var(--color-border-hover)] text-[var(--color-text-secondary)] hover:text-white h-11 rounded-xl px-6" onClick={() => setShowCompanyModal(false)}>關閉</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-[var(--color-border)] mt-12 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-xs text-[var(--color-text-tertiary)]">
          台股產業鏈知識圖譜 · 資料來源：aistockmap.com + CasualMarket + 多源驗證 · 最後更新：2026-05-19
        </div>
      </footer>
    </div>
  );
}