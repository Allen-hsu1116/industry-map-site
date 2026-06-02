# aistockmap-style Parity Checklist and Gap Report

Status: Draft accepted for implementation planning
Generated: 2026-06-02 15:54 CST
Repo baseline: `f02838e92f11a598c56a6007969a18dbadfd4c12`
Reference surface observed: public, unauthenticated `https://aistockmap.com/` browser snapshot on 2026-06-02

## Purpose

This document turns the user's requested aistockmap-style website completion into a concrete, evidence-backed implementation checklist. It compares the reference product's visible module semantics against the current `industry-map-site` implementation, then defines the next ordered slices.

The goal is not to copy wording or private/paid content. The goal is to match the useful product semantics with trustworthy sources, clear provenance, and explicit partial/empty states.

## Non-negotiable Data Rules

- Do not fabricate unavailable market data.
- Preserve official raw content when the source is official, especially MOPS/TWSE announcements.
- Label derived mappings clearly. Example: official major-news subject + derived topic mapping from `company-topic-roles` is not an official TWSE topic tag.
- AI can summarize, classify, and compare only after source data exists; AI output is not a primary source.
- Daily market data must show source, scope, and latest data date.
- A stale module must say stale/partial/empty rather than silently appearing current.
- Product, company role, and SWOT knowledge must keep evidence/citation/lastVerified/confidence.
- SWOT is not a daily short-term price reaction feed and must not be regenerated wholesale from daily market moves.
- Active ETF constituent-change tracking must not be implemented unless a trustworthy source and semantics are confirmed.

## Current Implementation Snapshot

Data coverage observed from repo:

| Area | Current state |
| --- | --- |
| Companies | `public/data/companies.json` exists |
| Financial snapshots | 504 `public/data/financials/*.json` files |
| Daily report | `public/data/daily-report.json` exists, but metadata date currently `2026-05-21` |
| Event focus | `public/data/event-focus.json`, latest `2026-06-01`, 72 tracked-company items, status `partial` |
| Product knowledge | 88 `public/data/product-knowledge/*.json` files |
| Company topic roles | 66 `public/data/company-topic-roles/*.json` files |
| Company SWOT | 68 `public/data/company-swot/*.json` files |
| Canonical topics | `public/data/canonical-topics.json` exists |
| Source registry | `public/data/knowledge-sources.json` exists |
| Update scripts | K-line, market feeds, event focus, daily analysis, knowledge validation scripts exist |
| Daily refresh | `data:daily-refresh`: K-line -> market feeds -> event focus -> daily analysis -> validation |
| Tests | Freshness/source semantics regression tests exist for K-line, chip feeds, and event focus |

## Reference Product Surface Observed

Public aistockmap modules visible without login:

| Reference surface | Observed semantics |
| --- | --- |
| Main navigation | Daily focus, topic overview, industry overview, industry map, company database, finance program, market heatmap, AI analysis |
| Market tabs | Taiwan stocks, US stocks, Japan stocks, ETF |
| Topic cards | Topic title, company count, narrative summary, update/verification date, new-dynamics badge, premium lock where applicable |
| Daily focus timeline | Date tabs, selected focus cards, source labels, narrative, related topic tags, premium locks |
| Market/global indicators | Major index/ADR/volatility cards with update time |
| Institutional module | Three major institutional investors with buy/sell/net and date |
| Margin module | Margin/short-sale changes and balances with date |
| Momentum module | Strong stocks ranking with market/timeframe filters |
| Large-holder module | Large-holder percentage/rank changes with share-tier/time-window filters |
| Active ETF module | Active ETF holding-change statistics: added/increased/decreased/removed |
| Major news module | MOPS/TWSE announcement preview, category filters, date filters, company code/name/time |
| Search/favorites/member | Search, favorites, membership gating |

## Parity Checklist

Legend:

- Complete: implemented with source semantics and verification.
- Partial: implemented but missing UI linkage, freshness metadata, full scope, or semantic parity.
- Missing: not implemented.
- Blocked: do not implement until reliable source is available.

