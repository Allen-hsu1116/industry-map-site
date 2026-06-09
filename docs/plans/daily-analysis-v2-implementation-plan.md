# Daily Analysis V2 Implementation Plan

> **For Hermes:** Do not implement until the user approves this plan. When approved, execute task-by-task with TDD and small commits.

**Goal:** Rebuild the product around an evidence-backed industry-intelligence workflow. Daily Analysis uses the approved Human Editorial direction, but it must connect into a broader aistockmap-style system: daily focus → topic overview → industry chain map → company detail → evidence/source.

**Architecture:** Add typed contracts and view-model adapters first, then build scoring/gating logic, then wire Daily Report / Topic / Industry Map / Company UI. External research is a contextual input with source constraints, not a primary source of company truth.

**Tech Stack:** Next.js / React / TypeScript, checked-in JSON artifacts under `public/data`, Node scripts, existing `node --import tsx --test src/lib/*.test.ts`, ESLint, static export-friendly pages.

---

## Phase 0 — Approval Gate

### Task 0.1: User review of spec and UI mock

**Objective:** Confirm product semantics, visual direction, and source boundaries before implementation.

**Files:**
- Review: `docs/daily-analysis-v2-system-design-spec.md`
- Review: `docs/plans/daily-analysis-v2-implementation-plan.md`
- Review: `sketches/001-daily-analysis-v2-command-center/index.html`

**Acceptance:**
- User approves grade semantics A/B/C/D/F.
- User approves external research as directional context.
- User approves AI-assisted panels on Daily Report, Company, and Topic pages.
- User picked `sketches/002-daily-analysis-human-editorial/` as the main UI direction.
- User requested broader aistockmap-like IA: daily focus, whole industry chain map, and detailed company fundamental/technical/chip/news analysis.

**Verification:**
- No code implementation starts before this approval.

---

## Phase 1 — Contracts and source semantics

### Task 1.1: Add DailyAnalysisV2 schema types

**Objective:** Define the contract before implementing scoring or UI.

**Files:**
- Create/modify: `src/lib/dailyAnalysisV2.ts`
- Test: `src/lib/dailyAnalysisV2.test.ts`

**Acceptance:**
- Defines grade, tier, score domains, reasons, risks, source refs, and source status.
- Invalid grades/domains are rejected by normalizers.
- Missing optional context becomes empty arrays with insufficient status, not crashes.

**Verification:**
- `npm test -- --test-name-pattern "DailyAnalysisV2 schema"`

### Task 1.2: Add ResearchSignal contract

**Objective:** Support法人報告 / TrendForce-style direction without overclaiming.

**Files:**
- Create: `src/lib/researchSignals.ts`
- Test: `src/lib/researchSignals.test.ts`
- Data seed: `public/data/research-signals/index.json` or fixture only in first test slice

**Acceptance:**
- Public/licensed/manual/unavailable access semantics are explicit.
- Research can map to topics and companies but cannot create verified company topic roles.
- Missing URL is allowed only for manual/licensed notes with source name and date.

**Verification:**
- `npm test -- --test-name-pattern "ResearchSignal"`

### Task 1.3: Add StockKnowledgeRule adapter

**Objective:** Let Daily Analysis reference existing stock knowledge rules as reasoning context.

**Files:**
- Create/modify: `src/lib/stockKnowledgeRules.ts`
- Test: `src/lib/stockKnowledgeRules.test.ts`
- Existing data: inspect current stock-knowledge artifacts before final path choice

**Acceptance:**
- Rules are grouped by technical/chip/fundamental/industry/risk/position/market-regime.
- Analysis can attach 2–4 rules with source IDs.
- Missing rule files do not fail the whole report; they degrade source status.

**Verification:**
- `npm test -- --test-name-pattern "stock knowledge"`

---

## Phase 2 — View-model foundations

### Task 2.0: Build product IA route map and navigation contract

**Objective:** Define the app-level route/shell model before page implementation so Daily Analysis does not become an isolated screen.

