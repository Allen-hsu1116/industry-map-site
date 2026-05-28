import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gateDailyReportPicks, isTopRecommendationGrade } from "./dailyReportGating";

test("isTopRecommendationGrade only allows A/B/C into Top recommendation", () => {
  assert.equal(isTopRecommendationGrade("A"), true);
  assert.equal(isTopRecommendationGrade("B"), true);
  assert.equal(isTopRecommendationGrade("C"), true);
  assert.equal(isTopRecommendationGrade("D"), false);
  assert.equal(isTopRecommendationGrade("F"), false);
  assert.equal(isTopRecommendationGrade(undefined), false);
});

test("gateDailyReportPicks separates D/F and missing analysis into observation-only", () => {
  const picks = [
    { rank: 1, code: "2330" },
    { rank: 2, code: "2337" },
    { rank: 3, code: "2344" },
    { rank: 4, code: "9999" },
  ];

  const gated = gateDailyReportPicks(picks, {
    "2330": { analysisQuality: { grade: "A", label: "完整 evidence-backed", blockingReasons: [] } },
    "2337": { analysisQuality: { grade: "D", label: "Legacy only", blockingReasons: ["legacy_only"] } },
    "2344": { analysisQuality: { grade: "F", label: "Insufficient", blockingReasons: ["insufficient_data"] } },
  });

  assert.deepEqual(gated.topRecommendations.map((item) => item.pick.code), ["2330"]);
  assert.deepEqual(gated.observationOnly.map((item) => item.pick.code), ["2337", "2344", "9999"]);
  assert.match(gated.observationOnly[0].reason ?? "", /legacy|觀察/);
  assert.match(gated.observationOnly[1].reason ?? "", /資料不足/);
  assert.match(gated.observationOnly[2].reason ?? "", /缺 Daily Analysis/);
});

test("gateDailyReportPicks demotes A/B/C picks when scoring v3 has a hard risk gate", () => {
  const gated = gateDailyReportPicks([{ rank: 1, code: "2330" }], {
    "2330": {
      analysisQuality: { grade: "A", label: "完整 evidence-backed", blockingReasons: [] },
      scoring: {
        recommendationState: "blocked",
        riskGates: [{ id: "risk.stop-distance", severity: "hard", message: "停損距離過大，不推薦" }],
      },
    },
  });

  assert.deepEqual(gated.topRecommendations, []);
  assert.deepEqual(gated.observationOnly.map((item) => item.pick.code), ["2330"]);
  assert.match(gated.observationOnly[0].reason ?? "", /風控硬閘門|停損距離/);
});

test("checked-in daily report never renders D/F picks as top recommendations after gating", () => {
  const dataDir = join(process.cwd(), "public", "data");
  const report = JSON.parse(readFileSync(join(dataDir, "daily-report.json"), "utf8")) as {
    picks: Array<{ rank: number; code: string; name: string }>;
  };

  const analysesByCode = Object.fromEntries(
    report.picks.map((pick) => {
      const analysis = JSON.parse(readFileSync(join(dataDir, "analysis", `${pick.code}.json`), "utf8")) as {
        analysisQuality?: { grade?: "A" | "B" | "C" | "D" | "F"; label?: string; blockingReasons?: string[] };
      };
      return [pick.code, analysis];
    }),
  );

  const gated = gateDailyReportPicks(report.picks, analysesByCode);

  assert.equal(gated.topRecommendations.every((item) => isTopRecommendationGrade(item.analysis?.analysisQuality?.grade)), true);
  assert.equal(
    gated.observationOnly.every((item) => !isTopRecommendationGrade(item.analysis?.analysisQuality?.grade)),
    true,
  );
  assert.equal(
    gated.topRecommendations.some((item) => ["D", "F"].includes(item.analysis?.analysisQuality?.grade ?? "")),
    false,
  );
});
