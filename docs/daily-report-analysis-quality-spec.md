# Daily Report Analysis Quality Display Spec

## Goal

Expose the evidence quality behind each Daily Analysis card so the UI does not make legacy-only or incomplete knowledge look as reliable as evidence-backed company knowledge.

## Scope

Step 15 adds an `analysisQuality` summary to generated daily analysis JSON and renders it in the Daily Report industry card.

This is a display / transparency slice only. It does **not** yet block recommendations; gating happens in a later slice.

## Data contract

Each generated `public/data/analysis/{code}.json` includes:

```ts
analysisQuality: {
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
  upgradePriority: "high" | "medium" | "low";
  missingKnowledge: Array<"product_knowledge" | "verified_topic_role" | "complete_swot" | "daily_analysis">;
  blockingReasons: string[];
}
```

## Grade semantics

- **A — evidence-backed complete**: product knowledge + verified topic role + complete verified SWOT + canonical daily analysis.
- **B — usable**: verified topic role plus product knowledge or complete SWOT, with canonical daily analysis.
- **C — weak partial**: some V2/product/SWOT knowledge exists, but not enough for a reliable industry thesis.
- **D — legacy only**: current industry analysis is based on legacy fallback.
- **F — insufficient**: no usable industry analysis basis.

## UI requirements

For each Daily Report pick industry card:

1. Show a visible grade badge (`Quality A/B/C/D/F`).
2. Show upgrade priority.
3. For D/F, show an explicit warning that the industry analysis is not evidence-backed enough for strong recommendation confidence.
4. Show missing knowledge chips in human-readable labels.
5. Keep existing provenance label (`V2 已驗證`, `V2 待驗證`, `產業資料待補`, etc.) because provenance and quality answer different questions.

## Non-goals

- Do not rewrite SWOT or product knowledge daily.
- Do not change stock-pick ranking yet.
- Do not move D/F picks out of Top recommendation yet; that belongs to Step 20.
