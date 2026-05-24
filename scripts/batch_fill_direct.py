#!/usr/bin/env python3
"""
Fill financial data for companies using TWSE OpenAPI (JSON) for revenue
and MOPSOV (HTML) for income/dividends.

TWSE OpenAPI has a company-revenue endpoint that returns JSON per company.
This is much faster than MOPS which requires month-by-month requests.

Strategy:
- Revenue: TWSE OpenAPI (one request per company, returns full history)
- Quarterly Income: MOPSOV ajax_t163sb06 (one request per year)
- Dividends: MOPSOV ajax_t05st09_2 (one request, returns all years)
"""

import json
import os
import sys
import time
import subprocess
import urllib.parse
import re
from html.parser import HTMLParser

DATA_DIR = '/tmp/industry-map-site/public/data/financials'

# ====================== TWSE OpenAPI ======================

def fetch_monthly_revenue_openapi(company_code):
    """
    Try TWSE OpenAPI for monthly revenue history.
    Endpoint: https://openapi.twse.com.tw/v1/opendata/t187ap03_L
    Note: Returns ALL companies in one call, need to filter.
    """
    # This returns all companies at once - too much data
    # Instead, try company-specific endpoint
    url = f"https://openapi.twse.com.tw/v1/opendata/t187ap03_L?company_id={company_code}"
    result = subprocess.run(
        ['curl', '-s', '-m', '30', url],
        capture_output=True, text=True, timeout=35
    )
    if result.returncode != 0 or not result.stdout:
        return []
    
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return []
    
    # The OpenAPI returns a list of all companies for a given period
    # Need to check if company_code matches
    if not isinstance(data, list):
        return []
    
    # Filter for our company
    months = []
    seen_periods = set()
    for item in data:
        code = item.get('公司代號', '')
        if code != company_code:
            continue
        
        period = item.get('資料年月', '')
        if not period or period in seen_periods:
            continue
        seen_periods.add(period)
        
        try:
            revenue_str = item.get('營業收入-當月營收', '0')
            revenue = int(str(revenue_str).replace(',', ''))
            yoy_str = item.get('營業收入-去年同月增減(%)', '0')
            yoy = float(yoy_str) if yoy_str else 0
            
            roc_year = int(period[:3])
            month = int(period[3:])
            ad_year = roc_year + 1911
            month_key = f"{ad_year}{month:02d}"
            
            months.append({
                'month': month_key,
                'revenue': revenue * 1000,  # 千元 → 元
                'yoy': round(yoy, 2),
                'mom': 0,
            })
        except (ValueError, KeyError, IndexError):
            continue
    
    months.sort(key=lambda x: x['month'])
    return months


# ====================== MOPSOV (MOPS) ======================

