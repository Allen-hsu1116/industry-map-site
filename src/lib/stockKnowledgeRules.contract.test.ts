import { test } from "node:test";
import assert from "node:assert/strict";
import { adaptStockKnowledgeRuleContract, summarizeStockKnowledgeRuleStatus } from "./stockKnowledgeRules";

test("stock knowledge contract adapts existing rule categories into Daily Analysis V2 categories", () => {
  const adapted = adaptStockKnowledgeRuleContract({
    id: "chips.investment-trust-accumulation",
    category: "chips",
    title: "投信連買優先於單日外資買超",
    principle: "連續性籌碼比單日買超更能支持趨勢。",
    positiveSignals: ["投信連續買超"],
    negativeSignals: ["外資單日轉賣"],
    scoringImpact: { positive: 8, negative: -5 },
    riskControls: ["avoid chasing after exhaustion"],
    source: { title: "stock knowledge", url: "https://stock-knowledge-site.local/chips" },
  });

  assert.ok(adapted);
  assert.equal(adapted.category, "chip");
  assert.deepEqual(adapted.appliesWhen, ["投信連續買超", "外資單日轉賣"]);
  assert.deepEqual(adapted.bullishImplications, ["投信連續買超"]);
  assert.deepEqual(adapted.bearishImplications, ["外資單日轉賣"]);
  assert.equal(adapted.confidence, "medium");
});

test("stock knowledge contract degrades status when rule files are missing", () => {
  const status = summarizeStockKnowledgeRuleStatus([]);

  assert.equal(status.status, "insufficient");
  assert.equal(status.ruleCount, 0);
  assert.match(status.warning, /Missing stock knowledge/i);
});
