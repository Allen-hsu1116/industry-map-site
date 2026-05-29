import { directnessLabel, directnessToRelevance, normalizeCompanyTopicRoles, type CompanyTopicRoleItem } from "./companyTopicRoles";
import { normalizeCanonicalTopics, type CanonicalTopic, type CanonicalTopicsFile, type CanonicalTopicType } from "./canonicalTopics";

export interface CanonicalTopicMapCompany {
  code: string;
  name: string;
  role: string;
  relevance: string;
  analysis?: string;
  products?: string[];
  customers?: string[];
  tech_focus?: string[];
}

export interface CanonicalTopicMapGroup {
  name: string;
  level: "upstream" | "midstream" | "downstream" | "peripheral";
  companies: CanonicalTopicMapCompany[];
}

export interface CanonicalTopicMapTopic {
  slug: string;
  name: string;
  description: string;
  total: number;
  groups: CanonicalTopicMapGroup[];
}

export interface CanonicalTopicMapCompanyIndexItem {
  code: string;
  name: string;
  topic_count: number;
  topics: string[];
}

export interface CanonicalTopicMapData {
  schemaVersion: 1;
  generatedAt: string;
  source: "canonical-topics+company-topic-roles";
  stats: {
    total_topics: number;
    unique_companies: number;
    total_companies: number;
  };
  topics: CanonicalTopicMapTopic[];
  companies: CanonicalTopicMapCompanyIndexItem[];
}

interface RawCompanyTopicRoleFile {
  fileName?: string;
  raw: unknown;
}

const TYPE_CATEGORY: Record<CanonicalTopicType, string> = {
  theme: "主題趨勢",
  technology: "技術平台",
  product: "產品應用",
  process: "製程與封測",
  supply_chain_segment: "供應鏈環節",
  end_market: "終端市場",
};

const STAGE_LABELS: Record<string, { name: string; level: CanonicalTopicMapGroup["level"] }> = {
  wafer_fabrication: { name: "晶圓製造與代工", level: "midstream" },
  advanced_packaging: { name: "先進封裝與封測", level: "midstream" },
  packaging_testing: { name: "封裝測試服務", level: "midstream" },
  ic_design: { name: "IC 設計與 IP", level: "upstream" },
  semiconductor_equipment: { name: "半導體設備與零組件", level: "upstream" },
  semiconductor_materials: { name: "半導體材料與耗材", level: "upstream" },
  substrate_pcb: { name: "基板與 PCB", level: "upstream" },
  memory: { name: "記憶體產品", level: "upstream" },
  power: { name: "電源與供電系統", level: "upstream" },
  thermal: { name: "散熱與機構", level: "upstream" },
  optical: { name: "光學與通訊元件", level: "upstream" },
  component: { name: "關鍵零組件", level: "upstream" },
  module: { name: "模組與次系統", level: "midstream" },
  system: { name: "系統整合與整機", level: "downstream" },
  end_market: { name: "終端應用與通路", level: "downstream" },
};

function withCategory(topic: CanonicalTopic): string {
  if (topic.name.includes("｜")) return topic.name;
  return `${TYPE_CATEGORY[topic.type]}｜${topic.name}`;
}

