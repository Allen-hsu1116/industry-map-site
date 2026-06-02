import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildTopicOverview } from "./topicOverview";
import type { CanonicalTopicsFile } from "./canonicalTopics";
import type { EventFocusSnapshot } from "./eventFocus";

const canonicalTopics: CanonicalTopicsFile = {
  schemaVersion: 1,
  updatedAt: "2026-05-28",
  topicDefinition: {
    rule: "題材是可證據化的分析鏡頭",
    notTopic: ["市場綽號不是 canonical label"],
  },
  topics: [
    {
      id: "ai-server",
      name: "AI 伺服器整機與 EMS",
      type: "theme",
      status: "active",
      definition: "AI 訓練/推論需求驅動的伺服器整機與 EMS 供應鏈。",
      whyItMatters: "AI 資本支出直接推升整機出貨與組裝價值量。",
      aliases: ["AI server"],
      childIds: [],
      legacyTopicIds: ["ai-server"],
      include: ["直接產品、設備、材料、服務或供應鏈角色"],
      exclude: ["只有股價同漲但沒有產品或供應鏈證據"],
      activationSignals: ["月營收或訂單能見度改善", "官方公告揭露新產品/客戶/產能"],
      evidence: [{ sourceId: "mops-company-disclosures", publisher: "MOPS", title: "公司公告", claim: "可驗證公司產品與角色" }],
      confidence: "medium",
      lastVerified: "2026-05-28",
    },
    {
      id: "uncovered-topic",
      name: "尚待補證題材",
      type: "theme",
      status: "watchlist",
      definition: "只有 canonical 定義，尚未有 topic-map 公司。",
      whyItMatters: "作為待觀察題材。",
      aliases: [],
      childIds: [],
      legacyTopicIds: [],
      include: [],
      exclude: [],
      activationSignals: [],
      evidence: [],
      confidence: "insufficient",
      lastVerified: null,
    },
  ],
};

const topicMap = {
  schemaVersion: 1,
  generatedAt: "2026-06-01T20:30:00.000Z",
  source: "canonical-topics+company-topic-roles",
  stats: { total_topics: 1, unique_companies: 3, total_companies: 4 },
  topics: [
    {
      slug: "ai-server",
      name: "主題趨勢｜AI 伺服器整機與 EMS",
      description: "legacy UI label should not override canonical label",
      total: 3,
      groups: [
        { name: "散熱", level: "upstream", companies: [{ code: "3017", name: "奇鋐", relevance: "高", role: "散熱模組" }] },
        { name: "組裝", level: "midstream", companies: [{ code: "2317", name: "鴻海", relevance: "高", role: "EMS" }, { code: "2382", name: "廣達", relevance: "中", role: "ODM" }] },
        { name: "應用", level: "downstream", companies: [{ code: "6669", name: "緯穎", relevance: "中", role: "雲端伺服器" }] },
      ],
    },
  ],
};

const eventFocus: EventFocusSnapshot = {
  schemaVersion: 1,
  generatedAt: "2026-06-01T14:10:00.000Z",
  status: "partial",
  source: {
    name: "TWSE OpenAPI t187ap04_L",
    url: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L",
    scope: "listed-company-major-news",
    semantics: "official subject preserved; topic mapping is derived, not official",
  },
  latestDate: "2026-06-01",
  itemCount: 2,
  items: [
    {
      id: "twse-2317-1",
      date: "2026-06-01",
      announcedAt: "2026-06-01 14:09:00",
      companyCode: "2317",
      companyName: "鴻海",
      officialSubject: "公告本公司董事會重要決議事項",
      derivedTopics: [{ topicId: "ai-server", topicName: "AI 伺服器整機與 EMS", roleLabel: "核心產品/平台", confidence: "medium", status: "verified" }],
      mappingMethod: "derived_from_company_topic_roles",
      verificationNote: "官方重大訊息原文保留；題材只由已建檔 company-topic-roles 派生。",
      source: "TWSE OpenAPI t187ap04_L",
      sourceUrl: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L",
    },
  ],
};

test("buildTopicOverview creates evidence-backed topic cards without market nickname labels", () => {
  const overview = buildTopicOverview({ canonicalTopics, topicMap, eventFocus });

  assert.equal(overview.status, "partial");
  assert.equal(overview.cards.length, 2);

  const aiServer = overview.cards.find((card) => card.id === "ai-server");
  assert.ok(aiServer);
  assert.equal(aiServer.title, "AI 伺服器整機與 EMS");
  assert.equal(aiServer.uiLabel, "主題趨勢｜AI 伺服器整機與 EMS");
  assert.equal(aiServer.companyCount, 4);
  assert.equal(aiServer.coverageStatus, "verified");
  assert.equal(aiServer.lastVerified, "2026-05-28");
  assert.equal(aiServer.updatedAt, "2026-06-01T20:30:00.000Z");
  assert.deepEqual(aiServer.stageCounts, { upstream: 1, midstream: 2, downstream: 1, end_market: 0, unknown: 0 });
  assert.deepEqual(aiServer.representativeCompanies.map((company) => company.code), ["3017", "2317", "2382", "6669"]);
  assert.equal(aiServer.recentEvents.length, 1);
  assert.equal(aiServer.recentEvents[0].officialSubject, "公告本公司董事會重要決議事項");
  assert.equal(aiServer.recentEvents[0].mappingLabel, "derived topic mapping");
  assert.match(aiServer.sourceStatus.note, /canonical-topic.*topic-map.*event-focus/);

  const uncovered = overview.cards.find((card) => card.id === "uncovered-topic");
  assert.ok(uncovered);
  assert.equal(uncovered.coverageStatus, "empty");
  assert.equal(uncovered.emptyReason, "此 canonical topic 尚無 evidence-backed topic-map 公司角色；不可用 AI 補成既定事實。");
});

test("checked-in topic overview exposes source status and daily-report topic links", async () => {
  const [canonicalRaw, topicMapRaw, eventFocusRaw, topicsPage] = await Promise.all([
    readFile("public/data/canonical-topics.json", "utf8").then(JSON.parse),
    readFile("public/data/canonical-topic-map.json", "utf8").then(JSON.parse),
    readFile("public/data/event-focus.json", "utf8").then(JSON.parse),
    readFile("src/app/topics/page.tsx", "utf8"),
  ]);

  const overview = buildTopicOverview({ canonicalTopics: canonicalRaw, topicMap: topicMapRaw, eventFocus: eventFocusRaw });

  assert.ok(overview.cards.length >= 20);
  assert.ok(overview.cards.some((card) => card.recentEvents.length > 0));
  assert.ok(overview.cards.every((card) => !card.title.includes("｜")), "canonical titles must not use market nickname/category prefixes");
  assert.ok(overview.cards.every((card) => card.sourceStatus.sources.length >= 2));
  assert.match(topicsPage, /href=\{`\/daily-report\?topic=\$\{card\.id\}`\}/);
  assert.match(topicsPage, /coverageStatus/);
});
