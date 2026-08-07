import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { resolveRuleId } from "@/lib/ai-workspace/ruleIdMap";
import {
  getReferenceImageRule,
  type ReferenceImageRole,
} from "@/lib/ai-workspace/referenceImageRules";
import {
  getPlatformRulePlatform,
  imageTypes,
  platformRulePlatforms,
  themeMap,
} from "@/lib/ai-workspace/themeMap";
import type {
  ImageType,
  Platform,
  PlatformRulePlatform,
  VisualRule,
  VisualRuleBaselineComparison,
} from "@/lib/ai-workspace/types";

export type PlatformRuleStatus = "enabled" | "disabled" | "draft";
export type PlatformRuleSource = "default" | "custom";

export type PlatformRule = VisualRule & {
  id: string;
  platform: PlatformRulePlatform;
  imageType: ImageType;
  source: PlatformRuleSource;
  status: PlatformRuleStatus;
  version: number;
  updatedAt: string;
  updatedBy?: string;
  visualSpecificationDisplay?: Record<string, string>;
};

export type PlatformRuleUpdateInput = Pick<
  PlatformRule,
  | "id"
  | "status"
  | "designObjective"
  | "visualSpecification"
  | "visualSpecificationDisplay"
  | "mediaGuidance"
  | "promptGuidance"
  | "mediaSelection"
>;

const dataFilePath = path.join(process.cwd(), "data", "platform-rules.json");

const roleLabels: Record<ReferenceImageRole, string> = {
  accessories: "配件图",
  back: "背面图",
  brand_asset: "品牌素材",
  brand_logo: "品牌 Logo",
  detail: "细节图",
  front: "正面图",
  packaging: "包装图",
  ai_generated: "生成图",
  side: "侧面图",
  reference: "参考图",
  user_upload: "用户上传图",
};

const guidanceLabelMap: Record<string, string> = {
  Accessories: "配件图",
  Back: "背面图",
  Brand: "品牌素材",
  "Brand Asset": "品牌素材",
  "Brand Logo": "品牌 Logo",
  Detail: "细节图",
  Front: "正面图",
  Packaging: "包装图",
  Side: "侧面图",
};

function buildRuleId(input: {
  platform: Platform | PlatformRulePlatform;
  imageType: ImageType;
  theme: string;
}) {
  return resolveRuleId(input);
}

function buildRuleKey(input: {
  platform: PlatformRulePlatform;
  imageType: ImageType;
  theme: string;
}) {
  return `${input.platform}__${input.imageType}__${input.theme}`;
}

function formatList(values: string[] | undefined) {
  const normalized = uniqueValues(values ?? []);

  return normalized.length > 0 ? normalized.join("、") : "未设置";
}

function formatBoolean(value: boolean | undefined) {
  if (value === undefined) {
    return "未设置";
  }

  return value ? "是" : "否";
}

function formatRuleValue(value: string | number | boolean | string[] | undefined | null) {
  if (Array.isArray(value)) {
    return formatList(value);
  }

  if (typeof value === "boolean") {
    return formatBoolean(value);
  }

  if (value === null || value === undefined || value === "") {
    return "未设置";
  }

  return String(value);
}

function sameRuleValue(
  left: string | number | boolean | string[] | undefined | null,
  right: string | number | boolean | string[] | undefined | null,
) {
  return formatRuleValue(left) === formatRuleValue(right);
}

function getDisplaySpecification(rule: PlatformRule | null) {
  return {
    ...normalizeSpecification(rule?.visualSpecification),
    ...normalizeSpecification(rule?.visualSpecificationDisplay),
  };
}

