"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
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
interface FinancialSWOT { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; }

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
  focus?: string;
  products?: string[];
  customers?: string[];
  swot?: FinancialSWOT;
  market_position?: string;
  trends?: FinancialTrends;
  industry_analysis?: Record<string, {
    ai_summary?: string;
    market_position?: string;
    market_position_detail?: string;
    focus?: string;
    products?: string[];
    customers?: string[];
    swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
  }>;
  updatedAt: string;
}

const CATEGORY_COLORS: Record<string, { gradient: string; solid: string; light: string; bg: string }> = {
  "半導體製造": { gradient: "from-blue-500 to-blue-700", solid: "#3b82f6", light: "#93c5fd", bg: "bg-blue-500/10" },
  "IC設計":     { gradient: "from-purple-500 to-purple-700", solid: "#8b5cf6", light: "#c4b5fd", bg: "bg-purple-500/10" },
  "IC 設計":    { gradient: "from-purple-500 to-purple-700", solid: "#8b5cf6", light: "#c4b5fd", bg: "bg-purple-500/10" },
  "先進封測":   { gradient: "from-cyan-500 to-cyan-700", solid: "#06b6d4", light: "#67e8f9", bg: "bg-cyan-500/10" },
  "基板材料":   { gradient: "from-amber-500 to-amber-700", solid: "#f59e0b", light: "#fcd34d", bg: "bg-amber-500/10" },
  "記憶體":     { gradient: "from-green-500 to-green-700", solid: "#22c55e", light: "#86efac", bg: "bg-green-500/10" },
  "AI 伺服器":  { gradient: "from-rose-500 to-rose-700", solid: "#f43f5e", light: "#fda4af", bg: "bg-rose-500/10" },
  "散熱冷卻":   { gradient: "from-orange-500 to-orange-700", solid: "#f97316", light: "#fdba74", bg: "bg-orange-500/10" },
  "散熱":       { gradient: "from-orange-500 to-orange-700", solid: "#f97316", light: "#fdba74", bg: "bg-orange-500/10" },
  "電子零組件": { gradient: "from-indigo-500 to-indigo-700", solid: "#6366f1", light: "#a5b4fc", bg: "bg-[var(--color-primary)]/10" },
  "被動元件":   { gradient: "from-teal-500 to-teal-700", solid: "#14b8a6", light: "#5eead4", bg: "bg-teal-500/10" },
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
  // Input is in 千元 (thousands of NTD)
  // 1 億 = 100,000 千元, 1 兆 = 1,000,000,000 千元 (10^9)
  const num = parseFloat(thousands);
  if (isNaN(num) || num === 0) return "-";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2).replace(/\.?0+$/, "")}兆`;
  if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}億`;
  return `${num.toFixed(0)}萬`;
}

function formatMoneyNTDNum(num: number): string {
  // Input raw number in 千元
  if (num === 0) return "-";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2).replace(/\.?0+$/, "")}兆`;
  if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}億`;
  return `${num.toFixed(0)}萬`;
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

function formatTrendMonth(month: string): string {
  if (!month) return "-";
  if (month.length === 5) {
    const y = parseInt(month.slice(0, 3));
    const m = month.slice(3);
    return `${y + 1911}/${m}`;
  }
  return month;
}

type TabId = "focus" | "topics" | "map" | "companies";
type CompanyViewMode = "list" | "detail";
type CompanyDetailTab = "overview" | "industry" | "chips" | "tech" | "news" | "charts";

/* ─── Recharts Helpers ─── */
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

