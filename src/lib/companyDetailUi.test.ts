import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/page.tsx";
const briefComponentPath = "src/components/company-detail/CompanyEditorialBrief.tsx";

test("Goal 7 company detail opens with a Human Editorial brief before tabbed evidence modules", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");

  assert.match(page, /buildCompanyEditorialBrief/);
  assert.match(page, /<CompanyEditorialBrief editorialBrief=\{editorialBrief\} \/>/);
  assert.match(briefComponent, /company-detail-editorial-brief/);
  assert.match(page, /What changed today\?/);
  assert.match(page, /Long-term role/);
  assert.match(page, /Biggest risk/);
  assert.match(page, /Watch next/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("DETAIL_TABS.map");
  assert.ok(briefIndex > 0, "company detail editorial brief should be rendered");
  assert.ok(tabsIndex > briefIndex, "editorial brief should appear before the dense tab modules");
});

test("Goal 7 company detail exposes the approved section inventory without hiding source semantics", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}`;

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
    assert.match(combinedSource, new RegExp(label.replace(/[ /]/g, ".*")));
  }

  assert.match(combinedSource, /AI-derived/);
  assert.match(combinedSource, /checked-in evidence/);
  assert.match(combinedSource, /不可用 AI|不可用短線|不讓網站裝懂/);
});

test("Slice M1.1 keeps CompanyEditorialBrief as a component extraction only", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");

  assert.match(page, /@\/components\/company-detail\/CompanyEditorialBrief/);
  assert.match(briefComponent, /export function CompanyEditorialBrief/);
  assert.match(briefComponent, /CompanyEditorialBriefViewModel/);
  assert.doesNotMatch(briefComponent, /fetch\(|import .*\.json/);
  assert.doesNotMatch(page, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);
});
