# Legacy `industries.json` deprecation audit

_Last audited: 2026-05-29 S28_

## Status

`public/data/industries.json` has been **deleted** after the strangler migration reached zero active runtime/script consumers. Runtime topic and company-role behavior now comes from canonical sources:

- `public/data/canonical-topics.json`
- `public/data/company-topic-roles/{code}.json`
- `public/data/company-swot/{code}.json`
- `public/data/product-knowledge/{code}.json`
- generated `public/data/canonical-topic-map.json`

Legacy `industry_analysis` data is no longer a runtime fallback for Daily Analysis or the company detail UI. Missing canonical coverage must produce explicit insufficient/observation states, not legacy confidence.

## Consumer retirement record

| Category | Consumer | Final state |
|---|---|---|
| Runtime UI | `src/app/page.tsx` | Imports `public/data/canonical-topic-map.json` and canonical role/SWOT/product data. It no longer reads `data.industry_analysis` from financial snapshots. |
| Runtime library | `src/lib/legacyIndustryAnalysis.ts` | Removed in S25. Migration regression verifies the adapter stays retired. |
| Runtime library | `src/lib/companyKnowledge.ts` | S28 input type no longer includes `industry_analysis`; company knowledge is built from canonical/root fields and source-aware data signals. |
| Runtime library | `src/lib/dailyAnalysis.ts` | `legacy_unverified` has been removed from `KnowledgeBasis`; missing coverage becomes `data_insufficient`. |
| Script | `scripts/generate-daily-analysis.ts` | Canonical-only generation; no `INDUSTRIES_PATH`, no `industries.json` read, no legacy fallback builder. |
| Script | `scripts/generate-v2-inventory.ts` | Removed in S27; one-time legacy extraction pipeline is retired. |
| Script / validator | `scripts/validate-knowledge-pipeline.ts` | Reads canonical topics, roles, products, SWOT, and source registry. |
| Tests | migration regression tests | Verify the retired file is absent, homepage has no legacy `industry_analysis` fallback, and checked-in compatibility snapshots do not keep legacy source labels. |
| Docs | migration/knowledge docs | Updated to describe canonical sources as runtime truth and the deleted legacy file as a retired baseline. |
| Data snapshots | `public/data/financials/2330.json`, `public/data/financials/2337.json`, `public/data/company-knowledge/*.json` | Checked-in 2330/2337 compatibility snapshots were cleaned of legacy `industry_analysis`; generated company knowledge was rebuilt from canonical/root sources. |
| Generated analysis | `public/data/analysis/*.json` | Generated Daily Analysis contains zero `legacy_unverified` / `Legacy 待驗證` legacy provenance. |

## Quantified current state

- Active `src/**` or `scripts/**` readers of `public/data/industries.json` / `INDUSTRIES_PATH`: **0**.
- Checked-in `public/data/industries.json`: **deleted**.
- Generated analysis files containing legacy provenance: **0** after canonical-only generation.
- Canonical UI topic map after S26/S27: intentionally evidence-backed only; missing companies/topics must be added to `company-topic-roles`, not backfilled from legacy data.

## Removal gates

All final deletion gates are satisfied for the legacy file:

1. **Runtime zero-consumer gate** — passed.
2. **Canonical coverage/recommendation safety gate** — passed through AnalysisQuality gating: A/B/C may enter top recommendation; D/F remain observation-only.
3. **Generated artifact gate** — passed: no `legacy_unverified`, no `Legacy 待驗證`, no `industries.json fallback` generated provenance.
4. **Quality / recommendation gate** — passed: missing canonical role/product/SWOT becomes `observation_only` or `data_insufficient`, never a core benefit.
5. **Docs/tests gate** — passed in S28 cleanup.
6. **Final deletion gate** — requires full verification before commit: `npm test`, `npm run build`, `npm run lint`, `npm run knowledge:validate`, `npm run knowledge:coverage`, `npm run analysis:daily`, `git diff --check`.

## Remaining non-blocking work

- Expand canonical coverage so the 450+ F-grade / insufficient companies can graduate to evidence-backed analysis.
- Replace the remaining compatibility `companies.json` workflow with a generated canonical company index.
- Continue reducing product bare-noun warnings by adding sourced product knowledge.
