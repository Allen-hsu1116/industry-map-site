import { test } from "node:test";
import assert from "node:assert/strict";
import { groupCompanySwot, normalizeCompanySwot } from "./companySwot";

test("normalizeCompanySwot keeps evidence-backed items and sorts by category/id", () => {
  const knowledge = normalizeCompanySwot({
    schemaVersion: 1,
    companyCode: "2308",
    companyName: "台達電",
    updatedAt: "2026-05-28",
    items: [
      {
        id: "opportunity-ai-power",
        category: "opportunity",
        statement: "AI 伺服器高功率化提升電源與散熱需求。",
        rationale: "資料中心產品線與 AI 伺服器電源題材有直接關聯。",
        timeHorizon: "medium_term",
        relatedTopicIds: ["ai-server-liquid-cooling"],
        evidence: [{ sourceId: "delta-data-center-products", publisher: "台達", title: "資料中心", url: "https://example.com", claim: "台達列出資料中心產品。" }],
        confidence: "high",
        lastVerified: "2026-05-28",
        status: "verified",
      },
      { id: "broken", category: "invalid", statement: "bad" },
      {
        id: "strength-power-portfolio",
        category: "strength",
        statement: "電源及系統產品組合完整。",
        rationale: "官方產品頁列出多種電源及系統產品。",
        timeHorizon: "structural",
        relatedTopicIds: ["psu"],
        evidence: [{ sourceId: "delta-power-and-system-products", publisher: "台達", title: "產品", url: "https://example.com", claim: "台達列出電源及系統產品。" }],
        confidence: "high",
        lastVerified: "2026-05-28",
        status: "verified",
      },
    ],
  });

  assert.ok(knowledge);
  assert.equal(knowledge.companyCode, "2308");
  assert.equal(knowledge.items.length, 2);
  assert.deepEqual(knowledge.items.map((item) => item.id), ["opportunity-ai-power", "strength-power-portfolio"]);
  assert.equal(knowledge.items[0].evidence[0].sourceId, "delta-data-center-products");
});

test("groupCompanySwot groups non-rejected items for UI rendering", () => {
  const knowledge = normalizeCompanySwot({
    schemaVersion: 1,
    companyCode: "3017",
    companyName: "奇鋐",
    updatedAt: "2026-05-28",
    items: [
      { id: "s", category: "strength", statement: "散熱產品線完整。", rationale: "官方資料支持。", timeHorizon: "structural", relatedTopicIds: [], evidence: [], confidence: "medium", lastVerified: "2026-05-28", status: "verified" },
      { id: "w", category: "weakness", statement: "需持續驗證液冷收入占比。", rationale: "公開資訊粒度不足。", timeHorizon: "medium_term", relatedTopicIds: [], evidence: [], confidence: "medium", lastVerified: "2026-05-28", status: "verified" },
      { id: "o", category: "opportunity", statement: "AI 熱設計功耗上升。", rationale: "散熱需求受益。", timeHorizon: "medium_term", relatedTopicIds: [], evidence: [], confidence: "medium", lastVerified: "2026-05-28", status: "verified" },
      { id: "t", category: "threat", statement: "競爭加劇。", rationale: "需觀察同業。", timeHorizon: "medium_term", relatedTopicIds: [], evidence: [], confidence: "medium", lastVerified: "2026-05-28", status: "verified" },
      { id: "x", category: "threat", statement: "拒絕項目。", rationale: "不採用。", timeHorizon: "event_driven", relatedTopicIds: [], evidence: [], confidence: "low", lastVerified: null, status: "rejected" },
    ],
  });

  const grouped = groupCompanySwot(knowledge);
  assert.equal(grouped.strengths.length, 1);
  assert.equal(grouped.weaknesses.length, 1);
  assert.equal(grouped.opportunities.length, 1);
  assert.equal(grouped.threats.length, 1);
  assert.equal(grouped.threats[0].id, "t");
});

test("normalizeCompanySwot rejects files with wrong schema", () => {
  assert.equal(normalizeCompanySwot({ schemaVersion: 2 }), null);
});
