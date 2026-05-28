"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  knowledgeBasis?: "canonical_verified" | "canonical_pending" | "legacy_unverified" | "insufficient";
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
    source: "canonical" | "legacy" | "insufficient";
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
}

interface DailyReport {
  date: string;
  weekday: string;
  knowledge_applied: KnowledgeApplied;
  market_overview: MarketOverview;
  picks: StockPick[];
  hot_sectors: HotSector[];
  risk_alerts: string[];
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
  if (basis === "legacy_unverified") return "border-orange-400/30 bg-orange-400/10 text-orange-200";
  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

function getKnowledgeBasisText(industry: DailyIndustryAnalysis): string {
  return industry.provenanceLabel ?? (industry.knowledgeBasis === "canonical_verified" ? "V2 已驗證" : industry.knowledgeBasis === "canonical_pending" ? "V2 待驗證" : industry.knowledgeBasis === "legacy_unverified" ? "Legacy 待驗證" : "產業資料待補");
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
  const [report, setReport] = useState<DailyReport | null>(null);
  const [dailyAnalyses, setDailyAnalyses] = useState<Record<string, CompanyDailyAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await fetchStaticJson<DailyReport>("/data/daily-report.json");
        setReport(data);
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
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full mx-auto mb-4" />
          <p className="text-gray-400 text-lg">載入選股報告中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <Card className="bg-[#12122a] border-red-500/20 max-w-md">
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

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <a href="/industry-map-site/" className="text-indigo-400 hover:text-indigo-300 text-sm mb-2 inline-block">
            ← 返回產業地圖
          </a>
          <h1 className="text-3xl font-bold text-white mt-2">
            📊 每日選股報告
          </h1>
          <p className="text-gray-400 mt-1">
            {report.date}（{report.weekday}）
          </p>
        </div>

        {/* Knowledge Applied */}
        {report.knowledge_applied && (
          <Card className="bg-[#12122a] border-indigo-500/20 mb-6">
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

        {/* Market Overview */}
        {report.market_overview && report.market_overview.close && (
          <Card className="bg-[#12122a] border-slate-700 mb-6">
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

        {/* Hot Sectors */}
        {report.hot_sectors && report.hot_sectors.length > 0 && (
          <Card className="bg-[#12122a] border-slate-700 mb-6">
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

        {/* Stock Picks */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">🏆 今日推薦 Top {report.picks.length}</h2>
          {report.picks.map((pick) => {
            const dailyAnalysis = dailyAnalyses[pick.code];
            const dailyIndustry = dailyAnalysis?.industry;
            const analysisQuality = dailyAnalysis?.analysisQuality;
            return (
            <Card key={pick.code} className={`bg-[#12122a] border ${getScoreBg(pick.score)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-500">#{pick.rank}</span>
                    <div>
                      <a href={`/industry-map-site/?company=${pick.code}`} className="text-xl font-bold text-white hover:text-indigo-400 transition-colors">
                        {pick.name}
                      </a>
                      <span className="text-gray-500 ml-2 text-sm">({pick.code})</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{pick.industry}</Badge>
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

        {/* Risk Alerts */}
        {report.risk_alerts && report.risk_alerts.length > 0 && (
          <Card className="bg-[#12122a] border-amber-500/20 mt-6">
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

        {/* Footer */}
        <div className="mt-8 space-y-4">
          {/* Knowledge Base Links */}
          <Card className="bg-[#12122a] border-indigo-500/20">
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
            <a href="/industry-map-site/" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
              ← 返回產業地圖
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}