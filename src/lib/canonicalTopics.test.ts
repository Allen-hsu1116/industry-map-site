import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTopicCoverageReport, normalizeCanonicalTopics } from "./canonicalTopics";

test("normalizeCanonicalTopics keeps valid topics and filters invalid records", () => {
  const normalized = normalizeCanonicalTopics({
    schemaVersion: 1,
    updatedAt: "2026-05-28",
    topicDefinition: {
      rule: "題材必須能連到需求催化、供應鏈位置與可追蹤證據。",
      notTopic: ["單日漲幅榜"],
    },
    topics: [
      {
        id: "memory",
        name: "記憶體",
        type: "supply_chain_segment",
        status: "active",
        definition: "DRAM/NAND/HBM/CXL 等儲存與記憶體供應鏈。",
        whyItMatters: "記憶體報價循環會影響相關公司營收與毛利率。",
        aliases: ["DRAM", "NAND"],
        childIds: ["hbm"],
        legacyTopicIds: ["hbm", "niche-memory"],
        include: ["記憶體供應商"],
        exclude: ["單純使用記憶體的終端品牌"],
        activationSignals: ["DRAM 現貨/合約價上漲"],
        evidence: [{ sourceId: "source-1", claim: "年報揭露記憶體產品。" }],
        confidence: "medium",
        lastVerified: "2026-05-28",
      },
      { id: "broken", type: "nonsense" },
    ],
  });

  assert.ok(normalized);
  assert.equal(normalized.topics.length, 1);
  assert.equal(normalized.topics[0].id, "memory");
  assert.equal(normalized.topics[0].evidence[0].sourceId, "source-1");
});

test("buildTopicCoverageReport highlights unmapped and duplicate legacy topics", () => {
  const normalized = normalizeCanonicalTopics({
    schemaVersion: 1,
    updatedAt: "2026-05-28",
    topicDefinition: { rule: "rule", notTopic: [] },
    topics: [
      {
        id: "ai-server",
        name: "AI 伺服器",
        type: "theme",
        status: "active",
        definition: "AI 加速器伺服器供應鏈。",
        whyItMatters: "資本支出帶動 ODM、散熱、電源、PCB。",
        aliases: [],
        childIds: [],
        legacyTopicIds: ["ai-server", "ai-server-odm"],
        include: [],
        exclude: [],
        activationSignals: [],
        evidence: [],
        confidence: "low",
        lastVerified: null,
      },
      {
        id: "ai-server-odm",
        name: "AI 伺服器整機組裝",
        type: "supply_chain_segment",
        status: "active",
        definition: "AI 伺服器 ODM/OEM 組裝。",
        whyItMatters: "直接承接雲端客戶 AI server 訂單。",
        aliases: [],
        parentId: "ai-server",
        childIds: [],
        legacyTopicIds: ["ai-server-odm"],
        include: [],
        exclude: [],
        activationSignals: [],
        evidence: [],
        confidence: "low",
        lastVerified: null,
      },
    ],
  });

  assert.ok(normalized);
  const report = buildTopicCoverageReport([
    { slug: "ai-server", name: "AI伺服器與液冷技術" },
    { slug: "ai-server-odm", name: "AI 伺服器｜整機組裝" },
    { slug: "leo-satellite", name: "低軌衛星" },
  ], normalized.topics);

  assert.equal(report.legacyTopics, 3);
  assert.equal(report.mappedLegacyTopics, 2);
  assert.deepEqual(report.unmappedLegacyTopics, ["leo-satellite"]);
  assert.deepEqual(report.duplicateLegacyMappings, [{ legacyTopicId: "ai-server-odm", canonicalTopicIds: ["ai-server", "ai-server-odm"] }]);
});

test("normalizeCanonicalTopics rejects files with wrong schema", () => {
  assert.equal(normalizeCanonicalTopics({ schemaVersion: 2 }), null);
});

test("canonical-topics.json maps every legacy topic exactly once", async () => {
  const fs = await import("node:fs/promises");
  const canonicalRaw = JSON.parse(await fs.readFile("public/data/canonical-topics.json", "utf8"));
  const industriesRaw = JSON.parse(await fs.readFile("public/data/industries.json", "utf8"));
  const normalized = normalizeCanonicalTopics(canonicalRaw);

  assert.ok(normalized);
  const report = buildTopicCoverageReport(industriesRaw.topics, normalized.topics);

  assert.equal(report.legacyTopics, 81);
  assert.equal(report.unmappedLegacyTopics.length, 0, `Unmapped legacy topics: ${report.unmappedLegacyTopics.join(", ")}`);
  assert.deepEqual(report.duplicateLegacyMappings, []);
});

test("CoWoS legacy topic groups TSMC with the advanced packaging value chain, not a single-company bucket", async () => {
  const fs = await import("node:fs/promises");
  const industriesRaw = JSON.parse(await fs.readFile("public/data/industries.json", "utf8"));
  const cowosTopic = industriesRaw.topics.find((topic: { slug?: string }) => topic.slug === "cowos-advanced-packaging");

  assert.ok(cowosTopic, "cowos-advanced-packaging topic should exist");
  const groups = cowosTopic.groups as Array<{ name: string; companies: Array<{ code: string }> }>;
  const singletonCompanyBuckets = groups.filter((group) => group.companies.length === 1 && /[（(].+[）)]/.test(group.name));
  assert.deepEqual(singletonCompanyBuckets.map((group) => group.name), [], "company-specific singleton groups should not appear in the CoWoS topic");

  const packagingServiceGroup = groups.find((group) => group.name === "先進封裝與封測服務");
  assert.ok(packagingServiceGroup, "CoWoS topic should keep a value-chain group for advanced packaging/foundry services");
  assert.ok(packagingServiceGroup.companies.some((company) => company.code === "2330"), "TSMC belongs in the value-chain service group, not its own group");
});
