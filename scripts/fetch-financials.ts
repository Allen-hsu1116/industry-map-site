/**
 * fetch-financials.ts
 * 
 * Script to fetch financial data for top companies.
 *
 * Preferred source order:
 *   1. FinMind API datasets for bulk historical market/fundamental data
 *      (price, institutional, margin, PER/PBR/yield, revenue, financial statements).
 *   2. CasualMarket MCP tools as a Hermes-native wrapper when running inside the agent.
 *   3. MOPS/TWSE/TPEX official endpoints for company profile, filings, and major news.
 *
 * Save static JSON files for the industry-map-site.
 * 
 * Usage:
 *   npx tsx scripts/fetch-financials.ts [--top N] [--output-dir DIR]
 * 
 * This script is designed to be run via a cron job (daily-stock-analysis) or manually.
 * It reads companies.json, sorts by topic_count, and fetches financial data for the
 * top N companies, saving individual JSON files to public/data/financials/.
 * 
 * NOTE: This script requires MCP tool access (CasualMarket) to fetch data.
 * When running as a standalone script outside of the Hermes agent context,
 * you would need to implement HTTP calls to the MCP server or use the MCP SDK.
 * The structure below shows the intended flow and data format.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Configuration ───
const DEFAULT_TOP_N = 50;
const DEFAULT_OUTPUT_DIR = 'public/data/financials';
const COMPANIES_JSON_PATH = 'public/data/companies.json';

// ─── Types ───
interface CompanyData {
  code: string;
  name: string;
  topic_count: number;
  topics: string[];
}

interface FinancialData {
  code: string;
  name: string;
  profile: {
    industry: string;
    chairman: string;
    established: string;
    listed: string;
    capital: string;
    website: string;
  };
  valuation: {
    date: string;
    pe: string;
    pb: string;
    dividendYield: string;
  };
  price: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  income: {
    revenue: string;
    grossProfit: string;
    operatingIncome: string;
    netIncome: string;
    eps: string;
  };
  monthly_revenue: {
    month: string;
    revenue: string;
    mom: string;
    yoy: string;
  };
  balance: {
    totalAssets: string;
    totalLiabilities: string;
    equity: string;
    bookValuePerShare: string;
  };
  dividend: {
    year: string;
    cashDividendPerShare: string;
  };
  updatedAt: string;
}

// ─── Parse CLI args ───
function parseArgs(): { topN: number; outputDir: string } {
  const args = process.argv.slice(2);
  let topN = DEFAULT_TOP_N;
  let outputDir = DEFAULT_OUTPUT_DIR;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--top' && args[i + 1]) {
      topN = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    }
  }
  return { topN, outputDir };
}

// ─── Number formatting helpers ───
// These mirror the helpers in the frontend for reference
function formatRevenue(thousands: string): string {
  const num = parseFloat(thousands);
  if (isNaN(num)) return '-';
  if (num >= 100000) return `${(num / 100000).toFixed(0)}億`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}億`;
  return `${(num / 1000).toFixed(0)}百萬`;
}

function formatCapital(ntd: string): string {
  const num = parseFloat(ntd);
  if (isNaN(num)) return '-';
  if (num >= 1e11) return `${(num / 1e11).toFixed(1)}百億`;
  if (num >= 1e10) return `${(num / 1e10).toFixed(1)}十億`;
  if (num >= 1e8) return `${(num / 1e8).toFixed(2)}億`;
  return `${num.toLocaleString()}`;
}

// ─── MCP Data Mapping Functions ───
// These functions map the raw MCP tool responses to our FinancialData format.
// When running inside Hermes agent, the MCP tools are called directly.
// For standalone execution, you'd need to make HTTP calls to a proxy.

function mapProfileData(raw: Record<string, string>): FinancialData['profile'] {
  return {
    industry: raw['產業別'] || raw['industry'] || '',
    chairman: raw['董事長'] || raw['chairman'] || '',
    established: raw['成立日期'] || raw['established'] || '',
    listed: raw['上市日期'] || raw['listed'] || '',
    capital: (raw['實收資本額'] || raw['capital'] || '').replace(/\s/g, ''),
    website: raw['網址'] || raw['website'] || '',
  };
}

function mapValuationData(raw: Record<string, string>): FinancialData['valuation'] {
  return {
    date: raw['Date'] || raw['date'] || '',
    pe: raw['PEratio'] || raw['pe'] || '',
    pb: raw['PBratio'] || raw['pb'] || '',
    dividendYield: raw['DividendYield'] || raw['dividendYield'] || '',
  };
}

function mapPriceData(raw: Record<string, string | number>): FinancialData['price'] {
  return {
    date: String(raw['last_update'] || raw['date'] || '').split('T')[0],
    open: Number(raw['open'] || raw['open_price'] || 0),
    high: Number(raw['high'] || 0),
    low: Number(raw['low'] || 0),
    close: Number(raw['current_price'] || raw['close'] || 0),
    volume: Number(raw['volume'] || 0),
  };
}

function mapIncomeData(raw: Record<string, string>): FinancialData['income'] {
  return {
    revenue: (raw['營業收入'] || raw['revenue'] || '').replace(/\.00$/, ''),
    grossProfit: (raw['營業毛利（毛損）'] || raw['grossProfit'] || '').replace(/\.00$/, ''),
    operatingIncome: (raw['營業利益（損失）'] || raw['operatingIncome'] || '').replace(/\.00$/, ''),
    netIncome: (raw['本期淨利（淨損）'] || raw['netIncome'] || '').replace(/\.00$/, ''),
    eps: raw['基本每股盈餘（元）'] || raw['eps'] || '',
  };
}

function mapMonthlyRevenueData(raw: Record<string, string>): FinancialData['monthly_revenue'] {
  const momRaw = parseFloat(raw['營業收入-上月比較增減(%)'] || raw['mom'] || '0');
  const yoyRaw = parseFloat(raw['營業收入-去年同月增減(%)'] || raw['yoy'] || '0');
  return {
    month: raw['資料年月'] || raw['month'] || '',
    revenue: (raw['營業收入-當月營收'] || raw['revenue'] || '').replace(/\.00$/, ''),
    mom: momRaw.toFixed(2),
    yoy: yoyRaw.toFixed(2),
  };
}

function mapBalanceData(raw: Record<string, string>): FinancialData['balance'] {
  return {
    totalAssets: (raw['資產總額'] || raw['totalAssets'] || '').replace(/\.00$/, ''),
    totalLiabilities: (raw['負債總額'] || raw['totalLiabilities'] || '').replace(/\.00$/, ''),
    equity: (raw['權益總額'] || raw['equity'] || '').replace(/\.00$/, ''),
    bookValuePerShare: raw['每股參考淨值'] || raw['bookValuePerShare'] || '',
  };
}

function mapDividendData(raw: Record<string, string>): FinancialData['dividend'] {
  return {
    year: raw['股利年度'] || raw['year'] || '',
    cashDividendPerShare: raw['股東配發-盈餘分配之現金股利(元/股)'] || raw['cashDividendPerShare'] || '',
  };
}

// ─── Main Fetch Logic ───
async function main() {
  const { topN, outputDir } = parseArgs();

  console.log(`📊 fetch-financials: Fetching data for top ${topN} companies`);
  console.log(`📁 Output directory: ${outputDir}`);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Read companies list
  const companiesPath = path.resolve(COMPANIES_JSON_PATH);
  if (!fs.existsSync(companiesPath)) {
    console.error(`❌ Companies file not found: ${companiesPath}`);
    process.exit(1);
  }

  const companies: CompanyData[] = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
  const topCompanies = [...companies]
    .sort((a, b) => b.topic_count - a.topic_count)
    .slice(0, topN);

  console.log(`📋 Top ${topN} companies (by topic_count):`);
  topCompanies.forEach((c, i) => console.log(`   ${i + 1}. ${c.code} ${c.name} (${c.topic_count} topics)`));

  // ─── IMPORTANT NOTE ───
  // The actual MCP tool calls (get_company_profile, get_stock_valuation_ratios, etc.)
  // must be made from within the Hermes agent context. This script provides the
  // structure and mapping logic. To execute, use the Hermes MCP tools directly
  // and feed the results through the mapping functions above, then save.
  //
  // Example workflow in Hermes agent:
  //   1. Call mcp_casual_market_get_company_profile for each company
  //   2. Call mcp_casual_market_get_stock_valuation_ratios for each
  //   3. Call mcp_casual_market_get_taiwan_stock_price for each
  //   4. Call mcp_casual_market_get_company_income_statement for each
  //   5. Call mcp_casual_market_get_company_monthly_revenue for each
  //   6. Call mcp_casual_market_get_company_balance_sheet for each
  //   7. Call mcp_casual_market_get_company_dividend for each
  //   8. Map all data using the functions above
  //   9. Write the combined FinancialData object to public/data/financials/{code}.json
  //
  // For bulk fetching, consider adding delays between requests (1-2s) to avoid rate limiting.

  console.log('');
  console.log('⚠️  This script provides the mapping structure only.');
  console.log('    To actually fetch data, use the Hermes agent with MCP tools,');
  console.log('    or implement HTTP calls to a CasualMarket API proxy.');
  console.log('');
  console.log('✅ Script structure is ready. See mapping functions in fetch-financials.ts');
  console.log('    Expected output format: public/data/financials/{code}.json');
  console.log('    Example: public/data/financials/2330.json (already exists)');
}

main().catch(console.error);