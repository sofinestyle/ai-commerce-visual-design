import {
  buildStructuredWorkspacePrompt,
  buildWorkspacePrompt,
  formatStructuredPrompt,
} from "@/lib/ai-workspace/promptBuilder";
import {
  summarizePromptValidationFailure,
  validateWorkspacePrompt,
} from "@/lib/ai-workspace/promptSemanticValidator";
import {
  defaultPromptModel,
  getDefaultPromptModelConfig,
  getPromptModelConfigAsync,
  type PromptModelConfig,
} from "@/lib/ai-workspace/promptModelConfig";
import { promptProviderFactory } from "@/lib/ai-workspace/promptProviderFactory";
import type { GenerationContext, PromptResult } from "@/lib/ai-workspace/types";

export type WorkspacePromptCandidate = PromptResult & {
  apiModel: string;
  generatedTime: string;
  id: string;
  promptModel: string;
  promptModelLabel: string;
  source: "fallback" | "model";
  fallbackReason?: string;
};

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildReferenceSummary(context: GenerationContext) {
  if (context.referenceImages.length === 0) {
    return "No reference images selected.";
  }

  return context.referenceImages.map((image, index) => ({
    id: image.id,
    index: index + 1,
    source: image.url.startsWith("data:image")
      ? "data-url"
      : image.url.startsWith("http")
        ? "remote-url"
        : "local-public",
    type: image.type || "reference",
  }));
}

function buildPromptModelMessages(context: GenerationContext) {
  const structuredPrompt = buildStructuredWorkspacePrompt(context);

  return [
    {
      role: "system" as const,
      content: [
        "You are a senior ecommerce visual prompt director.",
        "Generate focused image prompts from a pre-resolved structured prompt plan.",
        "Return strict JSON only with chinesePromptSummary and englishPrompt.",
        "The englishPrompt must use exactly these five section headings: Task, Product Accuracy, Effective Scene Direction, Visible Copy, Compliance Constraints.",
        "Do not include raw platform labels, image type labels, Visual SOP Rule ID, SKU, imageCount, reference image URLs, or database field dumps unless they are explicitly present in the provided section text.",
        "Translate non-visible Chinese product facts, material descriptions, and scene directions into natural English in englishPrompt while preserving their factual meaning.",
        "Only approved visible copy text must remain exactly as provided; do not translate, paraphrase, or correct approved visible copy.",
        "When visible copy is enabled, preserve explicit layout constraints: compact text block no more than 20-25% of canvas, product remains visually dominant, headline/subheadline/bullet hierarchy, no more than 3 selling-point bullet lines, and logo no wider than about 18-22% of canvas width.",
        "For English englishPrompt output, no Chinese/Japanese/Korean characters may remain unless they are part of approved visible copy.",
        "Do not invent product facts. Do not weaken or remove product accuracy, reference image, visible copy, or single-output constraints.",
        "Keep the prompt concise, non-repetitive, and production-ready for an image generation model.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        task: "Rewrite the structured prompt plan into a concise Chinese summary and a polished English image-generation prompt.",
        structuredPromptPlan: structuredPrompt,
        referenceImageSummary: buildReferenceSummary(context),
        outputContract: {
          chinesePromptSummary:
            "中文，简要说明单图任务、商品准确性、场景方向、文案状态和核心约束。",
          englishPrompt:
            "English prompt using exactly five sections: Task, Product Accuracy, Effective Scene Direction, Visible Copy, Compliance Constraints. Translate all non-visible source facts and scene instructions into natural English. Do not append a separate Workspace Context section. Do not leave Chinese characters in the English prompt unless they are approved visible copy.",
        },
      }),
    },
  ];
}

function candidateId(config: PromptModelConfig, index: number) {
  const normalizedModel = config.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return `prompt-${normalizedModel || "model"}-${index + 1}-${Date.now()}`;
}

