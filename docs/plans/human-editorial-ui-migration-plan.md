# Human Editorial UI Architecture Migration Plan

## Status

Approved planning slice. App code must not change in this slice.

## Updated

2026-06-09 20:46 CST

## Purpose

Turn the previously approved Human Editorial UI direction into an executable component and view-model migration roadmap. The migration exists because the Daily Industry Intelligence UI now has evidence-backed semantics, tests, and checkpoints, but major route files still contain too many responsibilities:

- `src/app/page.tsx` — 4,178 lines.
- `src/app/daily-report/page.tsx` — 1,469 lines.
- `src/app/topics/[id]/page.tsx` — 294 lines.

The goal is not to redesign the product again. The goal is to move the existing approved behavior into durable architecture without changing data semantics, recommendation rules, or route behavior until each change is explicitly planned and verified.

## Source documents

This migration must preserve the requirements in:

- `docs/daily-industry-intelligence-spec-index.md`
- `docs/daily-analysis-v2-system-design-spec.md`
- `docs/design-system/daily-industry-intelligence-DESIGN.md`
- `docs/plans/daily-analysis-v2-implementation-plan.md`
- `docs/plans/goal-driven-website-completion.md`
- `docs/plans/daily-analysis-v2-goal-status.md`

The approved product flow remains:

`Daily Focus → Topic Overview → Industry Chain Map → Company Detail → Evidence / Sources`

The evidence chain remains:

`daily event → topic → value-chain stage → company role → company detail → evidence/source`

## Migration mode

This plan defines **Human Editorial UI Architecture Migration mode**, which is different from feature vertical-slice mode.

### In feature vertical-slice mode

- Add one new verified product capability.
- Use spec-first and TDD.
- Keep unrelated refactors out.
- Goal examples: Goal 8 Topic AI Analysis UI, Goal 9 Automation integration.

### In Human Editorial UI Architecture Migration mode

- Move existing approved behavior into smaller components and view models.
- Preserve current rendering, copy, source semantics, URL behavior, and guardrails.
- Add or strengthen regression tests only to lock existing behavior.
- Do not add new product features unless a migration slice explicitly says so.
- Commit each extraction separately.

## Non-goals

This migration does **not** by itself authorize:

- Big-bang rewrite of all pages in one commit.
- Changing grade thresholds.
- Changing A/B/C/D/F recommendation semantics.
- Showing D/F grades as recommendations.
- Inventing missing data, fake citations, fake stage IDs, or fake company bindings.
- Rewriting canonical product/topic-role/SWOT knowledge with AI.
- Adding paid/licensed research APIs.
- Moving all company navigation to `/companies/[code]` before compatibility is designed and verified.
- Implementing Goal 8 or Goal 9 inside behavior-preserving extraction slices.

## Current architecture problem

### `src/app/page.tsx`

Current role: app home surface plus company detail surface.

Observed responsibilities include:

- Product shell/home rendering.
- Company detail routing through `/?company=CODE`.
- Company identity/header rendering.
- Human Editorial company brief.
- Company detail tabs.
- Financial overview cards.
- Revenue/profitability/dividend panels.
- Chart components.
- News/event panels.
- Product, topic-role, SWOT, source semantics.
- Formatting helpers and market-data display helpers.
- Company role filtering and local data shaping.

Primary risk: future Goal 7 work or company-route work must edit a 4,000+ line client component, increasing regression and merge risk.

### `src/app/daily-report/page.tsx`

Current role: Daily Focus/Daily Report route.

Observed responsibilities include:

- Daily report loading and rendering.
- Human Editorial opening hero.
- Market thesis and today-story builders.
- Daily focus topic/company links.
- Candidate decision brief.
- Candidate cards and evidence modules.
- Source/freshness/quality status rendering.
- Strong-stock/technical/chip/ranking modules.
- Local formatting and status helpers.

Primary risk: Daily Report V2 view-model work and UI polish will keep adding page-local logic instead of reusable report components.

### `src/app/topics/[id]/page.tsx`