**Files:**
- Create: `src/lib/productNavigation.ts`
- Test: `src/lib/productNavigation.test.ts`

**Acceptance:**
- Route map includes Daily Focus, Topic Overview, Industry Map, Company Database, Company Detail, Market/Ranking modules, and AI Analysis.
- Daily focus cards can link to topic IDs, industry-chain stage IDs, and company codes.
- Navigation labels describe scope clearly; no duplicate labels with different dataset scope.

**Verification:**
- `npm test -- --test-name-pattern "product navigation"`


### Task 2.1: Build company analysis context adapter

**Objective:** Merge daily signals, products, topic roles, SWOT, research signals, and stock knowledge into a single typed company context.

**Files:**
- Create: `src/lib/companyAnalysisContext.ts`
- Test: `src/lib/companyAnalysisContext.test.ts`

**Acceptance:**
- For a company, returns productContext, topicRoleContext, swotContext, researchContext, knowledgeRulesApplied, and sourceStatus.
- Partial products/roles/SWOT are visible as partial/insufficient.
- Topic role directness and confidence are preserved.

**Verification:**
- `npm test -- --test-name-pattern "company analysis context"`

### Task 2.2: Build topic analysis context adapter

**Objective:** Create a topic-level context for topic page AI-assisted analysis.

**Files:**
- Create: `src/lib/topicAnalysisContext.ts`
- Test: `src/lib/topicAnalysisContext.test.ts`

**Acceptance:**
- Returns value-chain stages, verified direct companies, peripheral companies, research direction, events, and common SWOT risks.
- Parent/child topic clustering is preserved.
- Derived event topic mappings are labeled derived.

**Verification:**
- `npm test -- --test-name-pattern "topic analysis context"`

### Task 2.3: Build industry chain map view model

**Objective:** Provide the aistockmap-like “whole industry chain” model for a topic/theme.

**Files:**
- Create: `src/lib/industryChainMap.ts`
- Test: `src/lib/industryChainMap.test.ts`

**Acceptance:**
- Returns ordered value-chain stages such as upstream → manufacturing → packaging/testing → equipment/materials → downstream demand when data exists.
- Each stage links to canonical topics and company roles.
- Narrative-only stages are explicitly labeled and do not invent company bindings.
- Company counts are de-duplicated across stage/topic bindings.

**Verification:**
- `npm test -- --test-name-pattern "industry chain map"`

---

## Phase 3 — Scoring and gating engine

### Task 3.1: Implement grade gating rules

**Objective:** Make A/B/C/D/F deterministic and testable.

**Files:**
- Modify: `src/lib/dailyAnalysisV2.ts`
- Test: `src/lib/dailyAnalysisV2.test.ts`

**Acceptance:**
- D/F cannot be emitted as `top_candidate` or `strong_watchlist`.
- Missing/stale market data caps grade at F or D according to severity.
- Missing product or verified topic role caps at C unless explicitly configured otherwise.
- Strong technical alone cannot produce A.

**Verification:**
- `npm test -- --test-name-pattern "grade gating"`

### Task 3.2: Implement score breakdown builder

**Objective:** Calculate transparent score components without hiding conflicts.

**Files:**
- Modify: `src/lib/dailyAnalysisV2.ts`
- Test: `src/lib/dailyAnalysisV2.test.ts`

**Acceptance:**
- Score domains include technical, chip, event, industryTopic, productRole, swotRisk, researchDirection, knowledgeRuleFit, dataQuality.
- Negative or conflicting reasons appear as risks, not silently netted away.
- Research direction contributes only context-level points and cannot override missing company evidence.

**Verification:**
- `npm test -- --test-name-pattern "score breakdown"`

---

## Phase 4 — Daily Report generation

### Task 4.1: Generate DailyAnalysisV2 artifacts

**Objective:** Generate V2 analysis JSON for priority companies from existing checked-in data.

