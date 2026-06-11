"use client";

import { Component, type ErrorInfo, type ReactNode, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, ComposedChart } from "recharts";
import topicMapData from "../../public/data/canonical-topic-map.json";
import TradingViewChart from "./TradingViewChart";
import RealtimeQuote from "./RealtimeQuote";
import { computeTechnicalSummary, normalizeFinancialData } from "@/lib/marketData";
import { generateDailyAnalysis, type DailyAnalysis } from "@/lib/dailyAnalysis";
import { findProductKnowledgeItem, productKnowledgeToNarrative, type CompanyProductKnowledge, type ProductNarrative } from "@/lib/productKnowledge";
import { directnessLabel, directnessToRelevance, normalizeCompanyTopicRoles, type CompanyTopicRolesKnowledge, type Directness } from "@/lib/companyTopicRoles";
import { groupCompanySwot, normalizeCompanySwot, selectTopicSwotItems, type CompanySwotItem, type CompanySwotKnowledge, type GroupedSwot } from "@/lib/companySwot";
import { CompanyEditorialBrief } from "@/components/company-detail/CompanyEditorialBrief";
import { CompanyDetailTabs, type CompanyDetailTab } from "@/components/company-detail/CompanyDetailTabs";
import { CompanyOverviewTab } from "@/components/company-detail/CompanyOverviewTab";
import { CompanyInfoHeader } from "@/components/company-detail/CompanyInfoHeader";
import { FinancialOverviewCards } from "@/components/company-detail/FinancialOverviewCards";
import { DividendPolicyPanel } from "@/components/company-detail/DividendPolicyPanel";
import { RevenueAnalysisPanel } from "@/components/company-detail/RevenueAnalysisPanel";
import { ProfitabilityAnalysisPanel } from "@/components/company-detail/ProfitabilityAnalysisPanel";
import { BatchAnalysisPanel } from "@/components/company-detail/BatchAnalysisPanel";
import { TechnicalNextSessionPanel } from "@/components/company-detail/TechnicalNextSessionPanel";
import { CompanyChipsTabShell } from "@/components/company-detail/CompanyChipsTabShell";
import { CompanyInstitutionalTrendPanel } from "@/components/company-detail/CompanyInstitutionalTrendPanel";
import { MajorNewsListPanel } from "@/components/company-detail/MajorNewsListPanel";
import { RelatedNewsListPanel } from "@/components/company-detail/RelatedNewsListPanel";
import { CompanyDetailHeroHeader } from "@/components/company-detail/CompanyDetailHeroHeader";
import { CompanyIndustryTabShell } from "@/components/company-detail/CompanyIndustryTabShell";
import { CompanyIndustryRoleNavigation } from "@/components/company-detail/CompanyIndustryRoleNavigation";
import { CompanyIndustryRoleSummaryPanel } from "@/components/company-detail/CompanyIndustryRoleSummaryPanel";
import { CompanyIndustryMarketPositionPanel } from "@/components/company-detail/CompanyIndustryMarketPositionPanel";
import { CompanyIndustryTechnologyFocusPanel } from "@/components/company-detail/CompanyIndustryTechnologyFocusPanel";
import { CompanyIndustryProductsPanel } from "@/components/company-detail/CompanyIndustryProductsPanel";
import { CompanyIndustryCustomersPanel } from "@/components/company-detail/CompanyIndustryCustomersPanel";
import { CompanyIndustrySwotPanel } from "@/components/company-detail/CompanyIndustrySwotPanel";
import { CompanyIndustrySupplyChainRolePanel } from "@/components/company-detail/CompanyIndustrySupplyChainRolePanel";
import { buildCompanyIndustryInsights } from "@/lib/companyIndustryInsights";
import { buildCompanyEditorialBrief } from "@/lib/view-models/companyEditorialBrief";

/* ─── Types ─── */
interface CompanyInGroup { code: string; name: string; role: string; relevance: string; analysis?: string; products?: string[]; customers?: string[]; tech_focus?: string[]; swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] }; }
interface Group { name: string; level?: "upstream" | "midstream" | "downstream" | "peripheral"; companies: CompanyInGroup[]; }
interface TopicData { slug: string; name: string; description: string; total: number; groups: Group[]; }
interface CompanyData { code: string; name: string; topic_count: number; topics: string[]; }
interface MajorNewsItem { date: string; subject: string; source?: string; }

interface FinancialProfile { industry: string; chairman: string; established: string; listed: string; capital: string; website: string; address?: string; }
interface FinancialValuation { date: string; pe: string; pb: string; dividendYield: string; }
interface FinancialPrice { date: string; open: number; high: number; low: number; close: number; volume: number; }
interface FinancialIncome { revenue: string; grossProfit: string; operatingIncome: string; netIncome: string; eps: string; operatingMargin?: string; revenueYoy?: number; }
interface FinancialMonthlyRevenue { month: string; revenue: string; mom: string; yoy: string; }
interface FinancialBalance { totalAssets: string; totalLiabilities: string; equity: string; bookValuePerShare: string; }
interface FinancialDividend { year: string; cashDividendPerShare: string; stockDividendPerShare?: string; }
interface FinancialDividendHistoryEntry { year: string; cashDividend: number; stockDividend: number; totalDividend: number; }
interface FinancialSWOT { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[]; }

interface TrendMonthlyRevenue { month: string; revenue: number; mom: number; yoy: number; }
interface TrendQuarterlyIncome { quarter: string; revenue: number; grossProfit: number; operatingIncome?: number; netIncome: number; eps: number; grossMargin?: number; operatingMargin?: number; netMargin?: number; }
interface TrendMonthlyPrice { month: string; high: number; low: number; avg: number; volume: number; }
interface TrendDailyPrice { date: string; open: number; high: number; low: number; close: number; volume: number; }
interface TrendYearlyTrading { year: string; high: number; low: number; avg_closing: number; trade_volume: number; trade_value: number; }

