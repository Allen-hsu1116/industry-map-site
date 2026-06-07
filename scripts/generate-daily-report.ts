import fs from "node:fs";
import path from "node:path";
import { buildUnifiedSourceStatusRail, type SourceStatusRailItem } from "../src/lib/sourceStatusRail";

const COMPANIES_PATH = path.resolve("public/data/companies.json");
const FINANCIALS_DIR = path.resolve("public/data/financials");
const EVENT_FOCUS_PATH = path.resolve("public/data/event-focus.json");
const MARKET_INDICATOR_STRIP_PATH = path.resolve("public/data/market-indicator-strip.json");
const STRONG_STOCK_RANKING_PATH = path.resolve("public/data/strong-stock-ranking.json");
const ANALYSIS_INDEX_PATH = path.resolve("public/data/analysis/index.json");
const ANALYSIS_DIR = path.resolve("public/data/analysis");
const DAILY_REPORT_PATH = path.resolve("public/data/daily-report.json");
const PRODUCT_KNOWLEDGE_DIR = path.resolve("public/data/product-knowledge");
const COMPANY_TOPIC_ROLES_DIR = path.resolve("public/data/company-topic-roles");
const COMPANY_SWOT_DIR = path.resolve("public/data/company-swot");

interface CompanyPriority {
  code: string;
  name?: string;
  topic_count: number;
}

interface PriceRow { date: string; close: number; low?: number; high?: number }
interface ValuationRow { date: string; pe?: number }

interface FinancialSnapshot {
  trends?: { daily_prices?: PriceRow[] };
  institutional_history?: Array<{ date: string; net_buy?: number; foreign_investor_net_buy?: number }>;
  margin_history?: Array<{ date: string }>;
  per_history?: ValuationRow[];
}

interface StrongStockItem {
  code: string;
  name: string;
  score: number;
  rank: number;
  latestDate: string;
  close: number;
  returnPct: number;
  changePct1d: number;
  reason: string;
}

interface StrongStockArtifact {
  rankings: Array<{ timeframe: string; items: StrongStockItem[] }>;
}

interface CompanyDailyAnalysis {
  code: string;
  name: string;
  analysisQuality?: { grade?: "A" | "B" | "C" | "D" | "F"; label?: string };
  scoring?: { recommendationState?: string; riskGates?: Array<{ severity: "hard" | "soft"; message: string }> };
  technical?: { label?: string; summary?: string; score?: number };
  chips?: { summary?: string; score?: number; signals?: string[]; risks?: string[] };
  industry?: {
    label?: string;
    score?: number;
    summary?: string;
    roleDetail?: { topicName?: string; roleLabel?: string };
    swotSnapshot?: { strengths?: string[]; opportunities?: string[]; risks?: string[] };
  };
  canonicalKnowledge?: { topicRoles?: Array<{ canonicalTopicName?: string; topicName?: string; directnessLabel?: string }> };
}

interface DailyReportPick {
  rank: number;
  code: string;
  name: string;
  score: number;
  industry: string;
  price: number;
  change_pct: number;
  technicals: { summary: string; support: number; resistance: number; trend: string };
  fundamentals: { revenue_mom: string; revenue_yoy: string; pe: number; market_cap: string };
  chip_analysis: { foreign_net_buy: string; summary: string };
  recommendation: { action: string; entry_price: number; stop_loss: number; take_profit: string; position_size: string; reasoning: string };
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function readJsonIfExists<T>(filePath: string): T | null {
  return fs.existsSync(filePath) ? readJson<T>(filePath) : null;
}

function latestDate(rows: Array<{ date: string }> | undefined): string | undefined {
  return rows?.filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date;
}

function latestRow<T extends { date: string }>(rows: T[] | undefined): T | undefined {
  return rows?.filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1);
}

function minDate(dates: Array<string | undefined>): string {
  return dates.filter((date): date is string => Boolean(date)).sort().at(0) ?? "";
}

function loadPriorityFinancials(codes: string[]): FinancialSnapshot[] {
  return codes.map((code) => readJson<FinancialSnapshot>(path.join(FINANCIALS_DIR, `${code}.json`)));
}

function latestFileDate(dir: string): string {
  if (!fs.existsSync(dir)) return "";
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const json = readJson<{ updatedAt?: string; generatedAt?: string }>(path.join(dir, file));
      return json.updatedAt ?? json.generatedAt?.slice(0, 10) ?? "";
    })
    .filter(Boolean)
    .sort()
    .at(-1) ?? "";
}

