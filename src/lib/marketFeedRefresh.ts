import { safeFloat } from "./marketData";

export interface InstitutionalHistoryRow {
  date: string;
  foreign_buy?: number;
  foreign_sell?: number;
  foreign_net: number;
  investment_trust_buy?: number;
  investment_trust_sell?: number;
  investment_trust_net: number;
  dealer_buy?: number;
  dealer_sell?: number;
  dealer_net: number;
  dealer_hedge_buy?: number;
  dealer_hedge_sell?: number;
  dealer_hedge_net?: number;
  total_buy?: number;
  total_sell?: number;
  total_net: number;
}

export interface MarginHistoryRow {
  date: string;
  margin_buy: number;
  margin_sell: number;
  margin_cash_repayment?: number;
  margin_balance: number;
  margin_yesterday_balance?: number;
  margin_limit?: number;
  short_sell: number;
  short_buy: number;
  short_cash_repayment?: number;
  short_balance: number;
  short_yesterday_balance?: number;
  short_limit?: number;
  offset?: number;
}

export interface PerHistoryRow {
  date: string;
  pe: number;
  pb: number;
  dividend_yield: number;
}

export interface FinancialMarketFeedInput {
  code?: string;
  institutional_history?: InstitutionalHistoryRow[];
  margin_history?: MarginHistoryRow[];
  per_history?: PerHistoryRow[];
  valuation?: Record<string, unknown>;
  marketFeedSource?: string;
  [key: string]: unknown;
}

export interface MarketFeedUpdatePlan {
  changed: boolean;
  next: FinancialMarketFeedInput & { institutional_history: InstitutionalHistoryRow[]; margin_history: MarginHistoryRow[]; per_history: PerHistoryRow[]; valuation: Record<string, unknown>; marketFeedSource: string };
  writableJson: string | null;
  latestInstitutionalDate: string | null;
  latestMarginDate: string | null;
  latestPerDate: string | null;
  addedInstitutionalDates: string[];
  addedMarginDates: string[];
  addedPerDates: string[];
}

function asNumber(value: unknown): number {
  return safeFloat(value, 0);
}

function assertDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`invalid market feed date: ${date}`);
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function cleanUndefined<T extends Record<string, unknown>>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T;
}

export function normalizeFinMindInstitutionalRows(rawRows: Record<string, unknown>[]): InstitutionalHistoryRow[] {
  const byDate = new Map<string, {
    date: string;
    foreign_buy: number;
    foreign_sell: number;
    investment_trust_buy: number;
    investment_trust_sell: number;
    dealer_buy: number;
    dealer_sell: number;
    dealer_hedge_buy: number;
    dealer_hedge_sell: number;
    total_buy: number;
    total_sell: number;
  }>();

  for (const raw of rawRows) {
    const date = String(raw.date ?? "");
    assertDate(date);
    const name = String(raw.name ?? "");
    const buy = asNumber(raw.buy);
    const sell = asNumber(raw.sell);
    const row = byDate.get(date) ?? {
      date,
      foreign_buy: 0,
      foreign_sell: 0,
      investment_trust_buy: 0,
      investment_trust_sell: 0,
      dealer_buy: 0,
      dealer_sell: 0,
      dealer_hedge_buy: 0,
      dealer_hedge_sell: 0,
      total_buy: 0,
      total_sell: 0,
    };

    if (name === "Foreign_Investor" || name === "Foreign_Dealer_Self") {
      row.foreign_buy += buy;
      row.foreign_sell += sell;
    } else if (name === "Investment_Trust") {
      row.investment_trust_buy += buy;
      row.investment_trust_sell += sell;
    } else if (name === "Dealer_Hedging") {
      row.dealer_hedge_buy += buy;
      row.dealer_hedge_sell += sell;
      row.dealer_buy += buy;
      row.dealer_sell += sell;
    } else if (name.startsWith("Dealer")) {
      row.dealer_buy += buy;
      row.dealer_sell += sell;
    }
    row.total_buy += buy;
    row.total_sell += sell;
    byDate.set(date, row);
  }

  return Array.from(byDate.values()).map((row) => cleanUndefined({
    date: row.date,
    foreign_buy: row.foreign_buy,
    foreign_sell: row.foreign_sell,
    foreign_net: row.foreign_buy - row.foreign_sell,
    investment_trust_buy: row.investment_trust_buy,
    investment_trust_sell: row.investment_trust_sell,
    investment_trust_net: row.investment_trust_buy - row.investment_trust_sell,
    dealer_buy: row.dealer_buy,
    dealer_sell: row.dealer_sell,
    dealer_net: row.dealer_buy - row.dealer_sell,
    dealer_hedge_buy: row.dealer_hedge_buy,
    dealer_hedge_sell: row.dealer_hedge_sell,
    dealer_hedge_net: row.dealer_hedge_buy - row.dealer_hedge_sell,
    total_buy: row.total_buy,
    total_sell: row.total_sell,
    total_net: row.total_buy - row.total_sell,
  })).sort((a, b) => a.date.localeCompare(b.date));
}

