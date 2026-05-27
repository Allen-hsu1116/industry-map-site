import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalProductCatalog, canonicalizeProductMention, normalizeCanonicalProductKey } from "./canonicalProducts";
import type { LegacyRoleCandidate } from "./legacyKnowledgeInventory";

test("normalizeCanonicalProductKey removes presentation noise deterministically", () => {
  assert.equal(normalizeCanonicalProductKey(" CoWoS-S 先進封裝 "), "cowoss先進封裝");
  assert.equal(normalizeCanonicalProductKey("N2製程：2026年量產"), "n2製程2026年量產");
});

test("canonicalizeProductMention maps known advanced packaging and process aliases", () => {
  assert.deepEqual(
    canonicalizeProductMention("CoWoS-S + HBM3E").map((item) => item.canonicalName),
    ["CoWoS-S", "HBM3E"],
  );

  assert.deepEqual(canonicalizeProductMention("CoWoS 先進封裝")[0], {
    canonicalId: "cowos",
    canonicalName: "CoWoS",
    aliases: ["CoWoS 先進封裝"],
    issues: [],
  });

  assert.deepEqual(canonicalizeProductMention("N2製程：2026年量產")[0], {
    canonicalId: "n2",
    canonicalName: "N2",
    aliases: ["N2製程：2026年量產"],
    issues: [],
  });
});

test("canonicalizeProductMention flags business-registration noise instead of promoting it as clean product knowledge", () => {
  const [item] = canonicalizeProductMention("得經營法令非禁止或限制之業務");

  assert.equal(item.canonicalName, "得經營法令非禁止或限制之業務");
  assert.deepEqual(item.issues, ["generic_business_registration"]);
});

test("buildCanonicalProductCatalog merges aliases across roles and keeps traceability", () => {
  const roles: LegacyRoleCandidate[] = [
    {
      source: "legacy_industries_json",
      status: "candidate",
      needsVerification: true,
      confidence: "unverified",
      topicId: "cowos-advanced-packaging",
      topicName: "AI 先進封裝 CoWoS",
      groupName: "晶圓代工",
      companyCode: "2330",
      companyName: "台積電",
      role: "CoWoS 核心供應者",
      relevance: "高",
      products: ["CoWoS 先進封裝", "CoWoS-S + HBM3E"],
      customers: [],
      techFocus: [],
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    },
    {
      source: "legacy_industries_json",
      status: "candidate",
      needsVerification: true,
      confidence: "unverified",
      topicId: "wafer-foundry",
      topicName: "晶圓代工",
      groupName: "晶圓代工",
      companyCode: "2330",
      companyName: "台積電",
      role: "先進製程龍頭",
      relevance: "高",
      products: ["N2製程：2026年量產"],
      customers: [],
      techFocus: [],
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    },
  ];

  const catalog = buildCanonicalProductCatalog(roles, "2026-05-27T00:00:00.000Z");
  const cowos = catalog.products.find((product) => product.canonicalId === "cowos");
  const cowosS = catalog.products.find((product) => product.canonicalId === "cowoss");
  const hbm3e = catalog.products.find((product) => product.canonicalId === "hbm3e");

  assert.equal(catalog.generatedAt, "2026-05-27T00:00:00.000Z");
  assert.equal(catalog.summary.canonicalProducts, 4);
  assert.ok(cowos);
  assert.deepEqual(cowos.aliases, ["CoWoS 先進封裝"]);
  assert.deepEqual(cowos.companies, [{ code: "2330", name: "台積電", mentions: 1 }]);
  assert.deepEqual(cowos.topics, [{ id: "cowos-advanced-packaging", name: "AI 先進封裝 CoWoS", mentions: 1 }]);
  assert.ok(cowosS);
  assert.ok(hbm3e);
  assert.equal(hbm3e?.rawMentionCount, 1);
});
