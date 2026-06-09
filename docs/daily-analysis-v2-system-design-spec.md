# Spec: Daily Analysis V2 — Evidence-Backed Industry Intelligence System

## Status
Draft for user review. Do not implement until approved.

## Date
2026-06-08

## Objective
Rebuild Daily Analysis as a system-design-first market intelligence product: daily market signals are combined with stable stock knowledge, company products, topic roles, SWOT, and curated external research direction. The product should answer: "今天台股產業鏈發生什麼事、哪些公司真的受惠、哪些只是觀察、風險在哪、資料可信度如何？"

This spec intentionally separates **stable knowledge** from **daily signals**. Stable knowledge is reviewed and versioned; daily analysis references it rather than rewriting it.

## Product Principles

1. **Evidence before prose** — analysis text must be backed by typed inputs and source metadata.
2. **AI is an analyst assistant, not a source** — AI can summarize, classify, compare, and explain; it cannot invent product facts, SWOT, or recommendation grounds.
3. **Human-editorial UI** — lead with a short human-readable thesis, then reveal evidence. Daily Analysis should feel like a research note written for a person, not a dumped JSON/dashboard.
4. **Layered recommendations** — A/B are candidates, C is observation, D/F are weak or insufficient; D/F never appear as recommendations.
5. **Research direction is contextual** —法人報告、TrendForce 類報告、產業研究可 provide top-down direction, but must be cited, dated, scoped, and not overused as company-level truth.
6. **Stock knowledge is reusable reasoning substrate** — Daily Analysis should reference the stock knowledge base's cross-sectional rules and market heuristics, not only per-company JSON.

## User Stories

### Daily market reader
As a user, I open the Daily Report and immediately understand market posture, strongest themes, key candidates, observation-only names, and why each tier exists.

### Topic-first researcher
As a user, I open a topic page such as AI Server or Memory and see value-chain stages, current events, companies by role, and AI-assisted top-down analysis backed by source labels.

### Company-first researcher
As a user, I open a company page and see products, topic roles, SWOT, daily technical/chip/event signals, AI-assisted synthesis, and clear evidence/freshness labels.

### Industry-map explorer
As a user, I open the product like aistockmap and can understand the whole supply chain shape: parent theme → topic → value-chain stage → companies → each company's role and evidence.

### Skeptical user
As a user, when data is missing or stale, I see partial/insufficient states rather than confident-sounding conclusions.

## Source Strategy

### Source priority
1. Official structured sources: TWSE, TPEX, MOPS, company filings, financial reports, official announcements.
2. Structured market datasets: FinMind, official exchange feeds, checked-in K-line/chip/valuation artifacts.
3. Company-owned sources: official websites, investor presentations, annual reports, product pages.
4. External research direction:法人報告, TrendForce, DIGITIMES/研調機構 summaries, industry research reports, brokerage sector notes where legally accessible.
5. Trusted news/event sources: used as event deltas and review triggers, not automatic canonical truth.
6. AI-generated synthesis: derived only; never canonical source.

### External research reports: allowed semantics
External research can contribute:
- market-level direction: e.g. HBM demand, DRAM pricing cycle, CoWoS capacity, AI server shipment growth.
- topic-level tailwinds/headwinds.
- supply-demand or pricing-cycle context.
- review triggers for company product/SWOT updates.

External research must not by itself assert:
- a company sells a product unless backed by company/official evidence.
- a company is a direct beneficiary unless company-topic-role evidence exists.
- a price target or trading recommendation unless explicitly labeled as external opinion and likely out-of-scope for first build.

### ResearchSignal contract
```ts
type ResearchSignal = {
  id: string;
  sourceName: string;
  sourceType: 'broker_report' | 'industry_research' | 'company_report' | 'news' | 'official' | 'internal_knowledge';
  publishedAt: string;
  retrievedAt: string;
  title: string;
  url?: string;
  access: 'public' | 'licensed' | 'manual_note' | 'unavailable_link_only';
  scope: 'market' | 'topic' | 'company' | 'product' | 'supply_demand' | 'pricing_cycle';
  relatedTopics: string[];
  relatedCompanies: string[];
  thesis: string;
  evidenceQuotes?: string[];
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  analystNotes: string[];
  reviewTriggers: string[];
};
```

