export interface OrderBookLevel {
  price: number;
  volume: number;
}

export interface QuoteResult {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  averagePrice?: number;
  volumeRatio?: number;
  buyPrice?: number;
  buyVolume?: number;
  sellPrice?: number;
  sellVolume?: number;
  totalAmount?: number;
  orderBook?: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  };
  updatedAt: string;
  source: string;
}

export interface DailyPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalSummary {
  latestClose: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume5: number;
  avgVolume20: number;
  volumeRatio20: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  ma60?: number;
  high20: number;
  low20: number;
  aboveMa20: boolean | null;
  trendLabel: string;
}

export function safeFloat(v: unknown, fallback = 0): number {
  if (v == null || v === "-" || v === "") return fallback;
  const n = Number.parseFloat(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

export function safeInt(v: unknown, fallback = 0): number {
  if (v == null || v === "-" || v === "") return fallback;
  const n = Number.parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function splitTWSELevels(raw: unknown): number[] {
  return String(raw ?? "")
    .split("_")
    .map((v) => safeFloat(v, NaN))
    .filter((v) => Number.isFinite(v) && v > 0);
}

function buildLevels(prices: number[], volumes: number[]): OrderBookLevel[] {
  return prices
    .map((price, index) => ({ price, volume: volumes[index] ?? 0 }))
    .filter((level) => level.price > 0)
    .slice(0, 5);
}

export function formatTWSEQuote(info: Record<string, unknown>, exchange: string): QuoteResult {
  const tradedPrice = safeFloat(info.z);
  const ydPrice = safeFloat(info.y);
  const finalPrice = tradedPrice > 0 ? tradedPrice : ydPrice;
  const change = finalPrice > 0 && ydPrice > 0 ? finalPrice - ydPrice : 0;
  const changePercent = ydPrice > 0 ? (change / ydPrice) * 100 : 0;

  // TWSE MIS: a/f = ask prices/volumes, b/g = bid prices/volumes.
  // Field c is stock code, not ask volume.
  const asks = buildLevels(splitTWSELevels(info.a), splitTWSELevels(info.f));
  const bids = buildLevels(splitTWSELevels(info.b), splitTWSELevels(info.g));
  const volume = safeInt(info.v) || safeInt(info.tv) * 1000;

  return {
    symbol: String(info.c ?? ""),
    name: String(info.n ?? ""),
    exchange,
    price: finalPrice,
    change: round2(change),
    changePercent: round2(changePercent),
    open: safeFloat(info.o),
    high: safeFloat(info.h),
    low: safeFloat(info.l),
    volume,
    previousClose: ydPrice,
    buyPrice: bids[0]?.price,
    buyVolume: bids[0]?.volume,
    sellPrice: asks[0]?.price,
    sellVolume: asks[0]?.volume,
    totalAmount: safeInt(info.tval) || undefined,
    orderBook: bids.length || asks.length ? { bids, asks } : undefined,
    updatedAt: `${String(info.d ?? "")} ${String(info.t ?? info["%"] ?? "")}`.trim() || new Date().toISOString(),
    source: "TWSE",
  };
}

function avg(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function ma(data: DailyPrice[], period: number): number | undefined {
  if (data.length < period) return undefined;
  return avg(data.slice(-period).map((row) => row.close));
}

export function computeTechnicalSummary(input: DailyPrice[] | undefined | null): TechnicalSummary {
  const data = (input ?? [])
    .map((row) => ({
      date: String(row.date ?? ""),
      open: safeFloat(row.open),
      high: safeFloat(row.high),
      low: safeFloat(row.low),
      close: safeFloat(row.close),
      volume: safeFloat(row.volume),
    }))
    .filter((row) => row.date && row.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const latestClose = latest?.close ?? 0;
  const previousClose = previous?.close ?? 0;
  const change = previousClose > 0 ? latestClose - previousClose : 0;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
  const recent20 = data.slice(-20);
  const avgVolume5 = avg(data.slice(-5).map((row) => row.volume)) ?? 0;
  const avgVolume20 = avg(recent20.map((row) => row.volume)) ?? 0;
  const ma5 = ma(data, 5);
  const ma10 = ma(data, 10);
  const ma20 = ma(data, 20);
  const ma60 = ma(data, 60);
  const aboveMa20 = ma20 == null ? null : latestClose >= ma20;

  let trendLabel = "資料不足";
  if (ma5 != null && ma20 != null) {
    trendLabel = latestClose >= ma5 && ma5 >= ma20 ? "多頭排列" : latestClose < ma5 && ma5 < ma20 ? "空頭排列" : "區間震盪";
  }

  return {
    latestClose,
    previousClose,
    change: round2(change),
    changePercent: round2(changePercent),
    volume: latest?.volume ?? 0,
    avgVolume5,
    avgVolume20,
    volumeRatio20: avgVolume20 > 0 && latest ? round2(latest.volume / avgVolume20) : 0,
    ma5,
    ma10,
    ma20,
    ma60,
    high20: recent20.length ? Math.max(...recent20.map((row) => row.high)) : 0,
    low20: recent20.length ? Math.min(...recent20.map((row) => row.low)) : 0,
    aboveMa20,
    trendLabel,
  };
}

const emptyProfile = { industry: "", chairman: "", established: "", listed: "", capital: "", website: "", address: "" };
const emptyValuation = { date: "", pe: "", pb: "", dividendYield: "" };
const emptyPrice = { date: "", open: 0, high: 0, low: 0, close: 0, volume: 0 };
const emptyIncome = { revenue: "", grossProfit: "", operatingIncome: "", netIncome: "", eps: "", operatingMargin: "", revenueYoy: 0 };
const emptyMonthlyRevenue = { month: "", revenue: "", mom: "", yoy: "" };
const emptyBalance = { totalAssets: "", totalLiabilities: "", equity: "", bookValuePerShare: "" };
const emptyDividend = { year: "", cashDividendPerShare: "", stockDividendPerShare: "" };

function cleanStr(v: unknown): string {
  return String(v ?? "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function str(v: unknown): string {
  return String(v ?? "");
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

export function normalizeFinancialData(raw: unknown): JsonRecord {
  const rawData = asRecord(raw);
  const profile = asRecord(rawData.profile);
  const valuation = asRecord(rawData.valuation);
  const price = asRecord(rawData.price);
  const income = asRecord(rawData.income);
  const monthlyRevenue = asRecord(rawData.monthly_revenue);
  const balance = asRecord(rawData.balance);
  const dividend = asRecord(rawData.dividend);
  const trends = asRecord(rawData.trends);
  return {
    ...rawData,
    code: str(rawData.code),
    name: str(rawData.name),
    profile: { ...emptyProfile, ...profile, industry: cleanStr(profile.industry), address: cleanStr(profile.address) },
    valuation: {
      ...emptyValuation,
      ...valuation,
      pe: str(valuation.pe),
      pb: str(valuation.pb),
      dividendYield: str(valuation.dividendYield),
    },
    price: {
      ...emptyPrice,
      ...price,
      open: safeFloat(price.open),
      high: safeFloat(price.high),
      low: safeFloat(price.low),
      close: safeFloat(price.close),
      volume: safeFloat(price.volume),
    },
    income: {
      ...emptyIncome,
      ...income,
      revenue: str(income.revenue),
      grossProfit: str(income.grossProfit),
      operatingIncome: str(income.operatingIncome),
      netIncome: str(income.netIncome),
      eps: str(income.eps),
      revenueYoy: safeFloat(income.revenueYoy),
    },
    monthly_revenue: {
      ...emptyMonthlyRevenue,
      ...monthlyRevenue,
      revenue: str(monthlyRevenue.revenue),
      mom: str(monthlyRevenue.mom),
      yoy: str(monthlyRevenue.yoy),
    },
    balance: {
      ...emptyBalance,
      ...balance,
      totalAssets: str(balance.totalAssets),
      totalLiabilities: str(balance.totalLiabilities),
      equity: str(balance.equity),
      bookValuePerShare: str(balance.bookValuePerShare),
    },
    dividend: {
      ...emptyDividend,
      ...dividend,
      cashDividendPerShare: str(dividend.cashDividendPerShare),
      stockDividendPerShare: str(dividend.stockDividendPerShare),
    },
    dividendHistory: Array.isArray(rawData.dividendHistory) ? rawData.dividendHistory.map((row) => {
      const d = asRecord(row);
      return { ...d, cashDividend: safeFloat(d.cashDividend), stockDividend: safeFloat(d.stockDividend), totalDividend: safeFloat(d.totalDividend) };
    }) : [],
    trends: {
      ...trends,
      monthly_revenue: Array.isArray(trends.monthly_revenue) ? trends.monthly_revenue.map((row) => { const d = asRecord(row); return { ...d, revenue: safeFloat(d.revenue), mom: safeFloat(d.mom), yoy: safeFloat(d.yoy) }; }) : [],
      quarterly_income: Array.isArray(trends.quarterly_income) ? trends.quarterly_income.map((row) => {
        const d = asRecord(row);
        return {
          ...d,
          revenue: safeFloat(d.revenue),
          grossProfit: safeFloat(d.grossProfit),
          operatingIncome: safeFloat(d.operatingIncome),
          netIncome: safeFloat(d.netIncome),
          eps: safeFloat(d.eps),
          grossMargin: safeFloat(d.grossMargin),
          operatingMargin: safeFloat(d.operatingMargin),
          netMargin: safeFloat(d.netMargin),
        };
      }) : [],
      monthly_price: Array.isArray(trends.monthly_price) ? trends.monthly_price.map((row) => { const d = asRecord(row); return { ...d, high: safeFloat(d.high), low: safeFloat(d.low), avg: safeFloat(d.avg), volume: safeFloat(d.volume) }; }) : [],
      daily_prices: Array.isArray(trends.daily_prices) ? trends.daily_prices.map((row) => { const d = asRecord(row); return { ...d, open: safeFloat(d.open), high: safeFloat(d.high), low: safeFloat(d.low), close: safeFloat(d.close), volume: safeFloat(d.volume) }; }) : [],
      yearly_trading: Array.isArray(trends.yearly_trading) ? trends.yearly_trading.map((row) => { const d = asRecord(row); return { ...d, high: safeFloat(d.high), low: safeFloat(d.low), avg_closing: safeFloat(d.avg_closing), trade_volume: safeFloat(d.trade_volume), trade_value: safeFloat(d.trade_value) }; }) : [],
    },
    institutional_history: Array.isArray(rawData.institutional_history) ? rawData.institutional_history : [],
    margin_history: Array.isArray(rawData.margin_history) ? rawData.margin_history : [],
    per_history: Array.isArray(rawData.per_history) ? rawData.per_history : [],
    major_news: Array.isArray(rawData.major_news) ? rawData.major_news : [],
    products: Array.isArray(rawData.products) ? rawData.products : [],
    customers: Array.isArray(rawData.customers) ? rawData.customers : [],
    updatedAt: str(rawData.updatedAt),
  };
}
