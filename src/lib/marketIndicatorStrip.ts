import { safeFloat, safeInt } from "./marketData";

export type MarketIndicatorStatus = "verified" | "partial" | "empty";

export interface MarketIndicatorIndexRow {
  日期: string;
  指數: string;
  收盤指數: string;
  漲跌: string;
  漲跌點數: string;
  漲跌百分比: string;
  特殊處理註記?: string;
}

export interface MarketIndicatorSourceSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    name: string;
    scope: string;
  };
  indexRows: MarketIndicatorIndexRow[];
  advanceDecline?: {
    date: string;
    advancingStocks: number;
    decliningStocks: number;
    unchangedStocks: number;
    limitUpStocks: number;
    limitDownStocks: number;
    marketValue?: number;
    marketVolume?: number;
  };
  unavailable: Array<{
    id: string;
    label: string;
    reason: string;
  }>;
}

export interface MarketIndicatorItem {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  unit?: string;
  change?: number;
  changePercent?: number;
  secondaryValue?: number;
  secondaryLabel?: string;
  date: string;
  status: "verified";
  source: string;
  note: string;
}

export interface MarketIndicatorStrip {
  schemaVersion: 1;
  generatedAt: string;
  latestDate: string;
  status: MarketIndicatorStatus;
  source: {
    name: string;
    scope: string;
    warning: string;
  };
  indicators: MarketIndicatorItem[];
  unavailable: MarketIndicatorSourceSnapshot["unavailable"];
  emptyReason?: string;
}

const INDEX_IDS: Record<string, string> = {
  發行量加權股價指數: "twse-weighted",
  臺灣50指數: "taiwan-50",
  電子工業類指數: "electronics",
  金融保險類指數: "financial-insurance",
  半導體類指數: "semiconductor",
};

function rocDateToIso(date: string): string {
  if (/^\d{8}$/.test(date)) return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  if (!/^\d{7}$/.test(date)) return "";
  const year = Number.parseInt(date.slice(0, 3), 10) + 1911;
  return `${year}-${date.slice(3, 5)}-${date.slice(5, 7)}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatNumber(value: number): string {
  return value.toLocaleString("zh-TW", { maximumFractionDigits: 2 });
}

function buildIndexIndicator(row: MarketIndicatorIndexRow, sourceName: string): MarketIndicatorItem | null {
  const id = INDEX_IDS[row.指數];
  const date = rocDateToIso(row.日期);
  const close = safeFloat(row.收盤指數, NaN);
  const changePoints = safeFloat(row.漲跌點數, NaN);
  const changePercent = safeFloat(row.漲跌百分比, NaN);
  if (!id || !date || !Number.isFinite(close) || !Number.isFinite(changePoints) || !Number.isFinite(changePercent)) return null;
  const sign = row.漲跌 === "-" ? -1 : 1;
  const change = round2(changePoints * sign);
  return {
    id,
    label: row.指數,
    value: close,
    valueLabel: formatNumber(close),
    change,
    changePercent: round2(changePercent),
    date,
    status: "verified",
    source: sourceName,
    note: `official TWSE close index row; ${row.特殊處理註記 ? `special note: ${row.特殊處理註記}` : "no special handling note"}`,
  };
}

function buildBreadthIndicators(snapshot: MarketIndicatorSourceSnapshot): MarketIndicatorItem[] {
  const breadth = snapshot.advanceDecline;
  if (!breadth) return [];
  const date = rocDateToIso(breadth.date);
  if (!date) return [];
  const indicators: MarketIndicatorItem[] = [
    {
      id: "breadth",
      label: "上市股票漲跌家數",
      value: safeInt(breadth.advancingStocks),
      valueLabel: `${safeInt(breadth.advancingStocks).toLocaleString("zh-TW")} / ${safeInt(breadth.decliningStocks).toLocaleString("zh-TW")}`,
      secondaryValue: safeInt(breadth.decliningStocks),
      secondaryLabel: `平盤 ${safeInt(breadth.unchangedStocks).toLocaleString("zh-TW")} · 漲停 ${safeInt(breadth.limitUpStocks).toLocaleString("zh-TW")} · 跌停 ${safeInt(breadth.limitDownStocks).toLocaleString("zh-TW")}`,
      date,
      status: "verified",
      source: snapshot.source.name,
      note: "TWSE MI_INDEX breadth; stocks only, not all listed securities/warrants.",
    },
  ];

  if (breadth.marketValue && breadth.marketVolume) {
    indicators.push({
      id: "turnover",
      label: "市場成交值",
      value: round2(breadth.marketValue / 100_000_000),
      valueLabel: `${formatNumber(round2(breadth.marketValue / 100_000_000))} 億元`,
      secondaryValue: round2(breadth.marketVolume / 100_000_000),
      secondaryLabel: `成交量 ${formatNumber(round2(breadth.marketVolume / 100_000_000))} 億股`,
      unit: "億元",
      date,
      status: "verified",
      source: snapshot.source.name,
      note: "TWSE MI_INDEX market_total value/volume; official daily market aggregate.",
    });
  }

  return indicators;
}

export function buildMarketIndicatorStrip(snapshot: MarketIndicatorSourceSnapshot): MarketIndicatorStrip {
  const indexIndicators = snapshot.indexRows
    .map((row) => buildIndexIndicator(row, snapshot.source.name))
    .filter((item): item is MarketIndicatorItem => item !== null);
  const selectedIndexIds = new Set(["twse-weighted", "financial-insurance", "electronics", "semiconductor", "taiwan-50"]);
  const indicators = [
    ...indexIndicators.filter((item) => selectedIndexIds.has(item.id)).slice(0, 2),
    ...buildBreadthIndicators(snapshot),
  ];
  const latestDate = indicators.map((item) => item.date).sort().at(-1) ?? "";
  const status: MarketIndicatorStatus = indicators.length === 0 ? "empty" : snapshot.unavailable.length > 0 ? "partial" : "verified";

  return {
    schemaVersion: 1,
    generatedAt: snapshot.generatedAt,
    latestDate,
    status,
    source: {
      name: snapshot.source.name,
      scope: snapshot.source.scope,
      warning: "Taiwan official indicators only; ADR/VIX/global proxy source not verified, so missing global cards stay unavailable instead of being AI-filled.",
    },
    indicators,
    unavailable: snapshot.unavailable,
    ...(status === "empty" ? { emptyReason: "No verified TWSE market indicator rows; skip the strip instead of filling with AI or stale placeholders." } : {}),
  };
}
