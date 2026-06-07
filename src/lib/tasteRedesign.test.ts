import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("global theme exposes taste-skill inspired dark glass design tokens", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.match(css, /--color-bg: #0f172a/);
  assert.match(css, /--color-surface: rgba\(15, 23, 42, 0\.78\)/);
  assert.match(css, /--color-primary: #34d399/);
  assert.match(css, /--color-secondary-accent: #38bdf8/);
  assert.match(css, /\.taste-shell/);
  assert.match(css, /\.taste-card/);
  assert.match(css, /backdrop-filter: blur\(18px\)/);
});

test("homepage uses taste-shell and emerald-sky accents for the redesigned shell", () => {
  const page = fs.readFileSync("src/app/page.tsx", "utf8");

  assert.match(page, /taste-shell/);
  assert.match(page, /from-emerald-500 to-sky-500/);
  assert.match(page, /text-emerald-400/);
});

test("daily report uses Next Link for internal navigation and the redesigned report shell", () => {
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");

  assert.match(page, /import Link from "next\/link"/);
  assert.match(page, /taste-shell/);
  assert.match(page, /taste-card/);
  assert.doesNotMatch(page, /<a href=\"\/industry-map-site\/?\"/);
  assert.doesNotMatch(page, /<a key=\{`\$\{selectedStrongStockRanking\.timeframe/);
  assert.doesNotMatch(page, /<a key=\{`\$\{selectedLargeHolderRanking\.tier/);
});
