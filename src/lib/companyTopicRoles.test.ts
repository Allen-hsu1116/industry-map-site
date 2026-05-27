import { test } from "node:test";
import assert from "node:assert/strict";
import { directnessLabel, directnessToRelevance, normalizeCompanyTopicRoles } from "./companyTopicRoles";

test("normalizeCompanyTopicRoles keeps verified evidence-backed roles and sorts by topic", () => {
  const knowledge = normalizeCompanyTopicRoles({
    schemaVersion: 1,
    companyCode: "2308",
    companyName: "台達電",
    updatedAt: "2026-05-28",
    roles: [
      {
        topicId: "psu",
        topicName: "電子零組件｜電源供應器",
        topicType: "product",
        directness: "core",
        supplyChainStage: "power",
        roleType: "power_supply_provider",
        roleSummary: "台達電提供電源供應系統。",
        products: ["電源供應系統與高效電源"],
        evidence: [{ sourceId: "delta-power", publisher: "台達", title: "產品", url: "https://example.com", claim: "台達列出電源產品。" }],
        confidence: "high",
        lastVerified: "2026-05-28",
        status: "verified",
      },
      { topicId: "broken", topicType: "nonsense" },
    ],
  });

  assert.ok(knowledge);
  assert.equal(knowledge.companyCode, "2308");
  assert.equal(knowledge.roles.length, 1);
  assert.equal(knowledge.roles[0].topicId, "psu");
  assert.equal(knowledge.roles[0].evidence[0].sourceId, "delta-power");
});

test("directness helpers expose UI-friendly relevance and labels", () => {
  assert.equal(directnessToRelevance("core"), "high");
  assert.equal(directnessToRelevance("supplier"), "medium");
  assert.equal(directnessToRelevance("indirect"), "low");
  assert.equal(directnessLabel("direct_enabler"), "直接賦能角色");
});

test("normalizeCompanyTopicRoles rejects files with wrong schema", () => {
  assert.equal(normalizeCompanyTopicRoles({ schemaVersion: 2 }), null);
});
