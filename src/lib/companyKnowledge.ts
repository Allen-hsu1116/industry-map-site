export interface KnowledgeSWOT {
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
}

export interface TopicIndustryAnalysis {
  ai_summary?: string;
  market_position?: string;
  market_position_detail?: string;
  focus?: string;
  products?: string[];
  customers?: string[];
  swot?: KnowledgeSWOT;
}

export interface CompanyKnowledgeInput {
  code: string;
  name: string;
  updatedAt?: string;
  profile?: { industry?: string; website?: string };
  products?: string[];
  customers?: string[];
  swot?: KnowledgeSWOT;
  market_position?: string;
  industry_analysis?: Record<string, TopicIndustryAnalysis>;
  major_news?: { date?: string; subject?: string }[];
  trends?: {
    daily_prices?: { date: string }[];
    monthly_revenue?: { month: string }[];
    quarterly_income?: { quarter: string }[];
  };
  institutional_history?: { date: string }[];
  margin_history?: { date: string }[];
  per_history?: { date: string }[];
  monthly_revenue?: { latestMonth?: string; month?: string; yoy?: string | number; mom?: string | number };
  valuation?: { date?: string; pe?: string | number; pb?: string | number; dividendYield?: string | number };
}

export interface TopicRoleKnowledge {
  topicId: string;
  role: string;
  relevance: "high" | "medium" | "low" | "unknown";
  marketPosition?: string;
  summary?: string;
}

export interface SWOTKnowledge {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  sources: string[];
  lastVerified?: string;
  freshness: "fresh" | "normal" | "stale" | "needs_review" | "unknown";
}

export interface CompanyKnowledge {
  products: string[];
  customers: string[];
  topicRoles: TopicRoleKnowledge[];
  swot: SWOTKnowledge;
  dataSources: string[];
  finmindSignals: string[];
}

function uniquePush(target: string[], value: unknown) {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (trimmed && !target.includes(trimmed)) target.push(trimmed);
}

function mergeSwotPoint(target: string[], value: unknown) {
  if (typeof value !== "string") return;
  const point = value.trim();
  if (point && !target.includes(point)) target.push(point);
}

function latestLexDate(values: Array<string | undefined>): string | undefined {
  return values.filter((value): value is string => Boolean(value)).sort((a, b) => a.localeCompare(b)).at(-1);
}

function normalizeDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/\d{4}[-/]?\d{2}[-/]?\d{2}/);
  if (match) {
    const digits = match[0].replace(/\//g, "-");
    if (digits.includes("-")) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  const yyyymm = raw.match(/\d{6}/);
  if (yyyymm) return `${yyyymm[0].slice(0, 4)}-${yyyymm[0].slice(4, 6)}-01`;
  return undefined;
}

function classifyFreshness(lastVerified: string | undefined, now: Date, hasMajorNews: boolean): SWOTKnowledge["freshness"] {
  if (hasMajorNews) return "needs_review";
  if (!lastVerified) return "unknown";
  const timestamp = Date.parse(lastVerified);
  if (Number.isNaN(timestamp)) return "unknown";
  const days = (now.getTime() - timestamp) / 86_400_000;
  if (days <= 30) return "fresh";
  if (days <= 90) return "normal";
  return "stale";
}

function relevanceFromPosition(position?: string): TopicRoleKnowledge["relevance"] {
  const text = position ?? "";
  if (/龍頭|核心|主導|絕對|高/.test(text)) return "high";
  if (/成長|關鍵|中/.test(text)) return "medium";
  if (/利基|相關|低|邊緣/.test(text)) return "low";
  return "unknown";
}

export function buildCompanyKnowledge(input: CompanyKnowledgeInput, now = new Date()): CompanyKnowledge {
  const products: string[] = [];
  const customers: string[] = [];
  const swot: SWOTKnowledge = {
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    sources: [],
    freshness: "unknown",
  };
  const topicRoles: TopicRoleKnowledge[] = [];

  (input.products ?? []).forEach((item) => uniquePush(products, item));
  (input.customers ?? []).forEach((item) => uniquePush(customers, item));
  for (const item of input.swot?.strengths ?? []) mergeSwotPoint(swot.strengths, item);
  for (const item of input.swot?.weaknesses ?? []) mergeSwotPoint(swot.weaknesses, item);
  for (const item of input.swot?.opportunities ?? []) mergeSwotPoint(swot.opportunities, item);
  for (const item of input.swot?.threats ?? []) mergeSwotPoint(swot.threats, item);
  if ((input.swot?.strengths?.length ?? 0) + (input.swot?.weaknesses?.length ?? 0) + (input.swot?.opportunities?.length ?? 0) + (input.swot?.threats?.length ?? 0) > 0) {
    swot.sources.push(`financials:${input.code}`);
  }

  for (const [topicId, analysis] of Object.entries(input.industry_analysis ?? {})) {
    (analysis.products ?? []).forEach((item) => uniquePush(products, item));
    (analysis.customers ?? []).forEach((item) => uniquePush(customers, item));
    for (const item of analysis.swot?.strengths ?? []) mergeSwotPoint(swot.strengths, item);
    for (const item of analysis.swot?.weaknesses ?? []) mergeSwotPoint(swot.weaknesses, item);
    for (const item of analysis.swot?.opportunities ?? []) mergeSwotPoint(swot.opportunities, item);
    for (const item of analysis.swot?.threats ?? []) mergeSwotPoint(swot.threats, item);
    if (analysis.swot) swot.sources.push(`industry_analysis:${topicId}`);
    topicRoles.push({
      topicId,
      role: analysis.market_position_detail || analysis.market_position || analysis.ai_summary || `${input.name} 已建立 ${topicId} 題材關聯`,
      relevance: relevanceFromPosition(`${analysis.market_position ?? ""} ${analysis.market_position_detail ?? ""}`),
      marketPosition: analysis.market_position,
      summary: analysis.ai_summary,
    });
  }

  const lastVerified = latestLexDate([
    normalizeDate(input.updatedAt),
    normalizeDate(input.valuation?.date),
    ...(input.trends?.daily_prices ?? []).map((row) => normalizeDate(row.date)),
    ...(input.institutional_history ?? []).map((row) => normalizeDate(row.date)),
    ...(input.margin_history ?? []).map((row) => normalizeDate(row.date)),
    ...(input.per_history ?? []).map((row) => normalizeDate(row.date)),
    ...(input.major_news ?? []).map((row) => normalizeDate(row.date)),
  ]);
  swot.lastVerified = lastVerified;
  swot.freshness = classifyFreshness(lastVerified, now, (input.major_news ?? []).length > 0);

  const dataSources = ["MOPS company profile / financial statements"];
  const finmindSignals: string[] = [];
  if ((input.trends?.daily_prices?.length ?? 0) > 0) {
    dataSources.push("FinMind TaiwanStockPrice daily OHLCV");
    finmindSignals.push("日 K / 成交量已接 FinMind，可用於技術面與量價觸發規則");
  }
  if ((input.institutional_history?.length ?? 0) > 0) {
    dataSources.push("FinMind TaiwanStockInstitutionalInvestorsBuySell");
    finmindSignals.push("法人買賣超已接 FinMind，可追蹤外資、投信、自營商方向");
  }
  if ((input.margin_history?.length ?? 0) > 0) {
    dataSources.push("FinMind TaiwanStockMarginPurchaseShortSale");
    finmindSignals.push("融資融券已接 FinMind，可納入籌碼壓力與軋空觀察");
  }
  if ((input.per_history?.length ?? 0) > 0 || input.valuation) {
    dataSources.push("FinMind TaiwanStockPER valuation history");
    finmindSignals.push("PER/PBR/殖利率可由 FinMind 補歷史估值區間");
  }
  if ((input.trends?.monthly_revenue?.length ?? 0) > 0 || input.monthly_revenue) {
    dataSources.push("FinMind TaiwanStockMonthRevenue / MOPS monthly revenue");
    finmindSignals.push("月營收可由 FinMind 拉長歷史，驗證題材是否反映到營收");
  }
  if ((input.trends?.quarterly_income?.length ?? 0) > 0) {
    dataSources.push("FinMind financial statements / MOPS quarterly reports");
    finmindSignals.push("季損益可由 FinMind/MOPS 追蹤毛利率、營益率與 EPS 趨勢");
  }
  if (topicRoles.length > 0) dataSources.push("internal topic role map / industry_analysis");

  return {
    products: products.slice(0, 8),
    customers: customers.slice(0, 8),
    topicRoles: topicRoles.slice(0, 8),
    swot: {
      ...swot,
      strengths: swot.strengths.slice(0, 6),
      weaknesses: swot.weaknesses.slice(0, 6),
      opportunities: swot.opportunities.slice(0, 6),
      threats: swot.threats.slice(0, 6),
      sources: [...new Set(swot.sources)].slice(0, 8),
    },
    dataSources: [...new Set(dataSources)],
    finmindSignals: [...new Set(finmindSignals)].slice(0, 6),
  };
}
