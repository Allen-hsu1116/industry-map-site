import assert from "node:assert/strict";
import test from "node:test";
import { buildKnowledgeCoverageReport, type KnowledgeCoverageInput } from "./knowledgeCoverage";

function baseInput(overrides: Partial<KnowledgeCoverageInput["companies"][number]> = {}): KnowledgeCoverageInput {
  return {
    companies: [{ code: "9999", name: "測試股", topics: ["ai-server"], ...overrides }],
    analysisByCode: {},
    productKnowledgeCodes: new Set(),
    topicRoleByCode: new Map(),
    swotByCode: new Map(),
  };
}

test("buildKnowledgeCoverageReport grades complete evidence-backed companies as A", () => {
  const input = baseInput();
  input.analysisByCode["9999"] = {
    label: "核心題材受惠",
    knowledgeBasis: "canonical_verified",
  };
  input.productKnowledgeCodes.add("9999");
  input.topicRoleByCode.set("9999", {
    anyRoleCount: 2,
    verifiedRoleCount: 1,
  });
  input.swotByCode.set("9999", {
    itemCount: 4,
    verifiedItemCount: 4,
    categories: new Set(["strength", "weakness", "opportunity", "threat"]),
  });

  const report = buildKnowledgeCoverageReport(input, "2026-05-28T00:00:00.000Z");
  const company = report.companies[0];

  assert.equal(company.analysisQuality, "A");
  assert.equal(company.upgradePriority, "low");
  assert.equal(company.hasProductKnowledge, true);
  assert.equal(company.hasVerifiedTopicRole, true);
  assert.equal(company.hasCompleteSwot, true);
  assert.deepEqual(company.missingKnowledge, []);
  assert.equal(report.summary.gradeDistribution.A, 1);
});

test("buildKnowledgeCoverageReport grades verified role with partial pillars as B", () => {
  const input = baseInput();
  input.analysisByCode["9999"] = { label: "核心題材受惠", knowledgeBasis: "canonical_verified" };
  input.topicRoleByCode.set("9999", { anyRoleCount: 1, verifiedRoleCount: 1 });
  input.productKnowledgeCodes.add("9999");

  const company = buildKnowledgeCoverageReport(input).companies[0];

  assert.equal(company.analysisQuality, "B");
  assert.equal(company.upgradePriority, "medium");
  assert.deepEqual(company.missingKnowledge, ["complete_swot"]);
});

test("buildKnowledgeCoverageReport distinguishes partial and insufficient companies", () => {
  const input: KnowledgeCoverageInput = {
    companies: [
      { code: "1001", name: "產品股", topics: ["ai-server"] },
      { code: "1002", name: "空資料股", topics: [] },
    ],
    analysisByCode: {
      "1001": { label: "題材關聯明確", knowledgeBasis: "canonical_pending" },
      "1002": { label: "產業資料待補", knowledgeBasis: "insufficient" },
    },
    productKnowledgeCodes: new Set(["1001"]),
    topicRoleByCode: new Map([
      ["1001", { anyRoleCount: 1, verifiedRoleCount: 0 }],
    ]),
    swotByCode: new Map(),
  };

  const report = buildKnowledgeCoverageReport(input);
  const byCode = Object.fromEntries(report.companies.map((company) => [company.code, company]));

  assert.equal(byCode["1001"].analysisQuality, "C");
  assert.equal(byCode["1001"].upgradePriority, "high");
  assert.deepEqual(byCode["1001"].missingKnowledge, ["verified_topic_role", "complete_swot"]);

  assert.equal(byCode["1002"].analysisQuality, "F");
  assert.equal(byCode["1002"].upgradePriority, "high");
  assert.ok(byCode["1002"].blockingReasons.includes("insufficient_daily_analysis"));

  assert.equal(report.summary.gradeDistribution.C, 1);
  assert.equal(report.summary.gradeDistribution.D, 0);
  assert.equal(report.summary.gradeDistribution.F, 1);
  assert.equal(report.summary.highPriorityCount, 2);
});
