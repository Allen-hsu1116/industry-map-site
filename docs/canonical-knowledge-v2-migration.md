# Spec: Canonical Knowledge V2 Migration

## Objective

Rebuild the industry-map knowledge layer without deleting the current website data first. The existing `industries.json` and `companies.json` remain the legacy runtime baseline while a v2 canonical layer is built, validated, compared, and gradually adopted.

Success means Daily Analysis and company pages can explain:

- what a company actually sells or enables;
- what role it plays inside each topic;
- where it sits in the supply chain;
- why the product/topic matters;
- what evidence supports each conclusion;
- whether the conclusion is high, medium, low, or insufficient confidence.

The migration must prevent AI-generated claims from becoming truth without evidence.

## Tech Stack

- Next.js / React / TypeScript
- Static JSON under `public/data`
- Node scripts run through `tsx`
- Unit tests use Node's built-in test runner with `tsx`
- Browser verification through localhost Next dev server when UI changes are made

## Commands

```bash
npm test
npm run knowledge:validate
npm run lint
npm run build
npm run knowledge:v2:inventory
```

## Project Structure

```text
public/data/industries.json                  Legacy topic/company-role graph; do not delete yet
public/data/companies.json                   Legacy company index; do not delete yet
public/data/product-knowledge/{code}.json    Evidence-backed product knowledge, already hybrid-consumed by UI
public/data/v2/                              Future canonical topic/role graph; not runtime-default until validated
reports/v2-canonical-products.json            Generated canonical product/alias candidates; review artifact
reports/v2-canonical-role-candidates.json     Generated v2 role ontology candidates; review artifact
reports/                                     Generated migration reports; review artifacts, not runtime source
src/lib/legacyKnowledgeInventory.ts          Pure inventory/candidate extraction logic
scripts/generate-v2-inventory.ts             CLI that reads legacy data and writes reports
scripts/validate-knowledge-pipeline.ts       Existing quality gate, extended as v2 matures
docs/canonical-knowledge-v2-migration.md     This spec and execution plan
```

## Code Style

Prefer explicit JSON contracts and small pure functions. Generated reports should be deterministic: sort by priority, code, topicId, and product name so diffs are reviewable.

```ts
export interface CanonicalRoleCandidate {
  companyCode: string;
  topicId: string;
  source: "legacy_industries_json";
  status: "candidate";
  needsVerification: true;
  confidence: "unverified";
}
```

Rules:

- Use `unknown`/guards for raw JSON boundaries.
- Keep extraction pure and testable in `src/lib`.
- Keep filesystem writes in `scripts`.
- Never let LLM-generated text be the only evidence for a high-confidence claim.

## V2 Data Model

### Topic type ontology

- `theme`: market theme, e.g. AI server, robotics, defense.
- `technology`: enabling technology, e.g. CoWoS, SoIC, CPO.
- `product`: product category, e.g. HBM, ABF, CCL.
- `process`: manufacturing/process node, e.g. N2, A16.
- `supply_chain_segment`: reusable supply-chain segment, e.g. wafer foundry, IC design, thermal.
- `end_market`: end-market demand bucket, e.g. data center, EV, satellite communications.

### Supply-chain stage ontology

- `raw_material`
- `component_material`
- `equipment`
- `design_ip`
- `ic_design`
- `wafer_foundry`
- `memory_supplier`
- `packaging`
- `testing`
- `substrate`
- `pcb`
- `thermal`
- `power`
- `chassis_mechanical`
- `odm_oem`
- `system_integration`
- `channel_brand`
- `end_customer`
- `unknown`

### Directness ontology

- `core`: company directly provides the topic-defining product/service.
- `direct_enabler`: company enables the topic through essential upstream/downstream capability.
- `supplier`: company supplies a necessary component/material/equipment but is not topic-defining.
- `customer_or_channel`: company buys, integrates, distributes, or brands the topic product.
- `indirect`: relation exists but is too far from core economics for primary analysis.
- `rejected`: legacy relation should not enter v2 canonical graph.

### Confidence ontology

- `high`: official/company filing/MOPS/TWSE/earnings evidence supports the claim.
- `medium`: credible industry/news/aistockmap cross-source evidence supports the claim.
- `low`: legacy candidate or weak evidence; usable only as a clearly marked draft.
- `insufficient`: do not use for analytical conclusions.
- `unverified`: extracted from legacy and awaiting validation.

## V2 Canonical Role Shape

```json
{
  "schemaVersion": 1,
  "companyCode": "2330",
  "companyName": "台積電",
  "topicId": "cowos-advanced-packaging",
  "topicName": "AI 先進封裝 CoWoS",
  "topicType": "technology",
  "directness": "core",
  "supplyChainStage": "packaging",
  "roleType": "advanced_packaging_provider",
  "roleSummary": "台積電是 CoWoS 先進封裝平台核心供應者。",
  "products": ["CoWoS-S", "CoWoS-L", "SoIC"],
  "legacy": {
    "topicSlug": "cowos-advanced-packaging",
    "groupName": "封裝材料與耗材"
  },
  "evidence": [],
  "confidence": "unverified",
  "lastVerified": null,
  "status": "candidate"
}
```

