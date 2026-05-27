export type SourceKind =
  | "company_official"
  | "mops_financial_reports"
  | "mops_major_news"
  | "mops_monthly_revenue"
  | "finmind_financial_statements"
  | "finmind_revenue_history"
  | "finmind_market_data";

export type SourceDiscoveryStatus = "needs_discovery" | "queryable";

export interface SourceCandidate {
  id: string;
  companyCode: string;
  companyName: string;
  sourceKind: SourceKind;
  priority: number;
  publisher: string;
  title: string;
  url: string | null;
  status: SourceDiscoveryStatus;
  extractionIntent: string;
  expectedConfidence: "high" | "medium";
}

export interface PilotCompanyLike {
  rank: number;
  code: string;
  name: string;
  priorityScore: number;
  priorityReasons: string[];
  topicCount: number;
  roleCount: number;
  productMentionCount: number;
  swotMentionCount: number;
  topics: string[];
  topProductCandidates: Array<{ raw: string }>;
}

export interface CompanySourceDiscoveryPlan {
  rank: number;
  code: string;
  name: string;
  priorityScore: number;
  topics: string[];
  productsToVerify: string[];
  sourceCandidates: SourceCandidate[];
}

export interface SourceDiscoveryPlan {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    companies: number;
    sourceCandidates: number;
    needsDiscovery: number;
    queryable: number;
  };
  companies: CompanySourceDiscoveryPlan[];
}

function sourceId(companyCode: string, sourceKind: SourceKind): string {
  return `${companyCode}-${sourceKind.replaceAll("_", "-")}`;
}

export function defaultSourceCandidatesForCompany(companyCode: string, companyName: string): SourceCandidate[] {
  return [
    {
      id: sourceId(companyCode, "company_official"),
      companyCode,
      companyName,
      sourceKind: "company_official",
      priority: 1,
      publisher: companyName,
      title: `${companyName} official website / investor relations`,
      url: null,
      status: "needs_discovery",
      extractionIntent: "official product and business description",
      expectedConfidence: "high",
    },
    {
      id: sourceId(companyCode, "mops_financial_reports"),
      companyCode,
      companyName,
      sourceKind: "mops_financial_reports",
      priority: 2,
      publisher: "公開資訊觀測站 MOPS",
      title: `${companyCode} ${companyName} annual reports and financial reports`,
      url: "https://mops.twse.com.tw/",
      status: "queryable",
      extractionIntent: "audited business segments, products, risks and management discussion",
      expectedConfidence: "high",
    },
    {
      id: sourceId(companyCode, "mops_major_news"),
      companyCode,
      companyName,
      sourceKind: "mops_major_news",
      priority: 3,
      publisher: "公開資訊觀測站 MOPS",
      title: `${companyCode} ${companyName} major information disclosures`,
      url: "https://mops.twse.com.tw/",
      status: "queryable",
      extractionIntent: "event-driven updates for material role/SWOT changes",
      expectedConfidence: "high",
    },
    {
      id: sourceId(companyCode, "mops_monthly_revenue"),
      companyCode,
      companyName,
      sourceKind: "mops_monthly_revenue",
      priority: 4,
      publisher: "公開資訊觀測站 MOPS",
      title: `${companyCode} ${companyName} monthly revenue`,
      url: "https://mops.twse.com.tw/",
      status: "queryable",
      extractionIntent: "revenue trend evidence for business impact, not product claims",
      expectedConfidence: "high",
    },
    {
      id: sourceId(companyCode, "finmind_financial_statements"),
      companyCode,
      companyName,
      sourceKind: "finmind_financial_statements",
      priority: 5,
      publisher: "FinMind",
      title: `${companyCode} ${companyName} financial statements dataset`,
      url: "https://finmind.github.io/",
      status: "queryable",
      extractionIntent: "structured historical financial metrics",
      expectedConfidence: "medium",
    },
    {
      id: sourceId(companyCode, "finmind_revenue_history"),
      companyCode,
      companyName,
      sourceKind: "finmind_revenue_history",
      priority: 6,
      publisher: "FinMind",
      title: `${companyCode} ${companyName} revenue history dataset`,
      url: "https://finmind.github.io/",
      status: "queryable",
      extractionIntent: "long-range monthly revenue history",
      expectedConfidence: "medium",
    },
    {
      id: sourceId(companyCode, "finmind_market_data"),
      companyCode,
      companyName,
      sourceKind: "finmind_market_data",
      priority: 7,
      publisher: "FinMind",
      title: `${companyCode} ${companyName} market, institutional and margin datasets`,
      url: "https://finmind.github.io/",
      status: "queryable",
      extractionIntent: "market and chip data for daily analysis context",
      expectedConfidence: "medium",
    },
  ];
}

export function buildSourceDiscoveryPlan(pilotCompanies: PilotCompanyLike[], generatedAt = new Date().toISOString()): SourceDiscoveryPlan {
  const companies = pilotCompanies
    .map((company): CompanySourceDiscoveryPlan => {
      const sourceCandidates = defaultSourceCandidatesForCompany(company.code, company.name);
      return {
        rank: company.rank,
        code: company.code,
        name: company.name,
        priorityScore: company.priorityScore,
        topics: company.topics,
        productsToVerify: company.topProductCandidates.map((product) => product.raw),
        sourceCandidates,
      };
    })
    .sort((a, b) => a.rank - b.rank || a.code.localeCompare(b.code));

  const allSources = companies.flatMap((company) => company.sourceCandidates);
  return {
    schemaVersion: 1,
    generatedAt,
    summary: {
      companies: companies.length,
      sourceCandidates: allSources.length,
      needsDiscovery: allSources.filter((source) => source.status === "needs_discovery").length,
      queryable: allSources.filter((source) => source.status === "queryable").length,
    },
    companies,
  };
}
