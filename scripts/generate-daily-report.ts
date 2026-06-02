import fs from "node:fs";
import path from "node:path";
import { buildUnifiedSourceStatusRail, type SourceStatusRailItem } from "../src/lib/sourceStatusRail";

const COMPANIES_PATH = path.resolve("public/data/companies.json");
const FINANCIALS_DIR = path.resolve("public/data/financials");
const EVENT_FOCUS_PATH = path.resolve("public/data/event-focus.json");
const ANALYSIS_INDEX_PATH = path.resolve("public/data/analysis/index.json");
const DAILY_REPORT_PATH = path.resolve("public/data/daily-report.json");
const PRODUCT_KNOWLEDGE_DIR = path.resolve("public/data/product-knowledge");
const COMPANY_TOPIC_ROLES_DIR = path.resolve("public/data/company-topic-roles");
const COMPANY_SWOT_DIR = path.resolve("public/data/company-swot");

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

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function latestDate(rows: Array<{ date: string }> | undefined): string | undefined {
  return rows?.filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date;
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

function main() {
  const companies = readJson<CompanyPriority[]>(COMPANIES_PATH);
  const priorityCodes = companies
    .slice()
    .sort((a, b) => b.topic_count - a.topic_count || a.code.localeCompare(b.code))
    .slice(0, 30)
    .map((company) => company.code);
  const financials = loadPriorityFinancials(priorityCodes);
  const eventFocus = readJson<{ latestDate?: string; generatedAt: string; status: "verified" | "partial" | "empty"; itemCount: number; emptyReason?: string; source: { name: string; scope: string; semantics?: string } }>(EVENT_FOCUS_PATH);
  const analysisIndex = readJson<{ generatedAt: string; count: number }>(ANALYSIS_INDEX_PATH);
  const report = readJson<Record<string, unknown>>(DAILY_REPORT_PATH);

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