function jsonFileCount(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((file) => file.endsWith(".json")).length;
}

function weekdayZh(date: string): string {
  const day = new Date(`${date}T00:00:00+08:00`).getDay();
  return ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][day] ?? "";
}

function formatPct(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : "—";
}

function formatLots(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  const lots = value / 1000;
  return `${lots >= 0 ? "+" : ""}${Math.round(lots).toLocaleString("zh-TW")}張`;
}

function supportResistance(financial: FinancialSnapshot | null, close: number): { support: number; resistance: number } {
  const prices = financial?.trends?.daily_prices?.slice(-20) ?? [];
  const lows = prices.map((row) => row.low ?? row.close).filter(Number.isFinite);
  const highs = prices.map((row) => row.high ?? row.close).filter(Number.isFinite);
  const support = lows.length ? Math.min(...lows) : close * 0.95;
  const resistance = highs.length ? Math.max(...highs) : close * 1.08;
  return { support: Number(support.toFixed(2)), resistance: Number(resistance.toFixed(2)) };
}

function hasHardRiskGate(analysis: CompanyDailyAnalysis | null): boolean {
  return Boolean(analysis?.scoring?.recommendationState === "blocked" || analysis?.scoring?.riskGates?.some((gate) => gate.severity === "hard"));
}

function primaryTopicName(analysis: CompanyDailyAnalysis | null): string {
  return analysis?.industry?.roleDetail?.topicName
    ?? analysis?.canonicalKnowledge?.topicRoles?.[0]?.canonicalTopicName
    ?? analysis?.canonicalKnowledge?.topicRoles?.[0]?.topicName
    ?? "未分類題材";
}

function pickScore(strong: StrongStockItem, analysis: CompanyDailyAnalysis | null): number {
  const industryScore = analysis?.industry?.score ?? 0;
  const technicalScore = analysis?.technical?.score ?? 0;
  const chipScore = analysis?.chips?.score ?? 0;
  return Math.max(0, Math.min(100, Math.round(strong.score * 0.55 + industryScore * 0.3 + Math.max(0, technicalScore) * 0.1 + Math.max(0, chipScore) * 0.05)));
}

function buildDailyPicks(strongStocks: StrongStockArtifact): DailyReportPick[] {
  const oneDay = strongStocks.rankings.find((ranking) => ranking.timeframe === "1d")?.items ?? [];
  const picks = oneDay
    .map((strong) => {
      const analysis = readJsonIfExists<CompanyDailyAnalysis>(path.join(ANALYSIS_DIR, `${strong.code}.json`));
      const financial = readJsonIfExists<FinancialSnapshot>(path.join(FINANCIALS_DIR, `${strong.code}.json`));
      const grade = analysis?.analysisQuality?.grade;
      if (!grade || !["A", "B", "C"].includes(grade) || hasHardRiskGate(analysis)) return null;
      const valuation = latestRow(financial?.per_history);
      const institutional = latestRow(financial?.institutional_history);
      const { support, resistance } = supportResistance(financial, strong.close);
      const topicName = primaryTopicName(analysis);
      const score = pickScore(strong, analysis);
      return {
        rank: 0,
        code: strong.code,
        name: strong.name,
        score,
        industry: topicName,
        price: strong.close,
        change_pct: strong.changePct1d,
        technicals: {
          summary: `${analysis?.technical?.summary ?? analysis?.technical?.label ?? "技術面待補"}；strong-stock ranking：${strong.reason}`,
          support,
          resistance,
          trend: analysis?.technical?.label ?? (strong.returnPct >= 0 ? "偏多" : "觀察"),
        },
        fundamentals: {
          revenue_mom: "非每日 feed",
          revenue_yoy: "非每日 feed",
          pe: valuation?.pe ?? 0,
          market_cap: "—",
        },
        chip_analysis: {
          foreign_net_buy: formatLots(institutional?.foreign_investor_net_buy ?? institutional?.net_buy),
          summary: analysis?.chips?.summary ?? "籌碼摘要待補；不可用 AI 假填分項資料。",
        },
        recommendation: {
          action: analysis?.scoring?.recommendationState === "top_candidate" ? "可列 Top recommendation" : "觀察偏多",
          entry_price: strong.close,
          stop_loss: support,
          take_profit: `${resistance}`,
          position_size: score >= 80 ? "2成以內" : "1成以內",
          reasoning: `由 strong-stock ranking（${strong.reason}）與 Daily Analysis quality gate（${grade} / ${analysis?.analysisQuality?.label ?? "未標示"}）產生；題材角色：${topicName}；非投資建議。`,
        },
      };
    })
    .filter((item): item is DailyReportPick => Boolean(item))
    .slice(0, 6)
    .map((pick, index) => ({ ...pick, rank: index + 1 }));

  return picks;
}

