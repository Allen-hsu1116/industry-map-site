import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface QuoteResult {
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
  updatedAt: string;
  source: string;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  // Strategy: Try TWSE mis API first (faster, no token), then FinMind as fallback
  let quote: QuoteResult | null = null;

  // 1. Try TWSE mis API
  quote = await fetchTWSE(symbol);

  // 2. If TWSE failed, try FinMind tick snapshot
  if (!quote) {
    quote = await fetchFinMind(symbol);
  }

  if (!quote) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
}

async function fetchTWSE(symbol: string): Promise<QuoteResult | null> {
  try {
    // Try TSE (上市) first
    const exCh = `tse_${symbol}.tw`;
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.msgArray && data.msgArray.length > 0) {
        return formatTWSE(data.msgArray[0], "TSE");
      }
    }

    // Try OTC (上櫃)
    const otcExCh = `otc_${symbol}.tw`;
    const otcUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${otcExCh}&json=1&delay=0`;
    const otcRes = await fetch(otcUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "application/json",
      },
    });

    if (otcRes.ok) {
      const otcData = await otcRes.json();
      if (otcData.msgArray && otcData.msgArray.length > 0) {
        return formatTWSE(otcData.msgArray[0], "OTC");
      }
    }

    return null;
  } catch {
    return null;
  }
}

function safeFloat(v: string | undefined | null, fallback: number = 0): number {
  if (!v || v === "-" || v === "") return fallback;
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function safeInt(v: string | undefined | null, fallback: number = 0): number {
  if (!v || v === "-" || v === "") return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

function formatTWSE(info: Record<string, string>, exchange: string): QuoteResult {
  const price = safeFloat(info.z);            // 最新成交價
  const ydPrice = safeFloat(info.y);          // 昨收
  const finalPrice = price > 0 ? price : ydPrice;

  // TWSE mis API fields:
  // z = 最新成交價, y = 昨收, u = 漲停價, w = 跌停價
  // o = 開盤, h = 最高, l = 最低, v = 累計成交量(股)
  // a~f = 五檔買價, b~g = 五檔賣價
  // tv = 累計成交量(張), tval = 累計成交金額
  // For change/changePercent: calculate from price vs ydPrice
  const change = finalPrice > 0 && ydPrice > 0 ? finalPrice - ydPrice : 0;
  const changePercent = ydPrice > 0 ? (change / ydPrice) * 100 : 0;

  const open = safeFloat(info.o);
  const high = safeFloat(info.h);
  const low = safeFloat(info.l);
  const volume = safeInt(info.v);

  // 5-level bid/ask (first level only)
  const buyPrice = safeFloat(info.a);
  const buyVolume = safeInt(info.f);
  const sellPrice = safeFloat(info.b);
  const sellVolume = safeInt(info.c);  // TWSE uses 'c' for first ask volume... actually 'g' is for ask volume

  // Try to get better volume from tv (in 張) or v (in 股)
  const volumeInShares = volume > 0 ? volume : safeInt(info.tv) * 1000;

  return {
    symbol: info.c || "",
    name: info.n || "",
    exchange,
    price: finalPrice,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    open,
    high,
    low,
    volume: volumeInShares,
    previousClose: ydPrice,
    buyPrice: buyPrice > 0 ? buyPrice : undefined,
    buyVolume: buyVolume > 0 ? buyVolume : undefined,
    sellPrice: sellPrice > 0 ? sellPrice : undefined,
    sellVolume: undefined, // TWSE doesn't have clean single-level ask volume
    updatedAt: `${info.d || ""} ${info.t || info["%"] || ""}`.trim() || new Date().toISOString(),
    source: "TWSE",
  };
}

async function fetchFinMind(symbol: string): Promise<QuoteResult | null> {
  try {
    // FinMind tick snapshot — separate endpoint from /data
    const FINMIND_TOKEN = process.env.FINMIND_TOKEN;
    if (!FINMIND_TOKEN) return null;

    const url = `https://api.finmindtrade.com/api/v4/taiwan_stock_tick_snapshot?data_id=${symbol}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${FINMIND_TOKEN}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const s = data.data[0];
    return {
      symbol: s.stock_id || symbol,
      name: "",  // FinMind snapshot doesn't include name
      exchange: "TSE",
      price: s.close || 0,
      change: s.change_price || 0,
      changePercent: s.change_rate || 0,
      open: s.open || 0,
      high: s.high || 0,
      low: s.low || 0,
      volume: s.total_volume || 0,
      previousClose: s.close ? s.close - s.change_price : 0,
      averagePrice: s.average_price || undefined,
      volumeRatio: s.volume_ratio || undefined,
      buyPrice: s.buy_price || undefined,
      buyVolume: s.buy_volume || undefined,
      sellPrice: s.sell_price || undefined,
      sellVolume: s.sell_volume || undefined,
      totalAmount: s.total_amount || undefined,
      updatedAt: s.date || new Date().toISOString(),
      source: "FinMind",
    };
  } catch {
    return null;
  }
}