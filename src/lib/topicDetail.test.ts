import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { CanonicalTopicsFile } from "./canonicalTopics";
import type { CompanySwotKnowledge } from "./companySwot";
import type { CompanyTopicRolesKnowledge } from "./companyTopicRoles";
import type { EventFocusSnapshot } from "./eventFocus";
import { buildTopicDetail } from "./topicDetail";
import type { TopicMapSnapshot } from "./topicOverview";

const canonicalTopics: CanonicalTopicsFile = {
  schemaVersion: 1,
  updatedAt: "2026-05-28",
  topicDefinition: { rule: "題材是可證據化的分析鏡頭", notTopic: [] },
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
      legacyTopicIds: ["ai-server-odm"],
      include: ["直接產品、設備、材料、服務或供應鏈角色"],
      exclude: ["只有股價同漲但沒有產品或供應鏈證據"],
      activationSignals: ["官方公告揭露新產品/客戶/產能"],
      evidence: [{ sourceId: "mops-company-disclosures", publisher: "MOPS", title: "公司公告", claim: "可驗證公司產品與角色" }],
      confidence: "medium",
      lastVerified: "2026-05-28",
    },
    {
      id: "uncovered-topic",
      name: "尚待補證題材",
      type: "theme",
      status: "watchlist",
      definition: "尚未有 topic-map 公司。",
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
  topics: [
    {
      slug: "ai-server",
      name: "主題趨勢｜AI 伺服器整機與 EMS",
      total: 3,
      groups: [
        { name: "散熱", level: "upstream", companies: [{ code: "3017", name: "奇鋐", relevance: "高", role: "散熱模組" }] },
        { name: "組裝", level: "midstream", companies: [{ code: "2317", name: "鴻海", relevance: "高", role: "EMS" }] },
        { name: "應用", level: "downstream", companies: [{ code: "6669", name: "緯穎", relevance: "中", role: "雲端伺服器" }] },
      ],
    },
  ],
};

const companyRoles: CompanyTopicRolesKnowledge[] = [
  {
    schemaVersion: 1,
    companyCode: "2317",
    companyName: "鴻海",
    updatedAt: "2026-05-31",
    roles: [
      {
        topicId: "ai-server",
        topicName: "AI 伺服器整機與 EMS",
        topicType: "theme",
        directness: "core",
        supplyChainStage: "system_assembly",
        roleType: "ai_server_ems_odm",
        roleSummary: "鴻海是 AI 伺服器整機組裝與 EMS 核心角色。",
        products: ["AI 伺服器整機組裝", "EMS/SMT 電子代工"],
        risks: ["客戶集中", "低毛利製造 mix"],
        evidence: [{ sourceId: "mops", publisher: "MOPS", title: "鴻海公告", url: "https://example.com/2317", claim: "公司角色可驗證" }],
        confidence: "medium",
        lastVerified: "2026-05-28",
        status: "verified",
      },
    ],
  },
];

const swots: CompanySwotKnowledge[] = [
  {
    schemaVersion: 1,
    companyCode: "2317",
    companyName: "鴻海",
    updatedAt: "2026-05-28",
    items: [
      {
        id: "threat-customer-cycle",
        category: "threat",
        statement: "大型客戶拉貨週期是 AI 伺服器題材主要威脅。",
        rationale: "系統組裝廠需承擔供應鏈協調與交付壓力。",
        timeHorizon: "medium_term",
        relatedTopicIds: ["ai-server"],
        evidence: [{ sourceId: "mops", publisher: "MOPS", title: "鴻海公告", url: "https://example.com/2317", claim: "風險可由公司揭露觀察" }],
        confidence: "medium",
        lastVerified: "2026-05-28",
        status: "verified",
      },
    ],
  },
];

const eventFocus: EventFocusSnapshot = {
  schemaVersion: 1,
  generatedAt: "2026-06-01T14:10:00.000Z",
  status: "partial",
  source: { name: "TWSE OpenAPI t187ap04_L", url: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L", scope: "listed-company-major-news", semantics: "official subject preserved; topic mapping is derived, not official" },
  latestDate: "2026-06-01",
  itemCount: 1,
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
    },
  ],
};

test("buildTopicDetail creates deterministic value-chain stages with role confidence and topic SWOT risks", () => {
  const detail = buildTopicDetail({ canonicalTopics, topicMap: topicMap as TopicMapSnapshot, eventFocus, companyTopicRoles: companyRoles, companySwots: swots, topicId: "ai-server" });

  assert.equal(detail?.id, "ai-server");
  assert.equal(detail?.title, "AI 伺服器整機與 EMS");
  assert.equal(detail?.status, "partial");
  assert.deepEqual(detail?.stages.map((stage) => stage.stage), ["upstream", "midstream", "downstream", "end_market"]);
  assert.equal(detail?.stages.find((stage) => stage.stage === "midstream")?.companies[0].code, "2317");
  assert.equal(detail?.stages.find((stage) => stage.stage === "midstream")?.companies[0].confidence, "medium");
  assert.equal(detail?.stages.find((stage) => stage.stage === "midstream")?.companies[0].roleSummary, "鴻海是 AI 伺服器整機組裝與 EMS 核心角色。");
  assert.equal(detail?.stages.find((stage) => stage.stage === "end_market")?.status, "empty");
  assert.match(detail?.stages.find((stage) => stage.stage === "end_market")?.emptyReason ?? "", /不可用 AI 補公司/);
  assert.equal(detail?.commonRisks[0].statement, "大型客戶拉貨週期是 AI 伺服器題材主要威脅。");
  assert.equal(detail?.commonRisks[0].sourceLabel, "MOPS");
  assert.equal(detail?.recentEvents[0].officialSubject, "公告本公司董事會重要決議事項");
  assert.equal(detail?.recentEvents[0].mappingLabel, "derived topic mapping");
  assert.equal(detail?.sourceStatus.sources.some((source) => source.name === "company-swot"), true);
});

test("buildTopicDetail returns honest empty state for topics without mapped companies", () => {
  const detail = buildTopicDetail({ canonicalTopics, topicMap: topicMap as TopicMapSnapshot, topicId: "uncovered-topic", companyTopicRoles: [], companySwots: [] });

  assert.equal(detail?.status, "empty");
  assert.equal(detail?.companyCount, 0);
  assert.equal(detail?.coverageStatus, "empty");
  assert.equal(detail?.stages.every((stage) => stage.status === "empty"), true);
  assert.match(detail?.emptyReason ?? "", /尚無 evidence-backed/);
});

test("checked-in topic detail route exposes value-chain source labels and static params", async () => {
  const [canonicalRaw, topicMapRaw, eventFocusRaw, topicDetailPage] = await Promise.all([
    readFile("public/data/canonical-topics.json", "utf8").then(JSON.parse),
    readFile("public/data/canonical-topic-map.json", "utf8").then(JSON.parse),
    readFile("public/data/event-focus.json", "utf8").then(JSON.parse),
    readFile("src/app/topics/[id]/page.tsx", "utf8"),
  ]);

  const detail = buildTopicDetail({ canonicalTopics: canonicalRaw, topicMap: topicMapRaw, eventFocus: eventFocusRaw, topicId: "ai-server", companyTopicRoles: [], companySwots: [] });

  assert.ok(detail);
  assert.ok(detail.stages.length >= 4);
  assert.equal(detail.stages[0].stage, "upstream");
  assert.match(topicDetailPage, /generateStaticParams/);
  assert.match(topicDetailPage, /sourceStatus/);
  assert.match(topicDetailPage, /終端需求/);
});
