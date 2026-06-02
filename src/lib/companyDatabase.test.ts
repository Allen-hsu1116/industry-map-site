import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildCompanyDatabase, type CompanyDatabaseInput } from "./companyDatabase";

const baseInput: CompanyDatabaseInput = {
  companies: [
    { code: "2330", name: "台積電", topic_count: 2, topics: ["ai-server", "advanced-packaging"] },
    { code: "9999", name: "測試空資料", topic_count: 1, topics: ["ai-server"] },
    { code: "2303", name: "聯電", topic_count: 1, topics: ["wafer-foundry"] },
  ],
  topicMap: {
    generatedAt: "2026-06-02",
    source: "canonical-topic-map",
    topics: [
      { slug: "ai-server", name: "AI 伺服器", groups: [{ name: "主機板", level: "midstream", companies: [{ code: "2330", name: "台積電" }, { code: "9999", name: "測試空資料" }] }] },
      { slug: "advanced-packaging", name: "先進封裝與 CoWoS", groups: [{ name: "封裝平台", level: "midstream", companies: [{ code: "2330", name: "台積電" }] }] },
      { slug: "wafer-foundry", name: "晶圓代工", groups: [{ name: "晶圓製造", level: "midstream", companies: [{ code: "2303", name: "聯電" }] }] },
    ],
  },
  productKnowledgeByCode: new Map([
    ["2330", { updatedAt: "2026-05-27", productCount: 2 }],
  ]),
  topicRolesByCode: new Map([
    ["2330", { updatedAt: "2026-05-31", verifiedCount: 2, candidateCount: 1, rejectedCount: 0, highestConfidence: "high" }],
    ["2303", { updatedAt: "2026-05-30", verifiedCount: 0, candidateCount: 1, rejectedCount: 0, highestConfidence: "low" }],
  ]),
  swotByCode: new Map([
    ["2330", { updatedAt: "2026-05-28", verifiedCount: 4, itemCount: 4, categories: ["strength", "weakness", "opportunity", "threat"] }],
    ["2303", { updatedAt: "2026-05-28", verifiedCount: 1, itemCount: 2, categories: ["strength", "threat"] }],
  ]),
  financialsByCode: new Map([
    ["2330", { lastUpdated: "2026-06-02", latestPriceDate: "2026-06-02", latestChipDate: "2026-06-02", latestValuationDate: "2026-06-02" }],
    ["2303", { lastUpdated: "2026-05-21", latestPriceDate: "2026-05-20", latestChipDate: "2026-05-20", latestValuationDate: "2026-05-20" }],
  ]),
  latestMarketDate: "2026-06-02",
};

test("buildCompanyDatabase derives rows with topics, market freshness, source status, and knowledge coverage", () => {
  const database = buildCompanyDatabase(baseInput);

  assert.equal(database.status, "partial");
  assert.equal(database.summary.totalCompanies, 3);
  assert.equal(database.summary.freshMarketFeedCount, 1);
  assert.equal(database.summary.emptyKnowledgeCount, 1);

  const tsmc = database.rows.find((row) => row.code === "2330");
  assert.ok(tsmc);
  assert.equal(tsmc.coverageGrade, "A");
  assert.equal(tsmc.marketFreshness.status, "fresh");
  assert.equal(tsmc.roleConfidence, "high");
  assert.deepEqual(tsmc.topics.map((topic) => topic.id), ["advanced-packaging", "ai-server"]);
  assert.equal(tsmc.sourceStatus.status, "verified");
  assert.match(tsmc.sourceStatus.note, /derived from checked-in/);

  const empty = database.rows.find((row) => row.code === "9999");
  assert.ok(empty);
  assert.equal(empty.coverageGrade, "F");
  assert.equal(empty.marketFreshness.status, "missing");
  assert.equal(empty.sourceStatus.status, "empty");
  assert.match(empty.emptyReason ?? "", /尚無可驗證/);
});

test("buildCompanyDatabase filters by search, topic, confidence, coverage, freshness, and source status", () => {
  assert.deepEqual(buildCompanyDatabase(baseInput, { search: "台積" }).rows.map((row) => row.code), ["2330"]);
  assert.deepEqual(buildCompanyDatabase(baseInput, { topic: "advanced-packaging" }).rows.map((row) => row.code), ["2330"]);
  assert.deepEqual(buildCompanyDatabase(baseInput, { roleConfidence: "low" }).rows.map((row) => row.code), ["2303"]);
  assert.deepEqual(buildCompanyDatabase(baseInput, { coverageGrade: "F" }).rows.map((row) => row.code), ["9999"]);
  assert.deepEqual(buildCompanyDatabase(baseInput, { marketFreshness: "stale" }).rows.map((row) => row.code), ["2303"]);
  assert.deepEqual(buildCompanyDatabase(baseInput, { sourceStatus: "empty" }).rows.map((row) => row.code), ["9999"]);
});

test("buildCompanyDatabase exposes filter options and honest source rail", () => {
  const database = buildCompanyDatabase(baseInput);

  assert.deepEqual(database.filters.topics.map((topic) => topic.id), ["advanced-packaging", "ai-server", "wafer-foundry"]);
  assert.equal(database.sourceStatus.sources.find((source) => source.name === "financials")?.scope, "2 / 3 companies with market/chip data");
  assert.equal(database.sourceStatus.sources.find((source) => source.name === "product-knowledge")?.scope, "1 / 3 companies with product files");
  assert.equal(database.sourceStatus.sources.find((source) => source.name === "company-topic-roles")?.status, "partial");
});

test("checked-in company database page uses the view model and exposes source/freshness filters", () => {
  const pageSource = fs.readFileSync("src/app/companies/page.tsx", "utf8");
  const homeSource = fs.readFileSync("src/app/page.tsx", "utf8");

  assert.match(pageSource, /buildCompanyDatabase/);
  assert.match(pageSource, /financials/);
  assert.match(pageSource, /product-knowledge/);
  assert.match(pageSource, /company-topic-roles/);
  assert.match(pageSource, /company-swot/);
  const clientSource = fs.readFileSync("src/app/companies/CompaniesClient.tsx", "utf8");
  assert.match(clientSource, /useSearchParams/);
  assert.match(clientSource, /name=\"freshness\"/);
  assert.match(clientSource, /name=\"grade\"/);
  assert.match(clientSource, /source rail/);
  assert.match(homeSource, /href=\"\/companies\"/);
});
