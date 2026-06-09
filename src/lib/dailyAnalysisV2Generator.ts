import { buildDailyAnalysisV2GateDecision, normalizeDailyAnalysisV2, type AnalysisReason, type AnalysisRisk, type DailyAnalysisV2, type DailyAnalysisV2Grade, type DailyAnalysisV2Score, type DailyAnalysisV2Tier, type SourceStatusSummary } from "./dailyAnalysisV2";
import type { CompanyAnalysisContext } from "./companyAnalysisContext";

export interface DailySignalInput {
  score?: number;
  summary?: string;
  signals?: string[];
  risks?: string[];
  watch?: string[];
  sourceRefs?: string[];
}

export interface DailyAnalysisV2ArtifactInput {
  date: string;
  companyCode: string;
  companyName: string;
  context: CompanyAnalysisContext;
  technical?: DailySignalInput;
  chip?: DailySignalInput;
  event?: DailySignalInput;
}

export interface DailyAnalysisV2ArtifactWritePlan {
  changed: boolean;
  json: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreValue(signal: DailySignalInput | undefined, min: number, max: number): number {
  return clamp(typeof signal?.score === "number" && Number.isFinite(signal.score) ? signal.score : 0, min, max);
}

function confidencePoints(confidence: string): number {
  if (confidence === "high") return 4;
  if (confidence === "medium") return 3;
  if (confidence === "low") return 1;
  return 0;
}

function dataQualityScore(sourceStatus: SourceStatusSummary): number {
  if (sourceStatus.status === "insufficient" || sourceStatus.freshness === "unknown") return -20;
  if (sourceStatus.freshness === "stale") return -10;
  if (sourceStatus.status === "partial") return 4;
  if (sourceStatus.freshness === "today") return 10;
  return 8;
}

function buildScore(input: DailyAnalysisV2ArtifactInput): DailyAnalysisV2Score {
  const directRole = input.context.topicRoleContext.find((role) => role.directness === "direct" && role.sourceRefs.length > 0);
  const bestProduct = input.context.productContext.find((product) => product.sourceRefs.length > 0);
  const researchDirection = input.context.researchContext.reduce((total, item) => total + confidencePoints(item.confidence), 0);
  const swotPenalty = input.context.swotContext
    .filter((item) => item.category === "weakness" || item.category === "threat")
    .reduce((total, item) => total - Math.max(1, confidencePoints(item.confidence) - 1), 0);

  const score = {
    technical: scoreValue(input.technical, -20, 20),
    chip: scoreValue(input.chip, -20, 20),
    event: scoreValue(input.event, -10, 10),
    industryTopic: directRole ? confidencePoints(directRole.confidence) * 4 : 0,
    productRole: bestProduct ? confidencePoints(bestProduct.confidence) * 3 : 0,
    swotRisk: clamp(swotPenalty, -12, 0),
    researchDirection: clamp(researchDirection, 0, 8),
    knowledgeRuleFit: clamp(input.context.knowledgeRulesApplied.length * 2, 0, 6),
    dataQuality: dataQualityScore(input.context.sourceStatus),
  };

  return {
    ...score,
    total: Object.values(score).reduce((total, value) => total + value, 0),
  };
}

function proposedGradeForScore(score: DailyAnalysisV2Score): DailyAnalysisV2Grade {
  if (score.total >= 65) return "A";
  if (score.total >= 50) return "B";
  if (score.total >= 25) return "C";
  if (score.total >= 1) return "D";
  return "F";
}

function tierForProposedGrade(grade: DailyAnalysisV2Grade): DailyAnalysisV2Tier {
  if (grade === "A") return "top_candidate";
  if (grade === "B") return "strong_watchlist";
  if (grade === "C") return "observation";
  if (grade === "D") return "weak_signal";
  return "insufficient_data";
}

function signalReason(domain: "technical" | "chip" | "event", title: string, signal: DailySignalInput | undefined): AnalysisReason | null {
  if (!signal?.summary && !signal?.signals?.length) return null;
  const weight = scoreValue(signal, domain === "event" ? -10 : -20, domain === "event" ? 10 : 20);
  return {
    domain,
    title,
    detail: signal.summary || signal.signals?.[0] || title,
    weight,
    polarity: weight > 0 ? "bullish" : weight < 0 ? "bearish" : "neutral",
    sourceRefs: signal.sourceRefs ?? [],
    derivedBy: "rule",
  };
}

function buildReasons(input: DailyAnalysisV2ArtifactInput, score: DailyAnalysisV2Score): AnalysisReason[] {
  const reasons: AnalysisReason[] = [];
  const technical = signalReason("technical", "今日技術訊號", input.technical);
  const chip = signalReason("chip", "今日籌碼訊號", input.chip);
  const event = signalReason("event", "今日事件訊號", input.event);
  if (technical) reasons.push(technical);
  if (chip) reasons.push(chip);
  if (event) reasons.push(event);

  const directRole = input.context.topicRoleContext.find((role) => role.directness === "direct" && role.sourceRefs.length > 0);
  if (directRole) {
    reasons.push({
      domain: "industry",
      title: `${directRole.topicName}：${directRole.role}`,
      detail: "公司具備 verified direct topic role；可作為產業題材傳導的公司層級證據。",
      weight: score.industryTopic,
      polarity: "bullish",
      sourceRefs: directRole.sourceRefs,
      derivedBy: "rule",
    });
  }

  const product = input.context.productContext.find((item) => item.sourceRefs.length > 0);
  if (product) {
    reasons.push({
      domain: "product_role",
      title: `${product.productName} 產品脈絡`,
      detail: `${product.whatItIs} ${product.whyItMatters}`,
      weight: score.productRole,
      polarity: "bullish",
      sourceRefs: product.sourceRefs,
      derivedBy: "rule",
    });
  }

  for (const research of input.context.researchContext.slice(0, 2)) {
    reasons.push({
      domain: "research",
      title: `${research.sourceName} 方向性研究`,
      detail: research.thesis,
      weight: Math.min(4, confidencePoints(research.confidence)),
      polarity: "neutral",
      sourceRefs: research.sourceRefs,
      derivedBy: "rule",
    });
  }

  for (const rule of input.context.knowledgeRulesApplied.slice(0, 2)) {
    reasons.push({
      domain: "knowledge_rule",
      title: rule.title,
      detail: rule.implication,
      weight: 2,
      polarity: "neutral",
      sourceRefs: rule.sourceRefs,
      derivedBy: "rule",
    });
  }

  return reasons;
}

function buildRisks(input: DailyAnalysisV2ArtifactInput): AnalysisRisk[] {
  const risks: AnalysisRisk[] = [];
  for (const item of input.context.swotContext.filter((swot) => swot.category === "weakness" || swot.category === "threat").slice(0, 3)) {
    risks.push({ title: item.statement, detail: item.rationale, severity: item.confidence === "high" ? "high" : "medium", sourceRefs: item.sourceRefs });
  }
  for (const message of input.technical?.risks ?? []) {
    risks.push({ title: "技術面風險", detail: message, severity: "medium", sourceRefs: input.technical?.sourceRefs ?? [] });
  }
  for (const message of input.chip?.risks ?? []) {
    risks.push({ title: "籌碼面風險", detail: message, severity: "medium", sourceRefs: input.chip?.sourceRefs ?? [] });
  }
  return risks;
}

function buildHeadline(input: DailyAnalysisV2ArtifactInput, tier: DailyAnalysisV2Tier): string {
  const role = input.context.topicRoleContext.find((item) => item.directness === "direct");
  if (tier === "insufficient_data") return `${input.companyName} 資料不足，今日不做推薦結論`;
  if (role) return `${input.companyName} 今日重點：${role.topicName} 角色與市場訊號交叉確認`;
  return `${input.companyName} 今日訊號需觀察，尚缺 verified direct 題材角色`;
}

function buildSummary(input: DailyAnalysisV2ArtifactInput, grade: DailyAnalysisV2Grade): string {
  const product = input.context.productContext[0]?.productName;
  const role = input.context.topicRoleContext.find((item) => item.directness === "direct")?.topicName;
  const contextText = product && role
    ? `產品脈絡包含 ${product}，並在 ${role} 具備直接角色。`
    : "產品或題材角色證據仍不完整。";
  return `Grade ${grade}。${contextText} 本分析由 typed context、每日技術/籌碼訊號與 sourceStatus 產生；研究訊號只作方向性背景，不建立公司受惠證據。`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((item) => item.trim().length > 0)));
}

