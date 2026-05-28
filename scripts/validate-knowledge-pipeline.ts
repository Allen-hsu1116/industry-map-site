import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("public/data");
const INDUSTRIES_PATH = path.join(DATA_DIR, "industries.json");
const COMPANIES_PATH = path.join(DATA_DIR, "companies.json");
const SOURCES_PATH = path.join(DATA_DIR, "knowledge-sources.json");
const PRODUCT_KNOWLEDGE_DIR = path.join(DATA_DIR, "product-knowledge");
const COMPANY_TOPIC_ROLES_DIR = path.join(DATA_DIR, "company-topic-roles");
const COMPANY_SWOT_DIR = path.join(DATA_DIR, "company-swot");
const CANONICAL_TOPICS_PATH = path.join(DATA_DIR, "canonical-topics.json");
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

interface ProductKnowledgeFile {
  schemaVersion?: unknown;
  code?: unknown;
  name?: unknown;
  updatedAt?: unknown;
  products?: unknown;
}

interface ProductKnowledgeItem {
  name?: unknown;
  aliases?: unknown;
  category?: unknown;
  plainLanguage?: unknown;
  whyItMatters?: unknown;
  topicFit?: unknown;
  businessImpact?: unknown;
  evidence?: unknown;
  lastVerified?: unknown;
  confidence?: unknown;
}

interface ProductEvidence {
  sourceId?: unknown;
  publisher?: unknown;
  title?: unknown;
  url?: unknown;
  claim?: unknown;
}

interface CompanyTopicRolesFile {
  schemaVersion?: unknown;
  companyCode?: unknown;
  companyName?: unknown;
  updatedAt?: unknown;
  roles?: unknown;
}

interface CompanyTopicRoleItem {
  topicId?: unknown;
  topicName?: unknown;
  topicType?: unknown;
  directness?: unknown;
  supplyChainStage?: unknown;
  roleType?: unknown;
  roleSummary?: unknown;
  products?: unknown;
  customers?: unknown;
  competitors?: unknown;
  risks?: unknown;
  evidence?: unknown;
  confidence?: unknown;
  lastVerified?: unknown;
  status?: unknown;
}

interface CompanyTopicRoleEvidence {
  sourceId?: unknown;
  publisher?: unknown;
  title?: unknown;
  url?: unknown;
  claim?: unknown;
}

interface CompanySwotFile {
  schemaVersion?: unknown;
  companyCode?: unknown;
  companyName?: unknown;
  updatedAt?: unknown;
  items?: unknown;
}

interface CompanySwotItem {
  id?: unknown;
  category?: unknown;
  statement?: unknown;
  rationale?: unknown;
  timeHorizon?: unknown;
  relatedTopicIds?: unknown;
  evidence?: unknown;
  confidence?: unknown;
  lastVerified?: unknown;
  status?: unknown;
}

interface CompanySwotEvidence {
  sourceId?: unknown;
  publisher?: unknown;
  title?: unknown;
  url?: unknown;
  claim?: unknown;
}

interface CanonicalTopicsFile {
  schemaVersion?: unknown;
  updatedAt?: unknown;
  topicDefinition?: unknown;
  topics?: unknown;
}

interface CanonicalTopicItem {
  id?: unknown;
  name?: unknown;
  type?: unknown;
  status?: unknown;
  definition?: unknown;
  whyItMatters?: unknown;
  aliases?: unknown;
  parentId?: unknown;
  childIds?: unknown;
  legacyTopicIds?: unknown;
  include?: unknown;
  exclude?: unknown;
  activationSignals?: unknown;
  evidence?: unknown;
  confidence?: unknown;
  lastVerified?: unknown;
}

