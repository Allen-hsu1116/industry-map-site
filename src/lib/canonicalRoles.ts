import type { LegacyRoleCandidate } from "./legacyKnowledgeInventory";

export type TopicType = "theme" | "technology" | "product" | "process" | "supply_chain_segment" | "end_market";
export type SupplyChainStage =
  | "raw_material"
  | "component_material"
  | "equipment"
  | "design_ip"
  | "ic_design"
  | "wafer_foundry"
  | "memory_supplier"
  | "packaging"
  | "testing"
  | "substrate"
  | "pcb"
  | "thermal"
  | "power"
  | "chassis_mechanical"
  | "odm_oem"
  | "system_integration"
  | "channel_brand"
  | "end_customer"
  | "unknown";
export type Directness = "core" | "direct_enabler" | "supplier" | "customer_or_channel" | "indirect" | "rejected";

export interface CanonicalRoleCandidateV2 {
  schemaVersion: 1;
  companyCode: string;
  companyName: string;
  topicId: string;
  topicName: string;
  topicType: TopicType;
  directness: Directness;
  supplyChainStage: SupplyChainStage;
  roleType: string;
  roleSummary: string;
  products: string[];
  customers: string[];
  techFocus: string[];
  legacy: {
    topicSlug: string;
    groupName: string;
    relevance: string;
    source: "legacy_industries_json";
  };
  evidence: [];
  confidence: "unverified";
  lastVerified: null;
  status: "candidate";
  needsVerification: true;
}

export interface CanonicalRoleCatalog {
  schemaVersion: 1;
  generatedAt: string;
  summary: {
    roles: number;
    byTopicType: Partial<Record<TopicType, number>>;
    bySupplyChainStage: Partial<Record<SupplyChainStage, number>>;
    byDirectness: Partial<Record<Directness, number>>;
  };
  roles: CanonicalRoleCandidateV2[];
}

