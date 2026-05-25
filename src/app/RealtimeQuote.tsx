"use client";

import { useEffect, useState } from "react";

interface QuoteData {
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

export default function RealtimeQuote({ code }: { code: string }) {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/quote?symbol=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setQuote(null);
        } else {
          setQuote(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("載入失敗");
        setQuote(null);
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="h-8 w-24 bg-white/[0.05] rounded" />
        <div className="h-5 w-16 bg-white/[0.05] rounded" />
      </div>
    );
  }

  if (error || !quote) {
    return null;
  }

  const isUp = quote.change >= 0;
  const colorClass = isUp ? "text-rose-400" : "text-emerald-400";
  const arrow = isUp ? "▲" : "▼";
  const fmtVol = quote.volume >= 1000
    ? `${(quote.volume / 1000).toFixed(0)}張`
    : `${quote.volume}股`;
  const fmtAmt = quote.totalAmount
    ? quote.totalAmount >= 1e8
      ? `${(quote.totalAmount / 1e8).toFixed(1)}億`
      : quote.totalAmount >= 1e4
        ? `${(quote.totalAmount / 1e4).toFixed(0)}萬`
        : `${quote.totalAmount}`
    : null;

  return (
    <div className="space-y-1">
      {/* Main price line */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl font-bold text-white tabular-nums">
          {quote.price > 0 ? quote.price.toFixed(2) : "—"}
        </span>
        <span className={`text-sm font-semibold ${colorClass}`}>
          {arrow} {Math.abs(quote.change).toFixed(2)}
          {" "}
          ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
        </span>
        {quote.volume > 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)]">
            成交 {fmtVol}{fmtAmt ? ` / ${fmtAmt}` : ""}
          </span>
        )}
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {quote.exchange === "OTC" ? "櫃" : "市"} · {quote.source}
        </span>
      </div>

      {/* Detail row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-tertiary)]">
        {quote.open > 0 && <span>開 <b className="text-[var(--color-text-secondary)]">{quote.open.toFixed(2)}</b></span>}
        {quote.high > 0 && <span>高 <b className="text-[var(--color-text-secondary)]">{quote.high.toFixed(2)}</b></span>}
        {quote.low > 0 && <span>低 <b className="text-[var(--color-text-secondary)]">{quote.low.toFixed(2)}</b></span>}
        {quote.previousClose > 0 && <span>昨收 <b className="text-[var(--color-text-secondary)]">{quote.previousClose.toFixed(2)}</b></span>}
        {quote.averagePrice && quote.averagePrice > 0 && (
          <span>均 <b className="text-indigo-300">{quote.averagePrice.toFixed(2)}</b></span>
        )}
        {quote.volumeRatio && quote.volumeRatio > 0 && (
          <span>量比 <b className="text-indigo-300">{quote.volumeRatio.toFixed(2)}</b></span>
        )}
      </div>

      {/* Bid/Ask row (FinMind only) */}
      {(quote.buyPrice != null && quote.buyPrice > 0) && (
        <div className="flex gap-4 text-xs text-[var(--color-text-tertiary)]">
          <span>
            買 <b className="text-rose-300">{quote.buyPrice!.toFixed(2)}</b>
            <span className="ml-1 text-[var(--color-text-tertiary)]">×{(quote.buyVolume ?? 0).toLocaleString()}</span>
          </span>
          <span>
            賣 <b className="text-emerald-300">{quote.sellPrice!.toFixed(2)}</b>
            <span className="ml-1 text-[var(--color-text-tertiary)]">×{(quote.sellVolume ?? 0).toLocaleString()}</span>
          </span>
        </div>
      )}
    </div>
  );
}