function normalizeStageKey(stage: string): string {
  return stage.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function inferStage(stage: string): { name: string; level: CanonicalTopicMapGroup["level"] } {
  const key = normalizeStageKey(stage);
  if (STAGE_LABELS[key]) return STAGE_LABELS[key];
  if (/material|equipment|component|substrate|pcb|power|thermal|memory|ic_design|ip|optical/.test(key)) {
    return { name: stage || "上游材料與零組件", level: "upstream" };
  }
  if (/fabrication|foundry|packag|testing|module|manufactur|assembly/.test(key)) {
    return { name: stage || "中游製造與封測", level: "midstream" };
  }
  if (/system|server|brand|channel|customer|end|application|odm|oem|ems/.test(key)) {
    return { name: stage || "下游系統與應用", level: "downstream" };
  }
  return { name: stage || "其他供應鏈角色", level: "peripheral" };
}

function relevanceFromRole(role: CompanyTopicRoleItem): string {
  const relevance = directnessToRelevance(role.directness);
  if (relevance === "high") return "高";
  if (relevance === "medium") return "中";
  if (relevance === "low") return "低";
  return "待驗證";
}

export function buildCanonicalTopicMap(rawCanonicalTopics: unknown, roleFiles: RawCompanyTopicRoleFile[], generatedAt = new Date().toISOString()): CanonicalTopicMapData {
  const canonical = normalizeCanonicalTopics(rawCanonicalTopics);
  if (!canonical) {
    throw new Error("canonical-topics.json has invalid schema");
  }
  return buildCanonicalTopicMapFromNormalized(canonical, roleFiles, generatedAt);
}

function buildCanonicalTopicMapFromNormalized(canonical: CanonicalTopicsFile, roleFiles: RawCompanyTopicRoleFile[], generatedAt: string): CanonicalTopicMapData {
  const topicByAnyId = new Map<string, CanonicalTopic>();
  for (const topic of canonical.topics) {
    topicByAnyId.set(topic.id, topic);
    for (const legacyTopicId of topic.legacyTopicIds) topicByAnyId.set(legacyTopicId, topic);
  }

  const groupsByTopic = new Map<string, Map<string, CanonicalTopicMapGroup>>();
  const companyTopics = new Map<string, CanonicalTopicMapCompanyIndexItem>();

  for (const file of roleFiles) {
    const knowledge = normalizeCompanyTopicRoles(file.raw);
    if (!knowledge) continue;

    const seenCompanyTopics = new Set<string>();
    for (const role of knowledge.roles) {
      if (role.status === "rejected" || role.directness === "rejected") continue;
      const topic = topicByAnyId.get(role.topicId);
      if (!topic || topic.status === "rejected" || topic.status === "deprecated") continue;

      const stage = inferStage(role.supplyChainStage);
      const groupKey = `${stage.level}:${stage.name}`;
      let topicGroups = groupsByTopic.get(topic.id);
      if (!topicGroups) {
        topicGroups = new Map();
        groupsByTopic.set(topic.id, topicGroups);
      }
      let group = topicGroups.get(groupKey);
      if (!group) {
        group = { name: stage.name, level: stage.level, companies: [] };
        topicGroups.set(groupKey, group);
      }

      group.companies.push({
        code: knowledge.companyCode,
        name: knowledge.companyName,
        role: role.roleSummary || directnessLabel(role.directness),
        relevance: relevanceFromRole(role),
        analysis: `${directnessLabel(role.directness)}；${role.roleSummary}`,
        products: role.products,
        customers: role.customers,
        tech_focus: [role.roleType, role.supplyChainStage].filter(Boolean),
      });
      seenCompanyTopics.add(topic.id);
    }

    if (seenCompanyTopics.size > 0) {
      companyTopics.set(knowledge.companyCode, {
        code: knowledge.companyCode,
        name: knowledge.companyName,
        topic_count: seenCompanyTopics.size,
        topics: Array.from(seenCompanyTopics).sort(),
      });
    }
  }

  const levelOrder: Record<CanonicalTopicMapGroup["level"], number> = { upstream: 0, midstream: 1, downstream: 2, peripheral: 3 };
  const topics = canonical.topics
    .filter((topic) => topic.status !== "rejected" && topic.status !== "deprecated")
    .map((topic) => {
      const groups = Array.from(groupsByTopic.get(topic.id)?.values() ?? [])
        .map((group) => ({
          ...group,
          companies: group.companies
            .sort((a, b) => b.code.localeCompare(a.code))
            .sort((a, b) => {
              const ra = a.relevance === "高" ? 0 : a.relevance === "中" ? 1 : a.relevance === "低" ? 2 : 3;
              const rb = b.relevance === "高" ? 0 : b.relevance === "中" ? 1 : b.relevance === "低" ? 2 : 3;
              return ra - rb || a.code.localeCompare(b.code);
            }),
        }))
        .sort((a, b) => levelOrder[a.level] - levelOrder[b.level] || a.name.localeCompare(b.name, "zh-TW"));
      const total = new Set(groups.flatMap((group) => group.companies.map((company) => company.code))).size;
      return {
        slug: topic.id,
        name: withCategory(topic),
        description: `${topic.definition} ${topic.whyItMatters}`.trim(),
        total,
        groups,
      };
    })
    .filter((topic) => topic.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "zh-TW"));

  const companies = Array.from(companyTopics.values()).sort((a, b) => b.topic_count - a.topic_count || a.code.localeCompare(b.code));
  const totalCompanies = topics.reduce((sum, topic) => sum + topic.total, 0);

  return {
    schemaVersion: 1,
    generatedAt,
    source: "canonical-topics+company-topic-roles",
    stats: {
      total_topics: topics.length,
      unique_companies: companies.length,
      total_companies: totalCompanies,
    },
    topics,
    companies,
  };
}
