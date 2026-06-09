import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Goal 7 company detail opens with a Human Editorial brief before tabbed evidence modules", async () => {
  const page = await readFile("src/app/page.tsx", "utf8");

  assert.match(page, /company-detail-editorial-brief/);
  assert.match(page, /buildCompanyEditorialBrief/);
  assert.match(page, /What changed today\?/);
  assert.match(page, /Long-term role/);
  assert.match(page, /Biggest risk/);
  assert.match(page, /Watch next/);

  const briefIndex = page.indexOf("company-detail-editorial-brief");
  const tabsIndex = page.indexOf("DETAIL_TABS.map");
  assert.ok(briefIndex > 0, "company detail editorial brief should be rendered");
  assert.ok(tabsIndex > briefIndex, "editorial brief should appear before the dense tab modules");
});

test("Goal 7 company detail exposes the approved section inventory without hiding source semantics", async () => {
  const page = await readFile("src/app/page.tsx", "utf8");

  for (const label of [
    "Overview",
    "Daily AI Analysis",
    "Fundamentals",
    "Technicals",
    "Chip / Ownership",
    "News / Events",
    "Products",
    "Topic Roles",
    "SWOT",
    "Sources",
  ]) {
    assert.match(page, new RegExp(label.replace(/[ /]/g, ".*")));
  }

  assert.match(page, /AI-derived/);
  assert.match(page, /checked-in evidence/);
  assert.match(page, /不可用 AI|不可用短線|不讓網站裝懂/);
});
