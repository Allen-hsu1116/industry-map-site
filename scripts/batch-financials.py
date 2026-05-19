#!/usr/bin/env python3
"""
batch-financials.py — 批次抓取台股每日OHLCV資料並更新JSON檔案
從 TWSE OpenAPI 抓取歷史月交易資料，為所有有 financials JSON 的公司
更新 trends.daily_prices 和 trends.monthly_price 陣列。

用法：
  python batch-financials.py [--all] [--top N] [--symbol CODE] [--months 3]
"""

import json
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from time import sleep

FINANCIALS_DIR = Path("/tmp/industry-map-site/public/data/financials")
TWSE_API = "https://www.twse.com.tw/exchangeReport/STOCK_DAY"

def fetch_twse_monthly(symbol: str, year_month: str) -> list:
    """抓取 TWSE 單月每日交易資料，year_month format: "202605" """
    url = f"{TWSE_API}?response=json&date={year_month}01&stockNo={symbol}"
    try:
        result = subprocess.run(
            ["curl", "-s", url],
            capture_output=True, text=True, timeout=20
        )
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
    except Exception:
        return []
    
    if data.get("stat") != "OK" or "data" not in data:
        return []
    
    rows = data.get("data", [])
    results = []
    
    for row in rows:
        try:
            # row[0] = "115/05/19" (ROC date)
            date_str = row[0]
            parts = date_str.split("/")
            if len(parts) == 3:
                ad_year = int(parts[0]) + 1911
                ad_month = int(parts[1])
                ad_day = int(parts[2])
                iso_date = f"{ad_year}-{ad_month:02d}-{ad_day:02d}"
            else:
                continue
            
            def parse_num(s):
                """Parse number string with commas"""
                try:
                    return float(s.replace(",", ""))
                except (ValueError, AttributeError):
                    return 0
            
            close_price = parse_num(row[6])
            if close_price <= 0:
                continue
            
            results.append({
                "date": iso_date,
                "open": parse_num(row[3]),
                "high": parse_num(row[4]),
                "low": parse_num(row[5]),
                "close": close_price,
                "volume": int(parse_num(row[1])),
            })
        except (IndexError, ValueError):
            continue
    
    return results

def update_company(symbol: str, months: int = 3) -> bool:
    """更新單一公司的金融資料"""
    filepath = FINANCIALS_DIR / f"{symbol}.json"
    if not filepath.exists():
        print(f"  ⏭️ {symbol}: no JSON file")
        return False
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if "trends" not in data:
        data["trends"] = {}
    if "daily_prices" not in data["trends"]:
        data["trends"]["daily_prices"] = []
    
    existing = data["trends"]["daily_prices"]
    existing_dates = {d.get("date") for d in existing}
    
    now = datetime.now()
    new_entries = 0
    
    for i in range(months):
        # Go back i months
        if i == 0:
            ym = now.strftime("%Y%m")
        else:
            # Simple month subtraction
            year = now.year
            month = now.month - i
            while month <= 0:
                month += 12
                year -= 1
            ym = f"{year}{month:02d}"
        
        rows = fetch_twse_monthly(symbol, ym)
        for row in rows:
            if row["date"] not in existing_dates and row["close"] > 0:
                existing.append(row)
                existing_dates.add(row["date"])
                new_entries += 1
        
        sleep(0.8)  # Rate limit for TWSE API
    
    # Sort by date, keep last 120 entries
    existing.sort(key=lambda x: x.get("date", ""))
    data["trends"]["daily_prices"] = existing[-120:]
    
    # Recalculate monthly_price from daily_prices
    update_monthly_summary(data)
    
    data["updatedAt"] = now.strftime("%Y-%m-%d")
    
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ {symbol}: +{new_entries} daily entries, total {len(data['trends']['daily_prices'])}")
    return True

def update_monthly_summary(data: dict):
    """從 daily_prices 重新計算 monthly_price 統計"""
    daily = data["trends"].get("daily_prices", [])
    if not daily:
        return
    
    monthly = defaultdict(lambda: {"closes": [], "volumes": [], "highs": [], "lows": []})
    
    for d in daily:
        ym = d["date"][:7]  # "2026-05"
        monthly[ym]["closes"].append(d["close"])
        monthly[ym]["volumes"].append(d["volume"])
        monthly[ym]["highs"].append(d["high"])
        monthly[ym]["lows"].append(d["low"])
    
    mp_list = []
    for ym in sorted(monthly.keys()):
        m = monthly[ym]
        if m["closes"]:
            mp_list.append({
                "month": ym.replace("-", "/"),
                "high": max(m["highs"]),
                "low": min(m["lows"]),
                "avg": round(sum(m["closes"]) / len(m["closes"]), 2),
                "volume": sum(m["volumes"]),
            })
    
    data["trends"]["monthly_price"] = mp_list[-24:]

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Process all companies")
    parser.add_argument("--top", type=int, default=50, help="Process top N companies")
    parser.add_argument("--symbol", type=str, help="Process specific symbol only")
    parser.add_argument("--months", type=int, default=3, help="Fetch last N months (default 3)")
    args = parser.parse_args()
    
    if args.symbol:
        symbols = [args.symbol]
    else:
        symbols = sorted([f.stem for f in FINANCIALS_DIR.glob("*.json")])
        if not args.all:
            symbols = symbols[:args.top]
    
    print(f"📊 Updating daily OHLCV data for {len(symbols)} companies ({args.months} months back)...")
    
    success = 0
    fail = 0
    for i, sym in enumerate(symbols):
        print(f"[{i+1}/{len(symbols)}] {sym}...")
        try:
            if update_company(sym, args.months):
                success += 1
            else:
                fail += 1
        except Exception as e:
            print(f"  ❌ {sym}: {e}")
            fail += 1
    
    print(f"\n✨ Done! {success} updated, {fail} skipped/failed out of {len(symbols)}")

if __name__ == "__main__":
    main()