import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildUnifiedSourceStatusRail, type SourceStatusRailInput } from "./sourceStatusRail";

const baseInput: SourceStatusRailInput = {
  totalCompanies: 4,
  priorityCompanyCount: 3,
  marketModules: [
    {
      module: "kline",
      source: "FinMind TaiwanStockPrice",
      scope: "top 3 companies by topic_count",
      datesByCompany: new Map([
        ["2330", "2026-06-02"],
        ["2303", "2026-06-02"],
        ["2454", "2026-06-02"],
      ]),
    },
    {
      module: "margin",
      source: "FinMind TaiwanStockMarginPurchaseShortSale",
      scope: "top 3 companies by topic_count",
      datesByCompany: new Map([
        ["2330", "2026-06-01"],
        ["2303", "2026-06-01"],
      ]),
    },
  ],
  eventFocus: {
    source: "TWSE OpenAPI t187ap04_L",
    latestDate: "2026-06-01",
    status: "partial",
    scope: "listed-company-major-news",
    itemCount: 8,
    warning: "official subject preserved; topic mapping is derived, not official",
  },
  dailyAnalysis: {
    source: "checked-in rule-batch analysis/index.json",
    latestDate: "2026-06-02",
    count: 4,
  },
  knowledgeModules: [
    {
      module: "product-knowledge",
      source: "checked-in product-knowledge/*.json",
      count: 2,
      latestDate: "2026-05-28",
    },
    {
      module: "company-topic-roles",
      source: "checked-in company-topic-roles/*.json",
      count: 0,
      latestDate: "",
    },
  ],
};

test("buildUnifiedSourceStatusRail derives market, event, analysis, and knowledge module status from data counts", () => {
  const rail = buildUnifiedSourceStatusRail(baseInput);

  assert.equal(rail.status, "partial");
  assert.equal(rail.summary.verified, 2);
  assert.equal(rail.summary.partial, 3);
  assert.equal(rail.summary.empty, 1);

  const kline = rail.items.find((item) => item.module === "kline");
  assert.ok(kline);
  assert.equal(kline.status, "verified");
  assert.equal(kline.latestDate, "2026-06-02");
  assert.equal(kline.scope, "top 3 companies by topic_count · coverage 3 / 3");
  assert.equal(kline.warning, undefined);

  const margin = rail.items.find((item) => item.module === "margin");
  assert.ok(margin);
  assert.equal(margin.status, "partial");
  assert.equal(margin.latestDate, "2026-06-01");
  assert.match(margin.warning ?? "", /coverage 2 \/ 3/);

  const product = rail.items.find((item) => item.module === "product-knowledge");
  assert.ok(product);
  assert.equal(product.status, "partial");
  assert.equal(product.scope, "checked-in company knowledge files · coverage 2 / 4");
  assert.match(product.warning ?? "", /不是全市場覆蓋/);

  const topicRoles = rail.items.find((item) => item.module === "company-topic-roles");
  assert.ok(topicRoles);
  assert.equal(topicRoles.status, "empty");
  assert.equal(topicRoles.emptyReason, "尚無 company-topic-roles 可驗證檔案；題材角色不可用 AI 補假資料。");
});

test("checked-in daily report uses the unified source-status rail and covers Slice 6 modules", () => {
  const report = JSON.parse(fs.readFileSync("public/data/daily-report.json", "utf8")) as {
    freshness?: { sources?: Array<{ module: string; warning?: string; emptyReason?: string }> };
  };
  const modules = (report.freshness?.sources ?? []).map((source) => source.module).sort();

  assert.deepEqual(
    modules,
    ["company-swot", "company-topic-roles", "daily-analysis", "event-focus", "institutional", "kline", "margin", "market-indicator-strip", "product-knowledge", "valuation"].sort(),
  );

  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");
  assert.match(page, /warning/);
  assert.match(page, /emptyReason/);
  assert.match(page, /Unified source-status rail/);
});