## Stock Knowledge Base Integration

Daily Analysis should reference stock knowledge from multiple angles, not only per-company facts.

### StockKnowledgeRule contract
```ts
type StockKnowledgeRule = {
  id: string;
  category: 'technical' | 'chip' | 'fundamental' | 'industry' | 'risk' | 'position_sizing' | 'market_regime';
  title: string;
  summary: string;
  appliesWhen: string[];
  bullishImplications: string[];
  bearishImplications: string[];
  riskWarnings: string[];
  evidenceBasis: string[];
  confidence: 'high' | 'medium' | 'low';
};
```

### How Daily Analysis uses stock knowledge
- **Market regime framing:** e.g. breadth weak + index up means concentration risk.
- **Technical interpretation:** e.g. volume breakout vs exhaustion gap.
- **Chip interpretation:** e.g. foreign buying with margin expansion has different risk than投信 accumulation.
- **Industry-cycle framing:** e.g. memory cycle / inventory correction / capacity expansion.
- **Risk discipline:** e.g. high volatility + low evidence means observation only.

### UI requirement
Each candidate card should include a small "Knowledge Applied" section that lists 2–4 rules used, e.g.:
- 技術：突破需量能確認
- 籌碼：投信連買優先於單日外資買超
- 產業：供需循環題材需同時看價格與庫存
- 風險：資料不足不升級推薦

## Core Data Model

### DailyAnalysisV2
```ts
type DailyAnalysisV2 = {
  date: string;
  companyCode: string;
  companyName: string;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  tier: 'top_candidate' | 'strong_watchlist' | 'observation' | 'weak_signal' | 'insufficient_data';
  headline: string;
  summary: string;
  score: {
    total: number;
    technical: number;
    chip: number;
    event: number;
    industryTopic: number;
    productRole: number;
    swotRisk: number;
    researchDirection: number;
    knowledgeRuleFit: number;
    dataQuality: number;
  };
  reasons: AnalysisReason[];
  risks: AnalysisRisk[];
  productContext: ProductContext[];
  topicRoleContext: TopicRoleContext[];
  swotContext: SwotContext[];
  researchContext: ResearchContext[];
  knowledgeRulesApplied: KnowledgeRuleContext[];
  nextWatchPoints: string[];
  sourceStatus: SourceStatusSummary;
};
```

### AnalysisReason
```ts
type AnalysisReason = {
  domain: 'technical' | 'chip' | 'event' | 'industry' | 'product_role' | 'swot' | 'research' | 'knowledge_rule';
  title: string;
  detail: string;
  weight: number;
  polarity: 'bullish' | 'bearish' | 'neutral' | 'risk';
  sourceRefs: string[];
  derivedBy: 'rule' | 'ai_summary' | 'human_curated';
};
```

## Grade Semantics

### A — High Conviction Candidate
Requires fresh market data, strong technical signal, supportive chip or event signal, verified direct topic role, sufficient product context, and no blocking SWOT/data-quality risks.

### B — Strong Watchlist
Requires useful technical/chip/topic alignment but may lack one confirmation dimension. Suitable for watchlist, not blind action.

### C — Observation Candidate
Some signal exists, but directness, data quality, research confidence, or risk profile prevents recommendation framing.

### D — Weak / Noisy Signal
Conflicting or weak signals. Can be shown for transparency but not as a candidate.

### F — Insufficient Data
Missing/stale core inputs or insufficient company/product/topic knowledge. No recommendation conclusion.

## AI-Assisted Analysis Scope

### Daily Report AI summary
AI may synthesize:
- market regime summary.
- why top topics matter today.
- candidate-vs-observation explanation.
- cross-domain conflict summary.

AI must cite the structured fields it used and label output as derived.

### Company page AI panel
Each company page should include an AI-assisted synthesis panel with:
- "今日變化" from daily signals.
- "長期產業定位" from products/topic roles.
- "主要風險" from SWOT and stock knowledge rules.
- "下一步觀察" from trigger conditions.

