#!/usr/bin/env python3
"""Build financials JSON files from collected MCP data."""
import json
import os
import sys

OUTPUT_DIR = "/tmp/industry-map-site/public/data/financials"

# Company info mapping
COMPANIES = {
    "2308": {"name": "台達電", "exchange": "TWSE"},
    "2383": {"name": "台光電", "exchange": "TWSE"},
    "3189": {"name": "景碩", "exchange": "TWSE"},
    "4966": {"name": "譜瑞-KY", "exchange": "TWSE"},
    "3231": {"name": "緯創", "exchange": "TWSE"},
    "3711": {"name": "日月光投控", "exchange": "TWSE"},
    "2337": {"name": "旺宏", "exchange": "TWSE"},
    "2376": {"name": "技嘉", "exchange": "TWSE"},
    "3034": {"name": "聯詠", "exchange": "TWSE"},
    "2368": {"name": "金像電", "exchange": "TWSE"},
    "2408": {"name": "南亞塑膠", "exchange": "TWSE"},
    "2454": {"name": "聯發科", "exchange": "TWSE"},
    "3035": {"name": "智原", "exchange": "TWSE"},
    "3311": {"name": "閎暉", "exchange": "TWSE"},
    "2453": {"name": "凌群", "exchange": "TWSE"},
    "3081": {"name": "聯亞", "exchange": "TWSE"},
    "2059": {"name": "川湖", "exchange": "TWSE"},
    "3443": {"name": "創意", "exchange": "TWSE"},
    "3529": {"name": "力旺", "exchange": "TWSE"},
    "6147": {"name": "頎邦", "exchange": "OTC"},
    "3017": {"name": "奇鋐", "exchange": "OTC"},
    "6239": {"name": "力成", "exchange": "OTC"},
    "8299": {"name": "群聯", "exchange": "OTC"},
    "6153": {"name": "嘉聯益", "exchange": "OTC"},
    "3264": {"name": "欣銓", "exchange": "OTC"},
    "5274": {"name": "信驊", "exchange": "OTC"},
    "6173": {"name": "信昌電", "exchange": "OTC"},
    "6175": {"name": "立敦", "exchange": "OTC"},
    "6261": {"name": "久元", "exchange": "OTC"},
}

# Data storage - will be populated from MCP results
all_data = {}

def compute_monthly_price(daily_prices):
    """Compute monthly price stats from daily prices grouped by month."""
    months = {}
    for dp in daily_prices:
        # date format: "2026-03-02" -> "2026/03"
        month_key = dp["date"][:7].replace("-", "/")
        if month_key not in months:
            months[month_key] = {"high": float('-inf'), "low": float('inf'), "closes": [], "volumes": []}
        m = months[month_key]
        m["high"] = max(m["high"], dp["high"])
        m["low"] = min(m["low"], dp["low"])
        m["closes"].append(dp["close"])
        m["volumes"].append(dp["volume"])
    
    result = []
    for month_key in sorted(months.keys()):
        m = months[month_key]
        avg = round(sum(m["closes"]) / len(m["closes"]), 2)
        total_vol = sum(m["volumes"])
        result.append({
            "month": month_key,
            "high": m["high"],
            "low": m["low"],
            "avg": avg,
            "volume": total_vol
        })
    return result

def build_json(symbol, name, daily_prices_list):
    """Build the financials JSON for a company."""
    monthly_price = compute_monthly_price(daily_prices_list)
    
    data = {
        "code": symbol,
        "name": name,
        "trends": {
            "monthly_price": monthly_price,
            "daily_prices": daily_prices_list
        }
    }
    return data

def save_json(symbol, data):
    """Save JSON to file."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, f"{symbol}.json")
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✅ Saved {filepath}")

if __name__ == "__main__":
    # This script is called with collected data files
    # The actual data processing happens in the main agent loop
    print("Use this module functions from the main processing script")