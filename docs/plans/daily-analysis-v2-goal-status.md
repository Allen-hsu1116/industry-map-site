# Daily Analysis V2 Goal Status Ledger

Updated: 2026-06-10 01:28 CST

## Purpose

Persistent record of which Daily Industry Intelligence goal slices have been implemented, verified, and what remains. This file exists because conversation summaries and uncommitted diffs are not a durable enough source of truth for multi-session goal work.

## Status semantics

- **Done:** Acceptance is implemented and verified for the goal/task as currently scoped.
- **Partial:** A verified vertical slice exists, but the full goal wording still has remaining sections or polish.
- **Not started:** No verified implementation slice yet.
- **Blocked/Needs decision:** Requires product or source-of-truth decision before implementation.

## Goal status

### Goal 1 — Contracts foundation

**Status:** Partial; contracts checkpointed in git, final full-goal review still remains.

**Evidence in code/tests:**
- `src/lib/dailyAnalysisV2.ts`
- `src/lib/dailyAnalysisV2.test.ts`
- `src/lib/researchSignals.ts`
- `src/lib/researchSignals.test.ts`
- `src/lib/stockKnowledgeRules.contract.test.ts`
- `src/lib/productNavigation.ts`
- `src/lib/productNavigation.test.ts`

**Checkpoint commit:**
- `aa6b11e feat: add daily analysis v2 contracts`

**Verification:**
- Focused contract tests passed during checkpointing.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.

**Remaining:**
- Confirm all contract docs/spec references are synchronized.
- Keep future scoring/gating threshold changes spec-first.

### Goal 2 — Context adapters

**Status:** Partial; context adapters checkpointed in git, final source-semantics review still remains.

**Evidence in code/tests:**
- `src/lib/companyAnalysisContext.ts`
- `src/lib/companyAnalysisContext.test.ts`
- `src/lib/topicAnalysisContext.ts`
- `src/lib/topicAnalysisContext.test.ts`
- `src/lib/industryChainMap.ts`
- `src/lib/industryChainMap.test.ts`

**Checkpoint commit:**
- `91ed21a feat: add daily analysis context adapters`

**Verification:**
- Focused adapter tests passed during checkpointing.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.

**Remaining:**
- Confirm adapters cover the final intended source semantics.
- Continue moving page-local data shaping toward reusable view models.

### Goal 3 — Grade gating

**Status:** Partial; grade-gating contract checkpointed in git, threshold governance remains.

**Evidence in code/tests:**
- `src/lib/dailyAnalysisV2.ts`
- `src/lib/dailyAnalysisV2.test.ts`
- Daily report gating tests in existing report-related test files.

**Checkpoint commit:**
- `aa6b11e feat: add daily analysis v2 contracts`

**Known guardrail:** D/F grades must never render as recommendations.

**Verification:**
- Focused gating tests passed during checkpointing.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.

**Remaining:**
- Keep threshold changes gated by spec updates.
- Keep D/F visibility as observation-only, never recommendation copy.

### Goal 4 — Daily V2 artifacts

**Status:** Partial; V2 artifact generator checkpointed in git, UI/automation integration still incomplete.

**Evidence in code/tests:**
- `src/lib/dailyAnalysisV2Generator.ts`
- `src/lib/dailyAnalysisV2Generator.test.ts`
- `scripts/generate-daily-analysis-v2.ts`
- `package.json` script changes.

**Checkpoint commit:**
- `a5ecb94 feat: add daily analysis v2 generator`

**Verification:**
- `npm test -- --test-name-pattern "DailyAnalysisV2 generator|DailyAnalysisV2 dry-run artifact command"` → 149/149 passing under Node test filtering behavior.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.

**Remaining:**
- Daily Report V2 view-model integration is not fully extracted.
- Company Detail still mainly consumes v1 `/data/analysis/{code}.json` daily analysis artifact.
- V2 refresh integration belongs to Goal 9.

### Goal 5 — Daily Focus UI

**Status:** Partial; verified vertical slices complete, full extraction/polish remains.

**Implemented slices:**
- Human Editorial Daily Report hero/market thesis.
- Today story derived from checked-in daily report/event data.
- Daily focus topic/company links.
- Candidate decision brief before dense evidence modules.

**Evidence in code/tests:**
- `src/app/daily-report/page.tsx`
- `src/lib/dailyFocusUi.test.ts`

**Checkpoint commit:**
- `eba4a7e feat: add daily focus editorial UI`

**Verification:**
- `npm test -- --test-name-pattern "Daily Focus"` → 149/149 passing under Node test filtering behavior.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.
- Browser smoke `http://127.0.0.1:3048/daily-report` → editorial hero, decision brief, topic links, company links, and stage-unavailable guardrail present; browser console had 0 JS errors/messages.

