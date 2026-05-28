import { buildCompanyKnowledge, type CompanyKnowledge, type CompanyKnowledgeInput } from "./companyKnowledge";
import { directnessLabel, type CompanyTopicRolesKnowledge, type CompanyTopicRoleItem } from "./companyTopicRoles";
import { groupCompanySwot, type CompanySwotItem, type CompanySwotKnowledge } from "./companySwot";
import type { CanonicalTopic, CanonicalTopicsFile } from "./canonicalTopics";
import { findProductKnowledgeItem, productKnowledgeToNarrative, type CompanyProductKnowledge, type ProductNarrative } from "./productKnowledge";
import { computeTechnicalSummary, safeFloat, type DailyPrice } from "./marketData";

export interface InstitutionalFlowPoint {
  date: string;
  foreign_net: number;
  investment_trust_net: number;
  dealer_net: number;
  total_net: number;
}

export interface MarginPoint {
  date: string;
  margin_buy: number;
  margin_sell: number;
  margin_balance: number;
  short_sell: number;
  short_buy: number;
  short_balance: number;
}

export interface AnalysisInput extends CompanyKnowledgeInput {
  code: string;
  name: string;
  updatedAt?: string;
  trends?: { daily_prices?: DailyPrice[]; monthly_revenue?: { month: string }[]; quarterly_income?: { quarter: string }[] };
  valuation?: { date?: string; pe?: string | number; pb?: string | number; dividendYield?: string | number };
  monthly_revenue?: { latestMonth?: string; month?: string; yoy?: string | number; mom?: string | number };
  institutional_history?: InstitutionalFlowPoint[];
  margin_history?: MarginPoint[];
  companyTopicRoles?: CompanyTopicRolesKnowledge | null;
  companySwot?: CompanySwotKnowledge | null;
  canonicalTopics?: CanonicalTopicsFile | null;
  productKnowledge?: CompanyProductKnowledge | null;
}

export interface DailyCanonicalKnowledge {
  topicRoles: Array<{
    topicId: string;
    topicName: string;
    canonicalTopicId?: string;
    canonicalTopicName?: string;
    directness: string;
    directnessLabel: string;
    confidence: string;
    roleSummary: string;
  }>;
  swot: Array<{
    id: string;
    category: string;
    statement: string;
    confidence: string;
    relatedTopicIds: string[];
  }>;
  topics: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    activationSignals: string[];
  }>;
}

