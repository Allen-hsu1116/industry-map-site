import { safeFloat } from "./marketData";

export interface KLineDailyPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CompanyPriorityInput {
  code: string;
  name?: string;
  topic_count?: number;
  topics?: unknown[];
}

export interface FinancialKLineInput {
  code?: string;
  name?: string;
  price?: Partial<KLineDailyPrice>;
  priceSource?: string;
  updatedAt?: string;
  trends?: {
    daily_prices?: KLineDailyPrice[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface KLineUpdatePlan {
  changed: boolean;
  next: FinancialKLineInput & { price: KLineDailyPrice; trends: NonNullable<FinancialKLineInput["trends"]> & { daily_prices: KLineDailyPrice[] }; priceSource: string };
  writableJson: string | null;
  latestDate: string | null;
  addedDates: string[];
}

function asNumber(value: unknown): number {
  return safeFloat(value, Number.NaN);
}

function assertValidDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`invalid K-line date: ${date}`);
  }
}

export function validateDailyPrice(row: KLineDailyPrice): KLineDailyPrice {
  assertValidDate(row.date);
  for (const [key, value] of Object.entries(row)) {
    if (key === "date") continue;
    if (!Number.isFinite(value)) throw new Error(`invalid numeric K-line field ${key}: ${String(value)}`);
  }
  if (row.volume < 0) throw new Error(`negative volume for ${row.date}`);
  if (row.low > row.open || row.open > row.high || row.low > row.close || row.close > row.high) {
    throw new Error(`invalid OHLC range for ${row.date}`);
  }
  return row;
}

export function normalizeFinMindPriceRow(raw: Record<string, unknown>): KLineDailyPrice {
  const row = {
    date: String(raw.date ?? ""),
    open: asNumber(raw.open),
    high: asNumber(raw.max ?? raw.high),
    low: asNumber(raw.min ?? raw.low),
    close: asNumber(raw.close),
    volume: asNumber(raw.Trading_Volume ?? raw.trading_volume ?? raw.volume),
  };
  return validateDailyPrice(row);
}

export function mergeDailyPrices(existing: KLineDailyPrice[] = [], incoming: KLineDailyPrice[] = []): KLineDailyPrice[] {
  const byDate = new Map<string, KLineDailyPrice>();
  for (const row of existing) byDate.set(row.date, validateDailyPrice(row));
  for (const row of incoming) byDate.set(row.date, validateDailyPrice(row));
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function selectPriorityCompanies(companies: CompanyPriorityInput[], limit: number): CompanyPriorityInput[] {
  return [...companies]
    .filter((company) => /^\d{4,6}[A-Z]?$/.test(company.code))
    .sort((a, b) => {
      const aScore = a.topic_count ?? (Array.isArray(a.topics) ? a.topics.length : 0);
      const bScore = b.topic_count ?? (Array.isArray(b.topics) ? b.topics.length : 0);
      if (bScore !== aScore) return bScore - aScore;
      return a.code.localeCompare(b.code);
    })
    .slice(0, Math.max(0, limit));
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function hasFinMindKLineSource(source: unknown): boolean {
  const text = String(source ?? "");
  return text.includes("FinMind TaiwanStockPrice") && text.includes("no AI-filled K-line rows");
}

function sameDailyPrice(a: Partial<KLineDailyPrice> | undefined, b: KLineDailyPrice): boolean {
  return a?.date === b.date && a.open === b.open && a.high === b.high && a.low === b.low && a.close === b.close && a.volume === b.volume;
}

export function planKLineUpdate(
  financial: FinancialKLineInput,
  fetchedRows: KLineDailyPrice[],
  options: { asOfDate: string; dryRun: boolean },
): KLineUpdatePlan {
  const existingPrices = financial.trends?.daily_prices ?? [];
  const mergedPrices = mergeDailyPrices(existingPrices, fetchedRows);
  const latest = mergedPrices.at(-1);
  if (!latest) throw new Error(`no K-line rows available for ${financial.code ?? "unknown company"}`);

  const existingDates = new Set(existingPrices.map((row) => row.date));
  const addedDates = mergedPrices.filter((row) => !existingDates.has(row.date)).map((row) => row.date);
  const next = {
    ...financial,
    price: latest,
    priceSource: `FinMind TaiwanStockPrice via api.finmindtrade.com; updated batch ${options.asOfDate}; raw daily OHLCV only, no AI-filled K-line rows`,
    trends: {
      ...(financial.trends ?? {}),
      daily_prices: mergedPrices,
    },
  };

  const after = stableStringify(next);
  const hasSemanticPriceChange = stableStringify(existingPrices) !== stableStringify(mergedPrices) || !sameDailyPrice(financial.price, latest);
  const needsSourceStamp = !hasFinMindKLineSource(financial.priceSource);
  const changed = hasSemanticPriceChange || needsSourceStamp;

  return {
    changed,
    next,
    writableJson: changed && !options.dryRun ? after : null,
    latestDate: latest.date,
    addedDates,
  };
}