function textOf(...values: Array<string | string[]>): string {
  return values.flat().join(" ").toLowerCase();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function mapTopicType(topicId: string, topicName: string): TopicType {
  const text = textOf(topicId, topicName);
  if (hasAny(text, [/cowos/i, /soic/i, /cpo/i, /先進封裝/, /異質整合/])) return "technology";
  if (hasAny(text, [/hbm/i, /abf/i, /ccl/i, /pcb/i, /載板/, /銅箔基板/, /記憶體/])) return "product";
  if (hasAny(text, [/n2/i, /a16/i, /製程/, /2nm/i, /3nm/i])) return "process";
  if (hasAny(text, [/晶圓代工/, /封裝測試/, /散熱/, /電源/, /ic設計/i, /設備/, /材料/, /odm/i, /oem/i, /供應鏈/])) return "supply_chain_segment";
  if (hasAny(text, [/電動車/, /低軌衛星/, /資料中心/, /data center/i, /車用/, /機器人/, /robot/i])) return "end_market";
  return "theme";
}

export function mapSupplyChainStage(groupName: string, role: string, products: string[]): SupplyChainStage {
  const text = textOf(groupName, role, products);
  if (hasAny(text, [/得經營法令非禁止或限制之業務/])) return "unknown";
  if (hasAny(text, [/abf/i, /載板/, /基板/])) return "substrate";
  if (hasAny(text, [/pcb/i, /印刷電路板/, /軟板/])) return "pcb";
  if (hasAny(text, [/晶圓代工/, /foundry/i, /製程/])) return "wafer_foundry";
  if (hasAny(text, [/封裝/, /packaging/i, /cowos/i, /soic/i, /info/i, /sip/i])) return "packaging";
  if (hasAny(text, [/測試/, /testing/i, /probe/i, /cp\b/i])) return "testing";
  if (hasAny(text, [/散熱/, /thermal/i, /水冷/, /風扇/, /導熱/, /均熱板/])) return "thermal";
  if (hasAny(text, [/電源/, /power/i, /ups/i, /充電/])) return "power";
  if (hasAny(text, [/記憶體/, /hbm/i, /dram/i, /nand/i])) return "memory_supplier";
  if (hasAny(text, [/ic設計/i, /晶片設計/, /asic/i, /soc/i])) return "ic_design";
  if (hasAny(text, [/ip矽智財/i, /矽智財/, /eda/i])) return "design_ip";
  if (hasAny(text, [/設備/, /機台/, /equipment/i])) return "equipment";
  if (hasAny(text, [/材料/, /化學品/, /光阻/, /特用氣體/])) return "component_material";
  if (hasAny(text, [/odm/i, /oem/i, /代工組裝/, /伺服器製造/])) return "odm_oem";
  if (hasAny(text, [/系統整合/, /system integration/i])) return "system_integration";
  if (hasAny(text, [/品牌/, /通路/, /channel/i])) return "channel_brand";
  return "unknown";
}

export function mapDirectness(role: LegacyRoleCandidate): Directness {
  const text = textOf(role.role, role.groupName, role.products);
  if (hasAny(text, [/得經營法令非禁止或限制之業務/])) return "rejected";
  if (hasAny(text, [/客戶/, /通路/, /品牌/])) return "customer_or_channel";
  if (hasAny(text, [/材料供應商/, /零組件供應商/, /耗材/, /供應/]) && !hasAny(text, [/核心/])) return "supplier";
  if (role.relevance === "低" || hasAny(text, [/間接/])) return "indirect";
  if (role.relevance === "高" && hasAny(text, [/核心/, /龍頭/, /主要/, /領先/])) return "core";
  if (role.relevance === "高") return "direct_enabler";
  if (role.relevance === "中") return "direct_enabler";
  return "indirect";
}

function roleTypeFor(stage: SupplyChainStage): string {
  return `${stage}_provider`;
}

function increment<T extends string>(map: Partial<Record<T, number>>, key: T) {
  map[key] = (map[key] ?? 0) + 1;
}

export function buildCanonicalRoleCatalog(roleCandidates: LegacyRoleCandidate[], generatedAt = new Date().toISOString()): CanonicalRoleCatalog {
  const roles = roleCandidates
    .map((role): CanonicalRoleCandidateV2 => {
      const topicType = mapTopicType(role.topicId, role.topicName);
      const supplyChainStage = mapSupplyChainStage(role.groupName, role.role, role.products);
      const directness = mapDirectness(role);
      return {
        schemaVersion: 1,
        companyCode: role.companyCode,
        companyName: role.companyName,
        topicId: role.topicId,
        topicName: role.topicName,
        topicType,
        directness,
        supplyChainStage,
        roleType: roleTypeFor(supplyChainStage),
        roleSummary: role.role,
        products: role.products,
        customers: role.customers,
        techFocus: role.techFocus,
        legacy: {
          topicSlug: role.topicId,
          groupName: role.groupName,
          relevance: role.relevance,
          source: role.source,
        },
        evidence: [],
        confidence: "unverified",
        lastVerified: null,
        status: "candidate",
        needsVerification: true,
      };
    })
    .sort((a, b) => a.companyCode.localeCompare(b.companyCode) || a.topicId.localeCompare(b.topicId) || a.supplyChainStage.localeCompare(b.supplyChainStage));

  const byTopicType: Partial<Record<TopicType, number>> = {};
  const bySupplyChainStage: Partial<Record<SupplyChainStage, number>> = {};
  const byDirectness: Partial<Record<Directness, number>> = {};
  for (const role of roles) {
    increment(byTopicType, role.topicType);
    increment(bySupplyChainStage, role.supplyChainStage);
    increment(byDirectness, role.directness);
  }

  return {
    schemaVersion: 1,
    generatedAt,
    summary: {
      roles: roles.length,
      byTopicType,
      bySupplyChainStage,
      byDirectness,
    },
    roles,
  };
}