| Module | Reference semantics | Current status | Gap | Next action |
| --- | --- | --- | --- | --- |
| Daily focus timeline | Daily event/market focus cards with source/date/topic tags | Partial | We have Daily Report and Event Focus, but daily-report metadata is stale (`2026-05-21`) and event focus is not yet filter-linked to major news/detail pages | Slice 1: rebuild Daily Report freshness contract and event/news filter linkage |
| Topic cards / topic overview | Topic cards with company count, narrative, verified date, new-dynamics badge | Partial | Current homepage has topic/company data, canonical topics, and topic roles, but lacks a dedicated topic overview page with parity cards and status rails | Slice 3: topic overview page |
| Industry map / value-chain map | Topic/industry supply chain map with companies by role/stage | Partial | Canonical topics and topic roles exist; value-chain grouping is not a first-class page/view and stage completeness is not surfaced | Slice 4: topic detail + value-chain stage view |
| Company database | Search/filterable company database | Partial | Homepage includes company list/search-ish UI, but not a dedicated database page with filters and source/freshness columns | Slice 5: company database page |
| Company detail: products | Products and business/product descriptions | Partial | Product knowledge exists with evidence/confidence; UI needs clearer aistockmap-style product section and source badges | Slice 2: company detail industrial-analysis redesign |
| Company detail: topic role | Company's role in each topic | Partial | Company topic roles exist; UI needs better role comparison and per-topic filter consistency | Slice 2 |
| Company detail: SWOT | SWOT with source/lastVerified/confidence | Partial | SWOT exists and is shown, but needs clearer version/source/update semantics and stale/insufficient labels | Slice 2 |
| K-line/technical | Latest price/K-line and technical signals | Complete for top-priority refresh | K-line updates top 30 daily; full 504-company scope not refreshed daily | Keep top-priority scope explicit; consider broader batch later if API budget allows |
| Institutional investors | Market/company institutional buy/sell/net | Partial | Company financials top 30 refreshed; market-level institutional summary not yet a first-class Daily Dashboard module | Slice 1 or 6: source-status/dashboard module |
| Margin/short-sale | Margin/short-sale balances and changes | Partial | Company financials top 30 refreshed; market-level module and historical expand UI incomplete | Slice 6 |
| PER/PBR/dividend yield | Daily valuation trend | Partial | Top 30 refreshed and shown in chip tab; source/status summary still scattered | Slice 6 |
| Strong stocks | Ranking by momentum/timeframe | Partial | We have price technical data and daily analysis picks; no explicit strong-stock ranking module with timeframe filters | Slice 7 |
| Large-holder ranking | Large-holder share-tier change ranking | Partial/Blocked by scope | Some holding-share APIs may require Sponsor/backer access; any current sample must be labeled tracked sample, not full market | Slice 8 only if data access is confirmed; otherwise visible unavailable state |
| Active ETF changes | Active ETF constituent/holding changes | Blocked | Current verified source not established; do not fake with generic ETF ranking | Record as unavailable until source verified |
| Major news | Official announcement feed with category/date filters | Partial | Runtime `/api/major-news` and checked-in `event-focus.json` exist; shared filters/category view not unified | Slice 1 |
| Source-status rail | Module-by-module source, status, update date, scope | Partial | Source labels exist in several places; no unified rail derived from actual module status | Slice 6 |
| Market/global indicators | Global index/ADR/VIX snapshot | Missing/Partial | Daily report has market overview, but no reference-style indicator strip with update time | Slice 9 |
| Search/favorites/member | Search and saved favorites | Missing/Out of scope | Search exists only lightly; favorites/member gating not required for this project unless user asks | Out of scope for now |

## Priority Implementation Plan

### Slice 1: Daily Report freshness + Event Focus / Major News linkage

Why first: the current site now has updated event and market feed data, but `daily-report.json` still declares an old date. This can mislead users.

Acceptance criteria:

- `daily-report.json.date` and visible report date reflect the latest market/event refresh date or explicitly say why not.
- Daily Report event focus and major-news module share a date/company/topic/category filter model.
- Event focus keeps official subjects intact and labels topic mapping as derived.
- Source/status UI shows latest event-focus date and daily-analysis generation date.
- Tests verify date freshness and filter consistency.

Likely files:

- `scripts/generate-daily-analysis.ts`
- `src/lib/dailyAnalysis.ts`
- `src/lib/eventFocus.ts`
- `src/app/daily-report/page.tsx`
- `src/app/api/major-news/route.ts`
- `src/lib/*.test.ts`

Verification:

- `npm test -- --test-name-pattern "daily report|event focus|major news"`
- `npm run data:daily-refresh:dry-run`
- `npm run build`
- Browser smoke `/daily-report`

### Slice 2: Company detail industrial-analysis redesign

Why second: this directly addresses the user's original aistockmap comparison: products, role in each topic, and SWOT.

Acceptance criteria:

- Company detail has a coherent industrial-analysis section with three first-class panels: Products, Topic Roles, SWOT.
- Each panel shows evidence/confidence/lastVerified/source status.
- Topic role panel distinguishes verified/candidate/rejected and directness/stage.
- SWOT panel shows category, source, lastVerified, and avoids short-term price-derived claims.
- Empty/insufficient states are visible and honest.

Likely files:

- `src/app/page.tsx`
- `src/lib/companyKnowledge.ts`
- `src/lib/productKnowledge.ts`
- `src/lib/companyTopicRoles.ts`
- `src/lib/companySwot.ts`
- tests in `src/lib/*.test.ts`

Verification:

- `npm test -- --test-name-pattern "product|topic role|swot|coverage"`
- Browser smoke company `2330`, one high-coverage company, and one insufficient company.

### Slice 3: Topic overview page

Acceptance criteria:

- Dedicated topic overview route with topic cards.
- Cards show company count, canonical label, description, updated/verified date, coverage status, and active/new dynamics if available.
- Topic filter affects Daily Report ordering and focus presentation.
- No market nicknames as canonical labels.

### Slice 4: Topic detail + value-chain stage view

Acceptance criteria:

- Each topic detail shows upstream/midstream/downstream/end-market stage groupings where available.
- Stage ordering is deterministic and validated.
- Companies show role summary and confidence.
- Missing stage data shows partial state, not fabricated companies.

### Slice 5: Company database page

Acceptance criteria:

- Dedicated searchable/filterable company database.
- Filter by topic, role confidence, coverage grade, market feed freshness, and data-source status.
- Rows show company, topics, latest price date, latest chip date, and knowledge coverage.

### Slice 6: Unified source-status rail

Acceptance criteria:

- Source status is derived from actual module data, not hand-written text.
- Shows: module name, source, latest date, scope, status, warning/empty reason.
- Covers K-line, institutional, margin, valuation, event focus, product knowledge, topic roles, SWOT.

### Slice 7: Strong-stock ranking module

Acceptance criteria:

- Ranking based only on checked-in price/technical data.
- Timeframe filters are honest about available data.
- Shows source/scope and excludes stale data.

### Slice 8: Large-holder module

Acceptance criteria:

- Implement only if FinMind or another trustworthy source is available.
- If data is Sponsor-only or partial, show blocked/partial state.
- Any tracked-sample module must say `tracked sample`, not `full market`.

### Slice 9: Market/global indicator strip

Acceptance criteria:

- Show market index/ADR/sector indicators only if sources are verified and source-labeled.
- If no source is reliable, skip rather than fill with AI.

## Immediate Next Slice Recommendation

Start with Slice 1.

Reason:

- It fixes a currently observed semantic bug: `daily-report.json.date` is stale relative to refreshed market/event feeds.
- It builds on the event-focus pipeline already added.
- It prevents user-facing confusion before adding more UI.

## Verification Gate for Every Slice

Before each commit/push:

- `npm test`
- `npm run knowledge:validate`
- `npm run lint`
- `npm run build`
- `git diff --check`
- secret scan of staged diff
- Browser smoke for affected page(s)
- Commit only semantic data/code/doc changes

## Open Questions

- Should the site intentionally limit daily feed refresh to top 30 companies, or should it support a slower full-tracked-universe refresh job?
- Should Daily Report date represent market data date, event data date, generation date, or all three separately?
- Should active ETF constituent-change tracking be excluded permanently until a trustworthy public source is found?
- Should favorites/member-style features stay out of scope for this personal/internal website?
