import { createHash } from "node:crypto";

import { promptProviderFactory } from "@/lib/ai-workspace/promptProviderFactory";
import type { PromptModelConfig } from "@/lib/ai-workspace/promptModelConfig";
import type {
  CopyAngle,
  GenerationContext,
  MarketingInference,
  ProductFacts,
  ProductMarketingAnalysis,
} from "@/lib/ai-workspace/types";

export type ProductCopyFactSummary = {
  accessoryFacts: string[];
  brand?: string;
  category?: string;
  color?: string;
  description?: string;
  materialFacts: string[];
  normalizedSize?: string;
  packagingFacts: string[];
  productName: string;
  sellingPointFacts: string[];
  sku: string;
  sourceFacts: string[];
  typeSignals: {
    entryLevel: string[];
    miniatureCraft: string[];
    playableInstrument: string[];
  };
};

type ParsedMarketingAnalysis = Omit<
  ProductMarketingAnalysis,
  "fallbackReason" | "model" | "source"
>;

const marketingAnalysisCache = new Map<string, ProductMarketingAnalysis>();
const maxMarketingAnalysisCacheEntries = 100;

function trimText(value: unknown, maxLength = 160) {
  if (typeof value !== "string") {
    return "";
  }

  return Array.from(value.trim()).slice(0, maxLength).join("");
}

export function splitProductFactList(value: string | undefined | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/[，,、;；\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeInstrumentSize(value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  if (/^4\s*\/?\s*4$/.test(normalized) || normalized === "44") {
    return "4/4";
  }

  return normalized;
}

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim() ?? "")
        .filter(Boolean),
    ),
  ];
}

export function buildProductCopyFactSummary(
  productFacts: ProductFacts,
): ProductCopyFactSummary {
  const accessoryFacts = splitProductFactList(productFacts.accessories);
  const materialFacts = splitProductFactList(productFacts.material);
  const packagingFacts = splitProductFactList(productFacts.packaging);
  const sellingPointFacts = splitProductFactList(productFacts.sellingPoints);
  const normalizedSize = normalizeInstrumentSize(productFacts.size);
  const tags = normalizeTags(productFacts.tags);
  const signalSource = [
    productFacts.name,
    productFacts.category,
    productFacts.description ?? "",
    productFacts.sellingPoints ?? "",
    normalizedSize ?? "",
    ...tags,
  ].join(" ");
  const miniatureCraftSignals = uniqueStrings([
    /(?:1\s*\/\s*64|64\s*分之\s*1|64分之1)/i.test(signalSource)
      ? "尺寸或名称包含 1/64 微缩比例"
      : "",
    /微缩|模型|摆件|陈列品|工艺小提琴|工艺模型/i.test(signalSource)
      ? "名称或描述包含工艺、模型、摆件或微缩语义"
      : "",
  ]);
  const entryLevelSignals = uniqueStrings([
    /普及|入门|初学|新手|beginner/i.test(signalSource)
      ? "名称、描述或卖点包含普及、入门或初学语义"
      : "",
    accessoryFacts.length >= 3
      ? `包含 ${accessoryFacts.length} 类已确认配件，可支持套装便利性判断`
      : "",
  ]);
  const playableInstrumentSignals = uniqueStrings([
    miniatureCraftSignals.length === 0 &&
    /小提琴|violin/i.test(`${productFacts.name} ${productFacts.category ?? ""}`)
      ? "商品类目和名称指向可演奏小提琴"
      : "",
    miniatureCraftSignals.length === 0 &&
    Boolean(normalizedSize) &&
    /^(?:4\/4|3\/4|1\/2|1\/4|1\/8|1\/10|1\/16)$/.test(normalizedSize ?? "")
      ? `尺寸 ${normalizedSize} 属于常见演奏规格`
      : "",
  ]);
  const sourceFacts = uniqueStrings([
    productFacts.brand ? `品牌：${productFacts.brand}` : "",
    `产品：${productFacts.name || productFacts.sku}`,
    productFacts.category ? `类目：${productFacts.category}` : "",
    productFacts.color ? `颜色：${productFacts.color}` : "",
    normalizedSize ? `尺寸：${normalizedSize}` : "",
    ...materialFacts.map((fact) => `材质：${fact}`),
    ...accessoryFacts.map((fact) => `配件：${fact}`),
    ...packagingFacts.map((fact) => `包装：${fact}`),
    ...sellingPointFacts.map((fact) => `已确认卖点：${fact}`),
  ]);

  return {
    accessoryFacts,
    brand: productFacts.brand?.trim() || undefined,
    category: productFacts.category?.trim() || undefined,
    color: productFacts.color?.trim() || undefined,
    description: productFacts.description?.trim() || undefined,
    materialFacts,
    normalizedSize,
    packagingFacts,
    productName: productFacts.name?.trim() || productFacts.sku,
    sellingPointFacts,
    sku: productFacts.sku,
    sourceFacts,
    typeSignals: {
      entryLevel: entryLevelSignals,
      miniatureCraft: miniatureCraftSignals,
      playableInstrument: playableInstrumentSignals,
    },
  };
}

