# Legacy `industries.json` deprecation audit

_Last audited: 2026-05-29_

## Status

`public/data/industries.json` is **deprecated but not removable yet**. It remains a baseline / fallback data source while the canonical knowledge layer (`canonical-topics`, `company-topic-roles`, `product-knowledge`, `company-swot`) continues to increase coverage.

Removal must follow a strangler migration: keep the old file visible as legacy, move runtime paths to canonical sources, then delete only after all active consumers are gone.

## Active consumers

| Category | Consumer | Current use | Replacement / migration target | Removal gate |
|---|---|---|---|---|
| Runtime UI | `src/app/page.tsx` | **Migrated in S26.** The main topic/company/map UI imports `public/data/canonical-topic-map.json`, a derived artifact built from `canonical-topics` + `company-topic-roles`. | Continue improving canonical role coverage so the UI regains broad legacy-era breadth without using the legacy graph. Product/SWOT panels already prefer canonical data and explicit insufficient-data states. | Done for direct UI import: regression test verifies homepage does not import `industries.json`. Remaining UI work is coverage expansion and cleanup of legacy `industry_analysis` compatibility in financial snapshots. |
| Runtime library | `src/lib/legacyIndustryAnalysis.ts` | **Removed in S25.** Previously converted legacy topic/company-role graph into per-company `industry_analysis` fallback for daily analysis. | Canonical roles are now the only generator-side topic-role input. | Done: adapter source/test removed; migration regression verifies it stays retired. |
| Runtime library | `src/lib/companyKnowledge.ts` | Normalizes `industry_analysis` into products, topic roles, SWOT, and source labels. This is still needed for legacy financial snapshots. | Canonical product/topic/SWOT normalizers. | Financial snapshots stop carrying `industry_analysis`, or this parser is moved behind a deprecated input-only compatibility path with no runtime recommendation impact. |
| Runtime library | `src/lib/dailyAnalysis.ts` | Handles `legacy_unverified` industry basis and caps legacy-only scores below core benefit. | Canonical-only `industry` analysis with explicit insufficient state when coverage is missing. | No production analysis depends on `legacy_unverified`; tests for legacy path can be deleted or converted to migration fixtures. |
| Script | `scripts/generate-daily-analysis.ts` | **Migrated in S24.** It no longer reads `industries.json` or builds legacy fallbacks for companies without canonical roles. | Generates analysis directly from canonical topics / company-topic-roles / product knowledge / company SWOT. | Done: script has zero `INDUSTRIES_PATH` / `buildLegacyCompanyAnalysisFallbacks` references; generated analyses contain no `knowledgeBasis: "legacy_unverified"`. |
| Script | `scripts/generate-v2-inventory.ts` | Creates migration inventory from legacy industries data. | Retire once migration inventory is no longer needed, or change to canonical coverage inventory. | All legacy topics mapped, all required canonical roles/products/SWOT extracted, and no open migration reports depend on this script. |
| Script / validator | `scripts/validate-knowledge-pipeline.ts` | Validates legacy topics/company index consistency and writes issues about companies present/missing in `industries.json`. | Validate canonical topics, company-topic-roles, product-knowledge, company-swot, and source registry instead. | Validator has no `industries.*` hard errors/warnings; canonical validation enforces topic/role/product/SWOT coverage thresholds. |
| Tests | `src/lib/canonicalTopics.test.ts` | **Migrated in S26.** It no longer reads runtime `public/data/industries.json`; legacy topic slugs used for migration coverage live in `src/lib/__fixtures__/legacy-topic-refs.json`. | Keep canonical taxonomy tests authoritative and update the test-only fixture only when intentionally changing the legacy migration baseline. | Done: canonical topic tests no longer need runtime `public/data/industries.json` as a baseline. |
| Tests | `src/lib/legacyIndustryAnalysis.test.ts` | **Removed in S25.** Previously tested adapter from legacy graph to per-company fallbacks. | Migration regression now verifies the retired adapter files stay absent. | Done. |
| Tests | `src/lib/dailyAnalysis.test.ts` | Verifies legacy fallback is capped and never described as core benefit. | Canonical-only tests for insufficient/observation state. | No runtime fallback remains; legacy cap test replaced by canonical missing-data behavior. |
| Docs | `docs/*` legacy migration docs | Several docs still describe `industries.json` as baseline or canonical topic graph. | Update docs to mark it legacy baseline and point to canonical knowledge v2. | Docs contain no stale claim that `industries.json` is canonical runtime truth. |
| Data snapshots | `public/data/financials/2330.json`, `public/data/financials/2337.json`, `public/data/company-knowledge/*.json` | Contain historical `industry_analysis` fields/source labels. | Regenerate from canonical sources or keep as clearly deprecated compatibility snapshots. | Checked-in financial/company-knowledge fixtures have no active `industry_analysis` source labels, or tests prove these fields are ignored for recommendation confidence. |
| Generated analysis | `public/data/analysis/*.json` | **Migrated in S24/S25.** Checked-in generated files no longer include legacy provenance after canonical-only generation. | Continue expanding canonical coverage so more companies graduate from insufficient/observation to evidence-backed states. | Done for legacy provenance: generated analyses contain zero `legacy_unverified` / `Legacy 待驗證` strings. |

