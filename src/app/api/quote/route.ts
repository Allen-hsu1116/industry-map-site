import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    // TWSE Real-Time API (mis.twse.com.tw) - most reliable for TW stocks
    const exCh = `tse_${symbol}.tw`;
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `TWSE API returned ${res.status}` }, { status: 502 });
    }

    const data = await res.json();

    if (!data.msgArray || data.msgArray.length === 0) {
      // Try OTC for stocks not on TSE
      const otcExCh = `otc_${symbol}.tw`;
      const otcUrl = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${otcExCh}&json=1&delay=0`;
      const otcRes = await fetch(otcUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "Accept": "application/json",
        },
      });

      if (!otcRes.ok) {
        return NextResponse.json({ error: "Stock not found" }, { status: 404 });
      }

      const otcData = await otcRes.json();
      if (!otcData.msgArray || otcData.msgArray.length === 0) {
        return NextResponse.json({ error: "Stock not found" }, { status: 404 });
      }

      const info = otcData.msgArray[0];
      return NextResponse.json(formatQuote(info, "OTC"));
    }

    const info = data.msgArray[0];
    return NextResponse.json(formatQuote(info, "TSE"));
  } catch (err) {
    console.error("Quote API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function formatQuote(info: Record<string, string>, exchange: string) {
  const price = parseFloat(info.z) || 0;           // 最新成交價
  const change = parseFloat(info.u) || 0;           // 漲跌
  const changePct = parseFloat(info.w) || 0;       // 漲跌幅%
  const open = parseFloat(info.o) || 0;             // 開盤
  const high = parseFloat(info.h) || 0;             // 最高
  const low = parseFloat(info.l) || 0;             // 最低
  const volume = parseInt(info.v) || 0;              // 成交量（股）
  const ydPrice = parseFloat(info.y) || 0;          // 昨收

  return {
    symbol: info.c || "",
    name: info.n || "",
    exchange,
    price: price > 0 ? price : ydPrice,
    change,
    changePercent: changePct,
    open,
    high,
    low,
    volume,
    previousClose: ydPrice,
    updatedAt: info.t || new Date().toISOString(),
  };
}