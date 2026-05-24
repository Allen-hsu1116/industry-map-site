#!/usr/bin/env python3
"""Batch update financial data for companies using MCP tools.
Run this via Hermes cron or manually. Each company calls:
- monthly_revenue, quarterly_income, dividends, daily_prices, valuation, profile

Usage: python3 batch_financials.py [--codes 2330,2379,...] [--all-minimal] [--batch-size 20] [--delay 6]
"""

import json, os, sys, time, argparse

DATA_DIR = "/tmp/industry-map-site/public/data/financials"

def load_json(code: str) -> dict:
    path = os.path.join(DATA_DIR, f"{code}.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return None

def save_json(code: str, data: dict):
    path = os.path.join(DATA_DIR, f"{code}.json")
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_minimal_codes() -> list[str]:
    """Get list of company codes with minimal data."""
    codes = []
    for fname in os.listdir(DATA_DIR):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(DATA_DIR, fname), "r") as f:
            d = json.load(f)
        has_data = (
            d.get("trends", {}).get("daily_prices") or
            d.get("trends", {}).get("quarterly_income") or
            d.get("trends", {}).get("monthly_revenue")
        )
        if not has_data:
            codes.append(d.get("code", fname.replace(".json", "")))
    return sorted(codes)

def get_all_codes() -> list[str]:
    """Get all company codes."""
    codes = []
    for fname in os.listdir(DATA_DIR):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(DATA_DIR, fname), "r") as f:
            d = json.load(f)
        codes.append(d.get("code", fname.replace(".json", "")))
    return sorted(codes)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch update financial data")
    parser.add_argument("--codes", help="Comma-separated list of codes")
    parser.add_argument("--all-minimal", action="store_true", help="Process all minimal-data companies")
    parser.add_argument("--all", action="store_true", help="Process ALL companies")
    parser.add_argument("--batch-size", type=int, default=20, help="How many to process per batch")
    parser.add_argument("--delay", type=float, default=6, help="Seconds between API calls")
    args = parser.parse_args()

    if args.codes:
        codes = [c.strip() for c in args.codes.split(",")]
    elif args.all_minimal:
        codes = get_minimal_codes()
    elif args.all:
        codes = get_all_codes()
    else:
        print("Specify --codes, --all-minimal, or --all")
        sys.exit(1)

    print(f"Processing {len(codes)} companies: {codes[:10]}{'...' if len(codes) > 10 else ''}")
    
    # This script is a template - actual MCP calls need to be done via Hermes tools
    # Output the list for the Hermes agent to iterate
    print(f"\nCODES_FOR_AGENT={json.dumps(codes)}")