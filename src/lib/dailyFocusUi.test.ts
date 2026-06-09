import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("Daily Focus page opens with a Human Editorial thesis before data modules", () => {
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");

  assert.match(page, /daily-focus-editorial-hero/);
  assert.match(page, /每日產業情報/);
  assert.match(page, /今日市場筆記/);
  assert.match(page, /marketThesis/);

  const heroIndex = page.indexOf("daily-focus-editorial-hero");
  const marketOverviewIndex = page.indexOf("{/* Market Overview */}");
  assert.ok(heroIndex > -1, "Daily Focus hero should be present");
  assert.ok(marketOverviewIndex > -1, "Market Overview section should remain present");
  assert.ok(heroIndex < marketOverviewIndex, "Human Editorial thesis must render before the market metric module");
});

test("Daily Focus event cards link outward to topic and company research surfaces without pretending stage data exists", () => {
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");

  assert.match(page, /href=\{`\/topics\/\$\{topic\.topicId\}`\}/);
  assert.match(page, /href=\{`\/\?company=\$\{item\.companyCode\}`\}/);
  assert.match(page, /derived topic mapping/);
  assert.match(page, /stage unavailable/);
  assert.doesNotMatch(page, /href=\{`\/industry-map\?topic=\$\{topic\.topicId\}&stage=/);
});

test("Daily Focus candidate cards lead with a concise analyst decision brief before dense evidence modules", () => {
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");

  assert.match(page, /daily-candidate-decision-brief/);
  assert.match(page, /為何今天看/);
  assert.match(page, /公司角色/);
  assert.match(page, /可能錯在哪/);
  assert.match(page, /下一步觀察/);
  assert.match(page, /buildCandidateDecisionBrief/);

  const briefIndex = page.indexOf("daily-candidate-decision-brief");
  const evidenceGridIndex = page.indexOf("{/* Four columns: Technicals / Fundamentals / Chips / Industry */}");
  assert.ok(briefIndex > -1, "candidate decision brief should be present");
  assert.ok(evidenceGridIndex > -1, "existing evidence modules should remain present");
  assert.ok(briefIndex < evidenceGridIndex, "human decision brief must render before dense evidence modules");
});