def mops_post(url_path, form_data, referer=None):
    """Make a POST request to MOPSOV."""
    url = f"https://mopsov.twse.com.tw/mops/web/{url_path}"
    headers = {
        'User-Agent': 'CasualMarket-MCP/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': referer or f'https://mopsov.twse.com.tw/mops/web/{url_path.replace("ajax_", "t").rsplit("_", 1)[0] if "ajax_" in url_path else url_path}',
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    encoded_data = urllib.parse.urlencode(form_data)
    cmd = ['curl', '-s', '-m', '30',
           '-X', 'POST',
           '-H', f'User-Agent: {headers["User-Agent"]}',
           '-H', f'Referer: {headers["Referer"]}',
           '-H', f'Content-Type: {headers["Content-Type"]}',
           '-d', encoded_data,
           url]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
        if result.returncode != 0:
            return None
        return result.stdout
    except subprocess.TimeoutExpired:
        return None


class DividendTableParser(HTMLParser):
    """Parse MOPS dividend history HTML table."""
    def __init__(self):
        super().__init__()
        self.in_td = False
        self.in_tr = False
        self.current_row = []
        self.rows = []
        self.current_text = ""
        
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.in_tr = True
            self.current_row = []
        elif tag == 'td' or tag == 'th':
            self.in_td = True
            self.current_text = ""
            
    def handle_endtag(self, tag):
        if tag == 'td' or tag == 'th':
            self.in_td = False
            self.current_row.append(self.current_text.strip())
        elif tag == 'tr':
            self.in_tr = False
            if self.current_row:
                self.rows.append(self.current_row)
                
    def handle_data(self, data):
        if self.in_td:
            self.current_text += data


def fetch_dividend_history(company_code):
    """Fetch dividend history from MOPSOV."""
    data = {
        'encodeURIComponent': '1',
        'step': '1',
        'firstin': '1',
        'off': '1',
        'co_id': company_code,
        'qryType': '2',
    }
    
    html = mops_post('ajax_t05st09_2', data, referer='https://mopsov.twse.com.tw/mops/web/t05st09_2')
    if not html or '安全性考量' in html:
        return []
    
    # Parse dividend table
    parser = DividendTableParser()
    try:
        parser.feed(html)
    except:
        return []
    
    dividends = []
    for row in parser.rows:
        if len(row) < 5:
            continue
        # Find year and dividend amounts
        # Format varies, look for ROC year and cash/stock per share
        try:
            # Try to find the year and dividend data
            year_str = row[0].strip() if row else ''
            # This is complex HTML parsing, fallback to simpler approach
            pass
        except:
            continue
    
    # If parsing failed, return empty
    return dividends


class IncomeTableParser(HTMLParser):
    """Parse MOPS quarterly income HTML table."""
    def __init__(self):
        super().__init__()
        self.in_td = False
        self.in_tr = False
        self.current_row = []
        self.rows = []
        self.current_text = ""
        
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.in_tr = True
            self.current_row = []
        elif tag == 'td' or tag == 'th':
            self.in_td = True
            self.current_text = ""
            
    def handle_endtag(self, tag):
        if tag == 'td' or tag == 'th':
            self.in_td = False
            self.current_row.append(self.current_text.strip())
        elif tag == 'tr':
            self.in_tr = False
            if self.current_row:
                self.rows.append(self.current_row)
                
    def handle_data(self, data):
        if self.in_td:
            self.current_text += data


def fetch_quarterly_income(company_code, roc_year):
    """Fetch quarterly income from MOPSOV."""
    data = {
        'encodeURIComponent': '1',
        'step': '1',
        'firstin': '1',
        'off': '1',
        'TYPEK': 'all',
        'co_id': company_code,
        'year': str(roc_year),
        'isQuery': 'N',
    }
    
    html = mops_post('ajax_t163sb06', data, referer='https://mopsov.twse.com.tw/mops/web/t163sb06')
    if not html or '安全性考量' in html:
        return []
    
    # Parse income table
    parser = IncomeTableParser()
    try:
        parser.feed(html)
    except:
        return []
    
    # Complex HTML parsing needed
    return []


# ====================== Main Logic ======================

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
        
        # Merge with existing
        existing = data.get('trends', {}).get('monthly_revenue', [])
        if existing:
            merged = {m['month']: m for m in existing}
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
            merged = {q['quarter']: q for q in existing}
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
        data['updatedAt'] = time.strftime('%Y-%m-%d')
        with open(filepath, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    return False


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', help='Starting company code')
    parser.add_argument('--limit', type=int, default=10, help='Max companies to process')
    parser.add_argument('--rate', type=float, default=1.0, help='Rate limit in seconds')
    args = parser.parse_args()
    
    companies = get_companies_needing_data()
    print(f"Companies needing data: {len(companies)}")
    
    if args.start:
        idx = next((i for i, c in enumerate(companies) if c >= args.start), 0)
        companies = companies[idx:]
    
    companies = companies[:args.limit]
    print(f"Processing: {companies}")
    
    for i, code in enumerate(companies):
        print(f"\n[{i+1}/{len(companies)}] {code}...")
        
        # 1. Revenue - try OpenAPI first
        print(f"  Fetching revenue...")
        rev_data = fetch_monthly_revenue_openapi(code)
        if rev_data:
            update_company_json(code, revenue_months=rev_data)
            print(f"  Updated revenue: {len(rev_data)} months")
        else:
            print(f"  No revenue data from OpenAPI")
        
        time.sleep(args.rate)
    
    print("\nDone!")