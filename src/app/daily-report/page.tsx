"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
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

/* ─── Main Page ─── */
export default function DailyReportPage() {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("/industry-map-site/data/daily-report.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: DailyReport = await res.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

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
                  <p className={`text-xl font-bold ${(report.market_overview.change ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {report.market_overview.change !== null ? `${report.market_overview.change >= 0 ? "+" : ""}${report.market_overview.change?.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">漲跌幅</p>
                  <p className={`text-xl font-bold ${(report.market_overview.change_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {report.market_overview.change_pct !== null ? `${report.market_overview.change_pct >= 0 ? "+" : ""}${report.market_overview.change_pct}%` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">上漲/下跌</p>
                  <p className="text-lg font-bold text-white">
                    <span className="text-emerald-400">{report.market_overview.advancing}</span>
                    {" / "}
                    <span className="text-red-400">{report.market_overview.declining}</span>
                  </p>
                </div>
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
                    <span className={`font-bold ${sector.change_pct.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
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
          {report.picks.map((pick) => (
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
                      <span className={`font-semibold ${pick.change_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {pick.change_pct >= 0 ? "+" : ""}{pick.change_pct}%
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Three columns: Technicals / Fundamentals / Chips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      外資 <span className={`font-semibold ${pick.chip_analysis.foreign_net_buy.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                        {pick.chip_analysis.foreign_net_buy}
                      </span>
                    </p>
                    <p className="text-gray-300 text-sm">{pick.chip_analysis.summary}</p>
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
          ))}
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
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>🧠 知識來源：snake-knowledge.md</p>
          <p className="mt-1">
            本報告由 AI 自動產生，僅供參考，不構成投資建議。
          </p>
          <a href="/industry-map-site/" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
            ← 返回產業地圖
          </a>
        </div>
      </div>
    </div>
  );
}