function buildHotSectors(picks: DailyReportPick[]): Array<{ name: string; change_pct: string; leaders: string[] }> {
  const sectors = new Map<string, DailyReportPick[]>();
  for (const pick of picks) {
    const name = String(pick.industry ?? "未分類題材");
    const current = sectors.get(name) ?? [];
    current.push(pick);
    sectors.set(name, current);
  }

  return Array.from(sectors.entries())
    .map(([name, sectorPicks]) => {
      const changes = sectorPicks.map((pick) => Number(pick.change_pct)).filter(Number.isFinite);
      const avgChange = changes.length ? changes.reduce((sum, value) => sum + value, 0) / changes.length : 0;
      return {
        name,
        change_pct: formatPct(avgChange),
        leaders: sectorPicks.map((pick) => String(pick.code)).slice(0, 3),
      };
    })
    .sort((a, b) => Number.parseFloat(b.change_pct) - Number.parseFloat(a.change_pct))
    .slice(0, 5);
}

function buildKnowledgeApplied(picks: DailyReportPick[]) {
  const topTopics = Array.from(new Set(picks.map((pick) => String(pick.industry ?? "未分類題材")))).slice(0, 3);
  return {
    topic: topTopics.length ? topTopics.join(" / ") : "Daily Analysis quality gate",
    key_insights: [
      "Daily picks 由 checked-in strong-stock ranking + Daily Analysis A/B/C quality gate 產生，不沿用舊模板。",
      "公司產品、題材角色與 SWOT 來自 canonical knowledge；AI 只整理摘要，不當資料來源。",
      "月營收/財報/股利不是每日 feed；每日報告只標示可驗證市場資料與已建檔知識。",
    ],
  };
}

function buildMarketOverview(marketIndicators: { indicators: Array<{ id: string; label: string; value?: number; change?: number; changePercent?: number; secondaryValue?: number }> }) {
  const weighted = marketIndicators.indicators.find((indicator) => indicator.id === "twse-weighted");
  const breadth = marketIndicators.indicators.find((indicator) => indicator.id === "breadth");
  return {
    index: weighted?.label ?? "發行量加權股價指數",
    close: weighted?.value ?? null,
    change: weighted?.change ?? null,
    change_pct: weighted?.changePercent ?? null,
    advancing: breadth?.value ?? null,
    declining: breadth?.secondaryValue ?? null,
  };
}