function pushDifference(
  differences: VisualRuleBaselineComparison["differences"],
  input: {
    baselineValue: string | number | boolean | string[] | undefined | null;
    currentValue: string | number | boolean | string[] | undefined | null;
    field: string;
    label: string;
  },
) {
  if (sameRuleValue(input.baselineValue, input.currentValue)) {
    return;
  }

  differences.push({
    baselineValue: formatRuleValue(input.baselineValue),
    currentValue: formatRuleValue(input.currentValue),
    effectiveValue: formatRuleValue(input.currentValue),
    field: input.field,
    label: input.label,
  });
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeMediaTypeLabel(value: string) {
  return guidanceLabelMap[value.trim()] || value.trim();
}

function normalizeList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeSpecification(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key.trim(), typeof item === "string" ? item.trim() : ""])
      .filter(([key, item]) => key && item),
  );
}

function defaultMediaSelection(imageType: ImageType, theme: string, rule: VisualRule) {
  const referenceRule = getReferenceImageRule(imageType, theme);
  const primaryTypes = referenceRule
    ? referenceRule.roles.map((role) => roleLabels[role] || role)
    : rule.mediaGuidance.primary;
  const secondaryTypes = uniqueValues([
    ...rule.mediaGuidance.secondary.map(normalizeMediaTypeLabel),
    ...(referenceRule ? referenceRule.roles.map((role) => roleLabels[role] || role) : []),
  ]).filter((item) => !primaryTypes.includes(item));

  return {
    required: Boolean(referenceRule?.defaultCount),
    minCount: referenceRule?.defaultCount ?? 0,
    maxCount: referenceRule?.maxCount ?? Math.max(1, rule.mediaGuidance.primary.length),
    primaryTypes: uniqueValues(primaryTypes),
    secondaryTypes,
    selectionStrategy: "优先已确认图片，其次高评分图片",
    missingBehavior: "提示用户手动选择",
  };
}

function buildSimplifiedVisualRule(input: {
  imageType: ImageType;
  platform: PlatformRulePlatform;
  ruleId: string;
  theme: string;
}): VisualRule {
  const isContentOwned = input.platform === "内容与自营平台";
  const visualSpecification: Record<string, string> = {
    Background:
      input.imageType === "详情页"
        ? "Flexible"
        : "Flexible / Light Neutral Preferred",
    "Copy Space":
      input.theme === "首图"
        ? isContentOwned
          ? "Small approved copy allowed"
          : "No random copy"
        : "Use only approved visible copy when enabled",
    Logo: isContentOwned
        ? "Allowed when confirmed"
        : "Limited / secondary when confirmed",
    "Product Ratio": input.theme === "首图" ? "High" : "Flexible",
  };
  const designObjective =
    input.imageType === "详情页"
      ? "详情页内容图只提供基础商品准确性和合规边界，具体画面完全由设计意图决定。"
      : input.theme === "首图"
        ? "首图优先保证商品主体完整清晰，背景简洁，具体品牌和文案表达按平台大类与设计意图决定。"
        : input.theme === "产品图"
          ? "产品图展示商品卖点、套装、细节、材质、包装或品牌识别，具体方向由设计意图决定。"
          : "使用场景图在真实或轻生活方式场景中展示商品，商品准确和可识别优先。";
  const primary =
    input.theme === "首图"
      ? ["Front", "Accessories", "Packaging"]
      : input.theme === "使用场景图"
        ? ["Front", "Detail", "Brand Logo"]
        : ["Front", "Detail", "Accessories", "Packaging", "Brand Logo"];
  const avoid = [
    "Unverified accessories",
    "Random text",
    "Watermarks",
    "Prices",
    "Discounts",
    "Ratings",
    "Certifications",
    "Collage",
    "Split screen",
    "Comparison layout",
    "Multi-view canvas",
  ];

  return {
    designObjective,
    mediaGuidance: {
      primary,
      secondary: ["Reference", "User Upload"],
    },
    promptGuidance: {
      avoid,
      focus:
        input.imageType === "详情页"
          ? ["Design Intent", "Product Accuracy", "Confirmed Facts"]
          : ["Product Accuracy", input.theme, "Design Intent"],
    },
    ruleId: input.ruleId,
    theme: input.theme,
    visualSpecification,
  };
}