Current role: topic detail and industry-chain surface.

Observed responsibilities include:

- Topic lookup/canonicalization.
- Industry chain staged lanes.
- Representative company cards.
- Show-all table mode through URL state.
- Narrative-only/insufficient stage labels.
- Topic events, risks, role/company loading.

Primary risk: Goal 8 Topic AI Analysis UI will add more responsibilities unless topic components and view models are defined first.

## Target architecture

### Directory structure

```txt
src/
  app/
    page.tsx                         # route orchestration only
    daily-report/page.tsx            # route orchestration only
    topics/[id]/page.tsx             # route orchestration only
    companies/[code]/page.tsx        # future canonical route after compatibility slice

  components/
    shared/
      editorial/
        EditorialPageShell.tsx
        EditorialSection.tsx
        EditorialCard.tsx
        EditorialHeader.tsx
        HumanThesis.tsx
        EvidenceStrip.tsx
        SourceBadge.tsx
        FreshnessBadge.tsx
        ConfidenceBadge.tsx
        EmptyState.tsx
        PartialState.tsx
        ShowAllLink.tsx

    company-detail/
      CompanyDetailPage.tsx
      CompanyEditorialBrief.tsx
      CompanyInfoHeader.tsx
      CompanySectionInventory.tsx
      CompanyDetailTabs.tsx
      CompanySourcesPanel.tsx
      CompanyProductsPanel.tsx
      CompanyTopicRolesPanel.tsx
      CompanySwotPanel.tsx
      FinancialOverviewCards.tsx
      CompanyCharts.tsx
      CompanyNewsEventsPanel.tsx

    daily-report/
      DailyReportPage.tsx
      DailyReportHero.tsx
      DailyFocusCard.tsx
      DailyCandidateDecisionBrief.tsx
      DailyCandidateCard.tsx
      DailyEvidenceStrip.tsx
      DailySourceStatusPanel.tsx
      DailyRankingsPanel.tsx

    topic-detail/
      TopicDetailPage.tsx
      TopicEditorialPanel.tsx
      TopicIndustryChainMap.tsx
      ValueChainStageLane.tsx
      TopicCompanyRoleCard.tsx
      TopicShowAllTable.tsx
      TopicResearchDirectionPanel.tsx
      TopicRisksPanel.tsx
      TopicSourcesPanel.tsx

  lib/
    view-models/
      companyDetailViewModel.ts
      companyEditorialBrief.ts
      companySourcesViewModel.ts
      dailyReportViewModel.ts
      dailyFocusViewModel.ts
      topicDetailViewModel.ts
      topicEditorialViewModel.ts
      industryChainUiViewModel.ts

    formatters/
      marketFormatters.ts
      financialFormatters.ts
      dateFormatters.ts
      sourceStatusFormatters.ts
```

### Boundary rules

- `src/app/**/page.tsx` files orchestrate route params/search params, load checked-in data, call view-model adapters, and render page-level components.
- `src/components/**` files render typed props. They should not read checked-in JSON directly.
- `src/lib/view-models/**` files convert contracts/adapters/data artifacts into UI-ready structures.
- `src/lib/formatters/**` files hold pure display formatting helpers.
- Existing `src/lib/*Context.ts`, `src/lib/dailyAnalysisV2*.ts`, and `src/lib/industryChainMap.ts` remain semantic foundations; view models should wrap them rather than duplicate them.

## Shared component contracts

### Shared editorial primitives

#### `EditorialPageShell`

Purpose: provide the warm paper/surface layout from the design system.

Acceptance:

- Uses the approved Human Editorial warm-neutral visual direction.
- Does not introduce generic AI-dashboard purple/glow styles.
- Keeps one semantic `h1` per page.

#### `EditorialSection`

Purpose: standard section wrapper for Daily Focus, Topic Detail, and Company Detail.

Acceptance:

- Has readable heading hierarchy.
- Supports optional kicker, summary, evidence strip, and actions.
- Keeps source metadata secondary unless it affects conclusions.

