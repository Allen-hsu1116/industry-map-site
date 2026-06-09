import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/page.tsx";
const briefComponentPath = "src/components/company-detail/CompanyEditorialBrief.tsx";
const sectionInventoryComponentPath = "src/components/company-detail/CompanySectionInventory.tsx";
const detailTabsComponentPath = "src/components/company-detail/CompanyDetailTabs.tsx";
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
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  assert.ok(briefIndex > 0, "company detail editorial brief should be rendered");
  assert.ok(tabsIndex > briefIndex, "editorial brief should appear before the dense tab modules");
});

test("Goal 7 company detail exposes the approved section inventory without hiding source semantics", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const briefViewModel = await readFile(briefViewModelPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${briefViewModel}`;

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
  assert.match(combinedSource, /checked-in market data/);
  assert.match(combinedSource, /partial|empty/);
  assert.match(combinedSource, /不可用 AI|不可用短線|不讓網站裝懂/);
});

test("Slice M1.3 extracts approved sections and source rail without changing the prepared-props boundary", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const briefViewModel = await readFile(briefViewModelPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${briefViewModel}`;

  assert.match(page, /@\/components\/company-detail\/CompanyEditorialBrief/);
  assert.match(page, /@\/lib\/view-models\/companyEditorialBrief/);
  assert.match(briefComponent, /import \{ CompanySectionInventory \} from "@\/components\/company-detail\/CompanySectionInventory"/);
  assert.match(briefComponent, /<CompanySectionInventory\s+approvedSections=\{editorialBrief\.approvedSections\}\s+sources=\{editorialBrief\.sources\}/m);
  assert.match(briefComponent, /export function CompanyEditorialBrief/);
  assert.match(sectionInventoryComponent, /export function CompanySectionInventory/);
  assert.match(sectionInventoryComponent, /Goal 7 approved sections/);
  assert.match(sectionInventoryComponent, /Sources/);
  assert.match(briefViewModel, /export function buildCompanyEditorialBrief/);
  assert.doesNotMatch(page, /function buildCompanyEditorialBrief/);
  assert.doesNotMatch(briefComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|editorialBrief\.approvedSections\.map|editorialBrief\.sources\.slice/);
  assert.doesNotMatch(sectionInventoryComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data/);
  assert.doesNotMatch(briefViewModel, /fetch\(|import .*\.json|from "@\/components/);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);
});

test("Slice M1.4 extracts the company detail tabs shell without changing tab labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyDetailTabs/);
  assert.match(page, /<CompanyDetailTabs\s+activeTab=\{detailTab\}\s+onTabChange=\{setDetailTab\}/m);
  assert.doesNotMatch(page, /DETAIL_TABS\.map/);
  assert.match(detailTabsComponent, /export type CompanyDetailTab = "overview" \| "industry" \| "chips" \| "tech" \| "news" \| "charts"/);
  assert.match(detailTabsComponent, /export const COMPANY_DETAIL_TABS/);
  assert.match(detailTabsComponent, /export function CompanyDetailTabs/);

  for (const label of ["基本資料", "產業分析", "籌碼分析", "技術分析", "相關新聞", "研究圖表"]) {
    assert.match(detailTabsComponent, new RegExp(label));
  }

  assert.match(detailTabsComponent, /activeTab === tab\.id/);
  assert.match(detailTabsComponent, /onClick=\{\(\) => onTabChange\(tab\.id\)\}/);
  assert.match(detailTabsComponent, /bg-indigo-500\/20 text-indigo-400/);
  assert.match(detailTabsComponent, /text-gray-400 hover:text-\[var\(--color-text-secondary\)\]/);
  assert.match(detailTabsComponent, /\{children\}/);
  assert.doesNotMatch(detailTabsComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|CompanyEditorialBrief|CompanySectionInventory|from "@\/app|from "@\/data/);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const tabContentIndex = page.indexOf("<TabErrorBoundary tabKey={detailTab}>");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(tabContentIndex > tabsIndex, "dense tab content should remain inside/after the extracted tabs shell");
});