async function buildDefaultRules() {
  const now = new Date().toISOString();
  const rules: PlatformRule[] = [];

  for (const platform of platformRulePlatforms) {
    for (const imageType of imageTypes) {
      for (const theme of themeMap[imageType]) {
        const ruleId = buildRuleId({ imageType, platform, theme });

        if (!ruleId) {
          continue;
        }

        const visualRule = buildSimplifiedVisualRule({
          imageType,
          platform,
          ruleId,
          theme,
        });

        rules.push({
          ...visualRule,
          id: buildRuleKey({ imageType, platform, theme }),
          imageType,
          mediaSelection: defaultMediaSelection(imageType, theme, visualRule),
          platform,
          source: "default",
          status: "enabled",
          updatedAt: now,
          version: 1,
        });
      }
    }
  }

  return rules;
}

function compareRuleWithBaseline(input: {
  baselineRule: PlatformRule | null;
  currentRule: PlatformRule;
}): VisualRuleBaselineComparison {
  const differences: VisualRuleBaselineComparison["differences"] = [];
  const baselineRule = input.baselineRule;
  const currentRule = input.currentRule;
  const baselineSpecification = getDisplaySpecification(baselineRule);
  const currentSpecification = getDisplaySpecification(currentRule);
  const specificationKeys = uniqueValues([
    ...Object.keys(baselineSpecification),
    ...Object.keys(currentSpecification),
  ]);

  if (!baselineRule) {
    return {
      baselineSource: "sop",
      currentSource: currentRule.source,
      differences: [
        {
      baselineValue: "未找到默认规则基线",
          currentValue: currentRule.ruleId,
          effectiveValue: currentRule.ruleId,
          field: "ruleId",
          label: "规则 ID",
        },
      ],
      hasDifferences: true,
      summary: "未找到对应默认规则基线，当前规则无法进行基线对比。",
    };
  }

  pushDifference(differences, {
    baselineValue: baselineRule.designObjective,
    currentValue: currentRule.designObjective,
    field: "designObjective",
    label: "设计目标",
  });

  for (const key of specificationKeys) {
    pushDifference(differences, {
      baselineValue: baselineSpecification[key],
      currentValue: currentSpecification[key],
      field: `visualSpecification.${key}`,
      label: `视觉规则 / ${key}`,
    });
  }

  pushDifference(differences, {
    baselineValue: baselineRule.mediaGuidance.primary,
    currentValue: currentRule.mediaGuidance.primary,
    field: "mediaGuidance.primary",
    label: "主参考图 Guidance",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.mediaGuidance.secondary,
    currentValue: currentRule.mediaGuidance.secondary,
    field: "mediaGuidance.secondary",
    label: "辅助参考图 Guidance",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.mediaSelection?.primaryTypes,
    currentValue: currentRule.mediaSelection?.primaryTypes,
    field: "mediaSelection.primaryTypes",
    label: "主参考图类型",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.mediaSelection?.secondaryTypes,
    currentValue: currentRule.mediaSelection?.secondaryTypes,
    field: "mediaSelection.secondaryTypes",
    label: "辅助参考图类型",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.mediaSelection?.required,
    currentValue: currentRule.mediaSelection?.required,
    field: "mediaSelection.required",
    label: "是否要求参考图",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.mediaSelection?.minCount,
    currentValue: currentRule.mediaSelection?.minCount,
    field: "mediaSelection.minCount",
    label: "最少参考图数量",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.mediaSelection?.maxCount,
    currentValue: currentRule.mediaSelection?.maxCount,
    field: "mediaSelection.maxCount",
    label: "最多参考图数量",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.promptGuidance.focus,
    currentValue: currentRule.promptGuidance.focus,
    field: "promptGuidance.focus",
    label: "Prompt Focus",
  });
  pushDifference(differences, {
    baselineValue: baselineRule.promptGuidance.avoid,
    currentValue: currentRule.promptGuidance.avoid,
    field: "promptGuidance.avoid",
    label: "Prompt Avoid",
  });

  return {
    baselineSource: "sop",
    currentSource: currentRule.source,
    differences,
    hasDifferences: differences.length > 0,
    summary:
      differences.length > 0
        ? `当前生效规则与默认规则基线存在 ${differences.length} 项差异，最终进入 Prompt 的是当前生效值。`
        : "当前生效规则与默认规则基线一致。",
  };
}