interface FinancialTrends {
  monthly_revenue?: TrendMonthlyRevenue[];
  quarterly_income?: TrendQuarterlyIncome[];
  monthly_price?: TrendMonthlyPrice[];
  daily_prices?: TrendDailyPrice[];
  yearly_trading?: TrendYearlyTrading[];
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
  dividendHistory?: FinancialDividendHistoryEntry[];
  marketCap?: string;
  focus?: string;
  products?: string[];
  customers?: string[];
  swot?: FinancialSWOT;
  market_position?: string;
  trends?: FinancialTrends;
  institutional?: {
    date: string;
    foreign_net: number;
    foreign_buy: number;
    foreign_sell: number;
    investment_trust_net: number;
    investment_trust_buy: number;
    investment_trust_sell: number;
    dealer_net: number;
    total_net: number;
  };
  institutional_history?: {
    date: string;
    foreign_net: number;
    foreign_buy: number;
    foreign_sell: number;
    investment_trust_net: number;
    investment_trust_buy: number;
    investment_trust_sell: number;
    dealer_net: number;
    total_net: number;
  }[];
  margin_history?: {
    date: string;
    margin_buy: number;
    margin_sell: number;
    margin_balance: number;
    margin_limit: number;
    short_sell: number;
    short_buy: number;
    short_balance: number;
    short_limit: number;
    offset: number;
  }[];
  per_history?: {
    date: string;
    pe: number;
    pb: number;
    dividend_yield: number;
  }[];
  major_news?: MajorNewsItem[];
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

const darkTooltipProps = {
  contentStyle: {
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    border: "1px solid rgba(148, 163, 184, 0.28)",
    borderRadius: 12,
    color: "#e5e7eb",
    fontSize: 12,
    boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
  },
  labelStyle: { color: "#cbd5e1", fontWeight: 700 },
  itemStyle: { color: "#e5e7eb" },
} as const;

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

function stripLeadingStatusIcon(value?: string): string {
  return String(value ?? "")
    .replace(/^[\s\uFFFD\uFE0F\u200D\u{1F300}-\u{1FAFF}]+/u, "")
    .trim();
}

function describeProduct(raw: string, context: { companyName: string; topicName: string; group: string }): ProductNarrative {
  const normalized = String(raw ?? "").trim();
  const [rawName, ...rawDescParts] = normalized.split(/[:：]\s*/);
  const name = rawName?.trim() || normalized || "產品/技術項目";
  const explicitDescription = rawDescParts.join("：").trim();
  const lowerName = name.toLowerCase();

  let description = explicitDescription;
  let whyItMatters = "";

  if (/cowos-s/i.test(name)) {
    description ||= "CoWoS-S 是以矽中介層（Silicon Interposer）連接 GPU/ASIC 與 HBM 的 2.5D 先進封裝，是目前 AI 加速器最主流的高頻寬封裝路線。";
    whyItMatters = "厲害之處在於能把運算晶片與高頻寬記憶體放在同一封裝內，大幅降低資料搬運瓶頸；AI GPU 效能、良率與供給量都會卡在這類封裝能力。";
  } else if (/cowos-l/i.test(name)) {
    description ||= "CoWoS-L 是面向更大晶片尺寸與更多 HBM 堆疊的進階 CoWoS 路線，常被視為 Blackwell / Rubin 世代 AI 晶片擴大封裝面積與 I/O 的關鍵。";
    whyItMatters = "它讓更大規模的 AI 加速器能維持高頻寬互連，是先進封裝從『能做』走向『能大量供應』的重要產能瓶頸。";
  } else if (/cowos/i.test(name)) {
    description ||= "CoWoS 是台積電 2.5D 先進封裝平台，用來把 GPU/ASIC、HBM 與多顆晶片整合在同一封裝內，解決 AI 晶片需要超高頻寬與高密度互連的問題。";
    whyItMatters = "AI 加速器不是只靠單顆晶片變強，還要靠封裝把運算與記憶體高速接在一起；CoWoS 產能與良率因此成為 NVIDIA、AMD、Broadcom 等 AI 晶片出貨的關鍵瓶頸。";
  } else if (/soic/i.test(name)) {
    description ||= "SoIC 是台積電 3D IC 晶片堆疊技術，透過晶片對晶片的垂直整合縮短訊號路徑，提升效能與能源效率。";
    whyItMatters = "當先進製程微縮越來越貴，3D 堆疊提供另一條提升系統效能的路線，對 HPC、AI 與高階行動晶片都有戰略價值。";
  } else if (/wmcm/i.test(name)) {
    description ||= "WMCM 是晶圓級多晶片模組封裝，把多顆晶片在晶圓級整合，目標是提升封裝密度並降低高階模組量產成本。";
    whyItMatters = "它代表台積電把先進封裝往更高產能、更高整合度推進，對 AI/HPC 客戶縮短導入時間有幫助。";
  } else if (/\bN2\b|2奈米|2nm/i.test(name)) {
    description ||= "N2 是台積電 2 奈米製程節點，導入奈米片電晶體架構，主打效能、功耗與晶片密度進一步改善。";
    whyItMatters = "先進製程節點決定高階 AI、HPC、手機晶片的功耗與效能上限，也是台積電維持晶圓代工定價能力的核心。";
  } else if (/\bN3\b|N3E|3奈米|3nm/i.test(name)) {
    description ||= "N3 / N3E 是台積電 3 奈米家族製程，服務高階手機、HPC 與 AI ASIC，是目前先進製程營收的重要來源。";
    whyItMatters = "它代表台積電已量產化的領先節點，客戶導入速度會直接影響先進製程營收占比與毛利率。";
  } else if (/\bN5\b|\bN4\b|5奈米|4奈米|5nm|4nm/i.test(name)) {
    description ||= "N5 / N4 是台積電成熟量產的先進製程平台，廣泛用於手機 SoC、GPU、HPC 與高速網通晶片。";
    whyItMatters = "這類節點兼具良率、成本與產能，是支撐台積電現金流與 AI/HPC 大量出貨的主力基礎。";
  } else if (/a16/i.test(lowerName)) {
    description ||= "A16 是台積電規劃中的更先進製程平台，搭配背面供電等技術以改善功耗與訊號傳輸。";
    whyItMatters = "它是後 2 奈米世代的技術延伸，關係到台積電能否繼續拉開與競爭對手的製程差距。";
  } else if (!description) {
    description = `${name} 是 ${context.companyName} 在「${context.topicName}」中對應到「${context.group}」供應鏈角色的產品、服務或技術項目。`;
    whyItMatters = "後續應用年報、法說會、客戶導入與營收資料補強說明，避免只靠題材名稱硬套故事。";
  }

  return { name, description, whyItMatters };
}

type CompanyRole = {
  topic: string;
  topicName: string;
  topicDescription: string;
  group: string;
  role: string;
  relevance: string;
  analysis?: string;
  products?: string[];
  customers?: string[];
  tech_focus?: string[];
  swot?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
};

function relevanceScore(relevance: string): number {
  const raw = String(relevance ?? "").trim();
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;
  if (["極高", "high", "核心"].includes(raw)) return 95;
  if (raw === "高") return 90;
  if (["中", "medium"].includes(raw)) return 75;
  if (raw === "低") return 60;
  return 50;
}

function isDirectCompanyTopic(role: CompanyRole): boolean {
  const score = relevanceScore(role.relevance);
  const text = `${role.topicName} ${role.group} ${role.role}`;
  if (score < 80) return false;

  // 台積電這類龍頭容易被「只要題材要晶片/ASIC/封裝就沾上」污染。
  // 只保留它直接提供產品/產能/技術平台的題材；把終端應用的間接受惠題材降噪。
  if (role.topicName.includes("AI 伺服器") || role.topicName.includes("智慧機器人")) return false;
  if (/(?:BBU|CXL|玻璃基板)/i.test(text)) return false;
  if (/ASIC代工|邊緣AI晶圓代工|CXL封裝代工|玻璃基板封裝代工/.test(text)) return false;

  return true;
}

function filterCompanyRoles(roles: CompanyRole[]): CompanyRole[] {
  const unique = Array.from(new Map(roles.map((role) => [role.topic, role])).values());
  const direct = unique.filter(isDirectCompanyTopic);
  const base = direct.length > 0 ? direct : unique.filter((role) => relevanceScore(role.relevance) >= 80);
  return base
    .sort((a, b) => relevanceScore(b.relevance) - relevanceScore(a.relevance) || a.topicName.localeCompare(b.topicName, "zh-TW"))
    .slice(0, 6);
}

function mapGroupNames(groups: Group[]): Group[] {
  const levelNames = ["上游原料與設備", "中游製造與組件", "下游系統與應用", "周邊與服務", "其他"];
  const named = groups.map((g, i) => ({ ...g, name: g.name || levelNames[i] || `群組 ${i + 1}` }));
  // Sort by supply chain level: upstream → midstream → downstream
  // Use checked-in supply-chain level metadata when available; otherwise classify from group text.
  const levelOrder: Record<string, number> = { upstream: 0, midstream: 1, downstream: 2, peripheral: 3 };
  return named.sort((a, b) => {
    const la = levelOrder[a.level || classifyGroupLevel(a)] ?? 1;
    const lb = levelOrder[b.level || classifyGroupLevel(b)] ?? 1;
    return la - lb;
  });
}

/* Classify a group's supply chain level based on company roles and group name */
function classifyGroupLevel(group: Group): "upstream" | "midstream" | "downstream" | "peripheral" {
  const name = group.name || "";
  const roles = group.companies.map(c => (c.role || "")).join(" ");
  const combined = `${name} ${roles}`;

  // ─── Phase 1: Group name direct match (highest priority) ───
  // If the group name explicitly says what level it is, trust it
  if (/(?:材料|原料|基板|晶圓|光阻|化學|氣體|耗材|CCL|玻纖|銅箔|被動|MLCC|IC設計|矽智財|IC載板|封裝材料|半導體材料|設備|零件|散熱|液冷|滑軌|機殼|連接器|導線架|PCB|電池|BMS|功率|射頻|電源管理|特化|LED晶片|光電元件|特殊鋼|複材)/.test(name)) return "upstream";
  if (/(?:品牌|終端|應用|服務|通路|營運|ODM|OEM|系統整合|整機|組裝|風場|投資|電商|零售|平台|OTT|雲端)/.test(name)) return "downstream";
  if (/(?:代工|製造|封裝|封測|測試|模組|加工|生產|產線|組裝|ODM龍頭)/.test(name)) return "midstream";

  // ─── Phase 2: Score-based classification ───
  const upstreamKw = ["材料", "原料", "基板", "晶圓", "IC設計", "矽智財", "IP", "光阻", "化學", "氣體",
    "耗材", "PCB", "被動元件", "MLCC", "連接器", "導線架", "特用", "供應",
    "半導體材料", "封裝材料", "IC載板", "CCL", "玻纖", "銅箔", "設備",
    "散熱", "液冷", "機殼", "滑軌", "電池", "BMS", "特殊鋼", "複材", "零件"];
  const downstreamKw = ["品牌", "終端", "應用", "服務", "通路", "營運", "系統整合",
    "伺服器品牌", "投資", "電商", "零售", "運維", "風場", "整機", "組裝",
    "ODM", "OEM", "平台", "雲端"];

  let upScore = 0, downScore = 0;
  for (const kw of upstreamKw) { if (combined.includes(kw)) upScore++; }
  for (const kw of downstreamKw) { if (combined.includes(kw)) downScore++; }
  // Midstream keywords
  const midKw = ["代工", "製造", "封裝", "測試", "模組"];
  let midScore = 0;
  for (const kw of midKw) { if (combined.includes(kw)) midScore++; }

  // Lower threshold: +0 instead of +1
  if (upScore > 0 && upScore >= downScore && upScore >= midScore) return "upstream";
  if (downScore > 0 && downScore >= upScore && downScore >= midScore) return "downstream";
  if (midScore > 0 && midScore > upScore && midScore > downScore) return "midstream";

  // Fallback: if name contains keywords that suggest a level
  if (upScore > downScore) return "upstream";
  if (downScore > upScore) return "downstream";

  return "midstream";
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

/** Convert ROC year string like "107" → "2018" */
function formatROCYear(year: string): string {
  if (!year) return "-";
  const num = parseInt(year);
  if (num < 200 && num > 0) return String(num + 1911);
  return year;
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

type TabId = "focus" | "topics" | "map" | "companies";
type CompanyViewMode = "list" | "detail";

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
  return formatRevenueThousandsDisplay(num);
}

function formatRevShortNTD(num: number): string {
  return formatRevenueNTDDisplay(num);
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
          <span className="text-lg font-bold text-white">{formatRevShortNTD(data[0].revenue)}</span>
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
        <span className="text-sm font-bold text-white">{formatRevShortNTD(data[data.length - 1].revenue)}</span>
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

/* ─── Profitability Trend Panel (aistockmap style) ─── */
function ProfitabilityTrendPanel({ data }: { data: FinancialData }) {
  const trends = data.trends;
  if (!trends?.quarterly_income || trends.quarterly_income.length < 2) {
    return (
      <div>
        <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">獲利能力趨勢</h4>
        <div className="bg-white/[0.02] rounded-xl p-6 text-center">
          <span className="text-[var(--color-text-tertiary)] text-sm">📋 季度資料累積中</span>
        </div>
      </div>
    );
  }

  const chartData = trends.quarterly_income.map(d => ({
    quarter: d.quarter,
    grossMargin: d.revenue > 0 ? parseFloat(((d.grossProfit / d.revenue) * 100).toFixed(1)) : 0,
    operatingMargin: d.revenue > 0 && data.income.operatingIncome
      ? parseFloat(((d.revenue > 0 ? (d.grossProfit - d.revenue * 0.08) / d.revenue * 100 : 0)).toFixed(1))
      : 0,
    netMargin: d.revenue > 0 ? parseFloat(((d.netIncome / d.revenue) * 100).toFixed(1)) : 0,
    eps: d.eps,
  }));

  // Calculate operating margin from quarterly data
  const chartDataWithOM = trends.quarterly_income.map(d => ({
      quarter: d.quarter,
      grossMargin: d.grossMargin ?? (d.revenue > 0 ? parseFloat(((d.grossProfit / d.revenue) * 100).toFixed(1)) : 0),
      operatingMargin: d.operatingMargin ?? 0,
      netMargin: d.netMargin ?? (d.revenue > 0 ? parseFloat(((d.netIncome / d.revenue) * 100).toFixed(1)) : 0),
      eps: d.eps,
  }));

  const latest = chartDataWithOM[chartDataWithOM.length - 1];

  return (
    <div>
      <h4 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3">獲利能力趨勢</h4>

      {/* Latest metrics row */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        <div className="bg-white/[0.02] rounded-xl p-3 text-center">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">毛利率</div>
          <div className="text-lg font-bold" style={{ color: "#f472b6" }}>{latest.grossMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-white/[0.02] rounded-xl p-3 text-center">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">營益率</div>
          <div className="text-lg font-bold" style={{ color: "#22d3ee" }}>{latest.operatingMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-white/[0.02] rounded-xl p-3 text-center">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">淨利率</div>
          <div className="text-lg font-bold" style={{ color: "#fbbf24" }}>{latest.netMargin.toFixed(1)}%</div>
        </div>
        <div className="bg-white/[0.02] rounded-xl p-3 text-center">
          <div className="text-[10px] text-[var(--color-text-tertiary)] mb-1">EPS</div>
          <div className="text-lg font-bold text-white">{latest.eps.toFixed(2)}</div>
        </div>
      </div>

      {/* Composed chart: Lines for margins + Bar for EPS */}
      <div className="bg-white/[0.02] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">毛利率 / 營益率 / 淨利率 / EPS</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartDataWithOM} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3,3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="quarter" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" tick={rechartsAxisStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
            <YAxis yAxisId="right" orientation="right" tick={rechartsAxisStyle} tickLine={false} axisLine={false} />
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
      </div>

      {/* Profitability table */}
      <div className="mt-4 overflow-hidden rounded-xl">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] font-semibold text-[var(--color-text-tertiary)]">
              <th className="px-3 py-2 text-left">季度</th>
              <th className="px-3 py-2 text-right">毛利率</th>
              <th className="px-3 py-2 text-right">營益率</th>
              <th className="px-3 py-2 text-right">淨利率</th>
              <th className="px-3 py-2 text-right">EPS</th>
            </tr>
          </thead>
          <tbody className="max-h-52 overflow-y-auto">
            {[...trends.quarterly_income].reverse().slice(0, 8).map((row, i) => (
              <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{formatQuarterLabel(row.quarter)}</td>
                <td className="px-3 py-1.5 text-right text-pink-400 font-medium">{(row.grossMargin ?? (row.revenue > 0 ? (row.grossProfit / row.revenue * 100) : 0)).toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-right text-cyan-400 font-medium">{(row.operatingMargin ?? 0).toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-right text-yellow-400 font-medium">{(row.netMargin ?? (row.revenue > 0 ? (row.netIncome / row.revenue * 100) : 0)).toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-right text-indigo-400 font-medium">{row.eps.toFixed(2)} 元</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Major News Panel (dynamic MOPS/TWSE fetch with snapshot fallback) ─── */
function DynamicMajorNewsPanel({ code, initialMajorNews }: { code: string; initialMajorNews?: MajorNewsItem[] }) {
  const [majorNews, setMajorNews] = useState<MajorNewsItem[]>(initialMajorNews ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState(initialMajorNews && initialMajorNews.length > 0 ? "local snapshot" : "");
  const [fetchedAt, setFetchedAt] = useState("");

  useEffect(() => {
    if (!code) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetch(`/api/major-news?symbol=${encodeURIComponent(code)}`, { signal: controller.signal, cache: "no-store" })
        .then(r => {
          if (!r.ok) throw new Error("major-news request failed");
          return r.json();
        })
        .then(data => {
          const rows = Array.isArray(data.majorNews) ? data.majorNews : [];
          setMajorNews(rows.length > 0 ? rows : (initialMajorNews ?? []));
          setSource(data.source || (rows.length > 0 ? "TWSE OpenAPI" : "local snapshot"));
          setFetchedAt(data.fetchedAt || "");
          setLoading(false);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string }).name === "AbortError") return;
          setError("即時重大訊息載入失敗，已顯示本地快照");
          setMajorNews(initialMajorNews ?? []);
          setSource(initialMajorNews && initialMajorNews.length > 0 ? "local snapshot" : "");
          setLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [code, initialMajorNews]);

  return (
    <MajorNewsListPanel
      majorNews={majorNews}
      loading={loading}
      error={error}
      source={source}
      fetchedAt={fetchedAt}
    />
  );
}

/* ─── News Tab Content (dynamic) ─── */
function NewsTabContent({ code, name, majorNews }: { code: string; name: string; majorNews?: MajorNewsItem[] }) {
  const [news, setNews] = useState<{ title: string; link: string; source: string; date: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code || !name) return;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetch(`/api/news?symbol=${encodeURIComponent(code)}&name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(data => {
          setNews(data.news || []);
          setLoading(false);
        })
        .catch(() => {
          setError("新聞載入失敗");
          setLoading(false);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [code, name]);

  return (
    <div className="space-y-6">
      <RelatedNewsListPanel
        news={news}
        loading={loading}
        error={error}
        name={name}
        code={code}
      />

      <DynamicMajorNewsPanel code={code} initialMajorNews={majorNews} />
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

/* ─── Resilient Tab Error Boundary ─── */
class TabErrorBoundary extends Component<
  { tabKey: string; children: ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Company detail tab crashed", { error, info, tabKey: this.props.tabKey });
  }

  componentDidUpdate(prevProps: { tabKey: string }) {
    if (prevProps.tabKey !== this.props.tabKey && this.state.hasError) {
      this.setState({ hasError: false, message: "" });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-semibold text-white mb-2">這個分頁暫時無法載入</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">已保護其他分頁不受影響，請切換分頁或重新整理。</p>
        {this.state.message && <p className="text-xs text-rose-200/80">{this.state.message}</p>}
      </div>
    );
  }
}

/* ─── Company Full Page Detail View ─── */
function CompanyFullPageDetail({
  data,
  roles,
  onBack,
}: {
  data: FinancialData;
  roles: CompanyRole[] | null;
  onBack: () => void;
}) {
  const [detailTab, setDetailTab] = useState<CompanyDetailTab>("overview");
  const [industrySubTab, setIndustrySubTab] = useState(0);
  const [revenueTab, setRevenueTab] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [techScope, setTechScope] = useState<"1M" | "3M" | "6M" | "YTD" | "1Y" | "5Y">("1Y");
  const [maLines, setMaLines] = useState<{ ma5: boolean; ma10: boolean; ma20: boolean; ma60: boolean }>({ ma5: true, ma10: true, ma20: true, ma60: false });
  const [loadedDailyAnalysis, setLoadedDailyAnalysis] = useState<DailyAnalysis | null>(null);
  const [productKnowledge, setProductKnowledge] = useState<CompanyProductKnowledge | null>(null);
  const [companyTopicRoles, setCompanyTopicRoles] = useState<CompanyTopicRolesKnowledge | null>(null);
  const [companySwot, setCompanySwot] = useState<CompanySwotKnowledge | null>(null);
  const fallbackDailyAnalysis = useMemo(() => generateDailyAnalysis(data), [data]);
  const resolvedDailyAnalysis = loadedDailyAnalysis?.code === data.code ? loadedDailyAnalysis : fallbackDailyAnalysis;
  const resolvedProductKnowledge = productKnowledge?.code === data.code ? productKnowledge : null;
  const resolvedCompanyTopicRoles = companyTopicRoles?.companyCode === data.code ? companyTopicRoles : null;
  const resolvedCompanySwot = companySwot?.companyCode === data.code ? companySwot : null;
  const groupedCompanySwot = useMemo(() => groupCompanySwot(resolvedCompanySwot), [resolvedCompanySwot]);
  const industryInsights = useMemo(() => buildCompanyIndustryInsights({
    companyCode: data.code,
    companyName: data.name,
    productKnowledge: resolvedProductKnowledge,
    topicRoles: resolvedCompanyTopicRoles,
    swot: resolvedCompanySwot,
  }), [data.code, data.name, resolvedProductKnowledge, resolvedCompanyTopicRoles, resolvedCompanySwot]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/data/analysis/${data.code}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("analysis not found");
        return response.json() as Promise<DailyAnalysis>;
      })
      .then((analysis) => {
        if (!cancelled) setLoadedDailyAnalysis(analysis);
      })
      .catch(() => {
        if (!cancelled) setLoadedDailyAnalysis(fallbackDailyAnalysis);
      });
    return () => {
      cancelled = true;
    };
  }, [data.code, fallbackDailyAnalysis]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/data/product-knowledge/${data.code}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("product knowledge not found");
        return response.json() as Promise<CompanyProductKnowledge>;
      })
      .then((knowledge) => {
        if (!cancelled && knowledge.code === data.code) setProductKnowledge(knowledge);
      })
      .catch(() => {
        if (!cancelled) setProductKnowledge(null);
      });
    return () => {
      cancelled = true;
    };
  }, [data.code]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/data/company-topic-roles/${data.code}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("company topic roles not found");
        return response.json() as Promise<unknown>;
      })
      .then((raw) => {
        const knowledge = normalizeCompanyTopicRoles(raw);
        if (!cancelled && knowledge?.companyCode === data.code) setCompanyTopicRoles(knowledge);
        if (!cancelled && knowledge?.companyCode !== data.code) setCompanyTopicRoles(null);
      })
      .catch(() => {
        if (!cancelled) setCompanyTopicRoles(null);
      });
    return () => {
      cancelled = true;
    };
  }, [data.code]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/data/company-swot/${data.code}.json`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("company SWOT not found");
        return response.json() as Promise<unknown>;
      })
      .then((raw) => {
        const knowledge = normalizeCompanySwot(raw);
        if (!cancelled && knowledge?.companyCode === data.code) setCompanySwot(knowledge);
        if (!cancelled && knowledge?.companyCode !== data.code) setCompanySwot(null);
      })
      .catch(() => {
        if (!cancelled) setCompanySwot(null);
      });
    return () => {
      cancelled = true;
    };
  }, [data.code]);

  const yoyNum = parseFloat(data.monthly_revenue.yoy) || 0;
  const marketPos = getMarketPosition(data.market_position);
  const trends = data.trends;
  const latestKLineDate = trends?.daily_prices?.length
    ? [...trends.daily_prices].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date
    : null;
  const editorialBrief = buildCompanyEditorialBrief({
    data,
    analysis: resolvedDailyAnalysis,
    industryInsights,
    latestKLineDate,
  });

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

  /* Badges — determine "連三月年增" from trends data */
  const consecutiveMonthlyGrowth = (() => {
    const mr = trends?.monthly_revenue;
    if (!mr || mr.length < 3) return false;
    const last3 = mr.slice(-3);
    return last3.every(d => d.yoy > 0);
  })();

  const badges: { label: string; color: string; show: boolean }[] = [
    { label: `月營收年增 ▲${yoyNum.toFixed(1)}%`, color: "#34d399", show: yoyNum > 0 },
    { label: "連三月年增", color: "#818cf8", show: consecutiveMonthlyGrowth },
    { label: "投信買超", color: "#fbbf24", show: false },
    { label: "有股票期貨", color: "#f97316", show: false },
  ];

  /* Industry sub-tabs */
  const industryRoles = roles || [];

  return (
    <div className="fade-in">
      <div className="max-w-6xl mx-auto">
        <CompanyDetailHeroHeader
          data={data}
          marketPosition={marketPos}
          badges={badges}
          onBack={onBack}
          quoteContent={<RealtimeQuote code={data.code} />}
        />

        {/* ─── Goal 7 Human Editorial company brief ─── */}
        <CompanyEditorialBrief editorialBrief={editorialBrief} />

        <CompanyDetailTabs activeTab={detailTab} onTabChange={setDetailTab}>
          {/* ─── Tab Content ─── */}
          <TabErrorBoundary tabKey={detailTab}>
            <div className="min-h-[400px]">
          {/* ─── 基本資料 Tab (aistockmap style) ─── */}
          {detailTab === "overview" && (
            <CompanyOverviewTab
              financialContent={(profitTab, setProfitTab) => (
                <>
                  {/* 1. 公司基本資料卡片 */}
                  <CompanyInfoHeader data={data} />

                  {/* 2. 最新財務概況 8 卡片 */}
                  <FinancialOverviewCards data={data} />

                  {/* 3. 股利政策 */}
                  <DividendPolicyPanel data={data} />

                  {/* 4. 營收分析趨勢 */}
                  <RevenueAnalysisPanel data={data} revenueTab={revenueTab} onRevenueTabChange={setRevenueTab} />

                  {/* 5. 獲利能力趨勢 */}
                  <ProfitabilityAnalysisPanel data={data} profitTab={profitTab} onProfitTabChange={setProfitTab} />
                </>
              )}
              majorNewsContent={<DynamicMajorNewsPanel code={data.code} initialMajorNews={data.major_news} />}
            />
          )}

          {/* ─── 產業分析 Tab ─── */}
          {detailTab === "industry" && (
            <CompanyIndustryTabShell
              industryInsights={industryInsights}
              hasIndustryRoles={industryRoles.length > 0}
            >
              <CompanyIndustryRoleNavigation
                roles={industryRoles}
                activeIndex={industrySubTab}
                onRoleChange={setIndustrySubTab}
              />

              {/* Selected industry detail */}
              {industryRoles[industrySubTab] && (() => {
                    const role = industryRoles[industrySubTab];
                    const relInfo = getRelevanceInfo(role.relevance);
                    const cat = getCategory(role.topicName);
                    const analysisText = role.analysis || generateIndustryAnalysis(relInfo.label, role.topicName, role.relevance, role.role, data);

                    const knowledge = resolvedDailyAnalysis?.knowledge;
                    const roleKnowledge = knowledge?.topicRoles.find((item) => item.topicId === role.topic);
                    const canonicalRole = resolvedCompanyTopicRoles?.roles.find((item) => item.topicId === role.topic && item.status !== "rejected");
                    const dailyCanonicalRole = resolvedDailyAnalysis?.canonicalKnowledge.topicRoles.find((item) => item.topicId === role.topic || item.canonicalTopicId === role.topic);
                    const canonicalRoleLabel = canonicalRole ? directnessLabel(canonicalRole.directness) : dailyCanonicalRole?.directnessLabel;
                    const displayDirectness = canonicalRole?.directness ?? dailyCanonicalRole?.directness as Directness | undefined;
                    const displayRelevance = displayDirectness ? directnessToRelevance(displayDirectness) : role.relevance;
                    const displayRelInfo = getRelevanceInfo(displayRelevance);
                    const displayRoleBadge = getRoleBadge(displayRelevance);
                    const topicMatchIds = [role.topic, canonicalRole?.topicId, dailyCanonicalRole?.topicId, dailyCanonicalRole?.canonicalTopicId]
                      .filter((item): item is string => Boolean(item));
                    const topicSwotFor = (key: keyof GroupedSwot) => selectTopicSwotItems(groupedCompanySwot, key, topicMatchIds);
                    const canonicalSwotItemsByKey: Record<keyof GroupedSwot, CompanySwotItem[]> = {
                      strengths: topicSwotFor("strengths"),
                      weaknesses: topicSwotFor("weaknesses"),
                      opportunities: topicSwotFor("opportunities"),
                      threats: topicSwotFor("threats"),
                    };
                    const canonicalSwot = resolvedCompanySwot ? {
                      strengths: canonicalSwotItemsByKey.strengths.map((item) => item.statement),
                      weaknesses: canonicalSwotItemsByKey.weaknesses.map((item) => item.statement),
                      opportunities: canonicalSwotItemsByKey.opportunities.map((item) => item.statement),
                      threats: canonicalSwotItemsByKey.threats.map((item) => item.statement),
                    } : undefined;
                    const dailyCanonicalSwotItems = resolvedDailyAnalysis?.canonicalKnowledge.swot.filter((item) => (
                      item.relatedTopicIds.length === 0 || item.relatedTopicIds.some((topicId) => topicMatchIds.includes(topicId))
                    )) ?? [];
                    const dailyCanonicalSwot = !resolvedCompanySwot && dailyCanonicalSwotItems.length > 0 ? {
                      strengths: dailyCanonicalSwotItems.filter((item) => item.category === "strength").map((item) => item.statement),
                      weaknesses: dailyCanonicalSwotItems.filter((item) => item.category === "weakness").map((item) => item.statement),
                      opportunities: dailyCanonicalSwotItems.filter((item) => item.category === "opportunity").map((item) => item.statement),
                      threats: dailyCanonicalSwotItems.filter((item) => item.category === "threat").map((item) => item.statement),
                    } : undefined;
                    const canonicalSwotEvidence = resolvedCompanySwot
                      ? resolvedCompanySwot.items
                        .filter((item) => item.status !== "rejected" && (item.relatedTopicIds.length === 0 || item.relatedTopicIds.some((topicId) => topicMatchIds.includes(topicId))))
                        .flatMap((item) => item.evidence.map((evidence) => `${evidence.publisher}：${evidence.title}`))
                      : [];
                    const fallbackSwot = canonicalSwot ?? dailyCanonicalSwot ?? role.swot ?? knowledge?.swot ?? data.swot ?? {
                      strengths: [`已建立「${role.topicName}」題材關聯，角色：${role.role || relInfo.label}`],
                      weaknesses: ["題材別產品、客戶與競爭資料仍需補來源驗證"],
                      opportunities: [`若${role.topicName}需求擴張，${role.group}供應鏈角色可能受惠`],
                      threats: ["題材熱度若未反映到營收或訂單，估值重評風險升高"],
                    };
                    const topicProducts = (canonicalRole?.products?.length ? canonicalRole.products : role.products?.length ? role.products : knowledge?.products?.length ? knowledge.products : data.products?.length ? data.products : [`${role.group}相關產品/服務: ${role.role || role.topicName}`]) ?? [];
                    const topicCustomers = (canonicalRole?.customers?.length ? canonicalRole.customers : role.customers?.length ? role.customers : knowledge?.customers?.length ? knowledge.customers : data.customers?.length ? data.customers : ["客戶/需求端待補: 需由年報、法說或公開資料驗證"] ) ?? [];
                    const focusText = role.tech_focus?.length ? role.tech_focus.join('\\n\\n') : `題材技術重心\n- ${role.topicName}：${role.role || relInfo.label}\n- 觀察 ${data.name} 在${role.group}的產品規格、量產進度與客戶導入。`;
                    const topicAnalysis = {
                      ai_summary: canonicalRole?.roleSummary || dailyCanonicalRole?.roleSummary || roleKnowledge?.summary || analysisText,
                      market_position: canonicalRoleLabel || roleKnowledge?.marketPosition || relInfo.label,
                      market_position_detail: canonicalRole?.roleSummary || dailyCanonicalRole?.roleSummary || roleKnowledge?.role || `${data.name}為${role.topicName}題材之${role.group}參與者，在供應鏈中扮演${role.role || relInfo.label}角色。`,
                      focus: focusText,
                      products: topicProducts,
                      customers: topicCustomers,
                      swot: fallbackSwot,
                    };
                    const dailyIndustry = resolvedDailyAnalysis?.industry;
                    const primaryTopicId = knowledge?.topicRoles[0]?.topicId;
                    const dailyIndustryApplies = Boolean(dailyIndustry && primaryTopicId === role.topic);
                    const integratedDailyNote = dailyIndustryApplies && dailyIndustry
                      ? ` 收盤後資料日 ${resolvedDailyAnalysis?.sourceUpdatedAt ?? "未知"} 的題材檢查結果為「${dailyIndustry.label}」${typeof dailyIndustry.score === "number" ? `，產業分數 ${dailyIndustry.score}/100` : ""}，後續會用下方觀察重點輔助驗證這個題材角色是否反映到營收、籌碼與價格。`
                      : "";
                    const sourceChips = [
                      ...(canonicalRole?.evidence.map((item) => `${item.publisher}：${item.title}`) ?? []),
                      ...canonicalSwotEvidence,
                      ...(knowledge?.dataSources ?? []),
                      ...(knowledge?.swot.sources ?? []),
                    ];
                    const matchedProductKnowledge = topicProducts
                      .map((product) => findProductKnowledgeItem(product, resolvedProductKnowledge, role.topic))
                      .filter((item): item is NonNullable<typeof item> => Boolean(item));
                    const productNarrativeRows = topicAnalysis.products.map((product) => {
                      const knowledgeItem = findProductKnowledgeItem(product, resolvedProductKnowledge, role.topic);
                      return knowledgeItem
                        ? productKnowledgeToNarrative(knowledgeItem, role.topic)
                        : describeProduct(product, { companyName: data.name, topicName: role.topicName, group: role.group });
                    });
                    const hasCanonicalSwot = Boolean(resolvedCompanySwot && Object.values(canonicalSwotItemsByKey).some((items) => items.length > 0));
                    const isFallbackSwotObservation = !hasCanonicalSwot;
                    const swotBadgeLabel = resolvedCompanySwot
                      ? `V2 evidence-backed · ${resolvedCompanySwot.updatedAt}`
                      : dailyCanonicalSwot
                        ? `V2 daily canonical · ${resolvedDailyAnalysis?.sourceUpdatedAt ?? resolvedDailyAnalysis?.generatedAt.slice(0, 10) ?? "未知日期"}`
                        : undefined;
                    const evidenceCoverageCards = [
                      {
                        label: "產品知識",
                        value: `${matchedProductKnowledge.length}/${topicProducts.length}`,
                        note: matchedProductKnowledge.length > 0 ? "有 evidence/citation/lastVerified" : "尚未 evidence-backed，只做觀察，不升級成推薦",
                        tone: matchedProductKnowledge.length > 0 ? "text-emerald-200" : "text-amber-200",
                      },
                      {
                        label: "題材角色",
                        value: canonicalRole ? `${canonicalRole.confidence}` : dailyCanonicalRole ? `${dailyCanonicalRole.confidence}` : "insufficient",
                        note: canonicalRole ? `${canonicalRole.status} · 驗證 ${canonicalRole.lastVerified ?? "未知"}` : "尚未 evidence-backed，只做觀察，不升級成推薦",
                        tone: canonicalRole ? "text-cyan-200" : "text-amber-200",
                      },
                      {
                        label: "SWOT 覆蓋",
                        value: hasCanonicalSwot ? `${Object.values(canonicalSwotItemsByKey).reduce((sum, items) => sum + items.length, 0)} items` : "insufficient",
                        note: hasCanonicalSwot ? `V2 evidence-backed · ${resolvedCompanySwot?.updatedAt}` : "Fallback SWOT observation · 尚未 evidence-backed，只做觀察，不升級成推薦",
                        tone: hasCanonicalSwot ? "text-emerald-200" : "text-amber-200",
                      },
                    ];

                    return (
                      <div className="space-y-6">
                        <CompanyIndustryRoleSummaryPanel
                          summary={topicAnalysis.ai_summary || analysisText}
                          integratedDailyNote={integratedDailyNote}
                          dailyIndustry={dailyIndustryApplies ? dailyIndustry : undefined}
                          evidenceCoverageCards={evidenceCoverageCards}
                          displayRoleBadge={displayRoleBadge}
                          displayRelInfo={displayRelInfo}
                          canonicalRoleLabel={canonicalRoleLabel}
                          v2Directness={canonicalRole?.directness ?? dailyCanonicalRole?.directness}
                          v2Confidence={canonicalRole?.confidence ?? dailyCanonicalRole?.confidence}
                          topicName={role.topicName}
                          category={cat}
                        />

                        <CompanyIndustryMarketPositionPanel
                          marketPosition={stripLeadingStatusIcon(topicAnalysis?.market_position) || marketPos.label}
                          detail={topicAnalysis?.market_position_detail || `${data.name}為${role.topicName}產業之關鍵參與者，在供應鏈中扮演${relInfo.label}角色。`}
                        />

                        {topicAnalysis?.focus ? (
                          <CompanyIndustryTechnologyFocusPanel
                            focus={topicAnalysis.focus}
                            dailyIndustrySignals={dailyIndustryApplies && dailyIndustry ? dailyIndustry.signals : []}
                            dailyIndustryRisks={dailyIndustryApplies && dailyIndustry ? dailyIndustry.risks : []}
                            dailyIndustryWatch={dailyIndustryApplies && dailyIndustry ? dailyIndustry.watch : []}
                          />
                        ) : (
                          <PlaceholderSection title="技術重心" icon="🔬" />
                        )}

                        {/* 主要產品 */}
                        {topicAnalysis?.products && topicAnalysis.products.length > 0 ? (
                          <CompanyIndustryProductsPanel products={productNarrativeRows} />
                        ) : (
                          <PlaceholderSection title="主要產品" icon="📦" />
                        )}

                        {/* 主要客戶 */}
                        {topicAnalysis?.customers && topicAnalysis.customers.length > 0 ? (
                          <CompanyIndustryCustomersPanel customers={topicAnalysis.customers} />
                        ) : (
                          <PlaceholderSection title="主要客戶" icon="👥" />
                        )}

                        <CompanyIndustrySwotPanel
                          swot={topicAnalysis.swot}
                          canonicalSwotItemsByKey={canonicalSwotItemsByKey}
                          hasCanonicalSwot={hasCanonicalSwot}
                          isFallbackSwotObservation={isFallbackSwotObservation}
                          swotBadgeLabel={swotBadgeLabel}
                        />

                        <CompanyIndustrySupplyChainRolePanel
                          group={role.group}
                          role={role.role}
                          displayRoleBadge={displayRoleBadge}
                          displayRelInfo={displayRelInfo}
                          roleLabel={canonicalRoleLabel}
                          roleSummary={canonicalRole?.roleSummary ?? dailyCanonicalRole?.roleSummary ?? role.role}
                          v2SupplyChainStage={canonicalRole?.supplyChainStage}
                          v2RoleType={canonicalRole?.roleType}
                          roleRisks={canonicalRole?.risks ?? []}
                          sourceChips={sourceChips}
                        />
                      </div>
                    );
              })()}
            </CompanyIndustryTabShell>
          )}

          {/* ─── 籌碼分析 Tab ─── */}
          {detailTab === "chips" && (
            <CompanyChipsTabShell data={data} dailyAnalysis={resolvedDailyAnalysis}>
              {/* ─── 三大法人歷史趨勢（圖+表） ─── */}
              {data.institutional_history && data.institutional_history.length > 0 && (() => {
                const hist = data.institutional_history;
                const recent30 = hist.slice(-30);
                const last10 = hist.slice(-10);
                const fmtShares = (s: number) => {
                  const 張 = Math.abs(s) / 1000;
                  const sign = s > 0 ? "+" : s < 0 ? "-" : "";
                  if (張 >= 10000) return `${sign}${(張 / 10000).toFixed(1).replace(/\.0$/, "")}萬`;
                  if (張 >= 1000) return `${sign}${(張 / 1000).toFixed(1)}千`;
                  if (張 >= 1) return `${sign}${張.toFixed(1).replace(/\.0$/, "")}`;
                  return `${s}`;
                };
                const fmtColor = (n: number) => n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-[var(--color-text-tertiary)]";
                const institutionalChartData = recent30.map(d => ({
                  date: d.date.slice(5),
                  foreign: d.foreign_net / 1000,
                  trust: d.investment_trust_net / 1000,
                  dealer: d.dealer_net / 1000,
                  total: d.total_net / 1000,
                }));
                const institutionalRows = last10.map((d, i) => ({
                  date: d.date.slice(5),
                  foreignText: fmtShares(d.foreign_net),
                  foreignClassName: fmtColor(d.foreign_net),
                  trustText: fmtShares(d.investment_trust_net),
                  trustClassName: fmtColor(d.investment_trust_net),
                  dealerText: fmtShares(d.dealer_net),
                  dealerClassName: fmtColor(d.dealer_net),
                  totalText: fmtShares(d.total_net),
                  totalClassName: fmtColor(d.total_net),
                  isStriped: i % 2 === 1,
                }));
                return (
                  <CompanyInstitutionalTrendPanel
                    chartData={institutionalChartData}
                    rows={institutionalRows}
                    formatShares={fmtShares}
                  />
                );
              })()}

              {/* ─── 融資融券（圖+表+券資比） ─── */}
              {data.margin_history && data.margin_history.length > 0 && (() => {
                const allMargin = data.margin_history;
                const recent30 = allMargin.slice(-30);
                const last10 = allMargin.slice(-10);
                const chartData = recent30.map(d => ({
                  date: d.date.slice(5),
                  shortMarginRatio: d.margin_balance > 0 ? Number(((d.short_balance / d.margin_balance) * 100).toFixed(2)) : null,
                  marginBuy: d.margin_buy,
                  marginSell: d.margin_sell,
                }));
                const latest = allMargin[allMargin.length - 1];
                const ratio = latest && latest.margin_balance > 0 ? `${((latest.short_balance / latest.margin_balance) * 100).toFixed(2)}%` : "-";
                return (
                  <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-white">💰 融資融券</h4>
                      {latest && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                          券資比：<span className="font-bold">{ratio}</span>
                        </span>
                      )}
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={6} />
                          <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 'auto']} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <Tooltip {...darkTooltipProps} formatter={(v: unknown, name: unknown) => {
                            const labels: Record<string,string> = { shortMarginRatio: "券資比", marginBuy: "融資買", marginSell: "融資賣" };
                            const value = Number(v);
                            return [String(name) === "shortMarginRatio" ? `${value.toFixed(2)}%` : value.toLocaleString(), labels[String(name)] || String(name)];
                          }} />
                          <Legend formatter={(v: string) => {
                            const labels: Record<string,string> = { shortMarginRatio: "券資比", marginBuy: "融資買", marginSell: "融資賣" };
                            return labels[v] || v;
                          }} />
                          <Line type="monotone" dataKey="shortMarginRatio" yAxisId="left" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 2 }} name="券資比" connectNulls />
                          <Bar dataKey="marginBuy" yAxisId="right" fill="rgba(34,197,94,0.45)" name="融資買" />
                          <Bar dataKey="marginSell" yAxisId="right" fill="rgba(239,68,68,0.45)" name="融資賣" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {/* 融資融券明細表 */}
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
                          {last10.map((d, i) => {
                            const r = d.margin_balance > 0 ? `${((d.short_balance / d.margin_balance) * 100).toFixed(2)}%` : "-";
                            return (
                              <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                                <td className="px-2 py-1 text-[var(--color-text-secondary)]">{d.date.slice(5)}</td>
                                <td className="px-2 py-1 text-right text-indigo-400 font-medium">{d.margin_balance.toLocaleString()}</td>
                                <td className="px-2 py-1 text-right text-pink-400 font-medium">{d.short_balance.toLocaleString()}</td>
                                <td className="px-2 py-1 text-right font-bold text-white">{r}</td>
                                <td className="px-2 py-1 text-right text-emerald-400">{d.margin_buy.toLocaleString()}</td>
                                <td className="px-2 py-1 text-right text-rose-400">{d.margin_sell.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* ─── 本益比/淨值比趨勢（近1個月） ─── */}
              {data.per_history && data.per_history.length > 0 && (() => {
                const recentPer = data.per_history.slice(-30);
                const chartData = recentPer.map(d => ({
                  date: d.date.slice(5),
                  pe: d.pe,
                  pb: d.pb,
                  yield: d.dividend_yield,
                }));
                return (
                  <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                    <h4 className="text-sm font-bold text-white mb-4">📐 本益比 / 淨值比 / 殖利率趨勢</h4>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={6} />
                          <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 10 }} domain={[0, 'auto']} />
                          <Tooltip {...darkTooltipProps} />
                          <Legend formatter={(v: string) => {
                            const labels: Record<string,string> = { pe: "本益比", pb: "淨值比", yield: "殖利率%" };
                            return labels[v] || v;
                          }} />
                          <Line type="monotone" dataKey="pe" yAxisId="left" stroke="#818cf8" strokeWidth={2} dot={false} name="本益比" />
                          <Line type="monotone" dataKey="pb" yAxisId="left" stroke="#f472b6" strokeWidth={2} dot={false} name="淨值比" />
                          <Line type="monotone" dataKey="yield" yAxisId="right" stroke="#22ab94" strokeWidth={2} dot={false} name="殖利率%" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    {/* PER/PBR/Yield detail table */}
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
                          {data.per_history!.slice(-10).reverse().map((d, i) => (
                            <tr key={i} className={cn("border-t border-white/[0.03] hover:bg-white/[0.02]", i % 2 === 1 ? "bg-white/[0.01]" : "")}>
                              <td className="px-3 py-1.5 text-[var(--color-text-secondary)]">{d.date.slice(5)}</td>
                              <td className="px-3 py-1.5 text-right text-white font-medium">{d.pe?.toFixed(2) ?? "-"}</td>
                              <td className="px-3 py-1.5 text-right text-white font-medium">{d.pb?.toFixed(2) ?? "-"}</td>
                              <td className="px-3 py-1.5 text-right text-white font-medium">{d.dividend_yield?.toFixed(2) ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </CompanyChipsTabShell>
          )}

          {/* ─── 技術分析 Tab ─── */}
          {detailTab === "tech" && (
            <div className="space-y-6">
              {/* Price Chart — K-line with lightweight-charts, fallback to monthly area chart */}
              <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white">📈 技術走勢圖</h4>
                  <a
                    href={`https://www.tradingview.com/symbols/TWSE-${data.code}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
                  >
                    在 TradingView 開啟完整圖表 ↗
                  </a>
                </div>
                {(() => {
                  const dp = trends?.daily_prices;
                  if (dp && dp.length >= 5) {
                    const sorted = [...dp].sort((a, b) => a.date.localeCompare(b.date));
                    
                    // Compute scope date boundaries
                    const today = new Date(sorted[sorted.length - 1].date);
                    const scopeDays: Record<string, number> = { "1M": 30, "3M": 90, "6M": 180, "YTD": 0, "1Y": 365, "5Y": 1825 };
                    let filtered = sorted;
                    if (techScope !== "5Y") {
                      const cutoff = new Date(today);
                      if (techScope === "YTD") {
                        cutoff.setMonth(0); cutoff.setDate(1);
                      } else {
                        cutoff.setDate(cutoff.getDate() - (scopeDays[techScope] || 365));
                      }
                      const cutoffStr = cutoff.toISOString().slice(0, 10);
                      filtered = sorted.filter(d => d.date >= cutoffStr);
                    }
                    if (filtered.length < 5) filtered = sorted.slice(-Math.min(sorted.length, 60));
                    
                    // Compute MA lines on full data then filter
                    const computeMA = (period: number, data: typeof sorted) =>
                      data.slice(period - 1).map((d, i) => {
                        const window = data.slice(i, i + period);
                        const avg = window.reduce((s, x) => s + x.close, 0) / period;
                        return { time: d.date, value: Math.round(avg * 100) / 100 };
                      });
                    const ma5Full = computeMA(5, sorted);
                    const ma10Full = sorted.length >= 10 ? computeMA(10, sorted) : [];
                    const ma20Full = sorted.length >= 20 ? computeMA(20, sorted) : [];
                    const ma60Full = sorted.length >= 60 ? computeMA(60, sorted) : [];
                    
                    const filteredDates = new Set(filtered.map(d => d.date));
                    const ma5 = maLines.ma5 ? ma5Full.filter(m => filteredDates.has(m.time)) : [];
                    const ma10 = maLines.ma10 ? ma10Full.filter(m => filteredDates.has(m.time)) : [];
                    const ma20 = maLines.ma20 ? ma20Full.filter(m => filteredDates.has(m.time)) : [];
                    const ma60 = maLines.ma60 ? ma60Full.filter(m => filteredDates.has(m.time)) : [];

                    const candleData = filtered.map(d => ({
                      time: d.date,
                      open: d.open,
                      high: d.high,
                      low: d.low,
                      close: d.close,
                    }));
                    const volumeData = filtered.map(d => ({
                      time: d.date,
                      value: d.volume,
                      color: d.close >= d.open ? "rgba(34,171,148,0.4)" : "rgba(247,82,95,0.4)",
                    }));

                    const scopeOptions: { id: typeof techScope; label: string }[] = [
                      { id: "1M", label: "1M" },
                      { id: "3M", label: "3M" },
                      { id: "6M", label: "6M" },
                      { id: "YTD", label: "YTD" },
                      { id: "1Y", label: "1Y" },
                      { id: "5Y", label: "5Y" },
                    ];
                    const maOptions: { key: keyof typeof maLines; label: string; color: string }[] = [
                      { key: "ma5", label: "MA5", color: "#818cf8" },
                      { key: "ma10", label: "MA10", color: "#f472b6" },
                      { key: "ma20", label: "MA20", color: "#fbbf24" },
                      { key: "ma60", label: "MA60", color: "#34d399" },
                    ];

                    return (
                      <div>
                        {/* Scope buttons */}
                        <div className="flex items-center gap-1 mb-3">
                          {scopeOptions.map(opt => (
                            <button key={opt.id}
                              className={cn(
                                "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                                techScope === opt.id
                                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                                  : "text-gray-400 hover:text-[var(--color-text-secondary)] border border-transparent"
                              )}
                              onClick={() => setTechScope(opt.id)}
                            >{opt.label}</button>
                          ))}
                        </div>
                        {/* MA toggle buttons */}
                        <div className="flex items-center gap-3 mb-3 text-xs">
                          <span className="text-[#22ab94]">● 漲</span>
                          <span className="text-[#f7525f]">● 跌</span>
                          {maOptions.map(opt => (
                            <button key={opt.key}
                              className={cn(
                                "flex items-center gap-1 px-1.5 py-0.5 rounded transition-all",
                                maLines[opt.key] ? "opacity-100" : "opacity-30 line-through"
                              )}
                              onClick={() => setMaLines(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                            >
                              <span style={{ color: opt.color }}>━</span>
                              <span style={{ color: maLines[opt.key] ? opt.color : '#9ca3af' }}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                        <div className="mb-3 rounded-xl border border-cyan-500/20 bg-cyan-500/8 px-3 py-2 text-xs text-cyan-100/85">
                          K 線最新日期：<span className="font-semibold text-white">{sorted[sorted.length - 1].date}</span> · Source: FinMind TaiwanStockPrice checked-in OHLCV；只更新官方/FinMind 日 K，不用 AI 補 K 線。
                        </div>
                        <TradingViewChart
                          candleData={candleData}
                          volumeData={volumeData}
                          ma5Data={ma5}
                          ma10Data={ma10}
                          ma20Data={ma20}
                          ma60Data={ma60}
                          height={420}
                        />
                      </div>
                    );
                  } else if (trends?.monthly_price && trends.monthly_price.length > 1) {
                    return (
                      <>
                        <PriceAreaChart data={trends.monthly_price} />
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-3 text-center">💡 每日 K 線資料累積中（需 ≥5 個交易日），目前顯示月均價趨勢圖</p>
                      </>
                    );
                  } else {
                    return (
                      <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="text-4xl mb-3">📈</div>
                        <p className="text-sm text-[var(--color-text-tertiary)]">股價走勢資料累積中</p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">需要更多歷史資料才能生成走勢圖</p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Technical Indicators */}
              {(() => {
                const technical = computeTechnicalSummary(trends?.daily_prices);
                const fmtNum = (value: number | undefined, digits = 2) => value == null || value === 0 ? "-" : value.toFixed(digits);
                const indicatorCards = [
                  { label: "趨勢判讀", value: technical.trendLabel, sub: technical.aboveMa20 === null ? "MA20 資料不足" : technical.aboveMa20 ? "站上 MA20" : "跌破 MA20", color: technical.aboveMa20 ? "text-rose-300" : technical.aboveMa20 === false ? "text-emerald-300" : "text-white" },
                  { label: "最新收盤", value: fmtNum(technical.latestClose), sub: `${technical.change >= 0 ? "+" : ""}${technical.change.toFixed(2)} / ${technical.changePercent.toFixed(2)}%`, color: technical.change >= 0 ? "text-rose-300" : "text-emerald-300" },
                  { label: "MA5 / MA10", value: `${fmtNum(technical.ma5)} / ${fmtNum(technical.ma10)}`, sub: "短期均線", color: "text-indigo-300" },
                  { label: "MA20 / MA60", value: `${fmtNum(technical.ma20)} / ${fmtNum(technical.ma60)}`, sub: "中期均線", color: "text-amber-300" },
                  { label: "成交量", value: technical.volume ? `${(technical.volume / 1000).toFixed(0)}張` : "-", sub: `20日均量 ${(technical.avgVolume20 / 1000).toFixed(0)}張`, color: "text-cyan-300" },
                  { label: "量比", value: technical.volumeRatio20 ? technical.volumeRatio20.toFixed(2) : "-", sub: "相對 20 日均量", color: technical.volumeRatio20 >= 1.5 ? "text-rose-300" : "text-white" },
                  { label: "20日高 / 低", value: `${fmtNum(technical.high20)} / ${fmtNum(technical.low20)}`, sub: "區間位置", color: "text-purple-300" },
                  { label: "估值", value: `PE ${data.valuation.pe || "-"}`, sub: `PB ${data.valuation.pb || "-"} / 殖利率 ${data.valuation.dividendYield || "-"}%`, color: "text-white" },
                ];
                return (
                  <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)]">
                    <h4 className="text-sm font-bold text-white mb-4">📈 技術指標數值</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {indicatorCards.map((item) => (
                        <div key={item.label} className="bg-white/[0.04] rounded-xl p-4">
                          <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{item.label}</p>
                          <p className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</p>
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{item.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {resolvedDailyAnalysis && (
                <BatchAnalysisPanel
                  title="📊 技術分析判讀"
                  badge={resolvedDailyAnalysis.technical.label}
                  score={resolvedDailyAnalysis.technical.score}
                  summary={resolvedDailyAnalysis.technical.summary}
                  signals={resolvedDailyAnalysis.technical.signals}
                  risks={resolvedDailyAnalysis.technical.risks}
                  watch={resolvedDailyAnalysis.technical.watch}
                  generatedAt={resolvedDailyAnalysis.generatedAt}
                  description={`依日 K、均線與成交量規則判讀 · 價格資料日 ${latestKLineDate ?? resolvedDailyAnalysis.marketDataDate ?? resolvedDailyAnalysis.sourceUpdatedAt ?? "未知"}`}
                />
              )}

              {resolvedDailyAnalysis && (
                <TechnicalNextSessionPanel nextSession={resolvedDailyAnalysis.nextSession} />
              )}

            </div>
          )}

          {/* ─── 相關新聞 Tab ─── */}
          {detailTab === "news" && (
            <NewsTabContent code={data.code} name={data.name} majorNews={data.major_news} />
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
          </TabErrorBoundary>
        </CompanyDetailTabs>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
    MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function Home() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("topics");
  const [search, setSearch] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedTopicSlug, setSelectedTopicSlug] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"count" | "name">("count");
  const [detailViewMode, setDetailViewMode] = useState<"structure" | "knowledge">("structure");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string | null>(null);
  const [companyViewMode, setCompanyViewMode] = useState<CompanyViewMode>("list");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState(false);

  // Handle URL query params: ?company=2330 or ?topic=semiconductor
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const companyParam = searchParams.get("company");
      const topicParam = searchParams.get("topic");
      if (companyParam) {
        setActiveTab("companies");
        setSelectedCompanyCode(companyParam);
        setCompanyViewMode("detail");
      }
      if (topicParam) {
        setActiveTab("topics");
        setSelectedTopicSlug(topicParam);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);
  const searchRef = useRef<HTMLDivElement>(null);
  const companyListScrollRef = useRef<number>(0);

  const topics: TopicData[] = topicMapData.topics as TopicData[];
  const companies: CompanyData[] = topicMapData.companies as CompanyData[];
  const stats = topicMapData.stats;

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
    const candidateTopics = topics.filter((t) => comp.topics.includes(t.slug));
    const roles: CompanyRole[] = [];
    for (const t of candidateTopics) {
      for (const g of t.groups) {
        for (const c of g.companies) {
          if (c.code === comp.code) { roles.push({ topic: t.slug, topicName: t.name, topicDescription: t.description || "", group: g.name, role: c.role, relevance: c.relevance, analysis: c.analysis, products: c.products, customers: c.customers, tech_focus: c.tech_focus, swot: c.swot }); }
        }
      }
    }
    const filteredRoles = filterCompanyRoles(roles);
    const relatedTopics = candidateTopics.filter((t) => filteredRoles.some((role) => role.topic === t.slug));
    return { ...comp, topic_count: filteredRoles.length, topics: filteredRoles.map((role) => role.topic), relatedTopics, roles: filteredRoles };
  }, [selectedCompanyCode, companies, topics]);

  // Fetch financial data when a company is selected
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedCompanyCode) {
        setFinancialData(null);
        setFinancialError(false);
        return;
      }
      setFinancialLoading(true);
      setFinancialError(false);
      fetch(`/data/financials/${selectedCompanyCode}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((rawData: FinancialData) => {
          setFinancialData(normalizeFinancialData(rawData) as unknown as FinancialData);
          setFinancialLoading(false);
        })
        .catch(() => {
          setFinancialData(null);
          setFinancialError(true);
          setFinancialLoading(false);
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedCompanyCode]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowAutocomplete(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToTopic = (slug: string) => { setSelectedTopicSlug(slug); setActiveTab("map"); setDetailViewMode("structure"); setExpandedGroups(new Set()); };
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
    <div className="taste-shell min-h-screen text-[var(--color-text-primary)] flex flex-col">
      {/* ─── Background gradient decoration ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.06] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-sky-500/[0.06] blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-emerald-400/[0.025] blur-3xl" />
      </div>

      {/* ─── Top Nav ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-[var(--color-border)]" style={{ background: "var(--color-bg)cc" }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            <div className="flex items-center gap-3.5 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/15">🏭</div>
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
            {/* External links */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/topics" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-500/10">🧭 Evidence 題材</Link>
              <Link href="/companies" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-500/10">🏢 公司資料庫</Link>
              <Link href="/daily-report" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-500/10">📊 每日報告</Link>
              <a href="https://allen-hsu1116.github.io/stock-knowledge-site/" target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-white/[0.04]">📚 知識庫</a>
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
                      className={cn("rounded-xl", detailViewMode === "structure" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/30" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]")}
                      onClick={() => setDetailViewMode("structure")}
                    >🔗 供應鏈結構</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("rounded-xl", detailViewMode === "knowledge" ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-hover)] border-indigo-500/30" : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border-[var(--color-border)] hover:text-[var(--color-text-secondary)]")}
                      onClick={() => setDetailViewMode("knowledge")}
                    >📚 知識庫詳解</Button>
            
                  </div>

                  {/* Knowledge View - links to knowledge site */}
                  {detailViewMode === "knowledge" && (
                    <div className="space-y-6">
                      <Card className="bg-[var(--color-surface)] border-[var(--color-border)] rounded-2xl overflow-hidden">
                        <CardContent className="p-8">
                          <div className="text-center space-y-4">
                            <div className="text-4xl">📚</div>
                            <h3 className="text-lg font-bold text-white">產業知識庫</h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-lg mx-auto">
                              前往知識庫查看 <strong className="text-white">{selectedTopicData.name}</strong> 的詳細產業分析、供應鏈解讀、公司深度研究等內容。
                            </p>
                            <a
                              href={`https://allen-hsu1116.github.io/stock-knowledge-site/產業地圖/${encodeURIComponent(selectedTopicData.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-medium transition-colors"
                            >
                              前往知識庫 →
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                      {/* Embedded knowledge site */}
                      <div className="rounded-2xl overflow-hidden border border-[var(--color-border)]" style={{ height: "600px" }}>
                        <iframe
                          src={`https://allen-hsu1116.github.io/stock-knowledge-site/產業地圖/${encodeURIComponent(selectedTopicData.name)}`}
                          className="w-full h-full border-0"
                          title={`${selectedTopicData.name} - 知識庫`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Structure View - aistockmap style */}
                  {detailViewMode === "structure" && (
                    <div className="space-y-5">
                      {(() => {
                        const namedGroups = mapGroupNames(selectedTopicData.groups);
                        const upstreamGroups = namedGroups.filter(g => (g.level || classifyGroupLevel(g)) === "upstream");
                        const midstreamGroups = namedGroups.filter(g => (g.level || classifyGroupLevel(g)) === "midstream");
                        const downstreamGroups = namedGroups.filter(g => (g.level || classifyGroupLevel(g)) === "downstream");

                        const toggleGroup = (key: string) => {
                          setExpandedGroups(prev => {
                            const next = new Set(prev);
                            if (next.has(key)) next.delete(key); else next.add(key);
                            return next;
                          });
                        };

                        const renderLevelSection = (levelKey: "upstream" | "midstream" | "downstream", label: string, labelEn: string, icon: string, color: string, bgColor: string, borderColor: string, groups: typeof namedGroups) => {
                          if (groups.length === 0) return null;
                          const total = groups.reduce((s, g) => s + g.companies.length, 0);
                          const sectionKey = levelKey;
                          const isExpanded = expandedGroups.has(sectionKey);

                          return (
                            <div className={`${bgColor} border ${borderColor} rounded-2xl overflow-hidden`}>
                              <button
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                onClick={() => toggleGroup(sectionKey)}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{icon}</span>
                                  <div className="text-left">
                                    <div className="flex items-center gap-2">
                                      <h3 className={`font-bold ${color}`}>{label}</h3>
                                      <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">{labelEn}</span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{groups.length} 個群組 · {total} 家公司</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={`${color} bg-white/[0.04] border-0 text-xs`}>{total} 家</Badge>
                                  <svg className={cn("w-5 h-5 text-[var(--color-text-tertiary)] transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="border-t border-white/[0.04]">
                                  {groups.map((group, gi) => {
                                    const groupKey = `${levelKey}-${gi}`;
                                    const isGroupExpanded = expandedGroups.has(groupKey);
                                    return (
                                      <div key={gi} className={cn(gi > 0 && "border-t border-white/[0.04]")}>
                                        <button
                                          className="w-full px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                          onClick={() => toggleGroup(groupKey)}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <div className={`w-2 h-2 rounded-full ${color === "text-emerald-400" ? "bg-emerald-400" : color === "text-amber-400" ? "bg-amber-400" : "bg-blue-400"}`} />
                                            <span className="text-sm font-medium text-white">{group.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-[var(--color-text-tertiary)]">{group.companies.length} 家</span>
                                            <svg className={cn("w-4 h-4 text-[var(--color-text-tertiary)] transition-transform", isGroupExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </div>
                                        </button>
                                        {isGroupExpanded && (
                                          <div className="px-6 pb-4">
                                            <div className="flex flex-wrap gap-2.5">
                                              {group.companies.map((company) => {
                                                const relInfo = getRelevanceInfo(company.relevance);
                                                return (
                                                  <Button key={company.code} variant="outline" className="bg-white/[0.03] border-white/[0.06] rounded-xl px-4 h-auto py-2.5 hover:border-indigo-500/30 hover:bg-white/[0.06] text-white" onClick={() => goToCompany(company.code)}>
                                                    <div className="text-center">
                                                      <div className="text-xs font-bold text-white">{company.code}</div>
                                                      <div className="text-[11px] text-[var(--color-text-secondary)]">{company.name}</div>
                                                    </div>
                                                    <span className={cn(relInfo.className, "text-[10px] px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap ml-1.5")}>{relInfo.label}</span>
                                                  </Button>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        };

                        return (
                          <>
                            {renderLevelSection("upstream", "上游原料與設備", "UPSTREAM", "⬆️", "text-emerald-400", "bg-emerald-500/[0.04]", "border-emerald-500/20", upstreamGroups)}
                            {renderLevelSection("midstream", "中游製造與組件", "MIDSTREAM", "⏺️", "text-amber-400", "bg-amber-500/[0.04]", "border-amber-500/20", midstreamGroups)}
                            {renderLevelSection("downstream", "下游系統與應用", "DOWNSTREAM", "⬇️", "text-blue-400", "bg-blue-500/[0.04]", "border-blue-500/20", downstreamGroups)}
                          </>
                        );
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--color-text-tertiary)]">{selectedCompanyData.code}</span>
                      <a
                        href={`https://allen-hsu1116.github.io/stock-knowledge-site/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >📖 知識庫</a>
                    </div>
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
                <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white h-11 rounded-xl" onClick={() => { setShowCompanyModal(false); setActiveTab("companies"); setSelectedCompanyCode(selectedCompanyData.code); setCompanyViewMode("detail"); }}>查看完整資料</Button>
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