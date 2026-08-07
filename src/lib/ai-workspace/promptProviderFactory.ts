import { aiConfig } from "@/lib/aiConfig";
import {
  hasPromptProviderConfig,
  type PromptModelConfig,
} from "@/lib/ai-workspace/promptModelConfig";

export type PromptChatMessage = {
  role: "system" | "user";
  content: string;
};

export type PromptProviderInput = {
  messages: PromptChatMessage[];
  modelConfig: PromptModelConfig;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function buildChatCompletionUrl() {
  if (aiConfig.provider === "openai") {
    return "https://api.openai.com/v1/chat/completions";
  }

  if (aiConfig.provider === "dmxapi" || aiConfig.provider === "custom") {
    return `${aiConfig.baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;
  }

  return "";
}

function readApiKey() {
  if (aiConfig.provider === "openai") {
    return aiConfig.openaiApiKey;
  }

  if (aiConfig.provider === "dmxapi" || aiConfig.provider === "custom") {
    return aiConfig.apiKey;
  }

  return "";
}

async function readPromptProviderError(response: Response) {
  const text = await response.text();
  const normalizedText = text.toLowerCase();

  if (
    normalizedText.includes("model_not_found") ||
    normalizedText.includes("no available channel")
  ) {
    return "当前 Prompt Model 未开通或暂无可用通道，请更换模型或检查 DMXAPI 分组配置。";
  }

  return `Prompt Model 调用失败：HTTP ${response.status}`;
}

export const promptProviderFactory = {
  isConfigured() {
    return hasPromptProviderConfig();
  },

  async generate(input: PromptProviderInput) {
    const apiKey = readApiKey();
    const url = buildChatCompletionUrl();
    const config = input.modelConfig;

    if (!apiKey || !url) {
      throw new Error("Prompt Model provider is not configured.");
    }

    if (!config.apiModel) {
      throw new Error("当前 Prompt Model 未配置实际模型名称，请检查 promptModelConfig。");
    }

    if (!config.enabled) {
      throw new Error(config.disabledReason || "当前 Prompt Model 暂不可用。");
    }

    console.info(`[ai-workspace-prompt] Calling Prompt Model apiModel=${config.apiModel}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: input.messages,
        model: config.apiModel,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(await readPromptProviderError(response));
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Prompt Model 返回为空。");
    }

    return content;
  },
};