**Files:**
- Create/modify: `scripts/generate-daily-analysis-v2.ts`
- Modify: `package.json`
- Output: `public/data/analysis-v2/{code}.json`
- Test: `src/lib/dailyAnalysisV2.test.ts`

**Acceptance:**
- Generates deterministic JSON when inputs do not change.
- Does not write timestamp-only churn as semantic change if no source data changed.
- Emits sourceStatus and grade/tier for every analyzed company.

**Verification:**
- `npm run analysis:daily-v2 -- --dry-run`
- `npm test -- --test-name-pattern "DailyAnalysisV2"`

### Task 4.2: Build Daily Report V2 view model

**Objective:** Convert V2 analysis artifacts into UI-ready tiers.

**Files:**
- Create: `src/lib/dailyReportV2.ts`
- Test: `src/lib/dailyReportV2.test.ts`

**Acceptance:**
- Separates A/B/C/D/F into visually distinct sections.
- D/F are observation/insufficient only.
- Includes Knowledge Applied summary and research-direction highlights.

**Verification:**
- `npm test -- --test-name-pattern "Daily Report V2"`

---

## Phase 5 — UI implementation after mock approval

### Task 5.1: Daily Report V2 UI slice

**Objective:** Render Daily Report using the approved Human Editorial direction.

**Files:**
- Modify: `src/app/daily-report/page.tsx`
- Possibly create: `src/components/daily-report-v2/*`
- Test: source-level UI regression in `src/lib/*.test.ts`

**Acceptance:**
- Page starts with a human-readable market thesis and “today’s story,” not a metric wall.
- A/B/C candidate cards read like concise analyst notes and show why now, company role, product context, SWOT risk, research context, and next watch points.
- Product/topic-role/SWOT/source evidence is behind expanders or compact evidence strips.
- Source status is present but not visually dominant unless it changes the conclusion.

**Verification:**
- `npm test`
- `npm run build`
- Browser smoke `/daily-report`

### Task 5.1b: Daily Focus → Topic/Company link slice

**Objective:** Make daily focus cards act as entry points into the broader product.

**Files:**
- Modify: `src/app/daily-report/page.tsx`
- Possibly create: `src/components/daily-focus/*`
- Test: source-level link checks

**Acceptance:**
- Each daily focus item links to related topic(s), industry-chain stage(s), and company detail where available.
- Derived mappings are labeled derived.
- Premium/unavailable or insufficient mapping states render as quiet metadata, not broken links.

**Verification:**
- `npm test`
- Browser smoke `/daily-report` link targets.

### Task 5.2: Company AI-assisted analysis panel

**Goal sequence mapping:** This task is the implementation-plan detail for **Goal 7 — Company Detail UI** in `docs/plans/goal-driven-website-completion.md`. Track completion status in `docs/plans/daily-analysis-v2-goal-status.md`.

**Objective:** Add company-page AI synthesis and detailed analysis tabs using typed contexts.

**Files:**
- Modify: company detail surface currently in `src/app/page.tsx` or extracted component path after inspection.
- Test: source-level checks and browser smoke.

**Acceptance:**
- Company page includes Overview, Daily AI Analysis, Fundamentals, Technical, Chip/Ownership, News/Events, Products, Topic Roles, SWOT, and Sources.
- Panel separates daily change, long-term role, risks, and watch points.
- Fundamental/technical/chip/news sections are labeled by data source and freshness.
- AI-derived badge and source refs are visible.

**Verification:**
- Browser smoke with selected company query.
- Console error check.

### Task 5.3: Topic AI-assisted analysis panel

**Goal sequence mapping:** This task is the implementation-plan detail for **Goal 8 — Topic AI Analysis UI** in `docs/plans/goal-driven-website-completion.md`. Track completion status in `docs/plans/daily-analysis-v2-goal-status.md`.

**Objective:** Add topic-level AI synthesis using topic context and research direction.

