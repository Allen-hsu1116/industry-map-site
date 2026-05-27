import assert from "node:assert/strict";
import test from "node:test";
import { buildLegacyKnowledgeInventory, normalizeCandidateToken, rankPilotCompanies } from "./legacyKnowledgeInventory";

const sampleIndustries = {
  topics: [
    {
      slug: "cowos-advanced-packaging",
      name: "先進封測｜AI 先進封裝 CoWoS",
      groups: [
        {
          name: "封裝材料與耗材",
          companies: [
            {
              code: "2330",
              name: "台積電",
              role: "CoWoS封裝核心代工",
              relevance: "高",
              products: ["CoWoS封裝量測方案", "CoWoS-S + HBM3E"],
              customers: ["NVIDIA", "AMD"],
              tech_focus: ["CoWoS/SoIC封裝後的AOI檢測"],
              swot: {
                strengths: ["封裝量測需求帶動者"],
                weaknesses: ["設備採購成本高"],
                opportunities: ["SoIC量產"],
                threats: ["設備供應商議價力"],
              },
            },
          ],
        },
      ],
    },
    {
      slug: "wafer-foundry",
      name: "半導體製造｜晶圓代工",
      groups: [
        {
          name: "晶圓代工",
          companies: [
            {
              code: "2330",
              name: "台積電",
              role: "先進製程龍頭",
              relevance: "高",
              products: ["N2製程：2026年量產", "CoWoS封裝量測方案"],
              customers: ["Apple"],
              tech_focus: ["2nm製程"],
            },
            {
              code: "2303",
              name: "聯電",
              role: "成熟製程晶圓代工",
              relevance: "中",
              products: ["成熟製程"],
            },
          ],
        },
      ],
    },
  ],
};

test("normalizeCandidateToken removes separators while preserving semantic text", () => {
  assert.equal(normalizeCandidateToken(" CoWoS-S + HBM3E "), "cowosshbm3e");
  assert.equal(normalizeCandidateToken("N2製程：2026年量產"), "n2製程2026年量產");
});

test("buildLegacyKnowledgeInventory aggregates company roles and product mentions deterministically", () => {
  const inventory = buildLegacyKnowledgeInventory(sampleIndustries);

  assert.equal(inventory.summary.topics, 2);
  assert.equal(inventory.summary.companyRoles, 3);
  assert.equal(inventory.summary.uniqueCompanies, 2);
  assert.equal(inventory.summary.productMentions, 5);
  assert.equal(inventory.summary.swotMentions, 4);

  const tsmc = inventory.companies.find((company) => company.code === "2330");
  assert.ok(tsmc);
  assert.equal(tsmc.topicCount, 2);
  assert.equal(tsmc.roleCount, 2);
  assert.equal(tsmc.productMentionCount, 4);
  assert.deepEqual(
    tsmc.productCandidates.map((product) => product.raw),
    ["CoWoS封裝量測方案", "CoWoS-S + HBM3E", "N2製程：2026年量產"],
  );
  assert.equal(tsmc.productCandidates[0].mentions, 2);
});

test("rankPilotCompanies prioritizes highly connected companies with products and SWOT", () => {
  const inventory = buildLegacyKnowledgeInventory(sampleIndustries);
  const ranked = rankPilotCompanies(inventory.companies, 1);

  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].code, "2330");
  assert.ok(ranked[0].priorityScore > 0);
  assert.ok(ranked[0].priorityReasons.some((reason) => reason.includes("2 topics")));
});
