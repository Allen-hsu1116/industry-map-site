import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = "src/app/page.tsx";
const briefComponentPath = "src/components/company-detail/CompanyEditorialBrief.tsx";
const sectionInventoryComponentPath = "src/components/company-detail/CompanySectionInventory.tsx";
const detailTabsComponentPath = "src/components/company-detail/CompanyDetailTabs.tsx";
const overviewComponentPath = "src/components/company-detail/CompanyOverviewTab.tsx";
const companyInfoHeaderComponentPath = "src/components/company-detail/CompanyInfoHeader.tsx";
const financialOverviewCardsComponentPath = "src/components/company-detail/FinancialOverviewCards.tsx";
const dividendPolicyPanelComponentPath = "src/components/company-detail/DividendPolicyPanel.tsx";
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

test("Slice M1.5 extracts the overview tab shell without changing overview copy or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyOverviewTab/);
  assert.match(page, /<CompanyOverviewTab\s+financialContent=/m);
  assert.doesNotMatch(page, /function OverviewTabContent/);
  assert.match(overviewComponent, /export function CompanyOverviewTab/);
  assert.match(overviewComponent, /financialContent\(profitTab, setProfitTab\)/);
  assert.match(overviewComponent, /overviewSubTab === "news" && majorNewsContent/);

  for (const label of ["財務數據", "重大資訊"]) {
    assert.match(overviewComponent, new RegExp(label));
  }

  for (const copy of ["台積電", "最新財務概況", "股利政策", "營收分析趨勢", "獲利能力趨勢", "重大訊息公告"]) {
    assert.match(combinedSource, new RegExp(copy));
  }

  assert.doesNotMatch(overviewComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const overviewIndex = page.indexOf("<CompanyOverviewTab");
  const industryIndex = page.indexOf("{/* ─── 產業分析 Tab ─── */}");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(overviewIndex > tabsIndex, "overview tab content should remain inside the extracted tabs shell");
  assert.ok(industryIndex > overviewIndex, "overview tab content should still render before the industry tab block");
});