function inference(
  statement: string,
  evidence: string[],
  confidence: MarketingInference["confidence"] = "high",
  reviewRequired = false,
): MarketingInference {
  return {
    confidence,
    evidence,
    reviewRequired,
    statement,
  };
}

function angle(id: string, label: string, reason: string): CopyAngle {
  return { id, label, reason };
}

function hasSolidWood(summary: ProductCopyFactSummary) {
  return /实木|solid wood/i.test(
    `${summary.productName} ${summary.materialFacts.join(" ")}`,
  );
}

function buildMaterialEvidence(summary: ProductCopyFactSummary) {
  return summary.materialFacts.length > 0
    ? summary.materialFacts.map((fact) => `材质：${fact}`)
    : [];
}

export function buildDeterministicMarketingAnalysis(
  productFacts: ProductFacts,
  model: string,
): ProductMarketingAnalysis {
  const summary = buildProductCopyFactSummary(productFacts);
  const isMiniature = summary.typeSignals.miniatureCraft.length > 0;
  const hasEntrySignal =
    summary.typeSignals.entryLevel.some((signal) =>
      /名称、描述或卖点/.test(signal),
    ) && !isMiniature;
  const isPlayable =
    summary.typeSignals.playableInstrument.length > 0 && !isMiniature;
  const accessoryEvidence = summary.accessoryFacts.map(
    (fact) => `已确认配件：${fact}`,
  );
  const materialEvidence = buildMaterialEvidence(summary);
  const valuePillars: MarketingInference[] = [];
  const targetAudiences: MarketingInference[] = [];
  const useCases: MarketingInference[] = [];
  let productType = summary.productName;
  let marketPositioning = summary.productName;
  let recommendedAngles: CopyAngle[] = [];
  let confidence: ProductMarketingAnalysis["confidence"] = "medium";

  if (isMiniature) {
    productType = "微缩工艺小提琴";
    marketPositioning = "音乐主题微缩工艺与陈列产品";
    confidence = "high";
    targetAudiences.push(
      inference(
        "乐器文化爱好者或音乐主题陈列需求",
        summary.typeSignals.miniatureCraft,
        "medium",
        true,
      ),
    );
    useCases.push(
      inference(
        "工艺陈列、音乐主题装饰或礼赠候选",
        summary.typeSignals.miniatureCraft,
        "medium",
        true,
      ),
    );
    recommendedAngles = [
      angle("miniature-scale", "微缩比例", "突出 1/64 等已确认微缩规格"),
      angle("craft-appearance", "工艺外观", "突出颜色、造型和工艺观感"),
      angle("material-detail", "材质细节", "使用已确认材质建立品质认知"),
      angle("display-value", "陈列价值", "表达工艺品的音乐主题与陈列氛围"),
      angle("included-items", "木盒与配件", "明确展示已确认包含物"),
    ];
  } else if (hasEntrySignal && isPlayable) {
    const materialLabel = hasSolidWood(summary) ? "实木" : "";

    productType = `可演奏的${summary.normalizedSize ? `${summary.normalizedSize} ` : ""}小提琴`;
    marketPositioning = `入门级${materialLabel}小提琴${summary.accessoryFacts.length >= 3 ? "套装" : ""}`;
    confidence = "high";
    targetAudiences.push(
      inference(
        "初学者和日常练习用户",
        [
          ...summary.typeSignals.entryLevel,
          ...summary.typeSignals.playableInstrument,
        ],
      ),
    );
    useCases.push(
      inference(
        "音乐入门与日常练习",
        [
          ...summary.typeSignals.entryLevel,
          ...summary.typeSignals.playableInstrument,
        ],
      ),
    );
    recommendedAngles = [
      angle("beginner-positioning", "入门定位", "综合普及定位、演奏规格和套装信息"),
      angle("material-value", "材质价值", "将已确认材质转化为选购价值"),
      angle("bundle-convenience", "套装便利", "表达减少额外选购和准备更省心"),
      angle("size-and-practice", "规格与练习", "突出正常演奏规格和练习场景"),
      angle("appearance-brand", "外观与品牌", "结合颜色、外观和品牌识别"),
    ];
  } else {
    productType = isPlayable ? "可演奏小提琴" : summary.productName;
    marketPositioning = hasSolidWood(summary)
      ? "实木材质小提琴"
      : summary.productName;
    recommendedAngles = [
      angle("product-identity", "产品定位", "清楚表达商品身份和核心规格"),
      angle("material-value", "材质价值", "突出已确认材料配置"),
      angle("appearance", "外观表现", "使用颜色和表面事实建立视觉吸引力"),
      angle("included-items", "配置便利", "根据已确认配件表达选购便利"),
      angle("brand-or-use", "品牌或使用价值", "结合品牌和合理使用方向"),
    ];
  }

  if (materialEvidence.length > 0) {
    valuePillars.push(
      inference(
        hasSolidWood(summary) ? "实木材质带来更明确的入门价值感" : "材质配置清楚可辨",
        materialEvidence,
        "high",
      ),
    );
  }

  if (summary.accessoryFacts.length >= 3) {
    valuePillars.push(
      inference(
        isMiniature ? "木盒与配件让陈列和收纳更完整" : "多种配件减少额外选购，准备更省心",
        accessoryEvidence,
        "high",
      ),
    );
  }

  if (summary.color) {
    valuePillars.push(
      inference(
        `${summary.color}外观具有明确视觉识别`,
        [`颜色：${summary.color}`],
      ),
    );
  }

  if (summary.normalizedSize) {
    valuePillars.push(
      inference(
        isMiniature
          ? `${summary.normalizedSize} 微缩比例是核心差异`
          : `${summary.normalizedSize} 规格便于消费者判断适用尺寸`,
        [`尺寸：${summary.normalizedSize}`],
      ),
    );
  }

  return {
    confidence,
    hardFactBoundaries: summary.sourceFacts,
    highRiskClaims: [
      "错误商品类型、材质、颜色、尺寸、配件数量或包装内容",
      "未验证认证、价格、销量、排名、折扣、保修或保证",
      "未验证专业比赛级、大师制作、医疗功效或量化效果承诺",
      isMiniature
        ? "不得把微缩工艺品描述为标准尺寸、全尺寸、入门练习或可演奏乐器"
        : "",
    ].filter(Boolean),
    marketPositioning,
    model,
    productType,
    recommendedAngles,
    source: "fallback",
    targetAudiences,
    useCases,
    valuePillars,
  };
}