function buildFallbackCandidate(input: {
  context: GenerationContext;
  fallbackReason: string;
  index: number;
  modelConfig: PromptModelConfig;
}): WorkspacePromptCandidate {
  const fallbackPrompt = buildWorkspacePrompt(input.context);
  const promptValidation = validateWorkspacePrompt(
    fallbackPrompt.englishPrompt,
    input.context,
  );

  return {
    ...fallbackPrompt,
    apiModel: input.modelConfig.apiModel,
    fallbackReason: input.fallbackReason,
    generatedTime: new Date().toISOString(),
    id: candidateId(input.modelConfig, input.index),
    promptModel: input.modelConfig.id,
    promptModelLabel: input.modelConfig.label,
    promptValidation,
    source: "fallback",
  };
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

function hasStructuredPromptHeadings(prompt: string) {
  return [
    "Task:",
    "Product Accuracy:",
    "Effective Scene Direction:",
    "Visible Copy:",
    "Compliance Constraints:",
  ].every((heading) => prompt.includes(heading));
}

function normalizePromptModelOutput(
  prompt: Pick<PromptResult, "chinesePromptSummary" | "englishPrompt">,
  context: GenerationContext,
) {
  if (hasStructuredPromptHeadings(prompt.englishPrompt)) {
    return prompt;
  }

  return {
    chinesePromptSummary:
      prompt.chinesePromptSummary ||
      "Prompt Model 未返回完整五段结构，已使用本地结构化 Prompt 作为安全兜底。",
    englishPrompt: formatStructuredPrompt(buildStructuredWorkspacePrompt(context)),
  };
}

function buildPromptRepairMessages(input: {
  context: GenerationContext;
  originalPrompt: Pick<PromptResult, "chinesePromptSummary" | "englishPrompt">;
  validationSummary: string;
}) {
  const structuredPrompt = buildStructuredWorkspacePrompt(input.context);

  return [
    {
      role: "system" as const,
      content: [
        "You are repairing an ecommerce image-generation prompt.",
        "Return strict JSON only with chinesePromptSummary and englishPrompt.",
        "The repaired englishPrompt must use exactly five sections: Task, Product Accuracy, Effective Scene Direction, Visible Copy, Compliance Constraints.",
        "Fix every listed validation issue without inventing product facts.",
        "Preserve approved visible copy exactly and preserve all reference image role statements.",
        "When visible copy is enabled, preserve the layout constraints for text area, product priority, typography hierarchy, bullet count, and logo size.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        originalPrompt: input.originalPrompt,
        requiredStructuredPromptPlan: structuredPrompt,
        validationIssues: input.validationSummary,
      }),
    },
  ];
}

async function repairPromptModelOutput(input: {
  context: GenerationContext;
  modelConfig: PromptModelConfig;
  parsedPrompt: Pick<PromptResult, "chinesePromptSummary" | "englishPrompt">;
  validationSummary: string;
}) {
  const content = await promptProviderFactory.generate({
    messages: buildPromptRepairMessages({
      context: input.context,
      originalPrompt: input.parsedPrompt,
      validationSummary: input.validationSummary,
    }),
    modelConfig: input.modelConfig,
  });

  return parsePromptModelContent(content);
}

