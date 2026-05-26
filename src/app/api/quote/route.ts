import { NextRequest, NextResponse } from "next/server";
import { formatTWSEQuote, safeFloat, type QuoteResult } from "@/lib/marketData";

export const runtime = "edge";
export const dynamic = "force-dynamic";

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

  return NextResponse.json(quote, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function fetchTWSE(symbol: string): Promise<QuoteResult | null> {
  try {
    // Try TSE (上市) first
    const exCh = `tse_${symbol}.tw`;
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.msgArray && data.msgArray.length > 0) {
        return formatTWSEQuote(data.msgArray[0], "TSE");
      }
    }

    // Try OTC (上櫃)
    const otcExCh = `otc_${symbol}.tw`;
    const otcUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${otcExCh}&json=1&delay=0`;
    const otcRes = await fetch(otcUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        Accept: "application/json",
      },
    });

    if (otcRes.ok) {
      const otcData = await otcRes.json();
      if (otcData.msgArray && otcData.msgArray.length > 0) {
        return formatTWSEQuote(otcData.msgArray[0], "OTC");
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchFinMind(symbol: string): Promise<QuoteResult | null> {
  try {
    // FinMind tick snapshot — separate endpoint from /data
    const FINMIND_TOKEN = process.env.FINMIND_TOKEN;
    if (!FINMIND_TOKEN) return null;

    const url = `https://api.finmindtrade.com/api/v4/taiwan_stock_tick_snapshot?data_id=${symbol}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${FINMIND_TOKEN}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;

    const s = data.data[0];
    const buyPrice = safeFloat(s.buy_price);
    const buyVolume = safeFloat(s.buy_volume);
    const sellPrice = safeFloat(s.sell_price);
    const sellVolume = safeFloat(s.sell_volume);
    return {
      symbol: s.stock_id || symbol,
      name: "",  // FinMind snapshot doesn't include name
      exchange: "TSE",
      price: safeFloat(s.close),
      change: safeFloat(s.change_price),
      changePercent: safeFloat(s.change_rate),
      open: safeFloat(s.open),
      high: safeFloat(s.high),
      low: safeFloat(s.low),
      volume: safeFloat(s.total_volume),
      previousClose: s.close ? safeFloat(s.close) - safeFloat(s.change_price) : 0,
      averagePrice: safeFloat(s.average_price) || undefined,
      volumeRatio: safeFloat(s.volume_ratio) || undefined,
      buyPrice: buyPrice || undefined,
      buyVolume: buyVolume || undefined,
      sellPrice: sellPrice || undefined,
      sellVolume: sellVolume || undefined,
      totalAmount: safeFloat(s.total_amount) || undefined,
      orderBook: buyPrice || sellPrice ? {
        bids: buyPrice ? [{ price: buyPrice, volume: buyVolume }] : [],
        asks: sellPrice ? [{ price: sellPrice, volume: sellVolume }] : [],
      } : undefined,
      updatedAt: s.date || new Date().toISOString(),
      source: "FinMind",
    };
  } catch {
    return null;
  }
}