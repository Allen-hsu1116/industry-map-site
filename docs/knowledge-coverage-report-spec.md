# Knowledge Coverage Report Spec

## Goal

Make the gap between the Daily Analysis engine and an aistockmap-style finished product measurable. The report must identify which companies have enough evidence-backed knowledge to support product, topic-role, and SWOT analysis, and which companies are still relying on legacy or insufficient data.

## Inputs

- `public/data/companies.json`
- `public/data/analysis/*.json`
- `public/data/product-knowledge/*.json`
- `public/data/company-topic-roles/*.json`
- `public/data/company-swot/*.json`

## Outputs

- `reports/knowledge-coverage-report.json` — generated review artifact, ignored by git.
- `reports/knowledge-coverage-summary.md` — human-readable summary committed to git as the current migration scoreboard.

## Company fields

Each company row must include:

- `code`
- `name`
- `topics`
- `analysisLabel`
- `analysisKnowledgeBasis`
- `hasProductKnowledge`
- `hasVerifiedTopicRole`
- `hasAnyTopicRole`
- `hasCompleteSwot`
- `hasAnySwot`
- `legacyOnly`
- `analysisQuality` — `A | B | C | D | F`
- `missingKnowledge`
- `upgradePriority` — `high | medium | low`
- `blockingReasons`

## Grade rules

- `A`: has verified topic role, product knowledge, complete SWOT, and non-legacy daily analysis.
- `B`: has verified topic role plus at least one of product knowledge or complete SWOT.
- `C`: has partial canonical knowledge, such as candidate roles, product-only, or SWOT-only.
- `D`: daily analysis is legacy-only or only legacy fallback is available.
- `F`: insufficient daily analysis and no usable canonical knowledge.

## Priority rules

- `high`: company is D/F, or appears in checked-in daily analysis but lacks either product knowledge or verified topic role.
- `medium`: company is B/C and missing one major knowledge pillar.
- `low`: company is A, or only minor gaps remain.

## Acceptance criteria

- The report is deterministic.
- Summary contains totals, grade distribution, coverage ratios, and top high-priority upgrade candidates.
- Tests cover grade and priority classification.
- Generated JSON remains ignored; summary markdown is reviewable.