function parsePromptModelContent(content: string) {
  const jsonText = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const chinesePromptSummary = trimText(parsed.chinesePromptSummary);
    const englishPrompt = trimText(parsed.englishPrompt);

    if (!chinesePromptSummary || !englishPrompt) {
      return null;
    }

    return {
      chinesePromptSummary,
      englishPrompt,
    };
  } catch {
    const chineseMatch = content.match(/chinesePromptSummary["：:\s]+([\s\S]*?)englishPrompt/i);
    const englishMatch = content.match(/englishPrompt["：:\s]+([\s\S]*)/i);

    if (!englishMatch) {
      return null;
    }

    return {
      chinesePromptSummary:
        chineseMatch?.[1]?.replace(/["{}:,]/g, "").trim() ||
        "当前 Prompt Model 返回非标准 JSON，已提取英文 Prompt。",
      englishPrompt: englishMatch[1].replace(/["{}]/g, "").trim(),
    };
  }
}

export async function generateWorkspacePromptCandidates(input: {
  generationContext: GenerationContext;
  promptModels?: string[];
}) {
  const requestedModels = (input.promptModels?.length
    ? input.promptModels
    : [defaultPromptModel])
    .map((model) => model.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (requestedModels.length === 0) {
    throw new Error("promptModels 至少需要 1 个模型。");
  }

  return Promise.all(
    requestedModels.map(async (promptModelId, index): Promise<WorkspacePromptCandidate> => {
      const modelConfig =
        (await getPromptModelConfigAsync(promptModelId)) ??
        (promptModelId ? buildDisabledModelConfig(promptModelId) : getDefaultPromptModelConfig());

      if (!promptProviderFactory.isConfigured()) {
        return buildFallbackCandidate({
          context: input.generationContext,
          fallbackReason: "当前使用本地 Prompt Builder 作为备用方案：Prompt Model API 未配置。",
          index,
          modelConfig,
        });
      }

      try {
        if (!modelConfig.apiModel) {
          throw new Error("当前 Prompt Model 未配置实际模型名称，请检查 promptModelConfig。");
        }

        if (!modelConfig.enabled) {
          throw new Error(modelConfig.disabledReason || "当前 Prompt Model 暂不可用。");
        }

        const content = await promptProviderFactory.generate({
          messages: buildPromptModelMessages(input.generationContext),
          modelConfig,
        });
        const parsedPrompt = parsePromptModelContent(content);

        if (!parsedPrompt) {
          return buildFallbackCandidate({
            context: input.generationContext,
            fallbackReason:
              "当前使用本地 Prompt Builder 作为备用方案：Prompt Model 返回格式无法解析。",
            index,
            modelConfig,
          });
        }

        let finalPrompt = normalizePromptModelOutput(
          parsedPrompt,
          input.generationContext,
        );
        let promptValidation = validateWorkspacePrompt(
          finalPrompt.englishPrompt,
          input.generationContext,
        );
        let fallbackReason: string | undefined;

        if (!promptValidation.valid) {
          const validationSummary = summarizePromptValidationFailure(promptValidation);
          const repairedPrompt = await repairPromptModelOutput({
            context: input.generationContext,
            modelConfig,
            parsedPrompt: finalPrompt,
            validationSummary,
          }).catch(() => null);

          if (repairedPrompt) {
            finalPrompt = normalizePromptModelOutput(repairedPrompt, input.generationContext);
            promptValidation = validateWorkspacePrompt(
              finalPrompt.englishPrompt,
              input.generationContext,
            );
          }

          if (!promptValidation.valid) {
            return buildFallbackCandidate({
              context: input.generationContext,
              fallbackReason: `当前使用本地 Prompt Builder 作为备用方案：Prompt Model 输出未通过语义校验。${summarizePromptValidationFailure(promptValidation)}`,
              index,
              modelConfig,
            });
          }

          fallbackReason = `Prompt Model 首次输出未通过语义校验，已自动修复一次：${validationSummary}`;
        }

        return {
          ...finalPrompt,
          apiModel: modelConfig.apiModel,
          fallbackReason,
          generatedTime: new Date().toISOString(),
          id: candidateId(modelConfig, index),
          promptModel: modelConfig.id,
          promptModelLabel: modelConfig.label,
          promptValidation,
          source: "model",
        };
      } catch (error) {
        return buildFallbackCandidate({
          context: input.generationContext,
          fallbackReason:
            error instanceof Error
              ? `当前使用本地 Prompt Builder 作为备用方案：${error.message}`
              : "当前使用本地 Prompt Builder 作为备用方案：Prompt Model 调用失败。",
          index,
          modelConfig,
        });
      }
    }),
  );
}