test("Slice M1.6 extracts the company info header without changing identity labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const companyInfoHeaderComponent = await readFile(companyInfoHeaderComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyInfoHeader/);
  assert.match(page, /<CompanyInfoHeader data=\{data\} \/>/);
  assert.doesNotMatch(page, /function CompanyInfoHeader/);
  assert.match(companyInfoHeaderComponent, /export function CompanyInfoHeader/);

  for (const label of ["市值", "產業分類", "成立年份", "董事長", "總部", "官方網站"]) {
    assert.match(companyInfoHeaderComponent, new RegExp(label));
  }

  assert.match(companyInfoHeaderComponent, /\{data\.name\}/);
  assert.match(companyInfoHeaderComponent, /\(\{data\.code\}\)/);
  assert.match(companyInfoHeaderComponent, /marketCap/);
  assert.match(companyInfoHeaderComponent, /N\/A/);
  assert.match(companyInfoHeaderComponent, /replace\(\/\^https\?:/);
  assert.match(companyInfoHeaderComponent, /ExternalIcon/);
  assert.match(combinedSource, /台積電/);

  assert.doesNotMatch(companyInfoHeaderComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const overviewIndex = page.indexOf("<CompanyOverviewTab");
  const companyInfoIndex = page.indexOf("<CompanyInfoHeader data={data} />");
  const financialCardsIndex = page.indexOf("<FinancialOverviewCards data={data} />");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(overviewIndex > tabsIndex, "overview tab content should remain inside the extracted tabs shell");
  assert.ok(companyInfoIndex > overviewIndex, "company info header should remain inside the overview financial slot");
  assert.ok(financialCardsIndex > companyInfoIndex, "company info header should still precede financial overview cards");
});

test("Slice M1.7 extracts financial overview cards without changing financial labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const companyInfoHeaderComponent = await readFile(companyInfoHeaderComponentPath, "utf8");
  const financialOverviewCardsComponent = await readFile(financialOverviewCardsComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}\n${financialOverviewCardsComponent}`;

  assert.match(page, /@\/components\/company-detail\/FinancialOverviewCards/);
  assert.match(page, /<FinancialOverviewCards data=\{data\} \/>/);
  assert.doesNotMatch(page, /function FinancialOverviewCards/);
  assert.match(financialOverviewCardsComponent, /export function FinancialOverviewCards/);

  for (const label of ["最新財務概況", "季營收", "市值", "本益比", "股價淨值比", "毛利率", "營益率", "淨利率", "EPS"]) {
    assert.match(financialOverviewCardsComponent, new RegExp(label));
  }

  assert.match(financialOverviewCardsComponent, /revenueYoy/);
  assert.match(financialOverviewCardsComponent, /formatQuarterLabel/);
  assert.match(financialOverviewCardsComponent, /formatRevenueDisplay/);
  assert.doesNotMatch(financialOverviewCardsComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const overviewIndex = page.indexOf("<CompanyOverviewTab");
  const companyInfoIndex = page.indexOf("<CompanyInfoHeader data={data} />");
  const financialCardsIndex = page.indexOf("<FinancialOverviewCards data={data} />");
  const dividendIndex = page.indexOf("<DividendPolicyPanel data={data} />");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(overviewIndex > tabsIndex, "overview tab content should remain inside the extracted tabs shell");
  assert.ok(companyInfoIndex > overviewIndex, "company info header should remain inside the overview financial slot");
  assert.ok(financialCardsIndex > companyInfoIndex, "financial overview cards should still follow company info header");
  assert.ok(dividendIndex > financialCardsIndex, "dividend panel should still follow financial overview cards");
});

test("Slice M1.8 extracts dividend policy panel without changing dividend labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const companyInfoHeaderComponent = await readFile(companyInfoHeaderComponentPath, "utf8");
  const financialOverviewCardsComponent = await readFile(financialOverviewCardsComponentPath, "utf8");
  const dividendPolicyPanelComponent = await readFile(dividendPolicyPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}\n${financialOverviewCardsComponent}\n${dividendPolicyPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/DividendPolicyPanel/);
  assert.match(page, /<DividendPolicyPanel data=\{data\} \/>/);
  assert.doesNotMatch(page, /function DividendPolicyPanel/);
  assert.match(dividendPolicyPanelComponent, /export function DividendPolicyPanel/);

  for (const label of ["股利政策", "配息頻率: 季", "歷年股利發放", "最新現金股利", "所屬年度", "現金股利", "股票股利", "合計股利", "股利年度", "📋 歷年股利資料準備中"]) {
    assert.match(dividendPolicyPanelComponent, new RegExp(label));
  }

  assert.match(dividendPolicyPanelComponent, /formatROCYear/);
  assert.match(dividendPolicyPanelComponent, /ResponsiveContainer/);
  assert.match(dividendPolicyPanelComponent, /BarChart/);
  assert.doesNotMatch(dividendPolicyPanelComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const overviewIndex = page.indexOf("<CompanyOverviewTab");
  const companyInfoIndex = page.indexOf("<CompanyInfoHeader data={data} />");
  const financialCardsIndex = page.indexOf("<FinancialOverviewCards data={data} />");
  const dividendIndex = page.indexOf("<DividendPolicyPanel data={data} />");
  const revenueIndex = page.indexOf("<RevenueAnalysisPanel");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(overviewIndex > tabsIndex, "overview tab content should remain inside the extracted tabs shell");
  assert.ok(companyInfoIndex > overviewIndex, "company info header should remain inside the overview financial slot");
  assert.ok(financialCardsIndex > companyInfoIndex, "financial overview cards should still follow company info header");
  assert.ok(dividendIndex > financialCardsIndex, "dividend panel should still follow financial overview cards");
  assert.ok(revenueIndex > dividendIndex, "revenue analysis should still follow dividend policy panel");
});