## Migration Strategy

### Phase 0 — Freeze legacy runtime baseline

- Do not delete `industries.json` or `companies.json`.
- Do not hand-edit legacy fields for new canonical claims.
- New knowledge goes into v2/product-knowledge paths.
- Legacy remains fallback until v2 coverage and quality are measurable.

### Phase 1 — Inventory and candidate extraction

- Extract every legacy topic, group, company role, product, customer, tech focus, and SWOT mention.
- Normalize product mentions into per-company candidate clusters.
- Generate priority scores for pilot work.
- Write generated reports under `reports/`.

### Phase 2 — Canonical taxonomy and role mapping

Phase 2 starts with deterministic product canonicalization before deeper role ontology mapping:

- Build generated product/alias candidates from legacy product mentions in `reports/v2-canonical-products.json`.
- Known high-value aliases such as CoWoS/CoWoS-S/CoWoS-L, SoIC, HBM/HBM3E, N2/A16, ABF/CCL/PCB are mapped deterministically.
- Business-registration boilerplate is flagged with issues and must not be promoted directly into product knowledge.
- All generated products remain `status: candidate`, `confidence: unverified`, and `needsVerification: true` until Phase 3 evidence enrichment.

Then map legacy topics and roles:

- Map legacy topics to v2 topic types.
- Map legacy groups/roles to supply-chain stages and role types.
- Label directness conservatively; ambiguous items stay `unverified`/`low`.

### Phase 3 — Evidence enrichment

- Discover sources in priority order:
  1. official company/product pages;
  2. annual reports / earnings decks / investor presentations;
  3. MOPS/TWSE;
  4. financial statements / major news;
  5. FinMind/CasualMarket numerical data;
  6. credible industry/news sources;
  7. aistockmap or similar cross-checking references.
- LLMs may extract and summarize evidence, but may not be the evidence source.

### Phase 4 — Side-by-side comparison

Before UI replacement, produce reports for:

- legacy topic exists but v2 missing;
- v2 topic exists but legacy missing;
- company role directness changed;
- legacy core relation downgraded to indirect/rejected;
- product mentions without evidence;
- topic/group names that cannot map to ontology.

### Phase 5 — Hybrid UI / Daily Analysis adoption

Adopt in this order:

1. product knowledge (already started);
2. company topic roles;
3. supply-chain map;
4. SWOT;
5. Daily Analysis;
6. search/topic overview;
7. remove legacy adapters.

### Phase 6 — Legacy retirement gate

Only remove legacy runtime data after:

- Top 50 company role/product coverage is above 90% at high/medium confidence;
- full-market role coverage is above 80%;
- core topic supply-chain completeness is above 90%;
- validators report 0 errors;
- Daily Analysis can run from v2 only;
- browser smoke tests pass;
- side-by-side diff has no critical missing roles.

## Testing Strategy

- Unit-test pure inventory extraction and scoring.
- Validate generated JSON shape and deterministic sorting.
- Run `npm test`, `npm run knowledge:validate`, `npm run lint`, and `npm run build` before every commit.
- Browser-test only after UI starts consuming v2 data.

## Boundaries

Always:

- Preserve legacy data until replacement quality is proven.
- Mark unverified migrated claims as candidates.
- Require evidence for high-confidence claims.
- Keep generated quality reports out of runtime logic.

Ask first:

- Removing legacy files or UI fallback paths.
- Adding external data-provider dependencies.
- Changing deployment/runtime data source defaults.

Never:

- Treat AI summary as evidence.
- Promote a claim to high confidence without a traceable source.
- Put short-term stock movement into durable SWOT.
- Delete broad swaths of legacy topic data without side-by-side coverage proof.

## Implementation Plan

### Task 1: Inventory foundation

Acceptance:

- Extract counts for topics, company roles, unique companies, product mentions, customer mentions, tech-focus mentions, and SWOT mentions.
- Produce deterministic company priority list.
- Tests cover duplicate company/topic/product aggregation.

Verification:

```bash
npm test
npm run knowledge:v2:inventory
```

### Task 2: Ontology mapping draft

Acceptance:

- Create explicit mapping helpers for topic type, supply-chain stage, and directness candidates.
- Unknown mappings are allowed but surfaced in report.

Verification:

```bash
npm test
npm run knowledge:v2:inventory
```

### Task 3: Top 30 pilot report

Acceptance:

- Generate a report ranking the first 30 companies to enrich.
- Report includes why each company was selected and which topic/product candidates need evidence first.

Verification:

```bash
npm run knowledge:v2:inventory
```

### Task 4: V2 candidate JSON draft

Acceptance:

- Generate candidate role objects under `reports/v2-role-candidates.json`.
- All candidates are `status: candidate`, `confidence: unverified`, `needsVerification: true`.

Verification:

```bash
npm test
npm run knowledge:v2:inventory
```

### Task 5: Validator integration

Acceptance:

- `knowledge:validate` reports v2 inventory health without making legacy warnings worse.
- Product knowledge validator remains intact.

Verification:

```bash
npm test
npm run knowledge:validate
npm run lint
npm run build
```

## Open Questions

None blocking. The approved migration strategy is shadow rebuild first, no destructive deletion.
