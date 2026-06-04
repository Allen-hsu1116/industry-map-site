import fs from "node:fs";
import path from "node:path";
import { buildLargeHolderRanking, type LargeHolderCompanyInput, type LargeHolderTier, type LargeHolderWindow } from "../src/lib/largeHolderRanking";

interface LargeHolderSampleArtifact {
  schemaVersion: 1;
  generatedAt: string;
  source: {
    name: string;
    retrieval: string;
    scope: string;
    semantics: string;
  };
  companies: LargeHolderCompanyInput[];
}

const ROOT = process.cwd();
const SAMPLE_PATH = path.join(ROOT, "public/data/large-holder-sample.json");
const OUTPUT_PATH = path.join(ROOT, "public/data/large-holder-ranking.json");

function main(): void {
  const sample = JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8")) as LargeHolderSampleArtifact;
  const combinations: Array<{ tier: LargeHolderTier; window: LargeHolderWindow }> = [
    { tier: "1m_plus", window: "1w" },
    { tier: "1m_plus", window: "4w" },
    { tier: "400k_plus", window: "1w" },
    { tier: "400k_plus", window: "4w" },
  ];

  const rankings = combinations.map((combo) => buildLargeHolderRanking(sample.companies, { ...combo, topN: 20 }));
  const artifact = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      name: sample.source.name,
      scope: sample.source.scope,
      semantics: sample.source.semantics,
      warning: "tracked sample only, not full market; do not compare this as a complete TWSE/OTC ranking",
    },
    rankings,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)} with ${rankings.length} large-holder rankings from ${sample.companies.length} tracked-sample companies.`);
}

main();