**Files:**
- Modify: `src/app/topics/[id]/page.tsx`
- Test: `src/lib/topicAnalysisContext.test.ts` plus source-level UI check.

**Acceptance:**
- Topic page shows AI-assisted top-down analysis, value-chain bottlenecks, verified direct companies, research direction, and topic risks.
- Derived mappings are labeled.

**Verification:**
- Browser smoke `/topics/ai-server` and one memory topic.

### Task 5.4: Industry Chain Map UI slice

**Goal sequence mapping:** This task is the implementation-plan detail for **Goal 6 — Industry Chain Map UI** in `docs/plans/goal-driven-website-completion.md`. Track completion status in `docs/plans/daily-analysis-v2-goal-status.md`.

**Objective:** Render aistockmap-like supply-chain structure without cloning its density.

**Files:**
- Create/modify: topic/industry map surface after route inspection.
- Create: `src/components/industry-chain/*`
- Test: source-level checks for stage labels and topic/company links.

**Acceptance:**
- Shows value-chain stages in order with short human explanations.
- Each stage lists canonical topics and representative verified company roles.
- Clicking a company opens company detail; clicking a topic filters/opens topic overview.
- Narrative-only/end-market stages are clearly labeled and not treated as stock bindings.

**Verification:**
- `npm test -- --test-name-pattern "industry chain"`
- `npm run build`
- Browser smoke one semiconductor topic.

---

## Phase 6 — Automation and governance

**Goal sequence mapping:** Phase 6 is the implementation-plan detail for **Goal 9 — Automation integration** in `docs/plans/goal-driven-website-completion.md`. Track completion status in `docs/plans/daily-analysis-v2-goal-status.md`.

### Task 6.1: Add research signal update workflow

**Objective:** Support manual/curated research direction updates without scraping copyrighted content blindly.

**Files:**
- Create: `scripts/validate-research-signals.ts`
- Modify: `package.json`
- Data: `public/data/research-signals/*.json`

**Acceptance:**
- Validates citation/date/access/scope/confidence.
- Rejects source-less research signals.
- Marks licensed/manual notes clearly.

**Verification:**
- `npm run research:validate`

### Task 6.2: Add V2 daily refresh integration

**Objective:** Add V2 analysis generation to the daily refresh sequence after source contracts are stable.

**Files:**
- Modify: `package.json`
- Modify existing daily refresh scripts only after dry-run behavior is proven.

**Acceptance:**
- Refresh order remains: market data → events → strong rankings → analysis v2 → report v2 → knowledge validation.
- No semantic no-op commits.
- Failures report module status.

**Verification:**
- `npm run data:daily-refresh -- --dry-run`
- `npm test`
- `npm run build`

---

## Phase Checkpoints

### Checkpoint A — after Phase 1
- Contracts are reviewed.
- Tests pass.
- No UI implementation yet.

### Checkpoint B — after Phase 3
- Grading behavior is deterministic.
- D/F gating is proven.
- Research cannot override missing company evidence.

### Checkpoint C — after Phase 5
- Daily Report, Company, and Topic pages show AI-assisted analysis.
- Browser smoke passes.
- User reviews actual UI before automation changes.

## Risks and mitigations

- **Risk:** External research licensing/copyright misuse. **Mitigation:** Store only citation + analyst summary unless source explicitly allows excerpts.
- **Risk:** AI prose overclaims. **Mitigation:** Generate from typed contexts, with badges and grade gates.
- **Risk:** UI becomes visually noisy. **Mitigation:** Tiered board, score chips, collapsed long explanations, clear color semantics.
- **Risk:** Data gaps produce false confidence. **Mitigation:** Missing evidence caps grade and renders insufficient states.
- **Risk:** Existing app has large monolithic homepage. **Mitigation:** Build adapters and components before UI extraction; keep slices small.

## Approval request

Implementation starts only after the user confirms:
- External research direction semantics.
- Stock knowledge integration semantics.
- UI mock direction.
- First implementation slice: contracts first, not UI first.