function buildMarketingAnalysisMessages(
  context: GenerationContext,
  summary: ProductCopyFactSummary,
  fallback: ProductMarketingAnalysis,
) {
  return [
    {
      role: "system" as const,
      content: [
        "You are a senior ecommerce product marketing strategist.",
        "Analyze verified product facts before writing any copy.",
        "Infer product type, market positioning, target audience, use cases, purchase value, and five suitable copy angles.",
        "Reasonable marketing inference is encouraged when multiple facts support it; do not merely repeat database fields.",
        "Distinguish playable instruments from miniature craft models before inferring beginner suitability.",
        "Accessories may support convenience and reduced extra purchasing, but accessory count alone does not prove beginner positioning.",
        "Return strict JSON only. Write product type, positioning, audience, evidence, reasons, and other analysis metadata in Simplified Chinese for the review UI.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "Build a product marketing analysis for ecommerce main-image copy.",
        analysisLanguage: "Simplified Chinese",
        futureVisibleCopyLanguage: context.language,
        verifiedProductFacts: summary,
        deterministicTypeGuard: {
          productType: fallback.productType,
          marketPositioning: fallback.marketPositioning,
          signals: summary.typeSignals,
          instruction:
            "Do not contradict strong miniature/playable/entry-level signals. You may improve wording while preserving the classification.",
        },
        inferencePolicy: {
          allowed:
            "Supported positioning, audience, use-case, convenience, emotional value, and creative marketing expression.",
          requiresEvidence:
            "Beginner suitability, practice use, set convenience, material value, and product tier.",
          forbidden:
            "Wrong product type or hard facts; unverified certification, price, sales rank, medical claims, or quantified guarantees.",
        },
        outputContract: {
          productType: "Required concise product type.",
          marketPositioning: "Required concise ecommerce positioning.",
          targetAudiences: [
            {
              statement: "Audience inference.",
              evidence: ["Supporting fact or signal."],
              confidence: "high | medium | low",
              reviewRequired: "boolean",
            },
          ],
          useCases: [
            {
              statement: "Use-case inference.",
              evidence: ["Supporting fact or signal."],
              confidence: "high | medium | low",
              reviewRequired: "boolean",
            },
          ],
          valuePillars: [
            {
              statement: "Customer-relevant purchase value.",
              evidence: ["Supporting fact or signal."],
              confidence: "high | medium | low",
              reviewRequired: "boolean",
            },
          ],
          recommendedAngles: [
            {
              id: "stable-kebab-case-id",
              label: "Short angle label",
              reason: "Why this angle fits the product",
            },
          ],
          hardFactBoundaries: ["Exact fact that must not change."],
          highRiskClaims: ["Claim that should not be generated."],
          confidence: "high | medium | low",
        },
      }),
    },
  ];
}

