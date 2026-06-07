"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { gateDailyReportPicks } from "@/lib/dailyReportGating";
import { buildMajorNewsFilterOptions, filterEventFocusItems, type MajorNewsFilters } from "@/lib/majorNewsFilters";
import canonicalTopicsData from "../../../public/data/canonical-topics.json";

/* ─── Types ─── */
interface TechnicalAnalysis {
  summary: string;
  support: number;
  resistance: number;
  trend: string;
}

interface Fundamentals {
  revenue_mom: string;
  revenue_yoy: string;
  pe: number;
  market_cap: string;
}

interface ChipAnalysis {
  foreign_net_buy: string;
  summary: string;
}

interface Recommendation {
  action: string;
  entry_price: number;
  stop_loss: number;
  take_profit: string;
  position_size: string;
  reasoning: string;
}

interface StockPick {
  rank: number;
  code: string;
  name: string;
  score: number;
  industry: string;
  price: number | null;
  change_pct: number | null;
  technicals: TechnicalAnalysis;
  fundamentals: Fundamentals;
  chip_analysis: ChipAnalysis;
  recommendation: Recommendation;
}

interface HotSector {
  name: string;
  change_pct: string;
  leaders: string[];
}

interface KnowledgeApplied {
  topic: string;
  key_insights: string[];
}

interface MarketOverview {
  index: string;
  close: number | null;
  change: number | null;
  change_pct: number | null;
  advancing: number | null;
  declining: number | null;
}

interface DailyIndustryAnalysis {
  label: string;
  score?: number;
  knowledgeBasis?: "canonical_verified" | "canonical_pending" | "insufficient";
  confidence?: string;
  provenanceLabel?: string;
  verificationNote?: string;
  roleDetail?: {
    topicName: string;
    roleLabel: string;
    roleSummary: string;
    supplyChainStage?: string;
    roleType?: string;
    directness?: string;
    source: "canonical" | "insufficient";
  };
  productNarratives?: Array<{
    name: string;
    description: string;
    whyItMatters?: string;
    topicFit?: string;
    businessImpact?: string;
    confidence?: string;
    lastVerified?: string;
  }>;
  swotSnapshot?: {
    strengths: string[];
    opportunities: string[];
    risks: string[];
  };
  scoringFactors?: string[];
  summary: string;
  signals: string[];
  risks: string[];
  watch: string[];
}

interface CompanyDailyAnalysis {
  code: string;
  sourceUpdatedAt?: string;
  generatedAt: string;
  analysisQuality?: {
    grade: "A" | "B" | "C" | "D" | "F";
    label: string;
    upgradePriority: "high" | "medium" | "low";
    missingKnowledge: Array<"product_knowledge" | "verified_topic_role" | "complete_swot" | "daily_analysis">;
    blockingReasons: string[];
  };
  industry?: DailyIndustryAnalysis;
  canonicalKnowledge?: {
    topicRoles?: Array<{
      topicId?: string;
      canonicalTopicId?: string;
      topicName?: string;
      canonicalTopicName?: string;
      directnessLabel?: string;
      confidence?: string;
    }>;
  };
}

interface DailyReportFreshnessSource {
  module: string;
  source: string;
  latestDate: string;
  status: "verified" | "partial" | "empty";
  scope: string;
  warning?: string;
  emptyReason?: string;
}

interface DailyReportFreshness {
  generatedAt: string;
  marketDataDate: string;
  eventDataDate: string;
  analysisGeneratedAt: string;
  sources: DailyReportFreshnessSource[];
}

interface DailyReport {
  date: string;
  weekday: string;
  freshness?: DailyReportFreshness;
  knowledge_applied: KnowledgeApplied;
  market_overview: MarketOverview;
  picks: StockPick[];
  hot_sectors: HotSector[];
  risk_alerts: string[];
}

interface EventFocusItem {
  id: string;
  date: string;
  announcedAt: string;
  companyCode: string;
  companyName: string;
  officialSubject: string;
  clause?: string;
  derivedTopics: Array<{
    topicId: string;
    topicName: string;
    roleLabel?: string;
    confidence?: string;
    status?: string;
  }>;
  mappingMethod: "derived_from_company_topic_roles" | "unmapped_official_event";
  verificationNote: string;
  source: "TWSE OpenAPI t187ap04_L" | "local financials snapshot";
}

interface EventFocusSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  status: "verified" | "partial" | "empty";
  latestDate?: string;
  itemCount: number;
  items: EventFocusItem[];
  source: {
    name: string;
    url: string;
    scope: string;
    semantics: string;
  };
  emptyReason?: string;
}

type StrongStockTimeframe = "1d" | "5d" | "20d";

interface StrongStockRankingItem {
  rank: number;
  code: string;
  name: string;
  score: number;
  latestDate: string;
  close: number;
  returnPct: number;
  changePct1d: number;
  volumeRatio20: number;
  aboveMa20: boolean | null;
  high20Breakout: boolean;
  reason: string;
}

interface StrongStockRankingView {
  timeframe: StrongStockTimeframe;
  status: "verified" | "partial" | "empty";
  generatedAt: string;
  items: StrongStockRankingItem[];
  emptyReason?: string;
  source: {
    name: string;
    latestDate: string;
    scope: string;
    warning: string;
  };
}

interface StrongStockRankingArtifact {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    name: string;
    scope: string;
    semantics: string;
  };
  rankings: StrongStockRankingView[];
}

type LargeHolderTier = "1m_plus" | "400k_plus";
type LargeHolderWindow = "1w" | "4w";

