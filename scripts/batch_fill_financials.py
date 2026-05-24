#!/usr/bin/env python3
"""
Batch fill financial data for all companies missing data.
Uses TWSE OpenAPI and MOPS directly (same sources as MCP).

Data to fill per company:
1. monthly_revenue (3+ years) → TWSE OpenAPI
2. quarterly_income (2+ years) → MOPS ajax_t163sb06
3. dividendHistory → MOPS t05st09_2

Output: updates JSON files in /tmp/industry-map-site/public/data/financials/
"""

import json
import os
import sys
import time
import subprocess
import urllib.request
import urllib.parse

DATA_DIR = '/tmp/industry-map-site/public/data/financials'
RATE_LIMIT = 1.0  # seconds between API calls

# Current ROC year/month
CURRENT_ROC_YEAR = 115  # 2026

def api_call(url, timeout=30):
    """Make an API call using curl (avoiding Python 3.14 urllib SSL issues)."""
    try:
        result = subprocess.run(
            ['curl', '-s', '-m', str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 10
        )
        if result.returncode != 0:
            return None
        return result.stdout
    except Exception as e:
        print(f"  curl error: {e}")
        return None

def json_api_call(url, timeout=30):
    """Make an API call and parse JSON response."""
    data = api_call(url, timeout)
    if not data:
        return None
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return None

def fetch_monthly_revenue(company_code, years_back=3):
    """Fetch monthly revenue from TWSE OpenAPI."""
    all_months = []
    
    for roc_year in range(CURRENT_ROC_YEAR - years_back, CURRENT_ROC_YEAR + 1):
        url = f"https://openapi.twse.com.tw/v1/opendata/t187ap03_L?company_id={company_code}&year={roc_year}"
        data = json_api_call(url)
        if not data or not isinstance(data, list) or len(data) == 0:
            # Try alternate endpoint
            url2 = f"https://openapi.twse.com.tw/v1/opendata/t187ap03_L?year={roc_year}"
            # Skip if no data for this year
            continue
        
        for item in data:
            try:
                month_str = str(item.get('營業收入-當月營收', ''))
                if not month_str:
                    continue
                revenue = int(month_str.replace(',', '')) if isinstance(month_str, str) else int(month_str)
                
                period = str(item.get('資料年月', ''))
                if not period:
                    continue
                
                yoy_str = item.get('營業收入-去年同月增減(%)', '0')
                yoy = float(yoy_str) if yoy_str else 0
                
                # Convert ROC period to AD month format
                roc_yr = int(period[:3])
                mn = int(period[3:])
                ad_year = roc_yr + 1911
                month_key = f"{ad_year}{mn:02d}"
                
                all_months.append({
                    'month': month_key,
                    'revenue': revenue * 1000,  # 千元 → 元
                    'yoy': round(yoy, 2),
                    'mom': 0,  # Calculate later
                })
            except (ValueError, KeyError, IndexError) as e:
                continue
        
        time.sleep(RATE_LIMIT)
    
    return all_months

def fetch_revenue_history_mops(company_code, roc_year):
    """Fetch monthly revenue from MOPS ajax_t05st10_ifrs endpoint."""
    params = {
        'encodeURIComponent': '1',
        'step': '1',
        'firstin': '1',
        'off': '1',
        'isQuery': 'N',
        'TYPEK': 'all',
        'co_id': company_code,
        'year': str(roc_year),
        'month': '',
    }
    url = 'https://mops.twse.com.tw/mops/web/ajax_t05st10_ifrs?' + urllib.parse.urlencode(params)
    # This endpoint returns HTML, need to parse it
    # Use the OpenAPI approach instead
    return None

def fetch_quarterly_income(company_code, year_back=2):
    """Fetch quarterly income from MOPS ajax_t163sb06 endpoint."""
    all_quarters = []
    
    for roc_year in range(CURRENT_ROC_YEAR - year_back, CURRENT_ROC_YEAR):
        url = f"https://mops.twse.com.tw/mops/web/ajax_t163sb06"
        params = {
            'encodeURIComponent': '1',
            'step': '1',
            'firstin': '1',
            'off': '1',
            'TYPEK': 'all',
            'co_id': company_code,
            'year': str(roc_year),
            'isQuery': 'N',
        }
        full_url = url + '?' + urllib.parse.urlencode(params)
        
        html = api_call(full_url)
        if not html:
            time.sleep(RATE_LIMIT)
            continue
        
        # Parse HTML for quarterly data
        # This is complex - MOPS returns HTML tables
        # For now, skip and use a simpler approach
        time.sleep(RATE_LIMIT)
    
    return all_quarters

def fetch_dividend_history(company_code):
    """Fetch dividend history from MOPS t05st09_2 endpoint."""
    url = 'https://mops.twse.com.tw/mops/web/ajax_t05st09_2'
    params = {
        'encodeURIComponent': '1',
        'step': '1',
        'firstin': '1',
        'off': '1',
        'co_id': company_code,
        'qryType': '2',
    }
    full_url = url + '?' + urllib.parse.urlencode(params)
    
    html = api_call(full_url)
    if not html:
        return []
    
    # Parse HTML for dividend data
    # This is complex - need to parse MOPS HTML tables
    return []

def get_companies_needing_data():
    """Get list of company codes that need financial data."""
    need_data = []
    for fname in sorted(os.listdir(DATA_DIR)):
        if not fname.endswith('.json'):
            continue
        fpath = os.path.join(DATA_DIR, fname)
        try:
            with open(fpath, 'r') as f:
                d = json.load(f)
            code = d.get('code', fname.replace('.json', ''))
            has_mr = bool(d.get('trends', {}).get('monthly_revenue'))
            has_qi = bool(d.get('trends', {}).get('quarterly_income'))
            dhl = d.get('dividendHistory', [])
            has_real_dh = False
            if dhl:
                for item in dhl:
                    if item.get('cashDividend', 0) > 0 or item.get('stockDividend', 0) > 0:
                        has_real_dh = True
                        break
            
            if not (has_mr and has_qi and has_real_dh):
                need_data.append(code)
        except:
            pass
    
    return need_data

def update_company_json(code, revenue_months=None, quarterly_data=None, dividend_data=None):
    """Update a company JSON file with new financial data."""
    filepath = os.path.join(DATA_DIR, f'{code}.json')
    if not os.path.exists(filepath):
        return False
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    changed = False
    
    if revenue_months:
        # Calculate MoM
        for i, item in enumerate(revenue_months):
            if i > 0 and revenue_months[i-1]['revenue'] > 0:
                prev = revenue_months[i-1]['revenue']
                item['mom'] = round((item['revenue'] - prev) / prev * 100, 2)
            elif i == 0:
                item['mom'] = 0
        
        # Merge with existing data
        existing = data.get('trends', {}).get('monthly_revenue', [])
        if existing:
            merged = {}
            for m in existing:
                merged[m['month']] = m
            for m in revenue_months:
                merged[m['month']] = m
            revenue_months = sorted(merged.values(), key=lambda x: x['month'])
        
        data['trends'] = data.get('trends', {})
        data['trends']['monthly_revenue'] = revenue_months
        latest = revenue_months[-1]
        data['monthly_revenue'] = {
            'month': latest['month'],
            'revenue': latest['revenue'],
            'mom': latest.get('mom'),
            'yoy': latest.get('yoy'),
        }
        changed = True
    
    if quarterly_data:
        existing = data.get('trends', {}).get('quarterly_income', [])
        if existing:
            merged = {}
            for q in existing:
                merged[q['quarter']] = q
            for q in quarterly_data:
                merged[q['quarter']] = q
            quarterly_data = sorted(merged.values(), key=lambda x: x['quarter'])
        
        data['trends'] = data.get('trends', {})
        data['trends']['quarterly_income'] = quarterly_data
        latest = quarterly_data[-1]
        data['income'] = {
            'revenue': latest['revenue'],
            'grossProfit': latest['grossProfit'],
            'operatingIncome': latest['operatingIncome'],
            'netIncome': latest['netIncome'],
            'eps': latest['eps'],
            'operatingMargin': latest['operatingMargin'],
        }
        changed = True
    
    if dividend_data:
        # Sort newest first
        dividend_data.sort(key=lambda x: x['year'], reverse=True)
        data['dividendHistory'] = dividend_data
        latest = dividend_data[0]
        data['dividend'] = {
            'cashYield': latest['cashDividend'],
            'stockDividend': latest['stockDividend'],
            'totalDividend': latest['totalDividend'],
        }
        changed = True
    
    if changed:
        data['updatedAt'] = '2026-05-25'
        with open(filepath, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    
    return False

# MAIN
if __name__ == '__main__':
    print("Starting batch financial data fill...")
    print(f"Data directory: {DATA_DIR}")
    
    companies = get_companies_needing_data()
    print(f"Companies needing data: {len(companies)}")
    
    # Process in batches
    completed = 0
    failed = 0
    
    for i, code in enumerate(companies):
        print(f"\n[{i+1}/{len(companies)}] Processing {code}...")
        
        # For now, just use the update function with data from MCP
        # The actual API calls will be done via the MCP tool
        # This script is the format converter
        
        time.sleep(RATE_LIMIT)
    
    print(f"\nDone! Completed: {completed}, Failed: {failed}")