**Remaining:**
- Extract monolithic `daily-report/page.tsx` into smaller components.
- More complete Daily Report V2 view-model boundary.
- Improve topic/stage links once verified `stageId` is available in event data.

### Goal 6 — Industry Chain Map UI

**Status:** Partial; first verified vertical slice complete.

**Implemented slice:**
- Topic detail industry chain staged lanes.
- Representative company cards.
- `show all` table fallback via URL state `?stage=...&view=all`.
- Narrative-only/insufficient stage labeling without fake stock bindings.

**Evidence in code/tests:**
- `src/app/topics/[id]/page.tsx`
- `src/lib/industryChainUi.test.ts`

**Checkpoint commit:**
- `3d27cb0 feat: add industry chain map UI slice`

**Verification:**
- `npm test -- --test-name-pattern "Goal 6"` → 149/149 passing under Node test filtering behavior.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.
- Browser smoke `http://127.0.0.1:3048/topics/ic-design?stage=upstream&view=all` → show-all upstream table, narrative-only labels, and no-fake-company copy present; browser console had 0 JS errors/messages.

**Remaining:**
- Additional URL-state filters: directness, confidence, freshness, market lens.
- Component extraction for industry-chain UI.
- Canonical company detail route decision remains unresolved.

### Goal 7 — Company Detail UI

**Status:** Partial; first verified vertical slice complete.

**Implemented slice:**
- Company Detail Human Editorial brief appears before dense tabs.
- Brief separates daily change, long-term role, biggest risk, and watch next.
- Visible Goal 7 section inventory: Overview, Daily AI Analysis, Fundamentals, Technicals, Chip/Ownership, News/Events, Products, Topic Roles, SWOT, Sources.
- Source semantics show `AI-derived`, `checked-in evidence`, and partial/empty guardrails.

**Evidence in code/tests:**
- `src/app/page.tsx`
- `src/components/company-detail/CompanyDetailTabs.tsx`
- `src/components/company-detail/CompanyEditorialBrief.tsx`
- `src/components/company-detail/CompanySectionInventory.tsx`
- `src/lib/view-models/companyEditorialBrief.ts`
- `src/lib/companyDetailUi.test.ts`

**Checkpoint commit:**
- `d0c5261 feat: add company detail editorial brief`

**Verification:**
- `npm test -- --test-name-pattern "Goal 7"` → 149/149 passing under Node test filtering behavior.
- `npm test` → 149/149 passing after all checkpoint commits.
- `npm run build` → passing after all checkpoint commits.
- Browser smoke `http://127.0.0.1:3048/?company=2330` → editorial brief, approved section inventory, and source semantics present; browser console had 0 JS errors/messages.

**Remaining:**
- Dedicated Sources/Evidence section or tab with complete module table.
- Integrate Daily Analysis V2 artifact into company detail.
- Break company detail out of the huge `src/app/page.tsx` client component.
- Canonical `/companies/[code]` route still not implemented.
- Existing tabs are not yet fully aligned to the Goal 7 section inventory.

### Goal 8 — Topic AI Analysis UI

**Status:** Not started as a Goal 8 UI slice.

**Potential foundation already exists:**
- `src/lib/topicAnalysisContext.ts`
- `src/lib/topicAnalysisContext.test.ts`
- Topic detail page has value-chain/common-risk sections from earlier goals.

**Remaining:**
- Topic-level AI-assisted editorial panel.
- Daily focus and research direction on topic page.
- Direct/peripheral company role narrative.
- Topic risks and sources surfaced with Human Editorial UI.
- Browser smoke `/topics/ai-server` and one memory topic.

### Goal 9 — Automation integration

**Status:** Not started as Goal 9.

**Remaining:**
- Research signal validation workflow.
- V2 daily refresh sequence integration.
- Dry-run verification for no semantic no-op commits.
- Failure reporting by module status.

## Cross-cutting risks

1. **No prior durable goal ledger.** Before this file, completion state existed mostly in chat summaries, tests, and uncommitted diffs. This ledger is now referenced by both `goal-driven-website-completion.md` and `daily-analysis-v2-implementation-plan.md`.
2. **Checkpointed working tree.** Goal 1–7 implementation changes are now split into atomic commits, but the branch is ahead of `origin/main` until pushed/merged.
3. **Goal numbering mismatch.** `goal-driven-website-completion.md` calls them Goal 5/6/7, while `daily-analysis-v2-implementation-plan.md` still labels related work as Task 5.1/5.2/5.3/5.4. Cross-reference notes were added, but future edits still need to preserve both labels until the plan is renumbered.
4. **Partial goals may look complete.** Each goal-run implements the next smallest vertical slice, not necessarily the entire goal description.
5. **Monolithic pages.** `src/app/page.tsx` and `src/app/daily-report/page.tsx` remain large, increasing edit risk. The new architecture migration plan is `docs/plans/human-editorial-ui-migration-plan.md`.