interface LargeHolderRankingItem {
  rank: number;
  code: string;
  name: string;
  latestDate: string;
  baselineDate: string;
  tier: LargeHolderTier;
  tierLabel: string;
  latestPercent: number;
  baselinePercent: number;
  changePctPoint: number;
  latestPeople: number;
  baselinePeople: number;
  peopleChange: number;
  score: number;
  reason: string;
}

interface LargeHolderRankingView {
  tier: LargeHolderTier;
  window: LargeHolderWindow;
  status: "verified" | "partial" | "empty";
  generatedAt: string;
  items: LargeHolderRankingItem[];
  emptyReason?: string;
  source: {
    name: string;
    latestDate: string;
    scope: string;
    warning: string;
  };
}

interface LargeHolderRankingArtifact {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    name: string;
    scope: string;
    semantics: string;
    warning: string;
  };
  rankings: LargeHolderRankingView[];
}

interface MarketIndicatorItem {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  unit?: string;
  change?: number;
  changePercent?: number;
  secondaryValue?: number;
  secondaryLabel?: string;
  date: string;
  status: "verified";
  source: string;
  note: string;
}

interface MarketIndicatorStripArtifact {
  schemaVersion: 1;
  generatedAt: string;
  latestDate: string;
  status: "verified" | "partial" | "empty";
  source: {
    name: string;
    scope: string;
    warning: string;
  };
  indicators: MarketIndicatorItem[];
  unavailable: Array<{ id: string; label: string; reason: string }>;
  emptyReason?: string;
}

/* ─── Score Color ─── */
function getScoreColor(score: number): string {
  if (score >= 80) return "text-rose-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-emerald-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function getTrendBadge(trend: string): "default" | "secondary" | "destructive" | "outline" {
  if (trend.includes("多") || trend.includes("漲")) return "default";
  if (trend.includes("空") || trend.includes("跌")) return "destructive";
  return "secondary";
}

