import { test } from "node:test";
import assert from "node:assert/strict";
import { directnessLabel, directnessToRelevance, normalizeCompanyTopicRoles } from "./companyTopicRoles";
import { normalizeCanonicalTopics } from "./canonicalTopics";

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

test("company-topic-role batch covers at least 20 companies and maps to canonical topics", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = "public/data/company-topic-roles";
  const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  const canonicalRaw = JSON.parse(await fs.readFile("public/data/canonical-topics.json", "utf8"));
  const canonical = normalizeCanonicalTopics(canonicalRaw);

  assert.ok(canonical);
  assert.ok(files.length >= 20, `Expected at least 20 company-topic role files, got ${files.length}`);
  const canonicalTopicIds = new Set(canonical.topics.flatMap((topic) => [topic.id, ...topic.legacyTopicIds]));

  for (const file of files) {
    const raw = JSON.parse(await fs.readFile(path.join(dir, file), "utf8"));
    const knowledge = normalizeCompanyTopicRoles(raw);
    assert.ok(knowledge, `${file} should normalize`);
    assert.ok(knowledge.roles.length > 0, `${file} should contain roles`);
    for (const role of knowledge.roles) {
      assert.ok(canonicalTopicIds.has(role.topicId), `${file} role ${role.topicId} should map to a canonical topic`);
      if (role.confidence === "high" || role.confidence === "medium") {
        assert.ok(role.evidence.length > 0, `${file} role ${role.topicId} needs evidence`);
        assert.ok(role.lastVerified, `${file} role ${role.topicId} needs lastVerified`);
      }
    }
  }
});

test("Step 17 company-topic-role batch covers top high-priority companies with verified evidence-backed roles", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = "public/data/company-topic-roles";
  const batchCodes = ["6147", "3035", "4966", "6239", "8299", "3311", "2453", "3081", "2059", "3529", "6175", "3037"];

  for (const code of batchCodes) {
    const raw = JSON.parse(await fs.readFile(path.join(dir, `${code}.json`), "utf8"));
    const knowledge = normalizeCompanyTopicRoles(raw);
    assert.ok(knowledge, `${code}.json should normalize`);
    assert.equal(knowledge.companyCode, code);
    assert.ok(knowledge.roles.length >= 1, `${code} should include at least one topic role`);
    assert.ok(knowledge.roles.some((role) => role.status === "verified" && role.evidence.length > 0 && role.lastVerified), `${code} should include verified evidence-backed roles`);
    for (const role of knowledge.roles) {
      assert.ok(role.products.length > 0, `${code} ${role.topicId} should list related products`);
      assert.ok(role.roleSummary.length >= 30, `${code} ${role.topicId} should explain company role`);
    }
  }
});