## Governance/checkpoint updates

### 2026-06-09 — Goal-status tracking slice

**Status:** Done.

**Changed:**
- Added this durable goal-status ledger.
- Added the ledger reference and update rule to `docs/plans/goal-driven-website-completion.md`.
- Added Goal 6/7/8/9 cross-reference notes to `docs/plans/daily-analysis-v2-implementation-plan.md`.

**Verification:**
- `npm test` → 149/149 passing
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain

**Remaining:**
- Decide whether to renumber implementation-plan Task 5.x items or keep cross-references only.

### 2026-06-09 — Goal 1–7 checkpoint review slice

**Status:** Done.

**Changed:**
- Split accumulated implementation into atomic checkpoint commits:
  - `664cecf docs: add daily intelligence specs and sketches`
  - `aa6b11e feat: add daily analysis v2 contracts`
  - `91ed21a feat: add daily analysis context adapters`
  - `a5ecb94 feat: add daily analysis v2 generator`
  - `eba4a7e feat: add daily focus editorial UI`
  - `3d27cb0 feat: add industry chain map UI slice`
  - `d0c5261 feat: add company detail editorial brief`
- Updated this ledger with checkpoint commits, exact verification commands, browser-smoke URLs, and remaining risks.

**Verification:**
- Focused pre-commit test gates were run for contract/generator/UI checkpoint groups.
- Secret scan and `git diff --cached --check` passed before each feature/UI commit.
- `npm test` → 149/149 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke `http://127.0.0.1:3048/daily-report` → Daily Focus editorial hero, decision brief, topic/company links, and stage-unavailable guardrail present.
- Browser smoke `http://127.0.0.1:3048/topics/ic-design?stage=upstream&view=all` → show-all table, narrative-only labels, and no-fake-company copy present.
- Browser smoke `http://127.0.0.1:3048/?company=2330` → Company Detail editorial brief, approved sections, and source semantics present.
- Browser console after smoke checks → 0 JS errors/messages.

**Remaining:**
- Branch is ahead of `origin/main` by checkpoint commits; push/merge still required if deployment or remote backup is desired.
- Goal 5/6/7 remain Partial rather than full-goal Done.
- Goal 8 and Goal 9 remain not started.
- Component extraction remains needed for `src/app/page.tsx` and `src/app/daily-report/page.tsx`.

### 2026-06-09 — Human Editorial UI architecture migration plan

**Status:** Done.

**Changed:**
- Added `docs/plans/human-editorial-ui-migration-plan.md`.
- Defined Human Editorial UI Architecture Migration mode as behavior-preserving component/view-model extraction, distinct from feature vertical-slice mode.
- Recorded current monolith sizes:
  - `src/app/page.tsx` — 4,178 lines.
  - `src/app/daily-report/page.tsx` — 1,469 lines.
  - `src/app/topics/[id]/page.tsx` — 294 lines.
- Defined target component boundaries under `src/components/shared/editorial`, `src/components/company-detail`, `src/components/daily-report`, and `src/components/topic-detail`.
- Defined target view-model/formatter boundaries under `src/lib/view-models` and `src/lib/formatters`.
- Defined route strategy: keep `/?company=CODE`, add `/companies/[code]` only after route-agnostic component extraction, verify both before migrating internal links.
- Defined migration phases M1–M6, verification gates, risk register, and acceptance criteria.

**Verification:**
- `npm test` → 149/149 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke not required because this was docs-only planning and no app code changed.

**Remaining:**
- Begin Slice M1.1: extract `CompanyEditorialBrief` from `src/app/page.tsx` into `src/components/company-detail/CompanyEditorialBrief.tsx` without behavior change.
- Keep Goal 5/6/7 marked Partial until their remaining sections and extraction work are complete.

### 2026-06-09 — Slice M1.1 CompanyEditorialBrief extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/CompanyEditorialBrief.tsx`.
- Moved the existing Goal 7 Human Editorial company brief JSX out of `src/app/page.tsx` into the dedicated component.
- Kept `buildCompanyEditorialBrief` and all existing copy, labels, source semantics, approved-section inventory, and `/?company=CODE` route behavior unchanged.
- Updated `src/lib/companyDetailUi.test.ts` so the regression test follows the extracted component while still proving the brief renders before `DETAIL_TABS.map`.