function main() {
  const companies = readJson<CompanyPriority[]>(COMPANIES_PATH);
  const priorityCodes = companies
    .slice()
    .sort((a, b) => b.topic_count - a.topic_count || a.code.localeCompare(b.code))
    .slice(0, 30)
    .map((company) => company.code);
  const financials = loadPriorityFinancials(priorityCodes);
  const eventFocus = readJson<{ latestDate?: string; generatedAt: string; status: "verified" | "partial" | "empty"; itemCount: number; emptyReason?: string; source: { name: string; scope: string; semantics?: string } }>(EVENT_FOCUS_PATH);
  const marketIndicators = readJson<{ latestDate?: string; status: "verified" | "partial" | "empty"; indicators: Array<{ id: string; label: string; value?: number; change?: number; changePercent?: number; secondaryValue?: number }>; emptyReason?: string; source: { name: string; scope: string; warning?: string } }>(MARKET_INDICATOR_STRIP_PATH);
  const strongStocks = readJson<StrongStockArtifact>(STRONG_STOCK_RANKING_PATH);
  const analysisIndex = readJson<{ generatedAt: string; count: number }>(ANALYSIS_INDEX_PATH);

  const klineDates = financials.map((financial) => latestDate(financial.trends?.daily_prices));
  const institutionalDates = financials.map((financial) => latestDate(financial.institutional_history));
  const marginDates = financials.map((financial) => latestDate(financial.margin_history));
  const valuationDates = financials.map((financial) => latestDate(financial.per_history));
  const marketDataDate = minDate([...klineDates, ...institutionalDates, ...marginDates, ...valuationDates]);
  const generatedAt = new Date().toISOString();

  const sourceRail = buildUnifiedSourceStatusRail({
    totalCompanies: companies.length,
    priorityCompanyCount: priorityCodes.length,
    marketModules: [
      { module: "kline", source: "FinMind TaiwanStockPrice", scope: "top 30 companies by topic_count", datesByCompany: new Map(priorityCodes.map((code, index) => [code, klineDates[index]])) },
      { module: "institutional", source: "FinMind TaiwanStockInstitutionalInvestorsBuySell", scope: "top 30 companies by topic_count", datesByCompany: new Map(priorityCodes.map((code, index) => [code, institutionalDates[index]])) },
      { module: "margin", source: "FinMind TaiwanStockMarginPurchaseShortSale", scope: "top 30 companies by topic_count", datesByCompany: new Map(priorityCodes.map((code, index) => [code, marginDates[index]])) },
      { module: "valuation", source: "FinMind TaiwanStockPER", scope: "top 30 companies by topic_count", datesByCompany: new Map(priorityCodes.map((code, index) => [code, valuationDates[index]])) },
    ],
    externalModules: [
      {
        module: "market-indicator-strip",
        source: marketIndicators.source.name,
        latestDate: marketIndicators.latestDate ?? "",
        status: marketIndicators.status,
        scope: `${marketIndicators.source.scope} · ${marketIndicators.indicators.length} verified cards`,
        warning: marketIndicators.source.warning,
        emptyReason: marketIndicators.emptyReason,
      },
    ],
    eventFocus: {
      source: eventFocus.source.name,
      latestDate: eventFocus.latestDate ?? "",
      status: eventFocus.status,
      scope: eventFocus.source.scope,
      itemCount: eventFocus.itemCount,
      warning: eventFocus.source.semantics,
      emptyReason: eventFocus.emptyReason,
    },
    dailyAnalysis: {
      source: "checked-in rule-batch analysis/index.json",
      latestDate: analysisIndex.generatedAt.slice(0, 10),
      count: analysisIndex.count,
    },
    knowledgeModules: [
      { module: "product-knowledge", source: "checked-in product-knowledge/*.json", count: jsonFileCount(PRODUCT_KNOWLEDGE_DIR), latestDate: latestFileDate(PRODUCT_KNOWLEDGE_DIR) },
      { module: "company-topic-roles", source: "checked-in company-topic-roles/*.json", count: jsonFileCount(COMPANY_TOPIC_ROLES_DIR), latestDate: latestFileDate(COMPANY_TOPIC_ROLES_DIR) },
      { module: "company-swot", source: "checked-in company-swot/*.json", count: jsonFileCount(COMPANY_SWOT_DIR), latestDate: latestFileDate(COMPANY_SWOT_DIR) },
    ],
  });
  const sources: SourceStatusRailItem[] = sourceRail.items;
  const picks = buildDailyPicks(strongStocks);

  const nextReport = {
    date: marketDataDate,
    weekday: weekdayZh(marketDataDate),
    knowledge_applied: buildKnowledgeApplied(picks),
    market_overview: buildMarketOverview(marketIndicators),
    picks,
    hot_sectors: buildHotSectors(picks),
    risk_alerts: [
      "Daily picks 只代表 checked-in 技術強勢 + Daily Analysis quality gate；不是投資建議。",
      "若分析品質為 D/F、缺產品/題材角色/SWOT 證據，UI 會降為 observation-only。",
      "Source-status rail 若顯示 partial/empty，代表該模組不可被當成完整市場事實。",
    ],
    freshness: {
      generatedAt,
      marketDataDate,
      eventDataDate: eventFocus.latestDate ?? "",
      analysisGeneratedAt: analysisIndex.generatedAt,
      sources,
    },
  };

  fs.writeFileSync(DAILY_REPORT_PATH, `${JSON.stringify(nextReport, null, 2)}\n`);
  console.log(`Regenerated ${path.relative(process.cwd(), DAILY_REPORT_PATH)} with ${picks.length} daily picks for market date ${marketDataDate}`);
}

main();
