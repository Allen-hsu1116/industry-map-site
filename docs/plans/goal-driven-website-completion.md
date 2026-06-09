# Goal-Driven Website Completion Guide

## Purpose
Use Hermes `/goal` to complete the Daily Industry Intelligence website through small, verifiable vertical slices.

## Source of Truth
Each goal-run should load and follow:
- `docs/daily-industry-intelligence-spec-index.md`
- `docs/daily-analysis-v2-system-design-spec.md`
- `docs/design-system/daily-industry-intelligence-DESIGN.md`
- `docs/plans/daily-analysis-v2-implementation-plan.md`

Goal completion status is tracked separately in:
- `docs/plans/daily-analysis-v2-goal-status.md`

The goal-status ledger is the durable record for whether a goal is **Done**, **Partial**, **Not started**, or **Blocked/Needs decision**. Do not infer completion only from chat history, context summaries, or passing tests.

## Goal Prompt Template

```text
/goal Work in /Users/yenlunhsu/.hermes/industry-map-site.
Follow docs/daily-industry-intelligence-spec-index.md, docs/daily-analysis-v2-system-design-spec.md, docs/design-system/daily-industry-intelligence-DESIGN.md, and docs/plans/daily-analysis-v2-implementation-plan.md.
Implement the next smallest approved vertical slice only: [SLICE NAME].
Use spec-first, TDD, and Human Editorial UI rules.
Do not implement unrelated slices.
Verify with npm test, npm run build, and browser smoke where relevant.
Return what changed, tests run, remaining risks, and next suggested slice.
```

## Recommended Goal Sequence

### Goal 1 — Contracts foundation
Implement DailyAnalysisV2, ResearchSignal, StockKnowledgeRule, and ProductNavigation contracts with tests.

### Goal 2 — Context adapters
Implement CompanyAnalysisContext, TopicAnalysisContext, and IndustryChainMap view model with tests.

### Goal 3 — Grade gating
Implement A/B/C/D/F deterministic gating, stale-data downgrades, and D/F recommendation blocking.

### Goal 4 — Daily V2 artifacts
Generate deterministic DailyAnalysisV2 JSON and Daily Report V2 view model.

### Goal 5 — Daily Focus UI
Build Human Editorial Daily Report entry page and daily focus cards linking to topic/stage/company.

### Goal 6 — Industry Chain Map UI
Build staged lanes, representative company cards, show-all table/list fallback, and URL-state filters.

### Goal 7 — Company Detail UI
Build Overview, Daily AI Analysis, Fundamentals, Technicals, Chip/Ownership, News/Events, Products, Topic Roles, SWOT, and Sources sections.

### Goal 8 — Topic AI Analysis UI
Build topic-level overview, daily focus, research direction, company roles, risks, and sources.

### Goal 9 — Automation integration
Add research signal validation and V2 daily refresh integration after manual UI review.

## Guardrails

- One goal should complete one vertical slice only.
- Do not skip tests to save turns.
- Do not use AI prose as source truth.
- Do not render all companies in one default graph.
- Do not expose D/F as recommendations.
- Do not change grading thresholds without updating the spec first.
- If data is missing, render partial/insufficient states rather than fake values.

## Verification Standard

Every goal-run should report:
- Files changed.
- Tests run and results.
- Build result.
- Browser smoke result if UI changed.
- Data/source limitations.
- Next recommended goal.

Every goal-run should also update `docs/plans/daily-analysis-v2-goal-status.md` before reporting completion:
- Mark whether the completed work is a full goal or only the next smallest vertical slice.
- Record the exact verification commands and browser smoke URL, if applicable.
- Record remaining risks and the next smallest suggested slice.
- Prefer committing a checkpoint after tests, build, and browser smoke pass.