### Topic page AI panel
Each topic page should include an AI-assisted synthesis panel with:
- current top-down direction from ResearchSignals.
- value-chain bottlenecks and beneficiaries.
- companies with verified direct roles vs peripheral exposure.
- topic-level common risks.

### Guardrails
- AI output must be regenerated from typed view models, not raw scraped text.
- AI output must never hide source status.
- AI must not upgrade D/F to recommendation language.
- AI must not rewrite canonical SWOT/product knowledge without a separate review workflow.

## UI Information Architecture

The product should not be only a Daily Analysis page. Daily Analysis is one entry point inside a broader industry intelligence system:

1. **Daily Focus / Daily Analysis** — what changed today, written in human editorial style.
2. **Topic Overview** — what this theme is, why it matters, current daily focus, and related subtopics.
3. **Industry Chain Map** — how the supply chain is structured, e.g. upstream → manufacturing → packaging/testing → equipment/materials → downstream demand.
4. **Company Database / Company Detail** — each company’s fundamental, technical, chip, event/news, product, topic-role, SWOT, and source coverage.
5. **AI Analysis** — synthesis panels generated only from typed evidence-backed view models.

### Product shell requirement

Use aistockmap-style navigation semantics, but not its visual density:
- Daily Focus.
- Topic Overview.
- Industry Map.
- Company Database.
- Market/Ranking modules.
- AI Analysis.

The shell should let the user move from:
`daily event → topic → value-chain stage → company role → company detail → evidence/source`.

### Scale design for many industries and companies

The UI must assume there are many parent industries, many topics, and hundreds of companies. Do not render a giant all-company graph as the primary experience.

Use progressive disclosure:
1. **Industry universe** — parent industries as compact cards with current daily activity, topic count, tracked company count, and freshness.
2. **Topic cluster** — selected industry expands into topic groups and daily focus items.
3. **Value-chain lane** — selected topic renders ordered stages, not every company at once.
4. **Representative companies** — each stage shows the top 3–6 most relevant verified companies, with “show all” for the full list.
5. **Company drawer/detail** — company cards open a summary drawer first; full detail page is one more click.
6. **Faceted table fallback** — every map/list must have a searchable table mode for scale, sorting, filtering, and keyboard accessibility.

Required filters/lenses:
- industry / parent topic.
- topic.
- value-chain stage.
- role directness: direct, indirect, peripheral, narrative-only.
- signal freshness: today, this week, stale.
- data confidence: verified, partial, insufficient.
- market lens: fundamental, technical, chip, news/event, product, SWOT.

Rendering rules:
- Collapse low-confidence or peripheral companies by default.
- Never show more than 6 companies per stage before an explicit “show all”.
- Large company sets use pagination or virtualization; no infinite dense grid as the default.
- Use URL state for selected topic, active tab, filters, and company drawer so views are shareable.
- A graph can be a secondary exploratory lens, but the canonical view is staged lanes + filtered lists.

### Design-system workflow

Open Design / DESIGN.md-style workflows are useful for this product, especially before implementation:
- Define design tokens for surfaces, typography, spacing, radius, grade colors, trust badges, and evidence chips.
- Generate multiple artifact sketches from the same design contract.
- Keep the selected Human Editorial direction consistent across Daily Focus, Industry Map, and Company Detail.

Open Design should be treated as a design-system/prototyping accelerator, not as the source of financial semantics. Financial semantics still come from typed contracts, source metadata, and tests.

### Daily Report screen order
1. Date, freshness, and a one-sentence market thesis.
2. Human-readable “today’s story” paragraph: what changed, why it matters, what not to overread.
3. 2–4 daily focus cards that link events/news to topics and affected value-chain stages.
4. A/B/C candidate cards written as human judgment: what to watch, why now, why this company, what could be wrong.
5. Product/topic-role/SWOT/knowledge-rule evidence hidden behind expanders or compact evidence strips.
6. Strong stock technical/chip rankings, explicitly labeled as technical/chip-only if not backed by company role.
7. Source status collapsed by default; only surface prominently when it changes the conclusion.