#### `EvidenceStrip`

Purpose: render source type, freshness, confidence, derived/official/manual state, and partial/insufficient warnings.

Acceptance:

- Never hides missing/stale source status.
- Does not dominate the first screen by default.
- Uses text labels, not only color.

#### `EmptyState` / `PartialState`

Purpose: deliberately render unavailable data without faking values.

Acceptance:

- Missing numeric data is never displayed as zero.
- Partial/insufficient state copy is explicit.
- Empty states remain accessible text content.

### Company detail components

#### `CompanyEditorialBrief`

Purpose: render the existing Goal 7 Human Editorial brief.

Inputs:

- Company identity.
- Daily change text.
- Long-term role text.
- Biggest risk text.
- Watch-next text.
- Source semantics / evidence labels.

Acceptance:

- Existing `/?company=2330` smoke still shows the same brief content.
- Copy and source semantics are unchanged in the extraction slice.
- Component renders before dense tab/evidence modules.

#### `CompanySectionInventory`

Purpose: make Goal 7 approved sections visible and testable.

Sections:

- Overview
- Daily AI Analysis
- Fundamentals
- Technicals
- Chip / Ownership
- News / Events
- Products
- Topic Roles
- SWOT
- Sources

Acceptance:

- Inventory labels remain aligned with `docs/daily-analysis-v2-system-design-spec.md` and the design system.
- Inventory is not a substitute for implementing the sections; it marks IA readiness.

#### `CompanySourcesPanel`

Purpose: dedicated evidence/source table for company detail.

Acceptance:

- Separates official market/company sources, checked-in evidence, derived mappings, and AI-derived summaries.
- Shows freshness/confidence/partial state per module.
- Does not claim unavailable source coverage.

### Daily report components

#### `DailyReportHero`

Purpose: render date, freshness, market thesis, and today-story opening.

Acceptance:

- Page starts with a human-readable thesis, not a score wall.
- Thesis is derived from checked-in report/market fields.
- Insufficient report data renders partial-state copy instead of AI prose.

#### `DailyFocusCard`

Purpose: summarize one daily signal and link it into the product graph.

Acceptance:

- Links only to existing verified destinations.
- Uses `/?company=CODE` until canonical route compatibility is implemented.
- Shows stage unavailable/insufficient state when no verified `stageId` exists.
- Labels derived topic/company mappings.

#### `DailyCandidateDecisionBrief`

Purpose: show why-now, company role, risk, and watch-next before dense modules.

Acceptance:

- Built from typed existing fields.
- Appears before technical/fundamental/chip/industry evidence grid.
- Does not use AI prose as source truth.

### Topic detail components

#### `TopicEditorialPanel`

Purpose: future Goal 8 top-down topic synthesis from typed `TopicAnalysisContext`.

Acceptance:

- Shows current topic thesis, research direction, bottlenecks, direct/peripheral companies, and risks.
- Labels AI-derived and research-direction text as derived/contextual.
- Does not upgrade topic context into company recommendation truth.

#### `TopicIndustryChainMap`

Purpose: render the existing Goal 6 staged lane UI from the `IndustryChainMap` model.

Acceptance:

- Ordered stages are preserved.
- Each stage shows 3–6 representative verified companies by default.
- `show all` URL-state table fallback remains available.
- Narrative-only stages are explicitly labeled and do not create stock bindings.

#### `TopicShowAllTable`

Purpose: accessible/faceted fallback for large stage/company sets.

Acceptance:

- Supports URL state.
- Preserves future filters: directness, confidence, freshness, market lens.
- Is keyboard/screen-reader usable.

## View-model migration rules

### Pure and tested

Each view model must be pure and unit-tested before page wiring whenever it creates or changes user-visible semantics.

Examples:

- `buildCompanyEditorialBrief()` moves to `src/lib/view-models/companyEditorialBrief.ts` only with existing Goal 7 tests preserved or strengthened.
- Daily Report hero builders move to `src/lib/view-models/dailyFocusViewModel.ts` only with Daily Focus tests preserved or strengthened.
- Industry-chain UI shaping moves to `src/lib/view-models/industryChainUiViewModel.ts` only with stage ordering, de-duplication, representative caps, and narrative-only tests.

### No semantic rewrites during extraction

Behavior-preserving extraction slices may move code and add props, but must not change:

- Grade/tier semantics.
- Recommendation copy.
- Source/freshness/confidence labels.
- Missing/partial/insufficient fallback behavior.
- Link destinations.
- Data source priority.
- AI-derived vs checked-in evidence distinctions.

### View-model acceptance checklist

- Inputs and outputs are typed.
- Missing arrays normalize to empty arrays with partial/insufficient status.
- Missing numeric values remain unavailable, not zero.
- Derived mappings include source/provenance labels.
- D/F cannot be converted into recommendation language.
- Tests cover happy path and insufficient-data path.

## Route strategy

### Current route

Company detail currently uses:

- `/?company=CODE`

This is a real working deep link and must remain supported until a compatibility migration is complete.

### Future canonical route

Preferred canonical route:

- `/companies/[code]`

Rationale:

- Cleaner deep links from Daily Focus, Topic Detail, and Industry Chain Map.
- Enables route-level browser smoke per company.
- Separates homepage concerns from company-detail concerns.
- Makes `src/app/page.tsx` smaller and easier to reason about.

### Compatibility strategy

Do not switch links to `/companies/[code]` in extraction slices.

Migration order:

1. Extract company detail rendering into route-agnostic components while keeping `/?company=CODE`.
2. Add `/companies/[code]` route that reuses the same `CompanyDetailPage` component and view model.
3. Add regression tests that `/?company=2330` and `/companies/2330` render equivalent company identity, editorial brief, approved sections, and source semantics.
4. Update Daily Focus / Topic / Industry Chain links to prefer `/companies/[code]` only after the canonical route is verified.
5. Preserve `/?company=CODE` as compatibility until explicit removal is approved.

### Redirect decision

Initial implementation should **not** hard-redirect `/?company=CODE` to `/companies/[code]`. Keep both working first. Redirect/canonical metadata can be a later SEO/deployment decision.

## Migration order

### Phase M0 — Planning and governance

Status: this document.

Acceptance:

- Migration plan exists.
- Goal status ledger references the migration track.
- No app code changed.
- `npm test` and `npm run build` pass.

### Phase M1 — Company Detail extraction baseline

Reason: `src/app/page.tsx` is the largest file and Goal 7 still has the most remaining UI sections.

#### Slice M1.1 — Extract `CompanyEditorialBrief`

Files likely touched:

- Create: `src/components/company-detail/CompanyEditorialBrief.tsx`
- Modify: `src/app/page.tsx`
- Possibly modify: `src/lib/companyDetailUi.test.ts`
- Update: `docs/plans/daily-analysis-v2-goal-status.md`

Acceptance:

- No behavior, copy, data-source, or link changes.
- `/?company=2330` still renders the editorial brief before dense tabs.
- Approved section inventory and source semantics remain visible.
- `src/app/page.tsx` loses the brief JSX responsibility.

Verification:

- `npm test`
- `npm run build`
- Browser smoke `http://127.0.0.1:3048/?company=2330`
- Browser console check: 0 JS errors.

#### Slice M1.2 — Move `buildCompanyEditorialBrief()` to view model

Files likely touched:

- Create: `src/lib/view-models/companyEditorialBrief.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/lib/companyDetailUi.test.ts` or create focused view-model test.

Acceptance:

- Existing Goal 7 behavior unchanged.
- Happy path and insufficient-data path tested.
- UI component receives prepared view-model props.

Verification:

- `npm test -- --test-name-pattern "Goal 7|company editorial brief"`
- `npm test`
- `npm run build`
- Browser smoke `/?company=2330`.

#### Slice M1.3 — Extract `CompanySectionInventory` and source-semantic rail

Acceptance:

- Approved sections remain visible.
- `AI-derived`, `checked-in evidence`, partial/empty guardrails remain visible.
- Source semantics do not become recommendation copy.

#### Slice M1.4 — Extract `CompanyDetailTabs` shell

Acceptance:

- Active tab behavior remains unchanged.
- Existing tab labels still render.
- No section content is rewritten.

#### Slice M1.5 — Add route-compatible `CompanyDetailPage` component

Acceptance:

- `src/app/page.tsx` delegates company detail rendering to `CompanyDetailPage`.
- Route behavior remains `/?company=CODE` only in this slice.
- No `/companies/[code]` route yet.

### Phase M2 — Canonical company route

Depends on M1 route-agnostic component extraction.

#### Slice M2.1 — Add `/companies/[code]` route using existing component

Acceptance:

- `/companies/2330` renders equivalent company identity, editorial brief, sections, and source semantics as `/?company=2330`.
- `/?company=2330` still works.
- No link migration yet.

Verification:

- `npm test`
- `npm run build`
- Browser smoke `/?company=2330`
- Browser smoke `/companies/2330`

#### Slice M2.2 — Update internal company links to canonical route

Acceptance:

- Daily Focus and Topic/Industry links prefer `/companies/[code]`.
- Compatibility `/?company=CODE` remains working.
- Tests lock link targets.

### Phase M3 — Daily Report extraction baseline

Reason: `src/app/daily-report/page.tsx` remains a large page and Goal 5 still needs view-model boundary cleanup.

#### Slice M3.1 — Extract `DailyReportHero`

Acceptance:

- Market thesis and today-story order unchanged.
- Partial/insufficient states unchanged.
- Hero remains before metric/evidence modules.

#### Slice M3.2 — Move Daily Focus hero builders to view model

Acceptance:

- `buildMarketThesis()` and `buildTodayStory()` are pure tested view-model functions.
- They derive only from checked-in data.
- Insufficient event/report state is tested.

#### Slice M3.3 — Extract `DailyFocusCard`

Acceptance:

- Topic/company links unchanged.
- Stage-unavailable guardrail unchanged.
- Derived mapping labels remain visible.

#### Slice M3.4 — Extract `DailyCandidateDecisionBrief`

Acceptance:

- Decision brief appears before dense evidence modules.
- Why-now/company-role/risk/watch-next are unchanged.

### Phase M4 — Topic Detail / Industry Chain extraction baseline

Reason: Goal 8 should not be added to a route file that still owns all chain rendering details.

#### Slice M4.1 — Extract `TopicIndustryChainMap` and `ValueChainStageLane`

Acceptance:

- Stage ordering unchanged.
- Representative company cap unchanged.
- Narrative-only copy unchanged.
- `?stage=...&view=all` still works.

#### Slice M4.2 — Extract `TopicShowAllTable`

Acceptance:

- Show-all table stays URL-state driven.
- Future filters have a defined prop boundary.
- Keyboard/table semantics are preserved.

#### Slice M4.3 — Move topic page UI shaping to view model

Acceptance:

- Topic detail page receives a typed topic-detail UI view model.
- Existing industry-chain tests still pass.
- Narrative-only and no-fake-company guardrails are tested.

### Phase M5 — Goal 8 Topic AI Analysis UI

Only after M4 has created stable topic component/view-model boundaries.

Acceptance:

- Topic-level editorial panel uses typed `TopicAnalysisContext` and research direction.
- Direct/peripheral company roles and risks are explicit.
- Research direction remains contextual and cannot create company recommendation truth.
- Browser smoke `/topics/ai-server` and one memory topic.

### Phase M6 — Shared primitives consolidation

Can happen opportunistically after at least two page families use similar patterns.

Acceptance:

- Shared `EvidenceStrip`, source badges, partial states, and editorial card wrappers replace duplicated local copies.
- Regression tests prevent reintroducing one-off AI-dashboard visual patterns where practical.
- No app route changes are bundled with visual primitive extraction unless required.

## Verification gates

