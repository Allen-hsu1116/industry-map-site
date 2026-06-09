# Spec Index: Daily Industry Intelligence System

## Status
Draft consolidated for user review before `/goal`-driven implementation.

## Date
2026-06-08

## Product North Star
Build an evidence-backed industry intelligence website where Daily Analysis is the entry point, not the whole product. The user flow is:

`daily event → topic → value-chain stage → company role → company detail → evidence/source`

The product should feel like a human research note connected to a structured industry map, not a dense AI dashboard or a generic stock screener.

## Canonical Documents

### Primary product spec
- `docs/daily-analysis-v2-system-design-spec.md`
  - Defines DailyAnalysisV2 semantics, ResearchSignal, StockKnowledgeRule, grade/tier rules, AI-assisted scope, company/topic page information architecture, scale rules for many industries/companies, and design-system workflow.

### Implementation plan
- `docs/plans/daily-analysis-v2-implementation-plan.md`
  - Defines phased implementation: contracts first, view models, grading/gating, report generation, UI slices, automation/governance.

### Design system
- `docs/design-system/daily-industry-intelligence-DESIGN.md`
  - Defines the Human Editorial visual language, design tokens, components, scale rules, accessibility constraints, and do/don't guidance.

### Current sketches
- `sketches/001-daily-analysis-v2-command-center/`
  - Rejected direction: too dense, too dashboard-like, too machine/status oriented.
- `sketches/002-daily-analysis-human-editorial/`
  - Approved primary visual direction.
- `sketches/002-daily-analysis-decision-brief/`
  - Secondary reference for concise candidate cards.
- `sketches/002-daily-analysis-notebook/`
  - Secondary reference for company/topic detail panels.
- `sketches/003-industry-intelligence-human-editorial/`
  - Whole-product IA sketch: Daily Focus → Industry Chain Map → Company Detail.

## Key Product Decisions

### Daily Analysis is an entry point
Daily Analysis answers what changed today, which topics are affected, and which companies deserve follow-up. It must link outward into topic maps and company details.

### Industry Map is structural, not exhaustive
The industry map explains the shape of an industry/topic. It renders ordered value-chain stages and representative companies. It must not render hundreds of companies as the default view.

### Company Detail is the research surface
The company page owns the deeper analysis:
- Fundamentals.
- Technicals.
- Chip / ownership.
- News / events.
- Products.
- Topic roles.
- SWOT.
- Sources / freshness / confidence.

### Evidence before prose
AI prose is derived from typed view models and source metadata. AI cannot invent product facts, topic roles, SWOT, citations, or recommendation grounds.

### External research is directional context
Broker reports, TrendForce-style research, and industry reports may provide top-down direction, but cannot by themselves establish company truth or recommendation status.

### Scale via progressive disclosure
For many industries and companies, the system uses:
1. Industry universe.
2. Topic cluster.
3. Value-chain lane.
4. Representative companies.
5. Company drawer/detail.
6. Faceted table fallback.

## Implementation Order

### Slice 1 — Foundation contracts
- `DailyAnalysisV2` types and normalizers.
- `ResearchSignal` contract.
- `StockKnowledgeRule` adapter.
- `ProductNavigation` route/shell contract.

### Slice 2 — Context adapters
- `CompanyAnalysisContext`.
- `TopicAnalysisContext`.
- `IndustryChainMap` view model.

### Slice 3 — Grading and evidence gates
- A/B/C/D/F deterministic gating.
- Score breakdown builder.
- D/F recommendation blocking.
- Stale/missing evidence downgrades.

### Slice 4 — Daily artifacts and report view model
- Deterministic daily V2 JSON generation.
- Daily Report V2 tiered view model.
- Daily focus links to topic/stage/company.

### Slice 5 — UI implementation
- Human Editorial Daily Report.
- Industry Chain Map UI.
- Company Detail tabs.
- Topic AI-assisted analysis panel.
- Evidence/source metadata components.

### Slice 6 — Automation and governance
- Research signal validation.
- V2 daily refresh integration.
- No semantic no-op commits.
- Source/data-quality reporting.

## Acceptance Criteria

- Daily Report opens with a human-readable thesis, not a score wall.
- Daily focus items link to topic, industry-chain stage, and company detail where data exists.
- Industry map defaults to representative companies, with “show all” leading to filterable list/table mode.
- Company detail includes fundamentals, technicals, chip/ownership, news/events, products, topic roles, SWOT, and sources.
- D/F cannot render as recommendations.
- Missing/stale data visibly downgrades confidence.
- Research signals cannot override missing company/product/topic evidence.
- Product/topic-role/SWOT claims have source/freshness/confidence metadata.
- UI follows the Human Editorial design system and avoids AI-dashboard visual clichés.

## Open Questions

- First production coverage target: top 30 priority companies, 50–80 companies, or all tracked companies with partial states?
- Whether licensed/manual research notes store only short analyst summaries or also source-permitted excerpts.
- Whether broker target prices/ratings are explicitly out of scope for V1.

## How Future `/goal` Work Should Use This

Each `/goal` should reference this index plus the relevant section of the product spec and design system. Do not ask the agent to “finish the whole website” in one goal. Use small vertical slices with clear acceptance criteria and verification commands.
