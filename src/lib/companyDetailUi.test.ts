import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/page.tsx";
const briefComponentPath = "src/components/company-detail/CompanyEditorialBrief.tsx";
const briefViewModelPath = "src/lib/view-models/companyEditorialBrief.ts";

test("Goal 7 company detail opens with a Human Editorial brief before tabbed evidence modules", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const briefViewModel = await readFile(briefViewModelPath, "utf8");

  assert.match(page, /buildCompanyEditorialBrief/);
  assert.match(page, /<CompanyEditorialBrief editorialBrief=\{editorialBrief\} \/>/);
  assert.match(briefComponent, /company-detail-editorial-brief/);
  assert.match(briefViewModel, /What changed today\?/);
  assert.match(briefViewModel, /Long-term role/);
  assert.match(briefViewModel, /Biggest risk/);
  assert.match(briefViewModel, /Watch next/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("DETAIL_TABS.map");
  assert.ok(briefIndex > 0, "company detail editorial brief should be rendered");
  assert.ok(tabsIndex > briefIndex, "editorial brief should appear before the dense tab modules");
});

test("Goal 7 company detail exposes the approved section inventory without hiding source semantics", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const briefViewModel = await readFile(briefViewModelPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${briefViewModel}`;

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

test("Slice M1.2 keeps CompanyEditorialBrief rendering separated from its view model", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const briefViewModel = await readFile(briefViewModelPath, "utf8");

  assert.match(page, /@\/components\/company-detail\/CompanyEditorialBrief/);
  assert.match(page, /@\/lib\/view-models\/companyEditorialBrief/);
  assert.match(briefComponent, /export function CompanyEditorialBrief/);
  assert.match(briefViewModel, /export function buildCompanyEditorialBrief/);
  assert.doesNotMatch(page, /function buildCompanyEditorialBrief/);
  assert.doesNotMatch(briefComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief/);
  assert.doesNotMatch(briefViewModel, /fetch\(|import .*\.json|from "@\/components/);
  assert.doesNotMatch(`${page}\n${briefComponent}\n${briefViewModel}`, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);
});