function getKnowledgeBasisClass(basis?: DailyIndustryAnalysis["knowledgeBasis"]): string {
  if (basis === "canonical_verified") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (basis === "canonical_pending") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function getKnowledgeBasisText(industry: DailyIndustryAnalysis): string {
  return industry.provenanceLabel ?? (industry.knowledgeBasis === "canonical_verified" ? "V2 已驗證" : industry.knowledgeBasis === "canonical_pending" ? "V2 待驗證" : "產業資料待補");
}

function getAnalysisQualityClass(grade?: NonNullable<CompanyDailyAnalysis["analysisQuality"]>["grade"]): string {
  if (grade === "A") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  if (grade === "B") return "border-cyan-400/40 bg-cyan-400/10 text-cyan-200";
  if (grade === "C") return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  if (grade === "D") return "border-orange-400/40 bg-orange-400/10 text-orange-200";
  return "border-red-400/40 bg-red-400/10 text-red-200";
}

function getUpgradePriorityText(priority: "high" | "medium" | "low"): string {
  return priority === "high" ? "高優先補資料" : priority === "medium" ? "中優先補資料" : "資料完整度佳";
}

function getMissingKnowledgeText(item: "product_knowledge" | "verified_topic_role" | "complete_swot" | "daily_analysis"): string {
  const labels = {
    product_knowledge: "缺產品知識",
    verified_topic_role: "缺已驗證題材角色",
    complete_swot: "缺完整 SWOT",
    daily_analysis: "缺 Daily Analysis",
  };
  return labels[item];
}

function getSourceStatusClass(status: DailyReportFreshnessSource["status"]): string {
  if (status === "verified") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "partial") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function getMarketChangeClass(value?: number): string {
  if (value == null) return "text-gray-300";
  return value >= 0 ? "text-rose-300" : "text-emerald-300";
}

function formatMarketChange(value?: number, suffix = ""): string {
  if (value == null) return "—";
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("zh-TW")}${suffix}`;
}

function topicClusterIds(topicId: string): string[] {
  const topics = (canonicalTopicsData as { topics?: Array<{ id: string; parentId?: string; childIds?: string[] }> }).topics ?? [];
  const topic = topics.find((item) => item.id === topicId);
  if (!topic) return [topicId];
  return Array.from(new Set([topic.id, ...(topic.childIds ?? []), ...topics.filter((item) => item.parentId === topic.id).map((item) => item.id)]));
}

function topicRoleMatches(role: { canonicalTopicId?: string; topicId?: string }, topicIds: Set<string>): boolean {
  return Boolean((role.canonicalTopicId && topicIds.has(role.canonicalTopicId)) || (role.topicId && topicIds.has(role.topicId)));
}

function analysisMatchesTopic(analysis: CompanyDailyAnalysis | undefined, topicId: string): boolean {
  if (!topicId) return true;
  const topicIds = new Set(topicClusterIds(topicId));
  return (analysis?.canonicalKnowledge?.topicRoles ?? []).some((role) => topicRoleMatches(role, topicIds));
}

function getTopicRoleBadge(analysis: CompanyDailyAnalysis | undefined, topicId: string): string | null {
  if (!topicId) return null;
  const topicIds = new Set(topicClusterIds(topicId));
  const role = (analysis?.canonicalKnowledge?.topicRoles ?? []).find((item) => topicRoleMatches(item, topicIds));
  if (!role) return null;
  const topicName = role.canonicalTopicName ?? role.topicName ?? topicId;
  return `${topicName}${role.directnessLabel ? ` · ${role.directnessLabel}` : ""}${role.confidence ? ` · ${role.confidence}` : ""}`;
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return "—";
  return timestamp.replace("T", " ").replace(/\.\d{3}Z$/, "Z");
}

async function fetchStaticJson<T>(path: string): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const candidates = [`/industry-map-site${normalizedPath}`, normalizedPath];

  for (const candidate of candidates) {
    const response = await fetch(candidate);
    if (response.ok) return await response.json() as T;
  }

  throw new Error(`Failed to load ${normalizedPath}`);
}

/* ─── Main Page ─── */
export default function DailyReportPage() {
  const searchParams = useSearchParams();
  const activeTopicId = searchParams.get("topic")?.trim() ?? "";
  const [report, setReport] = useState<DailyReport | null>(null);
  const [eventFocus, setEventFocus] = useState<EventFocusSnapshot | null>(null);
  const [marketIndicators, setMarketIndicators] = useState<MarketIndicatorStripArtifact | null>(null);
  const [strongStocks, setStrongStocks] = useState<StrongStockRankingArtifact | null>(null);
  const [largeHolders, setLargeHolders] = useState<LargeHolderRankingArtifact | null>(null);
  const [strongStockTimeframe, setStrongStockTimeframe] = useState<StrongStockTimeframe>("5d");
  const [largeHolderTier, setLargeHolderTier] = useState<LargeHolderTier>("1m_plus");
  const [largeHolderWindow, setLargeHolderWindow] = useState<LargeHolderWindow>("1w");
  const [eventFilters, setEventFilters] = useState<MajorNewsFilters>({});
  const [dailyAnalyses, setDailyAnalyses] = useState<Record<string, CompanyDailyAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const [data, eventData, marketIndicatorData, strongStockData, largeHolderData] = await Promise.all([
          fetchStaticJson<DailyReport>("/data/daily-report.json"),
          fetchStaticJson<EventFocusSnapshot>("/data/event-focus.json").catch(() => null),
          fetchStaticJson<MarketIndicatorStripArtifact>("/data/market-indicator-strip.json").catch(() => null),
          fetchStaticJson<StrongStockRankingArtifact>("/data/strong-stock-ranking.json").catch(() => null),
          fetchStaticJson<LargeHolderRankingArtifact>("/data/large-holder-ranking.json").catch(() => null),
        ]);
        setReport(data);
        setEventFocus(eventData);
        setMarketIndicators(marketIndicatorData);
        setStrongStocks(strongStockData);
        setLargeHolders(largeHolderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  useEffect(() => {
    if (!report?.picks?.length) return;
    const picks = report.picks;
    let cancelled = false;

    async function fetchPickAnalyses() {
      const entries = await Promise.all(
        picks.map(async (pick): Promise<[string, CompanyDailyAnalysis] | null> => {
          try {
            const analysis = await fetchStaticJson<CompanyDailyAnalysis>(`/data/analysis/${pick.code}.json`);
            return [pick.code, analysis];
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setDailyAnalyses(Object.fromEntries(entries.filter((entry): entry is [string, CompanyDailyAnalysis] => entry !== null)));
      }
    }

    fetchPickAnalyses();
    return () => {
      cancelled = true;
    };
  }, [report]);

  if (loading) {
    return (
      <div className="taste-shell min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-lg">載入選股報告中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="taste-shell min-h-screen flex items-center justify-center">
        <Card className="taste-card border-red-500/20 max-w-md">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">📊 報告載入失敗</h2>
            <p className="text-gray-400">{error || "尚無報告資料"}</p>
            <p className="text-gray-500 text-sm mt-4">
              每日選股報告會在交易日 08:20 自動產生。請稍後再試。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topicFilteredPicks = activeTopicId
    ? report.picks.filter((pick) => analysisMatchesTopic(dailyAnalyses[pick.code], activeTopicId))
    : report.picks;
  const gatedPicks = gateDailyReportPicks(topicFilteredPicks, dailyAnalyses);
  const eventFilterOptions = eventFocus ? buildMajorNewsFilterOptions(eventFocus.items) : { dates: [], companies: [], topics: [] };
  const effectiveEventFilters = activeTopicId ? { ...eventFilters, topicId: activeTopicId } : eventFilters;
  const visibleEventItems = eventFocus ? filterEventFocusItems(eventFocus.items, effectiveEventFilters) : [];
  const activeTopicName = activeTopicId ? eventFilterOptions.topics.find((topic) => topic.id === activeTopicId)?.name ?? activeTopicId : "";
  const selectedStrongStockRanking = strongStocks?.rankings.find((ranking) => ranking.timeframe === strongStockTimeframe) ?? strongStocks?.rankings[0];
  const selectedLargeHolderRanking = largeHolders?.rankings.find((ranking) => ranking.tier === largeHolderTier && ranking.window === largeHolderWindow) ?? largeHolders?.rankings[0];

  return (
    <div className="taste-shell min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm mb-2 inline-block">
            ← 返回產業地圖
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">
            📊 每日選股報告
          </h1>
          <p className="text-gray-400 mt-1">
            {report.date}（{report.weekday}）
          </p>
          {activeTopicId && (
            <div className="mt-4 rounded-2xl border border-indigo-400/25 bg-indigo-400/10 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-100">Topic-filtered Daily analysis：{activeTopicName}</p>
                  <p className="mt-1 text-xs leading-relaxed text-indigo-100/70">
                    只顯示 daily analysis 中 canonicalKnowledge.topicRoles 命中此題材的公司；重大訊息同時套用 topicId filter，官方主旨仍保留原文。
                  </p>
                </div>
                <Link href="/daily-report" className="w-fit rounded-lg border border-emerald-300/30 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-300/10">
                  清除題材篩選
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Market Overview */}
        {report.market_overview && report.market_overview.close && (
          <Card className="taste-card border-slate-700 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">📈 市場概況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-500 text-xs">{report.market_overview.index}</p>
                  <p className="text-2xl font-bold text-white">{report.market_overview.close?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">漲跌</p>
                  <p className={`text-xl font-bold ${(report.market_overview.change ?? 0) >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {report.market_overview.change !== null ? `${report.market_overview.change >= 0 ? "+" : ""}${report.market_overview.change?.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">漲跌幅</p>
                  <p className={`text-xl font-bold ${(report.market_overview.change_pct ?? 0) >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {report.market_overview.change_pct !== null ? `${report.market_overview.change_pct >= 0 ? "+" : ""}${report.market_overview.change_pct}%` : "—"}
                  </p>
                </div>
                {report.market_overview.advancing !== null && report.market_overview.declining !== null && (
                <div>
                  <p className="text-gray-500 text-xs">上漲/下跌</p>
                  <p className="text-lg font-bold text-white">
                    <span className="text-rose-400">{report.market_overview.advancing}</span>
                    {" / "}
                    <span className="text-emerald-400">{report.market_overview.declining}</span>
                  </p>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Knowledge Applied */}
        {report.knowledge_applied && (
          <Card className="taste-card border-indigo-500/20 mb-6">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-indigo-400 mb-2">
                📚 今日應用知識：{report.knowledge_applied.topic}
              </h3>
              <ul className="space-y-1">
                {report.knowledge_applied.key_insights.map((insight, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Stock Picks */}
        <div className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">🏆 今日推薦 Top {gatedPicks.topRecommendations.length}</h2>
              <p className="mt-1 text-sm text-gray-400">只有 Analysis Quality A/B/C 可進 Top recommendation；D/F 會降到下方觀察區。</p>
            </div>
            <Badge variant="outline" className="w-fit border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
              A/B/C gate enabled
            </Badge>
          </div>
          {gatedPicks.topRecommendations.length === 0 && (
            <Card className="border-amber-500/20 taste-card">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-200">今天沒有符合 A/B/C 品質門檻的 Top recommendation；請只參考下方觀察清單，等資料補齊後再提高信心。</p>
              </CardContent>
            </Card>
          )}
          {gatedPicks.topRecommendations.map(({ pick }) => {
            const dailyAnalysis = dailyAnalyses[pick.code];
            const dailyIndustry = dailyAnalysis?.industry;
            const analysisQuality = dailyAnalysis?.analysisQuality;
            const topicRoleBadge = getTopicRoleBadge(dailyAnalysis, activeTopicId);
            return (
            <Card key={pick.code} className={`taste-card border ${getScoreBg(pick.score)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-500">#{pick.rank}</span>
                    <div>
                      <Link href={`/?company=${pick.code}`} className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                        {pick.name}
                      </Link>
                      <span className="text-gray-500 ml-2 text-sm">({pick.code})</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{pick.industry}</Badge>
                    {topicRoleBadge && (
                      <Badge variant="outline" className="border-indigo-400/30 bg-indigo-400/10 text-indigo-200 text-xs">
                        {topicRoleBadge}
                      </Badge>
                    )}
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(pick.score)}`}>
                    {pick.score}分
                  </div>
                </div>
                {pick.price && (
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-400">
                      現價 <span className="text-white font-semibold">{pick.price?.toLocaleString()}</span>
                    </span>
                    {pick.change_pct !== null && (
                      <span className={`font-semibold ${pick.change_pct >= 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {pick.change_pct >= 0 ? "+" : ""}{pick.change_pct}%
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Four columns: Technicals / Fundamentals / Chips / Industry */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Technicals */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-indigo-400">📈 技術面</h4>
                    <p className="text-gray-300 text-sm">{pick.technicals.summary}</p>
                    <div className="flex gap-3 text-xs">
                      <span className="text-emerald-400">支撐 {pick.technicals.support?.toLocaleString()}</span>
                      <span className="text-red-400">壓力 {pick.technicals.resistance?.toLocaleString()}</span>
                    </div>
                    <Badge variant={getTrendBadge(pick.technicals.trend)} className="text-xs">
                      {pick.technicals.trend}
                    </Badge>
                  </div>
                  {/* Fundamentals */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-400">💰 基本面</h4>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-300">月增 <span className="text-white font-semibold">{pick.fundamentals.revenue_mom}</span></p>
                      <p className="text-gray-300">年增 <span className="text-white font-semibold">{pick.fundamentals.revenue_yoy}</span></p>
                      <p className="text-gray-300">本益比 <span className="text-white font-semibold">{pick.fundamentals.pe}</span></p>
                      <p className="text-gray-300">市值 <span className="text-white font-semibold">{pick.fundamentals.market_cap}</span></p>
                    </div>
                  </div>
                  {/* Chips */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-purple-400">🎲 籌碼面</h4>
                    <p className="text-gray-300 text-sm">
                      外資 <span className={`font-semibold ${pick.chip_analysis.foreign_net_buy.startsWith("+") ? "text-rose-400" : "text-emerald-400"}`}>
                        {pick.chip_analysis.foreign_net_buy}
                      </span>
                    </p>
                    <p className="text-gray-300 text-sm">{pick.chip_analysis.summary}</p>
                  </div>
                  {/* Industry */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-cyan-400">🏭 產業題材</h4>
                    {dailyIndustry ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getKnowledgeBasisClass(dailyIndustry.knowledgeBasis)}`}>
                            {getKnowledgeBasisText(dailyIndustry)}
                          </Badge>
                          {analysisQuality && (
                            <Badge variant="outline" className={`text-xs ${getAnalysisQualityClass(analysisQuality.grade)}`}>
                              Quality {analysisQuality.grade} · {analysisQuality.label}
                            </Badge>
                          )}
                          <span className="text-gray-300 text-sm">{dailyIndustry.label}</span>
                          {typeof dailyIndustry.score === "number" && (
                            <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200 text-xs">
                              {dailyIndustry.score}/100
                            </Badge>
                          )}
                          {dailyIndustry.confidence && (
                            <span className="text-[11px] text-gray-500">confidence: {dailyIndustry.confidence}</span>
                          )}
                        </div>

                        {analysisQuality && (
                          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">分析品質</span>
                              <Badge variant="outline" className={`text-[11px] ${analysisQuality.upgradePriority === "high" ? "border-red-400/30 bg-red-400/10 text-red-200" : analysisQuality.upgradePriority === "medium" ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>
                                {getUpgradePriorityText(analysisQuality.upgradePriority)}
                              </Badge>
                            </div>
                            {analysisQuality.missingKnowledge.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {analysisQuality.missingKnowledge.map((item) => (
                                  <span key={item} className="rounded border border-slate-600/60 bg-slate-800/80 px-1.5 py-0.5 text-[11px] text-slate-300">
                                    {getMissingKnowledgeText(item)}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(analysisQuality.grade === "D" || analysisQuality.grade === "F") && (
                              <p className="mt-2 text-xs leading-relaxed text-amber-200/90">
                                這檔產業分析尚未 evidence-backed；目前只能觀察，不能把題材敘事當成高信心推薦依據。
                              </p>
                            )}
                          </div>
                        )}

                        {dailyIndustry.roleDetail && (
                          <div className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 p-2">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">角色</span>
                              <Badge variant="outline" className="border-slate-500/30 bg-slate-800/70 text-[11px] text-slate-200">
                                {dailyIndustry.roleDetail.topicName}
                              </Badge>
                              <span className="text-[11px] text-cyan-100">{dailyIndustry.roleDetail.roleLabel}</span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-300 line-clamp-3">{dailyIndustry.roleDetail.roleSummary}</p>
                            {(dailyIndustry.roleDetail.supplyChainStage || dailyIndustry.roleDetail.roleType) && (
                              <p className="mt-1 text-[11px] text-gray-500">
                                {dailyIndustry.roleDetail.supplyChainStage}{dailyIndustry.roleDetail.supplyChainStage && dailyIndustry.roleDetail.roleType ? " · " : ""}{dailyIndustry.roleDetail.roleType}
                              </p>
                            )}
                          </div>
                        )}

                        {dailyIndustry.productNarratives && dailyIndustry.productNarratives.length > 0 && (
                          <div className="space-y-2">
                            {dailyIndustry.productNarratives.slice(0, 2).map((product) => (
                              <div key={product.name} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-2">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300">產品</span>
                                  <span className="text-xs font-semibold text-white">{product.name}</span>
                                  {product.confidence && <span className="text-[11px] text-gray-500">{product.confidence}</span>}
                                </div>
                                <p className="text-xs leading-relaxed text-gray-300 line-clamp-2">是什麼：{product.description}</p>
                                {product.whyItMatters && (
                                  <p className="mt-1 text-xs leading-relaxed text-cyan-100/90 line-clamp-2">為什麼重要：{product.whyItMatters}</p>
                                )}
                                {(product.topicFit || product.businessImpact) && (
                                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500 line-clamp-2">{product.topicFit ?? product.businessImpact}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {dailyIndustry.swotSnapshot && (dailyIndustry.swotSnapshot.strengths.length + dailyIndustry.swotSnapshot.opportunities.length + dailyIndustry.swotSnapshot.risks.length > 0) && (
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            {dailyIndustry.swotSnapshot.strengths.length > 0 && (
                              <div className="rounded border border-emerald-400/15 bg-emerald-400/5 px-2 py-1">
                                <span className="font-semibold text-emerald-300">S</span>
                                <span className="text-gray-300"> {dailyIndustry.swotSnapshot.strengths[0]}</span>
                              </div>
                            )}
                            {dailyIndustry.swotSnapshot.opportunities.length > 0 && (
                              <div className="rounded border border-sky-400/15 bg-sky-400/5 px-2 py-1">
                                <span className="font-semibold text-sky-300">O</span>
                                <span className="text-gray-300"> {dailyIndustry.swotSnapshot.opportunities[0]}</span>
                              </div>
                            )}
                            {dailyIndustry.swotSnapshot.risks.length > 0 && (
                              <div className="rounded border border-amber-400/15 bg-amber-400/5 px-2 py-1">
                                <span className="font-semibold text-amber-300">W/T</span>
                                <span className="text-gray-300"> {dailyIndustry.swotSnapshot.risks[0]}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {dailyIndustry.verificationNote && dailyIndustry.knowledgeBasis !== "canonical_verified" && (
                          <p className="rounded border border-amber-400/20 bg-amber-400/5 px-2 py-1 text-xs leading-relaxed text-amber-200/90">
                            {dailyIndustry.verificationNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">產業分數載入中</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-700" />

                {/* Recommendation */}
                <div className="bg-slate-800/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-white mb-2">💡 操作建議</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">進場價</p>
                      <p className="text-white font-semibold">{pick.recommendation.entry_price?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">停損價</p>
                      <p className="text-red-400 font-semibold">{pick.recommendation.stop_loss?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">停利區間</p>
                      <p className="text-emerald-400 font-semibold">{pick.recommendation.take_profit}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">部位</p>
                      <p className="text-white font-semibold">{pick.recommendation.position_size}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    🧠 {pick.recommendation.reasoning}
                  </p>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {gatedPicks.observationOnly.length > 0 && (
          <Card className="mt-6 border-orange-500/20 taste-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-orange-300">👀 觀察 / 資料不足（不列入 Top recommendation）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-gray-400">
                以下標的來自原始候選清單，但 Analysis Quality 未達 A/B/C。它們可以追蹤，不應被包裝成高信心推薦。
              </p>
              {gatedPicks.observationOnly.map(({ pick, analysis, reason }) => {
                const quality = analysis?.analysisQuality;
                return (
                  <div key={pick.code} className="rounded-lg border border-slate-700/80 bg-slate-900/40 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-500">原候選 #{pick.rank}</span>
                          <Link href={`/?company=${pick.code}`} className="font-bold text-white hover:text-emerald-300">
                            {pick.name} <span className="text-gray-500">({pick.code})</span>
                          </Link>
                          <Badge variant="outline" className={`text-xs ${getAnalysisQualityClass(quality?.grade)}`}>
                            Quality {quality?.grade ?? "?"} · {quality?.label ?? "未載入"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{reason}</p>
                        {quality?.blockingReasons?.length ? (
                          <p className="mt-1 text-xs text-gray-500">阻擋原因：{quality.blockingReasons.join("、")}</p>
                        ) : null}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(pick.score)}`}>{pick.score}分</div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      <p className="text-gray-300"><span className="text-indigo-300">技術：</span>{pick.technicals.summary}</p>
                      <p className="text-gray-300"><span className="text-purple-300">籌碼：</span>{pick.chip_analysis.summary}</p>
                      <p className="text-gray-300"><span className="text-cyan-300">產業：</span>尚未 evidence-backed 到可推薦門檻。</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Strong Stock Ranking */}
        {selectedStrongStockRanking && (
          <Card className="taste-card border-rose-500/20 mb-6">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-lg text-white">🚀 強勢股排行</CardTitle>
                  <p className="mt-1 text-xs text-gray-500">
                    Source: {selectedStrongStockRanking.source.name} · 最新 K 線 {selectedStrongStockRanking.source.latestDate || "—"} · {selectedStrongStockRanking.source.scope}
                  </p>
                  <p className="mt-1 text-xs text-amber-200/80">⚠ {selectedStrongStockRanking.source.warning}</p>
                  <p className="mt-1 text-xs text-gray-500">price/technical only；不混入籌碼、基本面、新聞、ETF 成分或 AI 判斷。</p>
                </div>
                <div className="flex w-fit rounded-lg border border-slate-700 bg-slate-950/80 p-1">
                  {(["1d", "5d", "20d"] as StrongStockTimeframe[]).map((timeframe) => (
                    <button
                      key={timeframe}
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${strongStockTimeframe === timeframe ? "bg-rose-400/20 text-rose-100" : "text-gray-400 hover:text-gray-100"}`}
                      onClick={() => setStrongStockTimeframe(timeframe)}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedStrongStockRanking.items.length === 0 ? (
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 text-sm text-gray-400">
                  {selectedStrongStockRanking.emptyReason ?? "目前沒有符合此 timeframe 的 fresh K-line 強勢股。"}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedStrongStockRanking.items.slice(0, 8).map((item) => (
                    <Link key={`${selectedStrongStockRanking.timeframe}-${item.code}`} href={`/?company=${item.code}`} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3 transition hover:border-rose-400/40 hover:bg-rose-400/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">#{item.rank} {item.name} <span className="text-gray-500">({item.code})</span></p>
                          <p className="mt-1 text-xs text-gray-400">{item.reason}</p>
                        </div>
                        <Badge variant="outline" className="border-rose-400/30 bg-rose-400/10 text-rose-200 text-xs">
                          {item.score}分
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">收盤</p>
                          <p className="font-semibold text-white">{item.close.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{selectedStrongStockRanking.timeframe}</p>
                          <p className={`font-semibold ${item.returnPct >= 0 ? "text-rose-300" : "text-emerald-300"}`}>{item.returnPct >= 0 ? "+" : ""}{item.returnPct}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">量比</p>
                          <p className="font-semibold text-indigo-200">{item.volumeRatio20}x</p>
                        </div>
                        <div>
                          <p className="text-gray-500">型態</p>
                          <p className="font-semibold text-gray-200">{item.high20Breakout ? "20日高" : item.aboveMa20 ? "MA20上" : "觀察"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Event Focus */}
        {eventFocus && (
          <Card className="taste-card border-cyan-500/20 mb-6">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg text-white">🧭 事件驅動焦點</CardTitle>
                <Badge variant="outline" className="w-fit border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
                  {eventFocus.status === "empty" ? "no official event" : "official TWSE · derived topic mapping"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                Source: {eventFocus.source.name} · 最新公告日 {eventFocus.latestDate ?? "—"} · {eventFocus.source.semantics}
              </p>
            </CardHeader>
            <CardContent>
              {eventFocus.items.length === 0 ? (
                <p className="text-sm text-gray-400">{eventFocus.emptyReason ?? "目前追蹤公司沒有官方重大訊息。"}</p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/[0.04] p-3">
                    <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm font-semibold text-cyan-200">事件篩選</p>
                      <button
                        type="button"
                        className="w-fit text-xs text-cyan-300 hover:text-cyan-100"
                        onClick={() => setEventFilters(activeTopicId ? { topicId: activeTopicId } : {})}
                      >
                        清除篩選
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <select
                        aria-label="事件日期篩選"
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-gray-200"
                        value={effectiveEventFilters.date ?? ""}
                        onChange={(event) => setEventFilters((current) => ({ ...current, date: event.target.value || undefined }))}
                      >
                        <option value="">全部日期</option>
                        {eventFilterOptions.dates.map((date) => <option key={date} value={date}>{date}</option>)}
                      </select>
                      <select
                        aria-label="事件公司篩選"
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-gray-200"
                        value={effectiveEventFilters.companyCode ?? ""}
                        onChange={(event) => setEventFilters((current) => ({ ...current, companyCode: event.target.value || undefined }))}
                      >
                        <option value="">全部公司</option>
                        {eventFilterOptions.companies.map((company) => <option key={company.code} value={company.code}>{company.name} ({company.code})</option>)}
                      </select>
                      <select
                        aria-label="事件題材篩選"
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-gray-200"
                        value={effectiveEventFilters.topicId ?? ""}
                        onChange={(event) => setEventFilters((current) => ({ ...current, topicId: event.target.value || undefined }))}
                      >
                        <option value="">全部題材</option>
                        {eventFilterOptions.topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                      </select>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">共用 major-news filter view model：company/date/topic。結果 {visibleEventItems.length} / {eventFocus.items.length} 筆。</p>
                  </div>
                  {visibleEventItems.length === 0 ? (
                    <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 text-sm text-gray-400">
                      目前篩選條件下沒有官方重大訊息；不代表公司沒有公告，請以公開資訊觀測站為準。
                    </div>
                  ) : visibleEventItems.slice(0, 12).map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.companyName} <span className="text-gray-500">({item.companyCode})</span>
                          </p>
                          <p className="mt-1 text-sm text-gray-300">{item.officialSubject}</p>
                        </div>
                        <span className="text-xs text-gray-500">{item.announcedAt}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.derivedTopics.length > 0 ? item.derivedTopics.map((topic, topicIndex) => (
                          <Badge key={`${item.id}-${topic.topicId}-${topicIndex}`} variant="outline" className="border-indigo-400/30 bg-indigo-400/10 text-indigo-200 text-xs">
                            {topic.topicName}{topic.roleLabel ? ` · ${topic.roleLabel}` : ""}
                          </Badge>
                        )) : (
                          <Badge variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-200 text-xs">
                            未對應已驗證題材角色
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">{item.verificationNote}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Large Holder Ranking */}
        {selectedLargeHolderRanking && (
          <Card className="taste-card border-purple-500/20 mb-6">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-lg text-white">🐋 大戶分級排行</CardTitle>
                  <p className="mt-1 text-xs text-gray-500">
                    Source: {selectedLargeHolderRanking.source.name} · 最新分級日 {selectedLargeHolderRanking.source.latestDate || "—"} · {selectedLargeHolderRanking.source.scope}
                  </p>
                  <p className="mt-1 text-xs text-amber-200/80">⚠ {selectedLargeHolderRanking.source.warning}</p>
                  <p className="mt-1 text-xs text-gray-500">tracked sample；not full market。只排行 checked-in FinMind share-tier percentage changes，缺資料或過期公司直接排除。</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex w-fit rounded-lg border border-slate-700 bg-slate-950/80 p-1">
                    {(["1m_plus", "400k_plus"] as LargeHolderTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${largeHolderTier === tier ? "bg-purple-400/20 text-purple-100" : "text-gray-400 hover:text-gray-100"}`}
                        onClick={() => setLargeHolderTier(tier)}
                      >
                        {tier === "1m_plus" ? "1m+" : "400k+"}
                      </button>
                    ))}
                  </div>
                  <div className="flex w-fit rounded-lg border border-slate-700 bg-slate-950/80 p-1">
                    {(["1w", "4w"] as LargeHolderWindow[]).map((window) => (
                      <button
                        key={window}
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${largeHolderWindow === window ? "bg-purple-400/20 text-purple-100" : "text-gray-400 hover:text-gray-100"}`}
                        onClick={() => setLargeHolderWindow(window)}
                      >
                        {window}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedLargeHolderRanking.items.length === 0 ? (
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 text-sm text-gray-400">
                  {selectedLargeHolderRanking.emptyReason ?? "目前沒有符合此 tier/window 的 fresh 大戶分級樣本。"}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {selectedLargeHolderRanking.items.slice(0, 8).map((item) => (
                    <Link key={`${selectedLargeHolderRanking.tier}-${selectedLargeHolderRanking.window}-${item.code}`} href={`/?company=${item.code}`} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3 transition hover:border-purple-400/40 hover:bg-purple-400/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">#{item.rank} {item.name} <span className="text-gray-500">({item.code})</span></p>
                          <p className="mt-1 text-xs text-gray-400">{item.reason}</p>
                        </div>
                        <Badge variant="outline" className="border-purple-400/30 bg-purple-400/10 text-purple-200 text-xs">
                          {item.score}分
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">分級</p>
                          <p className="font-semibold text-white">{item.tierLabel}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">占比變化</p>
                          <p className={`font-semibold ${item.changePctPoint >= 0 ? "text-rose-300" : "text-emerald-300"}`}>{item.changePctPoint >= 0 ? "+" : ""}{item.changePctPoint}pp</p>
                        </div>
                        <div>
                          <p className="text-gray-500">最新占比</p>
                          <p className="font-semibold text-indigo-200">{item.latestPercent}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">比較日</p>
                          <p className="font-semibold text-gray-200">{item.baselineDate}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Hot Sectors */}
        {report.hot_sectors && report.hot_sectors.length > 0 && (
          <Card className="taste-card border-slate-700 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">🔥 熱門族群</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {report.hot_sectors.map((sector, i) => (
                  <div key={i} className="bg-slate-800/50 rounded-lg px-4 py-2 flex items-center gap-3">
                    <span className="text-white font-semibold">{sector.name}</span>
                    <span className={`font-bold ${sector.change_pct.startsWith("+") ? "text-rose-400" : "text-emerald-400"}`}>
                      {sector.change_pct}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {sector.leaders.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Indicator Strip */}
        {marketIndicators && (
          <Card className="taste-card border-sky-500/20 mb-6">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-lg text-white">🌐 市場指標列</CardTitle>
                  <p className="mt-1 text-xs text-gray-500">
                    Source: {marketIndicators.source.name} · 最新日 {marketIndicators.latestDate || "—"} · {marketIndicators.source.scope}
                  </p>
                  <p className="mt-1 text-xs text-amber-200/80">⚠ {marketIndicators.source.warning}</p>
                </div>
                <Badge variant="outline" className={`${getSourceStatusClass(marketIndicators.status)} w-fit text-xs`}>
                  {marketIndicators.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {marketIndicators.indicators.length === 0 ? (
                <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4 text-sm text-gray-400">
                  {marketIndicators.emptyReason ?? "No verified TWSE market indicator rows; skip instead of AI-filling."}
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {marketIndicators.indicators.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-sky-100">{item.label}</p>
                        <Badge variant="outline" className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-[10px]">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-2xl font-bold text-white">{item.valueLabel}</p>
                      {(item.change != null || item.changePercent != null) && (
                        <p className={`mt-1 text-sm font-semibold ${getMarketChangeClass(item.changePercent ?? item.change)}`}>
                          {formatMarketChange(item.change)} · {formatMarketChange(item.changePercent, "%")}
                        </p>
                      )}
                      {item.secondaryLabel && <p className="mt-1 text-xs text-gray-400">{item.secondaryLabel}</p>}
                      <p className="mt-2 text-[11px] leading-relaxed text-gray-500">{item.note}</p>
                    </div>
                  ))}
                </div>
              )}
              {marketIndicators.unavailable.length > 0 && (
                <div className="mt-3 grid gap-2 md:grid-cols-2" aria-label="source not verified market indicator cards">
                  {marketIndicators.unavailable.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-3 text-xs text-gray-400">
                      <p className="font-semibold text-gray-300">{item.label}：unavailable</p>
                      <p className="mt-1">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Risk Alerts */}
        {report.risk_alerts && report.risk_alerts.length > 0 && (
          <Card className="taste-card border-amber-500/20 mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-400">⚠️ 風險提醒</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.risk_alerts.map((alert, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {alert}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Unified source-status rail */}
        {report.freshness && (
          <Card className="taste-card border-emerald-500/20 mb-6">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle className="text-lg text-white">🟢 資料狀態</CardTitle>
                <Badge variant="outline" className="w-fit border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                  freshness metadata checked-in
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                市場資料日 {report.freshness.marketDataDate} · 事件資料日 {report.freshness.eventDataDate} · 報告產生日 {formatTimestamp(report.freshness.generatedAt)} · Daily analysis {formatTimestamp(report.freshness.analysisGeneratedAt)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {report.freshness.sources.map((source) => (
                  <div key={source.module} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{source.module}</p>
                        <p className="mt-1 text-xs text-gray-400">{source.source}</p>
                      </div>
                      <Badge variant="outline" className={`${getSourceStatusClass(source.status)} text-xs`}>
                        {source.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">最新日：{source.latestDate || "—"}</p>
                    <p className="mt-1 text-xs text-gray-500">範圍：{source.scope}</p>
                    {source.warning && (
                      <p className="mt-2 rounded-md border border-amber-400/20 bg-amber-400/[0.06] px-2 py-1 text-xs text-amber-100">
                        ⚠ {source.warning}
                      </p>
                    )}
                    {source.emptyReason && (
                      <p className="mt-2 rounded-md border border-slate-600/50 bg-slate-950/40 px-2 py-1 text-xs text-gray-400">
                        {source.emptyReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Footer */}
        <div className="mt-8 space-y-4">
          {/* Knowledge Base Links */}
          <Card className="taste-card border-indigo-500/20">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-indigo-400 mb-3">📚 知識庫參考</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="https://allen-hsu1116.github.io/stock-knowledge-site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                >
                  <h4 className="text-white text-sm font-semibold">📖 股票知識庫</h4>
                  <p className="text-gray-500 text-xs mt-1">技術分析 · 基本面 · 籌碼面 · 操作策略 · 風險管理</p>
                </a>
                <a
                  href="https://allen-hsu1116.github.io/knowledge-base/%E5%B0%88%E6%A1%88/%E6%87%89%E7%94%A8/ZhuLinsen-daily_stock_analysis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                >
                  <h4 className="text-white text-sm font-semibold">🧠 AI 選股參考專案</h4>
                  <p className="text-gray-500 text-xs mt-1">daily_stock_analysis · AI-Trader · Vibe-Trading</p>
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-gray-500 text-xs">
            <p>🧠 知識來源：stock-knowledge.md + knowledge-base (Quartz)</p>
            <p className="mt-1">
              本報告由 AI 自動產生，僅供參考，不構成投資建議。
            </p>
            <Link href="/" className="text-emerald-400 hover:text-emerald-300 mt-2 inline-block">
              ← 返回產業地圖
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}