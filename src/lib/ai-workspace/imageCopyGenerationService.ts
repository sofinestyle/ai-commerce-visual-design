import {
  getPromptModelConfigAsync,
  type PromptModelConfig,
} from "@/lib/ai-workspace/promptModelConfig";
import { promptProviderFactory } from "@/lib/ai-workspace/promptProviderFactory";
import {
  evaluateImageCopyCandidate,
  rankImageCopyCandidates,
  type RawImageCopyCandidate,
  type RejectedImageCopyCandidate,
} from "@/lib/ai-workspace/imageCopyQuality";
import { buildImageCopyLayoutSuggestion } from "@/lib/ai-workspace/imageCopyLayoutService";
import {
  analyzeProductMarketing,
  buildProductCopyFactSummary,
  type ProductCopyFactSummary,
} from "@/lib/ai-workspace/productMarketingAnalysisService";
import type {
  GenerationContext,
  ImageCopyCandidate,
  ImageCopyGenerationResult,
  ProductMarketingAnalysis,
} from "@/lib/ai-workspace/types";
import { getVisibleCopyPolicy } from "@/lib/ai-workspace/visibleCopyPolicy";

export { buildProductCopyFactSummary };

function trimText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return Array.from(value.trim()).slice(0, maxLength).join("");
}

function normalizeCopyText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueStrings(values: string[], limit: number) {
  return [
    ...new Set(values.map((value) => value.trim()).filter(Boolean)),
  ].slice(0, limit);
}

function buildDisabledModelConfig(id: string): PromptModelConfig {
  return {
    apiModel: "",
    disabledReason: "当前 Prompt Model 暂不可用。",
    enabled: false,
    id,
    label: id,
    provider: "openai-compatible",
  };
}

function deriveCopyTone(context: GenerationContext) {
  const source = `${context.theme} ${context.designIntent}`;

  if (/海边|户外|自然|森林|草地|旅行|城市/.test(source)) {
    return "自然、自由、清新，允许适度音乐氛围表达";
  }

  if (/家庭|家居|客厅|学习|练习室|书房|教室/.test(source)) {
    return "温暖、亲和、适合学习与日常练习语境";
  }

  if (/舞台|演出|排练|录音|创作/.test(source)) {
    return "自信、有表现力、具有音乐创作氛围";
  }

  if (/节日|礼赠|礼物|生日|活动/.test(source)) {
    return "温暖、有仪式感、适合礼赠表达";
  }

  return "简洁、可信、有销售力，适合移动端电商主图";
}

function buildRejectedSummary(rejected: RejectedImageCopyCandidate[]) {
  return rejected.slice(0, 12).map((item) => ({
    headline: item.candidate.headline,
    reasons: item.reasons,
  }));
}

