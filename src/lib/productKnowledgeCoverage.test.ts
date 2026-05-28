import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import type { CompanyProductKnowledge } from "./productKnowledge";

const PRODUCT_KNOWLEDGE_DIR = path.join(process.cwd(), "public/data/product-knowledge");
const STEP_16_BATCH_CODES = ["6147", "3035", "4966", "6239", "8299", "3311", "2453", "3081", "2059", "3529", "6175", "3037"];

test("Step 16 product knowledge batch covers top high-priority companies with evidence-backed explanations", () => {
  for (const code of STEP_16_BATCH_CODES) {
    const filePath = path.join(PRODUCT_KNOWLEDGE_DIR, `${code}.json`);
    assert.equal(fs.existsSync(filePath), true, `${code} should have product knowledge`);

    const knowledge = JSON.parse(fs.readFileSync(filePath, "utf8")) as CompanyProductKnowledge;
    assert.equal(knowledge.code, code);
    assert.ok(knowledge.products.length >= 1, `${code} should list at least one product/service`);

    for (const product of knowledge.products) {
      assert.ok(product.plainLanguage.length >= 30, `${code} ${product.name} should explain what it is`);
      assert.ok(product.whyItMatters.length >= 30, `${code} ${product.name} should explain why it matters`);
      assert.ok(product.evidence.length >= 1, `${code} ${product.name} should cite evidence`);
      assert.ok(product.lastVerified, `${code} ${product.name} should have lastVerified`);
      assert.ok(["high", "medium", "low"].includes(product.confidence), `${code} ${product.name} should have valid confidence`);
    }
  }
});
