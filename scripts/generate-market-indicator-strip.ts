import fs from "node:fs";
import path from "node:path";
import { buildMarketIndicatorStrip, type MarketIndicatorSourceSnapshot } from "../src/lib/marketIndicatorStrip";

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, "public/data/market-indicator-source.json");
const OUTPUT_PATH = path.join(ROOT, "public/data/market-indicator-strip.json");

function main() {
  const source = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8")) as MarketIndicatorSourceSnapshot;
  const strip = buildMarketIndicatorStrip(source);
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(strip, null, 2)}\n`);
  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)} with ${strip.indicators.length} verified indicators (${strip.status}).`);
}

main();