export function buildImageCopyModelMessages(input: {
  analysis: ProductMarketingAnalysis;
  context: GenerationContext;
  factSummary: ProductCopyFactSummary;
  repair?: {
    acceptedCount: number;
    rejected: RejectedImageCopyCandidate[];
  };
}) {
  const policy = getVisibleCopyPolicy(input.context.visualRule);
  const repairInstruction = input.repair
    ? {
        acceptedCount: input.repair.acceptedCount,
        rejectedExamples: buildRejectedSummary(input.repair.rejected),
        instruction:
          "Generate fresh alternatives for missing angles. Do not repeat rejected wording or previously identified problems.",
      }
    : undefined;

  return [
    {
      role: "system" as const,
      content: [
        "You are a senior ecommerce product marketing strategist and main-image copywriter.",
        "Use the supplied product marketing analysis to write persuasive consumer-facing copy, not a parameter dump.",
        "Reasonable marketing inference and creative expression are encouraged when supported by the analysis; the user will review and edit every candidate.",
        "Generate 8 to 10 candidates covering distinct recommended angles so the system can select the best three.",
        "Visible copy must communicate product positioning, customer value, material value, set convenience, suitable use, appearance, or emotional value.",
        "Selling point bullets must be shopper-benefit proof points, not raw parameter labels. Translate product facts into purchase reasons for the visible bullets, and keep the raw facts in evidence.",
        "Use mobile-readable text lengths: headline Chinese within 20 characters, English within 40 characters; subheadline Chinese within 24 characters, English within 60 characters; selling point bullets Chinese 6-12 characters, English 2-6 words and maximum 40 characters.",
        "Do not write full sentences as selling point bullets. Rewrite long visible copy shorter instead of relying on truncation.",
        "For example, prefer All Essentials Included, Start Practice Faster, More Value in One Box, Beginner-Friendly Setup, Built for Growing Players, Standout Finish over bare labels like Spruce top, Maple back, 4/4 Full Size, Yellow-Green Finish, Accessories Included, or Ebony fittings.",
        "Never describe the image itself, composition, placement, photography, visibility, background, lighting, layout, copy space, or rendering in headline, subheadline, or sellingPoints.",
        "Do not write phrases such as centered display, clearly visible, shown together, arranged in the frame, studio background, copy space, or layout instructions as selling copy.",
        "Do not contradict product type, material, color, size, included items, packaging, or brand.",
        "Do not invent certification, price, sales rank, medical claims, or quantified guarantees.",
        "Use only the requested output language for visible copy.",
        "Return strict JSON only with a candidates array.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task:
          "Create 8 to 10 differentiated ecommerce main-image copy candidates from the marketing analysis.",
        outputLanguage: input.context.language,
        platform: input.context.platform,
        imageType: input.context.imageType,
        theme: input.context.theme,
        copyTone: deriveCopyTone(input.context),
        copyDensity: policy.copySpace,
        verifiedProductFacts: input.factSummary,
        productMarketingAnalysis: input.analysis,
        repairInstruction,
        fieldBoundary: {
          visibleCopy:
            "headline and subheadline may contain product marketing copy. sellingPoints must be short mobile-readable shopper-benefit proof points, not raw facts, full sentences, or parameter labels.",
          internalMetadata:
            "angle, positioning, audience, evidence, inferenceLevel, confidence, and rationale are for user review and are not visible copy.",
          layout:
            "Do not generate placementHint or styleHint. Layout is resolved separately by the system.",
        },
        inferencePolicy: {
          fact:
            "Direct verified product facts may be used without qualification.",
          supported:
            "Supported inference may express positioning, beginner friendliness, practice value, set convenience, reduced extra purchasing, and customer benefits when the analysis provides evidence.",
          creative:
            "Tasteful emotional or appearance-led expression is allowed and must be marked creative for human review.",
          forbidden:
            "Wrong product type or hard facts; certification, price, sales rank, medical claims, or quantified guarantees.",
        },
        outputContract: {
          candidates: [
            {
              angle: "Required distinct marketing angle.",
              headline:
                "Required consumer-facing headline. Chinese within 20 characters; English within 40 characters.",
              subheadline:
                "Optional supporting line with positioning, value, specification, or benefit; never layout language. Chinese within 24 characters; English within 60 characters.",
              sellingPoints:
                "Required array of 3 concise shopper-benefit proof points. Chinese: 6-12 characters each. English: 2-6 words each, maximum 40 characters. No full sentences, no bare material, size, color, or accessory labels; put raw facts in evidence.",
              positioning:
                "Required concise product positioning used by this candidate.",
              audience:
                "Optional intended customer or use context supported by the analysis.",
              evidence:
                "Required array of 1-4 product facts or analysis signals supporting this candidate.",
              inferenceLevel: "fact | supported | creative",
              confidence: "high | medium | low",
              rationale:
                "Required short Chinese explanation for user review, maximum 120 characters.",
            },
          ],
        },
      }),
    },
  ];
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

function readInferenceLevel(value: unknown) {
  return value === "fact" || value === "supported" || value === "creative"
    ? value
    : "supported";
}

function readConfidence(value: unknown) {
  return value === "high" || value === "medium" || value === "low"
    ? value
    : "medium";
}

export function parseImageCopyModelContent(
  content: string,
): RawImageCopyCandidate[] {
  const parsed = parseJsonObject(content);

  if (!parsed || !Array.isArray(parsed.candidates)) {
    return [];
  }

  const candidates: RawImageCopyCandidate[] = [];

  for (const item of parsed.candidates) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const headline = normalizeCopyText(record.headline);
    const angle = trimText(record.angle, 40);
    const rationale = trimText(record.rationale, 120);
    const positioning = trimText(record.positioning, 100);
    const sellingPoints = Array.isArray(record.sellingPoints)
      ? uniqueStrings(
          record.sellingPoints.map((point) => normalizeCopyText(point)),
          4,
        )
      : [];
    const evidence = Array.isArray(record.evidence)
      ? uniqueStrings(
          record.evidence.map((point) => trimText(point, 160)),
          4,
        )
      : [];

    if (
      !angle ||
      !headline ||
      sellingPoints.length < 3 ||
      !positioning ||
      !rationale
    ) {
      continue;
    }

    candidates.push({
      angle,
      audience: trimText(record.audience, 80) || undefined,
      confidence: readConfidence(record.confidence),
      evidence,
      headline,
      inferenceLevel: readInferenceLevel(record.inferenceLevel),
      positioning,
      rationale,
      sellingPoints,
      subheadline: normalizeCopyText(record.subheadline) || undefined,
    });

    if (candidates.length === 12) {
      break;
    }
  }

  return candidates;
}