function formatRev(num: number): string {
  if (num >= 100000000) return `${(num / 100000000).toFixed(0)}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(0)}萬`;
  return num.toLocaleString();
}
function formatRevShort(num: number): string {
  // Input is in 千元 (thousands of NTD)
  // 1 億 = 100,000 千元, 1 兆 = 1,000,000,000 千元 (10^9)
  if (num >= 1e9) return `${(num / 1e9).toFixed(2).replace(/\.?0+$/, "")}兆`;
  if (num >= 100000) return `${(num / 100000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}億`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}億`;
  return `${num.toFixed(0)}萬`;
}

/* ─── Monthly Price Chart ─── */
function PriceAreaChart({ data }: { data: TrendMonthlyPrice[] }) {
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

function RevenueAreaChart({ data }: { data: TrendMonthlyRevenue[] }) {
  if (!data || data.length === 0) return null;
  if (data.length === 1) {
    return (
      <div className="bg-white/[0.02] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">月營收趨勢</span>
          <span className="text-lg font-bold text-white">{formatRevShort(data[0].revenue)}</span>
        </div>
        <div className="text-xs text-[var(--color-text-tertiary)] text-center py-4">📈 資料累積中，敬請期待完整走勢圖</div>
      </div>
    );
  }
  const chartData = data.map(d => ({
    month: formatTrendMonth(d.month),
    revenue: d.revenue / 100000, // 千元 → 億
    mom: d.mom,
    yoy: d.yoy,
  }));
  return (
    <div className="bg-white/[0.02] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">月營收趨勢</span>
        <span className="text-sm font-bold text-white">{formatRevShort(data[data.length - 1].revenue)}</span>
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

function QuarterlyIncomeChart({ data }: { data: TrendQuarterlyIncome[] }) {
  if (!data || data.length === 0) return null;
  if (data.length === 1) {
    const d = data[0];
    const gm = d.revenue > 0 ? ((d.grossProfit / d.revenue) * 100).toFixed(1) : "-";
    return (
      <div className="bg-white/[0.02] rounded-xl p-4">
        <div className="text-xs text-[var(--color-text-tertiary)] mb-2">季度損益趨勢</div>
        <div className="grid grid-cols-3 gap-3">
          <div><span className="text-xs text-[var(--color-text-tertiary)]">營收</span><div className="text-sm font-bold text-white">{formatRevShort(d.revenue)}</div></div>
          <div><span className="text-xs text-[var(--color-text-tertiary)]">毛利</span><div className="text-sm font-bold text-white">{formatRevShort(d.grossProfit)}</div></div>
          <div><span className="text-xs text-[var(--color-text-tertiary)]">淨利</span><div className="text-sm font-bold text-white">{formatRevShort(d.netIncome)}</div></div>
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

/* ─── Margin Trend Chart ─── */
function MarginTrendChart({ data }: { data: TrendQuarterlyIncome[] }) {
  if (!data || data.length <= 1) return null;
  const chartData = data.map(d => ({
    quarter: d.quarter,
    grossMargin: d.revenue > 0 ? parseFloat(((d.grossProfit / d.revenue) * 100).toFixed(1)) : 0,
    netMargin: d.revenue > 0 ? parseFloat(((d.netIncome / d.revenue) * 100).toFixed(1)) : 0,
  }));
  return (
    <div className="bg-white/[0.02] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">毛利率 / 淨利率趨勢</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="gmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f472b6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f472b6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="nmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="quarter" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: unknown, name: unknown) => {
              const v = Number(value);
              const n = String(name);
              if (n === "grossMargin") return [`${v}%`, "毛利率"];
              return [`${v}%`, "淨利率"];
            }}
          />
          <Area type="monotone" dataKey="grossMargin" stroke="#f472b6" strokeWidth={2} fill="url(#gmGrad)" dot={{ r: 3, fill: "#f472b6", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="grossMargin" />
          <Area type="monotone" dataKey="netMargin" stroke="#fbbf24" strokeWidth={2} fill="url(#nmGrad)" dot={{ r: 3, fill: "#fbbf24", stroke: "#1e1e2e", strokeWidth: 1.5 }} name="netMargin" />
          <Legend formatter={(value: string) => value === "grossMargin" ? "毛利率" : "淨利率"} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Mini Sparkline ─── */
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

/* ─── Trend Indicator ─── */
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
    <div className={cn("bg-white/[0.02] rounded-xl p-4", className)}>
      <div className="text-xs text-[var(--color-text-tertiary)] mb-1.5 flex items-center gap-1.5">{label}{trend}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-[var(--color-text-tertiary)] mt-1">{sub}</div>}
    </div>
  );
}

/* ─── AI Analysis Generator ─── */
function generateIndustryAnalysis(
  roleName: string,
  topicName: string,
  relevance: string,
  role: string,
  finData: FinancialData | null
): string {
  const relInfo = getRelevanceInfo(relevance);
  const cat = getCategory(topicName);
  const topicShort = topicName.includes("｜") ? topicName.split("｜")[1] || topicName : topicName;

  if (finData) {
    const pe = finData.valuation.pe;
    const yoy = finData.monthly_revenue.yoy;
    const yoyNum = parseFloat(yoy) || 0;
    const growthDesc = yoyNum > 10 ? "成長動能持續" : yoyNum > 0 ? "營收穩健成長" : yoyNum > -10 ? "面臨成長壓力" : "營收明顯下滑";
    const name = finData.name;

    if (relInfo.label === "核心") {
      return `作為${topicShort}的${role || "關鍵角色"}，${name}在${cat}領域佔據關鍵地位。本益比 ${pe || "—"} 倍，月營收年增 ${yoy}%，${growthDesc}。憑藉其產業領導地位與技術優勢，持續引領市場發展方向。`;
    } else if (relInfo.label === "成長") {
      return `在${topicShort}領域中，${name}具備顯著成長潛力。本益比 ${pe || "—"} 倍，月營收年增 ${yoy}%，${growthDesc}。隨產業需求擴張，有望進一步提升市佔率。`;
    } else {
      return `${name}在${topicShort}具備利基市場定位，本益比 ${pe || "—"} 倍，月營收年增 ${yoy}%。雖非核心角色，但在特定環節提供不可替代的專業價值。`;
    }
  }
  return `${roleName || "參與者"}在${topicShort}領域扮演${relInfo.label}角色，產業分析準備中，敬請期待。`;
}

function CompanyFinancialPanel({ data, revenueTab, onRevenueTabChange }: { data: FinancialData; revenueTab: "monthly" | "quarterly" | "yearly"; onRevenueTabChange: (tab: "monthly" | "quarterly" | "yearly") => void }) {
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

  const momVal = parseFloat(data.monthly_revenue.mom) || 0;
  const yoyVal = parseFloat(data.monthly_revenue.yoy) || 0;

  const latestGrossMargin = (() => {
    if (trends?.quarterly_income && trends.quarterly_income.length > 0) {
      const latest = trends.quarterly_income[trends.quarterly_income.length - 1];
      if (latest.revenue > 0) return ((latest.grossProfit / latest.revenue) * 100).toFixed(1);
    }
    return "-";
  })();
  const latestNetMargin = (() => {
    if (trends?.quarterly_income && trends.quarterly_income.length > 0) {
      const latest = trends.quarterly_income[trends.quarterly_income.length - 1];
      if (latest.revenue > 0) return ((latest.netIncome / latest.revenue) * 100).toFixed(1);
    }
    return "-";
  })();

  const revenueSubTabs: { id: "monthly" | "quarterly" | "yearly"; label: string }[] = [
    { id: "monthly", label: "月份" },
    { id: "quarterly", label: "季度" },
    { id: "yearly", label: "年度" },
  ];

  return (
    <div className="space-y-6">
      {/* Valuation */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📈 估值指標</h4>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="本益比 (P/E)" value={data.valuation.pe || "-"} sub={data.valuation.pe ? "倍" : undefined} />
          <StatItem label="股價淨值比 (P/B)" value={data.valuation.pb || "-"} sub={data.valuation.pb ? "倍" : undefined} />
          <StatItem label="現金殖利率" value={data.valuation.dividendYield ? `${data.valuation.dividendYield}%` : "-"} />
          <StatItem label="每股淨值" value={data.balance.bookValuePerShare || "-"} sub="元" />
        </div>
      </div>

      {/* Income + Quarterly Chart */}
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📊 財務摘要</h4>
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="營業收入" value={formatMoneyNTD(data.income.revenue)} className="col-span-2" />
          <StatItem label="毛利" value={formatMoneyNTD(data.income.grossProfit)} sub={`毛利率 ${grossMargin}`} />
          <StatItem label="淨利" value={formatMoneyNTD(data.income.netIncome)} sub={`淨利率 ${netMargin}`} />
          <StatItem label="EPS" value={data.income.eps || "-"} sub="元/股" />
          <StatItem label="負債比" value={debtRatio} />
        </div>

        {trends?.quarterly_income && trends.quarterly_income.length > 0 && (
          <div className="mt-4">
            <QuarterlyIncomeChart data={trends.quarterly_income} />
          </div>
        )}
      </div>

      {/* ── 營收分析 ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">📊 營收分析</h4>
          <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
            {revenueSubTabs.map(tab => (
              <button
                key={tab.id}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  revenueTab === tab.id
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                )}
                onClick={() => onRevenueTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Revenue Tab */}
        {revenueTab === "monthly" && (
          <div className="space-y-3">
            {/* MoM/YoY Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.02] rounded-xl p-4">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-1">月增率 (MoM)</div>
                <TrendIndicator value={momVal} size="md" />
              </div>
              <div className="bg-white/[0.02] rounded-xl p-4">
                <div className="text-xs text-[var(--color-text-tertiary)] mb-1">年增率 (YoY)</div>
                <TrendIndicator value={yoyVal} size="md" />
              </div>
            </div>

            {trends?.monthly_revenue && trends.monthly_revenue.length > 0 && (
              <RevenueAreaChart data={trends.monthly_revenue} />
            )}

            {/* Monthly revenue data table */}
            {trends?.monthly_revenue && trends.monthly_revenue.length > 0 && (
              <div className="bg-white/[0.02] rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 gap-0 text-[11px] font-semibold text-[var(--color-text-tertiary)] bg-white/[0.03] px-3 py-2">
                  <span>月份</span>
                  <span className="text-right">營收(億)</span>
                  <span className="text-right">MoM</span>
                  <span className="text-right">YoY</span>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {trends.monthly_revenue.slice().reverse().slice(0, 12).map((row, i) => (
                    <div key={i} className="grid grid-cols-4 gap-0 text-xs px-3 py-1.5 border-t border-white/[0.03] hover:bg-white/[0.02]">
                      <span className="text-[var(--color-text-secondary)]">{formatTrendMonth(row.month)}</span>
                      <span className="text-right text-white font-medium">{formatRevShort(row.revenue)}</span>
                      <span className={cn("text-right", row.mom >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatPercentNum(row.mom)}</span>
                      <span className={cn("text-right", row.yoy >= 0 ? "text-emerald-400" : "text-rose-400")}>{formatPercentNum(row.yoy)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <StatItem label="月營收" value={formatMoneyNTD(data.monthly_revenue.revenue)} className="col-span-3" />
              <StatItem
                label="月增率 (MoM)"
                value={formatPercent(data.monthly_revenue.mom)}
                trend={<TrendIndicator value={momVal} />}
              />
              <StatItem
                label="年增率 (YoY)"
                value={formatPercentAbs(data.monthly_revenue.yoy)}
                trend={<TrendIndicator value={yoyVal} />}
              />
              {trends && trends.monthly_revenue && trends.monthly_revenue.length > 1 && (
                <StatItem label="資料期數" value={`${trends.monthly_revenue.length} 期`} sub="月營收趨勢" />
              )}
            </div>
          </div>
        )}

        {/* Quarterly Revenue Tab */}
        {revenueTab === "quarterly" && (
          <div className="space-y-3">
            {trends?.quarterly_income && trends.quarterly_income.length > 0 ? (
              <QuarterlyIncomeChart data={trends.quarterly_income} />
            ) : (
              <div className="bg-white/[0.02] rounded-xl p-6 text-center">
                <span className="text-[var(--color-text-tertiary)] text-sm">📋 季度資料準備中</span>
              </div>
            )}
          </div>
        )}

        {/* Yearly Revenue Tab */}
        {revenueTab === "yearly" && (
          <div className="space-y-3">
            {trends?.quarterly_income && trends.quarterly_income.length > 0 ? (() => {
              // Aggregate quarterly data into yearly
              const yearlyMap = new Map<number, { revenue: number; grossProfit: number; netIncome: number }>();
              trends.quarterly_income.forEach(q => {
                const yearMatch = q.quarter.match(/(\d{4})/);
                if (yearMatch) {
                  const yr = parseInt(yearMatch[1]);
                  const existing = yearlyMap.get(yr) || { revenue: 0, grossProfit: 0, netIncome: 0 };
                  yearlyMap.set(yr, {
                    revenue: existing.revenue + q.revenue,
                    grossProfit: existing.grossProfit + q.grossProfit,
                    netIncome: existing.netIncome + q.netIncome,
                  });
                }
              });
              const yearlyData = Array.from(yearlyMap.entries())
                .sort(([a], [b]) => a - b)
                .map(([yr, vals]) => ({
                  year: String(yr),
                  revenue: vals.revenue / 100000,
                  grossProfit: vals.grossProfit / 100000,
                  netIncome: vals.netIncome / 100000,
                }));
              return (
                <div className="bg-white/[0.02] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--color-text-tertiary)]">年度營收趨勢</span>
                  </div>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={yearlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="year" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
                      <YAxis tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "#94a3b8" }}
                        formatter={(value: unknown, name: unknown) => {
                          const v = Number(value);
                          const n = String(name);
                          const label = n === "revenue" ? "營收" : n === "grossProfit" ? "毛利" : "淨利";
                          return [`${v.toFixed(1)} 億`, label];
                        }}
                      />
                      <Bar dataKey="revenue" fill={CHART_COLORS.revenue} radius={[2, 2, 0, 0]} name="revenue" />
                      <Bar dataKey="grossProfit" fill={CHART_COLORS.grossProfit} radius={[2, 2, 0, 0]} name="grossProfit" />
                      <Bar dataKey="netIncome" fill={CHART_COLORS.netIncome} radius={[2, 2, 0, 0]} name="netIncome" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })() : (
              <div className="bg-white/[0.02] rounded-xl p-6 text-center">
                <span className="text-[var(--color-text-tertiary)] text-sm">📋 年度資料準備中</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 獲利能力趨勢 ── */}
      {trends?.quarterly_income && trends.quarterly_income.length > 1 && (
        <div>
          <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">📈 獲利能力趨勢</h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/[0.02] rounded-xl p-4">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">毛利率</div>
              <div className="text-lg font-bold" style={{ color: latestGrossMargin !== "-" ? "#f472b6" : "var(--color-text-tertiary)" }}>
                {latestGrossMargin !== "-" ? `${latestGrossMargin}%` : "-"}
              </div>
            </div>
            <div className="bg-white/[0.02] rounded-xl p-4">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">淨利率</div>
              <div className="text-lg font-bold" style={{ color: latestNetMargin !== "-" ? "#fbbf24" : "var(--color-text-tertiary)" }}>
                {latestNetMargin !== "-" ? `${latestNetMargin}%` : "-"}
              </div>
            </div>
          </div>
          <MarginTrendChart data={trends.quarterly_income} />
        </div>
      )}

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

/* ─── Placeholder Section Component (aistockmap paywall-style) ─── */
function PlaceholderSection({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-lg">{icon}</span>
        <h4 className="text-sm font-bold text-white">{title}</h4>
      </div>
      <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
        <span className="text-sm">📋 資料準備中</span>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="text-xs text-[var(--color-text-tertiary)] bg-white/[0.03] px-3 py-1.5 rounded-lg">🔒 升級解鎖</span>
      </div>
    </div>
  );
}

/* ─── Market Position Badge ─── */
function getMarketPosition(position: string | undefined): { emoji: string; label: string; desc: string; color: string } {
  if (!position) return { emoji: "🟢", label: "產業龍頭", desc: "市場領導地位", color: "#34d399" };
  const p = position.toLowerCase();
  if (p.includes("龍頭") || p.includes("leader")) return { emoji: "🟢", label: "產業龍頭", desc: position, color: "#34d399" };
  if (p.includes("成長") || p.includes("growth")) return { emoji: "🟠", label: "成長挑戰", desc: position, color: "#fbbf24" };
  if (p.includes("利基") || p.includes("niche")) return { emoji: "🔵", label: "利基專精", desc: position, color: "#60a5fa" };
  return { emoji: "🟢", label: "產業龍頭", desc: position || "市場領導地位", color: "#34d399" };
}

/* ─── Company Full Page Detail View ─── */
function CompanyFullPageDetail({
  data,
  roles,
  onBack,
}: {
  data: FinancialData;
  roles: { topic: string; topicName: string; topicDescription: string; group: string; role: string; relevance: string; analysis?: string }[] | null;
  onBack: () => void;
}) {
  const [detailTab, setDetailTab] = useState<CompanyDetailTab>("overview");
  const [industrySubTab, setIndustrySubTab] = useState(0);
  const [revenueTab, setRevenueTab] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  const yoyNum = parseFloat(data.monthly_revenue.yoy) || 0;
  const marketPos = getMarketPosition(data.market_position);
  const trends = data.trends;

  /* ─── TradingView Widget Loader ─── */
  const techTabRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (detailTab !== "tech") return;
    // Clean up any existing widget containers to allow fresh load
    const timer = setTimeout(() => {
      const container = techTabRef.current?.querySelector(".tradingview-widget-container__widget");
      if (!container) return;
      // Remove stale scripts
      document.querySelectorAll('script[src*="embed-widget-symbol-overview"]').forEach(s => s.remove());
      // Clear container for fresh injection
      container.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbols: [[`TWSE:${data.code}`]],
        chartOnly: false,
        width: "100%",
        height: "100%",
        colorTheme: "dark",
        locale: "zh_TW",
        isTransparent: true,
        autosize: true,
        showVolume: true,
        showMA: true,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        backgroundColor: "rgba(13, 19, 32, 1)",
        gridLineColor: "rgba(242, 242, 242, 0.06)",
      });
      container.appendChild(script);
    }, 500);
    return () => clearTimeout(timer);
  }, [detailTab, data.code]);

  const aiSummary = (() => {
    const name = data.name;
    const ind = data.profile.industry;
    const pe = data.valuation.pe || "—";
    const yoy = data.monthly_revenue.yoy;
    const eps = data.income.eps;
    const yield_ = data.valuation.dividendYield;
    let summary = `${name}（${data.code}）為${ind}${marketPos.label}企業，`;
    if (yoyNum > 0) summary += `月營收年增 ${yoy}%，成長動能持續。`;
    else if (yoyNum < 0) summary += `月營收年減 ${Math.abs(yoyNum).toFixed(2)}%，需關注營收動能變化。`;
    else summary += "營收持平。";
    if (pe !== "—") summary += ` 本益比 ${pe} 倍，`;
    if (yield_) summary += `殖利率 ${yield_}%。`;
    if (eps) summary += `每股盈餘 ${eps} 元。`;
    return summary;
  })();

  /* Badges */
  const badges: { label: string; color: string; show: boolean }[] = [
    { label: `營收年增 ▲${yoyNum.toFixed(1)}%`, color: "#34d399", show: yoyNum > 0 },
    { label: "連三月年增", color: "#818cf8", show: true },
    { label: "投信買超", color: "#fbbf24", show: false },
    { label: "有股票期貨", color: "#f97316", show: false },
  ];

  /* Industry sub-tabs */
  const industryRoles = roles || [];

  const DETAIL_TABS: { id: CompanyDetailTab; label: string; icon: string }[] = [
    { id: "overview", label: "基本資料", icon: "📋" },
    { id: "industry", label: "產業分析", icon: "🏭" },
    { id: "chips", label: "籌碼分析", icon: "🎰" },
    { id: "tech", label: "技術分析", icon: "📊" },
    { id: "news", label: "相關新聞", icon: "📰" },
    { id: "charts", label: "研究圖表", icon: "📈" },
  ];

  return (
    <div className="fade-in">
      <div className="max-w-6xl mx-auto">
        {/* ─── Top Bar: Back + Company Header ─── */}
        <div className="flex items-center justify-between mb-6">
          <button
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors group"
            onClick={onBack}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回公司列表
          </button>
          <button className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)] hover:text-rose-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            加入收藏
          </button>
        </div>

        {/* ─── Company Title ─── */}
        <div className="mb-5">
          <h1 className="text-3xl font-bold text-white mb-2">
            {data.name} <span className="text-[var(--color-text-secondary)] text-xl font-normal">({data.code})</span>
          </h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {data.profile.industry} · <span style={{ color: marketPos.color }}>{marketPos.label}</span>
          </p>
        </div>

        {/* ─── Badges ─── */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          {badges.filter(b => b.show).map((b, i) => (
            <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ color: b.color, backgroundColor: `${b.color}18`, border: `1px solid ${b.color}30` }}>
              {b.label}
            </span>
          ))}
        </div>

        {/* ─── Main Tabs ─── */}
        <div className="flex items-center gap-1 border-b border-[var(--color-border)] mb-8 overflow-x-auto">
          {DETAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2",
                detailTab === tab.id
                  ? "text-indigo-400 border-indigo-400"
                  : "text-[var(--color-text-tertiary)] border-transparent hover:text-[var(--color-text-secondary)]"
              )}
              onClick={() => setDetailTab(tab.id)}
            >
              <span className="mr-1.5">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <div className="min-h-[400px]">
          {/* ─── 基本資料 Tab ─── */}
          {detailTab === "overview" && (
            <div className="space-y-8">
              {/* AI 智能摘要 */}
              <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-600/[0.06] border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <AiIcon />
                  </div>
                  <h4 className="text-sm font-bold text-white">AI 智能摘要</h4>
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">Beta</Badge>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{aiSummary}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="text-xs text-[var(--color-text-tertiary)] px-3 py-1.5 bg-white/[0.04] rounded-lg">
                    📊 分析基於公開財務資料
                  </div>
                </div>
              </div>

              <CompanyFinancialPanel data={data} revenueTab={revenueTab} onRevenueTabChange={setRevenueTab} />
            </div>
          )}

          {/* ─── 產業分析 Tab ─── */}
          {detailTab === "industry" && (
            <div className="space-y-6">
              {industryRoles.length > 0 ? (
                <>
                  {/* Industry sub-tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {industryRoles.map((role, i) => {
                      const topicShort = role.topicName.includes("｜") ? role.topicName.split("｜")[1] || role.topicName : role.topicName;
                      const cat = getCategory(role.topicName);
                      const color = CATEGORY_COLORS[cat] || DEFAULT_COLOR;
                      return (
                        <button
                          key={i}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border",
                            industrySubTab === i
                              ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/40"
                              : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                          )}
                          onClick={() => setIndustrySubTab(i)}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color.solid }} />
                          {topicShort}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected industry detail */}
                  {industryRoles[industrySubTab] && (() => {
                    const role = industryRoles[industrySubTab];
                    const relInfo = getRelevanceInfo(role.relevance);
                    const roleBadge = getRoleBadge(role.relevance);
                    const cat = getCategory(role.topicName);
                    const analysisText = role.analysis || generateIndustryAnalysis(relInfo.label, role.topicName, role.relevance, role.role, data);

                    // Check for per-topic analysis data
                    const topicAnalysis = data.industry_analysis?.[role.topic];

                    return (
                      <div className="space-y-6">
                        {/* AI 產業分析 Summary */}
                        <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-600/[0.06] border border-indigo-500/20 rounded-2xl p-6">
                          <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                              <AiIcon />
                            </div>
                            <h4 className="text-sm font-bold text-white">AI 智能摘要</h4>
                            <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">Beta</Badge>
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            {topicAnalysis?.ai_summary || analysisText}
                          </p>
                          <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-full" style={{ color: roleBadge.color, backgroundColor: roleBadge.bg }}>
                              {relInfo.emoji} {relInfo.label}
                            </span>
                            <span className="text-sm font-semibold text-white">{role.topicName}</span>
                            <span className="text-xs text-[var(--color-text-tertiary)]">— {cat}</span>
                          </div>
                        </div>

                        {/* 市場定位 */}
                        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                          <h4 className="text-sm font-bold text-white mb-3">🎯 市場定位</h4>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{topicAnalysis?.market_position?.charAt(0) || marketPos.emoji}</span>
                            <span className="text-lg font-bold" style={{ color: topicAnalysis?.market_position === '🟢 產業龍頭' ? '#34d399' : topicAnalysis?.market_position === '🟠 成長挑戰' ? '#fbbf24' : '#60a5fa' }}>
                              {topicAnalysis?.market_position || marketPos.label}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                            {topicAnalysis?.market_position_detail || `${data.name}為${role.topicName}產業之關鍵參與者，在供應鏈中扮演${relInfo.label}角色。`}
                          </p>
                        </div>

                        {/* 技術重心 */}
                        {topicAnalysis?.focus ? (
                          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                            <h4 className="text-sm font-bold text-white mb-3">🔬 技術重心</h4>
                            <div className="space-y-4">
                              {topicAnalysis.focus.split('\n\n').map((section, si) => {
                                const lines = section.split('\n');
                                const title = lines[0];
                                const bullets = lines.slice(1).filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'));
                                return (
                                  <div key={si}>
                                    {title && <p className="text-sm font-semibold text-white mb-2">{title.replace(/^[-•]\s*/, '')}</p>}
                                    {bullets.length > 0 && (
                                      <ul className="space-y-1.5">
                                        {bullets.map((b, bi) => (
                                          <li key={bi} className="text-sm text-[var(--color-text-secondary)] pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-indigo-400">
                                            {b.replace(/^[-•]\s*/, '')}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <PlaceholderSection title="技術重心" icon="🔬" />
                        )}

                        {/* 主要產品 */}
                        {topicAnalysis?.products && topicAnalysis.products.length > 0 ? (
                          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                            <h4 className="text-sm font-bold text-white mb-3">📦 主要產品</h4>
                            <div className="space-y-3">
                              {topicAnalysis.products.map((p, i) => {
                                const [name, ...descParts] = p.split(': ');
                                const desc = descParts.join(': ');
                                return (
                                  <div key={i}>
                                    <p className="text-sm font-semibold text-white">{name}</p>
                                    {desc && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{desc}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <PlaceholderSection title="主要產品" icon="📦" />
                        )}

                        {/* 主要客戶 */}
                        {topicAnalysis?.customers && topicAnalysis.customers.length > 0 ? (
                          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                            <h4 className="text-sm font-bold text-white mb-3">👥 主要客戶</h4>
                            <div className="space-y-3">
                              {topicAnalysis.customers.map((c, i) => {
                                const [name, ...descParts] = c.split(': ');
                                const desc = descParts.join(': ');
                                return (
                                  <div key={i}>
                                    <p className="text-sm font-semibold text-white">{name}</p>
                                    {desc && <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{desc}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <PlaceholderSection title="主要客戶" icon="👥" />
                        )}

                        {/* SWOT 分析 */}
                        {topicAnalysis?.swot && ((topicAnalysis.swot.strengths?.length ?? 0) > 0 || (topicAnalysis.swot.weaknesses?.length ?? 0) > 0) ? (
                          <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                            <h4 className="text-sm font-bold text-white mb-4">🏛️ SWOT 分析</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {[
                                { label: "優勢 (S)", items: topicAnalysis.swot.strengths || [], color: "#34d399" },
                                { label: "劣勢 (W)", items: topicAnalysis.swot.weaknesses || [], color: "#f87171" },
                                { label: "機會 (O)", items: topicAnalysis.swot.opportunities || [], color: "#818cf8" },
                                { label: "威脅 (T)", items: topicAnalysis.swot.threats || [], color: "#fbbf24" },
                              ].map((sw) => (
                                <div key={sw.label} className="bg-white/[0.02] rounded-xl p-4">
                                  <h5 className="text-xs font-bold mb-2" style={{ color: sw.color }}>{sw.label}</h5>
                                  <ul className="space-y-1">
                                    {sw.items.map((item, i) => (
                                      <li key={i} className="text-xs text-[var(--color-text-secondary)]">• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <PlaceholderSection title="SWOT 分析" icon="🏛️" />
                        )}

                        {/* 供應鏈角色 */}
                        <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                          <h4 className="text-sm font-bold text-white mb-3">🔗 在此產業的角色</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[var(--color-text-secondary)]">供應鏈群組</span>
                              <span className="text-sm text-white font-medium">{role.group}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-[var(--color-text-secondary)]">角色定位</span>
                              <span className="text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap" style={{ color: roleBadge.color, backgroundColor: roleBadge.bg }}>
                                {relInfo.emoji} {relInfo.label}
                              </span>
                            </div>
                            {role.role && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-[var(--color-text-secondary)]">角色說明</span>
                                <span className="text-sm text-white font-medium">{role.role}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🏭</div>
                  <h3 className="text-lg font-semibold text-white mb-2">尚無產業關聯</h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">此公司尚未建立產業關聯分析。</p>
                </div>
              )}
            </div>
          )}

          {/* ─── 籌碼分析 Tab ─── */}
          {detailTab === "chips" && (
            <div className="space-y-6">
              <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                <h4 className="text-sm font-bold text-white mb-4">🎰 籌碼分析</h4>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <StatItem label="本益比 (P/E)" value={data.valuation.pe || "-"} sub={data.valuation.pe ? "倍" : undefined} />
                  <StatItem label="股價淨值比 (P/B)" value={data.valuation.pb || "-"} sub={data.valuation.pb ? "倍" : undefined} />
                  <StatItem label="現金殖利率" value={data.valuation.dividendYield ? `${data.valuation.dividendYield}%` : "-"} />
                  <StatItem label="負債比" value={(() => {
                    const assets = parseFloat(data.balance.totalAssets);
                    const liabilities = parseFloat(data.balance.totalLiabilities);
                    if (assets > 0 && liabilities > 0) return ((liabilities / assets) * 100).toFixed(1) + "%";
                    return "-";
                  })()} />
                </div>
              </div>
              <PlaceholderSection title="外資持股變化" icon="🌐" />
              <PlaceholderSection title="投信買賣超" icon="🏦" />
              <PlaceholderSection title="融資融券" icon="📈" />
            </div>
          )}

          {/* ─── 技術分析 Tab ─── */}
          {detailTab === "tech" && (
            <div className="space-y-6" ref={techTabRef}>
              {/* TradingView Symbol Overview Widget */}
              <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">📈 技術走勢圖</h4>
                  <a
                    href={`https://www.tradingview.com/symbols/TWSE-${data.code}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
                  >
                    在 TradingView 開啟 ↗
                  </a>
                </div>
                <div className="tradingview-widget-container" style={{ height: "500px", width: "100%" }}>
                  <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-3">💡 在圖表上可切換日線/週線/月線，查看成交量與均線。如需完整 K 線圖與技術指標，請點擊上方連結。</p>
              </div>

              {/* Key Indicators */}
              <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                <h4 className="text-sm font-bold text-white mb-4">📈 關鍵指標</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white/[0.04] rounded-xl p-4 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">本益比</p>
                    <p className="text-xl font-bold text-white">{data.valuation.pe || "-"}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">倍</p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-4 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">股價淨值比</p>
                    <p className="text-xl font-bold text-white">{data.valuation.pb || "-"}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">倍</p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-4 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">現金殖利率</p>
                    <p className="text-xl font-bold text-white">{data.valuation.dividendYield || "-"}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">%</p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-4 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-1">每股淨值</p>
                    <p className="text-xl font-bold text-white">{data.balance.bookValuePerShare || "-"}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">元</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── 相關新聞 Tab ─── */}
          {detailTab === "news" && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📰</div>
              <h3 className="text-lg font-semibold text-white mb-2">新聞資料準備中</h3>
              <p className="text-sm text-[var(--color-text-tertiary)] max-w-md mx-auto">
                我們正在整合新聞來源，敬請期待即時新聞更新功能。
              </p>
            </div>
          )}

          {/* ─── 研究圖表 Tab ─── */}
          {detailTab === "charts" && (
            <div className="space-y-6">
              <div className="bg-[var(--color-surface)] rounded-2xl p-10 border border-[var(--color-border)] text-center">
                <div className="text-4xl mb-4">📈</div>
                <h4 className="text-lg font-bold text-white mb-2">研究圖表</h4>
                <p className="text-sm text-[var(--color-text-tertiary)]">功能規劃中，敬請期待</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-2">將提供更多進階分析圖表與研究工具</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
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
  const [companyViewMode, setCompanyViewMode] = useState<CompanyViewMode>("list");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const companyListScrollRef = useRef<number>(0);

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
    if (activeTab === "companies") {
      setCompanyViewMode("detail");
    } else {
      setShowCompanyModal(true);
    }
  };
  const goBackToCompanyList = () => {
    setCompanyViewMode("list");
    // Keep selectedCompanyCode so state is preserved if user goes back
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
      {!(activeTab === "companies" && companyViewMode === "detail") && (
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
      )}

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
          <>
            {/* ─── Company List Mode ─── */}
            {companyViewMode === "list" && (
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
                <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-[100px_1fr_100px] px-7 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60">
                    <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">代碼</span>
                    <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">名稱</span>
                    <span className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider text-right">題材數</span>
                  </div>
                  <ScrollArea className="max-h-[calc(100vh-280px)]">
                    {filteredCompanies.slice(0, 150).map((company) => (
                      <button key={company.code} className="company-row w-full grid grid-cols-[100px_1fr_100px] px-7 py-4 items-center gap-4 text-left transition-colors hover:bg-white/[0.03]" onClick={() => goToCompany(company.code)}>
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
            )}

            {/* ─── Company Detail (Full Page) Mode ─── */}
            {companyViewMode === "detail" && (
              <div className="fade-in">
                {financialLoading ? (
                  <div className="text-center py-24">
                    <div className="inline-block w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-4">載入公司資料...</p>
                  </div>
                ) : financialData && selectedCompanyData ? (
                  <CompanyFullPageDetail
                    data={financialData}
                    roles={selectedCompanyData.roles}
                    onBack={goBackToCompanyList}
                  />
                ) : financialError && selectedCompanyData ? (
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                      <button
                        className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors group"
                        onClick={goBackToCompanyList}
                      >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        返回公司列表
                      </button>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      {selectedCompanyData.name} <span className="text-[var(--color-text-secondary)] text-xl font-normal">({selectedCompanyData.code})</span>
                    </h1>
                    <div className="mt-8">
                      <NoFinancialData code={selectedCompanyData.code} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24">
                    <p className="text-sm text-[var(--color-text-tertiary)]">請選擇一家公司</p>
                  </div>
                )}
              </div>
            )}
          </>
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
                <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-11 rounded-xl" onClick={() => { setShowCompanyModal(false); setActiveTab("companies"); goToCompany(selectedCompanyData.code); }}>查看完整資料</Button>
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