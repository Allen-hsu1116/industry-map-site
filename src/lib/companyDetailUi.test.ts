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
const revenueAnalysisPanelComponentPath = "src/components/company-detail/RevenueAnalysisPanel.tsx";
const profitabilityAnalysisPanelComponentPath = "src/components/company-detail/ProfitabilityAnalysisPanel.tsx";
const batchAnalysisPanelComponentPath = "src/components/company-detail/BatchAnalysisPanel.tsx";
const technicalNextSessionPanelComponentPath = "src/components/company-detail/TechnicalNextSessionPanel.tsx";
const chipValuationSnapshotPanelComponentPath = "src/components/company-detail/ChipValuationSnapshotPanel.tsx";
const companyChipsTabShellComponentPath = "src/components/company-detail/CompanyChipsTabShell.tsx";
const companyInstitutionalTrendPanelComponentPath = "src/components/company-detail/CompanyInstitutionalTrendPanel.tsx";
const companyMarginTradingPanelComponentPath = "src/components/company-detail/CompanyMarginTradingPanel.tsx";
const majorNewsListPanelComponentPath = "src/components/company-detail/MajorNewsListPanel.tsx";
const relatedNewsListPanelComponentPath = "src/components/company-detail/RelatedNewsListPanel.tsx";
const companyDetailHeroHeaderComponentPath = "src/components/company-detail/CompanyDetailHeroHeader.tsx";
const companyIndustryKnowledgeOverviewComponentPath = "src/components/company-detail/CompanyIndustryKnowledgeOverview.tsx";
const companyIndustryTabShellComponentPath = "src/components/company-detail/CompanyIndustryTabShell.tsx";
const companyIndustryRoleNavigationComponentPath = "src/components/company-detail/CompanyIndustryRoleNavigation.tsx";
const companyIndustryRoleSummaryPanelComponentPath = "src/components/company-detail/CompanyIndustryRoleSummaryPanel.tsx";
const companyIndustryMarketPositionPanelComponentPath = "src/components/company-detail/CompanyIndustryMarketPositionPanel.tsx";
const companyIndustryTechnologyFocusPanelComponentPath = "src/components/company-detail/CompanyIndustryTechnologyFocusPanel.tsx";
const companyIndustryProductsPanelComponentPath = "src/components/company-detail/CompanyIndustryProductsPanel.tsx";
const companyIndustryCustomersPanelComponentPath = "src/components/company-detail/CompanyIndustryCustomersPanel.tsx";
const companyIndustrySwotPanelComponentPath = "src/components/company-detail/CompanyIndustrySwotPanel.tsx";
const companyIndustrySupplyChainRolePanelComponentPath = "src/components/company-detail/CompanyIndustrySupplyChainRolePanel.tsx";
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
  const majorNewsListPanelComponent = await readFile(majorNewsListPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${majorNewsListPanelComponent}`;

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

test("Slice M1.9 extracts revenue analysis panel without changing revenue labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const companyInfoHeaderComponent = await readFile(companyInfoHeaderComponentPath, "utf8");
  const financialOverviewCardsComponent = await readFile(financialOverviewCardsComponentPath, "utf8");
  const dividendPolicyPanelComponent = await readFile(dividendPolicyPanelComponentPath, "utf8");
  const revenueAnalysisPanelComponent = await readFile(revenueAnalysisPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}\n${financialOverviewCardsComponent}\n${dividendPolicyPanelComponent}\n${revenueAnalysisPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/RevenueAnalysisPanel/);
  assert.match(page, /<RevenueAnalysisPanel[\s\S]*data=\{data\}[\s\S]*revenueTab=\{revenueTab\}[\s\S]*onRevenueTabChange=\{setRevenueTab\}/);
  assert.doesNotMatch(page, /function RevenueAnalysisPanel/);
  assert.doesNotMatch(page, /function RevenueComposedChart/);
  assert.match(revenueAnalysisPanelComponent, /export function RevenueAnalysisPanel/);
  assert.match(revenueAnalysisPanelComponent, /function RevenueComposedChart/);

  for (const label of ["營收分析趨勢", "月份", "季度", "年度", "營收（元→億）", "MoM", "YoY", "QoQ", "年度YoY%", "📋 月營收資料累積中", "📋 季度資料累積中", "📋 年度資料準備中"]) {
    assert.match(revenueAnalysisPanelComponent, new RegExp(label));
  }

  for (const helper of ["formatTrendMonth", "formatRevenueNTDDisplay", "formatRevenueDisplay", "formatQuarterLabel", "formatPercentNum", "CHART_COLORS", "RevenueComposedChart"]) {
    assert.match(revenueAnalysisPanelComponent, new RegExp(helper));
  }

  assert.doesNotMatch(revenueAnalysisPanelComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const overviewIndex = page.indexOf("<CompanyOverviewTab");
  const companyInfoIndex = page.indexOf("<CompanyInfoHeader data={data} />");
  const financialCardsIndex = page.indexOf("<FinancialOverviewCards data={data} />");
  const dividendIndex = page.indexOf("<DividendPolicyPanel data={data} />");
  const revenueIndex = page.indexOf("<RevenueAnalysisPanel");
  const profitabilityIndex = page.indexOf("<ProfitabilityAnalysisPanel");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(overviewIndex > tabsIndex, "overview tab content should remain inside the extracted tabs shell");
  assert.ok(companyInfoIndex > overviewIndex, "company info header should remain inside the overview financial slot");
  assert.ok(financialCardsIndex > companyInfoIndex, "financial overview cards should still follow company info header");
  assert.ok(dividendIndex > financialCardsIndex, "dividend panel should still follow financial overview cards");
  assert.ok(revenueIndex > dividendIndex, "revenue analysis should still follow dividend policy panel");
  assert.ok(profitabilityIndex > revenueIndex, "profitability analysis should still follow revenue analysis");
});

test("Slice M1.10 extracts profitability analysis panel without changing profitability labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const companyInfoHeaderComponent = await readFile(companyInfoHeaderComponentPath, "utf8");
  const financialOverviewCardsComponent = await readFile(financialOverviewCardsComponentPath, "utf8");
  const dividendPolicyPanelComponent = await readFile(dividendPolicyPanelComponentPath, "utf8");
  const revenueAnalysisPanelComponent = await readFile(revenueAnalysisPanelComponentPath, "utf8");
  const profitabilityAnalysisPanelComponent = await readFile(profitabilityAnalysisPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}\n${financialOverviewCardsComponent}\n${dividendPolicyPanelComponent}\n${revenueAnalysisPanelComponent}\n${profitabilityAnalysisPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/ProfitabilityAnalysisPanel/);
  assert.match(page, /<ProfitabilityAnalysisPanel[\s\S]*data=\{data\}[\s\S]*profitTab=\{profitTab\}[\s\S]*onProfitTabChange=\{setProfitTab\}/);
  assert.doesNotMatch(page, /function ProfitabilityAnalysisPanel/);
  assert.doesNotMatch(page, /function ProfitabilityQuarterlyView/);
  assert.doesNotMatch(page, /function ProfitabilityChartAndTable/);
  assert.match(profitabilityAnalysisPanelComponent, /export function ProfitabilityAnalysisPanel/);
  assert.match(profitabilityAnalysisPanelComponent, /function ProfitabilityQuarterlyView/);
  assert.match(profitabilityAnalysisPanelComponent, /function ProfitabilityChartAndTable/);

  for (const label of ["獲利能力趨勢", "季度", "年度", "毛利率", "營益率", "淨利率", "EPS", "📋 季度資料累積中"]) {
    assert.match(profitabilityAnalysisPanelComponent, new RegExp(label));
  }

  for (const helper of ["formatQuarterLabel", "rechartsAxisStyle", "ComposedChart", "grossMargin", "operatingMargin", "netMargin"]) {
    assert.match(profitabilityAnalysisPanelComponent, new RegExp(helper));
  }

  assert.doesNotMatch(profitabilityAnalysisPanelComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const overviewIndex = page.indexOf("<CompanyOverviewTab");
  const companyInfoIndex = page.indexOf("<CompanyInfoHeader data={data} />");
  const financialCardsIndex = page.indexOf("<FinancialOverviewCards data={data} />");
  const dividendIndex = page.indexOf("<DividendPolicyPanel data={data} />");
  const revenueIndex = page.indexOf("<RevenueAnalysisPanel");
  const profitabilityIndex = page.indexOf("<ProfitabilityAnalysisPanel");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(overviewIndex > tabsIndex, "overview tab content should remain inside the extracted tabs shell");
  assert.ok(companyInfoIndex > overviewIndex, "company info header should remain inside the overview financial slot");
  assert.ok(financialCardsIndex > companyInfoIndex, "financial overview cards should still follow company info header");
  assert.ok(dividendIndex > financialCardsIndex, "dividend panel should still follow financial overview cards");
  assert.ok(revenueIndex > dividendIndex, "revenue analysis should still follow dividend policy panel");
  assert.ok(profitabilityIndex > revenueIndex, "profitability analysis should still follow revenue analysis");
});

test("Slice M1.11 extracts batch analysis panel without changing analysis labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const sectionInventoryComponent = await readFile(sectionInventoryComponentPath, "utf8");
  const detailTabsComponent = await readFile(detailTabsComponentPath, "utf8");
  const overviewComponent = await readFile(overviewComponentPath, "utf8");
  const companyInfoHeaderComponent = await readFile(companyInfoHeaderComponentPath, "utf8");
  const financialOverviewCardsComponent = await readFile(financialOverviewCardsComponentPath, "utf8");
  const dividendPolicyPanelComponent = await readFile(dividendPolicyPanelComponentPath, "utf8");
  const revenueAnalysisPanelComponent = await readFile(revenueAnalysisPanelComponentPath, "utf8");
  const profitabilityAnalysisPanelComponent = await readFile(profitabilityAnalysisPanelComponentPath, "utf8");
  const batchAnalysisPanelComponent = await readFile(batchAnalysisPanelComponentPath, "utf8");
  const companyChipsTabShellComponent = await readFile(companyChipsTabShellComponentPath, "utf8");
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}\n${financialOverviewCardsComponent}\n${dividendPolicyPanelComponent}\n${revenueAnalysisPanelComponent}\n${profitabilityAnalysisPanelComponent}\n${batchAnalysisPanelComponent}\n${companyChipsTabShellComponent}`;

  assert.match(page, /@\/components\/company-detail\/BatchAnalysisPanel/);
  assert.match(page, /@\/components\/company-detail\/CompanyChipsTabShell/);
  assert.match(companyChipsTabShellComponent, /<BatchAnalysisPanel[\s\S]*title="🧠 籌碼收盤後判讀"[\s\S]*badge=\{dailyAnalysis\.chips\.label\}/);
  assert.match(page, /<BatchAnalysisPanel[\s\S]*title="📊 技術分析判讀"[\s\S]*badge=\{resolvedDailyAnalysis\.technical\.label\}/);
  assert.doesNotMatch(page, /function BatchAnalysisPanel/);
  assert.match(batchAnalysisPanelComponent, /export interface BatchAnalysisPanelProps/);
  assert.match(batchAnalysisPanelComponent, /export function BatchAnalysisPanel/);

  for (const label of ["規則式判讀", "正向訊號", "風險訊號", "觀察重點", "暫無明顯訊號", "即時計算"]) {
    assert.match(batchAnalysisPanelComponent, new RegExp(label));
  }

  for (const prop of ["title", "badge", "score", "summary", "signals", "risks", "watch", "generatedAt", "description"]) {
    assert.match(batchAnalysisPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(batchAnalysisPanelComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  const chipsTabIndex = page.indexOf("{/* ─── 籌碼分析 Tab ─── */}");
  const chipsShellIndex = page.indexOf("<CompanyChipsTabShell");
  const chipSnapshotInShellIndex = companyChipsTabShellComponent.indexOf("<ChipValuationSnapshotPanel");
  const chipsBatchInShellIndex = companyChipsTabShellComponent.indexOf("title=\"🧠 籌碼收盤後判讀\"");
  const techTabIndex = page.indexOf("{/* ─── 技術分析 Tab ─── */}");
  const techBatchIndex = page.indexOf("title=\"📊 技術分析判讀\"");
  const newsTabIndex = page.indexOf("{/* ─── 相關新聞 Tab ─── */}");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(chipsShellIndex > chipsTabIndex, "chips shell should remain inside chips tab");
  assert.ok(chipsBatchInShellIndex > chipSnapshotInShellIndex, "chips batch analysis should still follow valuation snapshot inside chips shell");
  assert.ok(techBatchIndex > techTabIndex, "technical batch analysis should remain inside technical tab");
  assert.ok(newsTabIndex > techBatchIndex, "technical batch analysis should still precede the news tab");
});

test("Slice M1.12 extracts technical next-session panel without changing trigger copy or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const technicalNextSessionPanelComponent = await readFile(technicalNextSessionPanelComponentPath, "utf8");
  const batchAnalysisPanelComponent = await readFile(batchAnalysisPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${technicalNextSessionPanelComponent}\n${batchAnalysisPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/TechnicalNextSessionPanel/);
  assert.match(page, /<TechnicalNextSessionPanel\s+nextSession=\{resolvedDailyAnalysis\.nextSession\}\s+\/>/);
  assert.doesNotMatch(page, /🎯 明日觀察與盤中觸發條件[\s\S]*resolvedDailyAnalysis\.nextSession\.focus\.map/);
  assert.match(technicalNextSessionPanelComponent, /export interface TechnicalNextSessionPanelProps/);
  assert.match(technicalNextSessionPanelComponent, /export function TechnicalNextSessionPanel/);

  for (const label of ["🎯 明日觀察與盤中觸發條件", "觀察重點", "觸發條件"]) {
    assert.match(technicalNextSessionPanelComponent, new RegExp(label));
  }

  for (const prop of ["nextSession", "focus", "triggerRules"]) {
    assert.match(technicalNextSessionPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(technicalNextSessionPanelComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const techTabIndex = page.indexOf("{/* ─── 技術分析 Tab ─── */}");
  const techBatchIndex = page.indexOf("title=\"📊 技術分析判讀\"");
  const nextSessionIndex = page.indexOf("<TechnicalNextSessionPanel");
  const newsTabIndex = page.indexOf("{/* ─── 相關新聞 Tab ─── */}");
  assert.ok(techBatchIndex > techTabIndex, "technical batch analysis should remain inside technical tab");
  assert.ok(nextSessionIndex > techBatchIndex, "next-session panel should still follow technical batch analysis");
  assert.ok(newsTabIndex > nextSessionIndex, "next-session panel should still precede the news tab");
});

test("Slice M1.13 extracts chip valuation snapshot without changing chips labels or route behavior", async () => {
  const page = await readFile(pagePath, "utf8");
  const chipValuationSnapshotPanelComponent = await readFile(chipValuationSnapshotPanelComponentPath, "utf8");
  const batchAnalysisPanelComponent = await readFile(batchAnalysisPanelComponentPath, "utf8");
  const companyChipsTabShellComponent = await readFile(companyChipsTabShellComponentPath, "utf8");
  const combinedSource = `${page}\n${chipValuationSnapshotPanelComponent}\n${batchAnalysisPanelComponent}\n${companyChipsTabShellComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyChipsTabShell/);
  assert.match(companyChipsTabShellComponent, /@\/components\/company-detail\/ChipValuationSnapshotPanel/);
  assert.match(companyChipsTabShellComponent, /<ChipValuationSnapshotPanel\s+data=\{data\}\s+\/>/);
  assert.doesNotMatch(page, /<StatItem label="本益比 \(P\/E\)"[\s\S]*<StatItem label="負債比"/);
  assert.doesNotMatch(page, /function StatItem/);
  assert.match(chipValuationSnapshotPanelComponent, /export interface ChipValuationSnapshotPanelProps/);
  assert.match(chipValuationSnapshotPanelComponent, /export function ChipValuationSnapshotPanel/);
  assert.match(chipValuationSnapshotPanelComponent, /function StatItem/);

  for (const label of ["🎰 籌碼分析", "本益比 (P/E)", "股價淨值比 (P/B)", "現金殖利率", "負債比"]) {
    assert.match(chipValuationSnapshotPanelComponent, new RegExp(label.replace(/[()]/g, "\\$&")));
  }

  for (const prop of ["valuation", "balance", "totalAssets", "totalLiabilities", "dividendYield"]) {
    assert.match(chipValuationSnapshotPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(chipValuationSnapshotPanelComponent, /fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const chipsTabIndex = page.indexOf("{/* ─── 籌碼分析 Tab ─── */}");
  const chipsShellIndex = page.indexOf("<CompanyChipsTabShell");
  const chipSnapshotInShellIndex = companyChipsTabShellComponent.indexOf("<ChipValuationSnapshotPanel");
  const chipsBatchInShellIndex = companyChipsTabShellComponent.indexOf("title=\"🧠 籌碼收盤後判讀\"");
  const childrenInShellIndex = companyChipsTabShellComponent.indexOf("{children}");
  const institutionalIndex = page.indexOf("{/* ─── 三大法人歷史趨勢（圖+表） ─── */}");
  assert.ok(chipsShellIndex > chipsTabIndex, "chips shell should remain inside chips tab");
  assert.ok(chipSnapshotInShellIndex >= 0, "chip valuation snapshot should render from chips shell");
  assert.ok(chipsBatchInShellIndex > chipSnapshotInShellIndex, "chips batch analysis should still follow valuation snapshot");
  assert.ok(childrenInShellIndex > chipsBatchInShellIndex, "dense chip children should still follow chips batch analysis");
  assert.ok(institutionalIndex > chipsShellIndex, "institutional trend should still render inside chips shell children");
});

test("Slice M1.14 extracts major news list panel while keeping dynamic fetch container unchanged", async () => {
  const page = await readFile(pagePath, "utf8");
  const majorNewsListPanelComponent = await readFile(majorNewsListPanelComponentPath, "utf8");
  const overviewTabComponent = await readFile(overviewComponentPath, "utf8");
  const combinedSource = `${page}\n${majorNewsListPanelComponent}\n${overviewTabComponent}`;

  assert.match(page, /@\/components\/company-detail\/MajorNewsListPanel/);
  assert.match(page, /function DynamicMajorNewsPanel/);
  assert.match(page, /fetch\(`\/api\/major-news\?symbol=/);
  assert.match(page, /<MajorNewsListPanel[\s\S]*majorNews=\{majorNews\}[\s\S]*loading=\{loading\}[\s\S]*error=\{error\}[\s\S]*source=\{source\}[\s\S]*fetchedAt=\{fetchedAt\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /📋 重大訊息公告[\s\S]*majorNews\.slice\(0, 15\)\.map/);

  assert.match(majorNewsListPanelComponent, /export interface MajorNewsListPanelProps/);
  assert.match(majorNewsListPanelComponent, /export function MajorNewsListPanel/);
  assert.match(majorNewsListPanelComponent, /majorNews\.slice\(0, 15\)\.map/);

  for (const label of ["📋 重大訊息公告", "即時查詢公開資訊觀測站中", "資料來源：", "⏳ 載入重大訊息中", "尚未載入重大訊息資料", "公開資訊觀測站為準"]) {
    assert.match(majorNewsListPanelComponent, new RegExp(label));
  }

  for (const prop of ["majorNews", "loading", "error", "source", "fetchedAt"]) {
    assert.match(majorNewsListPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(majorNewsListPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const dynamicContainerIndex = page.indexOf("function DynamicMajorNewsPanel");
  const fetchIndex = page.indexOf("fetch(`/api/major-news?symbol=");
  const panelIndex = page.indexOf("<MajorNewsListPanel");
  const newsTabIndex = page.indexOf("function NewsTabContent");
  assert.ok(fetchIndex > dynamicContainerIndex, "major news fetch should stay in the dynamic container");
  assert.ok(panelIndex > fetchIndex, "presentational panel should render after container state is prepared");
  assert.ok(newsTabIndex > panelIndex, "news tab container should still follow major news container definition");
});

test("Slice M1.15 extracts related news list panel while keeping /api/news container unchanged", async () => {
  const page = await readFile(pagePath, "utf8");
  const relatedNewsListPanelComponent = await readFile(relatedNewsListPanelComponentPath, "utf8");
  const majorNewsListPanelComponent = await readFile(majorNewsListPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${relatedNewsListPanelComponent}\n${majorNewsListPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/RelatedNewsListPanel/);
  assert.match(page, /function NewsTabContent/);
  assert.match(page, /fetch\(`\/api\/news\?symbol=/);
  assert.match(page, /<RelatedNewsListPanel[\s\S]*news=\{news\}[\s\S]*loading=\{loading\}[\s\S]*error=\{error\}[\s\S]*name=\{name\}[\s\S]*code=\{code\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /📰 相關新聞[\s\S]*news\.map\(\(item, i\)/);

  assert.match(relatedNewsListPanelComponent, /export interface RelatedNewsListPanelProps/);
  assert.match(relatedNewsListPanelComponent, /export function RelatedNewsListPanel/);
  assert.match(relatedNewsListPanelComponent, /news\.map\(\(item, i\)/);

  for (const label of ["📰 相關新聞", "近 30 日報導", "⏳ 載入中", "新聞載入失敗", "📋 近期無相關新聞"]) {
    assert.match(relatedNewsListPanelComponent, new RegExp(label));
  }

  for (const prop of ["news", "loading", "error", "name", "code", "title", "link", "source", "date"]) {
    assert.match(relatedNewsListPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(relatedNewsListPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const newsContainerIndex = page.indexOf("function NewsTabContent");
  const fetchIndex = page.indexOf("fetch(`/api/news?symbol=");
  const relatedPanelIndex = page.indexOf("<RelatedNewsListPanel");
  const majorPanelIndex = page.indexOf("<DynamicMajorNewsPanel");
  assert.ok(fetchIndex > newsContainerIndex, "related news fetch should stay in the news tab container");
  assert.ok(relatedPanelIndex > fetchIndex, "related-news panel should render after container state is prepared");
  assert.ok(majorPanelIndex > relatedPanelIndex, "major-news panel should still follow related-news panel inside the news tab");
});

test("Slice M1.16 extracts company detail hero header without moving quote/state ownership", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyDetailHeroHeaderComponent = await readFile(companyDetailHeroHeaderComponentPath, "utf8");
  const briefComponent = await readFile(briefComponentPath, "utf8");
  const combinedSource = `${page}\n${companyDetailHeroHeaderComponent}\n${briefComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyDetailHeroHeader/);
  assert.match(page, /<CompanyDetailHeroHeader[\s\S]*data=\{data\}[\s\S]*marketPosition=\{marketPos\}[\s\S]*badges=\{badges\}[\s\S]*onBack=\{onBack\}[\s\S]*quoteContent=\{<RealtimeQuote code=\{data\.code\} \/>\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /Top Bar: Back \+ Company Header[\s\S]*加入收藏[\s\S]*CompanyEditorialBrief/);

  assert.match(companyDetailHeroHeaderComponent, /export interface CompanyDetailHeroHeaderProps/);
  assert.match(companyDetailHeroHeaderComponent, /export function CompanyDetailHeroHeader/);

  for (const label of ["返回", "加入收藏"]) {
    assert.match(companyDetailHeroHeaderComponent, new RegExp(label));
  }

  for (const dynamicBadgeSource of ["月營收年增", "連三月年增", "投信買超", "有股票期貨"]) {
    assert.match(combinedSource, new RegExp(dynamicBadgeSource));
  }

  for (const prop of ["data", "marketPosition", "badges", "onBack", "quoteContent", "profile", "industry"]) {
    assert.match(companyDetailHeroHeaderComponent, new RegExp(prop));
  }

  assert.doesNotMatch(companyDetailHeroHeaderComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const headerIndex = page.indexOf("<CompanyDetailHeroHeader");
  const quoteIndex = page.indexOf("quoteContent={<RealtimeQuote code={data.code} />}");
  const briefIndex = page.indexOf("<CompanyEditorialBrief editorialBrief={editorialBrief} />");
  const tabsIndex = page.indexOf("<CompanyDetailTabs");
  assert.ok(headerIndex > 0, "company detail hero header should render from the page");
  assert.ok(quoteIndex > headerIndex, "realtime quote should stay owned by the page and be passed as prepared content");
  assert.ok(briefIndex > headerIndex, "human editorial brief should still follow the company hero header");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
});


test("Slice M1.17 extracts industry knowledge overview without changing evidence semantics", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryKnowledgeOverviewComponent = await readFile(companyIndustryKnowledgeOverviewComponentPath, "utf8");
  const companyIndustryTabShellComponent = await readFile(companyIndustryTabShellComponentPath, "utf8");
  const heroHeaderComponent = await readFile(companyDetailHeroHeaderComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryTabShellComponent}\n${companyIndustryKnowledgeOverviewComponent}\n${heroHeaderComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryTabShell/);
  assert.match(page, /<CompanyIndustryTabShell[\s\S]*industryInsights=\{industryInsights\}[\s\S]*hasIndustryRoles=\{industryRoles\.length > 0\}/);
  assert.match(combinedSource, /@\/components\/company-detail\/CompanyIndustryKnowledgeOverview/);
  assert.match(combinedSource, /<CompanyIndustryKnowledgeOverview\s+industryInsights=\{industryInsights\}\s+\/>/);
  assert.doesNotMatch(page, /Industrial analysis knowledge base[\s\S]*Object\.values\(industryInsights\.panels\.swot\.groups\)\.flat\(\)\.length[\s\S]*Industry sub-tabs/);

  assert.match(companyIndustryKnowledgeOverviewComponent, /export interface CompanyIndustryKnowledgeOverviewProps/);
  assert.match(companyIndustryKnowledgeOverviewComponent, /export function CompanyIndustryKnowledgeOverview/);

  for (const label of [
    "Industrial analysis knowledge base",
    "產品 / 題材角色 / SWOT 產業知識總覽",
    "checked-in evidence-backed",
    "partial/empty",
    "產品知識",
    "題材角色",
    "SWOT",
    "products",
    "verified",
    "candidate",
    "尚未驗證",
  ]) {
    assert.match(companyIndustryKnowledgeOverviewComponent, new RegExp(label.replace(/[ /]/g, ".*")));
  }

  for (const prop of ["industryInsights", "sourceStatus", "panels", "products", "topicRoles", "swot", "groups"]) {
    assert.match(companyIndustryKnowledgeOverviewComponent, new RegExp(prop));
  }

  assert.doesNotMatch(companyIndustryKnowledgeOverviewComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const industryTabIndex = page.indexOf("{/* ─── 產業分析 Tab ─── */}");
  const tabShellIndex = page.indexOf("<CompanyIndustryTabShell");
  const rolesSummaryIndex = page.indexOf("<CompanyIndustryRoleNavigation");
  const industrySubTabsIndex = page.indexOf("{/* Selected industry detail */}");
  assert.ok(tabShellIndex > industryTabIndex, "industry tab shell should remain inside industry tab");
  assert.ok(rolesSummaryIndex > tabShellIndex, "industry role summary should still follow the shell overview");
  assert.ok(industrySubTabsIndex > rolesSummaryIndex, "industry sub-tabs should still follow the role summary");
});


test("Slice M1.18 extracts industry role navigation without moving selected-detail state ownership", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryRoleNavigationComponent = await readFile(companyIndustryRoleNavigationComponentPath, "utf8");
  const knowledgeOverviewComponent = await readFile(companyIndustryKnowledgeOverviewComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryRoleNavigationComponent}\n${knowledgeOverviewComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryRoleNavigation/);
  assert.match(page, /<CompanyIndustryRoleNavigation[\s\S]*roles=\{industryRoles\}[\s\S]*activeIndex=\{industrySubTab\}[\s\S]*onRoleChange=\{setIndustrySubTab\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /產業定位總覽[\s\S]*Industry sub-tabs[\s\S]*industryRoles\.map\(\(role, i\) =>/);

  assert.match(companyIndustryRoleNavigationComponent, /export interface CompanyIndustryRoleNavigationProps/);
  assert.match(companyIndustryRoleNavigationComponent, /export function CompanyIndustryRoleNavigation/);

  for (const label of [
    "產業定位總覽",
    "已過濾間接受惠題材",
    "個直接角色",
    "直接產品/技術平台/供應鏈角色",
    "核心歸屬",
  ]) {
    assert.match(companyIndustryRoleNavigationComponent, new RegExp(label));
  }

  for (const prop of ["roles", "activeIndex", "onRoleChange", "topicName", "solid"]) {
    assert.match(companyIndustryRoleNavigationComponent, new RegExp(prop));
  }

  assert.match(page, /const industryRoles = roles \|\| \[\];/);
  assert.doesNotMatch(companyIndustryRoleNavigationComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const industryTabIndex = page.indexOf("{/* ─── 產業分析 Tab ─── */}");
  const tabShellIndex = page.indexOf("<CompanyIndustryTabShell");
  const roleNavigationIndex = page.indexOf("<CompanyIndustryRoleNavigation");
  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  assert.ok(tabShellIndex > industryTabIndex, "industry tab shell should remain first in industry tab");
  assert.ok(roleNavigationIndex > tabShellIndex, "industry role navigation should follow the shell overview");
  assert.ok(selectedDetailIndex > roleNavigationIndex, "selected industry detail should still follow role navigation");
});


test("Slice M1.19 extracts industry role summary and evidence coverage as a presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryRoleSummaryPanelComponent = await readFile(companyIndustryRoleSummaryPanelComponentPath, "utf8");
  const roleNavigationComponent = await readFile(companyIndustryRoleNavigationComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryRoleSummaryPanelComponent}\n${roleNavigationComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryRoleSummaryPanel/);
  assert.match(page, /<CompanyIndustryRoleSummaryPanel[\s\S]*summary=\{topicAnalysis\.ai_summary \|\| analysisText\}[\s\S]*integratedDailyNote=\{integratedDailyNote\}[\s\S]*dailyIndustry=\{dailyIndustryApplies \? dailyIndustry : undefined\}[\s\S]*evidenceCoverageCards=\{evidenceCoverageCards\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /題材角色統整摘要[\s\S]*Evidence-backed coverage[\s\S]*evidenceCoverageCards\.map/);

  assert.match(companyIndustryRoleSummaryPanelComponent, /export interface CompanyIndustryRoleSummaryPanelProps/);
  assert.match(companyIndustryRoleSummaryPanelComponent, /export function CompanyIndustryRoleSummaryPanel/);

  for (const label of [
    "題材角色統整摘要",
    "來源整合",
    "Daily industry score",
    "Evidence-backed coverage",
    "證據覆蓋與資料信心水位",
    "資料不足項目只做觀察，不升級成推薦",
  ]) {
    assert.match(companyIndustryRoleSummaryPanelComponent, new RegExp(label));
  }

  for (const prop of [
    "summary",
    "integratedDailyNote",
    "dailyIndustry",
    "evidenceCoverageCards",
    "displayRoleBadge",
    "displayRelInfo",
    "canonicalRoleLabel",
    "topicName",
    "category",
  ]) {
    assert.match(companyIndustryRoleSummaryPanelComponent, new RegExp(prop));
  }

  assert.match(page, /const evidenceCoverageCards = \[/);
  assert.match(page, /const topicAnalysis = \{/);
  assert.doesNotMatch(companyIndustryRoleSummaryPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|findProductKnowledgeItem|productKnowledgeToNarrative|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const roleNavigationIndex = page.indexOf("<CompanyIndustryRoleNavigation");
  const summaryPanelIndex = page.indexOf("<CompanyIndustryRoleSummaryPanel");
  const marketPositionIndex = page.indexOf("<CompanyIndustryMarketPositionPanel");
  assert.ok(summaryPanelIndex > selectedDetailIndex, "role summary panel should remain in the selected industry detail block");
  assert.ok(summaryPanelIndex > roleNavigationIndex, "role summary panel should follow role navigation");
  assert.ok(marketPositionIndex > summaryPanelIndex, "market positioning panel should still follow the extracted summary/coverage panel");
});

test("Slice M1.20 extracts industry market positioning as a presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryMarketPositionPanelComponent = await readFile(companyIndustryMarketPositionPanelComponentPath, "utf8");
  const roleSummaryPanelComponent = await readFile(companyIndustryRoleSummaryPanelComponentPath, "utf8");
  const combinedSource = `${page}
${companyIndustryMarketPositionPanelComponent}
${roleSummaryPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryMarketPositionPanel/);
  assert.match(page, /<CompanyIndustryMarketPositionPanel[\s\S]*marketPosition=\{stripLeadingStatusIcon\(topicAnalysis\?\.market_position\) \|\| marketPos\.label\}[\s\S]*detail=\{topicAnalysis\?\.market_position_detail \|\| `\$\{data\.name\}為\$\{role\.topicName\}產業之關鍵參與者，在供應鏈中扮演\$\{relInfo\.label\}角色。`\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /🎯 市場定位[\s\S]*stripLeadingStatusIcon\(topicAnalysis\?\.market_position\)/);

  assert.match(companyIndustryMarketPositionPanelComponent, /export interface CompanyIndustryMarketPositionPanelProps/);
  assert.match(companyIndustryMarketPositionPanelComponent, /export function CompanyIndustryMarketPositionPanel/);

  for (const label of [
    "🎯 市場定位",
    "marketPosition",
    "detail",
    "龍頭",
    "成長",
    "#34d399",
    "#fbbf24",
    "#60a5fa",
  ]) {
    assert.match(companyIndustryMarketPositionPanelComponent, new RegExp(label));
  }

  assert.match(page, /const topicAnalysis = \{/);
  assert.match(page, /market_position: canonicalRoleLabel \|\| roleKnowledge\?\.marketPosition \|\| relInfo\.label/);
  assert.match(page, /market_position_detail: canonicalRole\?\.roleSummary \|\| dailyCanonicalRole\?\.roleSummary \|\| roleKnowledge\?\.role/);
  assert.doesNotMatch(companyIndustryMarketPositionPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|findProductKnowledgeItem|productKnowledgeToNarrative|stripLeadingStatusIcon|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const roleSummaryPanelIndex = page.indexOf("<CompanyIndustryRoleSummaryPanel");
  const marketPositionPanelIndex = page.indexOf("<CompanyIndustryMarketPositionPanel");
  const technologyFocusIndex = page.indexOf("<CompanyIndustryTechnologyFocusPanel");
  assert.ok(marketPositionPanelIndex > selectedDetailIndex, "market positioning panel should remain in selected industry detail block");
  assert.ok(marketPositionPanelIndex > roleSummaryPanelIndex, "market positioning panel should follow role summary/evidence panel");
  assert.ok(technologyFocusIndex > marketPositionPanelIndex, "technology focus should still follow market positioning");
});

test("Slice M1.21 extracts industry technology focus as a presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryTechnologyFocusPanelComponent = await readFile(companyIndustryTechnologyFocusPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryTechnologyFocusPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryTechnologyFocusPanel/);
  assert.match(page, /<CompanyIndustryTechnologyFocusPanel[\s\S]*focus=\{topicAnalysis\.focus\}[\s\S]*dailyIndustrySignals=\{dailyIndustryApplies && dailyIndustry \? dailyIndustry\.signals : \[\]\}[\s\S]*dailyIndustryRisks=\{dailyIndustryApplies && dailyIndustry \? dailyIndustry\.risks : \[\]\}[\s\S]*dailyIndustryWatch=\{dailyIndustryApplies && dailyIndustry \? dailyIndustry\.watch : \[\]\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /🔬 技術重心[\s\S]*topicAnalysis\.focus\.split/);

  assert.match(companyIndustryTechnologyFocusPanelComponent, /export interface CompanyIndustryTechnologyFocusPanelProps/);
  assert.match(companyIndustryTechnologyFocusPanelComponent, /export function CompanyIndustryTechnologyFocusPanel/);

  for (const label of [
    "🔬 技術重心",
    "focus",
    "dailyIndustrySignals",
    "dailyIndustryRisks",
    "dailyIndustryWatch",
    "題材正向訊號",
    "題材風險",
    "觀察重點",
    "slice(0, 3)",
  ]) {
    assert.match(companyIndustryTechnologyFocusPanelComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const focusText = role\.tech_focus\?\.length \? role\.tech_focus\.join/);
  assert.match(page, /focus: focusText/);
  assert.match(page, /const dailyIndustry = resolvedDailyAnalysis\?\.industry/);
  assert.match(page, /const dailyIndustryApplies = Boolean\(dailyIndustry && primaryTopicId === role\.topic\)/);
  assert.doesNotMatch(companyIndustryTechnologyFocusPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|findProductKnowledgeItem|productKnowledgeToNarrative|stripLeadingStatusIcon|dailyIndustryApplies|topicAnalysis|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const marketPositionPanelIndex = page.indexOf("<CompanyIndustryMarketPositionPanel");
  const technologyFocusPanelIndex = page.indexOf("<CompanyIndustryTechnologyFocusPanel");
  const productSectionIndex = page.indexOf("{/* 主要產品 */}");
  assert.ok(technologyFocusPanelIndex > selectedDetailIndex, "technology focus panel should remain in selected industry detail block");
  assert.ok(technologyFocusPanelIndex > marketPositionPanelIndex, "technology focus panel should follow market positioning");
  assert.ok(productSectionIndex > technologyFocusPanelIndex, "products section should still follow technology focus");
});

test("Slice M1.22 extracts industry products as a prepared-props presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryTechnologyFocusPanelComponent = await readFile(companyIndustryTechnologyFocusPanelComponentPath, "utf8");
  const companyIndustryProductsPanelComponent = await readFile(companyIndustryProductsPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryTechnologyFocusPanelComponent}\n${companyIndustryProductsPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryProductsPanel/);
  assert.match(page, /<CompanyIndustryProductsPanel[\s\S]*products=\{productNarrativeRows\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /📦 主要產品[\s\S]*findProductKnowledgeItem\(/);

  assert.match(companyIndustryProductsPanelComponent, /export interface CompanyIndustryProductsPanelProps/);
  assert.match(companyIndustryProductsPanelComponent, /export interface CompanyIndustryProductNarrativeRow/);
  assert.match(companyIndustryProductsPanelComponent, /export function CompanyIndustryProductsPanel/);

  for (const label of [
    "📦 主要產品",
    "products",
    "confidence",
    "lastVerified",
    "題材角色",
    "為什麼重要",
    "營運影響",
    "來源：",
    "sourceLabels",
    "sourceUrls",
    "slice(0, 2)",
    "ExternalIcon",
  ]) {
    assert.match(companyIndustryProductsPanelComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const topicProducts = \(/);
  assert.match(page, /const productNarrativeRows = topicAnalysis\.products\.map\(\(product\) => \{/);
  assert.match(page, /findProductKnowledgeItem\(product, resolvedProductKnowledge, role\.topic\)/);
  assert.match(page, /productKnowledgeToNarrative\(knowledgeItem, role\.topic\)/);
  assert.match(page, /describeProduct\(product, \{ companyName: data\.name, topicName: role\.topicName, group: role\.group \}\)/);
  assert.match(page, /matchedProductKnowledge = topicProducts[\s\S]*findProductKnowledgeItem\(product, resolvedProductKnowledge, role\.topic\)/);
  assert.doesNotMatch(companyIndustryProductsPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|findProductKnowledgeItem|productKnowledgeToNarrative|describeProduct|resolvedProductKnowledge|role\.topic|topicAnalysis|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const technologyFocusPanelIndex = page.indexOf("<CompanyIndustryTechnologyFocusPanel");
  const productsPanelIndex = page.indexOf("<CompanyIndustryProductsPanel");
  const customersSectionIndex = page.indexOf("{/* 主要客戶 */}");
  assert.ok(productsPanelIndex > selectedDetailIndex, "products panel should remain in selected industry detail block");
  assert.ok(productsPanelIndex > technologyFocusPanelIndex, "products panel should follow technology focus");
  assert.ok(customersSectionIndex > productsPanelIndex, "customers section should still follow products");
});

test("Slice M1.23 extracts industry customers as a prepared-props presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryProductsPanelComponent = await readFile(companyIndustryProductsPanelComponentPath, "utf8");
  const companyIndustryCustomersPanelComponent = await readFile(companyIndustryCustomersPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryProductsPanelComponent}\n${companyIndustryCustomersPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryCustomersPanel/);
  assert.match(page, /<CompanyIndustryCustomersPanel[\s\S]*customers=\{topicAnalysis\.customers\}[\s\S]*\/>/);
  assert.match(page, /<PlaceholderSection title="主要客戶" icon="👥" \/>/);
  assert.doesNotMatch(page, /👥 主要客戶[\s\S]*split\(': '\)/);

  assert.match(companyIndustryCustomersPanelComponent, /export interface CompanyIndustryCustomersPanelProps/);
  assert.match(companyIndustryCustomersPanelComponent, /export function CompanyIndustryCustomersPanel/);

  for (const label of [
    "👥 主要客戶",
    "customers",
    "split(': ')",
    "descParts.join(': ')",
    "text-sm font-semibold text-white",
    "text-xs text-[var(--color-text-tertiary)] mt-0.5",
  ]) {
    assert.match(companyIndustryCustomersPanelComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const topicCustomers = \(/);
  assert.match(page, /canonicalRole\?\.customers\?\.length/);
  assert.match(page, /role\.customers\?\.length/);
  assert.match(page, /knowledge\?\.customers\?\.length/);
  assert.match(page, /data\.customers\?\.length/);
  assert.match(page, /客戶\/需求端待補/);
  assert.match(page, /customers: topicCustomers/);
  assert.doesNotMatch(companyIndustryCustomersPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|findProductKnowledgeItem|productKnowledgeToNarrative|describeProduct|resolvedProductKnowledge|canonicalRole|knowledge|topicCustomers|topicAnalysis|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const productsPanelIndex = page.indexOf("<CompanyIndustryProductsPanel");
  const customersPanelIndex = page.indexOf("<CompanyIndustryCustomersPanel");
  const swotPanelIndex = page.indexOf("<CompanyIndustrySwotPanel");
  assert.ok(customersPanelIndex > selectedDetailIndex, "customers panel should remain in selected industry detail block");
  assert.ok(customersPanelIndex > productsPanelIndex, "customers panel should follow products");
  assert.ok(swotPanelIndex > customersPanelIndex, "SWOT panel should still follow customers");
});

test("Slice M1.24 extracts industry SWOT as a prepared-props presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryCustomersPanelComponent = await readFile(companyIndustryCustomersPanelComponentPath, "utf8");
  const companyIndustrySwotPanelComponent = await readFile(companyIndustrySwotPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryCustomersPanelComponent}\n${companyIndustrySwotPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustrySwotPanel/);
  assert.match(page, /<CompanyIndustrySwotPanel[\s\S]*swot=\{topicAnalysis\.swot\}[\s\S]*canonicalSwotItemsByKey=\{canonicalSwotItemsByKey\}[\s\S]*hasCanonicalSwot=\{hasCanonicalSwot\}[\s\S]*isFallbackSwotObservation=\{isFallbackSwotObservation\}[\s\S]*swotBadgeLabel=\{swotBadgeLabel\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /🏛️ SWOT 分析[\s\S]*Canonical SWOT item/);

  assert.match(companyIndustrySwotPanelComponent, /export interface CompanyIndustrySwotPanelProps/);
  assert.match(companyIndustrySwotPanelComponent, /export interface CompanyIndustryCanonicalSwotItem/);
  assert.match(companyIndustrySwotPanelComponent, /export function CompanyIndustrySwotPanel/);

  for (const label of [
    "🏛️ SWOT 分析",
    "swotBadgeLabel",
    "Fallback SWOT observation",
    "優勢 (S)",
    "劣勢 (W)",
    "機會 (O)",
    "威脅 (T)",
    "Canonical SWOT item",
    "信心：",
    "驗證：",
    "理由：",
    "SWOT evidence",
    "slice(0, 2)",
    "ExternalIcon",
    "📋 資料準備中",
    "🔒 升級解鎖",
  ]) {
    assert.match(companyIndustrySwotPanelComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const topicSwotFor = \(key: keyof GroupedSwot\) => selectTopicSwotItems\(groupedCompanySwot, key, topicMatchIds\)/);
  assert.match(page, /const canonicalSwotItemsByKey: Record<keyof GroupedSwot, CompanySwotItem\[]> = \{/);
  assert.match(page, /const canonicalSwot = resolvedCompanySwot \? \{/);
  assert.match(page, /const dailyCanonicalSwotItems = resolvedDailyAnalysis\?\.canonicalKnowledge\.swot\.filter/);
  assert.match(page, /const dailyCanonicalSwot = !resolvedCompanySwot && dailyCanonicalSwotItems\.length > 0 \? \{/);
  assert.match(page, /const canonicalSwotEvidence = resolvedCompanySwot/);
  assert.match(page, /const fallbackSwot = canonicalSwot \?\? dailyCanonicalSwot \?\? role\.swot \?\? knowledge\?\.swot \?\? data\.swot/);
  assert.match(page, /swot: fallbackSwot/);
  assert.match(page, /const hasCanonicalSwot = Boolean\(resolvedCompanySwot && Object\.values\(canonicalSwotItemsByKey\)\.some/);
  assert.match(page, /const isFallbackSwotObservation = !hasCanonicalSwot/);
  assert.match(page, /const swotBadgeLabel = resolvedCompanySwot/);
  assert.match(page, /V2 evidence-backed/);
  assert.match(page, /V2 daily canonical/);
  assert.doesNotMatch(companyIndustrySwotPanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|selectTopicSwotItems|groupCompanySwot|resolvedCompanySwot|dailyCanonicalSwot|resolvedDailyAnalysis|topicAnalysis|topicSwotFor|fallbackSwot|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const customersPanelIndex = page.indexOf("<CompanyIndustryCustomersPanel");
  const swotPanelIndex = page.indexOf("<CompanyIndustrySwotPanel");
  const supplyChainRolePanelIndex = page.indexOf("<CompanyIndustrySupplyChainRolePanel");
  assert.ok(swotPanelIndex > selectedDetailIndex, "SWOT panel should remain in selected industry detail block");
  assert.ok(swotPanelIndex > customersPanelIndex, "SWOT panel should follow customers");
  assert.ok(supplyChainRolePanelIndex > swotPanelIndex, "supply-chain role panel should still follow SWOT");
});

test("Slice M1.25 extracts industry supply-chain role as a prepared-props presentational panel", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustrySwotPanelComponent = await readFile(companyIndustrySwotPanelComponentPath, "utf8");
  const companyIndustrySupplyChainRolePanelComponent = await readFile(companyIndustrySupplyChainRolePanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustrySwotPanelComponent}\n${companyIndustrySupplyChainRolePanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustrySupplyChainRolePanel/);
  assert.match(page, /<CompanyIndustrySupplyChainRolePanel[\s\S]*group=\{role\.group\}[\s\S]*role=\{role\.role\}[\s\S]*displayRoleBadge=\{displayRoleBadge\}[\s\S]*displayRelInfo=\{displayRelInfo\}[\s\S]*roleLabel=\{canonicalRoleLabel\}[\s\S]*roleSummary=\{canonicalRole\?\.roleSummary \?\? dailyCanonicalRole\?\.roleSummary \?\? role\.role\}[\s\S]*v2SupplyChainStage=\{canonicalRole\?\.supplyChainStage\}[\s\S]*v2RoleType=\{canonicalRole\?\.roleType\}[\s\S]*roleRisks=\{canonicalRole\?\.risks \?\? \[\]\}[\s\S]*sourceChips=\{sourceChips\}[\s\S]*\/>/);
  assert.doesNotMatch(page, /🔗 在此產業的角色[\s\S]*資料來源 \/ 校正依據/);

  assert.match(companyIndustrySupplyChainRolePanelComponent, /export interface CompanyIndustrySupplyChainRolePanelProps/);
  assert.match(companyIndustrySupplyChainRolePanelComponent, /export function CompanyIndustrySupplyChainRolePanel/);

  for (const label of [
    "🔗 在此產業的角色",
    "供應鏈群組",
    "角色定位",
    "角色說明",
    "V2 供應鏈階段",
    "V2 角色類型",
    "題材角色風險",
    "資料來源 / 校正依據",
    "slice(0, 3)",
    "slice(0, 8)",
    "new Set(sourceChips)",
  ]) {
    assert.match(companyIndustrySupplyChainRolePanelComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const canonicalRole = resolvedCompanyTopicRoles\?\.roles\.find/);
  assert.match(page, /const dailyCanonicalRole = resolvedDailyAnalysis\?\.canonicalKnowledge\.topicRoles\.find/);
  assert.match(page, /const canonicalRoleLabel = canonicalRole \? directnessLabel\(canonicalRole\.directness\) : dailyCanonicalRole\?\.directnessLabel/);
  assert.match(page, /const displayDirectness = canonicalRole\?\.directness \?\? dailyCanonicalRole\?\.directness as Directness \| undefined/);
  assert.match(page, /const displayRelevance = displayDirectness \? directnessToRelevance\(displayDirectness\) : role\.relevance/);
  assert.match(page, /const displayRelInfo = getRelevanceInfo\(displayRelevance\)/);
  assert.match(page, /const displayRoleBadge = getRoleBadge\(displayRelevance\)/);
  assert.match(page, /const sourceChips = \[/);
  assert.match(page, /canonicalRole\?\.evidence\.map/);
  assert.match(page, /canonicalSwotEvidence/);
  assert.match(page, /knowledge\?\.dataSources/);
  assert.match(page, /knowledge\?\.swot\.sources/);
  assert.doesNotMatch(companyIndustrySupplyChainRolePanelComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|selectTopicSwotItems|groupCompanySwot|findProductKnowledgeItem|productKnowledgeToNarrative|describeProduct|resolvedCompanyTopicRoles|resolvedDailyAnalysis|resolvedCompanySwot|dailyCanonicalRole|canonicalRole|topicAnalysis|sourceChips =|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const swotPanelIndex = page.indexOf("<CompanyIndustrySwotPanel");
  const supplyChainRolePanelIndex = page.indexOf("<CompanyIndustrySupplyChainRolePanel");
  const selectedDetailEndIndex = page.indexOf("{/* ─── 籌碼分析 Tab ─── */}");
  assert.ok(supplyChainRolePanelIndex > selectedDetailIndex, "supply-chain role panel should remain in selected industry detail block");
  assert.ok(supplyChainRolePanelIndex > swotPanelIndex, "supply-chain role panel should follow SWOT");
  assert.ok(selectedDetailEndIndex > supplyChainRolePanelIndex, "selected-detail block should still continue after supply-chain role panel");
});

test("Slice M1.26 extracts industry tab shell without moving role state or selected-detail data assembly", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyIndustryTabShellComponent = await readFile(companyIndustryTabShellComponentPath, "utf8");
  const companyIndustryKnowledgeOverviewComponent = await readFile(companyIndustryKnowledgeOverviewComponentPath, "utf8");
  const combinedSource = `${page}\n${companyIndustryTabShellComponent}\n${companyIndustryKnowledgeOverviewComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyIndustryTabShell/);
  assert.match(page, /<CompanyIndustryTabShell[\s\S]*industryInsights=\{industryInsights\}[\s\S]*hasIndustryRoles=\{industryRoles\.length > 0\}[\s\S]*>/);
  assert.match(page, /<CompanyIndustryRoleNavigation[\s\S]*roles=\{industryRoles\}[\s\S]*activeIndex=\{industrySubTab\}[\s\S]*onRoleChange=\{setIndustrySubTab\}/);
  assert.match(page, /<\/CompanyIndustryTabShell>/);
  assert.doesNotMatch(page, /<CompanyIndustryKnowledgeOverview\s+industryInsights=\{industryInsights\}\s+\/>/);
  assert.doesNotMatch(page, /尚無產業關聯[\s\S]*此公司尚未建立產業關聯分析。/);

  assert.match(companyIndustryTabShellComponent, /export interface CompanyIndustryTabShellProps/);
  assert.match(companyIndustryTabShellComponent, /export function CompanyIndustryTabShell/);
  assert.match(companyIndustryTabShellComponent, /<CompanyIndustryKnowledgeOverview\s+industryInsights=\{industryInsights\}\s+\/>/);
  assert.match(companyIndustryTabShellComponent, /hasIndustryRoles \?/);
  assert.match(companyIndustryTabShellComponent, /\{children\}/);
  for (const label of [
    "space-y-6",
    "尚無產業關聯",
    "此公司尚未建立產業關聯分析。",
    "🏭",
  ]) {
    assert.match(companyIndustryTabShellComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const \[detailTab, setDetailTab\] = useState<CompanyDetailTab>\("overview"\)/);
  assert.match(page, /const \[industrySubTab, setIndustrySubTab\] = useState\(0\)/);
  assert.match(page, /const role = industryRoles\[industrySubTab\]/);
  assert.match(page, /const topicAnalysis = \{/);
  assert.match(page, /const canonicalRole = resolvedCompanyTopicRoles\?\.roles\.find/);
  assert.match(page, /const dailyCanonicalRole = resolvedDailyAnalysis\?\.canonicalKnowledge\.topicRoles\.find/);
  assert.match(page, /const canonicalSwotItemsByKey/);
  assert.match(page, /const productNarrativeRows = topicAnalysis\.products\.map/);
  assert.match(page, /<CompanyIndustrySupplyChainRolePanel/);
  assert.doesNotMatch(companyIndustryTabShellComponent, /useState|useEffect|fetch\(|import .*\.json|buildCompanyIndustryInsights|buildCompanyEditorialBrief|selectTopicSwotItems|groupCompanySwot|findProductKnowledgeItem|productKnowledgeToNarrative|describeProduct|resolvedCompanyTopicRoles|resolvedDailyAnalysis|resolvedCompanySwot|dailyCanonicalRole|canonicalRole|topicAnalysis|industrySubTab|setIndustrySubTab|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const industryTabIndex = page.indexOf("{/* ─── 產業分析 Tab ─── */}");
  const shellIndex = page.indexOf("<CompanyIndustryTabShell");
  const roleNavigationIndex = page.indexOf("<CompanyIndustryRoleNavigation");
  const selectedDetailIndex = page.indexOf("{/* Selected industry detail */}");
  const supplyChainRolePanelIndex = page.indexOf("<CompanyIndustrySupplyChainRolePanel");
  const shellCloseIndex = page.indexOf("</CompanyIndustryTabShell>");
  const chipsTabIndex = page.indexOf("{/* ─── 籌碼分析 Tab ─── */}");
  assert.ok(shellIndex > industryTabIndex, "industry tab shell should remain inside industry tab");
  assert.ok(roleNavigationIndex > shellIndex, "role navigation should render inside industry tab shell");
  assert.ok(selectedDetailIndex > roleNavigationIndex, "selected detail should still follow role navigation");
  assert.ok(supplyChainRolePanelIndex > selectedDetailIndex, "selected detail content should stay inside shell");
  assert.ok(shellCloseIndex > supplyChainRolePanelIndex, "shell should wrap selected-detail content");
  assert.ok(chipsTabIndex > shellCloseIndex, "chips tab should still follow industry tab shell");
});

test("Slice M1.27 extracts chips tab shell without moving ownership-history chart assembly", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyChipsTabShellComponent = await readFile(companyChipsTabShellComponentPath, "utf8");
  const chipValuationSnapshotPanelComponent = await readFile(chipValuationSnapshotPanelComponentPath, "utf8");
  const batchAnalysisPanelComponent = await readFile(batchAnalysisPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyChipsTabShellComponent}\n${chipValuationSnapshotPanelComponent}\n${batchAnalysisPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyChipsTabShell/);
  assert.match(page, /<CompanyChipsTabShell[\s\S]*data=\{data\}[\s\S]*dailyAnalysis=\{resolvedDailyAnalysis\}[\s\S]*>/);
  assert.match(page, /<\/CompanyChipsTabShell>/);
  assert.doesNotMatch(page, /<ChipValuationSnapshotPanel data=\{data\} \/>/);
  assert.doesNotMatch(page, /title="🧠 籌碼收盤後判讀"/);

  assert.match(companyChipsTabShellComponent, /export interface CompanyChipsTabShellProps/);
  assert.match(companyChipsTabShellComponent, /export function CompanyChipsTabShell/);
  assert.match(companyChipsTabShellComponent, /<ChipValuationSnapshotPanel data=\{data\} \/>/);
  assert.match(companyChipsTabShellComponent, /<BatchAnalysisPanel[\s\S]*title="🧠 籌碼收盤後判讀"[\s\S]*badge=\{dailyAnalysis\.chips\.label\}[\s\S]*generatedAt=\{dailyAnalysis\.generatedAt\}[\s\S]*\/>/);
  assert.match(companyChipsTabShellComponent, /\{children\}/);
  for (const label of [
    "space-y-6",
    "籌碼收盤後判讀",
    "dailyAnalysis.chips.signals",
    "dailyAnalysis.chips.risks",
    "dailyAnalysis.chips.watch",
  ]) {
    assert.match(companyChipsTabShellComponent, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }

  assert.match(page, /const \[detailTab, setDetailTab\] = useState<CompanyDetailTab>\("overview"\)/);
  assert.match(page, /data\.institutional_history && data\.institutional_history\.length > 0/);
  assert.match(page, /const hist = data\.institutional_history/);
  assert.match(page, /const fmtShares = \(s: number\) => \{/);
  assert.match(page, /const fmtColor = \(n: number\) =>/);
  assert.match(page, /data\.margin_history && data\.margin_history\.length > 0/);
  assert.match(page, /const allMargin = data\.margin_history/);
  assert.match(page, /data\.per_history && data\.per_history\.length > 0/);
  assert.match(page, /const recentPer = data\.per_history\.slice\(-30\)/);
  assert.doesNotMatch(companyChipsTabShellComponent, /useState|useEffect|fetch\(|import .*\.json|generateDailyAnalysis|computeTechnicalSummary|data\.institutional_history|data\.margin_history|data\.per_history|ComposedChart|ResponsiveContainer|darkTooltipProps|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const chipsTabIndex = page.indexOf("{/* ─── 籌碼分析 Tab ─── */}");
  const chipsShellIndex = page.indexOf("<CompanyChipsTabShell");
  const institutionalHistoryIndex = page.indexOf("{/* ─── 三大法人歷史趨勢（圖+表） ─── */}");
  const marginHistoryIndex = page.indexOf("{/* ─── 融資融券（圖+表+券資比） ─── */}");
  const perHistoryIndex = page.indexOf("{/* ─── 本益比/淨值比趨勢（近1個月） ─── */}");
  const chipsShellCloseIndex = page.indexOf("</CompanyChipsTabShell>");
  const techTabIndex = page.indexOf("{/* ─── 技術分析 Tab ─── */}");
  assert.ok(chipsShellIndex > chipsTabIndex, "chips tab shell should remain inside chips tab");
  assert.ok(institutionalHistoryIndex > chipsShellIndex, "institutional ownership chart should render inside chips shell children");
  assert.ok(marginHistoryIndex > institutionalHistoryIndex, "margin history should still follow institutional ownership");
  assert.ok(perHistoryIndex > marginHistoryIndex, "valuation trend should still follow margin history");
  assert.ok(chipsShellCloseIndex > perHistoryIndex, "chips shell should wrap existing dense chip panels");
  assert.ok(techTabIndex > chipsShellCloseIndex, "tech tab should still follow chips tab shell");
});

test("Slice M1.28 extracts institutional ownership trend panel while keeping chart/table data shaping in page", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyChipsTabShellComponent = await readFile(companyChipsTabShellComponentPath, "utf8");
  const companyInstitutionalTrendPanelComponent = await readFile(companyInstitutionalTrendPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyChipsTabShellComponent}\n${companyInstitutionalTrendPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyInstitutionalTrendPanel/);
  assert.match(page, /<CompanyInstitutionalTrendPanel\s+chartData=\{institutionalChartData\}\s+rows=\{institutionalRows\}\s+formatShares=\{fmtShares\}\s+\/>/m);
  assert.doesNotMatch(page, /<h4 className="text-sm font-bold text-white mb-4">📊 三大法人買賣超趨勢（近30日）<\/h4>/);
  assert.match(page, /const hist = data\.institutional_history/);
  assert.match(page, /const recent30 = hist\.slice\(-30\)/);
  assert.match(page, /const last10 = hist\.slice\(-10\)/);
  assert.match(page, /const fmtShares = \(s: number\) => \{/);
  assert.match(page, /const fmtColor = \(n: number\) =>/);
  assert.match(page, /const institutionalChartData = recent30\.map/);
  assert.match(page, /const institutionalRows = last10\.map/);

  assert.match(companyInstitutionalTrendPanelComponent, /export interface CompanyInstitutionalTrendPanelProps/);
  assert.match(companyInstitutionalTrendPanelComponent, /export function CompanyInstitutionalTrendPanel/);
  for (const label of ["📊 三大法人買賣超趨勢（近30日）", "日期", "外資", "投信", "自營商", "合計"]) {
    assert.match(companyInstitutionalTrendPanelComponent, new RegExp(label));
  }
  for (const prop of ["chartData", "rows", "formatShares", "foreignClassName", "trustClassName", "dealerClassName", "totalClassName"]) {
    assert.match(companyInstitutionalTrendPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(companyInstitutionalTrendPanelComponent, /useState|useEffect|fetch\(|import .*\.json|generateDailyAnalysis|computeTechnicalSummary|data\.institutional_history|data\.margin_history|data\.per_history|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const chipsShellIndex = page.indexOf("<CompanyChipsTabShell");
  const institutionalPanelIndex = page.indexOf("<CompanyInstitutionalTrendPanel");
  const marginHistoryIndex = page.indexOf("{/* ─── 融資融券（圖+表+券資比） ─── */}");
  const perHistoryIndex = page.indexOf("{/* ─── 本益比/淨值比趨勢（近1個月） ─── */}");
  assert.ok(institutionalPanelIndex > chipsShellIndex, "institutional trend panel should render inside chips shell children");
  assert.ok(marginHistoryIndex > institutionalPanelIndex, "margin history should still follow institutional trend panel");
  assert.ok(perHistoryIndex > marginHistoryIndex, "valuation trend should still follow margin history");
});

test("Slice M1.29 extracts margin trading panel while keeping margin history shaping in page", async () => {
  const page = await readFile(pagePath, "utf8");
  const companyChipsTabShellComponent = await readFile(companyChipsTabShellComponentPath, "utf8");
  const companyInstitutionalTrendPanelComponent = await readFile(companyInstitutionalTrendPanelComponentPath, "utf8");
  const companyMarginTradingPanelComponent = await readFile(companyMarginTradingPanelComponentPath, "utf8");
  const combinedSource = `${page}\n${companyChipsTabShellComponent}\n${companyInstitutionalTrendPanelComponent}\n${companyMarginTradingPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/CompanyMarginTradingPanel/);
  assert.match(page, /<CompanyMarginTradingPanel\s+chartData=\{marginChartData\}\s+rows=\{marginRows\}\s+shortMarginRatio=\{ratio\}\s+\/>/m);
  assert.doesNotMatch(page, /<h4 className="text-sm font-bold text-white">💰 融資融券<\/h4>/);
  assert.match(page, /const allMargin = data\.margin_history/);
  assert.match(page, /const recent30 = allMargin\.slice\(-30\)/);
  assert.match(page, /const last10 = allMargin\.slice\(-10\)/);
  assert.match(page, /const marginChartData = recent30\.map/);
  assert.match(page, /const latest = allMargin\[allMargin\.length - 1\]/);
  assert.match(page, /const ratio = latest && latest\.margin_balance > 0/);
  assert.match(page, /const marginRows = last10\.map/);

  assert.match(companyMarginTradingPanelComponent, /export interface CompanyMarginTradingPanelProps/);
  assert.match(companyMarginTradingPanelComponent, /export function CompanyMarginTradingPanel/);
  for (const label of ["💰 融資融券", "券資比", "日期", "融資餘額", "融券餘額", "融資買", "融資賣"]) {
    assert.match(companyMarginTradingPanelComponent, new RegExp(label));
  }
  for (const prop of ["chartData", "rows", "shortMarginRatio", "marginBalanceText", "shortBalanceText", "ratioText", "marginBuyText", "marginSellText"]) {
    assert.match(companyMarginTradingPanelComponent, new RegExp(prop));
  }

  assert.doesNotMatch(companyMarginTradingPanelComponent, /useState|useEffect|fetch\(|import .*\.json|generateDailyAnalysis|computeTechnicalSummary|data\.institutional_history|data\.margin_history|data\.per_history|from "@\/app|from "@\/data|\/api\//);
  assert.doesNotMatch(combinedSource, /\/companies\/\[code\]|\/companies\/\$\{|href=\{`\/companies/);

  const institutionalPanelIndex = page.indexOf("<CompanyInstitutionalTrendPanel");
  const marginPanelIndex = page.indexOf("<CompanyMarginTradingPanel");
  const perHistoryIndex = page.indexOf("{/* ─── 本益比/淨值比趨勢（近1個月） ─── */}");
  const chipsShellCloseIndex = page.indexOf("</CompanyChipsTabShell>");
  assert.ok(marginPanelIndex > institutionalPanelIndex, "margin trading panel should follow institutional trend panel");
  assert.ok(perHistoryIndex > marginPanelIndex, "valuation trend should still follow margin trading panel");
  assert.ok(chipsShellCloseIndex > perHistoryIndex, "chips shell should still wrap remaining valuation trend panel");
});
