import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadStockKnowledgeRules, normalizeStockKnowledgeRules, type StockKnowledgeRuleCategory } from "./stockKnowledgeRules";

const rulesDir = join(process.cwd(), "public/data/stock-knowledge-rules");
const expectedCategories: StockKnowledgeRuleCategory[] = ["technical", "fundamental", "chips", "strategy", "risk"];

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(rulesDir, file), "utf8"));
}

test("stock knowledge rules normalize valid category files", () => {
  const file = normalizeStockKnowledgeRules(readJson("technical.json"));

  assert.ok(file);
  assert.equal(file.schemaVersion, 1);
  assert.equal(file.category, "technical");
  assert.ok(file.source.url.includes("stock-knowledge-site"));
  assert.ok(file.rules.length >= 5);
  assert.ok(file.rules.every((rule) => rule.id.startsWith("technical.")));
});

test("stock knowledge rules reject malformed or source-less rules", () => {
  assert.equal(normalizeStockKnowledgeRules({ schemaVersion: 2 }), null);
  assert.equal(normalizeStockKnowledgeRules({ schemaVersion: 1, category: "unknown", rules: [] }), null);
  assert.equal(normalizeStockKnowledgeRules({
    schemaVersion: 1,
    category: "risk",
    source: { title: "Risk" },
    rules: [{ id: "risk.bad", title: "bad" }],
  }), null);
});

test("stock knowledge rules cover all five source sections with evidence-backed scoring metadata", () => {
  const files = readdirSync(rulesDir).filter((file) => file.endsWith(".json")).sort();
  assert.deepEqual(files, expectedCategories.map((category) => `${category}.json`).sort());

  const loaded = loadStockKnowledgeRules(rulesDir);
  assert.deepEqual(loaded.map((file) => file.category).sort(), [...expectedCategories].sort());

  const allRules = loaded.flatMap((file) => file.rules.map((rule) => ({ ...rule, category: file.category })));
  assert.ok(allRules.length >= 25, "expected at least 25 structured rules from the five 總論 pages");
  assert.ok(allRules.every((rule) => rule.principle.length >= 12), "each rule needs a non-empty principle");
  assert.ok(allRules.every((rule) => rule.positiveSignals.length + rule.negativeSignals.length > 0), "each rule needs signals");
  assert.ok(allRules.every((rule) => rule.scoringImpact.positive !== 0 || rule.scoringImpact.negative !== 0), "each rule needs scoring impact");
  assert.ok(allRules.every((rule) => rule.source.title && rule.source.url.includes("stock-knowledge-site")), "each rule must trace to stock-knowledge-site");
  assert.ok(allRules.some((rule) => rule.category === "risk" && rule.riskControls.some((item) => item.includes("hard gate"))), "risk rules must encode hard gates");
});
