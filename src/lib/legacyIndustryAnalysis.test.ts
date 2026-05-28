import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildLegacyCompanyAnalysisFallbacks, mergeLegacyCompanyAnalysisFallback } from "./legacyIndustryAnalysis";

const rawIndustries = {
  topics: [
    {
      slug: "ai_server",
      name: "AI 伺服器",
      groups: [
        {
          name: "電源供應鏈",
          companies: [
            {
              code: "2308",
              name: "台達電",
              role: "高效電源與散熱解決方案供應商",
              relevance: "高",
              products: ["資料中心電源", "液冷散熱"],
              customers: ["雲端資料中心客戶"],
              tech_focus: ["高功率密度電源", "液冷熱管理"],
              swot: {
                strengths: ["電源與熱管理產品線完整"],
                opportunities: ["AI 資料中心功率密度提高"],
              },
            },
          ],
        },
      ],
    },
    {
      slug: "ev_charging",
      name: "充電樁",
      groups: [
        {
          name: "充電設備",
          companies: [
            {
              code: "2308",
              name: "台達電",
              role: "充電設備供應商",
              relevance: "中",
              products: ["EV 充電樁"],
              customers: ["充電營運商"],
              tech_focus: [],
              swot: {
                threats: ["建置節奏受政策與資本支出影響"],
              },
            },
          ],
        },
      ],
    },
  ],
};

describe("buildLegacyCompanyAnalysisFallbacks", () => {
  it("converts legacy industries.json roles into per-company industry_analysis fallback", () => {
    const fallback = buildLegacyCompanyAnalysisFallbacks(rawIndustries).get("2308");

    assert.ok(fallback);
    assert.deepEqual(fallback.products, ["資料中心電源", "液冷散熱", "EV 充電樁"]);
    assert.deepEqual(fallback.customers, ["雲端資料中心客戶", "充電營運商"]);
    assert.equal(fallback.industry_analysis.ai_server.market_position, "高");
    assert.equal(fallback.industry_analysis.ai_server.market_position_detail, "高效電源與散熱解決方案供應商");
    assert.deepEqual(fallback.industry_analysis.ai_server.swot?.strengths, ["電源與熱管理產品線完整"]);
    assert.deepEqual(fallback.industry_analysis.ev_charging.swot?.threats, ["建置節奏受政策與資本支出影響"]);
  });

  it("keeps explicit financial input as source of truth when merging fallback", () => {
    const fallback = buildLegacyCompanyAnalysisFallbacks(rawIndustries).get("2308");
    const merged = mergeLegacyCompanyAnalysisFallback(
      {
        code: "2308",
        name: "台達電",
        products: ["既有產品"],
        industry_analysis: {
          ai_server: {
            market_position: "explicit high",
            products: ["明確產品"],
          },
        },
      },
      fallback,
    );

    assert.deepEqual(merged.products, ["既有產品", "資料中心電源", "液冷散熱", "EV 充電樁"]);
    assert.equal(merged.industry_analysis?.ai_server.market_position, "explicit high");
    assert.deepEqual(merged.industry_analysis?.ai_server.products, ["明確產品"]);
    assert.equal(merged.industry_analysis?.ev_charging.market_position_detail, "充電設備供應商");
  });
});