export function buildDailyAnalysisV2Artifact(input: DailyAnalysisV2ArtifactInput): DailyAnalysisV2 {
  const score = buildScore(input);
  const reasons = buildReasons(input, score);
  const risks = buildRisks(input);
  const proposedGrade = proposedGradeForScore(score);
  const gateDecision = buildDailyAnalysisV2GateDecision({
    proposedGrade,
    proposedTier: tierForProposedGrade(proposedGrade),
    score,
    productContext: input.context.productContext,
    topicRoleContext: input.context.topicRoleContext,
    reasons,
    risks,
    sourceStatus: input.context.sourceStatus,
  });

  const artifact: DailyAnalysisV2 = {
    date: input.date,
    companyCode: input.companyCode,
    companyName: input.companyName,
    grade: gateDecision.grade,
    tier: gateDecision.tier,
    headline: buildHeadline(input, gateDecision.tier),
    summary: buildSummary(input, gateDecision.grade),
    score,
    reasons,
    risks,
    productContext: input.context.productContext,
    topicRoleContext: input.context.topicRoleContext,
    swotContext: input.context.swotContext,
    researchContext: input.context.researchContext,
    knowledgeRulesApplied: input.context.knowledgeRulesApplied,
    nextWatchPoints: unique([
      ...(input.technical?.watch ?? []),
      ...(input.chip?.watch ?? []),
      ...gateDecision.gates.map((gate) => gate.message),
      ...input.context.sourceStatus.warnings,
    ]),
    sourceStatus: input.context.sourceStatus,
  };

  const normalized = normalizeDailyAnalysisV2(artifact);
  if (!normalized) throw new Error(`Generated invalid DailyAnalysisV2 artifact for ${input.companyCode}`);
  return normalized;
}

export function planDailyAnalysisV2ArtifactWrite(args: { analysis: DailyAnalysisV2; currentJson?: string | null }): DailyAnalysisV2ArtifactWritePlan {
  const json = `${JSON.stringify(args.analysis, null, 2)}\n`;
  return { json, changed: json !== (args.currentJson ?? "") };
}
