import {
  getPromptModelConfigAsync,
  type PromptModelConfig,
} from "@/lib/ai-workspace/promptModelConfig";
import { promptProviderFactory } from "@/lib/ai-workspace/promptProviderFactory";
import type { DesignIntentCandidate } from "@/lib/ai-workspace/types";

export type DesignIntentGenerationContext = {
  productName?: string;
  category?: string;
  platform?: string;
  imageType?: string;
  theme?: string;
  designObjective?: string;
};

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

function trimText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCandidateText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[。]+$/g, "")
    .trim();
}

function parseDesignIntentCandidates(content: string) {
  const jsonText = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;
    const rawCandidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];

    return rawCandidates
      .map((candidate) => {
        if (!candidate || typeof candidate !== "object") {
          return null;
        }

        const item = candidate as Record<string, unknown>;
        const title = trimText(item.title);
        const contentText = normalizeCandidateText(trimText(item.content));
        const rationale = trimText(item.rationale);

        if (!title || !contentText) {
          return null;
        }

        return {
          content: contentText.endsWith("。") ? contentText : `${contentText}。`,
          rationale,
          title,
        };
      })
      .filter((candidate): candidate is { content: string; rationale: string; title: string } =>
        Boolean(candidate),
      );
  } catch {
    return [];
  }
}

function buildMessages(input: {
  context?: DesignIntentGenerationContext;
  sceneBrief: string;
}) {
  return [
    {
      role: "system" as const,
      content: [
        "你是资深电商视觉场景导演，负责把简短中文场景想法扩写成可直接用于产品主图生成的中文设计意图。",
        "只输出严格 JSON，不要输出 Markdown。",
        "返回 5 条候选，每条必须是具体场景描述，不是抽象风格词。",
        "每条 content 必须控制在 150 个中文字符以内。",
        "描述应包含主体位置、前景/背景、光线、环境细节和画面氛围。",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: JSON.stringify({
        context: input.context ?? {},
        outputContract: {
          candidates:
            "数组，必须正好 5 条；每条包含 title、content、rationale；content 为中文完整场景设计意图。",
          jsonShape:
            '{"candidates":[{"title":"候选标题","content":"具体中文场景设计意图","rationale":"为什么适合该商品图"}]}',
        },
        sceneBrief: input.sceneBrief,
        task: "请基于 sceneBrief 生成 5 条不同角度但都商品优先的中文设计意图候选。",
      }),
    },
  ];
}

export async function generateWorkspaceDesignIntentCandidates(input: {
  context?: DesignIntentGenerationContext;
  promptModel: string;
  sceneBrief: string;
}): Promise<DesignIntentCandidate[]> {
  const sceneBrief = input.sceneBrief.trim();

  if (!sceneBrief) {
    throw new Error("请先输入场景提示词。");
  }

  const modelConfig =
    (await getPromptModelConfigAsync(input.promptModel)) ??
    buildDisabledModelConfig(input.promptModel);

  if (!promptProviderFactory.isConfigured()) {
    throw new Error("当前未配置可用的 Prompt Model API，无法生成设计意图。");
  }

  if (!modelConfig.apiModel) {
    throw new Error("当前 Prompt Model 未配置实际模型名称。");
  }

  if (!modelConfig.enabled) {
    throw new Error(modelConfig.disabledReason || "当前 Prompt Model 暂不可用。");
  }

  const content = await promptProviderFactory.generate({
    messages: buildMessages({
      context: input.context,
      sceneBrief,
    }),
    modelConfig,
  });
  const parsedCandidates = parseDesignIntentCandidates(content).slice(0, 5);

  if (parsedCandidates.length !== 5) {
    throw new Error("Prompt Model 未返回 5 条格式完整的设计意图候选。");
  }

  const generatedTime = new Date().toISOString();
  const idPrefix = modelConfig.id.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return parsedCandidates.map((candidate, index) => ({
    ...candidate,
    generatedTime,
    id: `design-intent-${idPrefix}-${index + 1}-${Date.now()}`,
    model: modelConfig.id,
    modelLabel: modelConfig.label,
    source: "model",
  }));
}
