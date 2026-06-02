import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { EventFocusItem } from "./eventFocus";
import {
  buildMajorNewsFilterOptions,
  filterEventFocusItems,
  normalizeMajorNewsFilters,
} from "./majorNewsFilters";

const sampleItems: EventFocusItem[] = [
  {
    id: "2330-1",
    date: "2026-06-01",
    announcedAt: "2026-06-01 14:09:00",
    companyCode: "2330",
    companyName: "台積電",
    officialSubject: "官方主旨 A",
    derivedTopics: [{ topicId: "advanced-packaging", topicName: "先進封裝" }],
    mappingMethod: "derived_from_company_topic_roles",
    verificationNote: "derived",
    source: "TWSE OpenAPI t187ap04_L",
  },
  {
    id: "6214-1",
    date: "2026-05-29",
    announcedAt: "2026-05-29 10:00:00",
    companyCode: "6214",
    companyName: "精誠",
    officialSubject: "官方主旨 B",
    derivedTopics: [{ topicId: "ai-software", topicName: "AI 軟體" }],
    mappingMethod: "derived_from_company_topic_roles",
    verificationNote: "derived",
    source: "TWSE OpenAPI t187ap04_L",
  },
];

test("normalizeMajorNewsFilters keeps shared company/date/topic filter semantics", () => {
  assert.deepEqual(normalizeMajorNewsFilters({ companyCode: " 2330 ", date: "2026-06-01", topicId: " advanced-packaging " }), {
    companyCode: "2330",
    date: "2026-06-01",
    topicId: "advanced-packaging",
  });
  assert.deepEqual(normalizeMajorNewsFilters({ companyCode: "", date: "bad", topicId: "" }), {});
});

test("filterEventFocusItems applies the same company/date/topic view model used by major news", () => {
  assert.deepEqual(filterEventFocusItems(sampleItems, { companyCode: "2330" }).map((item) => item.id), ["2330-1"]);
  assert.deepEqual(filterEventFocusItems(sampleItems, { date: "2026-05-29" }).map((item) => item.id), ["6214-1"]);
  assert.deepEqual(filterEventFocusItems(sampleItems, { topicId: "advanced-packaging" }).map((item) => item.id), ["2330-1"]);
  assert.deepEqual(filterEventFocusItems(sampleItems, { companyCode: "6214", topicId: "advanced-packaging" }), []);
});

test("buildMajorNewsFilterOptions derives visible filter options from official event-focus data", () => {
  const options = buildMajorNewsFilterOptions(sampleItems);
  assert.deepEqual(options.dates, ["2026-06-01", "2026-05-29"]);
  assert.deepEqual(options.companies.map((company) => company.code), ["2330", "6214"]);
  assert.deepEqual(options.topics.map((topic) => topic.id).sort(), ["advanced-packaging", "ai-software"]);
});

test("major-news API route shares date filter metadata instead of symbol-only semantics", () => {
  const route = fs.readFileSync("src/app/api/major-news/route.ts", "utf8");
  assert.match(route, /normalizeMajorNewsFilters/);
  assert.match(route, /filters/);
  assert.match(route, /date/);
  assert.match(route, /rocYear \+ 1911/);
  assert.match(route, /item\.date\.startsWith\(filters\.date\)/);
});

test("daily report page uses shared major-news filters for event focus rendering", () => {
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");
  assert.match(page, /buildMajorNewsFilterOptions/);
  assert.match(page, /filterEventFocusItems/);
  assert.match(page, /事件篩選/);
});