interface CanonicalTopicEvidence {
  sourceId?: unknown;
  publisher?: unknown;
  title?: unknown;
  url?: unknown;
  claim?: unknown;
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

function normalizeProductToken(raw: string): string {
  return raw
    .split(/[:：]/)[0]
    .toLowerCase()
    .replace(/[\s\-_/+()（）:：，,。.;；]/g, "")
    .trim();
}

function buildProductKnowledgeAliasMap(): Map<string, Set<string>> {
  const aliasesByCompany = new Map<string, Set<string>>();
  if (!fs.existsSync(PRODUCT_KNOWLEDGE_DIR)) return aliasesByCompany;

  const files = fs.readdirSync(PRODUCT_KNOWLEDGE_DIR).filter((file) => file.endsWith(".json")).sort();
  for (const file of files) {
    const knowledge = readJson<ProductKnowledgeFile>(path.join(PRODUCT_KNOWLEDGE_DIR, file));
    const code = asString(knowledge.code);
    if (!code) continue;

    const aliases = aliasesByCompany.get(code) ?? new Set<string>();
    const products = asArray(knowledge.products) as ProductKnowledgeItem[];
    for (const product of products) {
      const candidates = [asString(product.name), ...asArray(product.aliases).map(asString)].filter((value): value is string => Boolean(value));
      for (const candidate of candidates) {
        const token = normalizeProductToken(candidate);
        if (token) aliases.add(token);
      }
    }
    aliasesByCompany.set(code, aliases);
  }

  return aliasesByCompany;
}

function hasProductKnowledgeAlias(code: string | undefined, product: string, aliasesByCompany: Map<string, Set<string>>): boolean {
  if (!code) return false;
  const productToken = normalizeProductToken(product);
  if (!productToken) return false;
  const aliases = aliasesByCompany.get(code);
  if (!aliases?.size) return false;

  for (const alias of aliases) {
    if (productToken === alias || productToken.includes(alias) || alias.includes(productToken)) return true;
  }
  return false;
}

function normalizeRelevance(value: unknown): string | undefined {
  if (typeof value === "number") return String(value);
  return asString(value);
}

function collectIndustryGraph(industries: IndustriesFile, issues: QualityIssue[], productKnowledgeAliases = new Map<string, Set<string>>()) {
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
          if (isBareNounProduct(product) && !hasProductKnowledgeAlias(code, product, productKnowledgeAliases)) {
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

function validateSources(sources: KnowledgeSource[], issues: QualityIssue[]): Set<string> {
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
  return ids;
}

function validateProductKnowledge(sourceIds: Set<string>, issues: QualityIssue[]): number {
  if (!fs.existsSync(PRODUCT_KNOWLEDGE_DIR)) return 0;
  const files = fs.readdirSync(PRODUCT_KNOWLEDGE_DIR).filter((file) => file.endsWith(".json")).sort();
  let productKnowledgeCount = 0;

  files.forEach((file) => {
    const knowledge = readJson<ProductKnowledgeFile>(path.join(PRODUCT_KNOWLEDGE_DIR, file));
    const filePath = `product-knowledge/${file}`;
    const code = asString(knowledge.code);
    if (!code) addIssue(issues, "error", "product_knowledge.missing_code", `${filePath}.code`, `${filePath} is missing company code`);
    if (!asString(knowledge.name)) addIssue(issues, "warning", "product_knowledge.missing_name", `${filePath}.name`, `${filePath} is missing company name`);
    if (!asString(knowledge.updatedAt)) addIssue(issues, "warning", "product_knowledge.missing_updated_at", `${filePath}.updatedAt`, `${filePath} is missing updatedAt`);

    const products = asArray(knowledge.products) as ProductKnowledgeItem[];
    if (products.length === 0) addIssue(issues, "warning", "product_knowledge.no_products", `${filePath}.products`, `${filePath} has no products`);
    productKnowledgeCount += products.length;

    products.forEach((product, index) => {
      const productPath = `${filePath}.products[${index}]`;
      const name = asString(product.name);
      if (!name) addIssue(issues, "error", "product_knowledge.product_missing_name", `${productPath}.name`, "Product knowledge item is missing name");
      if (!asString(product.category)) addIssue(issues, "warning", "product_knowledge.product_missing_category", `${productPath}.category`, `${name ?? "Product"} is missing category`);
      const plainLanguage = asString(product.plainLanguage);
      if (!plainLanguage) addIssue(issues, "error", "product_knowledge.product_missing_plain_language", `${productPath}.plainLanguage`, `${name ?? "Product"} must explain what it is`);
      if (plainLanguage && plainLanguage.length < 30) addIssue(issues, "warning", "product_knowledge.product_short_plain_language", `${productPath}.plainLanguage`, `${name ?? "Product"} explanation is too short`);
      const whyItMatters = asString(product.whyItMatters);
      if (!whyItMatters) addIssue(issues, "error", "product_knowledge.product_missing_why", `${productPath}.whyItMatters`, `${name ?? "Product"} must explain why it matters`);
      if (!asString(product.lastVerified)) addIssue(issues, "warning", "product_knowledge.product_missing_last_verified", `${productPath}.lastVerified`, `${name ?? "Product"} is missing lastVerified`);
      const confidence = asString(product.confidence);
      if (!confidence || !["high", "medium", "low"].includes(confidence)) addIssue(issues, "warning", "product_knowledge.product_invalid_confidence", `${productPath}.confidence`, `${name ?? "Product"} confidence must be high/medium/low`);

      const evidence = asArray(product.evidence) as ProductEvidence[];
      if (evidence.length === 0) addIssue(issues, "error", "product_knowledge.product_missing_evidence", `${productPath}.evidence`, `${name ?? "Product"} must have evidence`);
      evidence.forEach((source, sourceIndex) => {
        const evidencePath = `${productPath}.evidence[${sourceIndex}]`;
        const sourceId = asString(source.sourceId);
        if (!sourceId) addIssue(issues, "error", "product_knowledge.evidence_missing_source_id", `${evidencePath}.sourceId`, `${name ?? "Product"} evidence is missing sourceId`);
        else if (!sourceIds.has(sourceId)) addIssue(issues, "error", "product_knowledge.evidence_unknown_source_id", `${evidencePath}.sourceId`, `${name ?? "Product"} evidence sourceId ${sourceId} is absent from knowledge-sources.json`);
        if (!asString(source.claim)) addIssue(issues, "warning", "product_knowledge.evidence_missing_claim", `${evidencePath}.claim`, `${name ?? "Product"} evidence should state the supported claim`);
        const url = asString(source.url);
        if (url && !/^https?:\/\//.test(url)) addIssue(issues, "warning", "product_knowledge.evidence_invalid_url", `${evidencePath}.url`, `${name ?? "Product"} evidence URL is not http(s)`);
      });
    });
  });

  return productKnowledgeCount;
}

function validateCompanyTopicRoles(sourceIds: Set<string>, issues: QualityIssue[]): number {
  if (!fs.existsSync(COMPANY_TOPIC_ROLES_DIR)) return 0;
  const files = fs.readdirSync(COMPANY_TOPIC_ROLES_DIR).filter((file) => file.endsWith(".json")).sort();
  const validTopicTypes = new Set(["theme", "technology", "product", "process", "supply_chain_segment", "end_market"]);
  const validDirectness = new Set(["core", "direct_enabler", "supplier", "customer_or_channel", "indirect", "rejected"]);
  const validConfidence = new Set(["high", "medium", "low", "insufficient", "unverified"]);
  const validStatus = new Set(["verified", "candidate", "rejected"]);
  let roleCount = 0;

  files.forEach((file) => {
    const knowledge = readJson<CompanyTopicRolesFile>(path.join(COMPANY_TOPIC_ROLES_DIR, file));
    const filePath = `company-topic-roles/${file}`;
    const code = asString(knowledge.companyCode);
    if (knowledge.schemaVersion !== 1) addIssue(issues, "error", "topic_roles.invalid_schema", `${filePath}.schemaVersion`, `${filePath} schemaVersion must be 1`);
    if (!code) addIssue(issues, "error", "topic_roles.missing_code", `${filePath}.companyCode`, `${filePath} is missing companyCode`);
    if (!asString(knowledge.companyName)) addIssue(issues, "warning", "topic_roles.missing_name", `${filePath}.companyName`, `${filePath} is missing companyName`);
    if (!asString(knowledge.updatedAt)) addIssue(issues, "warning", "topic_roles.missing_updated_at", `${filePath}.updatedAt`, `${filePath} is missing updatedAt`);

    const roles = asArray(knowledge.roles) as CompanyTopicRoleItem[];
    if (roles.length === 0) addIssue(issues, "warning", "topic_roles.no_roles", `${filePath}.roles`, `${filePath} has no roles`);
    roleCount += roles.length;

    roles.forEach((role, index) => {
      const rolePath = `${filePath}.roles[${index}]`;
      const topicId = asString(role.topicId);
      if (!topicId) addIssue(issues, "error", "topic_roles.role_missing_topic", `${rolePath}.topicId`, "Topic role is missing topicId");
      if (!asString(role.topicName)) addIssue(issues, "warning", "topic_roles.role_missing_topic_name", `${rolePath}.topicName`, `${topicId ?? "Topic role"} is missing topicName`);
      const topicType = asString(role.topicType);
      if (!topicType || !validTopicTypes.has(topicType)) addIssue(issues, "error", "topic_roles.invalid_topic_type", `${rolePath}.topicType`, `${topicId ?? "Topic role"} topicType is invalid`);
      const directness = asString(role.directness);
      if (!directness || !validDirectness.has(directness)) addIssue(issues, "error", "topic_roles.invalid_directness", `${rolePath}.directness`, `${topicId ?? "Topic role"} directness is invalid`);
      if (!asString(role.supplyChainStage)) addIssue(issues, "error", "topic_roles.missing_stage", `${rolePath}.supplyChainStage`, `${topicId ?? "Topic role"} is missing supplyChainStage`);
      if (!asString(role.roleType)) addIssue(issues, "error", "topic_roles.missing_role_type", `${rolePath}.roleType`, `${topicId ?? "Topic role"} is missing roleType`);
      const summary = asString(role.roleSummary);
      if (!summary) addIssue(issues, "error", "topic_roles.missing_summary", `${rolePath}.roleSummary`, `${topicId ?? "Topic role"} is missing roleSummary`);
      if (summary && summary.length < 30) addIssue(issues, "warning", "topic_roles.short_summary", `${rolePath}.roleSummary`, `${topicId ?? "Topic role"} summary is too short`);
      if (asArray(role.products).length === 0) addIssue(issues, "warning", "topic_roles.no_products", `${rolePath}.products`, `${topicId ?? "Topic role"} should list related products`);
      const confidence = asString(role.confidence);
      if (!confidence || !validConfidence.has(confidence)) addIssue(issues, "error", "topic_roles.invalid_confidence", `${rolePath}.confidence`, `${topicId ?? "Topic role"} confidence is invalid`);
      const status = asString(role.status);
      if (!status || !validStatus.has(status)) addIssue(issues, "error", "topic_roles.invalid_status", `${rolePath}.status`, `${topicId ?? "Topic role"} status is invalid`);
      if ((confidence === "high" || confidence === "medium") && !asString(role.lastVerified)) addIssue(issues, "error", "topic_roles.missing_last_verified", `${rolePath}.lastVerified`, `${topicId ?? "Topic role"} high/medium confidence needs lastVerified`);

      const evidence = asArray(role.evidence) as CompanyTopicRoleEvidence[];
      if ((confidence === "high" || confidence === "medium") && evidence.length === 0) addIssue(issues, "error", "topic_roles.missing_evidence", `${rolePath}.evidence`, `${topicId ?? "Topic role"} high/medium confidence needs evidence`);
      evidence.forEach((source, sourceIndex) => {
        const evidencePath = `${rolePath}.evidence[${sourceIndex}]`;
        const sourceId = asString(source.sourceId);
        if (!sourceId) addIssue(issues, "error", "topic_roles.evidence_missing_source_id", `${evidencePath}.sourceId`, `${topicId ?? "Topic role"} evidence is missing sourceId`);
        else if (!sourceIds.has(sourceId)) addIssue(issues, "error", "topic_roles.evidence_unknown_source_id", `${evidencePath}.sourceId`, `${topicId ?? "Topic role"} evidence sourceId ${sourceId} is absent from knowledge-sources.json`);
        if (!asString(source.claim)) addIssue(issues, "warning", "topic_roles.evidence_missing_claim", `${evidencePath}.claim`, `${topicId ?? "Topic role"} evidence should state the supported claim`);
        const url = asString(source.url);
        if (url && !/^https?:\/\//.test(url)) addIssue(issues, "warning", "topic_roles.evidence_invalid_url", `${evidencePath}.url`, `${topicId ?? "Topic role"} evidence URL is not http(s)`);
      });
    });
  });

  return roleCount;
}

function validateCompanySwot(sourceIds: Set<string>, issues: QualityIssue[]): number {
  if (!fs.existsSync(COMPANY_SWOT_DIR)) return 0;
  const files = fs.readdirSync(COMPANY_SWOT_DIR).filter((file) => file.endsWith(".json")).sort();
  const validCategories = new Set(["strength", "weakness", "opportunity", "threat"]);
  const validHorizons = new Set(["structural", "medium_term", "event_driven"]);
  const validConfidence = new Set(["high", "medium", "low", "insufficient", "unverified"]);
  const validStatus = new Set(["verified", "candidate", "rejected"]);
  let itemCount = 0;

  files.forEach((file) => {
    const knowledge = readJson<CompanySwotFile>(path.join(COMPANY_SWOT_DIR, file));
    const filePath = `company-swot/${file}`;
    if (knowledge.schemaVersion !== 1) addIssue(issues, "error", "company_swot.invalid_schema", `${filePath}.schemaVersion`, `${filePath} schemaVersion must be 1`);
    if (!asString(knowledge.companyCode)) addIssue(issues, "error", "company_swot.missing_code", `${filePath}.companyCode`, `${filePath} is missing companyCode`);
    if (!asString(knowledge.companyName)) addIssue(issues, "warning", "company_swot.missing_name", `${filePath}.companyName`, `${filePath} is missing companyName`);
    if (!asString(knowledge.updatedAt)) addIssue(issues, "warning", "company_swot.missing_updated_at", `${filePath}.updatedAt`, `${filePath} is missing updatedAt`);

    const items = asArray(knowledge.items) as CompanySwotItem[];
    if (items.length === 0) addIssue(issues, "warning", "company_swot.no_items", `${filePath}.items`, `${filePath} has no SWOT items`);
    itemCount += items.length;

    items.forEach((item, index) => {
      const itemPath = `${filePath}.items[${index}]`;
      const id = asString(item.id);
      if (!id) addIssue(issues, "error", "company_swot.item_missing_id", `${itemPath}.id`, "SWOT item is missing id");
      const category = asString(item.category);
      if (!category || !validCategories.has(category)) addIssue(issues, "error", "company_swot.invalid_category", `${itemPath}.category`, `${id ?? "SWOT item"} category is invalid`);
      const statement = asString(item.statement);
      if (!statement) addIssue(issues, "error", "company_swot.missing_statement", `${itemPath}.statement`, `${id ?? "SWOT item"} is missing statement`);
      if (statement && statement.length < 20) addIssue(issues, "warning", "company_swot.short_statement", `${itemPath}.statement`, `${id ?? "SWOT item"} statement is too short`);
      const rationale = asString(item.rationale);
      if (!rationale) addIssue(issues, "error", "company_swot.missing_rationale", `${itemPath}.rationale`, `${id ?? "SWOT item"} is missing rationale`);
      const horizon = asString(item.timeHorizon);
      if (!horizon || !validHorizons.has(horizon)) addIssue(issues, "error", "company_swot.invalid_horizon", `${itemPath}.timeHorizon`, `${id ?? "SWOT item"} timeHorizon is invalid`);
      const confidence = asString(item.confidence);
      if (!confidence || !validConfidence.has(confidence)) addIssue(issues, "error", "company_swot.invalid_confidence", `${itemPath}.confidence`, `${id ?? "SWOT item"} confidence is invalid`);
      const status = asString(item.status);
      if (!status || !validStatus.has(status)) addIssue(issues, "error", "company_swot.invalid_status", `${itemPath}.status`, `${id ?? "SWOT item"} status is invalid`);
      if ((confidence === "high" || confidence === "medium") && !asString(item.lastVerified)) addIssue(issues, "error", "company_swot.missing_last_verified", `${itemPath}.lastVerified`, `${id ?? "SWOT item"} high/medium confidence needs lastVerified`);

      const evidence = asArray(item.evidence) as CompanySwotEvidence[];
      if ((confidence === "high" || confidence === "medium") && evidence.length === 0) addIssue(issues, "error", "company_swot.missing_evidence", `${itemPath}.evidence`, `${id ?? "SWOT item"} high/medium confidence needs evidence`);
      evidence.forEach((source, sourceIndex) => {
        const evidencePath = `${itemPath}.evidence[${sourceIndex}]`;
        const sourceId = asString(source.sourceId);
        if (!sourceId) addIssue(issues, "error", "company_swot.evidence_missing_source_id", `${evidencePath}.sourceId`, `${id ?? "SWOT item"} evidence is missing sourceId`);
        else if (!sourceIds.has(sourceId)) addIssue(issues, "error", "company_swot.evidence_unknown_source_id", `${evidencePath}.sourceId`, `${id ?? "SWOT item"} evidence sourceId ${sourceId} is absent from knowledge-sources.json`);
        if (!asString(source.claim)) addIssue(issues, "warning", "company_swot.evidence_missing_claim", `${evidencePath}.claim`, `${id ?? "SWOT item"} evidence should state the supported claim`);
        const url = asString(source.url);
        if (url && !/^https?:\/\//.test(url)) addIssue(issues, "warning", "company_swot.evidence_invalid_url", `${evidencePath}.url`, `${id ?? "SWOT item"} evidence URL is not http(s)`);
      });
    });
  });

  return itemCount;
}

function validateCanonicalTopics(sourceIds: Set<string>, legacyTopicIds: Set<string>, issues: QualityIssue[]): number {
  if (!fs.existsSync(CANONICAL_TOPICS_PATH)) return 0;
  const knowledge = readJson<CanonicalTopicsFile>(CANONICAL_TOPICS_PATH);
  const filePath = "canonical-topics.json";
  const validTopicTypes = new Set(["theme", "technology", "product", "process", "supply_chain_segment", "end_market"]);
  const validStatuses = new Set(["active", "watchlist", "legacy_candidate", "deprecated", "rejected"]);
  const validConfidence = new Set(["high", "medium", "low", "insufficient", "unverified"]);
  const topicIds = new Set<string>();
  const parentRefs: Array<{ topicId: string; parentId: string; path: string }> = [];
  let topicCount = 0;

  if (knowledge.schemaVersion !== 1) addIssue(issues, "error", "canonical_topics.invalid_schema", `${filePath}.schemaVersion`, `${filePath} schemaVersion must be 1`);
  if (!asString(knowledge.updatedAt)) addIssue(issues, "warning", "canonical_topics.missing_updated_at", `${filePath}.updatedAt`, `${filePath} is missing updatedAt`);
  const topicDefinition = knowledge.topicDefinition && typeof knowledge.topicDefinition === "object" ? knowledge.topicDefinition as Record<string, unknown> : {};
  if (!asString(topicDefinition.rule)) addIssue(issues, "error", "canonical_topics.missing_definition_rule", `${filePath}.topicDefinition.rule`, "Canonical topic definition rule is required");
  if (asArray(topicDefinition.notTopic).length === 0) addIssue(issues, "warning", "canonical_topics.missing_not_topic", `${filePath}.topicDefinition.notTopic`, "Canonical topic definition should list non-topic boundaries");

  const topics = asArray(knowledge.topics) as CanonicalTopicItem[];
  if (topics.length === 0) addIssue(issues, "error", "canonical_topics.no_topics", `${filePath}.topics`, `${filePath} must define at least one canonical topic`);
  topicCount = topics.length;

  topics.forEach((topic, index) => {
    const topicPath = `${filePath}.topics[${index}]`;
    const id = asString(topic.id);
    if (!id) addIssue(issues, "error", "canonical_topics.topic_missing_id", `${topicPath}.id`, "Canonical topic is missing id");
    else if (topicIds.has(id)) addIssue(issues, "error", "canonical_topics.duplicate_id", `${topicPath}.id`, `Duplicate canonical topic id: ${id}`);
    if (id) topicIds.add(id);
    if (!asString(topic.name)) addIssue(issues, "error", "canonical_topics.topic_missing_name", `${topicPath}.name`, `${id ?? "Canonical topic"} is missing name`);
    const type = asString(topic.type);
    if (!type || !validTopicTypes.has(type)) addIssue(issues, "error", "canonical_topics.invalid_type", `${topicPath}.type`, `${id ?? "Canonical topic"} type is invalid`);
    const status = asString(topic.status);
    if (!status || !validStatuses.has(status)) addIssue(issues, "error", "canonical_topics.invalid_status", `${topicPath}.status`, `${id ?? "Canonical topic"} status is invalid`);
    const confidence = asString(topic.confidence);
    if (!confidence || !validConfidence.has(confidence)) addIssue(issues, "error", "canonical_topics.invalid_confidence", `${topicPath}.confidence`, `${id ?? "Canonical topic"} confidence is invalid`);
    const definition = asString(topic.definition);
    if (!definition) addIssue(issues, "error", "canonical_topics.missing_definition", `${topicPath}.definition`, `${id ?? "Canonical topic"} must define what the topic is`);
    if (definition && definition.length < 30) addIssue(issues, "warning", "canonical_topics.short_definition", `${topicPath}.definition`, `${id ?? "Canonical topic"} definition is too short`);
    const why = asString(topic.whyItMatters);
    if (!why) addIssue(issues, "error", "canonical_topics.missing_why", `${topicPath}.whyItMatters`, `${id ?? "Canonical topic"} must explain why it matters`);
    if (why && why.length < 30) addIssue(issues, "warning", "canonical_topics.short_why", `${topicPath}.whyItMatters`, `${id ?? "Canonical topic"} whyItMatters is too short`);
    if (asArray(topic.include).length === 0) addIssue(issues, "warning", "canonical_topics.missing_include", `${topicPath}.include`, `${id ?? "Canonical topic"} should define include boundaries`);
    if (asArray(topic.exclude).length === 0) addIssue(issues, "warning", "canonical_topics.missing_exclude", `${topicPath}.exclude`, `${id ?? "Canonical topic"} should define exclude boundaries`);
    if (asArray(topic.activationSignals).length === 0) addIssue(issues, "warning", "canonical_topics.missing_activation_signals", `${topicPath}.activationSignals`, `${id ?? "Canonical topic"} should list activation signals`);
    const parentId = asString(topic.parentId);
    if (id && parentId) parentRefs.push({ topicId: id, parentId, path: `${topicPath}.parentId` });

    asArray(topic.legacyTopicIds).map(asString).filter((legacyTopicId): legacyTopicId is string => Boolean(legacyTopicId)).forEach((legacyTopicId, legacyIndex) => {
      if (!legacyTopicIds.has(legacyTopicId)) addIssue(issues, "warning", "canonical_topics.unknown_legacy_topic", `${topicPath}.legacyTopicIds[${legacyIndex}]`, `${id ?? "Canonical topic"} maps unknown legacy topic ${legacyTopicId}`);
    });

    if ((confidence === "high" || confidence === "medium") && !asString(topic.lastVerified)) addIssue(issues, "error", "canonical_topics.missing_last_verified", `${topicPath}.lastVerified`, `${id ?? "Canonical topic"} high/medium confidence needs lastVerified`);
    const evidence = asArray(topic.evidence) as CanonicalTopicEvidence[];
    if ((confidence === "high" || confidence === "medium") && evidence.length === 0) addIssue(issues, "error", "canonical_topics.missing_evidence", `${topicPath}.evidence`, `${id ?? "Canonical topic"} high/medium confidence needs evidence`);
    evidence.forEach((source, sourceIndex) => {
      const evidencePath = `${topicPath}.evidence[${sourceIndex}]`;
      const sourceId = asString(source.sourceId);
      if (!sourceId) addIssue(issues, "error", "canonical_topics.evidence_missing_source_id", `${evidencePath}.sourceId`, `${id ?? "Canonical topic"} evidence is missing sourceId`);
      else if (!sourceIds.has(sourceId)) addIssue(issues, "error", "canonical_topics.evidence_unknown_source_id", `${evidencePath}.sourceId`, `${id ?? "Canonical topic"} evidence sourceId ${sourceId} is absent from knowledge-sources.json`);
      if (!asString(source.claim)) addIssue(issues, "warning", "canonical_topics.evidence_missing_claim", `${evidencePath}.claim`, `${id ?? "Canonical topic"} evidence should state the supported claim`);
    });
  });

  parentRefs.forEach((ref) => {
    if (!topicIds.has(ref.parentId)) addIssue(issues, "error", "canonical_topics.unknown_parent", ref.path, `${ref.topicId} parentId ${ref.parentId} is not a canonical topic`);
  });

  return topicCount;
}

function main() {
  const issues: QualityIssue[] = [];
  const industries = readJson<IndustriesFile>(INDUSTRIES_PATH);
  const companies = readJson<CompanyIndexItem[]>(COMPANIES_PATH);
  const sources = fs.existsSync(SOURCES_PATH) ? readJson<KnowledgeSource[]>(SOURCES_PATH) : [];

  const productKnowledgeAliases = buildProductKnowledgeAliasMap();
  const graph = collectIndustryGraph(industries, issues, productKnowledgeAliases);
  validateCompaniesIndex(companies, graph.companyToTopics, issues);
  const sourceIds = validateSources(sources, issues);
  const productKnowledgeItems = validateProductKnowledge(sourceIds, issues);
  const companyTopicRoles = validateCompanyTopicRoles(sourceIds, issues);
  const companySwotItems = validateCompanySwot(sourceIds, issues);
  const canonicalTopics = validateCanonicalTopics(sourceIds, graph.topicSlugs, issues);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      topics: graph.topics.length,
      companiesInGraph: graph.companyToTopics.size,
      companyRoles: graph.companyRoleCount,
      products: graph.productCount,
      productKnowledgeItems,
      companyTopicRoles,
      companySwotItems,
      canonicalTopics,
      knowledgeSources: sources.length,
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
    },
    issues,
  };

  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Knowledge validation report written to ${path.relative(process.cwd(), REPORT_PATH)}`);
  console.log(`Topics: ${report.summary.topics}, companies: ${report.summary.companiesInGraph}, roles: ${report.summary.companyRoles}`);
  console.log(`Product knowledge items: ${report.summary.productKnowledgeItems}, company topic roles: ${report.summary.companyTopicRoles}, company SWOT items: ${report.summary.companySwotItems}, canonical topics: ${report.summary.canonicalTopics}, sources: ${report.summary.knowledgeSources}`);
  console.log(`Errors: ${report.summary.errors}, warnings: ${report.summary.warnings}`);

  if (report.summary.errors > 0) {
    process.exitCode = 1;
  }
}

main();
