import assert from "node:assert/strict";
import { describe, it, test } from "node:test";

import { groupCompanySwot, normalizeCompanySwot, selectTopicSwotItems, type CompanySwotKnowledge } from "./companySwot";

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

test("company-swot batch covers at least 20 companies with all SWOT categories", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = "public/data/company-swot";
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".json")).sort();

  assert.ok(files.length >= 20, `Expected at least 20 company-swot files, got ${files.length}`);

  for (const file of files) {
    const raw = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
    const knowledge = normalizeCompanySwot(raw);
    assert.ok(knowledge, `${file} should normalize`);
    const categories = new Set(knowledge.items.filter((item) => item.status !== "rejected").map((item) => item.category));
    assert.ok(categories.has("strength"), `${file} should include strength`);
    assert.ok(categories.has("weakness"), `${file} should include weakness`);
    assert.ok(categories.has("opportunity"), `${file} should include opportunity`);
    assert.ok(categories.has("threat"), `${file} should include threat`);
    for (const item of knowledge.items) {
      if (item.confidence === "high" || item.confidence === "medium") {
        assert.ok(item.evidence.length > 0, `${file} item ${item.id} needs evidence`);
        assert.ok(item.lastVerified, `${file} item ${item.id} needs lastVerified`);
      }
    }
  }
});

test("Step 18 company SWOT batch covers top high-priority companies with evidence-backed full SWOT", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = "public/data/company-swot";
  const batchCodes = ["6147", "3035", "4966", "6239", "8299", "3311", "2453", "3081", "2059", "3529", "6175", "3037"];

  for (const code of batchCodes) {
    const raw = JSON.parse(await fs.readFile(path.join(dir, `${code}.json`), "utf8"));
    const knowledge = normalizeCompanySwot(raw);
    assert.ok(knowledge, `${code}.json should normalize`);
    assert.equal(knowledge.companyCode, code);
    const activeItems = knowledge.items.filter((item) => item.status !== "rejected");
    const categories = new Set(activeItems.map((item) => item.category));
    assert.deepEqual([...categories].sort(), ["opportunity", "strength", "threat", "weakness"], `${code} should include S/W/O/T`);
    for (const item of activeItems) {
      assert.ok(item.evidence.length > 0, `${code} ${item.id} needs evidence`);
      assert.ok(item.lastVerified, `${code} ${item.id} needs lastVerified`);
      assert.ok(item.statement.length >= 20, `${code} ${item.id} needs a concrete statement`);
      assert.ok(item.rationale.length >= 30, `${code} ${item.id} needs rationale`);
    }
  }
});

const topicScopedKnowledge: CompanySwotKnowledge = {
  schemaVersion: 1,
  companyCode: "2308",
  companyName: "台達電",
  updatedAt: "2026-05-28",
  items: [
    {
      id: "strength-liquid-cooling",
      category: "strength",
      statement: "液冷與電源組合完整",
      rationale: "official evidence",
      timeHorizon: "structural",
      relatedTopicIds: ["ai-server-liquid-cooling"],
      evidence: [],
      confidence: "high",
      lastVerified: "2026-05-28",
      status: "verified",
    },
    {
      id: "strength-psu",
      category: "strength",
      statement: "電源供應器產品線完整",
      rationale: "official evidence",
      timeHorizon: "structural",
      relatedTopicIds: ["psu"],
      evidence: [],
      confidence: "high",
      lastVerified: "2026-05-28",
      status: "verified",
    },
    {
      id: "weakness-company-wide",
      category: "weakness",
      statement: "題材營收占比需驗證",
      rationale: "topic attribution risk",
      timeHorizon: "structural",
      relatedTopicIds: [],
      evidence: [],
      confidence: "medium",
      lastVerified: "2026-05-28",
      status: "verified",
    },
  ],
};

describe("selectTopicSwotItems", () => {
  it("matches SWOT items through canonical topic aliases instead of falling back to all items", () => {
    const grouped = groupCompanySwot(topicScopedKnowledge);

    const selected = selectTopicSwotItems(grouped, "strengths", ["liquid_cooling_advanced", "ai-server-liquid-cooling"]);

    assert.deepEqual(selected.map((item) => item.id), ["strength-liquid-cooling"]);
  });

  it("keeps company-wide SWOT items for any topic", () => {
    const grouped = groupCompanySwot(topicScopedKnowledge);

    const selected = selectTopicSwotItems(grouped, "weaknesses", ["liquid_cooling_advanced", "ai-server-liquid-cooling"]);

    assert.deepEqual(selected.map((item) => item.id), ["weakness-company-wide"]);
  });

  it("falls back to the category when no topic-specific item matches", () => {
    const grouped = groupCompanySwot(topicScopedKnowledge);

    const selected = selectTopicSwotItems(grouped, "strengths", ["unmapped-topic"]);

    assert.deepEqual(selected.map((item) => item.id), ["strength-liquid-cooling", "strength-psu"]);
  });
});