### Company detail tabs
1. Overview — company identity, industry, market position, current daily relevance.
2. Daily AI Analysis — today’s change and watch points, shown once at company level unless topic-specific.
3. Fundamentals — revenue, margins, valuation, growth, dividends, financial statement highlights.
4. Technical — trend, momentum, K-line, volume, support/resistance, price-only caveats.
5. Chip / Ownership — three institutions, margin, lending/short, foreign holding, concentration where available.
6. News / Events — official MOPS events plus trusted news deltas; mapping to topics must be labeled derived.
7. Products — product cards with name, plain-language “what it is”, and “why it matters”.
8. Topic Roles — role by topic, confidence, value-chain stage, direct/peripheral status, last verified.
9. SWOT — evidence-backed SWOT first; fallback/generated observations clearly labeled.
10. Sources — citations, freshness, confidence, partial/insufficient states.

### Topic detail tabs
1. Overview — topic definition, current thesis, why it matters.
2. Daily Focus — daily events and market signals affecting this topic.
3. Industry Chain Map — parent/child topics and ordered value-chain stages.
4. Company Roles — verified direct companies vs peripheral exposure, grouped by stage.
5. Research Direction — TrendForce/broker/industry context as top-down direction only.
6. Events — official/news events mapped to this topic with derived labels.
7. Common Risks / SWOT Themes — topic-level risk map.
8. Sources — coverage and freshness metadata.

## Visual Design Requirements

Use the approved **Human Editorial** direction from `sketches/002-daily-analysis-human-editorial/` as the primary visual language.

The visual system should be warm, readable, and research-note-like:
- parchment/warm-neutral surfaces instead of dense dark dashboard chrome.
- editorial headline + concise human thesis before evidence cards.
- evidence, scores, source status, and coverage are second-layer metadata.
- no generic AI dashboard look: avoid excessive gradients, huge metric grids, and debug/process labels.

### Color semantics
- A: emerald / green, strong candidate.
- B: cyan / sky, watchlist.
- C: amber, observation.
- D: slate / muted orange, weak signal.
- F: red / gray, insufficient or blocked.
- Research direction: violet accent, clearly separate from recommendation grade.
- Official events: blue badge.
- AI-derived: purple/indigo small badge but not dominant.

### Reading design
- Start with a human sentence, not a score.
- Tier cards must be visually separated; do not make all grades look equally important.
- Each card should answer: Why now? Why this company? What role? What risk? What to watch?
- Use expanders/evidence strips for product, topic role, SWOT, and source status.
- Long AI text should be summarized first; detailed evidence is optional drill-down.
- Provide quick filters: Topic, Grade, Signal conflict, Data quality, Freshness.
- Daily Analysis should link outward into topic map and company detail pages; it is not the whole product.

## Development Boundaries

### Always
- Keep source/citation/freshness/confidence with every meaningful analysis field.
- Use stock knowledge rules as explicit reasoning context.
- Preserve official announcement subject text.
- Label research reports as directional context, not canonical company truth.
- Keep D/F out of recommendations.

### Ask first
- Adding paid research APIs or storing licensed report text.
- Implementing brokerage target-price or rating displays.
- Changing grading thresholds after initial approval.
- Using AI to mutate canonical knowledge.

### Never
- Fabricate citations.
- Treat missing numeric data as zero.
- Present tracked samples as full-market coverage.
- Rewrite SWOT daily from price moves.
- Copy proprietary paid report content into public artifacts.

## Success Criteria

- Daily Report can explain top candidates and observation-only names through typed evidence.
- The app provides a clear aistockmap-like flow from daily focus to topic overview, industry chain map, and company detail.
- At least one company page shows AI-assisted synthesis using products, topic roles, SWOT, stock knowledge, and daily signals.
- At least one topic page shows AI-assisted topic analysis using value chain, research direction, events, and company roles.
- UI visually follows the Human Editorial direction and keeps evidence metadata secondary.
- Tests prove D/F cannot render as recommendation, stale data is downgraded, and missing product/topic/SWOT context lowers confidence.

## Open Questions for User Review

1. Should licensed/manual research notes be stored as short analyst summaries only, or may the system store direct excerpts when the source allows it?
2. Should we include broker target prices/ratings at all, or keep external research purely as directional market context?
3. Should first build focus on top 30 high-priority companies or expand slower to 50–80 companies before UI polish?
