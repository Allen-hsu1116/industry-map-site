import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDailyFocusLink, getProductNavigationItems, normalizeProductNavigationTarget } from "./productNavigation";

test("product navigation includes the Daily Industry Intelligence shell destinations with clear scopes", () => {
  const items = getProductNavigationItems();

  assert.deepEqual(items.map((item) => item.id), [
    "daily-focus",
    "topic-overview",
    "industry-map",
    "company-database",
    "market-rankings",
    "ai-analysis",
  ]);
  assert.equal(new Set(items.map((item) => item.label)).size, items.length, "labels must not duplicate different scopes");
  assert.ok(items.every((item) => item.scopeDescription.length >= 8));
});

test("product navigation normalizes daily focus targets for topic, stage, and company links", () => {
  const topicTarget = normalizeProductNavigationTarget({ type: "topic", topicId: "wafer-foundry" });
  const stageTarget = normalizeProductNavigationTarget({ type: "industry_stage", topicId: "wafer-foundry", stageId: "manufacturing" });
  const companyTarget = normalizeProductNavigationTarget({ type: "company", companyCode: "2330" });

  assert.deepEqual(topicTarget, { type: "topic", href: "/topics/wafer-foundry", topicId: "wafer-foundry" });
  assert.deepEqual(stageTarget, {
    type: "industry_stage",
    href: "/industry-map?topic=wafer-foundry&stage=manufacturing",
    topicId: "wafer-foundry",
    stageId: "manufacturing",
  });
  assert.deepEqual(companyTarget, { type: "company", href: "/companies/2330", companyCode: "2330" });
});

test("product navigation rejects ambiguous or incomplete targets", () => {
  assert.equal(normalizeProductNavigationTarget({ type: "topic" }), null);
  assert.equal(normalizeProductNavigationTarget({ type: "industry_stage", topicId: "wafer-foundry" }), null);
  assert.equal(normalizeProductNavigationTarget({ type: "company", companyCode: "2330 台積電" }), null);
});

test("daily focus link can carry topic, industry-chain stage, and company in one shareable URL", () => {
  assert.equal(
    buildDailyFocusLink({ topicId: "wafer-foundry", stageId: "manufacturing", companyCode: "2330" }),
    "/daily-report?topic=wafer-foundry&stage=manufacturing&company=2330",
  );
});