export function normalizeFinMindMarginRow(raw: Record<string, unknown>): MarginHistoryRow {
  const date = String(raw.date ?? "");
  assertDate(date);
  return cleanUndefined({
    date,
    margin_buy: asNumber(raw.MarginPurchaseBuy ?? raw.margin_buy),
    margin_sell: asNumber(raw.MarginPurchaseSell ?? raw.margin_sell),
    margin_cash_repayment: asNumber(raw.MarginPurchaseCashRepayment ?? raw.margin_cash_repayment),
    margin_balance: asNumber(raw.MarginPurchaseTodayBalance ?? raw.margin_balance),
    margin_yesterday_balance: asNumber(raw.MarginPurchaseYesterdayBalance ?? raw.margin_yesterday_balance),
    margin_limit: asNumber(raw.MarginPurchaseLimit ?? raw.margin_limit),
    short_sell: asNumber(raw.ShortSaleSell ?? raw.short_sell),
    short_buy: asNumber(raw.ShortSaleBuy ?? raw.short_buy),
    short_cash_repayment: asNumber(raw.ShortSaleCashRepayment ?? raw.short_cash_repayment),
    short_balance: asNumber(raw.ShortSaleTodayBalance ?? raw.short_balance),
    short_yesterday_balance: asNumber(raw.ShortSaleYesterdayBalance ?? raw.short_yesterday_balance),
    short_limit: asNumber(raw.ShortSaleLimit ?? raw.short_limit),
    offset: asNumber(raw.OffsetLoanAndShort ?? raw.offset),
  });
}

export function normalizeFinMindPerRow(raw: Record<string, unknown>): PerHistoryRow {
  const date = String(raw.date ?? "");
  assertDate(date);
  return {
    date,
    pe: asNumber(raw.per ?? raw.PER ?? raw.pe),
    pb: asNumber(raw.pbr ?? raw.PBR ?? raw.pb),
    dividend_yield: asNumber(raw.dividend_yield ?? raw.DividendYield ?? raw.dividendYield),
  };
}

function mergeByDate<T extends { date: string }>(existing: T[] = [], incoming: T[] = []): T[] {
  const byDate = new Map<string, T>();
  for (const row of existing) {
    assertDate(row.date);
    byDate.set(row.date, row);
  }
  for (const row of incoming) {
    assertDate(row.date);
    byDate.set(row.date, row);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function mergeInstitutionalHistory(existing: InstitutionalHistoryRow[] = [], incoming: InstitutionalHistoryRow[] = []): InstitutionalHistoryRow[] {
  return mergeByDate(existing, incoming);
}

export function mergeMarginHistory(existing: MarginHistoryRow[] = [], incoming: MarginHistoryRow[] = []): MarginHistoryRow[] {
  return mergeByDate(existing, incoming);
}

export function mergePerHistory(existing: PerHistoryRow[] = [], incoming: PerHistoryRow[] = []): PerHistoryRow[] {
  return mergeByDate(existing, incoming);
}

function hasFinMindMarketFeedSource(source: unknown): boolean {
  const text = String(source ?? "");
  return text.includes("FinMind TaiwanStockInstitutionalInvestorsBuySell") && text.includes("FinMind TaiwanStockMarginPurchaseShortSale") && text.includes("FinMind TaiwanStockPER") && text.includes("no AI-filled chip rows");
}

function valuationDate(date: string): string {
  return date.replaceAll("-", "");
}

export function planMarketFeedUpdate(
  financial: FinancialMarketFeedInput,
  options: { institutionalRows: InstitutionalHistoryRow[]; marginRows: MarginHistoryRow[]; perRows?: PerHistoryRow[]; asOfDate: string; dryRun: boolean },
): MarketFeedUpdatePlan {
  const existingInstitutional = financial.institutional_history ?? [];
  const existingMargin = financial.margin_history ?? [];
  const existingPer = financial.per_history ?? [];
  const institutional = mergeInstitutionalHistory(existingInstitutional, options.institutionalRows);
  const margin = mergeMarginHistory(existingMargin, options.marginRows);
  const per = mergePerHistory(existingPer, options.perRows ?? []);
  const existingInstitutionalDates = new Set(existingInstitutional.map((row) => row.date));
  const existingMarginDates = new Set(existingMargin.map((row) => row.date));
  const existingPerDates = new Set(existingPer.map((row) => row.date));
  const latestInstitutionalDate = institutional.at(-1)?.date ?? null;
  const latestMarginDate = margin.at(-1)?.date ?? null;
  const latestPer = per.at(-1);
  const latestPerDate = latestPer?.date ?? null;
  const next: MarketFeedUpdatePlan["next"] = {
    ...financial,
    institutional_history: institutional,
    margin_history: margin,
    per_history: per,
    valuation: latestPer ? {
      ...(financial.valuation ?? {}),
      date: valuationDate(latestPer.date),
      pe: String(latestPer.pe),
      pb: String(latestPer.pb),
      dividendYield: String(latestPer.dividend_yield),
    } : (financial.valuation ?? {}),
    marketFeedSource: `FinMind TaiwanStockInstitutionalInvestorsBuySell + FinMind TaiwanStockMarginPurchaseShortSale + FinMind TaiwanStockPER via api.finmindtrade.com; updated batch ${options.asOfDate}; raw daily institutional/margin/valuation rows only, no AI-filled chip rows`,
  };

  const hasSemanticChange = stableStringify(existingInstitutional) !== stableStringify(institutional) || stableStringify(existingMargin) !== stableStringify(margin) || stableStringify(existingPer) !== stableStringify(per) || stableStringify(financial.valuation ?? {}) !== stableStringify(next.valuation);
  const changed = hasSemanticChange || !hasFinMindMarketFeedSource(financial.marketFeedSource);
  return {
    changed,
    next,
    writableJson: changed && !options.dryRun ? stableStringify(next) : null,
    latestInstitutionalDate,
    latestMarginDate,
    latestPerDate,
    addedInstitutionalDates: institutional.filter((row) => !existingInstitutionalDates.has(row.date)).map((row) => row.date),
    addedMarginDates: margin.filter((row) => !existingMarginDates.has(row.date)).map((row) => row.date),
    addedPerDates: per.filter((row) => !existingPerDates.has(row.date)).map((row) => row.date),
  };
}
