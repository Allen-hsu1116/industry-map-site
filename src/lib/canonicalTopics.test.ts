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
  const [canonicalRaw, legacyTopicRefs] = await Promise.all([
    fs.readFile("public/data/canonical-topics.json", "utf8").then(JSON.parse),
    fs.readFile("src/lib/__fixtures__/legacy-topic-refs.json", "utf8").then(JSON.parse),
  ]);
  const normalized = normalizeCanonicalTopics(canonicalRaw);

  assert.ok(normalized);
  const report = buildTopicCoverageReport(legacyTopicRefs.topics, normalized.topics);

  assert.equal(report.legacyTopics, 81);
  assert.equal(report.unmappedLegacyTopics.length, 0, `Unmapped legacy topics: ${report.unmappedLegacyTopics.join(", ")}`);
  assert.deepEqual(report.duplicateLegacyMappings, []);
});

test("CoWoS legacy topic maps to the canonical advanced-packaging value chain, not a company-specific bucket", async () => {
  const fs = await import("node:fs/promises");
  const canonicalRaw = JSON.parse(await fs.readFile("public/data/canonical-topics.json", "utf8"));
  const normalized = normalizeCanonicalTopics(canonicalRaw);

  assert.ok(normalized);
  const cowosTopic = normalized.topics.find((topic) => topic.legacyTopicIds.includes("cowos-advanced-packaging"));

  assert.ok(cowosTopic, "cowos-advanced-packaging should map to a canonical topic");
  assert.equal(cowosTopic.id, "advanced-packaging");
  assert.match(cowosTopic.name, /先進封裝|CoWoS/);
  assert.doesNotMatch(cowosTopic.name, /[（(].+[）)]/, "canonical topic names must not be company-specific buckets");
});

test("display-panel legacy topic uses a neutral canonical topic instead of market nicknames", async () => {
  const fs = await import("node:fs/promises");
  const canonicalRaw = JSON.parse(await fs.readFile("public/data/canonical-topics.json", "utf8"));
  const normalized = normalizeCanonicalTopics(canonicalRaw);

  assert.ok(normalized);
  const displayTopic = normalized.topics.find((topic) => topic.legacyTopicIds.includes("display-panel"));

  assert.ok(displayTopic, "display-panel should map to a canonical topic");
  assert.equal(displayTopic.id, "display-led-optics");
  assert.equal(displayTopic.name.includes("面板雙虎"), false, "market nickname should not be used as the canonical topic name");
  assert.equal(displayTopic.aliases.includes("面板雙虎"), false, "market nickname should not be used as a canonical alias");
});

test("canonical memory topics keep NOR Flash and DRAM-oriented topics separate", async () => {
  const fs = await import("node:fs/promises");
  const canonicalRaw = JSON.parse(await fs.readFile("public/data/canonical-topics.json", "utf8"));
  const normalized = normalizeCanonicalTopics(canonicalRaw);

  assert.ok(normalized);
  const nicheMemory = normalized.topics.find((topic) => topic.id === "niche-memory");
  const memoryModules = normalized.topics.find((topic) => topic.id === "memory-modules");

  assert.ok(nicheMemory);
  assert.ok(memoryModules);
  assert.equal(nicheMemory.legacyTopicIds.includes("niche-memory"), true);
  assert.equal(memoryModules.legacyTopicIds.includes("niche-memory"), false, "DRAM/memory-module topic must not absorb the NOR Flash legacy topic");
  assert.match(nicheMemory.name, /NOR Flash/);
  assert.doesNotMatch(memoryModules.name, /NOR Flash/);
});
