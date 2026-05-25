#!/usr/bin/env python3
"""Update only companies with stale daily_prices. Writes output to log file."""
import json, subprocess, time, sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict

FINANCIALS_DIR = Path("/tmp/industry-map-site/public/data/financials")
TWSE_API = "https://www.twse.com.tw/exchangeReport/STOCK_DAY"
LOG_FILE = Path("/tmp/batch-stale-update.log")

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")
        f.flush()

def fetch_twse_monthly(symbol, year_month):
    url = f"{TWSE_API}?response=json&date={year_month}01&stockNo={symbol}"
    try:
        result = subprocess.run(["curl", "-s", url], capture_output=True, text=True, timeout=20)
        if result.returncode != 0:
            return []
        data = json.loads(result.stdout)
    except Exception as e:
        log(f"  fetch error for {symbol}: {e}")
        return []
    if data.get("stat") != "OK" or "data" not in data:
        return []
    
    rows = data.get("data", [])
    results = []
    for row in rows:
        try:
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
                try:
                    return float(s.replace(",", ""))
                except:
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
        except:
            continue
    return results

def main():
    LOG_FILE.unlink(missing_ok=True)
    
    cutoff = "2026-05-25"
    need_update = []
    for f in sorted(FINANCIALS_DIR.glob("*.json")):
        data = json.loads(f.read_text())
        dp = data.get("trends", {}).get("daily_prices", [])
        if dp and dp[-1].get("date") < cutoff:
            need_update.append(f.stem)

    log(f"Updating {len(need_update)} companies with stale data...")

    now = datetime.now()
    ym = now.strftime("%Y%m")
    updated = 0
    new_entries_total = 0

    for i, sym in enumerate(need_update):
        filepath = FINANCIALS_DIR / f"{sym}.json"
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if "trends" not in data:
            data["trends"] = {}
        if "daily_prices" not in data["trends"]:
            data["trends"]["daily_prices"] = []
        
        existing = data["trends"]["daily_prices"]
        existing_dates = {d.get("date") for d in existing}
        
        rows = fetch_twse_monthly(sym, ym)
        new_entries = 0
        for row in rows:
            if row["date"] not in existing_dates and row["close"] > 0:
                existing.append(row)
                existing_dates.add(row["date"])
                new_entries += 1
        
        existing.sort(key=lambda x: x.get("date", ""))
        data["trends"]["daily_prices"] = existing[-120:]
        
        # Recalculate monthly_price
        daily = data["trends"].get("daily_prices", [])
        if daily:
            monthly = defaultdict(lambda: {"closes": [], "volumes": [], "highs": [], "lows": []})
            for d in daily:
                ymk = d["date"][:7]
                monthly[ymk]["closes"].append(d["close"])
                monthly[ymk]["volumes"].append(d["volume"])
                monthly[ymk]["highs"].append(d["high"])
                monthly[ymk]["lows"].append(d["low"])
            mp_list = []
            for ymk in sorted(monthly.keys()):
                m = monthly[ymk]
                if m["closes"]:
                    mp_list.append({
                        "month": ymk.replace("-", "/"),
                        "high": max(m["highs"]),
                        "low": min(m["lows"]),
                        "avg": round(sum(m["closes"]) / len(m["closes"]), 2),
                        "volume": sum(m["volumes"]),
                    })
            data["trends"]["monthly_price"] = mp_list[-24:]
        
        data["updatedAt"] = now.strftime("%Y-%m-%d")
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        updated += 1
        new_entries_total += new_entries
        if (i+1) % 20 == 0:
            log(f"  [{i+1}/{len(need_update)}] +{new_entries_total} new entries so far")
        
        time.sleep(0.8)

    log(f"DONE! {updated} updated, {new_entries_total} new daily entries total")

if __name__ == "__main__":
    main()