## Quantified current state

- Direct non-generated consumers found after S26: **2 runtime libs**, **2 scripts**, **1 test area**, **6 docs**, plus legacy data snapshots. The main homepage UI, canonical topic tests, and generator-side `legacyIndustryAnalysis` adapter no longer consume the legacy graph.
- Generated analysis files currently containing legacy provenance: **0** after S24/S25 canonical-only generation.
- Current coverage report after S26 rebase verification: **A=28, B=5, C=22, D=0, F=450** with validation **0 errors / 1449 warnings**. This is enough to retire generator fallback, but not enough to delete every legacy compatibility path.
- Canonical UI topic map after S26: **23 topics**, **33 companies**, **63 company-topic entries**. This intentionally shows only evidence-backed canonical role coverage; missing companies/topics must be added to `company-topic-roles`, not backfilled from legacy data.

## Removal gates

`industries.json` may only be deleted after all of these pass:

1. **Runtime zero-consumer gate**
   - No import/read of `public/data/industries.json` from `src/app/**`, `src/lib/**`, or runtime scripts.
   - `scripts/generate-daily-analysis.ts` does not build legacy fallbacks.

2. **Canonical coverage gate**
   - `company-topic-roles` covers the recommendation universe required by Daily Analysis.
   - `product-knowledge` and `company-swot` meet ratcheted coverage thresholds.
   - Coverage report has no D/F company eligible for Top recommendation.

3. **Generated artifact gate**
   - `npm run analysis:daily` produces zero `knowledgeBasis: "legacy_unverified"` records.
   - Generated analysis contains no `Legacy 待驗證` or `industries.json fallback` provenance text.

4. **Quality / recommendation gate**
   - Daily report gating blocks hard risk gates and D/F analysis quality.
   - Missing canonical topic role/product/SWOT becomes `observation_only` or `insufficient`, never core benefit.

5. **Docs/tests gate**
   - Docs no longer call `industries.json` canonical truth.
   - Legacy adapter tests are deleted or moved to test-only fixtures.
   - Canonical tests no longer need runtime `public/data/industries.json` as a baseline.

6. **Final deletion gate**
   - `git grep` / repository search for `industries.json`, `INDUSTRIES_PATH`, `legacyIndustryAnalysis`, and runtime `industry_analysis` fallback shows no active runtime consumer.
   - Full verification passes: `npm test`, `npm run build`, `npm run lint`, `npm run knowledge:validate`, `npm run knowledge:coverage`, `npm run analysis:daily`, `git diff --check`.

## Recommended migration order

1. Move the main map UI from `industries.json` to canonical topics + company-topic-roles. **Done in S26.**
2. Change Daily Analysis generation to canonical-only and emit insufficient-data states instead of legacy fallback. **Done in S24.**
3. Retire `legacyIndustryAnalysis.ts` and its tests. **Done in S25.**
4. Update validator from legacy topic graph checks to canonical knowledge coverage checks.
5. Regenerate analysis and confirm zero legacy provenance. **Done for generated Daily Analysis in S24/S25.**
6. Update stale docs and delete `public/data/industries.json` only after the zero-consumer gate passes.
