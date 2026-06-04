export type LargeHolderTier = "1m_plus" | "400k_plus";
export type LargeHolderWindow = "1w" | "4w";
export type LargeHolderRankingStatus = "verified" | "partial" | "empty";

export interface HoldingSharesPerRow {
  date: string;
  stock_id?: string;
  level: string;
  people: number | string;
  percent: number | string;
  unit: number | string;
}

export interface LargeHolderCompanyInput {
  code: string;
  name: string;
  holdingSharesPer?: HoldingSharesPerRow[];
}

export interface LargeHolderRankingOptions {
  tier: LargeHolderTier;
  window: LargeHolderWindow;
  topN?: number;
  latestDate?: string;
}

export interface LargeHolderRankingItem {
  rank: number;
  code: string;
  name: string;
  latestDate: string;
  baselineDate: string;
  tier: LargeHolderTier;
  tierLabel: string;
  latestPercent: number;
  baselinePercent: number;
  changePctPoint: number;
  latestPeople: number;
  baselinePeople: number;
  peopleChange: number;
  score: number;
  reason: string;
}

export interface LargeHolderRanking {
  tier: LargeHolderTier;
  window: LargeHolderWindow;
  status: LargeHolderRankingStatus;
  generatedAt: string;
  items: LargeHolderRankingItem[];
  emptyReason?: string;
  source: {
    name: string;
    latestDate: string;
    scope: string;
    warning: string;
  };
}

const TIER_LEVELS: Record<LargeHolderTier, string[]> = {
  "1m_plus": ["more than 1,000,001"],
  "400k_plus": ["400,001-600,000", "600,001-800,000", "800,001-1,000,000", "more than 1,000,001"],
};

const TIER_LABELS: Record<LargeHolderTier, string> = {
  "1m_plus": "1m+",
  "400k_plus": "400k+",
};

function num(value: unknown): number {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function windowLookback(window: LargeHolderWindow): number {
  return window === "1w" ? 1 : 3;
}

function normalizeRows(rows: HoldingSharesPerRow[] | undefined): Array<{ date: string; level: string; percent: number; people: number; unit: number }> {
  return (rows ?? [])
    .map((row) => ({
      date: String(row.date ?? ""),
      level: String(row.level ?? ""),
      percent: num(row.percent),
      people: num(row.people),
      unit: num(row.unit),
    }))
    .filter((row) => row.date && row.level && row.percent >= 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function allLatestDate(companies: LargeHolderCompanyInput[]): string {
  return companies
    .flatMap((company) => normalizeRows(company.holdingSharesPer).map((row) => row.date))
    .filter(Boolean)
    .sort()
    .at(-1) ?? "";
}

function aggregateTier(rows: ReturnType<typeof normalizeRows>, date: string, tier: LargeHolderTier): { percent: number; people: number } | null {
  const levels = new Set(TIER_LEVELS[tier]);
  const tierRows = rows.filter((row) => row.date === date && levels.has(row.level));
  if (tierRows.length === 0) return null;
  return {
    percent: round2(tierRows.reduce((sum, row) => sum + row.percent, 0)),
    people: Math.round(tierRows.reduce((sum, row) => sum + row.people, 0)),
  };
}

function buildReason(tier: LargeHolderTier, changePctPoint: number, peopleChange: number, latestPercent: number): string {
  const sign = changePctPoint >= 0 ? "+" : "";
  const peopleSign = peopleChange >= 0 ? "+" : "";
  return `${TIER_LABELS[tier]} holders ${sign}${changePctPoint.toFixed(2)}pp · people ${peopleSign}${peopleChange} · latest ${latestPercent.toFixed(2)}%`;
}

export function buildLargeHolderRanking(companies: LargeHolderCompanyInput[], options: LargeHolderRankingOptions): LargeHolderRanking {
  const sourceLatestDate = options.latestDate ?? allLatestDate(companies);
  const topN = options.topN ?? 20;
  const lookback = windowLookback(options.window);

  const freshEntries = companies.map((company) => ({ company, rows: normalizeRows(company.holdingSharesPer) }))
    .filter((entry) => entry.rows.some((row) => row.date === sourceLatestDate));

  const items = freshEntries.flatMap(({ company, rows }): Omit<LargeHolderRankingItem, "rank">[] => {
    const dates = Array.from(new Set(rows.map((row) => row.date))).sort();
    const latestIndex = dates.indexOf(sourceLatestDate);
    if (latestIndex < 0) return [];
    const baselineDate = dates[Math.max(0, latestIndex - lookback)];
    if (!baselineDate || baselineDate === sourceLatestDate) return [];

    const latest = aggregateTier(rows, sourceLatestDate, options.tier);
    const baseline = aggregateTier(rows, baselineDate, options.tier);
    if (!latest || !baseline) return [];

    const changePctPoint = round2(latest.percent - baseline.percent);
    const peopleChange = Math.round(latest.people - baseline.people);
    const score = round2(changePctPoint * 10 + Math.min(latest.percent, 100) * 0.2 + Math.max(peopleChange, 0) * 0.02);

    return [{
      code: company.code,
      name: company.name,
      latestDate: sourceLatestDate,
      baselineDate,
      tier: options.tier,
      tierLabel: TIER_LABELS[options.tier],
      latestPercent: latest.percent,
      baselinePercent: baseline.percent,
      changePctPoint,
      latestPeople: latest.people,
      baselinePeople: baseline.people,
      peopleChange,
      score,
      reason: buildReason(options.tier, changePctPoint, peopleChange, latest.percent),
    }];
  })
    .sort((a, b) => b.score - a.score || b.changePctPoint - a.changePctPoint || a.code.localeCompare(b.code))
    .slice(0, topN)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const status: LargeHolderRankingStatus = items.length === 0 ? "empty" : freshEntries.length === companies.length ? "verified" : "partial";
  return {
    tier: options.tier,
    window: options.window,
    status,
    generatedAt: new Date().toISOString(),
    items,
    ...(items.length === 0 ? { emptyReason: "No checked-in FinMind holding-share tier rows have enough fresh comparable dates for this tier/window." } : {}),
    source: {
      name: "FinMind TaiwanStockHoldingSharesPer checked-in tracked sample",
      latestDate: sourceLatestDate,
      scope: `tracked sample ${freshEntries.length} / ${companies.length}; weekly share-tier data, not full-market coverage`,
      warning: "tracked sample only, not full market; ranks share-tier percentage changes from checked-in FinMind holding-share rows and excludes stale/missing companies",
    },
  };
}