async function generateCandidateBatch(input: {
  analysis: ProductMarketingAnalysis;
  context: GenerationContext;
  factSummary: ProductCopyFactSummary;
  modelConfig: PromptModelConfig;
  repair?: {
    acceptedCount: number;
    rejected: RejectedImageCopyCandidate[];
  };
}) {
  const content = await promptProviderFactory.generate({
    messages: buildImageCopyModelMessages(input),
    modelConfig: input.modelConfig,
  });

  return parseImageCopyModelContent(content);
}

function candidateId(config: PromptModelConfig, index: number) {
  const normalizedModel = config.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return `image-copy-${normalizedModel || "model"}-${index + 1}-${Date.now()}`;
}

export async function generateWorkspaceImageCopyCandidates(input: {
  generationContext: GenerationContext;
  marketingPositioningOverride?: string;
  promptModel: string;
}): Promise<ImageCopyGenerationResult> {
  const policy = getVisibleCopyPolicy(input.generationContext.visualRule);

  if (!policy.allowed) {
    throw new Error(policy.reason);
  }

  const modelConfig =
    (await getPromptModelConfigAsync(input.promptModel)) ??
    buildDisabledModelConfig(input.promptModel);

  if (!promptProviderFactory.isConfigured()) {
    throw new Error("当前未配置可用的 Prompt Model API，无法生成主图文案。");
  }

  if (!modelConfig.apiModel) {
    throw new Error("当前 Prompt Model 未配置实际模型名称。");
  }

  if (!modelConfig.enabled) {
    throw new Error(modelConfig.disabledReason || "当前 Prompt Model 暂不可用。");
  }

  const factSummary = buildProductCopyFactSummary(
    input.generationContext.productFacts,
  );
  const baseAnalysis = await analyzeProductMarketing({
    context: input.generationContext,
    modelConfig,
  });
  const positioningOverride = input.marketingPositioningOverride?.trim();
  const analysis: ProductMarketingAnalysis = positioningOverride
    ? {
        ...baseAnalysis,
        marketPositioning: Array.from(positioningOverride)
          .slice(0, 100)
          .join(""),
        userAdjusted: true,
      }
    : baseAnalysis;
  const firstBatch = await generateCandidateBatch({
    analysis,
    context: input.generationContext,
    factSummary,
    modelConfig,
  });
  let ranked = rankImageCopyCandidates({
    analysis,
    candidates: firstBatch,
    summary: factSummary,
  });
  let allCandidates = firstBatch;

  if (ranked.accepted.length < 3) {
    const repairBatch = await generateCandidateBatch({
      analysis,
      context: input.generationContext,
      factSummary,
      modelConfig,
      repair: {
        acceptedCount: ranked.accepted.length,
        rejected: ranked.rejected,
      },
    });

    allCandidates = [...firstBatch, ...repairBatch];
    ranked = rankImageCopyCandidates({
      analysis,
      candidates: allCandidates,
      summary: factSummary,
    });
  }

  if (ranked.accepted.length < 3) {
    const reasons = uniqueStrings(
      ranked.rejected.flatMap((item) => item.reasons),
      5,
    ).join("；");

    throw new Error(
      `Prompt Model 未返回 3 条通过质量检查的主图文案候选${reasons ? `：${reasons}` : "。"}`,
    );
  }

  const layout = buildImageCopyLayoutSuggestion(input.generationContext);
  const generatedTime = new Date().toISOString();
  const candidates = ranked.accepted.map(
    (quality, index): ImageCopyCandidate => ({
      ...quality.candidate,
      generatedTime,
      id: candidateId(modelConfig, index),
      model: modelConfig.id,
      modelLabel: modelConfig.label,
      placementHint: layout.placementHint,
      qualityScore: quality.qualityScore,
      source: "model",
      styleHint: layout.styleHint,
      warnings:
        quality.warnings.length > 0 ? quality.warnings : undefined,
    }),
  );

  return {
    analysis,
    candidates,
  };
}

export function validateImageCopyCandidateForTesting(input: {
  analysis: ProductMarketingAnalysis;
  candidate: RawImageCopyCandidate;
  context: GenerationContext;
}) {
  return evaluateImageCopyCandidate({
    analysis: input.analysis,
    candidate: input.candidate,
    summary: buildProductCopyFactSummary(input.context.productFacts),
  });
}
