#!/usr/bin/env python3
"""
批量建立公司 financials JSON
使用 hermes_tools 呼叫 MCP 工具取得歷史日K資料

用法：
  python3 scripts/batch-init-financials.py [--top 50] [--months 3]
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
FINANCIALS_DIR = BASE_DIR / "public" / "data" / "financials"
COMPANIES_FILE = BASE_DIR / "public" / "data" / "companies.json"

# Months to fetch history
DEFAULT_MONTHS = 3


def get_month_params(months: int) -> list[str]:
    """Generate YYYYMMDD params for the last N months"""
    now = datetime.now()
    params = []
    for i in range(months):
        # Go back i months
        if i == 0:
            d = now
        else:
            d = now - timedelta(days=i * 30)
        params.append(d.strftime("%Y%m01"))
    return params


def create_empty_financials(symbol: str, name: str, daily_prices: list) -> dict:
    """Create a minimal financials JSON structure"""
    # Calculate monthly price from daily prices
    monthly_prices = []
    current_month = None
    month_data = {}

    for dp in daily_prices:
        month_key = dp["date"][:7]  # YYYY-MM
        if month_key != current_month:
            if current_month and month_data:
                monthly_prices.append({
                    "month": current_month,
                    "open": month_data["first_open"],
                    "close": month_data["last_close"],
                    "high": month_data["high"],
                    "low": month_data["low"],
                    "average": round(month_data["total_close"] / month_data["count"], 2),
                    "volume": month_data["total_volume"],
                })
            current_month = month_key
            month_data = {
                "first_open": dp["open"],
                "last_close": dp["close"],
                "high": dp["high"],
                "low": dp["low"],
                "total_close": dp["close"],
                "total_volume": dp["volume"],
                "count": 1,
            }
        else:
            month_data["last_close"] = dp["close"]
            month_data["high"] = max(month_data["high"], dp["high"])
            month_data["low"] = min(month_data["low"], dp["low"])
            month_data["total_close"] += dp["close"]
            month_data["total_volume"] += dp["volume"]
            month_data["count"] += 1

    # Don't forget last month
    if current_month and month_data:
        monthly_prices.append({
            "month": current_month,
            "open": month_data["first_open"],
            "close": month_data["last_close"],
            "high": month_data["high"],
            "low": month_data["low"],
            "average": round(month_data["total_close"] / month_data["count"], 2),
            "volume": month_data["total_volume"],
        })

    return {
        "symbol": symbol,
        "name": name,
        "trends": {
            "daily_prices": daily_prices,
            "monthly_price": monthly_prices,
        },
        "last_updated": datetime.now().strftime("%Y-%m-%d"),
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Batch initialize financials JSON")
    parser.add_argument("--top", type=int, default=50, help="Top N companies by topic_count")
    parser.add_argument("--months", type=int, default=DEFAULT_MONTHS, help="Months of history to fetch")
    parser.add_argument("--dry-run", action="store_true", help="Only show what would be done")
    args = parser.parse_args()

    # Load companies
    with open(COMPANIES_FILE) as f:
        companies = json.load(f)

    companies_sorted = sorted(companies, key=lambda c: c["topic_count"], reverse=True)
    targets = companies_sorted[:args.top]

    # Check existing
    existing = set()
    if FINANCIALS_DIR.exists():
        existing = {f.replace(".json", "") for f in os.listdir(FINANCIALS_DIR) if f.endswith(".json")}

    print(f"Total targets: {len(targets)}")
    print(f"Already exist: {len(existing & {c['code'] for c in targets})}")
    print(f"Need to create: {len([c for c in targets if c['code'] not in existing])}")

    # Generate month params
    month_params = get_month_params(args.months)
    print(f"Month params: {month_params}")

    # For each target that doesn't have financials yet, output the symbol and name
    # The actual MCP calls will be done by the hermes agent
    to_create = [c for c in targets if c["code"] not in existing]

    print(f"\nCompanies to create financials for ({len(to_create)}):")
    for c in to_create:
        print(f"  {c['code']} {c['name']} (topics: {c['topic_count']})")

    if args.dry_run:
        print("\nDry run mode. Exiting.")
        return

    # Output JSON for batch processing
    output = []
    for c in to_create:
        output.append({
            "symbol": c["code"],
            "name": c["name"],
            "months": month_params,
        })

    print(f"\n--- JSON for batch processing ---")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()