async function readStoredRules() {
  try {
    const raw = await readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return Array.isArray(parsed) ? (parsed as PlatformRule[]) : [];
  } catch {
    return [];
  }
}

async function writeStoredRules(rules: PlatformRule[]) {
  await mkdir(path.dirname(dataFilePath), { recursive: true });
  await writeFile(dataFilePath, `${JSON.stringify(rules, null, 2)}\n`, "utf8");
}

function mergeRules(defaultRules: PlatformRule[], storedRules: PlatformRule[]) {
  const defaultById = new Map(defaultRules.map((rule) => [rule.id, rule]));
  const storedById = new Map(storedRules.map((rule) => [rule.id, rule]));
  const merged = defaultRules.map((defaultRule) => {
    const storedRule = storedById.get(defaultRule.id);

    if (!storedRule) {
      return defaultRule;
    }
    const defaultSelection =
      defaultRule.mediaSelection ??
      defaultMediaSelection(defaultRule.imageType, defaultRule.theme, defaultRule);
    const storedSelection = storedRule.mediaSelection;

    return {
      ...defaultRule,
      ...storedRule,
      mediaGuidance: {
        primary: normalizeList(storedRule.mediaGuidance?.primary),
        secondary: normalizeList(storedRule.mediaGuidance?.secondary),
      },
      mediaSelection: {
        maxCount:
          defaultSelection.maxCount,
        minCount:
          defaultSelection.minCount,
        missingBehavior:
          storedRule.source === "custom"
            ? storedSelection?.missingBehavior || defaultSelection.missingBehavior
            : defaultSelection.missingBehavior,
        primaryTypes:
          storedRule.source === "custom"
            ? normalizeList(storedSelection?.primaryTypes)
            : defaultSelection.primaryTypes,
        required:
          storedRule.source === "custom"
            ? storedSelection?.required ?? defaultSelection.required
            : defaultSelection.required,
        secondaryTypes:
          storedRule.source === "custom"
            ? normalizeList(storedSelection?.secondaryTypes)
            : defaultSelection.secondaryTypes,
        selectionStrategy:
          storedRule.source === "custom"
            ? storedSelection?.selectionStrategy || defaultSelection.selectionStrategy
            : defaultSelection.selectionStrategy,
      },
      promptGuidance: {
        avoid: normalizeList(storedRule.promptGuidance?.avoid),
        focus: normalizeList(storedRule.promptGuidance?.focus),
      },
      visualSpecificationDisplay: normalizeSpecification(storedRule.visualSpecificationDisplay),
      visualSpecification: normalizeSpecification(storedRule.visualSpecification),
    };
  });
  const extraRules = storedRules.filter(
    (rule) =>
      !defaultById.has(rule.id) &&
      platformRulePlatforms.includes(rule.platform) &&
      imageTypes.includes(rule.imageType) &&
      themeMap[rule.imageType]?.includes(rule.theme),
  );

  return [...merged, ...extraRules];
}

export async function getPlatformRules() {
  const defaultRules = await buildDefaultRules();
  const storedRules = await readStoredRules();
  const mergedRules = mergeRules(defaultRules, storedRules);

  await writeStoredRules(mergedRules);

  return mergedRules;
}

function applyPlatformSpecificOverrides(rule: PlatformRule, platform: Platform): PlatformRule {
  if (platform !== "Amazon" || rule.imageType !== "主图" || rule.theme !== "首图") {
    return rule;
  }

  return {
    ...rule,
    designObjective: "Amazon 首图使用白底、无新增 Logo、无营销文案，清晰展示商品和已确认配件。",
    promptGuidance: {
      avoid: uniqueValues([
        ...rule.promptGuidance.avoid,
        "Added logo",
        "Marketing copy",
        "Scene background",
      ]),
      focus: rule.promptGuidance.focus,
    },
    visualSpecification: {
      ...rule.visualSpecification,
      Background: "Pure White",
      "Copy Space": "No",
      Logo: "Forbidden except printed on the real product or packaging",
    },
    visualSpecificationDisplay: {
      ...rule.visualSpecificationDisplay,
      Background: "纯白",
      "Copy Space": "无文案",
      Logo: "禁止新增 Logo",
    },
  };
}