function readConfidence(
  value: unknown,
  fallback: MarketingInference["confidence"] = "medium",
) {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : fallback;
}

function readInferenceArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): MarketingInference | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const statement = trimText(record.statement);
      const evidence = Array.isArray(record.evidence)
        ? uniqueStrings(record.evidence.map((entry) => trimText(entry, 200))).slice(0, 6)
        : [];

      if (!statement) {
        return null;
      }

      return {
        confidence: readConfidence(record.confidence),
        evidence,
        reviewRequired: Boolean(record.reviewRequired),
        statement,
      };
    })
    .filter((item): item is MarketingInference => Boolean(item))
    .slice(0, 8);
}

function readAngleArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index): CopyAngle | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const label = trimText(record.label, 40);
      const reason = trimText(record.reason, 120);
      const id =
        trimText(record.id, 60)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `angle-${index + 1}`;

      return label && reason ? { id, label, reason } : null;
    })
    .filter((item): item is CopyAngle => Boolean(item))
    .slice(0, 8);
}

function parseJsonObject(content: string) {
  try {
    return JSON.parse(
      content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim(),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseMarketingAnalysis(
  content: string,
): ParsedMarketingAnalysis | null {
  const record = parseJsonObject(content);

  if (!record) {
    return null;
  }

  const productType = trimText(record.productType);
  const marketPositioning = trimText(record.marketPositioning);
  const recommendedAngles = readAngleArray(record.recommendedAngles);

  if (!productType || !marketPositioning || recommendedAngles.length < 3) {
    return null;
  }

  return {
    confidence: readConfidence(record.confidence),
    hardFactBoundaries: Array.isArray(record.hardFactBoundaries)
      ? uniqueStrings(record.hardFactBoundaries.map((value) => trimText(value, 200))).slice(0, 20)
      : [],
    highRiskClaims: Array.isArray(record.highRiskClaims)
      ? uniqueStrings(record.highRiskClaims.map((value) => trimText(value, 200))).slice(0, 20)
      : [],
    marketPositioning,
    productType,
    recommendedAngles,
    targetAudiences: readInferenceArray(record.targetAudiences),
    useCases: readInferenceArray(record.useCases),
    valuePillars: readInferenceArray(record.valuePillars),
  };
}

function enforceClassificationGuard(
  parsed: ParsedMarketingAnalysis,
  fallback: ProductMarketingAnalysis,
  summary: ProductCopyFactSummary,
) {
  const isMiniature = summary.typeSignals.miniatureCraft.length > 0;
  const hasStrongEntrySignal =
    summary.typeSignals.entryLevel.some((signal) =>
      /名称、描述或卖点/.test(signal),
    ) && !isMiniature;

  if (isMiniature) {
    return {
      ...parsed,
      marketPositioning: fallback.marketPositioning,
      productType: fallback.productType,
      recommendedAngles: fallback.recommendedAngles,
      targetAudiences:
        parsed.targetAudiences.length > 0
          ? parsed.targetAudiences.filter(
              (item) => !/初学|入门|练习|演奏/.test(item.statement),
            )
          : fallback.targetAudiences,
      useCases:
        parsed.useCases.length > 0
          ? parsed.useCases.filter(
              (item) => !/初学|入门|练习|演奏/.test(item.statement),
            )
          : fallback.useCases,
    };
  }

  if (hasStrongEntrySignal) {
    return {
      ...parsed,
      marketPositioning: /入门|普及/.test(parsed.marketPositioning)
        ? parsed.marketPositioning
        : fallback.marketPositioning,
    };
  }

  return parsed;
}

function buildCacheKey(
  context: GenerationContext,
  modelConfig: PromptModelConfig,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        model: modelConfig.id,
        productFacts: context.productFacts,
        language: context.language.code,
      }),
    )
    .digest("hex");
}

