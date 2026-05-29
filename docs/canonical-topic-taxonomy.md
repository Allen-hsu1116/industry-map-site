# Spec: Canonical Topic Taxonomy V2

## Objective

Before wiring more knowledge into Daily Analysis, define what counts as a 「題材」 and separate durable analytical topics from noisy legacy buckets. The removed legacy `industries.json` had 81 topics with mixed levels: some were market themes, some products, some supply-chain segments, and some overlapped. Canonical topics replace that runtime source.

Success means Daily Analysis can answer:

- What exactly is this topic?
- Why does it matter economically?
- Which companies are core vs indirect?
- Which products/roles/SWOT items belong under this topic?
- What should activate or deactivate attention to this topic?
- Which legacy topic IDs map into the canonical topic?

## Topic Definition

A canonical topic is an investable, trackable, evidence-backed analytical lens.

It must have all of these:

- **Demand or supply catalyst:** why the market should care now or cyclically.
- **Economic transmission path:** how the topic can affect revenue, margin, orders, valuation, or risk.
- **Supply-chain boundaries:** which roles/products are included and which are explicitly excluded.
- **Company role model:** companies can be labeled core/direct_enabler/supplier/customer_or_channel/indirect/rejected.
- **Evidence trail:** official/filing/FinMind/news/cross-check sources, with confidence.
- **Observable activation signals:** what to monitor daily/weekly/monthly.

Not a canonical topic by itself:

- One-day stock price movement.
- A vague buzzword without product/role boundaries.
- A generic industry category with no catalyst.
- Business-registration boilerplate.
- A cluster of stocks that only moved together but lacks common business logic.

## Topic Type Ontology

Use the existing V2 topic types:

- `theme`: cross-supply-chain market narrative, e.g. AI server, 軌道 AI 運算.
- `technology`: enabling technology, e.g. liquid cooling, CXL, CPO.
- `product`: concrete product family, e.g. HBM, MLCC, 功率電感.
- `process`: manufacturing/process node, e.g. N2/A16.
- `supply_chain_segment`: reusable industry segment, e.g. 記憶體, 被動元件, 散熱, 電源.
- `end_market`: demand bucket, e.g. 低軌衛星通訊, EV, data center.

## Canonical Topic Shape

Runtime shadow file:

```text
public/data/canonical-topics.json
```

Each topic contains:

- `id`, `name`, `type`, `status`
- `definition`
- `whyItMatters`
- `aliases`
- `parentId`, `childIds`
- `legacyTopicIds`
- `include`, `exclude`
- `activationSignals`
- `evidence`
- `confidence`, `lastVerified`

## Status Rules

- `active`: suitable for Daily Analysis once company roles/products are covered.
- `watchlist`: plausible emerging topic, but insufficient evidence or adoption for primary scoring.
- `legacy_candidate`: imported from old graph; not yet reviewed.
- `deprecated`: replaced or merged into another canonical topic.
- `rejected`: should not enter canonical analysis.

## Initial Audit of Legacy Topics

Retired legacy baseline:

- `industries.json` had 81 actual topic records.
- `stats.total_topics` said 82, inconsistent with the actual record count.
- As of S28, the legacy graph is deleted and no longer a fallback; canonical topics and company-topic-roles are the runtime layer.

High-overlap examples that need canonical mapping:

- `ai-server` + `ai-server-odm` + `ems-smt` + `liquid_cooling_advanced` + `thermal-solution` should become parent/child topics under **AI 伺服器** instead of one flat list.
- `mlcc-capacitor` + `passive-inductor` + `passive-resistor` + `quartz-components` should roll up under **被動元件** with product-level children.
- `hbm` + `cxl-technology` + `niche-memory` + `memory-modules` should roll up under **記憶體** with product/technology children.
- `leo-satellite` + `edge-ai` can feed **軌道 AI 運算**, but this should remain `watchlist` until role/product evidence proves the AI-computing part, not just satellite communication.

## Canonical Topics Coverage

The canonical taxonomy covers all 81 retired legacy topic ids exactly once, using 39 canonical topics. It is the runtime topic layer for Daily Analysis, UI filtering, role scoring, and future company knowledge expansion.

Current coverage groups:

- AI server cluster: `ai-server`, `ai-server-liquid-cooling`, `ai-server-power-backup`, `ai-server-mechanical`
- Semiconductor / packaging / IC design: `wafer-foundry`, `semiconductor-equipment-materials`, `advanced-packaging`, `ic-design`
- Memory: `hbm`, `cxl-memory-pooling`, `niche-memory`, `memory-modules`
- Networking / optics / substrates / interconnect: `leo-satellite-communications`, `networking-infrastructure`, `silicon-photonics-optical-comm`, `pcb-substrates`, `high-speed-interconnect`
- Passive components: `passive-components` parent plus MLCC, inductor, resistor, quartz children
- Energy / industrial / automation: `energy-storage-battery`, `renewable-energy`, `electrical-equipment-epc`, `industrial-automation`, `robotics-physical-ai`, `edge-ai-aiot`
- Software / consumer / display / medical / financial / shipping / traditional sectors: `software-cloud-security`, `consumer-computing-devices`, `display-led-optics`, `medical-devices`, `financial-services`, `shipping`, `defense-aerospace`, `petrochem-plastics`, `environment-water-recycling`, `ecommerce-retail-logistics`
- Watchlist concepts without direct legacy mapping: `orbital-ai-computing`

Mapping rule: each legacy `slug` should appear in exactly one canonical topic's `legacyTopicIds`. Parent topics may use `childIds` for hierarchy without duplicating a child's legacy mapping.

## Daily Analysis Adoption Rule

Do not let Daily Analysis consume legacy topic names directly as truth.

Adoption order:

1. Use canonical topic if the company has v2 topic role evidence.
2. Use canonical topic activation signals as watch items.
3. Use product knowledge and SWOT only if `relatedTopicIds` map to canonical topics or accepted legacy aliases.
4. If only a retired legacy alias exists, keep it as a mapping hint only; do not create a confident industry thesis without evidence-backed company-topic-role data.

## Not Doing Yet

- Not treating current market popularity as evidence of business exposure.
- Not claiming every company role is evidence-backed just because its retired legacy topic id is mapped.
- Not claiming every company role is V2 evidence-backed just because its legacy topic is now mapped; company-role and SWOT evidence still require separate migration slices.

## Verification

Commands:

```bash
npm test -- --test-name-pattern "CanonicalTopics|canonicalTopics"
npm run knowledge:validate
npm run build
```

Acceptance:

- Canonical topic normalizer filters invalid records.
- Validator checks schema, boundaries, evidence, parent refs, and legacy mappings.
- `canonical-topics.json` validates with zero errors.
- Legacy topics remain runtime fallback.
