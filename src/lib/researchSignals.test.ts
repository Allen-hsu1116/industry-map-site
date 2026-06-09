import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeResearchSignal, researchSignalCreatesVerifiedCompanyRole } from "./researchSignals";

const baseSignal = {
  id: "trendforce-hbm-2026-06-08",
  sourceName: "TrendForce",
  sourceType: "industry_research",
  publishedAt: "2026-06-08",
  retrievedAt: "2026-06-08",
  title: "HBM demand remains tight",
  url: "https://example.com/research/hbm",
  access: "public",
  scope: "topic",
  relatedTopics: ["hbm", "memory"],
  relatedCompanies: ["2330"],
  thesis: "HBM demand supports memory supply chain direction, but company roles require separate evidence.",
  confidence: "medium",
  analystNotes: ["top-down context only"],
  reviewTriggers: ["review memory topic roles"],
};

test("ResearchSignal normalizes public topic direction with explicit access, scope, and confidence", () => {
  const normalized = normalizeResearchSignal(baseSignal);

  assert.ok(normalized);
  assert.equal(normalized.access, "public");
  assert.equal(normalized.scope, "topic");
  assert.deepEqual(normalized.relatedTopics, ["hbm", "memory"]);
  assert.deepEqual(normalized.evidenceQuotes, []);
});

test("ResearchSignal allows missing URL only for manual or licensed notes with source and date", () => {
  assert.ok(normalizeResearchSignal({ ...baseSignal, url: undefined, access: "manual_note" }));
  assert.ok(normalizeResearchSignal({ ...baseSignal, url: undefined, access: "licensed" }));
  assert.equal(normalizeResearchSignal({ ...baseSignal, url: undefined, access: "public" }), null);
});

test("ResearchSignal cannot create verified company topic roles", () => {
  const signal = normalizeResearchSignal(baseSignal);

  assert.ok(signal);
  assert.equal(researchSignalCreatesVerifiedCompanyRole(signal), false);
});
