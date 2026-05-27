# Spec: Daily Analysis Company Knowledge Layer

## Objective

Daily analysis should combine two layers instead of asking an LLM to recreate company knowledge every day:

- **Stable company knowledge:** products, customers, topic roles, industry positioning, SWOT, source/freshness metadata.
- **Daily market data:** OHLCV, valuation, institutional flow, margin balance, monthly revenue, financial statements, major news.

The goal is aistockmap-style analysis: explain what the company actually sells, what role it plays inside each topic, and which SWOT point matters today.

## Data Source Priority

- **Always prefer official/structured sources:** MOPS/TWSE/TPEX and FinMind datasets.
- **Use FinMind aggressively where available:** daily price, institutional history, margin history, PER/PBR/dividend yield history, market value, monthly revenue, financial statements, cash flow, balance sheet.
- **Use internal topic maps:** `public/data/industries.json` and each financial file's `industry_analysis` for topic role, products, customers, and topic-level SWOT.
- **Use news only as event delta:** news can trigger `needs_review`, but should not silently rewrite long-term SWOT.
- **Never treat AI-generated prose as the source of truth:** AI may summarize and classify, but output must carry source/freshness metadata.

## Implemented Slice

### Company Knowledge Builder

- Source: `src/lib/companyKnowledge.ts`
- Batch script: `scripts/generate-company-knowledge.ts`
- Command: `npm run knowledge:build`
- Output:
  - `public/data/company-knowledge/{code}.json`
  - `public/data/company-knowledge/index.json`

The builder merges:

- root `products`, `customers`, `swot`
- per-topic `industry_analysis` products/customers/SWOT/market position
- FinMind-backed data availability signals inferred from existing financial JSON
- freshness state: `fresh`, `normal`, `stale`, `needs_review`, `unknown`

### Daily Analysis Integration

- Source: `src/lib/dailyAnalysis.ts`
- Command: `npm run analysis:daily`
- Output: `public/data/analysis/{code}.json`

Daily analysis now includes:

- `technical`: existing rule-based technical stance
- `chips`: existing institutional/margin stance
- `industry`: topic-role and SWOT correction summary
- `knowledge`: products, customers, topic roles, SWOT, data sources, FinMind signals
- `nextSession`: watch points and trigger rules

## Testing Strategy

- Unit tests: `src/lib/dailyAnalysis.test.ts`
- Command: `npx tsx --test src/lib/dailyAnalysis.test.ts src/lib/marketData.test.ts`
- Coverage expectations:
  - bullish technical + accumulation chip path remains green
  - sparse-data path remains safe
  - company knowledge merges topic role/products/SWOT
  - FinMind-backed data source signals appear when source arrays exist

## Current Automation Gap

As of this slice, the frontend and analysis generator expose the exact source dates (`marketDataDate`, `chipDataDate`, `sourceUpdatedAt`) so stale technical data is visible instead of hidden. The repository still needs a real scheduled FinMind fetch step before `knowledge:build` and `analysis:daily`; otherwise the site only regenerates analysis from whatever JSON already exists under `public/data/financials`.

Required refresh pipeline:

```bash
# planned production order
# 1. fetch latest FinMind/MOPS/TWSE data into public/data/financials
npm run knowledge:build
npm run analysis:daily
```

## Next Implementation Slices

1. **FinMind fetcher hardening**
   - Replace the placeholder `scripts/fetch-financials.ts` with a real FinMind-backed fetch path or a Hermes MCP wrapper.
   - Target datasets: stock price history, institutional history, margin history, PER history, revenue history, financial statements, balance sheet, cash flow, market value.

2. **Event scanner**
   - Read MOPS major news and recent news per company/topic.
   - Output `public/data/events/YYYY-MM-DD/{code}.json`.
   - Mark knowledge/SWOT as `needs_review` when events affect products, capacity, customers, margins, competition, or regulation.

3. **SWOT versioning**
   - Store each SWOT point with sources, confidence, `last_verified`, and point-level freshness.
   - Avoid rewriting SWOT from short-term price moves.

4. **UI expansion**
   - Add a dedicated daily report page section for source/freshness and topic role deltas.
   - Show whether a company is core beneficiary, direct supplier, indirect supplier, or peripheral concept stock.

## Boundaries

- **Always:** prefer FinMind/MOPS/TWSE structured data when available.
- **Always:** keep analysis deterministic when source data is static.
- **Ask first:** adding paid APIs, database services, or persistent backend infrastructure.
- **Never:** fabricate source citations or use an LLM-only SWOT as canonical company knowledge.