export async function getPlatformRule(input: {
  platform: Platform;
  imageType: ImageType;
  theme: string;
}) {
  const rules = await getPlatformRules();
  const id = buildRuleKey({
    imageType: input.imageType,
    platform: getPlatformRulePlatform(input.platform),
    theme: input.theme,
  });
  const rule = rules.find((item) => item.id === id && item.status === "enabled");

  return rule ? applyPlatformSpecificOverrides(rule, input.platform) : null;
}

export async function getDefaultPlatformRule(input: {
  platform: Platform;
  imageType: ImageType;
  theme: string;
}) {
  const defaultRules = await buildDefaultRules();
  const id = buildRuleKey({
    imageType: input.imageType,
    platform: getPlatformRulePlatform(input.platform),
    theme: input.theme,
  });

  const rule = defaultRules.find((item) => item.id === id && item.status === "enabled") ?? null;

  return rule ? applyPlatformSpecificOverrides(rule, input.platform) : null;
}

export async function getPlatformRuleWithBaseline(input: {
  platform: Platform;
  imageType: ImageType;
  theme: string;
}) {
  const [currentRule, baselineRule] = await Promise.all([
    getPlatformRule(input),
    getDefaultPlatformRule(input),
  ]);

  if (!currentRule) {
    return null;
  }

  return {
    ...currentRule,
    baselineComparison: compareRuleWithBaseline({
      baselineRule,
      currentRule,
    }),
  };
}

export async function updatePlatformRule(input: PlatformRuleUpdateInput) {
  const rules = await getPlatformRules();
  const index = rules.findIndex((rule) => rule.id === input.id);

  if (index === -1) {
    throw new Error("未找到平台规则。");
  }

  const current = rules[index];
  const nextRule: PlatformRule = {
    ...current,
    designObjective: input.designObjective.trim(),
    mediaGuidance: {
      primary: normalizeList(input.mediaGuidance.primary),
      secondary: normalizeList(input.mediaGuidance.secondary),
    },
    mediaSelection: {
      required: Boolean(input.mediaSelection?.required),
      minCount: Number(input.mediaSelection?.minCount ?? 0),
      maxCount: Number(input.mediaSelection?.maxCount ?? 1),
      missingBehavior: input.mediaSelection?.missingBehavior || "提示用户手动选择",
      primaryTypes: normalizeList(input.mediaSelection?.primaryTypes),
      secondaryTypes: normalizeList(input.mediaSelection?.secondaryTypes),
      selectionStrategy: input.mediaSelection?.selectionStrategy || "优先已确认图片，其次高评分图片",
    },
    promptGuidance: {
      avoid: normalizeList(input.promptGuidance.avoid),
      focus: normalizeList(input.promptGuidance.focus),
    },
    source: "custom",
    status: input.status,
    updatedAt: new Date().toISOString(),
    updatedBy: "local-admin",
    version: current.version + 1,
    visualSpecificationDisplay: normalizeSpecification(input.visualSpecificationDisplay),
    visualSpecification: normalizeSpecification(input.visualSpecification),
  };

  rules[index] = nextRule;
  await writeStoredRules(rules);

  return nextRule;
}

export async function resetPlatformRule(ruleId: string) {
  const defaultRules = await buildDefaultRules();
  const rules = await getPlatformRules();
  const defaultRule = defaultRules.find((rule) => rule.id === ruleId);
  const index = rules.findIndex((rule) => rule.id === ruleId);

  if (!defaultRule || index === -1) {
    throw new Error("未找到平台规则。");
  }

  rules[index] = {
    ...defaultRule,
    updatedAt: new Date().toISOString(),
  };
  await writeStoredRules(rules);

  return rules[index];
}
