import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("public/data");
const INDUSTRIES_PATH = path.join(DATA_DIR, "industries.json");
const COMPANIES_PATH = path.join(DATA_DIR, "companies.json");
const SOURCES_PATH = path.join(DATA_DIR, "knowledge-sources.json");
const REPORT_PATH = path.join(DATA_DIR, "knowledge-quality-report.json");

type Severity = "error" | "warning";

interface QualityIssue {
  severity: Severity;
  code: string;
  message: string;
  path: string;
}

interface TopicCompany {
  code?: unknown;
  name?: unknown;
  role?: unknown;
  relevance?: unknown;
  products?: unknown;
  customers?: unknown;
  tech_focus?: unknown;
  swot?: unknown;
}

interface TopicGroup {
  name?: unknown;
  companies?: unknown;
}

interface Topic {
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  groups?: unknown;
}

interface IndustriesFile {
  topics?: unknown;
}

interface CompanyIndexItem {
  code?: unknown;
  name?: unknown;
  topic_count?: unknown;
  topics?: unknown;
}

interface KnowledgeSource {
  id?: unknown;
  publisher?: unknown;
  title?: unknown;
  url?: unknown;
  sourceType?: unknown;
  retrievedAt?: unknown;
  notes?: unknown;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function addIssue(issues: QualityIssue[], severity: Severity, code: string, pathLabel: string, message: string) {
  issues.push({ severity, code, path: pathLabel, message });
}

function isBareNounProduct(product: string): boolean {
  const text = product.trim();
  if (!text) return false;
  const hasExplanationPunctuation = /[，。；：,.;:()（）]/.test(text);
  const hasExplanationVerb = /提供|用於|支援|應用|負責|整合|製造|設計|服務|平台|解決方案|系統|技術|為|是/.test(text);
  return text.length <= 18 && !hasExplanationPunctuation && !hasExplanationVerb;
}

function normalizeRelevance(value: unknown): string | undefined {
  if (typeof value === "number") return String(value);
  return asString(value);
}

function collectIndustryGraph(industries: IndustriesFile, issues: QualityIssue[]) {
  const topics = asArray(industries.topics) as Topic[];
  const topicSlugs = new Set<string>();
  const companyToTopics = new Map<string, { name: string; topics: Set<string> }>();
  let companyRoleCount = 0;
  let productCount = 0;

  if (topics.length === 0) {
    addIssue(issues, "error", "industries.no_topics", "industries.topics", "industries.json must contain a non-empty topics array");
  }

  topics.forEach((topic, topicIndex) => {
    const topicPath = `industries.topics[${topicIndex}]`;
    const slug = asString(topic.slug);
    if (!slug) {
      addIssue(issues, "error", "topic.missing_slug", topicPath, "Topic is missing slug");
      return;
    }
    if (topicSlugs.has(slug)) {
      addIssue(issues, "error", "topic.duplicate_slug", `${topicPath}.slug`, `Duplicate topic slug: ${slug}`);
    }
    topicSlugs.add(slug);

    if (!asString(topic.name)) addIssue(issues, "error", "topic.missing_name", `${topicPath}.name`, `Topic ${slug} is missing name`);
    if (!asString(topic.description)) addIssue(issues, "warning", "topic.missing_description", `${topicPath}.description`, `Topic ${slug} is missing description`);

    const groups = asArray(topic.groups) as TopicGroup[];
    if (groups.length === 0) addIssue(issues, "warning", "topic.no_groups", `${topicPath}.groups`, `Topic ${slug} has no groups`);

    groups.forEach((group, groupIndex) => {
      const groupPath = `${topicPath}.groups[${groupIndex}]`;
      if (!asString(group.name)) addIssue(issues, "warning", "group.missing_name", `${groupPath}.name`, `Group in ${slug} is missing name`);
      const companies = asArray(group.companies) as TopicCompany[];
      if (companies.length === 0) addIssue(issues, "warning", "group.no_companies", `${groupPath}.companies`, `Group in ${slug} has no companies`);

      companies.forEach((company, companyIndex) => {
        const companyPath = `${groupPath}.companies[${companyIndex}]`;
        const code = asString(company.code);
        const name = asString(company.name);
        if (!code) addIssue(issues, "error", "company.missing_code", `${companyPath}.code`, `Company in ${slug} is missing code`);
        if (!name) addIssue(issues, "error", "company.missing_name", `${companyPath}.name`, `Company ${code ?? "(unknown)"} in ${slug} is missing name`);
        if (!asString(company.role)) addIssue(issues, "warning", "company.missing_role", `${companyPath}.role`, `Company ${code ?? "(unknown)"} in ${slug} is missing role`);
        if (!normalizeRelevance(company.relevance)) addIssue(issues, "warning", "company.missing_relevance", `${companyPath}.relevance`, `Company ${code ?? "(unknown)"} in ${slug} is missing relevance`);

        const products = asArray(company.products).filter((item): item is string => typeof item === "string");
        productCount += products.length;
        for (const product of products) {
          if (isBareNounProduct(product)) {
            addIssue(issues, "warning", "product.bare_noun", `${companyPath}.products`, `${code ?? name ?? "Company"} product "${product}" should explain what it is and why it matters`);
          }
        }

        if (code && name) {
          companyRoleCount += 1;
          const existing = companyToTopics.get(code) ?? { name, topics: new Set<string>() };
          existing.topics.add(slug);
          companyToTopics.set(code, existing);
        }
      });
    });
  });

  return { topics, topicSlugs, companyToTopics, companyRoleCount, productCount };
}

function validateCompaniesIndex(companies: CompanyIndexItem[], companyToTopics: Map<string, { name: string; topics: Set<string> }>, issues: QualityIssue[]) {
  const indexCodes = new Set<string>();

  companies.forEach((item, index) => {
    const itemPath = `companies[${index}]`;
    const code = asString(item.code);
    const name = asString(item.name);
    if (!code) {
      addIssue(issues, "error", "index.missing_code", `${itemPath}.code`, "Company index item is missing code");
      return;
    }
    indexCodes.add(code);
    if (!name) addIssue(issues, "warning", "index.missing_name", `${itemPath}.name`, `Company index item ${code} is missing name`);

    const graphEntry = companyToTopics.get(code);
    if (!graphEntry) {
      addIssue(issues, "warning", "index.extra_company", itemPath, `Company index contains ${code}, but it is absent from industries.json`);
      return;
    }

    const expectedTopics = [...graphEntry.topics].sort();
    const actualTopics = asArray(item.topics).filter((topic): topic is string => typeof topic === "string").sort();
    const topicCount = typeof item.topic_count === "number" ? item.topic_count : undefined;

    if (topicCount !== expectedTopics.length) {
      addIssue(issues, "warning", "index.topic_count_drift", `${itemPath}.topic_count`, `${code} topic_count=${topicCount ?? "missing"}, expected ${expectedTopics.length}`);
    }
    if (JSON.stringify(actualTopics) !== JSON.stringify(expectedTopics)) {
      addIssue(issues, "warning", "index.topics_drift", `${itemPath}.topics`, `${code} topics drift from industries graph`);
    }
  });

  for (const code of companyToTopics.keys()) {
    if (!indexCodes.has(code)) {
      addIssue(issues, "warning", "index.missing_company", "companies.json", `Company ${code} exists in industries.json but is missing from companies.json`);
    }
  }
}

function validateSources(sources: KnowledgeSource[], issues: QualityIssue[]) {
  const ids = new Set<string>();
  sources.forEach((source, index) => {
    const sourcePath = `knowledge-sources[${index}]`;
    const id = asString(source.id);
    if (!id) {
      addIssue(issues, "error", "source.missing_id", `${sourcePath}.id`, "Knowledge source is missing id");
      return;
    }
    if (ids.has(id)) addIssue(issues, "error", "source.duplicate_id", `${sourcePath}.id`, `Duplicate source id: ${id}`);
    ids.add(id);
    if (!asString(source.publisher)) addIssue(issues, "warning", "source.missing_publisher", `${sourcePath}.publisher`, `Source ${id} is missing publisher`);
    if (!asString(source.title)) addIssue(issues, "warning", "source.missing_title", `${sourcePath}.title`, `Source ${id} is missing title`);
    const url = asString(source.url);
    if (!url) addIssue(issues, "warning", "source.missing_url", `${sourcePath}.url`, `Source ${id} is missing URL`);
    if (url && !/^https?:\/\//.test(url)) addIssue(issues, "warning", "source.invalid_url", `${sourcePath}.url`, `Source ${id} URL is not http(s)`);
  });
}

function main() {
  const issues: QualityIssue[] = [];
  const industries = readJson<IndustriesFile>(INDUSTRIES_PATH);
  const companies = readJson<CompanyIndexItem[]>(COMPANIES_PATH);
  const sources = fs.existsSync(SOURCES_PATH) ? readJson<KnowledgeSource[]>(SOURCES_PATH) : [];

  const graph = collectIndustryGraph(industries, issues);
  validateCompaniesIndex(companies, graph.companyToTopics, issues);
  validateSources(sources, issues);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      topics: graph.topics.length,
      companiesInGraph: graph.companyToTopics.size,
      companyRoles: graph.companyRoleCount,
      products: graph.productCount,
      knowledgeSources: sources.length,
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
    },
    issues,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Knowledge validation report written to ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log(`Topics: ${report.summary.topics}, companies: ${report.summary.companiesInGraph}, roles: ${report.summary.companyRoles}`);
  console.log(`Errors: ${report.summary.errors}, warnings: ${report.summary.warnings}`);

  if (report.summary.errors > 0) {
    process.exitCode = 1;
  }
}

main();
