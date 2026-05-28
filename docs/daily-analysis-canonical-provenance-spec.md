# Spec: Daily Analysis Canonical Provenance

## Objective
讓每日選股網站的 Daily Analysis 明確回答「這檔公司參考了什麼產業/題材資訊」，並避免把 legacy / 待驗證資料講成 aistockmap-style 的已驗證核心受惠。

## Scope
本切片只做 Daily Analysis 的產業題材資料基礎與前端呈現：

- 已有 `company-topic-roles` 且 role `status=verified`、`confidence=high|medium`、有 evidence：顯示為 **V2 已驗證**。
- 只有 candidate / low / insufficient / no evidence：顯示為 **V2 待驗證**，分數與文案保守。
- 沒有 V2 role、只靠 legacy `industry_analysis`：顯示為 **Legacy 待驗證**，分數上限不進「核心題材受惠」。
- rejected role 不進產業正向訊號。
- UI 顯示資料基礎 badge、confidence、來源/驗證提示、score factors。

## Commands
- Test: `npm test`
- Knowledge validation: `npm run knowledge:validate`
- Build: `npm run build`
- Lint: `npm run lint`
- Generate daily analysis: `npm run analysis:daily`
- Dev server: `npm run dev`

## Project Structure
- `src/lib/dailyAnalysis.ts`：Daily Analysis deterministic scoring and output schema
- `src/lib/dailyAnalysis.test.ts`：Daily Analysis unit tests
- `src/app/daily-report/page.tsx`：每日選股報告 UI
- `scripts/generate-daily-analysis.ts`：batch analysis JSON generator
- `public/data/analysis/*.json`：generated output

## Code Style
Use explicit provenance fields rather than parsing display text:

```ts
industry: {
  knowledgeBasis: "canonical_verified",
  confidence: "high",
  provenanceLabel: "V2 已驗證",
  verificationNote: "角色已由 canonical topic role + evidence 驗證",
}
```

## Testing Strategy
- Unit tests first for scoring/provenance behavior.
- Regenerate analysis JSON after logic changes.
- Build/lint/knowledge validation before commit.
- Browser check `/daily-report` for badge rendering and console errors.

## Boundaries
- Always: reveal whether analysis is verified canonical or legacy fallback.
- Always: keep legacy fallback conservative and visibly待驗證.
- Always: keep generated timestamp-only churn out of commit unless required.
- Ask first: deleting `industries.json`, changing cron delivery, adding dependencies.
- Never: treat AI wording as evidence; never present rejected/low-confidence roles as core受惠.

## Success Criteria
- Unit tests prove legacy fallback label is not `核心題材受惠` even when legacy relevance is high.
- Unit tests prove verified canonical role can be core受惠 when evidence and signals support it.
- Unit tests prove candidate/low/no-evidence role is marked待驗證 and score is capped below core threshold.
- Daily report UI shows provenance badge and confidence/verification note for each loaded analysis.
- `npm test`, `npm run knowledge:validate`, `npm run build`, `npm run lint` pass.
