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
  updatedAt: string;
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

  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className="text-2xl font-bold text-white">
        {quote.price > 0 ? quote.price.toFixed(2) : "-"}
      </span>
      <span className={`text-sm font-medium ${colorClass}`}>
        {arrow} {Math.abs(quote.change).toFixed(2)}
        {" "}
        ({isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%)
      </span>
      {quote.volume > 0 && (
        <span className="text-xs text-[var(--color-text-tertiary)]">
          成交 {(quote.volume / 1000).toFixed(0)} 張
        </span>
      )}
      <span className="text-xs text-[var(--color-text-tertiary)]">
        {quote.exchange === "OTC" ? "櫃" : "市"} · 即時
      </span>
    </div>
  );
}