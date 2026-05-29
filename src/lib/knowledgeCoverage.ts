export type AnalysisQualityGrade = "A" | "B" | "C" | "D" | "F";
export type UpgradePriority = "high" | "medium" | "low";
export type KnowledgeBasis = "canonical_verified" | "canonical_pending" | "insufficient";
export type MissingKnowledge = "product_knowledge" | "verified_topic_role" | "complete_swot" | "daily_analysis";

export interface CoverageCompanyInput {
  code: string;
  name: string;
  topics: string[];
}

export interface CoverageAnalysisInput {
  label?: string;
  knowledgeBasis?: KnowledgeBasis;
}

export interface CoverageTopicRoleStats {
  anyRoleCount: number;
  verifiedRoleCount: number;
}

export interface CoverageSwotStats {
  itemCount: number;
  verifiedItemCount: number;
  categories: Set<string>;
}

export interface KnowledgeCoverageInput {
  companies: CoverageCompanyInput[];
  analysisByCode: Record<string, CoverageAnalysisInput | undefined>;
  productKnowledgeCodes: Set<string>;
  topicRoleByCode: Map<string, CoverageTopicRoleStats>;
  swotByCode: Map<string, CoverageSwotStats>;
}

export interface KnowledgeCoverageCompany {
  code: string;
  name: string;
  topics: string[];
  analysisLabel: string | null;
  analysisKnowledgeBasis: KnowledgeBasis | "missing";
  hasProductKnowledge: boolean;
  hasVerifiedTopicRole: boolean;
  hasAnyTopicRole: boolean;
  hasCompleteSwot: boolean;
  hasAnySwot: boolean;
  analysisQuality: AnalysisQualityGrade;
  missingKnowledge: MissingKnowledge[];
  upgradePriority: UpgradePriority;
  blockingReasons: string[];
}

export interface KnowledgeCoverageSummary {
  totalCompanies: number;
  coverageRatios: {
    productKnowledge: number;
    verifiedTopicRole: number;
    anyTopicRole: number;
    completeSwot: number;
    anySwot: number;
    canonicalDailyAnalysis: number;
  };
  gradeDistribution: Record<AnalysisQualityGrade, number>;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  topHighPriorityCompanies: Array<Pick<KnowledgeCoverageCompany, "code" | "name" | "analysisQuality" | "missingKnowledge" | "blockingReasons">>;
}

export interface KnowledgeCoverageReport {
  schemaVersion: 1;
  generatedAt: string;
  summary: KnowledgeCoverageSummary;
  companies: KnowledgeCoverageCompany[];
}

function hasAllSwotCategories(categories: Set<string>): boolean {
  return ["strength", "weakness", "opportunity", "threat"].every((category) => categories.has(category));
}

function ratio(count: number, total: number): number {
  if (total === 0) return 0;
  return Number((count / total).toFixed(4));
}

function gradeCompany(args: {
  knowledgeBasis: KnowledgeCoverageCompany["analysisKnowledgeBasis"];
  hasProductKnowledge: boolean;
  hasVerifiedTopicRole: boolean;
  hasAnyTopicRole: boolean;
  hasCompleteSwot: boolean;
  hasAnySwot: boolean;
}): AnalysisQualityGrade {
  const canonicalDailyAnalysis = args.knowledgeBasis === "canonical_verified" || args.knowledgeBasis === "canonical_pending";
  if (args.hasVerifiedTopicRole && args.hasProductKnowledge && args.hasCompleteSwot && canonicalDailyAnalysis) return "A";
  if (args.hasVerifiedTopicRole && (args.hasProductKnowledge || args.hasCompleteSwot) && canonicalDailyAnalysis) return "B";
  if (args.knowledgeBasis === "insufficient" || args.knowledgeBasis === "missing") {
    if (args.hasProductKnowledge || args.hasAnyTopicRole || args.hasAnySwot) return "C";
    return "F";
  }
  if (args.hasProductKnowledge || args.hasAnyTopicRole || args.hasAnySwot || args.knowledgeBasis === "canonical_pending") return "C";
  return "F";
}

function priorityForCompany(grade: AnalysisQualityGrade, missingKnowledge: MissingKnowledge[]): UpgradePriority {
  if (grade === "D" || grade === "F") return "high";
  if (missingKnowledge.includes("product_knowledge") || missingKnowledge.includes("verified_topic_role")) return "high";
  if (grade === "B" || grade === "C" || missingKnowledge.length > 0) return "medium";
  return "low";
}

function blockingReasonsForCompany(args: {
  knowledgeBasis: KnowledgeCoverageCompany["analysisKnowledgeBasis"];
  missingKnowledge: MissingKnowledge[];
  hasAnyTopicRole: boolean;
  hasAnySwot: boolean;
}): string[] {
  const reasons: string[] = [];
  if (args.knowledgeBasis === "insufficient" || args.knowledgeBasis === "missing") reasons.push("insufficient_daily_analysis");
  if (args.missingKnowledge.includes("product_knowledge")) reasons.push("missing_product_knowledge");
  if (args.missingKnowledge.includes("verified_topic_role")) {
    reasons.push(args.hasAnyTopicRole ? "topic_role_not_verified" : "missing_topic_role");
  }
  if (args.missingKnowledge.includes("complete_swot")) reasons.push(args.hasAnySwot ? "incomplete_swot" : "missing_swot");
  return reasons;
}