**Verification:**
- `npm test -- --test-name-pattern "Goal 7|Slice M1.1"` → 150/150 passing under Node test filtering behavior.
- `npm test` → 150/150 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke `http://127.0.0.1:3048/?company=2330` → company detail renders the extracted Human Editorial brief before dense tabs, with approved sections and source semantics still visible.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 component extraction with the next company-detail slice; do not add `/companies/[code]` until the planned route compatibility phase.
- `src/app/page.tsx` remains monolithic even after this first extracted component.

### 2026-06-09 — Slice M1.2 CompanyEditorialBrief view-model extraction

**Status:** Done.

**Changed:**
- Added `src/lib/view-models/companyEditorialBrief.ts` and moved `buildCompanyEditorialBrief()` plus its helper and view-model types out of `src/app/page.tsx`.
- Kept `CompanyEditorialBrief` as a render-only component receiving prepared view-model props.
- Preserved the existing `/?company=CODE` route behavior; no `/companies/[code]` route or link was added in this slice.
- Preserved Goal 7 copy, approved section labels, source/freshness/status labels, fallback text, and recommendation semantics.
- Added focused view-model tests covering both happy path priority/source semantics and insufficient-data fallback behavior.
- Updated component-boundary regression tests so labels/source semantics are verified across page, component, and view-model files.

**Verification:**
- `npm test -- --test-name-pattern "Goal 7|company editorial brief"` → 152/152 passing under Node test filtering behavior.
- `npm test` → 152/152 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke `http://127.0.0.1:3048/?company=2330` → company detail renders the Human Editorial brief with `AI-derived`, `checked-in evidence`, approved sections, and prepared view-model content visible; console check reported 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with source/section inventory and tab shell slices before introducing canonical `/companies/[code]` routing.
- `src/app/page.tsx` still owns most company-detail rendering and data-loading effects.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-09 — Slice M1.3 CompanySectionInventory and source rail extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/CompanySectionInventory.tsx` for the Goal 7 approved section inventory and source-semantic rail.
- Kept `CompanyEditorialBrief` as a composition-only render component receiving prepared `CompanyEditorialBriefViewModel` props and delegating `approvedSections` / `sources` to the new component.
- Preserved the existing `/?company=CODE` route behavior; no `/companies/[code]` route or link was added in this slice.
- Preserved Goal 7 approved section labels, `AI-derived`, `checked-in evidence`, `checked-in market data`, `partial` / `empty` guardrail copy, source freshness text, and recommendation semantics.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.3 guardrails proving the extracted component boundary does not fetch, import checked-in JSON, build view models, or introduce `/companies/[code]`.

**Verification:**
- `npm test -- --test-name-pattern "Goal 7|company editorial brief|section inventory"` → 152/152 passing under Node test filtering behavior.
- `npm test` → 152/152 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with production `npm run start -- --port 3048` → company detail renders the Human Editorial brief, approved section inventory, `AI-derived`, `checked-in evidence`, `checked-in market data`, and `partial / empty` guardrail copy.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with `CompanyDetailTabs` shell before introducing canonical `/companies/[code]` routing.
- `src/app/page.tsx` still owns most company-detail rendering and data-loading effects.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-09 — Slice M1.4 CompanyDetailTabs shell extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/CompanyDetailTabs.tsx` for the company detail tab-button shell and exported `CompanyDetailTab` / `COMPANY_DETAIL_TABS` from that boundary.
- Moved the existing tab labels and pill-button styling semantics out of `src/app/page.tsx` without rewriting dense section contents.
- Kept active tab state owned by the existing company detail page (`detailTab` / `setDetailTab`) and passed it into the extracted shell via `activeTab` / `onTabChange` props.
- Preserved the existing `/?company=CODE` route behavior; no `/companies/[code]` route or link was added in this slice.
- Preserved existing tab labels, button active/inactive styling, section content rendering order, Goal 7 Human Editorial brief, approved-section labels, source/freshness/confidence labels, fallback text, and recommendation semantics.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.4 guardrails proving tab labels remain, route behavior is unchanged, the extracted shell does not fetch/import checked-in JSON/build view models, and `CompanyEditorialBrief` / `CompanySectionInventory` remain before dense tab modules.

