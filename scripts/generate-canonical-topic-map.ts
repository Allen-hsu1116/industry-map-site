import fs from "node:fs";
import path from "node:path";
import { buildCanonicalTopicMap } from "../src/lib/canonicalTopicMap";

const DATA_DIR = path.resolve("public/data");
const CANONICAL_TOPICS_PATH = path.join(DATA_DIR, "canonical-topics.json");
const COMPANY_TOPIC_ROLES_DIR = path.join(DATA_DIR, "company-topic-roles");
const OUTPUT_PATH = path.join(DATA_DIR, "canonical-topic-map.json");

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listJsonFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => path.join(dirPath, fileName));
}

function main() {
  const canonicalTopics = readJson(CANONICAL_TOPICS_PATH);
  const canonicalUpdatedAt = canonicalTopics && typeof canonicalTopics === "object" && "updatedAt" in canonicalTopics
    ? String((canonicalTopics as { updatedAt?: unknown }).updatedAt ?? "")
    : "";
  const roleFiles = listJsonFiles(COMPANY_TOPIC_ROLES_DIR).map((filePath) => ({
    fileName: path.basename(filePath),
    raw: readJson(filePath),
  }));
  const generatedAt = process.env.CANONICAL_TOPIC_MAP_GENERATED_AT ?? (canonicalUpdatedAt ? `${canonicalUpdatedAt}T00:00:00.000Z` : "1970-01-01T00:00:00.000Z");
  const topicMap = buildCanonicalTopicMap(canonicalTopics, roleFiles, generatedAt);

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(topicMap, null, 2)}\n`);
  console.log(`Generated ${path.relative(process.cwd(), OUTPUT_PATH)}: ${topicMap.stats.total_topics} topics, ${topicMap.stats.unique_companies} companies, ${topicMap.stats.total_companies} company-topic entries`);
}

main();
