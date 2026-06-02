import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildEventFocusSnapshot,
  formatRocDateTime,
  normalizeTwseMajorNewsRows,
} from "./eventFocus";

test("formatRocDateTime converts TWSE ROC date/time to ISO-like local timestamp", () => {
  assert.equal(formatRocDateTime("1150601", "1409"), "2026-06-01 14:09:00");
  assert.equal(formatRocDateTime("1150601", "103843"), "2026-06-01 10:38:43");
});

test("normalizeTwseMajorNewsRows preserves official subjects and filters unrelated companies", () => {
  const rows = normalizeTwseMajorNewsRows([
    { "發言日期": "1150601", "發言時間": "1409", "公司代號": "6214", "公司名稱": "精誠", "主旨 ": "代子公司公告得標", "符合條款": "第51款", "說明": "官方說明" },
    { "發言日期": "1150601", "發言時間": "103843", "公司代號": "2317", "公司名稱": "鴻海", "主旨 ": "說明媒體報導", "符合條款": "第51款" },
    { "發言日期": "", "公司代號": "", "主旨 ": "bad" },
  ], new Set(["6214"]));

  assert.deepEqual(normalizeTwseMajorNewsRows([
    { "發言日期": "1150601", "發言時間": "1409", "公司代號": "6214", "公司名稱": "精誠", "主旨 ": "代子公司公告得標", "符合條款": "第51款", "說明": "官方說明" },
  ])[0], {
    id: "twse-6214-2026-06-01-140900-第51款",
    date: "2026-06-01",
    announcedAt: "2026-06-01 14:09:00",
    companyCode: "6214",
    companyName: "精誠",
    subject: "代子公司公告得標",
    clause: "第51款",
    description: "官方說明",
    source: "TWSE OpenAPI t187ap04_L",
    sourceUrl: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L",
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.subject, "代子公司公告得標");
});

test("buildEventFocusSnapshot maps official events to derived topic roles without pretending verified event truth", () => {
  const snapshot = buildEventFocusSnapshot({
    generatedAt: "2026-06-02T12:00:00.000Z",
    officialRows: [
      { id: "twse-6214-2026-06-01-140900-第51款", date: "2026-06-01", announcedAt: "2026-06-01 14:09:00", companyCode: "6214", companyName: "精誠", subject: "代重要子公司公告國防部雲端服務得標", clause: "第51款", source: "TWSE OpenAPI t187ap04_L", sourceUrl: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L" },
    ],
    companyTopicRoles: {
      "6214": [
        { topicId: "cloud-infrastructure", topicName: "雲端基礎設施", roleLabel: "系統整合與雲端服務", confidence: "medium", status: "verified" },
      ],
    },
  });

  assert.equal(snapshot.status, "partial");
  assert.equal(snapshot.source.name, "TWSE OpenAPI t187ap04_L");
  assert.equal(snapshot.items[0]?.mappingMethod, "derived_from_company_topic_roles");
  assert.equal(snapshot.items[0]?.officialSubject, "代重要子公司公告國防部雲端服務得標");
  assert.deepEqual(snapshot.items[0]?.derivedTopics, [
    { topicId: "cloud-infrastructure", topicName: "雲端基礎設施", roleLabel: "系統整合與雲端服務", confidence: "medium", status: "verified" },
  ]);
  assert.match(snapshot.items[0]?.verificationNote ?? "", /官方重大訊息原文/);
});

test("checked-in event-focus snapshot preserves official source semantics", () => {
  const snapshot = JSON.parse(fs.readFileSync("public/data/event-focus.json", "utf8")) as {
    schemaVersion: number;
    status: string;
    latestDate?: string;
    itemCount: number;
    source: { name: string; semantics: string };
    items: Array<{ officialSubject?: string; verificationNote?: string; mappingMethod?: string }>;
  };

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.source.name, "TWSE OpenAPI t187ap04_L");
  assert.match(snapshot.source.semantics, /derived, not official/);
  assert.ok(snapshot.latestDate && snapshot.latestDate >= "2026-06-01", `event focus latestDate is stale: ${snapshot.latestDate}`);
  assert.ok(snapshot.itemCount > 0);
  assert.ok(snapshot.items.every((item) => item.officialSubject && item.verificationNote?.includes("官方重大訊息原文")));
  assert.ok(snapshot.items.every((item) => item.mappingMethod === "derived_from_company_topic_roles" || item.mappingMethod === "unmapped_official_event"));
});
