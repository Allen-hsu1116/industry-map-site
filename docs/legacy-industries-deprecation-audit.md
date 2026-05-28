# Legacy `industries.json` deprecation audit

_Last audited: 2026-05-29_

## Status

`public/data/industries.json` is **deprecated but not removable yet**. It remains a baseline / fallback data source while the canonical knowledge layer (`canonical-topics`, `company-topic-roles`, `product-knowledge`, `company-swot`) continues to increase coverage.

Removal must follow a strangler migration: keep the old file visible as legacy, move runtime paths to canonical sources, then delete only after all active consumers are gone.

## Active consumers

| Category | Consumer | Current use | Replacement / migration target | Removal gate |
|---|---|---|---|---|
| Runtime UI | `src/app/page.tsx` imports `../../public/data/industries.json` | Main industry-map topic/group UI and supply-chain level ordering. Also still reads company `industry_analysis` fallbacks in the detail panel. | `public/data/canonical-topics.json` for topic taxonomy; `public/data/company-topic-roles/*.json` for company roles; `public/data/product-knowledge/*.json` and `public/data/company-swot/*.json` for product/SWOT narratives. | UI has zero direct import of `industries.json`; selected topic/groups render from canonical topics/roles; product/SWOT panels prefer canonical data and show explicit insufficient-data states instead of legacy confidence. |
| Runtime library | `src/lib/legacyIndustryAnalysis.ts` | Converts legacy topic/company-role graph into per-company `industry_analysis` fallback for daily analysis. | Remove adapter after generator no longer needs fallback. Canonical roles become the only topic-role input. | `generate-daily-analysis.ts` no longer imports `legacyIndustryAnalysis`; coverage report shows no D/F recommendations promoted; tests prove missing canonical roles become observation/insufficient, not legacy fallback. |
| Runtime library | `src/lib/companyKnowledge.ts` | Normalizes `industry_analysis` into products, topic roles, SWOT, and source labels. This is still needed for legacy financial snapshots. | Canonical product/topic/SWOT normalizers. | Financial snapshots stop carrying `industry_analysis`, or this parser is moved behind a deprecated input-only compatibility path with no runtime recommendation impact. |
| Runtime library | `src/lib/dailyAnalysis.ts` | Handles `legacy_unverified` industry basis and caps legacy-only scores below core benefit. | Canonical-only `industry` analysis with explicit insufficient state when coverage is missing. | No production analysis depends on `legacy_unverified`; tests for legacy path can be deleted or converted to migration fixtures. |
| Script | `scripts/generate-daily-analysis.ts` | Reads `industries.json` and builds legacy fallbacks for companies without canonical roles. | Generate analysis directly from canonical topics / company-topic-roles / product knowledge / company SWOT. | Script has zero `INDUSTRIES_PATH` / `buildLegacyCompanyAnalysisFallbacks` references; generated analyses contain no `knowledgeBasis: "legacy_unverified"`. |
| Script | `scripts/generate-v2-inventory.ts` | Creates migration inventory from legacy industries data. | Retire once migration inventory is no longer needed, or change to canonical coverage inventory. | All legacy topics mapped, all required canonical roles/products/SWOT extracted, and no open migration reports depend on this script. |
| Script / validator | `scripts/validate-knowledge-pipeline.ts` | Validates legacy topics/company index consistency and writes issues about companies present/missing in `industries.json`. | Validate canonical topics, company-topic-roles, product-knowledge, company-swot, and source registry instead. | Validator has no `industries.*` hard errors/warnings; canonical validation enforces topic/role/product/SWOT coverage thresholds. |
| Tests | `src/lib/canonicalTopics.test.ts` | Uses `industries.json` as migration baseline: every legacy topic maps exactly once and specific legacy taxonomy regressions remain fixed. | Canonical topic tests that no longer need legacy baseline; keep old fixtures in test-only data if needed. | Canonical taxonomy is authoritative and baseline comparison is unnecessary; legacy-specific regression fixtures are moved out of runtime `public/data`. |
| Tests | `src/lib/legacyIndustryAnalysis.test.ts` | Tests adapter from legacy graph to per-company fallbacks. | Delete with adapter, or keep only as archived migration fixture until adapter removal. | Adapter is unused by generation and runtime. |
| Tests | `src/lib/dailyAnalysis.test.ts` | Verifies legacy fallback is capped and never described as core benefit. | Canonical-only tests for insufficient/observation state. | No runtime fallback remains; legacy cap test replaced by canonical missing-data behavior. |
| Docs | `docs/*` legacy migration docs | Several docs still describe `industries.json` as baseline or canonical topic graph. | Update docs to mark it legacy baseline and point to canonical knowledge v2. | Docs contain no stale claim that `industries.json` is canonical runtime truth. |
| Data snapshots | `public/data/financials/2330.json`, `public/data/financials/2337.json`, `public/data/company-knowledge/*.json` | Contain historical `industry_analysis` fields/source labels. | Regenerate from canonical sources or keep as clearly deprecated compatibility snapshots. | Checked-in financial/company-knowledge fixtures have no active `industry_analysis` source labels, or tests prove these fields are ignored for recommendation confidence. |
| Generated analysis | `public/data/analysis/*.json` | Many checked-in generated files include `legacy_unverified` provenance because canonical coverage is still incomplete. | Re-run analysis after canonical coverage increases and fallback is removed. | Generated analyses contain zero `legacy_unverified` / `Legacy 待驗證` strings. |

## Quantified current state

- Direct non-generated consumers found by audit: **1 runtime UI**, **3 runtime libs**, **3 scripts**, **3 tests**, **6 docs**, plus legacy data snapshots.
- Generated analysis files currently containing legacy provenance: **504 generated analysis files were scanned as generated artifacts; many still include `legacy_unverified` while canonical coverage is incomplete.**
- Current coverage report at the time of audit: **A=27, B=5, C=0, D=467, F=6**. This is not enough to remove legacy fallback.

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

1. Move the main map UI from `industries.json` to canonical topics + company-topic-roles.
2. Change Daily Analysis generation to canonical-only and emit insufficient-data states instead of legacy fallback.
3. Retire `legacyIndustryAnalysis.ts` and its tests.
4. Update validator from legacy topic graph checks to canonical knowledge coverage checks.
5. Regenerate analysis and confirm zero legacy provenance.
6. Update stale docs and delete `public/data/industries.json` only after the zero-consumer gate passes.
