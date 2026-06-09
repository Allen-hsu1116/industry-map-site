import assert from "node:assert/strict";
import test from "node:test";
import { buildCompanyEditorialBrief } from "./view-models/companyEditorialBrief";

function baseAnalysis(overrides: Record<string, unknown> = {}) {
  return {
    generatedAt: "2026-06-09T13:02:29.650Z",
    technical: {
      summary: "技術摘要",
      signals: ["均線結構偏震盪，尚未形成明確排列"],
      risks: [],
      watch: ["短線支撐/壓力先看 MA5：2355.00"],
    },
    chips: {
      summary: "籌碼摘要",
      signals: ["外資買超回溫"],
      risks: [],
      watch: [],
    },
    industry: {
      roleDetail: { roleSummary: "先進製程與晶圓代工核心供應者" },
      risks: [],
      watch: [],
    },
    scoring: {
      riskGates: [{ id: "quality-f", severity: "hard", message: "AnalysisQuality F 不可列入 Top recommendation" }],
    },
    nextSession: {
      focus: ["觀察先進製程需求是否延續"],
    },
    ...overrides,
  };
}

function baseIndustryInsights(overrides: Record<string, unknown> = {}) {
  return {
    panels: {
      topicRoles: {
        items: [
          {
            status: "verified",
            roleSummary: "verified topic role summary",
          },
        ],
      },
      products: {
        items: [
          {
            whyItMatters: "product why-it-matters fallback",
          },
        ],
      },
      swot: {
        groups: {
          weaknesses: [{ statement: "毛利率受價格競爭影響" }],
          threats: [{ statement: "地緣政治風險" }],
        },
      },
    },
    sourceStatus: [
      {
        label: "題材角色",
        status: "verified",
        latestVerifiedAt: "2026-06-01",
        source: "company-topic-roles json",
      },
    ],
    ...overrides,
  };
}

test("company editorial brief view model preserves happy-path priority and source semantics", () => {
  const brief = buildCompanyEditorialBrief({
    data: {
      updatedAt: "2026-06-01",
      institutional: { date: "2026-06-08" },
      margin_history: [],
    },
    analysis: baseAnalysis(),
    industryInsights: baseIndustryInsights(),
    latestKLineDate: "2026-06-09",
  });

  assert.deepEqual(
    brief.items.map((item: { label: string }) => item.label),
    ["What changed today?", "Long-term role", "Biggest risk", "Watch next"],
  );
  assert.equal(brief.items[0].value, "均線結構偏震盪，尚未形成明確排列");
  assert.equal(brief.items[1].value, "verified topic role summary");
  assert.equal(brief.items[2].value, "AnalysisQuality F 不可列入 Top recommendation");
  assert.equal(brief.items[3].value, "觀察先進製程需求是否延續");
  assert.deepEqual(brief.approvedSections, ["Overview", "Daily AI Analysis", "Fundamentals", "Technicals", "Chip / Ownership", "News / Events", "Products", "Topic Roles", "SWOT", "Sources"]);
  assert.deepEqual(brief.sources.slice(0, 4), [
    { label: "Daily AI Analysis", status: "AI-derived", freshness: "2026-06-09T13:02:29.650Z", source: "rule-batch daily analysis artifact" },
    { label: "Fundamentals", status: "checked-in evidence", freshness: "2026-06-01", source: "financial JSON / MOPS-derived fields" },
    { label: "Technicals", status: "checked-in market data", freshness: "2026-06-09", source: "daily K-line history" },
    { label: "Chip / Ownership", status: "checked-in market data", freshness: "2026-06-08", source: "institutional / margin feeds" },
  ]);
});

test("company editorial brief view model preserves insufficient-data fallback text", () => {
  const brief = buildCompanyEditorialBrief({
    data: {
      updatedAt: "2026-06-01",
      margin_history: [],
    },
    analysis: baseAnalysis({
      technical: { summary: "", signals: [], risks: [], watch: [] },
      chips: { summary: "", signals: [], risks: [], watch: [] },
      industry: { risks: [], watch: [] },
      scoring: { riskGates: [] },
      nextSession: { focus: [] },
    }),
    industryInsights: baseIndustryInsights({
      panels: {
        topicRoles: { items: [] },
        products: { items: [] },
        swot: { groups: { weaknesses: [], threats: [] } },
      },
      sourceStatus: [
        { label: "產品知識", status: "empty", latestVerifiedAt: null, source: "company-product-knowledge json" },
      ],
    }),
    latestKLineDate: null,
  });

  assert.equal(brief.items[0].value, "今日變化資料不足；只顯示已載入的行情、技術與籌碼欄位，不補 AI 結論。");
  assert.equal(brief.items[1].value, "尚未建立 verified topic role；不可把同漲題材視為公司長期角色。");
  assert.equal(brief.items[2].value, "尚無已驗證風險；請看 SWOT 與 source rail 的 partial/empty 狀態。");
  assert.equal(brief.items[3].value, "等待下一筆可信市場資料、公司公告或已驗證題材角色更新。");
  assert.deepEqual(brief.sources.slice(2, 4), [
    { label: "Technicals", status: "partial", freshness: "unknown", source: "daily K-line history" },
    { label: "Chip / Ownership", status: "partial", freshness: "unknown", source: "institutional / margin feeds" },
  ]);
  assert.equal(brief.sources.at(-1)?.status, "empty");
});
