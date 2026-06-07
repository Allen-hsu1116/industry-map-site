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

test("all major standalone pages use the shared taste shell and panel primitives", () => {
  const pages = [
    "src/app/topics/page.tsx",
    "src/app/topics/[id]/page.tsx",
    "src/app/companies/CompaniesClient.tsx",
  ];

  for (const pagePath of pages) {
    const page = fs.readFileSync(pagePath, "utf8");
    assert.match(page, /taste-shell/, `${pagePath} should inherit the same emerald-sky shell as home/daily report`);
    assert.match(page, /app-panel/, `${pagePath} should use shared glass panel primitives instead of one-off cards`);
    assert.doesNotMatch(page, /bg-\[#0a0a1a\]/, `${pagePath} should not carry the old flat purple-black background`);
    assert.doesNotMatch(page, /bg-\[#12122a\]/, `${pagePath} should not carry old one-off panel backgrounds`);
    assert.doesNotMatch(page, /text-indigo-300 hover:text-indigo-200/, `${pagePath} should use emerald/sky navigation links, not old indigo links`);
  }
});

test("global CSS defines reusable page and panel primitives for visual consistency", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");

  assert.match(css, /\.app-page/);
  assert.match(css, /\.app-container/);
  assert.match(css, /\.app-panel/);
  assert.match(css, /\.app-link/);
  assert.match(css, /\.app-primary-action/);
});

test("root suspense fallback uses the shared taste shell instead of the old flat background", () => {
  const layout = fs.readFileSync("src/app/layout.tsx", "utf8");

  assert.match(layout, /taste-shell/);
  assert.match(layout, /border-emerald-500\/30 border-t-sky-400/);
  assert.doesNotMatch(layout, /bg-\[#0a0a1a\]/);
  assert.doesNotMatch(layout, /border-indigo-500/);
});