function storeCachedAnalysis(key: string, analysis: ProductMarketingAnalysis) {
  if (marketingAnalysisCache.size >= maxMarketingAnalysisCacheEntries) {
    const oldestKey = marketingAnalysisCache.keys().next().value;

    if (oldestKey) {
      marketingAnalysisCache.delete(oldestKey);
    }
  }

  marketingAnalysisCache.set(key, analysis);
}

export async function analyzeProductMarketing(input: {
  context: GenerationContext;
  modelConfig: PromptModelConfig;
}) {
  const cacheKey = buildCacheKey(input.context, input.modelConfig);
  const cached = marketingAnalysisCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const summary = buildProductCopyFactSummary(input.context.productFacts);
  const fallback = buildDeterministicMarketingAnalysis(
    input.context.productFacts,
    input.modelConfig.id,
  );

  try {
    const content = await promptProviderFactory.generate({
      messages: buildMarketingAnalysisMessages(
        input.context,
        summary,
        fallback,
      ),
      modelConfig: input.modelConfig,
    });
    const parsed = parseMarketingAnalysis(content);

    if (!parsed) {
      const fallbackResult = {
        ...fallback,
        fallbackReason: "产品营销分析模型返回格式不完整，已使用本地分析兜底。",
      };

      return fallbackResult;
    }

    const guarded = enforceClassificationGuard(parsed, fallback, summary);
    const result: ProductMarketingAnalysis = {
      ...guarded,
      hardFactBoundaries: uniqueStrings([
        ...fallback.hardFactBoundaries,
        ...guarded.hardFactBoundaries,
      ]),
      highRiskClaims: uniqueStrings([
        ...fallback.highRiskClaims,
        ...guarded.highRiskClaims,
      ]),
      model: input.modelConfig.id,
      source: "model",
      valuePillars:
        guarded.valuePillars.length > 0
          ? guarded.valuePillars
          : fallback.valuePillars,
      targetAudiences:
        guarded.targetAudiences.length > 0
          ? guarded.targetAudiences
          : fallback.targetAudiences,
      useCases:
        guarded.useCases.length > 0
          ? guarded.useCases
          : fallback.useCases,
    };

    storeCachedAnalysis(cacheKey, result);
    return result;
  } catch (error) {
    const fallbackResult = {
      ...fallback,
      fallbackReason:
        error instanceof Error
          ? `产品营销分析调用失败，已使用本地分析兜底：${error.message}`
          : "产品营销分析调用失败，已使用本地分析兜底。",
    };

    return fallbackResult;
  }
}
