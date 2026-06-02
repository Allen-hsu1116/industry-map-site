import fs from "node:fs";
import path from "node:path";

const COMPANIES_PATH = path.resolve("public/data/companies.json");
const FINANCIALS_DIR = path.resolve("public/data/financials");
const EVENT_FOCUS_PATH = path.resolve("public/data/event-focus.json");
const ANALYSIS_INDEX_PATH = path.resolve("public/data/analysis/index.json");
const DAILY_REPORT_PATH = path.resolve("public/data/daily-report.json");

interface CompanyPriority {
  code: string;
  topic_count: number;
}

interface FinancialSnapshot {
  trends?: { daily_prices?: Array<{ date: string }> };
  institutional_history?: Array<{ date: string }>;
  margin_history?: Array<{ date: string }>;
  per_history?: Array<{ date: string }>;
}

interface SourceStatus {
  module: string;
  source: string;
  latestDate: string;
  status: "verified" | "partial" | "empty";
  scope: string;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function latestDate(rows: Array<{ date: string }> | undefined): string | undefined {
  return rows?.filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date;
}

function minDate(dates: Array<string | undefined>): string {
  return dates.filter((date): date is string => Boolean(date)).sort().at(0) ?? "";
}

function selectPriorityCodes(limit = 30): string[] {
  return readJson<CompanyPriority[]>(COMPANIES_PATH)
    .slice()
    .sort((a, b) => b.topic_count - a.topic_count || a.code.localeCompare(b.code))
    .slice(0, limit)
    .map((company) => company.code);
}

function loadPriorityFinancials(codes: string[]): FinancialSnapshot[] {
  return codes.map((code) => readJson<FinancialSnapshot>(path.join(FINANCIALS_DIR, `${code}.json`)));
}

function sourceStatus(module: string, source: string, dates: Array<string | undefined>, scope: string): SourceStatus {
  const latest = minDate(dates);
  return {
    module,
    source,
    latestDate: latest,
    status: latest ? "verified" : "empty",
    scope,
  };
}

function weekdayZh(date: string): string {
  const day = new Date(`${date}T00:00:00+08:00`).getDay();
  return ["週日", "週一", "週二", "週三", "週四", "週五", "週六"][day] ?? "";
}

function main() {
  const priorityCodes = selectPriorityCodes(30);
  const financials = loadPriorityFinancials(priorityCodes);
  const eventFocus = readJson<{ latestDate?: string; generatedAt: string; status: "verified" | "partial" | "empty"; source: { name: string; scope: string } }>(EVENT_FOCUS_PATH);
  const analysisIndex = readJson<{ generatedAt: string; count: number }>(ANALYSIS_INDEX_PATH);
  const report = readJson<Record<string, unknown>>(DAILY_REPORT_PATH);

  const klineDates = financials.map((financial) => latestDate(financial.trends?.daily_prices));
  const institutionalDates = financials.map((financial) => latestDate(financial.institutional_history));
  const marginDates = financials.map((financial) => latestDate(financial.margin_history));
  const valuationDates = financials.map((financial) => latestDate(financial.per_history));
  const marketDataDate = minDate([...klineDates, ...institutionalDates, ...marginDates, ...valuationDates]);
  const generatedAt = new Date().toISOString();

  const sources: SourceStatus[] = [
    sourceStatus("kline", "FinMind TaiwanStockPrice", klineDates, "top 30 companies by topic_count"),
    sourceStatus("institutional", "FinMind TaiwanStockInstitutionalInvestorsBuySell", institutionalDates, "top 30 companies by topic_count"),
    sourceStatus("margin", "FinMind TaiwanStockMarginPurchaseShortSale", marginDates, "top 30 companies by topic_count"),
    sourceStatus("valuation", "FinMind TaiwanStockPER", valuationDates, "top 30 companies by topic_count"),
    {
      module: "event-focus",
      source: eventFocus.source.name,
      latestDate: eventFocus.latestDate ?? "",
      status: eventFocus.status,
      scope: eventFocus.source.scope,
    },
    {
      module: "daily-analysis",
      source: "checked-in rule-batch analysis/index.json",
      latestDate: analysisIndex.generatedAt.slice(0, 10),
      status: analysisIndex.count > 0 ? "verified" : "empty",
      scope: `${analysisIndex.count} company analysis snapshots`,
    },
  ];

  const nextReport = {
    ...report,
    date: marketDataDate,
    weekday: weekdayZh(marketDataDate),
    freshness: {
      generatedAt,
      marketDataDate,
      eventDataDate: eventFocus.latestDate ?? "",
      analysisGeneratedAt: analysisIndex.generatedAt,
      sources,
    },
  };

  fs.writeFileSync(DAILY_REPORT_PATH, `${JSON.stringify(nextReport, null, 2)}\n`);
  console.log(`Updated ${path.relative(process.cwd(), DAILY_REPORT_PATH)} freshness metadata for market date ${marketDataDate}`);
}

main();
