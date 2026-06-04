export type StrongStockTimeframe = "1d" | "5d" | "20d";
export type StrongStockRankingStatus = "verified" | "partial" | "empty";

export interface StrongStockDailyPrice {
  date: string;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume: number | string;
}

export interface StrongStockCompanyInput {
  code: string;
  name: string;
  topicCount?: number;
  dailyPrices?: StrongStockDailyPrice[];
  institutionalNet?: number;
}

export interface StrongStockRankingOptions {
  timeframe: StrongStockTimeframe;
  topN?: number;
  latestDate?: string;
}

export interface StrongStockRankingItem {
  rank: number;
  code: string;
  name: string;
  score: number;
  latestDate: string;
  close: number;
  returnPct: number;
  changePct1d: number;
  volumeRatio20: number;
  ma20?: number;
  aboveMa20: boolean | null;
  high20Breakout: boolean;
  reason: string;
}

export interface StrongStockRanking {
  timeframe: StrongStockTimeframe;
  status: StrongStockRankingStatus;
  generatedAt: string;
  items: StrongStockRankingItem[];
  emptyReason?: string;
  source: {
    name: string;
    latestDate: string;
    scope: string;
    warning: string;
  };
}

function num(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function avg(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizePrices(prices: StrongStockDailyPrice[] | undefined): Array<{ date: string; close: number; high: number; volume: number }> {
  return (prices ?? [])
    .map((price) => ({
      date: String(price.date ?? ""),
      close: num(price.close),
      high: num(price.high),
      volume: num(price.volume),
    }))
    .filter((price) => price.date && price.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function requiredLookback(timeframe: StrongStockTimeframe): number {
  if (timeframe === "1d") return 2;
  if (timeframe === "5d") return 4;
  return 20;
}

function returnStartOffset(timeframe: StrongStockTimeframe): number {
  if (timeframe === "1d") return 2;
  if (timeframe === "5d") return 4;
  return 20;
}

function latestDate(companies: StrongStockCompanyInput[]): string {
  return companies
    .flatMap((company) => normalizePrices(company.dailyPrices).at(-1)?.date ?? [])
    .filter(Boolean)
    .sort()
    .at(-1) ?? "";
}

function buildReason(timeframe: StrongStockTimeframe, returnPct: number, volumeRatio20: number, aboveMa20: boolean | null, high20Breakout: boolean): string {
  const parts = [`${timeframe} return ${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`];
  if (volumeRatio20 > 0) parts.push(`volume ratio ${volumeRatio20.toFixed(2)}x`);
  if (aboveMa20 != null) parts.push(aboveMa20 ? "above MA20" : "below MA20");
  if (high20Breakout) parts.push("20d high breakout");
  return parts.join(" · ");
}

export function buildStrongStockRanking(companies: StrongStockCompanyInput[], options: StrongStockRankingOptions): StrongStockRanking {
  const sourceLatestDate = options.latestDate ?? latestDate(companies);
  const topN = options.topN ?? 20;
  const required = requiredLookback(options.timeframe);
  const offset = returnStartOffset(options.timeframe);
  const freshCompanies = companies.map((company) => ({ company, prices: normalizePrices(company.dailyPrices) }))
    .filter((entry) => entry.prices.at(-1)?.date === sourceLatestDate);

  const items = freshCompanies.flatMap(({ company, prices }): Omit<StrongStockRankingItem, "rank">[] => {
    if (prices.length < required) return [];
    const latest = prices.at(-1)!;
    const previous = prices.at(-2);
    const start = prices.at(-offset);
    if (!start || start.close <= 0 || !previous || previous.close <= 0) return [];
    const recent20 = prices.slice(-20);
    const ma20 = avg(recent20.map((price) => price.close));
    const avgVolume20 = avg(recent20.slice(0, -1).map((price) => price.volume)) ?? avg(recent20.map((price) => price.volume)) ?? 0;
    const returnPct = ((latest.close - start.close) / start.close) * 100;
    const changePct1d = ((latest.close - previous.close) / previous.close) * 100;
    const volumeRatio20 = avgVolume20 > 0 ? latest.volume / avgVolume20 : 0;
    const prior20High = prices.slice(-21, -1).map((price) => price.high);
    const high20Breakout = prior20High.length > 0 ? latest.close >= Math.max(...prior20High) : false;
    const aboveMa20 = ma20 == null ? null : latest.close >= ma20;
    const score = returnPct * 4 + changePct1d * 1.5 + Math.min(volumeRatio20, 5) * 6 + (aboveMa20 ? 8 : 0) + (high20Breakout ? 10 : 0) + Math.min(company.topicCount ?? 0, 10) * 0.2;

    return [{
      code: company.code,
      name: company.name,
      score: round2(score),
      latestDate: latest.date,
      close: round2(latest.close),
      returnPct: round2(returnPct),
      changePct1d: round2(changePct1d),
      volumeRatio20: round2(volumeRatio20),
      ma20: ma20 == null ? undefined : round2(ma20),
      aboveMa20,
      high20Breakout,
      reason: buildReason(options.timeframe, returnPct, volumeRatio20, aboveMa20, high20Breakout),
    }];
  })
    .filter((item) => item.returnPct > 0 || item.high20Breakout || item.aboveMa20)
    .sort((a, b) => b.score - a.score || b.returnPct - a.returnPct || a.code.localeCompare(b.code))
    .slice(0, topN)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const status: StrongStockRankingStatus = items.length === 0 ? "empty" : freshCompanies.length === companies.length ? "verified" : "partial";
  return {
    timeframe: options.timeframe,
    status,
    generatedAt: new Date().toISOString(),
    items,
    ...(items.length === 0 ? { emptyReason: `${options.timeframe} timeframe has no fresh checked-in K-line candidates with enough lookback.` } : {}),
    source: {
      name: "FinMind TaiwanStockPrice checked-in financial snapshots",
      latestDate: sourceLatestDate,
      scope: `fresh K-line coverage ${freshCompanies.length} / ${companies.length}; stale companies excluded from ranking`,
      warning: "price/technical only; excludes chips, fundamentals, news, ETF constituents, and AI judgement",
    },
  };
}