export function buildKnowledgeCoverageReport(input: KnowledgeCoverageInput, generatedAt = new Date().toISOString()): KnowledgeCoverageReport {
  const companies = input.companies
    .map((company): KnowledgeCoverageCompany => {
      const analysis = input.analysisByCode[company.code];
      const roleStats = input.topicRoleByCode.get(company.code);
      const swotStats = input.swotByCode.get(company.code);
      const analysisKnowledgeBasis = analysis?.knowledgeBasis ?? "missing";
      const hasProductKnowledge = input.productKnowledgeCodes.has(company.code);
      const hasVerifiedTopicRole = (roleStats?.verifiedRoleCount ?? 0) > 0;
      const hasAnyTopicRole = (roleStats?.anyRoleCount ?? 0) > 0;
      const hasCompleteSwot = Boolean(swotStats && swotStats.verifiedItemCount >= 4 && hasAllSwotCategories(swotStats.categories));
      const hasAnySwot = (swotStats?.itemCount ?? 0) > 0;
      const missingKnowledge: MissingKnowledge[] = [];
      if (!hasProductKnowledge) missingKnowledge.push("product_knowledge");
      if (!hasVerifiedTopicRole) missingKnowledge.push("verified_topic_role");
      if (!hasCompleteSwot) missingKnowledge.push("complete_swot");
      if (analysisKnowledgeBasis === "missing") missingKnowledge.push("daily_analysis");
      const analysisQuality = gradeCompany({
        knowledgeBasis: analysisKnowledgeBasis,
        hasProductKnowledge,
        hasVerifiedTopicRole,
        hasAnyTopicRole,
        hasCompleteSwot,
        hasAnySwot,
      });
      const upgradePriority = priorityForCompany(analysisQuality, missingKnowledge);
      const blockingReasons = blockingReasonsForCompany({
        knowledgeBasis: analysisKnowledgeBasis,
        missingKnowledge,
        hasAnyTopicRole,
        hasAnySwot,
      });
      return {
        code: company.code,
        name: company.name,
        topics: [...company.topics].sort(),
        analysisLabel: analysis?.label ?? null,
        analysisKnowledgeBasis,
        hasProductKnowledge,
        hasVerifiedTopicRole,
        hasAnyTopicRole,
        hasCompleteSwot,
        hasAnySwot,
        analysisQuality,
        missingKnowledge,
        upgradePriority,
        blockingReasons,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const total = companies.length;
  const gradeDistribution: Record<AnalysisQualityGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const company of companies) gradeDistribution[company.analysisQuality] += 1;
  const priorityCount = (priority: UpgradePriority) => companies.filter((company) => company.upgradePriority === priority).length;
  const summary: KnowledgeCoverageSummary = {
    totalCompanies: total,
    coverageRatios: {
      productKnowledge: ratio(companies.filter((company) => company.hasProductKnowledge).length, total),
      verifiedTopicRole: ratio(companies.filter((company) => company.hasVerifiedTopicRole).length, total),
      anyTopicRole: ratio(companies.filter((company) => company.hasAnyTopicRole).length, total),
      completeSwot: ratio(companies.filter((company) => company.hasCompleteSwot).length, total),
      anySwot: ratio(companies.filter((company) => company.hasAnySwot).length, total),
      canonicalDailyAnalysis: ratio(companies.filter((company) => company.analysisKnowledgeBasis === "canonical_verified" || company.analysisKnowledgeBasis === "canonical_pending").length, total),
    },
    gradeDistribution,
    highPriorityCount: priorityCount("high"),
    mediumPriorityCount: priorityCount("medium"),
    lowPriorityCount: priorityCount("low"),
    topHighPriorityCompanies: companies
      .filter((company) => company.upgradePriority === "high")
      .toSorted((a, b) => {
        const topicDelta = b.topics.length - a.topics.length;
        if (topicDelta !== 0) return topicDelta;
        const missingDelta = b.missingKnowledge.length - a.missingKnowledge.length;
        if (missingDelta !== 0) return missingDelta;
        return a.code.localeCompare(b.code);
      })
      .slice(0, 30)
      .map((company) => ({
        code: company.code,
        name: company.name,
        analysisQuality: company.analysisQuality,
        missingKnowledge: company.missingKnowledge,
        blockingReasons: company.blockingReasons,
      })),
  };

  return { schemaVersion: 1, generatedAt, summary, companies };
}

export function formatKnowledgeCoverageSummary(report: KnowledgeCoverageReport): string {
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const lines = [
    "# Knowledge Coverage Summary",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Totals",
    "",
    `- Total companies: ${report.summary.totalCompanies}`,
    `- Product knowledge coverage: ${percent(report.summary.coverageRatios.productKnowledge)}`,
    `- Verified topic-role coverage: ${percent(report.summary.coverageRatios.verifiedTopicRole)}`,
    `- Complete SWOT coverage: ${percent(report.summary.coverageRatios.completeSwot)}`,
    `- Canonical daily analysis coverage: ${percent(report.summary.coverageRatios.canonicalDailyAnalysis)}`,
    "",
    "## Grade distribution",
    "",
    `- A complete: ${report.summary.gradeDistribution.A}`,
    `- B usable: ${report.summary.gradeDistribution.B}`,
    `- C weak analysis: ${report.summary.gradeDistribution.C}`,
    `- D blocked: ${report.summary.gradeDistribution.D}`,
    `- F insufficient: ${report.summary.gradeDistribution.F}`,
    "",
    "## Upgrade priorities",
    "",
    `- High: ${report.summary.highPriorityCount}`,
    `- Medium: ${report.summary.mediumPriorityCount}`,
    `- Low: ${report.summary.lowPriorityCount}`,
    "",
    "## Top high-priority companies",
    "",
    ...report.summary.topHighPriorityCompanies.slice(0, 20).map((company) => (
      `- ${company.code} ${company.name}: grade ${company.analysisQuality}; missing ${company.missingKnowledge.join(", ") || "none"}; blockers ${company.blockingReasons.join(", ") || "none"}`
    )),
    "",
  ];
  return `${lines.join("\n")}\n`;
}