### Required for docs-only migration planning slices

- `npm test`
- `npm run build`
- No browser smoke required if app code did not change.
- Commit docs separately.

### Required for behavior-preserving component extraction slices

- Focused source-level regression test where one exists or can be added cheaply.
- `npm test`
- `npm run build`
- Browser smoke of affected route.
- Browser console check: 0 JS errors.
- Ledger update with exact commands and URL.
- Commit the slice.

### Required for route strategy slices

- `npm test`
- `npm run build`
- Browser smoke old and new routes.
- Source-level tests for link targets.
- Compatibility behavior documented in ledger.

### Required for future feature slices after migration baseline

- RED test before implementation.
- App code limited to the specific goal/slice.
- Browser smoke route(s) listed in the goal plan.
- Ledger update.

## Acceptance criteria for successful migration

The migration track is considered complete when:

- `src/app/page.tsx` is route orchestration and no longer owns company detail internals.
- `src/app/daily-report/page.tsx` is route orchestration and no longer owns Daily Focus hero/card/decision-brief internals.
- `src/app/topics/[id]/page.tsx` is route orchestration and no longer owns stage-lane/table internals.
- Company detail has reusable components for editorial brief, tabs, source panel, products, topic roles, SWOT, and evidence metadata.
- Daily Report has reusable components for hero, focus cards, candidate decision brief, candidate cards, and source status.
- Topic Detail has reusable components for topic editorial panel, industry-chain map, stage lanes, company role cards, show-all table, risks, research direction, and sources.
- View models are pure and tested for source semantics, partial/insufficient states, derived labels, and D/F recommendation blocking.
- `/?company=CODE` remains supported or has an explicitly approved deprecation/redirect plan.
- `/companies/[code]` exists and is verified before internal links migrate to it.
- All migration slices have test/build/browser-smoke evidence in `docs/plans/daily-analysis-v2-goal-status.md`.

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Behavior changes hidden inside refactor | Users see changed recommendations or broken trust labels | Behavior-preserving slices only; browser smoke and source-level tests before commit |
| Big-bang rewrite creates unreviewable diff | Regression source becomes unknowable | One component/view-model extraction per slice |
| Canonical route breaks existing links | Existing `/?company=CODE` references fail | Keep compatibility route until `/companies/[code]` is verified and link migration is separate |
| View models duplicate semantic logic | Source semantics diverge between pages | Wrap existing contracts/adapters; do not fork grading/source rules |
| Source metadata becomes visually dominant again | UI regresses into machine-status dashboard | Use shared EvidenceStrip as secondary metadata; Human Editorial hierarchy first |
| Partial data looks confident | User trust breaks | Empty/partial components mandatory; missing numeric data never rendered as zero |
| Goal 8 added before topic extraction | Topic route becomes another monolith | Finish M4 baseline before Goal 8 implementation |

## Next recommended implementation slice

**Slice M1.1 — Extract `CompanyEditorialBrief` component without behavior change.**

Reason:

- It is the smallest high-value extraction from the largest file.
- It preserves Goal 7 behavior while beginning the architecture migration.
- It creates the first reusable component boundary for future `/companies/[code]` work.

Suggested `/goal` wording:

```text
⊙ Work in /Users/yenlunhsu/.hermes/industry-map-site.
Follow all Daily Industry Intelligence specs, design docs, implementation plan, goal plan, goal status ledger, and docs/plans/human-editorial-ui-migration-plan.md.
Work in Human Editorial UI Architecture Migration mode.
Implement Slice M1.1 only: Extract CompanyEditorialBrief from src/app/page.tsx into src/components/company-detail/CompanyEditorialBrief.tsx without behavior change.
Do not add new Goal 7 features, Goal 8, Goal 9, or /companies/[code].
Verify with npm test, npm run build, browser smoke /?company=2330, and console check.
Update docs/plans/daily-analysis-v2-goal-status.md and commit the slice.
Return what changed, tests run, browser smoke, remaining risks, and next suggested slice.
```
