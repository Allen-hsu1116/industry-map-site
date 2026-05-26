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

export interface AnalysisInput {
  code: string;
  name: string;
  updatedAt?: string;
  trends?: { daily_prices?: DailyPrice[] };
  valuation?: { pe?: string | number; pb?: string | number; dividendYield?: string | number };
  monthly_revenue?: { yoy?: string | number; mom?: string | number };
  institutional_history?: InstitutionalFlowPoint[];
  margin_history?: MarginPoint[];
}

export interface DailyAnalysis {
  schemaVersion: 1;
  code: string;
  name: string;
  generatedAt: string;
  sourceUpdatedAt?: string;
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

export function generateDailyAnalysis(input: AnalysisInput, now = new Date()): DailyAnalysis {
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

  return {
    schemaVersion: 1,
    code: input.code,
    name: input.name,
    generatedAt: now.toISOString(),
    sourceUpdatedAt: input.updatedAt ?? latestDate(dailyPrices) ?? latestDate(institutional) ?? latestDate(margin),
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
    nextSession: {
      focus: nextFocus.slice(0, 5),
      triggerRules,
    },
  };
}
