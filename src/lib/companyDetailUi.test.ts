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
const majorNewsListPanelComponentPath = "src/components/company-detail/MajorNewsListPanel.tsx";
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
  const combinedSource = `${page}\n${briefComponent}\n${sectionInventoryComponent}\n${detailTabsComponent}\n${overviewComponent}\n${companyInfoHeaderComponent}\n${financialOverviewCardsComponent}\n${dividendPolicyPanelComponent}\n${revenueAnalysisPanelComponent}\n${profitabilityAnalysisPanelComponent}\n${batchAnalysisPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/BatchAnalysisPanel/);
  assert.match(page, /<BatchAnalysisPanel[\s\S]*title="🧠 籌碼收盤後判讀"[\s\S]*badge=\{resolvedDailyAnalysis\.chips\.label\}/);
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
  const chipsBatchIndex = page.indexOf("title=\"🧠 籌碼收盤後判讀\"");
  const techTabIndex = page.indexOf("{/* ─── 技術分析 Tab ─── */}");
  const techBatchIndex = page.indexOf("title=\"📊 技術分析判讀\"");
  const newsTabIndex = page.indexOf("{/* ─── 相關新聞 Tab ─── */}");
  assert.ok(briefIndex > 0, "company editorial brief should still render from the page");
  assert.ok(tabsIndex > briefIndex, "company tabs should remain after the Human Editorial brief");
  assert.ok(chipsBatchIndex > chipsTabIndex, "chips batch analysis should remain inside chips tab");
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
  const combinedSource = `${page}\n${chipValuationSnapshotPanelComponent}\n${batchAnalysisPanelComponent}`;

  assert.match(page, /@\/components\/company-detail\/ChipValuationSnapshotPanel/);
  assert.match(page, /<ChipValuationSnapshotPanel\s+data=\{data\}\s+\/>/);
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
  const chipSnapshotIndex = page.indexOf("<ChipValuationSnapshotPanel");
  const chipsBatchIndex = page.indexOf("title=\"🧠 籌碼收盤後判讀\"");
  const institutionalIndex = page.indexOf("{/* ─── 三大法人歷史趨勢（圖+表） ─── */}");
  assert.ok(chipSnapshotIndex > chipsTabIndex, "chip valuation snapshot should remain inside chips tab");
  assert.ok(chipsBatchIndex > chipSnapshotIndex, "chips batch analysis should still follow valuation snapshot");
  assert.ok(institutionalIndex > chipsBatchIndex, "institutional trend should still follow chips batch analysis");
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
