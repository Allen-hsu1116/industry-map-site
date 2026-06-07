import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

interface DailyReportFreshness {
  generatedAt: string;
  marketDataDate: string;
  eventDataDate: string;
  analysisGeneratedAt: string;
  sources: Array<{ module: string; source: string; latestDate: string; status: string; scope: string }>;
}

function latestFinancialDate(): string {
  const companies = JSON.parse(fs.readFileSync("public/data/companies.json", "utf8")) as Array<{ code: string; topic_count: number }>;
  const topCodes = companies
    .slice()
    .sort((a, b) => b.topic_count - a.topic_count || a.code.localeCompare(b.code))
    .slice(0, 30)
    .map((company) => company.code);
  const dates = topCodes.map((code) => {
    const financial = JSON.parse(fs.readFileSync(`public/data/financials/${code}.json`, "utf8")) as {
      trends?: { daily_prices?: Array<{ date: string }> };
      institutional_history?: Array<{ date: string }>;
      margin_history?: Array<{ date: string }>;
      per_history?: Array<{ date: string }>;
    };
    return [
      financial.trends?.daily_prices?.at(-1)?.date,
      financial.institutional_history?.at(-1)?.date,
      financial.margin_history?.at(-1)?.date,
      financial.per_history?.at(-1)?.date,
    ].filter(Boolean).sort().at(0);
  }).filter((date): date is string => Boolean(date));
  return dates.sort().at(0) ?? "";
}

test("daily refresh workflow regenerates the checked-in daily report after analysis", () => {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

  assert.equal(packageJson.scripts["report:daily"], "tsx scripts/generate-daily-report.ts");
  assert.equal(packageJson.scripts["report:market-indicators"], "tsx scripts/generate-market-indicator-strip.ts");
  assert.equal(packageJson.scripts["report:strong-stocks"], "tsx scripts/generate-strong-stock-ranking.ts");
  assert.equal(packageJson.scripts["report:large-holders"], "tsx scripts/generate-large-holder-ranking.ts");
  assert.equal(packageJson.scripts["data:large-holders:update"], "tsx scripts/update-large-holder-sample.ts");
  const refresh = packageJson.scripts["data:daily-refresh"];
  assert.ok(refresh.includes("data:large-holders:update -- --limit=30 && npm run data:event-focus:update"));
  assert.ok(refresh.includes("analysis:daily && npm run report:market-indicators && npm run report:strong-stocks && npm run report:large-holders && npm run report:daily && npm run knowledge:validate"));
});

test("daily report page renders freshness source-status metadata", () => {
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");

  assert.match(page, /interface DailyReportFreshness/);
  assert.match(page, /資料狀態/);
  assert.match(page, /marketDataDate/);
  assert.match(page, /eventDataDate/);
  assert.match(page, /analysisGeneratedAt/);
});

test("checked-in daily report exposes explicit freshness metadata aligned with market and event feeds", () => {
  const report = JSON.parse(fs.readFileSync("public/data/daily-report.json", "utf8")) as { date: string; freshness?: DailyReportFreshness };
  const eventFocus = JSON.parse(fs.readFileSync("public/data/event-focus.json", "utf8")) as { latestDate: string; source: string; status: string };
  const latestMarketDate = latestFinancialDate();

  assert.ok(report.freshness, "daily report must expose freshness metadata");
  assert.equal(report.date, latestMarketDate);
  assert.equal(report.freshness?.marketDataDate, latestMarketDate);
  assert.equal(report.freshness?.eventDataDate, eventFocus.latestDate);
  assert.match(report.freshness?.generatedAt ?? "", /^\d{4}-\d{2}-\d{2}T/);
  assert.match(report.freshness?.analysisGeneratedAt ?? "", /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(
    report.freshness?.sources.map((source) => source.module).sort(),
    ["company-swot", "company-topic-roles", "daily-analysis", "event-focus", "institutional", "kline", "margin", "market-indicator-strip", "product-knowledge", "valuation"].sort(),
  );
  assert.ok(report.freshness?.sources.every((source) => source.source && source.status && source.scope));
  assert.ok(report.freshness?.sources.some((source) => "warning" in source || "emptyReason" in source));
});
