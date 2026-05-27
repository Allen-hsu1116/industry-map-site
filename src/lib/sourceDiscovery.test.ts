import assert from "node:assert/strict";
import test from "node:test";
import { buildSourceDiscoveryPlan, defaultSourceCandidatesForCompany } from "./sourceDiscovery";

const pilotCompanies = [
  {
    rank: 1,
    code: "2330",
    name: "台積電",
    priorityScore: 340,
    priorityReasons: ["11 topics"],
    topicCount: 11,
    roleCount: 11,
    productMentionCount: 44,
    swotMentionCount: 88,
    topics: ["cowos-advanced-packaging", "wafer-foundry"],
    topProductCandidates: [{ raw: "CoWoS 先進封裝", normalized: "cowos先進封裝", mentions: 11, topics: ["cowos-advanced-packaging"] }],
  },
];

test("defaultSourceCandidatesForCompany orders evidence sources by trust priority", () => {
  const sources = defaultSourceCandidatesForCompany("2330", "台積電");

  assert.deepEqual(
    sources.map((source) => source.sourceKind),
    [
      "company_official",
      "mops_financial_reports",
      "mops_major_news",
      "mops_monthly_revenue",
      "finmind_financial_statements",
      "finmind_revenue_history",
      "finmind_market_data",
    ],
  );
  assert.equal(sources[0].status, "needs_discovery");
  assert.equal(sources[1].status, "queryable");
  assert.equal(sources[1].publisher, "公開資訊觀測站 MOPS");
  assert.equal(sources[4].publisher, "FinMind");
});

test("buildSourceDiscoveryPlan preserves pilot priority and marks extraction intent", () => {
  const plan = buildSourceDiscoveryPlan(pilotCompanies, "2026-05-27T00:00:00.000Z");

  assert.equal(plan.generatedAt, "2026-05-27T00:00:00.000Z");
  assert.equal(plan.summary.companies, 1);
  assert.equal(plan.summary.sourceCandidates, 7);
  assert.equal(plan.companies[0].code, "2330");
  assert.equal(plan.companies[0].sourceCandidates[0].extractionIntent, "official product and business description");
  assert.deepEqual(plan.companies[0].topics, ["cowos-advanced-packaging", "wafer-foundry"]);
  assert.deepEqual(plan.companies[0].productsToVerify, ["CoWoS 先進封裝"]);
});
