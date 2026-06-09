import type { CompanyIndustryInsights } from "../companyIndustryInsights";

export type CompanyEditorialBriefSource = {
  label: string;
  status: string;
  freshness: string;
  source: string;
};

export type CompanyEditorialBriefViewModel = {
  items: Array<{ label: string; value: string; tone: string }>;
  approvedSections: string[];
  sources: CompanyEditorialBriefSource[];
};

type CompanyEditorialBriefFinancialData = {
  updatedAt: string;
  institutional?: { date?: string } | null;
  margin_history?: Array<{ date?: string }>;
};

type CompanyEditorialBriefAnalysis = {
  generatedAt: string;
  technical: {
    summary: string;
    signals: string[];
    risks: string[];
    watch: string[];
  };
  chips: {
    summary: string;
    signals: string[];
    risks: string[];
    watch: string[];
  };
  industry: {
    roleDetail?: { roleSummary: string };
    risks: string[];
    watch: string[];
  };
  scoring: {
    riskGates: Array<{ severity: "hard" | "soft"; message: string }>;
  };
  nextSession: {
    focus: string[];
  };
};

function firstText(...groups: Array<Array<string | null | undefined> | null | undefined>): string | null {
  for (const group of groups) {
    const value = group?.find((item) => typeof item === "string" && item.trim().length > 0)?.trim();
    if (value) return value;
  }
  return null;
}

export function buildCompanyEditorialBrief({
  data,
  analysis,
  industryInsights,
  latestKLineDate,
}: {
  data: CompanyEditorialBriefFinancialData;
  analysis: CompanyEditorialBriefAnalysis;
  industryInsights: CompanyIndustryInsights;
  latestKLineDate: string | null | undefined;
}): CompanyEditorialBriefViewModel {
  const primaryRole = industryInsights.panels.topicRoles.items.find((role) => role.status === "verified") ?? industryInsights.panels.topicRoles.items[0];
  const primaryProduct = industryInsights.panels.products.items[0];
  const swotRisks = [...industryInsights.panels.swot.groups.weaknesses, ...industryInsights.panels.swot.groups.threats];
  const hardGate = analysis.scoring.riskGates.find((gate) => gate.severity === "hard") ?? analysis.scoring.riskGates[0];
  const dailyChange = firstText(
    analysis.technical.signals,
    analysis.chips.signals,
    [analysis.technical.summary, analysis.chips.summary],
  ) ?? "今日變化資料不足；只顯示已載入的行情、技術與籌碼欄位，不補 AI 結論。";
  const longTermRole = primaryRole?.roleSummary ?? primaryProduct?.whyItMatters ?? analysis.industry.roleDetail?.roleSummary ?? "尚未建立 verified topic role；不可把同漲題材視為公司長期角色。";
  const biggestRisk = hardGate?.message ?? swotRisks[0]?.statement ?? firstText(analysis.industry.risks, analysis.technical.risks, analysis.chips.risks) ?? "尚無已驗證風險；請看 SWOT 與 source rail 的 partial/empty 狀態。";
  const watchNext = firstText(analysis.nextSession.focus, analysis.technical.watch, analysis.chips.watch, analysis.industry.watch) ?? "等待下一筆可信市場資料、公司公告或已驗證題材角色更新。";

  return {
    items: [
      { label: "What changed today?", value: dailyChange, tone: "text-sky-100" },
      { label: "Long-term role", value: longTermRole, tone: "text-emerald-100" },
      { label: "Biggest risk", value: biggestRisk, tone: "text-rose-100" },
      { label: "Watch next", value: watchNext, tone: "text-amber-100" },
    ],
    approvedSections: ["Overview", "Daily AI Analysis", "Fundamentals", "Technicals", "Chip / Ownership", "News / Events", "Products", "Topic Roles", "SWOT", "Sources"],
    sources: [
      { label: "Daily AI Analysis", status: "AI-derived", freshness: analysis.generatedAt, source: "rule-batch daily analysis artifact" },
      { label: "Fundamentals", status: "checked-in evidence", freshness: data.updatedAt, source: "financial JSON / MOPS-derived fields" },
      { label: "Technicals", status: latestKLineDate ? "checked-in market data" : "partial", freshness: latestKLineDate ?? "unknown", source: "daily K-line history" },
      { label: "Chip / Ownership", status: data.institutional?.date || data.margin_history?.length ? "checked-in market data" : "partial", freshness: data.institutional?.date ?? data.margin_history?.at(-1)?.date ?? "unknown", source: "institutional / margin feeds" },
      ...industryInsights.sourceStatus.map((source) => ({ label: source.label, status: source.status, freshness: source.latestVerifiedAt ?? "unknown", source: source.source })),
    ],
  };
}