**Verification:**
- `npm test -- --test-name-pattern "Goal 7|company editorial brief|section inventory|company detail tabs"` → 153/153 passing under Node test filtering behavior.
- `npm test` → 153/153 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with production `npm run start -- --port 3048` → company detail renders the Human Editorial brief first, then the extracted tabs shell with `基本資料`, `產業分析`, `籌碼分析`, `技術分析`, `相關新聞`, `研究圖表`, followed by the existing overview content.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction by moving the overview tab content into a render-only component without changing copy, labels, source semantics, or tab behavior.
- `src/app/page.tsx` still owns dense company-detail tab contents and data-loading effects.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-09 — Slice M1.5 CompanyOverviewTab shell extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/CompanyOverviewTab.tsx` for the overview tab's `財務數據` / `重大資訊` sub-tab shell.
- Removed the inline `OverviewTabContent` function from `src/app/page.tsx` and replaced it with `<CompanyOverviewTab>` receiving prepared render slots for the existing financial overview panels and major-news panel.
- Kept financial panel JSX, major-news fetch behavior, `revenueTab` state ownership, dense tab contents, Goal 7 Human Editorial brief, `CompanySectionInventory`, `CompanyDetailTabs`, and active company route behavior unchanged.
- Preserved `/?company=CODE`; no `/companies/[code]` route or link was added in this slice.
- Preserved overview copy and labels including `財務數據`, `重大資訊`, company info, `最新財務概況`, `股利政策`, `營收分析趨勢`, `獲利能力趨勢`, and `重大訊息公告`.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.5 guardrails proving the overview shell boundary does not fetch, import checked-in JSON, build view models, import app/data modules, or introduce `/companies/[code]`; it also verifies `CompanyEditorialBrief` / `CompanySectionInventory` remain before dense tab modules.

**Verification:**
- `npm test -- --test-name-pattern "Goal 7|company editorial brief|section inventory|company detail tabs|overview tab"` → 154/154 passing under Node test filtering behavior.
- `npm test` → 154/154 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard search across `src/` found only the pre-existing `/companies/${input.companyCode}` reference in `src/lib/productNavigation.ts`; no new `/companies/[code]` route/link was introduced by this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run dev -- --hostname 127.0.0.1 --port 3048` → company detail renders the Human Editorial brief first, approved source rail, extracted tab shell, overview sub-tabs `財務數據` / `重大資訊`, and existing overview financial modules.
- Browser console after smoke check → 0 JS errors; only React DevTools/HMR informational messages.