export interface DailyAnalysis {
  schemaVersion: 1;
  code: string;
  name: string;
  generatedAt: string;
  sourceUpdatedAt?: string;
  marketDataDate?: string;
  chipDataDate?: string;
  mode: "rule-batch";
  technical: {
    stance: "bullish" | "bearish" | "neutral" | "insufficient";
    label: string;
    score: number;
    summary: string;
    signals: string[];
    risks: string[];
    watch: string[];
  };
  chips: {
    stance: "accumulation" | "distribution" | "neutral" | "insufficient";
    label: string;
    score: number;
    summary: string;
    signals: string[];
    risks: string[];
    watch: string[];
  };
  industry: {
    label: string;
    score: number;
    knowledgeBasis: "canonical_verified" | "canonical_pending" | "legacy_unverified" | "insufficient";
    confidence?: string;
    provenanceLabel: string;
    verificationNote: string;
    roleDetail?: {
      topicName: string;
      roleLabel: string;
      roleSummary: string;
      supplyChainStage?: string;
      roleType?: string;
      directness?: string;
      source: "canonical" | "legacy" | "insufficient";
    };
    productNarratives?: ProductNarrative[];
    swotSnapshot?: {
      strengths: string[];
      opportunities: string[];
      risks: string[];
    };
    scoringFactors: string[];
    summary: string;
    signals: string[];
    risks: string[];
    watch: string[];
  };
  knowledge: CompanyKnowledge;
  canonicalKnowledge: DailyCanonicalKnowledge;
  nextSession: {
    focus: string[];
    triggerRules: string[];
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function pctChange(latest: number, previous: number): number {
  return previous !== 0 ? ((latest - previous) / Math.abs(previous)) * 100 : 0;
}

function fmtSigned(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

function fmtShares(rawShares: number): string {
  const sheets = rawShares / 1000;
  const sign = sheets > 0 ? "+" : sheets < 0 ? "-" : "";
  const abs = Math.abs(sheets);
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(1).replace(/\.0$/, "")}萬張`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1).replace(/\.0$/, "")}千張`;
  return `${sign}${abs.toFixed(0)}張`;
}

function latestDate(data: { date: string }[] | undefined): string | undefined {
  return data?.filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.date;
}

const directnessRank: Record<string, number> = {
  core: 0,
  direct_enabler: 1,
  supplier: 2,
  customer_or_channel: 3,
  indirect: 4,
  rejected: 5,
};

const topicStatusRank: Record<string, number> = {
  active: 0,
  watchlist: 1,
  legacy_candidate: 2,
  deprecated: 3,
  rejected: 4,
};

function topicForRole(role: CompanyTopicRoleItem, canonicalTopics: CanonicalTopicsFile | null | undefined): CanonicalTopic | undefined {
  return canonicalTopics?.topics.find((topic) => topic.id === role.topicId || topic.legacyTopicIds.includes(role.topicId));
}

function roleSortKey(role: CompanyTopicRoleItem, canonicalTopics: CanonicalTopicsFile | null | undefined): string {
  const topic = topicForRole(role, canonicalTopics);
  const mappedRank = topic ? (topicStatusRank[topic.status] ?? 9) : 9;
  const directness = directnessRank[role.directness] ?? 99;
  return `${mappedRank}:${directness}:${role.topicId}`;
}

function buildDailyCanonicalKnowledge(input: AnalysisInput): DailyCanonicalKnowledge {
  const roles = [...(input.companyTopicRoles?.roles ?? [])]
    .filter((role) => role.status !== "rejected" && role.directness !== "rejected")
    .sort((a, b) => roleSortKey(a, input.canonicalTopics).localeCompare(roleSortKey(b, input.canonicalTopics)));
  const roleTopicIds = new Set(roles.flatMap((role) => [role.topicId, topicForRole(role, input.canonicalTopics)?.id].filter((item): item is string => Boolean(item))));
  const groupedSwot = groupCompanySwot(input.companySwot);
  const swotItems = [...groupedSwot.strengths, ...groupedSwot.weaknesses, ...groupedSwot.opportunities, ...groupedSwot.threats]
    .filter((item) => item.status !== "rejected")
    .filter((item) => item.relatedTopicIds.length === 0 || item.relatedTopicIds.some((topicId) => roleTopicIds.has(topicId)))
    .sort((a, b) => `${a.category}:${a.id}`.localeCompare(`${b.category}:${b.id}`));
  const topicsById = new Map<string, CanonicalTopic>();
  for (const role of roles) {
    const topic = topicForRole(role, input.canonicalTopics);
    if (topic) topicsById.set(topic.id, topic);
  }

  return {
    topicRoles: roles.map((role) => {
      const topic = topicForRole(role, input.canonicalTopics);
      return {
        topicId: role.topicId,
        topicName: role.topicName,
        canonicalTopicId: topic?.id,
        canonicalTopicName: topic?.name,
        directness: role.directness,
        directnessLabel: directnessLabel(role.directness),
        confidence: role.confidence,
        roleSummary: role.roleSummary,
      };
    }),
    swot: swotItems.map((item: CompanySwotItem) => ({
      id: item.id,
      category: item.category,
      statement: item.statement,
      confidence: item.confidence,
      relatedTopicIds: item.relatedTopicIds,
    })),
    topics: Array.from(topicsById.values()).map((topic) => ({
      id: topic.id,
      name: topic.name,
      type: topic.type,
      status: topic.status,
      activationSignals: topic.activationSignals,
    })),
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const industryDirectnessScore: Record<string, number> = {
  core: 42,
  direct_enabler: 36,
  supplier: 26,
  customer_or_channel: 18,
  indirect: 8,
  rejected: 0,
};

const industryConfidenceScore: Record<string, number> = {
  high: 16,
  medium: 10,
  low: 3,
  insufficient: -6,
  unverified: -8,
};

const industryTopicTypeScore: Record<string, number> = {
  theme: 8,
  technology: 7,
  product: 6,
  process: 6,
  supply_chain_segment: 6,
  end_market: 4,
};

const industryTopicStatusScore: Record<string, number> = {
  active: 10,
  watchlist: 5,
  legacy_candidate: -4,
  deprecated: -18,
  rejected: -30,
};

function buildIndustryScore(input: AnalysisInput, canonicalKnowledge: DailyCanonicalKnowledge): { score: number; label: string; factors: string[]; watch: string[] } {
  const primaryRole = input.companyTopicRoles?.roles
    ?.filter((role) => role.status !== "rejected" && role.directness !== "rejected")
    .sort((a, b) => roleSortKey(a, input.canonicalTopics).localeCompare(roleSortKey(b, input.canonicalTopics)))[0];
  const primaryCanonicalRole = canonicalKnowledge.topicRoles[0];
  const primaryTopic = primaryRole ? topicForRole(primaryRole, input.canonicalTopics) : undefined;
  const directness = primaryRole?.directness ?? primaryCanonicalRole?.directness;
  const confidence = primaryRole?.confidence ?? primaryCanonicalRole?.confidence;
  const evidenceCount = primaryRole?.evidence.length ?? 0;
  const catalysts = primaryTopic?.activationSignals ?? canonicalKnowledge.topics[0]?.activationSignals ?? [];
  const positiveSwot = canonicalKnowledge.swot.filter((item) => item.category === "strength" || item.category === "opportunity");
  const negativeSwot = canonicalKnowledge.swot.filter((item) => item.category === "weakness" || item.category === "threat");

  if (!primaryRole && !primaryCanonicalRole) {
    return { score: 0, label: "產業資料待補", factors: ["尚未建立 V2 題材角色"], watch: ["補齊公司題材角色、產品知識與 SWOT 後再評分"] };
  }

  let score = 0;
  const factors: string[] = [];
  const watch: string[] = [];

  if (directness) {
    const value = industryDirectnessScore[directness] ?? 0;
    score += value;
    factors.push(`直接度 ${directnessLabel(directness as CompanyTopicRoleItem["directness"])} +${value}`);
  }
  if (confidence) {
    const value = industryConfidenceScore[confidence] ?? 0;
    score += value;
    factors.push(`角色信心 ${confidence} ${value >= 0 ? "+" : ""}${value}`);
  }
  if (primaryTopic) {
    const typeValue = industryTopicTypeScore[primaryTopic.type] ?? 0;
    const statusValue = industryTopicStatusScore[primaryTopic.status] ?? 0;
    score += typeValue + statusValue;
    factors.push(`題材 ${primaryTopic.name}（${primaryTopic.type}/${primaryTopic.status}） ${typeValue + statusValue >= 0 ? "+" : ""}${typeValue + statusValue}`);
  }
  if (evidenceCount > 0) {
    const value = Math.min(12, evidenceCount * 6);
    score += value;
    factors.push(`角色證據 ${evidenceCount} 則 +${value}`);
  } else {
    score -= 8;
    factors.push("角色證據不足 -8");
  }
  if (catalysts.length > 0) {
    const value = Math.min(12, catalysts.length * 4);
    score += value;
    factors.push(`催化訊號 ${catalysts.length} 項 +${value}`);
    watch.push(`催化訊號：${catalysts.slice(0, 3).join("、")}`);
  } else {
    watch.push("催化訊號待補：缺少可追蹤 activationSignals");
  }
  if (positiveSwot.length > 0) {
    const highConfidencePositive = positiveSwot.filter((item) => item.confidence === "high" || item.confidence === "medium").length;
    const value = Math.min(10, highConfidencePositive * 5);
    score += value;
    if (value > 0) factors.push(`正向 SWOT ${highConfidencePositive} 項 +${value}`);
  }
  if (negativeSwot.length > 0) {
    const value = Math.min(10, negativeSwot.filter((item) => item.confidence === "high" || item.confidence === "medium").length * 3);
    score -= value;
    if (value > 0) factors.push(`風險 SWOT 扣分 -${value}`);
  }

  const finalScore = clampScore(score);
  const label = finalScore >= 70 ? "核心題材受惠" : finalScore >= 45 ? "題材關聯明確" : finalScore > 0 ? "題材關聯待驗證" : "產業資料待補";
  return { score: finalScore, label, factors, watch };
}

function capIndustryScore(
  industryScore: { score: number; label: string; factors: string[]; watch: string[] },
  maxScore: number,
  reason: string,
  forcedLabel = "題材關聯待驗證",
): { score: number; label: string; factors: string[]; watch: string[] } {
  if (industryScore.score <= maxScore) {
    return {
      ...industryScore,
      label: forcedLabel,
      factors: [...industryScore.factors, `${reason}（上限 ${maxScore}）`],
    };
  }
  return {
    ...industryScore,
    score: maxScore,
    label: forcedLabel,
    factors: [...industryScore.factors, `${reason}（原 ${industryScore.score}，上限 ${maxScore}）`],
  };
}

function isVerifiedCanonicalRole(role: CompanyTopicRoleItem | undefined): boolean {
  return Boolean(
    role
    && role.status === "verified"
    && (role.confidence === "high" || role.confidence === "medium")
    && role.evidence.length > 0
    && role.directness !== "rejected"
  );
}

function buildRoleDetail(
  primaryV2Role: CompanyTopicRoleItem | undefined,
  primaryCanonicalRole: DailyCanonicalKnowledge["topicRoles"][number] | undefined,
  primaryLegacyRole: CompanyKnowledge["topicRoles"][number] | undefined,
): NonNullable<DailyAnalysis["industry"]["roleDetail"]> | undefined {
  if (primaryV2Role || primaryCanonicalRole) {
    const canonicalName = primaryCanonicalRole?.canonicalTopicName ?? primaryCanonicalRole?.topicName;
    const role = primaryV2Role;
    return {
      topicName: canonicalName ?? role?.topicName ?? "V2 題材",
      roleLabel: role ? directnessLabel(role.directness) : primaryCanonicalRole?.directnessLabel ?? "題材角色",
      roleSummary: role?.roleSummary ?? primaryCanonicalRole?.roleSummary ?? "已建立 V2 題材角色，但角色摘要待補。",
      supplyChainStage: role?.supplyChainStage,
      roleType: role?.roleType,
      directness: role?.directness ?? primaryCanonicalRole?.directness,
      source: "canonical",
    };
  }

  if (primaryLegacyRole) {
    return {
      topicName: primaryLegacyRole.topicId,
      roleLabel: primaryLegacyRole.marketPosition ?? primaryLegacyRole.relevance,
      roleSummary: primaryLegacyRole.summary ?? primaryLegacyRole.role,
      source: "legacy",
    };
  }

  return undefined;
}

function buildProductNarratives(input: AnalysisInput, primaryV2Role: CompanyTopicRoleItem | undefined, primaryTopic: CanonicalTopic | undefined, knowledge: CompanyKnowledge): ProductNarrative[] {
  const topicIds = [primaryTopic?.id, primaryV2Role?.topicId].filter((item): item is string => Boolean(item));
  const productNames = [...(primaryV2Role?.products ?? []), ...knowledge.products];
  const narratives: ProductNarrative[] = [];
  const seen = new Set<string>();

  for (const productName of productNames) {
    for (const topicId of topicIds.length > 0 ? topicIds : [undefined]) {
      const product = findProductKnowledgeItem(productName, input.productKnowledge, topicId);
      if (!product || seen.has(product.name)) continue;
      narratives.push(productKnowledgeToNarrative(product, topicId));
      seen.add(product.name);
      break;
    }
    if (narratives.length >= 3) break;
  }

  if (narratives.length > 0) return narratives;
  if (!primaryV2Role) return [];

  return productNames
    .filter((item, index, array) => item && item.length <= 40 && array.indexOf(item) === index)
    .slice(0, 3)
    .map((name) => ({
      name,
      description: "已列為公司/題材相關產品，但尚未建立 evidence-backed 產品說明。",
      confidence: "low" as const,
    }));
}

function buildSwotSnapshot(canonicalKnowledge: DailyCanonicalKnowledge, knowledge: CompanyKnowledge): NonNullable<DailyAnalysis["industry"]["swotSnapshot"]> {
  const canonicalStrengths = canonicalKnowledge.swot.filter((item) => item.category === "strength").map((item) => item.statement);
  const canonicalOpportunities = canonicalKnowledge.swot.filter((item) => item.category === "opportunity").map((item) => item.statement);
  const canonicalRisks = canonicalKnowledge.swot.filter((item) => item.category === "weakness" || item.category === "threat").map((item) => item.statement);

  return {
    strengths: (canonicalStrengths.length > 0 ? canonicalStrengths : knowledge.swot.strengths).slice(0, 2),
    opportunities: (canonicalOpportunities.length > 0 ? canonicalOpportunities : knowledge.swot.opportunities).slice(0, 2),
    risks: (canonicalRisks.length > 0 ? canonicalRisks : [...knowledge.swot.weaknesses, ...knowledge.swot.threats]).slice(0, 2),
  };
}

export function generateDailyAnalysis(input: AnalysisInput, now = new Date()): DailyAnalysis {
  const knowledge = buildCompanyKnowledge(input, now);
  const dailyPrices = input.trends?.daily_prices ?? [];
  const technical = computeTechnicalSummary(dailyPrices);
  const sortedPrices = [...dailyPrices].filter((row) => row.date && row.close > 0).sort((a, b) => a.date.localeCompare(b.date));
  const latest = sortedPrices.at(-1);

  let techScore = 0;
  const techSignals: string[] = [];
  const techRisks: string[] = [];
  const techWatch: string[] = [];

  if (!latest || sortedPrices.length < 20) {
    techSignals.push("日 K 資料不足，暫不做強弱判斷");
  } else {
    if (technical.trendLabel === "多頭排列") {
      techScore += 30;
      techSignals.push("收盤價、MA5、MA20 呈多頭排列");
    } else if (technical.trendLabel === "空頭排列") {
      techScore -= 30;
      techRisks.push("收盤價、MA5、MA20 呈空頭排列");
    } else {
      techSignals.push("均線結構偏震盪，尚未形成明確排列");
    }

    if (technical.ma20 != null) {
      const distanceFromMa20 = ((technical.latestClose - technical.ma20) / technical.ma20) * 100;
      if (distanceFromMa20 >= 3) {
        techScore += 15;
        techSignals.push(`收盤站上 MA20 ${distanceFromMa20.toFixed(1)}%`);
      } else if (distanceFromMa20 <= -3) {
        techScore -= 15;
        techRisks.push(`收盤跌破 MA20 ${Math.abs(distanceFromMa20).toFixed(1)}%`);
      } else {
        techWatch.push("股價貼近 MA20，留意方向選擇");
      }
    }

    if (technical.volumeRatio20 >= 1.8 && technical.change > 0) {
      techScore += 18;
      techSignals.push(`帶量上漲，量比 ${technical.volumeRatio20.toFixed(2)}x`);
    } else if (technical.volumeRatio20 >= 1.8 && technical.change < 0) {
      techScore -= 18;
      techRisks.push(`帶量下跌，量比 ${technical.volumeRatio20.toFixed(2)}x`);
    } else if (technical.volumeRatio20 < 0.7) {
      techWatch.push("量能低於 20 日均量，突破訊號可信度較低");
    }

    if (technical.high20 > 0 && technical.latestClose >= technical.high20 * 0.98) {
      techScore += 10;
      techWatch.push(`接近 20 日高點 ${technical.high20.toFixed(2)}，觀察是否突破`);
    }
    if (technical.low20 > 0 && technical.latestClose <= technical.low20 * 1.02) {
      techScore -= 10;
      techWatch.push(`接近 20 日低點 ${technical.low20.toFixed(2)}，留意支撐是否失守`);
    }
  }

  const techStance = sortedPrices.length < 20 ? "insufficient" : techScore >= 25 ? "bullish" : techScore <= -25 ? "bearish" : "neutral";
  const techLabel = techStance === "bullish" ? "偏多" : techStance === "bearish" ? "偏空" : techStance === "neutral" ? "中性震盪" : "資料不足";

  const institutional = [...(input.institutional_history ?? [])].filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date));
  const margin = [...(input.margin_history ?? [])].filter((row) => row.date).sort((a, b) => a.date.localeCompare(b.date));
  const inst5 = institutional.slice(-5);
  const inst20 = institutional.slice(-20);
  const lastInst = institutional.at(-1);
  const lastMargin = margin.at(-1);
  const prevMargin5 = margin.length >= 6 ? margin.at(-6) : undefined;

  let chipScore = 0;
  const chipSignals: string[] = [];
  const chipRisks: string[] = [];
  const chipWatch: string[] = [];

  if (institutional.length < 5 && margin.length < 5) {
    chipSignals.push("籌碼資料不足，暫不做買賣超方向判斷");
  } else {
    const inst5Total = sum(inst5.map((row) => row.total_net));
    const inst20Total = sum(inst20.map((row) => row.total_net));
    const trust5 = sum(inst5.map((row) => row.investment_trust_net));
    const foreign5 = sum(inst5.map((row) => row.foreign_net));

    if (inst5Total > 0) {
      chipScore += 18;
      chipSignals.push(`三大法人近 5 日合計買超 ${fmtShares(inst5Total)}`);
    } else if (inst5Total < 0) {
      chipScore -= 18;
      chipRisks.push(`三大法人近 5 日合計賣超 ${fmtShares(inst5Total)}`);
    }

    if (inst20Total > 0) {
      chipScore += 10;
      chipSignals.push(`近 20 日法人偏買，合計 ${fmtShares(inst20Total)}`);
    } else if (inst20Total < 0) {
      chipScore -= 10;
      chipRisks.push(`近 20 日法人偏賣，合計 ${fmtShares(inst20Total)}`);
    }

    if (trust5 > 0) {
      chipScore += 8;
      chipSignals.push(`投信近 5 日買超 ${fmtShares(trust5)}`);
    } else if (trust5 < 0) {
      chipScore -= 8;
      chipRisks.push(`投信近 5 日賣超 ${fmtShares(trust5)}`);
    }

    if (foreign5 > 0) chipSignals.push(`外資近 5 日買超 ${fmtShares(foreign5)}`);
    if (foreign5 < 0) chipRisks.push(`外資近 5 日賣超 ${fmtShares(foreign5)}`);

    if (lastInst) {
      chipWatch.push(`最近法人資料日：${lastInst.date}`);
    }

    if (lastMargin && prevMargin5) {
      const marginBalanceChange = pctChange(lastMargin.margin_balance, prevMargin5.margin_balance);
      const shortBalanceChange = pctChange(lastMargin.short_balance, prevMargin5.short_balance);
      if (marginBalanceChange > 8 && techScore <= 0) {
        chipScore -= 8;
        chipRisks.push(`融資近 5 日增加 ${marginBalanceChange.toFixed(1)}%，但技術面未同步轉強`);
      } else if (marginBalanceChange < -5) {
        chipScore += 5;
        chipSignals.push(`融資近 5 日下降 ${Math.abs(marginBalanceChange).toFixed(1)}%，籌碼壓力下降`);
      }
      if (shortBalanceChange > 10) {
        chipWatch.push(`融券近 5 日增加 ${shortBalanceChange.toFixed(1)}%，留意軋空或空方壓力`);
      }
    }
  }

  const chipStance = institutional.length < 5 && margin.length < 5 ? "insufficient" : chipScore >= 20 ? "accumulation" : chipScore <= -20 ? "distribution" : "neutral";
  const chipLabel = chipStance === "accumulation" ? "籌碼偏多" : chipStance === "distribution" ? "籌碼偏空" : chipStance === "neutral" ? "籌碼中性" : "資料不足";

  const yoy = safeFloat(input.monthly_revenue?.yoy, 0);
  const pe = safeFloat(input.valuation?.pe, 0);
  const nextFocus = [
    technical.ma5 ? `短線支撐/壓力先看 MA5：${technical.ma5.toFixed(2)}` : "等待 MA5 資料補齊",
    technical.ma20 ? `波段多空分水嶺看 MA20：${technical.ma20.toFixed(2)}` : "等待 MA20 資料補齊",
    lastInst ? `追蹤法人是否延續 ${lastInst.total_net >= 0 ? "買超" : "賣超"}：最近 ${fmtShares(lastInst.total_net)}` : "追蹤法人資料是否更新",
  ];

  if (yoy !== 0) nextFocus.push(`月營收年增率 ${fmtSigned(yoy, 1)}%，觀察基本面是否支撐估值`);
  if (pe > 0) nextFocus.push(`本益比 ${pe.toFixed(1)} 倍，需和同族群估值比較`);

  const triggerRules = [
    technical.high20 > 0 ? `收盤突破 20 日高點 ${technical.high20.toFixed(2)} 且量比 > 1.5：列為轉強訊號` : "補齊 20 日高點後啟用突破規則",
    technical.low20 > 0 ? `收盤跌破 20 日低點 ${technical.low20.toFixed(2)}：列為轉弱警訊` : "補齊 20 日低點後啟用跌破規則",
    "三大法人連 3 日同向買/賣超：提高籌碼分數權重",
  ];

  const canonicalKnowledge = buildDailyCanonicalKnowledge(input);
  let industryScore = buildIndustryScore(input, canonicalKnowledge);
  const primaryCanonicalRole = canonicalKnowledge.topicRoles[0];
  const primaryV2Role = input.companyTopicRoles?.roles
    ?.filter((role) => role.status !== "rejected" && role.directness !== "rejected")
    .sort((a, b) => roleSortKey(a, input.canonicalTopics).localeCompare(roleSortKey(b, input.canonicalTopics)))[0];
  const primaryRole = knowledge.topicRoles[0];
  const hasVerifiedCanonicalRole = isVerifiedCanonicalRole(primaryV2Role);
  const primaryTopic = primaryV2Role ? topicForRole(primaryV2Role, input.canonicalTopics) : undefined;
  const roleDetail = buildRoleDetail(primaryV2Role, primaryCanonicalRole, primaryRole);
  const productNarratives = buildProductNarratives(input, primaryV2Role, primaryTopic, knowledge);
  const swotSnapshot = buildSwotSnapshot(canonicalKnowledge, knowledge);

  let knowledgeBasis: DailyAnalysis["industry"]["knowledgeBasis"] = "insufficient";
  let provenanceLabel = "產業資料待補";
  let verificationNote = "尚未建立 V2 題材角色；Daily analysis 不會將產業題材列為主要加分來源。";
  let industryConfidence: string | undefined = primaryV2Role?.confidence;

  if (hasVerifiedCanonicalRole) {
    knowledgeBasis = "canonical_verified";
    provenanceLabel = "V2 已驗證";
    verificationNote = `角色已由 company-topic-roles 驗證，含 ${primaryV2Role?.evidence.length ?? 0} 則 evidence；可搭配 canonical topic / SWOT 作為產業加分。`;
  } else if (primaryV2Role) {
    knowledgeBasis = "canonical_pending";
    provenanceLabel = "V2 待驗證";
    verificationNote = `已有 V2 role，但 status=${primaryV2Role.status}、confidence=${primaryV2Role.confidence}、evidence=${primaryV2Role.evidence.length}；只做保守參考。`;
    industryScore = capIndustryScore(industryScore, 64, "V2 角色待驗證上限");
  } else if (primaryRole) {
    knowledgeBasis = "legacy_unverified";
    provenanceLabel = "Legacy 待驗證";
    industryConfidence = "unverified";
    verificationNote = "目前只來自 legacy industry_analysis / industries.json fallback；題材角色尚未 evidence-backed 驗證。";
    const legacyScore = primaryRole.relevance === "high" ? 44 : primaryRole.relevance === "medium" ? 34 : primaryRole.relevance === "low" ? 18 : 8;
    industryScore = {
      score: legacyScore,
      label: "題材關聯待驗證",
      factors: [`legacy 題材關聯 ${primaryRole.relevance} +${legacyScore}`, "legacy industry_analysis 待驗證上限（不得列為核心題材受惠）"],
      watch: ["V2 題材角色待補：目前以 legacy industry_analysis 保守評分", ...industryScore.watch],
    };
  }

  const industrySignals = [
    `資料基礎：${provenanceLabel}（${industryConfidence ?? "n/a"}）`,
    ...(primaryCanonicalRole ? [`V2 題材角色：${primaryCanonicalRole.canonicalTopicName ?? primaryCanonicalRole.topicName} · ${primaryCanonicalRole.directnessLabel} · ${primaryCanonicalRole.confidence}`] : []),
    `產業評分：${industryScore.score}/100（${industryScore.factors.slice(0, 3).join("；")}）`,
    ...(!primaryCanonicalRole && primaryRole ? [`legacy 題材角色：${primaryRole.topicId} · ${primaryRole.marketPosition ?? primaryRole.relevance}（待驗證）`] : []),
    ...canonicalKnowledge.topicRoles.slice(1, 3).map((role) => `相關題材：${role.canonicalTopicName ?? role.topicName} · ${role.directnessLabel}`),
    ...knowledge.products.slice(0, 3).map((item) => `主要產品：${item}`),
    ...knowledge.finmindSignals.slice(0, 2),
  ];
  const canonicalWeaknesses = canonicalKnowledge.swot.filter((item) => item.category === "weakness").slice(0, 2).map((item) => `V2 W：${item.statement}`);
  const canonicalThreats = canonicalKnowledge.swot.filter((item) => item.category === "threat").slice(0, 2).map((item) => `V2 T：${item.statement}`);
  const canonicalOpportunities = canonicalKnowledge.swot.filter((item) => item.category === "opportunity").slice(0, 2).map((item) => `V2 O：${item.statement}`);
  const industryRisks = [
    ...(knowledgeBasis !== "canonical_verified" ? [verificationNote] : []),
    ...canonicalWeaknesses,
    ...canonicalThreats,
    ...(canonicalWeaknesses.length + canonicalThreats.length === 0 ? [
      ...knowledge.swot.weaknesses.slice(0, 2).map((item) => `W：${item}`),
      ...knowledge.swot.threats.slice(0, 2).map((item) => `T：${item}`),
    ] : []),
  ];
  const industryWatch = [
    ...canonicalOpportunities,
    ...industryScore.watch,
    ...canonicalKnowledge.topics.slice(0, 2).flatMap((topic) => topic.activationSignals.slice(0, 2).map((signal) => `追蹤 ${topic.name}：${signal}`)),
    ...(canonicalOpportunities.length === 0 ? knowledge.swot.opportunities.slice(0, 2).map((item) => `O：${item}`) : []),
    input.companySwot?.updatedAt ? `V2 SWOT 最後驗證：${input.companySwot.updatedAt}` : knowledge.swot.lastVerified ? `知識庫最後驗證：${knowledge.swot.lastVerified}（${knowledge.swot.freshness}）` : "知識庫尚未建立驗證日期",
    `資料來源：${knowledge.dataSources.slice(0, 3).join("、")}`,
  ];
  const industryLabel = industryScore.label;
  const industrySummary = primaryCanonicalRole
    ? `${input.name} 在「${primaryCanonicalRole.canonicalTopicName ?? primaryCanonicalRole.topicName}」的 V2 角色為「${primaryCanonicalRole.directnessLabel}」，資料基礎為「${provenanceLabel}」，產業 score ${industryScore.score}/100；${knowledgeBasis === "canonical_verified" ? "Daily analysis 會用 canonical 題材/角色/SWOT 校正技術與籌碼訊號。" : "Daily analysis 只保守參考，待補 evidence 後才提高權重。"}`
    : primaryRole
      ? `${input.name} 在 ${primaryRole.topicId} 的 legacy 角色為「${primaryRole.marketPosition ?? primaryRole.relevance}」，資料基礎為「${provenanceLabel}」，產業 score ${industryScore.score}/100；此題材關聯仍待驗證，不列為核心題材受惠。`
      : `${input.name} 尚未建立完整題材角色，產業 score ${industryScore.score}/100；Daily analysis 先以 FinMind 市場資料與既有財務資料為主。`;

  return {
    schemaVersion: 1,
    code: input.code,
    name: input.name,
    generatedAt: now.toISOString(),
    sourceUpdatedAt: input.updatedAt ?? latestDate(dailyPrices) ?? latestDate(institutional) ?? latestDate(margin),
    marketDataDate: latest?.date ?? latestDate(dailyPrices),
    chipDataDate: latestDate(institutional) ?? latestDate(margin),
    mode: "rule-batch",
    technical: {
      stance: techStance,
      label: techLabel,
      score: Math.max(-100, Math.min(100, techScore)),
      summary: `${input.name} 技術面目前為「${techLabel}」：${[...techSignals, ...techRisks].slice(0, 2).join("；") || "資料仍需累積"}。`,
      signals: techSignals.slice(0, 5),
      risks: techRisks.slice(0, 5),
      watch: techWatch.slice(0, 5),
    },
    chips: {
      stance: chipStance,
      label: chipLabel,
      score: Math.max(-100, Math.min(100, chipScore)),
      summary: `${input.name} 籌碼面目前為「${chipLabel}」：${[...chipSignals, ...chipRisks].slice(0, 2).join("；") || "資料仍需累積"}。`,
      signals: chipSignals.slice(0, 5),
      risks: chipRisks.slice(0, 5),
      watch: chipWatch.slice(0, 5),
    },
    industry: {
      label: industryLabel,
      score: industryScore.score,
      knowledgeBasis,
      confidence: industryConfidence,
      provenanceLabel,
      verificationNote,
      roleDetail,
      productNarratives,
      swotSnapshot,
      scoringFactors: industryScore.factors,
      summary: industrySummary,
      signals: industrySignals.slice(0, 7),
      risks: industryRisks.slice(0, 6),
      watch: industryWatch.slice(0, 6),
    },
    knowledge,
    canonicalKnowledge,
    nextSession: {
      focus: nextFocus.slice(0, 5),
      triggerRules,
    },
  };
}
