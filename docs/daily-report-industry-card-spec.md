# Spec: Daily Report Aistockmap-style Industry Card

## Objective
把 `/daily-report` 的「產業題材」區塊從單純分數/來源提示，升級成接近 aistockmap 的快速判讀卡：

1. 公司在主要題材內扮演什麼角色。
2. 主要產品/技術是什麼，以及為什麼對該題材重要。
3. SWOT 摘要：優勢、機會、弱點/威脅。
4. 同時保留 V2 已驗證 / V2 待驗證 / 產業資料待補 provenance，避免未驗證資料被說成確定結論。

## Commands
- Focused test: `npm test -- src/lib/dailyAnalysis.test.ts`
- Generate daily analysis: `npm run analysis:daily`
- Full gates: `npm test && npm run knowledge:validate && npm run build && npm run lint`
- Dev server/browser check: open `http://localhost:3000/daily-report`

## Project Structure
- `src/lib/dailyAnalysis.ts` — daily analysis JSON contract and deterministic industry card enrichment.
- `src/lib/dailyAnalysis.test.ts` — unit coverage for verified, pending, legacy, sparse cases.
- `scripts/generate-daily-analysis.ts` — attaches canonical role/SWOT/product knowledge before writing `public/data/analysis/*.json`.
- `src/app/daily-report/page.tsx` — user-facing card rendering.
- `public/data/product-knowledge/*.json` — evidence-backed product what/why descriptions.

## Data Contract
Add optional fields under `DailyAnalysis.industry`:

```ts
roleDetail?: {
  topicName: string;
  roleLabel: string;
  roleSummary: string;
  supplyChainStage?: string;
  roleType?: string;
  directness?: string;
  source: "canonical" | "legacy" | "insufficient";
};
productNarratives?: Array<{
  name: string;
  description: string;
  whyItMatters?: string;
  topicFit?: string;
  businessImpact?: string;
  confidence?: "high" | "medium" | "low";
  lastVerified?: string;
}>;
swotSnapshot?: {
  strengths: string[];
  opportunities: string[];
  risks: string[];
};
```

## Boundaries
- Always: Product cards must explain both **what it is** and **why it matters** when evidence-backed product knowledge exists.
- Always: Legacy fallback must stay clearly marked as待驗證 and must not be promoted to core benefit.
- Always: UI should hide empty sections rather than show broken placeholders.
- Never: Use LLM-generated claims as source-of-truth inside generated JSON.
- Never: Add new dependencies or remote calls for this slice.

## Success Criteria
- Daily analysis JSON for a verified company such as 2330 contains `roleDetail`, `productNarratives`, and `swotSnapshot`.
- `/daily-report` visually shows role, product what/why, and SWOT compactly for top picks.
- Missing-canonical-coverage companies still render safely as 產業資料待補 / insufficient.
- Tests, knowledge validation, build, lint, and browser console check pass.