**Remaining:**
- Continue M1 company-detail extraction with the next dense overview sub-panel or remaining tab content slice; keep behavior-preserving extraction only.
- `src/app/page.tsx` still owns many overview sub-panels (`CompanyInfoHeader`, `FinancialOverviewCards`, `DividendPolicyPanel`, `RevenueAnalysisPanel`, `ProfitabilityAnalysisPanel`) and other dense tab contents.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-09 — Slice M1.6 CompanyInfoHeader extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/CompanyInfoHeader.tsx` as a render-only company identity/header component for the overview financial slot.
- Removed the inline `CompanyInfoHeader` function from `src/app/page.tsx` and imported/rendered the extracted component with the existing prepared `data` prop.
- Preserved existing company identity copy and labels: `市值`, `產業分類`, `成立年份`, `董事長`, `總部`, `官方網站`, company name/code rendering, market-cap fallback, ROC/CE established-year formatting, headquarters `N/A` fallback, and website display/link behavior.
- Kept `CompanyEditorialBrief`, `CompanySectionInventory`, `CompanyDetailTabs`, `CompanyOverviewTab`, dense overview panels, data loading, recommendation semantics, source/freshness/confidence labels, and `/?company=CODE` route behavior unchanged.
- Preserved `/?company=CODE`; no `/companies/[code]` route or link was added in this slice.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.6 guardrails proving the extracted header does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the Human Editorial brief and section inventory remain before dense modules and the company info header still precedes financial overview cards.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "Goal 7|company editorial brief|section inventory|company detail tabs|overview tab|company info header"` failed because `src/components/company-detail/CompanyInfoHeader.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "Goal 7|company editorial brief|section inventory|company detail tabs|overview tab|company info header"` → 155/155 passing under Node test filtering behavior.
- `npm test` → 155/155 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard search across `src/` found only the pre-existing `/companies/${input.companyCode}` reference in `src/lib/productNavigation.ts`; no new `/companies/[code]` route/link was introduced by this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run dev -- --hostname 127.0.0.1 --port 3048` → company detail renders Human Editorial brief/source rail, tabs, overview sub-tabs, and extracted company info header with 台積電 identity labels/website before financial overview cards.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with the next dense overview sub-panel; keep behavior-preserving extraction only.
- `src/app/page.tsx` still owns `FinancialOverviewCards`, `DividendPolicyPanel`, `RevenueAnalysisPanel`, `ProfitabilityAnalysisPanel`, and other dense tab contents.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.7 FinancialOverviewCards extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/FinancialOverviewCards.tsx` as a render-only financial overview-card component for the overview financial slot.
- Removed the inline `FinancialOverviewCards` function from `src/app/page.tsx` and imported/rendered the extracted component with the existing prepared `data` prop.
- Preserved existing financial overview copy and labels: `最新財務概況`, `季營收`, `市值`, `本益比`, `股價淨值比`, `毛利率`, `營益率`, `淨利率`, and `EPS`.
- Preserved the existing period-label, YoY fallback, market-cap fallback, valuation suffix, margin calculation, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.7 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the overview order remains `CompanyInfoHeader` → `FinancialOverviewCards` → `DividendPolicyPanel`.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.7"` failed because `src/components/company-detail/FinancialOverviewCards.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.7"` → 156/156 passing under Node test filtering behavior.
- `npm test` → 156/156 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard search across `src/` found only the pre-existing `/companies/${input.companyCode}` reference in `src/lib/productNavigation.ts`; no new `/companies/[code]` route/link was introduced by this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run dev -- --hostname 127.0.0.1 --port 3048` → company detail renders Human Editorial brief/source rail, tabs, overview sub-tabs, extracted company info header, extracted financial overview cards, and the following dividend/revenue modules.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with `DividendPolicyPanel`; keep behavior-preserving extraction only.
- `src/app/page.tsx` still owns `DividendPolicyPanel`, `RevenueAnalysisPanel`, `ProfitabilityAnalysisPanel`, and other dense tab contents.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.8 DividendPolicyPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/DividendPolicyPanel.tsx` as a render-only dividend policy component for the overview financial slot.
- Removed the inline `DividendPolicyPanel` function from `src/app/page.tsx` and imported/rendered the extracted component with the existing prepared `data` prop.
- Preserved existing dividend copy and labels: `股利政策`, `配息頻率: 季`, `歷年股利發放`, `最新現金股利`, `所屬年度`, `現金股利`, `股票股利`, `合計股利`, `股利年度`, and `📋 歷年股利資料準備中`.
- Preserved existing dividend-history chart/table behavior, ROC-year display, current-cash fallback, dividend-year fallback, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.8 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the overview order remains `FinancialOverviewCards` → `DividendPolicyPanel` → `RevenueAnalysisPanel`.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.8"` failed because `src/components/company-detail/DividendPolicyPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.8"` → 157/157 passing under Node test filtering behavior.
- `npm test` → 157/157 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard search across `src/` found only the pre-existing `/companies/${input.companyCode}` reference in `src/lib/productNavigation.ts`; no new `/companies/[code]` route/link was introduced by this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run dev -- --hostname 127.0.0.1 --port 3048` → company detail renders Human Editorial brief/source rail, tabs, overview sub-tabs, extracted company info header, extracted financial overview cards, extracted dividend policy panel, and the following revenue module.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with `RevenueAnalysisPanel`; keep behavior-preserving extraction only.
- `src/app/page.tsx` still owns `RevenueAnalysisPanel`, `ProfitabilityAnalysisPanel`, and other dense tab contents.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.9 RevenueAnalysisPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/RevenueAnalysisPanel.tsx` as a render-only revenue analysis component for the overview financial slot.
- Moved the coupled `RevenueComposedChart` helper into the extracted component so monthly/quarterly revenue charts stay co-located with the revenue panel.
- Removed the inline `RevenueAnalysisPanel` and `RevenueComposedChart` functions from `src/app/page.tsx` and imported/rendered the extracted component with the existing prepared `data`, `revenueTab`, and `setRevenueTab` props.
- Preserved existing revenue copy and labels: `營收分析趨勢`, `月份`, `季度`, `年度`, `營收（元→億）`, `MoM`, `YoY`, `QoQ`, `年度YoY%`, `📋 月營收資料累積中`, `📋 季度資料累積中`, and `📋 年度資料準備中`.
- Preserved existing monthly/quarterly/yearly tab behavior, revenue formatting, quarter/month labels, YoY/QoQ/MoM calculations, chart/table behavior, empty states, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.9 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the overview order remains `DividendPolicyPanel` → `RevenueAnalysisPanel` → `ProfitabilityAnalysisPanel`.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.9"` failed because `src/components/company-detail/RevenueAnalysisPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.9"` → 158/158 passing under Node test filtering behavior.
- `npm test` → 158/158 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard search across `src/` found only the pre-existing `/companies/${input.companyCode}` reference in `src/lib/productNavigation.ts`; no new `/companies/[code]` route/link was introduced by this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run dev -- --hostname 127.0.0.1 --port 3048` → company detail renders Human Editorial brief/source rail, tabs, overview sub-tabs, extracted company info header, extracted financial overview cards, extracted dividend policy panel, extracted revenue analysis panel, and the following profitability module.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with `ProfitabilityAnalysisPanel`; keep behavior-preserving extraction only.
- `src/app/page.tsx` still owns `ProfitabilityAnalysisPanel` and other dense tab contents.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.10 ProfitabilityAnalysisPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/ProfitabilityAnalysisPanel.tsx` as a render-only profitability analysis component for the overview financial slot.
- Moved the coupled `ProfitabilityQuarterlyView` and `ProfitabilityChartAndTable` helpers into the extracted component so margin/EPS chart and table rendering stay co-located with the profitability panel.
- Removed the inline `ProfitabilityAnalysisPanel`, `ProfitabilityQuarterlyView`, and `ProfitabilityChartAndTable` functions from `src/app/page.tsx` and imported/rendered the extracted component with the existing prepared `data`, `profitTab`, and `setProfitTab` props.
- Preserved existing profitability copy and labels: `獲利能力趨勢`, `季度`, `年度`, `毛利率`, `營益率`, `淨利率`, `EPS`, and `📋 季度資料累積中`.
- Preserved existing quarterly/yearly tab behavior, ROC quarter label formatting, yearly aggregation, chart/table behavior, empty state, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.10 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the overview order remains `RevenueAnalysisPanel` → `ProfitabilityAnalysisPanel`.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.10"` failed because `src/components/company-detail/ProfitabilityAnalysisPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.10"` → 159/159 passing under Node test filtering behavior.
- `npm test` → 159/159 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard remains unchanged: canonical company detail behavior stays on `/?company=CODE`; `/companies/[code]` remains deferred to M2.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run start -- --hostname 127.0.0.1 --port 3048` → company detail renders Human Editorial brief/source rail, tabs, overview sub-tabs, extracted company info header, extracted financial overview cards, extracted dividend policy panel, extracted revenue analysis panel, and extracted profitability analysis panel.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with the next dense tab/content boundary after the overview financial sub-panels; keep behavior-preserving extraction only.
- `src/app/page.tsx` still owns other dense tab contents and shared helper duplication remains intentionally deferred until a named helper-consolidation slice.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.11 BatchAnalysisPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/BatchAnalysisPanel.tsx` as a render-only batch-analysis card component shared by the chips and technical tabs.
- Removed the inline `BatchAnalysisPanel` function from `src/app/page.tsx` and imported/rendered the extracted component at the existing chips and technical analysis call sites.
- Preserved existing analysis copy and labels: `規則式判讀`, `正向訊號`, `風險訊號`, `觀察重點`, `暫無明顯訊號`, `即時計算`, `🧠 籌碼收盤後判讀`, and `📊 技術分析判讀`.
- Preserved existing score-tone behavior, generated-at display, optional description override, empty list fallback, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.11 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies chips and technical batch cards stay inside their existing tab boundaries.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.11"` failed because `src/components/company-detail/BatchAnalysisPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.11"` → 160/160 passing under Node test filtering behavior.
- `npm test` → 160/160 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard search across `src/` found only the pre-existing `/companies/${input.companyCode}` reference in `src/lib/productNavigation.ts`; no new `/companies/[code]` route/link was introduced by this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run start -- --port 3048` → company detail renders Human Editorial brief/source rail, tabs, overview financial modules, and the extracted `BatchAnalysisPanel` in the chips tab (`🧠 籌碼收盤後判讀`).
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with a boundary that can stay behavior-preserving and reviewable; likely next candidates are a render-only `TechnicalNextSessionPanel` or a carefully separated news/major-news split.
- `NewsTabContent` and `DynamicMajorNewsPanel` still own client-side API fetches, so they should not be treated as render-only presentational components unless split into container + render panel in a named slice.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.12 TechnicalNextSessionPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/TechnicalNextSessionPanel.tsx` as a render-only technical next-session card for the technical-analysis tab.
- Removed the inline `🎯 明日觀察與盤中觸發條件` JSX block from `src/app/page.tsx` and imported/rendered the extracted component with the existing prepared `resolvedDailyAnalysis.nextSession` prop.
- Preserved existing copy and labels: `🎯 明日觀察與盤中觸發條件`, `觀察重點`, and `觸發條件`.
- Preserved existing list rendering, `focus` / `triggerRules` data ownership, technical-tab ordering, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.12 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the next-session panel still follows the technical `BatchAnalysisPanel` and precedes the news tab.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.12"` failed because `src/components/company-detail/TechnicalNextSessionPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.12"` → 161/161 passing under Node test filtering behavior.
- `npm test` → 161/161 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run start -- --port 3048` → company detail renders Human Editorial brief/source rail, tabs, technical tab, `📊 技術分析判讀`, and extracted `🎯 明日觀察與盤中觸發條件` with `觀察重點` / `觸發條件`.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with the next behavior-preserving boundary.
- Avoid treating `NewsTabContent` / `DynamicMajorNewsPanel` as render-only because they own `useState`, `useEffect`, and `/api/*` fetches; split container + presentational panel in a named slice if tackling news next.
- Inspect whether the legacy inline `ProfitabilityTrendPanel` is still referenced before deciding whether to extract, retire, or defer it.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.13 ChipValuationSnapshotPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/ChipValuationSnapshotPanel.tsx` as a render-only valuation/debt snapshot component for the chips tab.
- Removed the inline chips-tab valuation card and local `StatItem` helper from `src/app/page.tsx`, replacing them with `<ChipValuationSnapshotPanel data={data} />`.
- Preserved existing chips copy and labels: `🎰 籌碼分析`, `本益比 (P/E)`, `股價淨值比 (P/B)`, `現金殖利率`, and `負債比`.
- Preserved existing P/E/P/B suffix behavior, dividend-yield percent display, debt-ratio calculation, chips-tab ordering, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.13 guardrails proving the extracted component does not fetch, import checked-in JSON, build view models, import app/data modules, call API routes, or introduce `/companies/[code]`; it also verifies the chips snapshot still precedes the chips `BatchAnalysisPanel` and institutional trend section.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.13"` failed because `src/components/company-detail/ChipValuationSnapshotPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.13"` → 162/162 passing under Node test filtering behavior.
- `npm test` → 162/162 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard across changed files found no `/companies/[code]`, `/companies/${...}`, or new `/companies` href string in this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run start -- --port 3048` → company detail renders Human Editorial brief/source rail, tabs, chips tab, extracted `🎰 籌碼分析` card with `本益比 (P/E)`, `股價淨值比 (P/B)`, `現金殖利率`, `負債比`, followed by `🧠 籌碼收盤後判讀`.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with a named container/presentational split for news or another safe render-only boundary.
- Avoid moving `NewsTabContent` / `DynamicMajorNewsPanel` as a single render-only component because they own `useState`, `useEffect`, and `/api/*` fetches.
- Inspect whether the legacy inline `ProfitabilityTrendPanel` is still referenced before deciding whether to extract, retire, or defer it.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

### 2026-06-10 — Slice M1.14 MajorNewsListPanel extraction

**Status:** Done.

**Changed:**
- Added `src/components/company-detail/MajorNewsListPanel.tsx` as a render-only presentational component for the major-news card/list inside the overview `重大資訊` sub-tab.
- Kept `DynamicMajorNewsPanel` in `src/app/page.tsx` as the state/effect/fetch container for `/api/major-news`, then delegated prepared `majorNews`, `loading`, `error`, `source`, and `fetchedAt` props to the extracted panel.
- Preserved existing major-news copy and labels: `📋 重大訊息公告`, `即時查詢公開資訊觀測站中...`, `資料來源：`, `⏳ 載入重大訊息中...`, and the honest empty-state copy telling users to use 公開資訊觀測站 as source of truth.
- Preserved local-snapshot fallback behavior, source/fetched-at display, 15-row cap, row source badges, overview `重大資訊` sub-tab behavior, and `/?company=CODE` route behavior.
- Updated `src/lib/companyDetailUi.test.ts` with Slice M1.14 guardrails proving the new component is presentational-only: no `useState`, no `useEffect`, no `fetch`, no checked-in JSON import, no view-model building, no app/data imports, no API route calls, and no `/companies/[code]` route/link introduction.

**Verification:**
- Initial focused RED check: `npm test -- --test-name-pattern "M1.14"` failed because `src/components/company-detail/MajorNewsListPanel.tsx` did not exist yet.
- Focused post-extraction check: `npm test -- --test-name-pattern "M1.14"` → 163/163 passing under Node test filtering behavior.
- `npm test` → 163/163 passing.
- `npm run build` → passing; pre-existing Next.js workspace-root and edge-runtime warnings remain.
- Route guard across changed files found no `/companies/[code]`, `/companies/${...}`, or new `/companies` href string in this slice.
- Browser smoke `http://127.0.0.1:3048/?company=2330` with `npm run start -- --port 3048` → company detail renders Human Editorial brief/source rail, overview `重大資訊` sub-tab, extracted `📋 重大訊息公告`, `資料來源：local snapshot`, fetched-at copy, and snapshot major-news rows.
- Browser console after smoke check → 0 JS errors/messages.

**Remaining:**
- Continue M1 company-detail extraction with the related-news list presentational split or another safe behavior-preserving boundary.
- Keep `/api/news` fetch/state inside `NewsTabContent` unless a named container/presentational split moves only the render card/list.
- Inspect whether the legacy inline `ProfitabilityTrendPanel` is still referenced before deciding whether to extract, retire, or defer it.
- Existing `/companies` overview route remains, but canonical `/companies/[code]` is intentionally deferred to M2.

## Recommended operating rule from now on

After each goal-run:

1. Update this ledger.
2. Include exact verification commands and browser smoke URL.
3. Mark whether the goal is Done or Partial.
4. Record remaining risks and the next smallest suggested slice.
5. Prefer committing a checkpoint after tests/build/browser smoke pass.
